// Tests de la UI del Portal Cliente (B7 · T04-T10 + T11).
//
// Cubre:
//   - portal-repo: listLicitacionesByUser, groupLicitacionesByStatus,
//     listProyectosDelCliente, listRecentActivity, getLicitacionForUser,
//     getNextMilestoneForProject, getNextMilestonesByProjects,
//     getProyectoForUser, listMensajesByUser, markOutboundAsRead,
//     recordActivity, updateUserProfile.
//   - portal-profile-schema (Zod): valida, rechaza, edge cases.
//   - portal-notifications: buildPortalEmail (4 eventos), graceful degradation.
//   - handleProfileSubmit (API handler puro): rechaza sin user, valida, acepta.

import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { eq } from 'drizzle-orm';
import { fakeD1, applyMigrations } from '../helpers/d1-fake';
import { createDb, schema } from '~/db';
import {
  getLicitacionForUser,
  getNextMilestoneForProject,
  getNextMilestonesByProjects,
  getProyectoForUser,
  groupLicitacionesByStatus,
  listLicitacionesByUser,
  listMensajesByUser,
  listMilestonesByProject,
  listProyectosDelCliente,
  listRecentActivity,
  markOutboundAsRead,
  recordActivity,
  updateUserProfile,
} from '~/server/portal-repo';
import { ProfilePatchSchema } from '~/server/portal-profile-schema';
import { handleProfileSubmit } from '~/server/portal-profile-handler';
import {
  buildPortalEmail,
  sendPortalEmail,
} from '~/lib/portal-notifications';

const MIGRATION_PATH = resolve(process.cwd(), 'migrations/0002_portal.sql');

async function applyAllMigrations() {
  const d1 = fakeD1();
  await applyMigrations(d1);
  await d1.exec(readFileSync(MIGRATION_PATH, 'utf8'));
  return d1;
}

async function seedTwoUsers(db: ReturnType<typeof createDb>) {
  await db.insert(schema.user).values([
    { id: 'user-A', name: 'Alice Cliente', email: 'alice@example.com', role: 'cliente', empresa: 'Acme', telefono: '+57 1 234', pais: 'CO' },
    { id: 'user-B', name: 'Bob Cliente', email: 'bob@example.com', role: 'cliente', empresa: 'Globex', telefono: '+57 1 567', pais: 'CO' },
  ]);
}

async function seedProyectoConCliente(
  db: ReturnType<typeof createDb>,
  opts: { id: string; slug: string; clienteId: string; portalVisible: boolean }
) {
  await db.insert(schema.proyecto).values({
    id: opts.id,
    slug: opts.slug,
    code: opts.slug.slice(0, 3).toUpperCase(),
    name: `Proyecto ${opts.slug}`,
    tagline: 't',
    descripcion: 'd',
    categoria: 'Web',
    stack: '["Astro","React","D1"]',
    year: 2026,
    status: 'activo',
    destacado: false,
    clienteId: opts.clienteId,
    portalVisible: opts.portalVisible,
  });
}

// ─── T04 · portal-repo: dashboard queries ───────────────────────────────

