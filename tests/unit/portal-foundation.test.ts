// Tests de fundación B7 Portal Cliente (T01+T02+T03 de spec_id 16).
//
// Cubre:
//   - T01 Schema: 4 tablas nuevas (portal_session, portal_activity, portal_message, milestone)
//     + extensión de proyecto (cliente_id, portal_visible)
//   - T02 portal-auth: createPortalAuth factory + getPortalUserId helper + cookie prefix
//     separado del admin/auth
//   - T03 middleware: route guard /portal/* con bypass /admin/* (i18n intacto)
//
// Patrón: la migración SQL 0002_portal.sql se aplica directamente sobre un fakeD1
// (no se mete al MIGRATION_SQL compartido) para mantener el contrato "8 tablas"
// del db-schema.test original — igual que admin-foundation.test.ts hace con 0003.

import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { eq, sql } from 'drizzle-orm';
import { fakeD1, applyMigrations } from '../helpers/d1-fake';
import { createDb, schema } from '~/db';
import { createPortalAuth, getPortalUserId, type PortalEnv } from '~/lib/portal-auth';
import { portalGuard } from '~/lib/portal-guard';

const MIGRATION_PATH = resolve(process.cwd(), 'migrations/0002_portal.sql');

// Aplica migraciones base (8 tablas) + 0002 portal. La FK a user/proyecto exige
// que las tablas base estén presentes antes.
async function applyAllMigrations() {
  const d1 = fakeD1();
  await applyMigrations(d1);
  await d1.exec(readFileSync(MIGRATION_PATH, 'utf8'));
  return d1;
}

async function seedBaseData(db: ReturnType<typeof createDb>) {
  const userId = 'user-portal-test';
  const proyectoId = 'proyecto-portal-test';
  await db.insert(schema.user).values({
    id: userId,
    name: 'Portal Test',
    email: 'portal@example.com',
    role: 'cliente',
  });
  await db.insert(schema.proyecto).values({
    id: proyectoId,
    slug: 'portal-test',
    code: 'PT',
    name: 'Portal Test',
    tagline: 'tag',
    descripcion: 'desc',
    categoria: 'Web',
    stack: '[]',
    year: 2026,
    status: 'activo',
    destacado: false,
  });
  return { userId, proyectoId };
}

// ─── T01 · Schema SQL ────────────────────────────────────────────────────

