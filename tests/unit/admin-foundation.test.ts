// Tests de fundación B8 Admin Panel (T01 + T03 + T11 de spec_id 17).
//
// Cubre:
//   - RBAC matrix + canRole() (T01)
//   - requireRole middleware (T01)
//   - Triggers inmutables de audit_log (T03)
//   - Deploy log round-trip (T11)
//
// Los triggers se prueban aplicando `migrations/0003_admin.sql` directamente
// a un fakeD1() — sin tocar el MIGRATION_SQL compartido de d1-fake.ts —
// para mantener el contrato de "8 tablas" del db-schema test original.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { eq } from 'drizzle-orm';
import { fakeD1, applyMigrations } from '../helpers/d1-fake';
import { createDb, schema } from '~/db';
import { canRole, requireRole, RBAC_MATRIX } from '~/lib/rbac';
import { recordDeploy, getRecentDeploys } from '~/lib/deploy-log';

const MIGRATION_PATH = resolve(process.cwd(), 'migrations/0003_admin.sql');

// Aplica las migraciones base (8 tablas negocio/auth) + la 0003 admin en una
// sola D1 fresca. Los triggers de inmutabilidad dependen del FK actor_user_id
// → user(id), así que la tabla user tiene que estar presente antes.
async function applyAllMigrations() {
  const d1 = fakeD1();
  await applyMigrations(d1);
  await d1.exec(readFileSync(MIGRATION_PATH, 'utf8'));
  return d1;
}

async function seedUser(db: ReturnType<typeof createDb>) {
  const id = 'user-test-1';
  await db.insert(schema.user).values({
    id,
    name: 'Test User',
    email: 'test@example.com',
    role: 'cliente',
  });
  return id;
}

// ─── RBAC matrix ────────────────────────────────────────────────────────

describe('RBAC · matrix', () => {
  it('RBAC_MATRIX tiene al menos 19 keys', () => {
    const keys = Object.keys(RBAC_MATRIX);
    expect(keys.length).toBeGreaterThanOrEqual(19);
  });

  it('canRole: admin puede eliminar licitacion', () => {
    expect(canRole('admin', 'licitacion.delete')).toBe(true);
  });

  it('canRole: designer NO puede eliminar licitacion', () => {
    expect(canRole('designer', 'licitacion.delete')).toBe(false);
  });

  it('canRole: dev NO puede leer audit_log', () => {
    expect(canRole('dev', 'audit_log.read')).toBe(false);
  });

  it('canRole: gatekeeper puede disparar deploy', () => {
    expect(canRole('gatekeeper', 'deploy.trigger')).toBe(true);
  });

  it('canRole: acción desconocida devuelve false (deny-by-default)', () => {
    expect(canRole('admin', 'inventado.inventado')).toBe(false);
  });
});

// ─── requireRole middleware ─────────────────────────────────────────────

describe('RBAC · requireRole', () => {
  function buildContext(role: string | undefined) {
    const locals: Record<string, unknown> = {};
    if (role !== undefined) {
      locals.portalSession = { user: { role } };
    } else {
      locals.portalSession = null;
    }
    return { locals };
  }

  it('requireRole devuelve 401 cuando no hay portalSession.user', async () => {
    const middleware = requireRole(['admin']);
    const ctx = buildContext(undefined);
    let nextCalled = false;
    const response = await middleware(ctx as never, async () => {
      nextCalled = true;
      return new Response('ok');
    });
    expect(nextCalled).toBe(false);
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe('unauthorized');
  });

  it('requireRole devuelve 403 cuando el rol no está en allowedRoles', async () => {
    const middleware = requireRole(['admin']);
    const ctx = buildContext('designer');
    let nextCalled = false;
    const response = await middleware(ctx as never, async () => {
      nextCalled = true;
      return new Response('ok');
    });
    expect(nextCalled).toBe(false);
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error).toBe('forbidden');
    expect(body.required).toEqual(['admin']);
    expect(body.actual).toBe('designer');
  });

  it('requireRole llama a next() cuando el rol está permitido', async () => {
    const middleware = requireRole(['admin', 'gatekeeper']);
    const ctx = buildContext('gatekeeper');
    let nextCalled = false;
    const response = await middleware(ctx as never, async () => {
      nextCalled = true;
      return new Response('passed-through');
    });
    expect(nextCalled).toBe(true);
    expect(response.status).toBe(200);
    const body = await response.text();
    expect(body).toBe('passed-through');
  });
});

// ─── audit_log triggers ─────────────────────────────────────────────────

describe('audit_log · triggers de inmutabilidad', () => {
  it('UPDATE sobre audit_log es rechazado por el trigger', async () => {
    const d1 = await applyAllMigrations();
    const db = createDb(d1);
    const userId = await seedUser(db);

    const auditId = 'audit-1';
    await db.insert(schema.auditLog).values({
      id: auditId,
      actorUserId: userId,
      action: 'licitacion.create',
      resourceType: 'licitacion',
      resourceId: 'lic-1',
      createdAt: new Date(),
    });

    await expect(
      db.update(schema.auditLog)
        .set({ action: 'tampered' })
        .where(eq(schema.auditLog.id, auditId))
    ).rejects.toMatchObject({ cause: expect.objectContaining({ message: expect.stringMatching(/immutable/i) }) });
  });

  it('DELETE sobre audit_log es rechazado por el trigger', async () => {
    const d1 = await applyAllMigrations();
    const db = createDb(d1);
    const userId = await seedUser(db);

    await db.insert(schema.auditLog).values({
      id: 'audit-2',
      actorUserId: userId,
      action: 'licitacion.create',
      resourceType: 'licitacion',
      resourceId: 'lic-2',
      createdAt: new Date(),
    });

    await expect(
      db.delete(schema.auditLog).where(eq(schema.auditLog.id, 'audit-2'))
    ).rejects.toMatchObject({ cause: expect.objectContaining({ message: expect.stringMatching(/immutable/i) }) });
  });
});

// ─── deploy log round-trip ──────────────────────────────────────────────

describe('deploy_log · round-trip', () => {
  it('recordDeploy inserta y getRecentDeploys devuelve ordenado por createdAt desc', async () => {
    const d1 = await applyAllMigrations();
    const env = { DB: d1 };

    const id1 = await recordDeploy(env, {
      versionId: 'v1.0.0',
      branch: 'main',
      environment: 'production',
      workerStartupMs: 42,
      status: 'success',
    });
    // Garantiza createdAt estrictamente mayor entre inserts
    await new Promise(r => setTimeout(r, 5));
    const id2 = await recordDeploy(env, {
      versionId: 'v1.1.0',
      branch: 'feat/b8-admin-foundation',
      environment: 'preview',
      workerStartupMs: 55,
      status: 'success',
    });
    expect(id1).not.toEqual(id2);

    const recent = await getRecentDeploys(env, 10);
    expect(recent.length).toBe(2);
    // El más reciente primero
    expect(recent[0].versionId).toBe('v1.1.0');
    expect(recent[1].versionId).toBe('v1.0.0');
    expect(recent[0].environment).toBe('preview');
    expect(recent[1].branch).toBe('main');
    expect(typeof recent[0].workerStartupMs).toBe('number');
  });
});