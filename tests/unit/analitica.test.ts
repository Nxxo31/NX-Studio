import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fakeD1, applyMigrations } from '../helpers/d1-fake';
import { createDb } from '~/db';
import { sql } from 'drizzle-orm';
import { trackEvent, countByName, topSources, topPaths, countSince } from '~/server/analytics-repo';
import { subscribe, listAll, countActive } from '~/server/newsletter-repo';

const ROOT = join(fileURLToPath(new URL('../..', import.meta.url)));

/**
 * Ejecuta un archivo .sql de migraciones sentencia por sentencia.
 * Tolera unicamente "duplicate column name" (el fake ya trae las columnas
 * nuevas); cualquier otro error es un fallo real de la migracion.
 */
async function applyMigrationFile(d1: ReturnType<typeof fakeD1>, file: string): Promise<void> {
  const sqlText = readFileSync(join(ROOT, 'migrations', file), 'utf8');
  for (const stmt of sqlText.split(';')) {
    const clean = stmt.trim();
    if (!clean || clean.startsWith('--')) continue;
    try {
      await d1.exec(clean);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (!/duplicate column name/i.test(msg)) {
        throw new Error(`${file}: ${msg}\n---\n${clean.slice(0, 200)}`);
      }
    }
  }
}

async function dbWithSchema() {
  const d1 = fakeD1();
  await applyMigrations(d1);
  return createDb(d1);
}

describe('Migraciones v0.11.0 (SQL real, no la copia del fake)', () => {
  it('0004_analitica.sql y 0005_newsletter.sql se ejecutan sin error', async () => {
    const d1 = fakeD1();
    await applyMigrations(d1);
    await applyMigrationFile(d1, '0004_analitica.sql');
    await applyMigrationFile(d1, '0005_newsletter.sql');

    const db = createDb(d1);
    const tables = await db.all<{ name: string }>(sql`
      SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `);
    const names = tables.map((t) => t.name);
    expect(names).toContain('analytics_event');
    expect(names).toContain('newsletter_subscriber');

    const cols = await db.all<{ name: string }>(sql`PRAGMA table_info(licitacion)`);
    const colNames = cols.map((c) => c.name);
    for (const c of [
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_content',
      'utm_term',
      'referrer',
      'landing_path',
      'email_sent',
      'email_error',
    ]) {
      expect(colNames).toContain(c);
    }
  });
});

describe('Analitica de captacion (v0.11.0)', () => {
  it('trackEvent persiste el evento con su origen y props', async () => {
    const db = await dbWithSchema();
    await trackEvent(db, {
      name: 'lead_submitted',
      path: '/contacto/',
      locale: 'es',
      utmSource: 'linkedin',
      referrer: 'https://linkedin.com/feed',
      props: { tipo: 'webapp' },
    });

    const byName = await countByName(db, Date.now() - 60_000);
    expect(byName.find((b) => b.name === 'lead_submitted')?.count).toBe(1);

    const sources = await topSources(db, Date.now() - 60_000);
    expect(sources[0]).toEqual({ source: 'linkedin', count: 1 });
  });

  it('cuenta y agrupa por nombre, origen y ruta en la ventana', async () => {
    const db = await dbWithSchema();
    const now = Date.now();
    await trackEvent(db, { name: 'page_view', path: '/', utmSource: 'google' });
    await trackEvent(db, { name: 'page_view', path: '/', utmSource: 'google' });
    await trackEvent(db, { name: 'page_view', path: '/productos/' });
    await trackEvent(db, { name: 'page_view', path: '/productos/' });

    expect(await countSince(db, now - 60_000)).toBe(4);

    const paths = await topPaths(db, now - 60_000);
    expect(paths.find((p) => p.path === '/')?.count).toBe(2);

    const byName = await countByName(db, now - 60_000);
    expect(byName.find((b) => b.name === 'page_view')?.count).toBe(4);
  });

  it('los eventos fuera de la ventana no cuentan', async () => {
    const db = await dbWithSchema();
    await trackEvent(db, { name: 'page_view', path: '/' });
    expect(await countSince(db, Date.now() + 60_000)).toBe(0);
  });
});

describe('Newsletter (v0.11.0)', () => {
  it('suscribe guarda el email en minusculas', async () => {
    const db = await dbWithSchema();
    const row = await subscribe(db, { email: '  Sebas@Example.COM ', locale: 'es', source: 'home' });
    expect(row.email).toBe('sebas@example.com');
    expect(row.status).toBe('activo');
    expect(await countActive(db)).toBe(1);
  });

  it('es idempotente por email (no duplica)', async () => {
    const db = await dbWithSchema();
    const a = await subscribe(db, { email: 'a@b.com' });
    const b = await subscribe(db, { email: 'A@B.com' });
    expect(b.id).toBe(a.id);
    expect((await listAll(db)).length).toBe(1);
  });

  it('reactiva un suscriptor dado de baja', async () => {
    const db = await dbWithSchema();
    const first = await subscribe(db, { email: 'x@y.com' });
    await db.run(
      sql`UPDATE newsletter_subscriber SET status = 'baja' WHERE id = ${first.id}`
    );
    const again = await subscribe(db, { email: 'x@y.com' });
    expect(again.status).toBe('activo');
    expect(await countActive(db)).toBe(1);
  });
});