describe('Portal · schema SQL (migrations/0002_portal.sql)', () => {
  it('(1) portal_session tiene los 8 campos del esquema (id, user_id, token, ip, user_agent, expires_at, created_at, updated_at)', async () => {
    const d1 = await applyAllMigrations();
    const db = createDb(d1);
    await seedBaseData(db);

    const id = 'psess-1';
    const token = 'tok-psess-1';
    const now = Date.now();
    await db.insert(schema.portalSession).values({
      id,
      userId: 'user-portal-test',
      token,
      ipAddress: '127.0.0.1',
      userAgent: 'vitest/1.0',
      expiresAt: new Date(now + 86_400_000),
      createdAt: new Date(now),
      updatedAt: new Date(now),
    });

    const rows = await db.select().from(schema.portalSession).where(eq(schema.portalSession.id, id));
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe(id);
    expect(rows[0].userId).toBe('user-portal-test');
    expect(rows[0].token).toBe(token);
    expect(rows[0].ipAddress).toBe('127.0.0.1');
    expect(rows[0].userAgent).toBe('vitest/1.0');
    expect(rows[0].expiresAt).toBeInstanceOf(Date);
    expect(rows[0].createdAt).toBeInstanceOf(Date);
    expect(rows[0].updatedAt).toBeInstanceOf(Date);
  });

  it('(2) portal_activity tiene FK a user', async () => {
    const d1 = await applyAllMigrations();
    const db = createDb(d1);

    // Sin user → debe fallar (FK violation)
    await expect(
      db.insert(schema.portalActivity).values({
        id: 'act-fk-1',
        userId: 'no-existe-user',
        action: 'view',
        entityType: 'proyecto',
        entityId: 'p1',
        createdAt: new Date(),
      })
    ).rejects.toThrow();

    // Con user creado → debe pasar
    await db.insert(schema.user).values({
      id: 'user-act',
      name: 'A',
      email: 'a@x.com',
      role: 'cliente',
    });
    await expect(
      db.insert(schema.portalActivity).values({
        id: 'act-fk-2',
        userId: 'user-act',
        action: 'login',
        entityType: 'user',
        createdAt: new Date(),
      })
    ).resolves.not.toThrow();
  });

  it('(3) portal_message tiene CHECK constraint en direction (inbound|outbound)', async () => {
    const d1 = await applyAllMigrations();
    const db = createDb(d1);
    await db.insert(schema.user).values({
      id: 'user-msg',
      name: 'M',
      email: 'm@x.com',
      role: 'cliente',
    });

    // Valor inválido debe fallar (CHECK violation propagada por better-sqlite3)
    await expect(
      db.insert(schema.portalMessage).values({
        id: 'msg-bad',
        userId: 'user-msg',
        direction: 'sideways' as 'inbound',
        body: 'hola',
        createdAt: new Date(),
      })
    ).rejects.toMatchObject({ cause: expect.objectContaining({ message: expect.stringMatching(/CHECK|constraint/i) }) });

    // Valores válidos pasan
    await expect(
      db.insert(schema.portalMessage).values({
        id: 'msg-in',
        userId: 'user-msg',
        direction: 'inbound',
        body: 'hola cliente',
        createdAt: new Date(),
      })
    ).resolves.not.toThrow();
    await expect(
      db.insert(schema.portalMessage).values({
        id: 'msg-out',
        userId: 'user-msg',
        direction: 'outbound',
        body: 'hola operador',
        createdAt: new Date(),
      })
    ).resolves.not.toThrow();
  });

  it('(4) milestone tiene FK a proyecto y CHECK en status', async () => {
    const d1 = await applyAllMigrations();
    const db = createDb(d1);

    // FK violation sin proyecto
    await expect(
      db.insert(schema.milestone).values({
        id: 'ms-bad',
        proyectoId: 'no-existe',
        title: 'M1',
        status: 'pending',
        createdAt: new Date(),
      })
    ).rejects.toThrow();

    // CHECK violation con status inválido
    const proyectoId = 'proyecto-ms';
    await db.insert(schema.proyecto).values({
      id: proyectoId,
      slug: 'milestone-test',
      code: 'MS',
      name: 'MS',
      tagline: 't',
      descripcion: 'd',
      categoria: 'Web',
      stack: '[]',
      year: 2026,
      status: 'activo',
      destacado: false,
    });

    await expect(
      db.insert(schema.milestone).values({
        id: 'ms-bad-status',
        proyectoId,
        title: 'M1',
        status: 'inventado' as 'pending',
        createdAt: new Date(),
      })
    ).rejects.toMatchObject({ cause: expect.objectContaining({ message: expect.stringMatching(/CHECK|constraint/i) }) });

    // Status válido
    await expect(
      db.insert(schema.milestone).values({
        id: 'ms-ok',
        proyectoId,
        title: 'M1',
        status: 'in_progress',
        createdAt: new Date(),
      })
    ).resolves.not.toThrow();
  });

  it('(5) proyecto tiene columnas nuevas cliente_id y portal_visible (default 0)', async () => {
    const d1 = await applyAllMigrations();
    const db = createDb(d1);

    const id = 'proy-cliente';
    await db.insert(schema.proyecto).values({
      id,
      slug: 'cliente-test',
      code: 'CT',
      name: 'Cliente Test',
      tagline: 't',
      descripcion: 'd',
      categoria: 'Web',
      stack: '[]',
      year: 2026,
      status: 'activo',
      destacado: false,
    });

    const rows = await db.select().from(schema.proyecto).where(eq(schema.proyecto.id, id));
    expect(rows).toHaveLength(1);
    expect(rows[0].clienteId).toBeNull();
    expect(rows[0].portalVisible).toBe(false);

    // Setear con un user real verifica la FK
    await db.insert(schema.user).values({
      id: 'user-cli',
      name: 'C',
      email: 'c@x.com',
      role: 'cliente',
    });
    await db.update(schema.proyecto)
      .set({ clienteId: 'user-cli', portalVisible: true })
      .where(eq(schema.proyecto.id, id));

    const updated = await db.select().from(schema.proyecto).where(eq(schema.proyecto.id, id));
    expect(updated[0].clienteId).toBe('user-cli');
    expect(updated[0].portalVisible).toBe(true);
  });
});