describe('portalRepo · dashboard', () => {
  it('(1) listLicitacionesByUser devuelve SOLO las licitaciones del user.id', async () => {
    const d1 = await applyAllMigrations();
    const db = createDb(d1);
    await seedTwoUsers(db);

    await db.insert(schema.licitacion).values([
      { id: 'lic-1', nombre: 'A1', email: 'a@x.com', tipo: 'webapp', engagement: 'fixed', urgencia: 'normal', featuresJson: '[]', descripcion: 'd', precioMin: 100, precioMax: 200, banda: 'Starter', userId: 'user-A', createdAt: new Date(), updatedAt: new Date() },
      { id: 'lic-2', nombre: 'B1', email: 'b@x.com', tipo: 'landing', engagement: 'fixed', urgencia: 'normal', featuresJson: '[]', descripcion: 'd', precioMin: 100, precioMax: 200, banda: 'Starter', userId: 'user-B', createdAt: new Date(), updatedAt: new Date() },
      { id: 'lic-3', nombre: 'A2', email: 'a2@x.com', tipo: 'mobile', engagement: 'retainer', urgencia: 'normal', featuresJson: '[]', descripcion: 'd', precioMin: 100, precioMax: 200, banda: 'Standard', userId: 'user-A', createdAt: new Date(), updatedAt: new Date() },
    ]);

    const aliceList = await listLicitacionesByUser(db, 'user-A');
    expect(aliceList).toHaveLength(2);
    expect(aliceList.map((l) => l.id).sort()).toEqual(['lic-1', 'lic-3']);

    const bobList = await listLicitacionesByUser(db, 'user-B');
    expect(bobList).toHaveLength(1);
    expect(bobList[0].id).toBe('lic-2');

    // User sin licitaciones → empty array, no null.
    const empty = await listLicitacionesByUser(db, 'no-such-user');
    expect(empty).toEqual([]);
  });

  it('(2) groupLicitacionesByStatus agrupa correctamente', async () => {
    const lics = [
      { id: '1', status: 'nueva' as const, nombre: 'a', email: 'a@x', tipo: 'webapp' as const, engagement: 'fixed' as const, urgencia: 'normal' as const, featuresJson: '[]', descripcion: 'd', precioMin: 0, precioMax: 0, banda: 'Starter' as const, userId: null, createdAt: new Date(), updatedAt: new Date() },
      { id: '2', status: 'aceptada' as const, nombre: 'b', email: 'b@x', tipo: 'webapp' as const, engagement: 'fixed' as const, urgencia: 'normal', featuresJson: '[]', descripcion: 'd', precioMin: 0, precioMax: 0, banda: 'Starter' as const, userId: null, createdAt: new Date(), updatedAt: new Date() },
      { id: '3', status: 'nueva' as const, nombre: 'c', email: 'c@x', tipo: 'webapp' as const, engagement: 'fixed' as const, urgencia: 'normal', featuresJson: '[]', descripcion: 'd', precioMin: 0, precioMax: 0, banda: 'Starter' as const, userId: null, createdAt: new Date(), updatedAt: new Date() },
    ];
    const grouped = groupLicitacionesByStatus(lics);
    expect(grouped.nueva).toHaveLength(2);
    expect(grouped.aceptada).toHaveLength(1);
    expect(grouped.rechazada).toBeUndefined();
  });

  it('(3) listProyectosDelCliente filtra por cliente_id + portal_visible=1', async () => {
    const d1 = await applyAllMigrations();
    const db = createDb(d1);
    await seedTwoUsers(db);
    await seedProyectoConCliente(db, { id: 'p-1', slug: 'visible-a', clienteId: 'user-A', portalVisible: true });
    await seedProyectoConCliente(db, { id: 'p-2', slug: 'hidden-a', clienteId: 'user-A', portalVisible: false });
    await seedProyectoConCliente(db, { id: 'p-3', slug: 'visible-b', clienteId: 'user-B', portalVisible: true });

    const aProjects = await listProyectosDelCliente(db, 'user-A');
    expect(aProjects.map((p) => p.slug)).toEqual(['visible-a']);

    const bProjects = await listProyectosDelCliente(db, 'user-B');
    expect(bProjects.map((p) => p.slug)).toEqual(['visible-b']);
  });

  it('(4) listRecentActivity devuelve las últimas N (DESC) del user', async () => {
    const d1 = await applyAllMigrations();
    const db = createDb(d1);
    await seedTwoUsers(db);

    await db.insert(schema.portalActivity).values([
      { id: 'act-1', userId: 'user-A', action: 'login', entityType: 'user', createdAt: new Date('2026-01-01') },
      { id: 'act-2', userId: 'user-A', action: 'view_dashboard', entityType: 'user', createdAt: new Date('2026-02-01') },
      { id: 'act-3', userId: 'user-A', action: 'view_licitacion', entityType: 'licitacion', entityId: 'lic-1', createdAt: new Date('2026-03-01') },
      { id: 'act-4', userId: 'user-B', action: 'login', entityType: 'user', createdAt: new Date('2026-04-01') },
    ]);

    const recent = await listRecentActivity(db, 'user-A', 2);
    expect(recent).toHaveLength(2);
    expect(recent[0].id).toBe('act-3'); // DESC
    expect(recent[1].id).toBe('act-2');
  });
});

