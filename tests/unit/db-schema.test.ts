import { describe, it, expect } from 'vitest';
import { createTestEnv } from '../helpers/env';
import { fakeD1, applyMigrations } from '../helpers/d1-fake';
import { createDb, schema } from '~/db';
import { sql } from 'drizzle-orm';

describe('DB · schema y migraciones', () => {
  it('createDb devuelve una instancia Drizzle', () => {
    const d1 = fakeD1();
    const db = createDb(d1);
    expect(db).toBeDefined();
    expect(typeof db.select).toBe('function');
    expect(typeof db.insert).toBe('function');
    expect(typeof db.update).toBe('function');
  });

  it('applyMigrations crea las 8 tablas esperadas (4 auth + 4 business)', async () => {
    const d1 = fakeD1();
    await applyMigrations(d1);
    const db = createDb(d1);

    // Listar todas las tablas sqlite_master
    const tables = await db.all<{ name: string }>(sql`
      SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `);

    const tableNames = tables.map(t => t.name).sort();
    expect(tableNames).toEqual([
      'account',
      'compra',
      'licitacion',
      'proyecto',
      'session',
      'template',
      'user',
      'verification',
    ]);
  });

  it('applyMigrations es idempotente (segunda ejecución no falla)', async () => {
    const d1 = fakeD1();
    await applyMigrations(d1);
    await expect(applyMigrations(d1)).resolves.not.toThrow();
  });

  it('testEnv helper monta schema + DB + env completo', async () => {
    const { env, db } = await createTestEnv();

    expect(env.DB).toBeDefined();
    expect(env.BETTER_AUTH_SECRET).toMatch(/^test-secret-/);
    expect(env.BETTER_AUTH_URL).toBe('http://127.0.0.1:4321');
    expect(db).toBeDefined();

    // Verify user table is queryable
    const users = await db.select().from(schema.user);
    expect(users).toEqual([]);
  });
});