// ─── T02 · Portal auth factory ───────────────────────────────────────────

describe('Portal · auth factory', () => {
  function buildEnv(DB: D1Database, extra: Partial<{ BETTER_AUTH_URL: string; RESEND_API_KEY: string; BETTER_AUTH_SECRET: string }> = {}) {
    return {
      DB,
      BETTER_AUTH_URL: extra.BETTER_AUTH_URL ?? 'http://127.0.0.1:4321',
      BETTER_AUTH_SECRET: extra.BETTER_AUTH_SECRET ?? 'test-secret-must-be-32-chars-or-more-for-real-use-xxx',
      ...extra,
    };
  }

  it('(6) getPortalUserId con sesión inexistente retorna null', async () => {
    const d1 = await applyAllMigrations();
    const env = buildEnv(d1);
    const request = new Request('http://127.0.0.1:4321/portal/', {
      headers: { cookie: 'nx-studio-portal-session_token=invalid-token' },
    });
    const userId = await getPortalUserId(request, env);
    expect(userId).toBeNull();
  });

  it('(7) getPortalUserId con sesión válida retorna user.id', async () => {
    const d1 = await applyAllMigrations();
    const db = createDb(d1);
    const env = buildEnv(d1);

    // Crear user via createPortalAuth para que el adapter use portal_session
    const auth = createPortalAuth(env);
    const signUp = await auth.api.signUpEmail({
      body: { email: 'cliente@b7.com', password: 'passw0rd-portal', name: 'Cliente B7' },
      asResponse: false,
    });
    // Extract session token via a sign-in (cookieCache disabled in our factory above)
    const signIn = await auth.api.signInEmail({
      body: { email: 'cliente@b7.com', password: 'passw0rd-portal' },
      asResponse: true,
    });
    expect(signIn.status).toBe(200);
    const setCookie = signIn.headers.get('set-cookie') ?? '';
    expect(setCookie).toMatch(/nx-studio-portal-/);

    // Reconstruir un request con esa cookie
    const cookieLine = setCookie.split(';')[0]; // "nx-studio-portal-session_token=eyJ..."
    const request = new Request('http://127.0.0.1:4321/portal/', {
      headers: { cookie: cookieLine },
    });
    const userId = await getPortalUserId(request, env);
    expect(userId).toBeTypeOf('string');
    expect(userId).not.toBeNull();

    // El user existe en DB
    const users = await db.select().from(schema.user).where(eq(schema.user.email, 'cliente@b7.com'));
    expect(users).toHaveLength(1);
    expect(userId).toBe(users[0].id);
  });

  it('(8) createPortalAuth retorna objeto con métodos api y handler', async () => {
    const d1 = await applyAllMigrations();
    const auth = createPortalAuth(buildEnv(d1));
    expect(auth).toBeDefined();
    expect(typeof auth.api).toBe('object');
    expect(typeof auth.api.signInEmail).toBe('function');
    expect(typeof auth.api.signUpEmail).toBe('function');
    expect(typeof auth.api.getSession).toBe('function');
    expect(typeof auth.handler).toBe('function');
  });

  it('(9) Cookie prefix del portal es "nx-studio-portal-" (separado de admin/auth)', async () => {
    // Este test verifica el contrato sin tocar DB — basta con instanciar
    const d1 = await applyAllMigrations();
    // Inspeccionamos el internal options del better-auth retornado
    const auth = createPortalAuth(buildEnv(d1));
    // better-auth expone options en `auth.options` (estable en 1.x)
    const options = (auth as unknown as { options: { advanced?: { cookiePrefix?: string } } }).options;
    expect(options.advanced?.cookiePrefix).toBe('nx-studio-portal-');
  });
});

// ─── T03 · Middleware portal guard ───────────────────────────────────────