// ─── T05 · licitacion detail (tenant-isolation) ──────────────────────────

describe('portalRepo · licitacion detail (tenant isolation)', () => {
  it('(5) getLicitacionForUser devuelve null si la licitacion pertenece a OTRO user', async () => {
    const d1 = await applyAllMigrations();
    const db = createDb(d1);
    await seedTwoUsers(db);
    await db.insert(schema.licitacion).values({
      id: 'lic-priv', nombre: 'A', email: 'a@x', tipo: 'webapp', engagement: 'fixed', urgencia: 'normal',
      featuresJson: '[]', descripcion: 'd', precioMin: 100, precioMax: 200, banda: 'Starter',
      userId: 'user-A', createdAt: new Date(), updatedAt: new Date(),
    });

    const fromA = await getLicitacionForUser(db, 'lic-priv', 'user-A');
    expect(fromA?.id).toBe('lic-priv');

    const fromB = await getLicitacionForUser(db, 'lic-priv', 'user-B');
    expect(fromB).toBeNull();
  });

  it('(6) getNextMilestoneForProject elige la milestone pendiente/in_progress más próxima por due_date', async () => {
    const d1 = await applyAllMigrations();
    const db = createDb(d1);
    await seedTwoUsers(db);
    await seedProyectoConCliente(db, { id: 'p-ms', slug: 'ms', clienteId: 'user-A', portalVisible: true });

    await db.insert(schema.milestone).values([
      { id: 'm-1', proyectoId: 'p-ms', title: 'Lejana', status: 'pending', dueDate: new Date('2026-12-01'), createdAt: new Date() },
      { id: 'm-2', proyectoId: 'p-ms', title: 'Cercana', status: 'pending', dueDate: new Date('2026-06-01'), createdAt: new Date() },
      { id: 'm-3', proyectoId: 'p-ms', title: 'Cerrada', status: 'completed', completedAt: new Date('2026-01-01'), dueDate: new Date('2026-02-01'), createdAt: new Date() },
    ]);

    const next = await getNextMilestoneForProject(db, 'p-ms');
    expect(next?.id).toBe('m-2'); // la pendiente con due_date más temprano
  });

  it('(7) getNextMilestonesByProjects devuelve 1 milestone por proyecto', async () => {
    const d1 = await applyAllMigrations();
    const db = createDb(d1);
    await db.insert(schema.user).values({ id: 'u-x', name: 'X', email: 'x@x.com', role: 'cliente' });
    await seedProyectoConCliente(db, { id: 'p-1', slug: 'p-1', clienteId: 'u-x', portalVisible: true });
    await seedProyectoConCliente(db, { id: 'p-2', slug: 'p-2', clienteId: 'u-x', portalVisible: true });

    await db.insert(schema.milestone).values([
      { id: 'm-1a', proyectoId: 'p-1', title: 'P1-M1', status: 'pending', dueDate: new Date('2026-06-01'), createdAt: new Date() },
      { id: 'm-2a', proyectoId: 'p-2', title: 'P2-M1', status: 'in_progress', dueDate: new Date('2026-07-01'), createdAt: new Date() },
    ]);

    const m = await getNextMilestonesByProjects(db, ['p-1', 'p-2', 'no-such']);
    expect(m.size).toBe(2);
    expect(m.get('p-1')?.title).toBe('P1-M1');
    expect(m.get('p-2')?.title).toBe('P2-M1');
  });
});

// ─── T06 · proyecto detail (tenant isolation) ───────────────────────────

