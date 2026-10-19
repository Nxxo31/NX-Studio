// Repo + helpers para el Portal Cliente (B7).
//
// Capa de acceso a datos para tablas portal_* + proyecto/milestone/licitacion
// desde el punto de vista del cliente. Toda la lógica SQL vive aquí.
// Las rutas /portal/* nunca tocan Drizzle directo.
//
// Convenciones:
// - Devolver SIEMPRE null/undefined cuando algo no existe (NO throw) — el caller
//   decide si eso es 404 o empty state.
// - Time stamps como Date (mode timestamp_ms en el schema).
// - IDs como string (UUID).

import { and, asc, desc, eq, inArray, isNotNull } from 'drizzle-orm';
import type { DB } from '~/db';
import {
  licitacion,
  milestone,
  portalActivity,
  portalMessage,
  proyecto,
  user,
  type Licitacion,
  type Milestone,
  type NewPortalActivity,
  type PortalActivity,
  type PortalMessage,
  type Proyecto,
  type User,
} from '~/db/schema';

// ─── Dashboard helpers ───────────────────────────────────────────────────

/**
 * Lista licitaciones del cliente (por user.id, no por email — el portal
 * ya está autenticado). Devuelve en orden DESC por createdAt.
 */
export async function listLicitacionesByUser(db: DB, userId: string): Promise<Licitacion[]> {
  return db
    .select()
    .from(licitacion)
    .where(eq(licitacion.userId, userId))
    .orderBy(desc(licitacion.createdAt))
    .all();
}

/**
 * Agrupa licitaciones por status (en memoria — el dashboard tiene pocos rows).
 */
export function groupLicitacionesByStatus(items: Licitacion[]): Record<string, Licitacion[]> {
  const out: Record<string, Licitacion[]> = {};
  for (const it of items) {
    const k = it.status;
    if (!out[k]) out[k] = [];
    out[k].push(it);
  }
  return out;
}

/**
 * Proyectos visibles para el cliente (cliente_id = userId AND portal_visible = 1).
 * Orden: destacados primero, luego por year DESC.
 */
export async function listProyectosDelCliente(db: DB, userId: string): Promise<Proyecto[]> {
  return db
    .select()
    .from(proyecto)
    .where(and(eq(proyecto.clienteId, userId), eq(proyecto.portalVisible, true)))
    .orderBy(desc(proyecto.destacado), desc(proyecto.year))
    .all();
}

/**
 * Últimas N actividades del portal del cliente.
 */
export async function listRecentActivity(db: DB, userId: string, limit = 5): Promise<PortalActivity[]> {
  return db
    .select()
    .from(portalActivity)
    .where(eq(portalActivity.userId, userId))
    .orderBy(desc(portalActivity.createdAt))
    .limit(limit)
    .all();
}

// ─── Licitación detail ───────────────────────────────────────────────────

/**
 * Lee una licitacion por id, pero SOLO si pertenece al user.
 * Devuelve null si no existe o si el user no es el dueño.
 * Esto es la verificación de tenant-isolation — equivalente a un 404 seguro.
 */
export async function getLicitacionForUser(
  db: DB,
  licitacionId: string,
  userId: string
): Promise<Licitacion | null> {
  const row = await db
    .select()
    .from(licitacion)
    .where(and(eq(licitacion.id, licitacionId), eq(licitacion.userId, userId)))
    .get();
  return row ?? null;
}

// ─── Milestones ──────────────────────────────────────────────────────────

/**
 * Próxima milestone abierta (pending|in_progress) por due_date ASC.
 * Devuelve null si no hay ninguna.
 */
export async function getNextMilestoneForProject(
  db: DB,
  proyectoId: string
): Promise<Milestone | null> {
  const row = await db
    .select()
    .from(milestone)
    .where(
      and(
        eq(milestone.proyectoId, proyectoId),
        inArray(milestone.status, ['pending', 'in_progress'])
      )
    )
    .orderBy(asc(milestone.dueDate))
    .get();
  return row ?? null;
}

/**
 * Próxima milestone abierta para cada proyecto (bulk).
 * Devuelve Map<proyectoId, Milestone>. Para el listado de proyectos.
 */
export async function getNextMilestonesByProjects(
  db: DB,
  proyectoIds: string[]
): Promise<Map<string, Milestone>> {
  const out = new Map<string, Milestone>();
  if (proyectoIds.length === 0) return out;
  const rows = await db
    .select()
    .from(milestone)
    .where(
      and(
        inArray(milestone.proyectoId, proyectoIds),
        inArray(milestone.status, ['pending', 'in_progress'])
      )
    )
    .orderBy(asc(milestone.dueDate))
    .all();
  for (const m of rows) {
    if (!out.has(m.proyectoId)) out.set(m.proyectoId, m);
  }
  return out;
}

