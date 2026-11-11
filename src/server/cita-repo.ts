// Repo: cita (agenda de scoping por videollamada).
//
// Capa de acceso a datos para la tabla `cita`. Toda la lógica SQL vive aquí;
// las rutas API nunca tocan Drizzle directo.
//
// Convenciones (igual que portal-repo.ts):
// - Devolver SIEMPRE null/undefined cuando algo no existe (NO throw).
// - Time stamps como Date (mode timestamp_ms en el schema).
// - IDs como string (UUID).

import { and, asc, desc, eq, gte, inArray, isNull, lte, or } from 'drizzle-orm';
import type { DB } from '~/db';
import { cita, type Cita, type NewCita } from '~/db/schema';
import { DURACION_MINUTOS } from '~/lib/agenda';

export type CreateCitaInput = {
  nombre: string;
  email: string;
  telefono?: string | null;
  empresa?: string | null;
  fecha: Date;
  duracionMin?: number;
  userId?: string | null;
  licitacionId?: string | null;
  meetUrl?: string | null;
  meetId?: string | null;
  calendarEventId?: string | null;
  estado?: Cita['estado'];
  banda?: string | null;
  precioMin?: number | null;
  precioMax?: number | null;
  horasEstimadas?: number | null;
  engagement?: string | null;
  featuresJson?: string | null;
  modifiersJson?: string | null;
  notas?: string | null;
};

export async function create(db: DB, input: CreateCitaInput): Promise<Cita> {
  const id = crypto.randomUUID();
  const now = new Date();
  const row: NewCita = {
    id,
    userId: input.userId ?? null,
    licitacionId: input.licitacionId ?? null,
    nombre: input.nombre,
    email: input.email.toLowerCase().trim(),
    telefono: input.telefono ?? null,
    empresa: input.empresa ?? null,
    fecha: input.fecha,
    duracionMin: input.duracionMin ?? DURACION_MINUTOS,
    meetUrl: input.meetUrl ?? null,
    meetId: input.meetId ?? null,
    calendarEventId: input.calendarEventId ?? null,
    estado: input.estado ?? 'pendiente',
    banda: input.banda ?? null,
    precioMin: input.precioMin ?? null,
    precioMax: input.precioMax ?? null,
    horasEstimadas: input.horasEstimadas ?? null,
    engagement: input.engagement ?? null,
    featuresJson: input.featuresJson ?? null,
    modifiersJson: input.modifiersJson ?? null,
    notas: input.notas ?? null,
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(cita).values(row).run();
  const saved = await getById(db, id);
  if (!saved) throw new Error('cita insert failed: row not found after insert');
  return saved;
}

export async function getById(db: DB, id: string): Promise<Cita | null> {
  const row = await db.select().from(cita).where(eq(cita.id, id)).get();
  return row ?? null;
}

export async function listAll(db: DB): Promise<Cita[]> {
  return db.select().from(cita).orderBy(desc(cita.fecha)).all();
}

/** Citas de un cliente autenticado (portal). */
export async function listByUser(db: DB, userId: string): Promise<Cita[]> {
  return db
    .select()
    .from(cita)
    .where(eq(cita.userId, userId))
    .orderBy(desc(cita.fecha))
    .all();
}

/** Citas de un cliente por email (agendar sin cuenta). */
export async function listByEmail(db: DB, email: string): Promise<Cita[]> {
  return db
    .select()
    .from(cita)
    .where(eq(cita.email, email.toLowerCase().trim()))
    .orderBy(desc(cita.fecha))
    .all();
}

/**
 * Reservas activas en un rango, para excluir esos slots de la disponibilidad.
 * Solo cuenta las que bloquean el calendario (pendiente/confirmada).
 */
export async function listReservasEnRango(
  db: DB,
  desde: Date,
  hasta: Date
): Promise<Array<{ inicio: Date; fin: Date }>> {
  const rows = await db
    .select()
    .from(cita)
    .where(
      and(
        gte(cita.fecha, desde),
        lte(cita.fecha, hasta),
        inArray(cita.estado, ['pendiente', 'confirmada'])
      )
    )
    .all();

  return rows.map((r) => ({
    inicio: r.fecha,
    fin: new Date(r.fecha.getTime() + r.duracionMin * 60_000),
  }));
}

/** ¿Existe ya una cita viva en ese instante exacto? (anti doble-reserva) */
export async function existeReservaEn(db: DB, fecha: Date): Promise<boolean> {
  const row = await db
    .select()
    .from(cita)
    .where(and(eq(cita.fecha, fecha), inArray(cita.estado, ['pendiente', 'confirmada'])))
    .get();
  return Boolean(row);
}

export async function updateEstado(
  db: DB,
  id: string,
  estado: Cita['estado']
): Promise<Cita | null> {
  await db
    .update(cita)
    .set({ estado, updatedAt: new Date() })
    .where(eq(cita.id, id))
    .run();
  return getById(db, id);
}

/** Adjunta (o reemplaza) el enlace de Meet confirmado por el operador. */
export async function updateMeet(
  db: DB,
  id: string,
  meet: { url: string; eventId?: string | null }
): Promise<Cita | null> {
  await db
    .update(cita)
    .set({
      meetUrl: meet.url,
      calendarEventId: meet.eventId ?? null,
      // Un enlace confirmado implica una cita confirmada.
      estado: 'confirmada',
      updatedAt: new Date(),
    })
    .where(eq(cita.id, id))
    .run();
  return getById(db, id);
}

/** Actualiza las notas de la cita. */
export async function updateNotas(db: DB, id: string, notas: string | null): Promise<Cita | null> {
  await db
    .update(cita)
    .set({ notas, updatedAt: new Date() })
    .where(eq(cita.id, id))
    .run();
  return getById(db, id);
}

/**
 * Citas próximas de un cliente, para mostrar "tu próxima llamada" en el portal.
 * Solo pendientes y confirmadas, orden ascendente por fecha.
 */
export async function listProximasDeUser(db: DB, userId: string, ahora = new Date()): Promise<Cita[]> {
  return db
    .select()
    .from(cita)
    .where(
      and(
        eq(cita.userId, userId),
        gte(cita.fecha, ahora),
        inArray(cita.estado, ['pendiente', 'confirmada'])
      )
    )
    .orderBy(asc(cita.fecha))
    .all();
}

/** Citas sin enlace de Meet que el operador aún debe resolver. */
export async function listPendientesDeEnlace(db: DB): Promise<Cita[]> {
  return db
    .select()
    .from(cita)
    .where(and(eq(cita.estado, 'pendiente'), isNull(cita.meetUrl)))
    .orderBy(asc(cita.fecha))
    .all();
}