describe('portalRepo · proyecto detail (tenant isolation)', () => {
  it('(8) getProyectoForUser devuelve null si el proyecto NO es portal_visible o pertenece a OTRO user', async () => {
    const d1 = await applyAllMigrations();
    const db = createDb(d1);
    await seedTwoUsers(db);
    await seedProyectoConCliente(db, { id: 'p-h', slug: 'hidden', clienteId: 'user-A', portalVisible: false });
    await seedProyectoConCliente(db, { id: 'p-ok', slug: 'ok', clienteId: 'user-A', portalVisible: true });
    await seedProyectoConCliente(db, { id: 'p-other', slug: 'other-client', clienteId: 'user-B', portalVisible: true });

    expect(await getProyectoForUser(db, 'ok', 'user-A')).not.toBeNull();
    expect(await getProyectoForUser(db, 'hidden', 'user-A')).toBeNull(); // portal_visible = 0
    expect(await getProyectoForUser(db, 'other-client', 'user-A')).toBeNull(); // no es del user
    expect(await getProyectoForUser(db, 'no-such', 'user-A')).toBeNull();
  });

  it('(9) listMilestonesByProject devuelve TODAS las milestones (cualquier status)', async () => {
    const d1 = await applyAllMigrations();
    const db = createDb(d1);
    await db.insert(schema.user).values({ id: 'u-q', name: 'Q', email: 'q@x.com', role: 'cliente' });
    await seedProyectoConCliente(db, { id: 'p-q', slug: 'q', clienteId: 'u-q', portalVisible: true });

    await db.insert(schema.milestone).values([
      { id: 'm-q1', proyectoId: 'p-q', title: 'Done', status: 'completed', dueDate: new Date('2026-01-01'), completedAt: new Date('2026-01-05'), createdAt: new Date() },
      { id: 'm-q2', proyectoId: 'p-q', title: 'Doing', status: 'in_progress', dueDate: new Date('2026-06-01'), createdAt: new Date() },
      { id: 'm-q3', proyectoId: 'p-q', title: 'Pending', status: 'pending', dueDate: new Date('2026-08-01'), createdAt: new Date() },
    ]);

    const list = await listMilestonesByProject(db, 'p-q');
    expect(list).toHaveLength(3);
    expect(list.map((m) => m.id).sort()).toEqual(['m-q1', 'm-q2', 'm-q3']);
  });
});

// ─── T08 · mensajes + markOutboundAsRead ────────────────────────────────

describe('portalRepo · mensajes + markOutboundAsRead', () => {
  it('(10) listMensajesByUser devuelve mensajes DESC, y markOutboundAsRead marca outbound unread', async () => {
    const d1 = await applyAllMigrations();
    const db = createDb(d1);
    await db.insert(schema.user).values({ id: 'u-m', name: 'M', email: 'm@x.com', role: 'cliente' });

    await db.insert(schema.portalMessage).values([
      { id: 'msg-1', userId: 'u-m', direction: 'inbound', body: 'hola op', createdAt: new Date('2026-01-01') },
      { id: 'msg-2', userId: 'u-m', direction: 'outbound', body: 'hola cli', createdAt: new Date('2026-02-01') },
      { id: 'msg-3', userId: 'u-m', direction: 'outbound', body: 'ya?', createdAt: new Date('2026-03-01') },
    ]);

    const list = await listMensajesByUser(db, 'u-m');
    expect(list).toHaveLength(3);
    expect(list[0].id).toBe('msg-3'); // DESC

    const updated = await markOutboundAsRead(db, 'u-m', new Date('2026-10-19'));
    expect(updated).toBe(2); // marca msg-2 y msg-3

    const reListed = await listMensajesByUser(db, 'u-m');
    const outbounds = reListed.filter((m) => m.direction === 'outbound');
    expect(outbounds.every((m) => m.readAt !== null)).toBe(true);
  });

  it('(11) markOutboundAsRead es idempotente (segunda llamada marca 0)', async () => {
    const d1 = await applyAllMigrations();
    const db = createDb(d1);
    await db.insert(schema.user).values({ id: 'u-r', name: 'R', email: 'r@x.com', role: 'cliente' });
    await db.insert(schema.portalMessage).values({ id: 'msg-r', userId: 'u-r', direction: 'outbound', body: 'x', createdAt: new Date() });

    expect(await markOutboundAsRead(db, 'u-r')).toBe(1);
    expect(await markOutboundAsRead(db, 'u-r')).toBe(0);
  });
});