describe('Portal · middleware guard', () => {
  // Helper: simula el outer wrapper que Astro middleware aplicaría sobre
  // portalGuard (redirect → Response 302; next → llama a next() y setea locals).
  // El middleware real está en src/middleware.ts — este shim nos permite
  // testear la lógica de auth sin requerir el módulo virtual `astro:middleware`.
  async function runMiddleware(
    pathname: string,
    cookie: string | undefined,
    env: PortalEnv,
  ): Promise<{ status: number; location?: string; body: string; locals: Record<string, unknown> }> {
    const url = `http://127.0.0.1:4321${pathname}`;
    const headers = new Headers();
    if (cookie) headers.set('cookie', cookie);
    const request = new Request(url, { headers });
    const locals: Record<string, unknown> = {};
    const result = await portalGuard({ pathname, request, env });
    if (result.action === 'redirect') {
      return { status: 302, location: result.location, body: '', locals };
    }
    if (result.portalSession) {
      locals.portalSession = result.portalSession;
    }
    // next() simulado: el handler original responde con 200 y el body que mande
    return { status: 200, body: 'next-called', locals };
  }

  function buildPortalEnv(DB: D1Database): PortalEnv {
    return {
      DB,
      BETTER_AUTH_URL: 'http://127.0.0.1:4321',
      BETTER_AUTH_SECRET: 'test-secret-must-be-32-chars-or-more-for-real-use-xxx',
    };
  }

  let env: PortalEnv;
  let sessionCookie: string;
  beforeEach(async () => {
    const d1 = await applyAllMigrations();
    env = buildPortalEnv(d1);
    const auth = createPortalAuth(env);
    await auth.api.signUpEmail({
      body: { email: 'mw@example.com', password: 'passw0rd-portal', name: 'MW' },
      asResponse: false,
    });
    const signIn = await auth.api.signInEmail({
      body: { email: 'mw@example.com', password: 'passw0rd-portal' },
      asResponse: true,
    });
    const setCookie = signIn.headers.get('set-cookie') ?? '';
    sessionCookie = setCookie.split(';')[0];
  });

  it('(10) /portal redirige a /portal/login si no hay sesión', async () => {
    const result = await runMiddleware('/portal/index', '', env);
    expect(result.status).toBe(302);
    expect(result.location).toBe('/portal/login?from=%2Fportal%2Findex');
    expect(result.body).toBe('');
    expect(result.locals.portalSession).toBeUndefined();
  });

  it('(11) /portal/login deja pasar sin sesión (público)', async () => {
    const result = await runMiddleware('/portal/login', '', env);
    expect(result.status).toBe(200);
    expect(result.body).toBe('next-called');
    expect(result.locals.portalSession).toBeUndefined();
  });

  it('(12) /portal/index deja pasar tras sesión válida y popula locals.portalSession', async () => {
    const result = await runMiddleware('/portal/index', sessionCookie, env);
    expect(result.status).toBe(200);
    expect(result.body).toBe('next-called');
    const ps = result.locals.portalSession as { user: { id: string } } | undefined;
    expect(ps).toBeDefined();
    expect(typeof ps?.user?.id).toBe('string');
  });

  it('(13) /admin/* NO se ve afectado por el portal guard (i18n intacto: no-redirect, sin locals.portalSession)', async () => {
    // portalGuard debe devolver { action: 'next' } para paths fuera de /portal/*
    // — el middleware real deja pasar el flujo i18n normal sin tocar admin.
    const url = 'http://127.0.0.1:4321/admin/dashboard';
    const request = new Request(url, { headers: { cookie: '' } });
    const result = await portalGuard({ pathname: '/admin/dashboard', request, env });
    expect(result.action).toBe('next');
    expect(result.portalSession).toBeUndefined();

    // Y un hit real a través del wrapper: next pasa sin redirect ni locals.portalSession
    const wrapped = await runMiddleware('/admin/dashboard', '', env);
    expect(wrapped.status).toBe(200);
    expect(wrapped.location).toBeUndefined();
    expect(wrapped.locals.portalSession).toBeUndefined();
  });
});