/**
 * Timeline completo de milestones para un proyecto (todos los status).
 * Orden: pending/in_progress primero por due_date, luego completed/cancelled por completed_at desc.
 */
export async function listMilestonesByProject(db: DB, proyectoId: string): Promise<Milestone[]> {
  return db
    .select()
    .from(milestone)
    .where(eq(milestone.proyectoId, proyectoId))
    .all();
}

// ─── Proyecto helpers ────────────────────────────────────────────────────

/**
 * Proyecto por slug, SOLO si pertenece al cliente y es portal_visible.
 * Devuelve null si no existe o no se autoriza.
 */
export async function getProyectoForUser(
  db: DB,
  slug: string,
  userId: string
): Promise<Proyecto | null> {
  const row = await db
    .select()
    .from(proyecto)
    .where(
      and(
        eq(proyecto.slug, slug),
        eq(proyecto.clienteId, userId),
        eq(proyecto.portalVisible, true)
      )
    )
    .get();
  return row ?? null;
}

// ─── Mensajes ────────────────────────────────────────────────────────────

/**
 * Lista mensajes del cliente en orden DESC por createdAt.
 */
export async function listMensajesByUser(db: DB, userId: string): Promise<PortalMessage[]> {
  return db
    .select()
    .from(portalMessage)
    .where(eq(portalMessage.userId, userId))
    .orderBy(desc(portalMessage.createdAt))
    .all();
}

/**
 * Marca como leídos todos los mensajes outbound (operador → cliente)
 * que aún no tengan read_at. Devuelve el número actualizado.
 * Esta función corre en cada render del inbox para que el operador vea
 * "entregado" sin que el cliente tenga que hacer click.
 */
export async function markOutboundAsRead(db: DB, userId: string, now: Date = new Date()): Promise<number> {
  const unread = await db
    .select()
    .from(portalMessage)
    .where(
      and(
        eq(portalMessage.userId, userId),
        eq(portalMessage.direction, 'outbound'),
        isNotNull(portalMessage.id)
      )
    )
    .all();
  const targets = unread.filter((m) => m.readAt === null);
  for (const m of targets) {
    await db
      .update(portalMessage)
      .set({ readAt: now })
      .where(eq(portalMessage.id, m.id))
      .run();
  }
  return targets.length;
}

// ─── Activity audit ──────────────────────────────────────────────────────

/**
 * Inserta una entrada en portal_activity. Helper centralizado para que todos
 * los audit logs usen el mismo shape y misma validación de campos.
 */
export async function recordActivity(
  db: DB,
  params: {
    userId: string;
    action: string;
    entityType: string;
    entityId?: string | null;
    payload?: unknown;
  }
): Promise<PortalActivity> {
  const id = crypto.randomUUID();
  const now = new Date();
  const row: NewPortalActivity = {
    id,
    userId: params.userId,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId ?? null,
    payload: params.payload !== undefined ? JSON.stringify(params.payload) : null,
    createdAt: now,
  };
  await db.insert(portalActivity).values(row).run();
  const inserted = await db.select().from(portalActivity).where(eq(portalActivity.id, id)).get();
  if (!inserted) throw new Error('portal_activity insert failed');
  return inserted;
}

// ─── Profile update ──────────────────────────────────────────────────────

export type ProfilePatch = {
  name?: string;
  email?: string;
  empresa?: string | null;
  telefono?: string | null;
  pais?: string | null;
};

/**
 * Actualiza el perfil del user. Solo campos permitidos.
 * Devuelve el row actualizado o null si no existe.
 */
export async function updateUserProfile(
  db: DB,
  userId: string,
  patch: ProfilePatch
): Promise<User | null> {
  const existing = await db.select().from(user).where(eq(user.id, userId)).get();
  if (!existing) return null;
  const now = new Date();
  await db
    .update(user)
    .set({
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.email !== undefined ? { email: patch.email } : {}),
      ...(patch.empresa !== undefined ? { empresa: patch.empresa } : {}),
      ...(patch.telefono !== undefined ? { telefono: patch.telefono } : {}),
      ...(patch.pais !== undefined ? { pais: patch.pais } : {}),
      updatedAt: now,
    })
    .where(eq(user.id, userId))
    .run();
  const reloaded = await db.select().from(user).where(eq(user.id, userId)).get();
  return reloaded ?? null;
}