// ─── Activity + Profile ──────────────────────────────────────────────────

describe('portalRepo · activity + profile', () => {
  it('(12) recordActivity inserta una entrada de audit con payload JSON-serializado', async () => {
    const d1 = await applyAllMigrations();
    const db = createDb(d1);
    await db.insert(schema.user).values({ id: 'u-act', name: 'A', email: 'a@x.com', role: 'cliente' });

    const row = await recordActivity(db, {
      userId: 'u-act',
      action: 'profile_updated',
      entityType: 'user',
      entityId: 'u-act',
      payload: { keys: ['name', 'email'] },
    });
    expect(row.id).toBeDefined();
    expect(row.action).toBe('profile_updated');
    expect(row.payload).not.toBeNull();
    expect(JSON.parse(row.payload as unknown as string)).toEqual({ keys: ['name', 'email'] });
  });

  it('(13) updateUserProfile actualiza solo los campos provistos', async () => {
    const d1 = await applyAllMigrations();
    const db = createDb(d1);
    await db.insert(schema.user).values({
      id: 'u-up', name: 'Old', email: 'old@x.com', role: 'cliente',
      empresa: 'Old Co', telefono: '+1', pais: 'CO',
    });

    const updated = await updateUserProfile(db, 'u-up', { name: 'New', empresa: null });
    expect(updated?.name).toBe('New');
    expect(updated?.empresa).toBeNull();
    // email NO estaba en el patch → se preserva
    expect(updated?.email).toBe('old@x.com');
    expect(updated?.telefono).toBe('+1');
    expect(updated?.pais).toBe('CO');
  });
});

// ─── T07 · Profile schema Zod ───────────────────────────────────────────

describe('portal-profile-schema', () => {
  it('(14) acepta un patch parcial válido', () => {
    const r = ProfilePatchSchema.safeParse({ name: 'New Name' });
    expect(r.success).toBe(true);
  });

  it('(15) rechaza body vacío (al menos un campo requerido)', () => {
    const r = ProfilePatchSchema.safeParse({});
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => i.message.includes('al menos un campo'))).toBe(true);
    }
  });

  it('(16) rechaza email inválido', () => {
    const r = ProfilePatchSchema.safeParse({ email: 'no-es-email' });
    expect(r.success).toBe(false);
  });

  it('(17) rechaza name demasiado corto', () => {
    const r = ProfilePatchSchema.safeParse({ name: 'X' });
    expect(r.success).toBe(false);
  });

  it('(18) rechaza país que no sea ISO-2', () => {
    const r = ProfilePatchSchema.safeParse({ pais: 'COL' });
    expect(r.success).toBe(false);
  });

  it('(19) rechaza keys desconocidos (strict mode)', () => {
    const r = ProfilePatchSchema.safeParse({ name: 'OK', bogus: 1 });
    expect(r.success).toBe(false);
  });
});

// ─── T07 · handler handleProfileSubmit (auth + validación) ──────────────

describe('handleProfileSubmit (pure handler)', () => {
  let env: Awaited<ReturnType<typeof applyAllMigrations>>;
  let db: ReturnType<typeof createDb>;

  beforeEach(async () => {
    env = await applyAllMigrations();
    db = createDb(env);
    await db.insert(schema.user).values({
      id: 'u-h', name: 'H', email: 'h@x.com', role: 'cliente',
    });
  });

  it('(20) rechaza con 401 si userId es null', async () => {
    const r = await handleProfileSubmit(null, { name: 'New' }, { db });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.status).toBe(401);
  });

  it('(21) rechaza con 400 si el body no es válido', async () => {
    const r = await handleProfileSubmit('u-h', { email: 'no-es-email' }, { db });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.status).toBe(400);
  });

  it('(22) acepta y graba activity cuando el patch es válido', async () => {
    const r = await handleProfileSubmit('u-h', { name: 'Updated', empresa: 'NewCo' }, { db });
    expect(r.ok).toBe(true);

    // Verifica el reload del user.
    const reloaded = await db.select().from(schema.user).where(eq(schema.user.id, 'u-h')).get();
    expect(reloaded?.name).toBe('Updated');
    expect(reloaded?.empresa).toBe('NewCo');

    // Verifica que se grabó la activity con action correcta.
    const acts = await listRecentActivity(db, 'u-h', 10);
    expect(acts.length).toBeGreaterThan(0);
    expect(acts[0].action).toBe('profile_updated');
    expect(acts[0].entityType).toBe('user');
  });
});

// ─── T09 · portal-notifications ─────────────────────────────────────────

describe('portal-notifications · buildPortalEmail (puro)', () => {
  it('(23) magic_link_login incluye url y expiración en subject/html/text', () => {
    const t = buildPortalEmail({ event: 'magic_link_login', url: 'https://nx.studio/auth/x', expiresInMinutes: 30 });
    expect(t.subject).toMatch(/enlace/i);
    expect(t.html).toContain('https://nx.studio/auth/x');
    expect(t.html).toContain('30');
    expect(t.text).toContain('https://nx.studio/auth/x');
  });

  it('(24) licitacion_aprobada menciona el proyecto (opcional) y CTA al portal', () => {
    const t = buildPortalEmail({ event: 'licitacion_aprobada', licitacionId: 'LIC-1', proyectoNombre: 'Acme CRM' });
    expect(t.subject).toMatch(/aprobada/i);
    expect(t.html).toContain('Acme CRM');
    expect(t.html).toContain('/portal/licitacion/LIC-1');
  });

  it('(25) milestone_completada incluye el título de la milestone', () => {
    const t = buildPortalEmail({ event: 'milestone_completada', proyectoSlug: 'acme', milestoneTitle: 'MVP done', proyectoNombre: 'Acme' });
    expect(t.subject).toContain('MVP done');
    expect(t.html).toContain('MVP done');
    expect(t.html).toContain('/portal/proyectos/acme');
  });

  it('(26) mensaje_recibido muestra el preview del mensaje', () => {
    const t = buildPortalEmail({ event: 'mensaje_recibido', messagePreview: 'Hola, ¿cómo vamos?', operadorNombre: 'Sebas' });
    expect(t.html).toContain('Hola, ¿cómo vamos?');
    expect(t.html).toContain('Sebas');
    expect(t.html).toContain('/portal/mensajes');
  });
});

describe('portal-notifications · sendPortalEmail (graceful degradation)', () => {
  it('(27) sin RESEND_API_KEY devuelve degraded:true reason no_api_key', async () => {
    const r = await sendPortalEmail('licitacion_aprobada', { email: 'a@x.com', name: 'A' }, { licitacionId: 'L1' }, {});
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.degraded).toBe(true);
      expect(r.reason).toBe('no_api_key');
    }
  });

  it('(28) sin email de user devuelve degraded:true reason no_recipient', async () => {
    const r = await sendPortalEmail('licitacion_aprobada', { email: '', name: 'A' }, { licitacionId: 'L1' }, { RESEND_API_KEY: 're_xxx' });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.degraded).toBe(true);
      expect(r.reason).toBe('no_recipient');
    }
  });

  it('(29) con RESEND_API_KEY y email válido llama al service inyectado', async () => {
    let called = false;
    const stub = { send: async () => { called = true; } };
    const r = await sendPortalEmail(
      'magic_link_login',
      { email: 'a@x.com', name: 'A' },
      { url: 'https://nx.studio/x', expiresInMinutes: 30 },
      { RESEND_API_KEY: 're_xxx' },
      { service: stub }
    );
    expect(r.ok).toBe(true);
    expect(called).toBe(true);
  });
});