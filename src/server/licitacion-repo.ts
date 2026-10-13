// Repo: licitacion.
// Capa de acceso a datos para la tabla `licitacion`.
// Toda la lógica SQL vive aquí. Las rutas API nunca tocan Drizzle directo.
//
// Responsabilidades:
// - create(input) — persiste una nueva licitacion con pricing calculado
// - getById(id) — recupera una licitacion por id
// - listByEmail(email) — list para el portal de cliente
// - listAll() — list para el admin
// - updateStatus(id, status) — actualiza status (admin)

import { eq, desc } from 'drizzle-orm';
import type { DB } from '~/db';
import { licitacion, type Licitacion, type NewLicitacion } from '~/db/schema';
import { computeQuote, type QuoteInput, type EngagementShape } from '~/data/pricing';

export type CreateLicitacionInput = {
  nombre: string;
  email: string;
  empresa?: string | null;
  telefono?: string | null;
  pais?: string | null;
  tipo: 'webapp' | 'landing' | 'mobile' | 'testing' | 'template' | 'otro';
  engagement: EngagementShape;
  urgencia: 'normal' | 'rush' | 'flexible';
  featureIds: string[];
  descripcion: string;
  modifierIds: string[];
  userId?: string | null;
  displayCurrency?: string | null;
  displayMin?: number | null;
  displayMax?: number | null;
};

export async function create(db: DB, input: CreateLicitacionInput): Promise<Licitacion> {
  const quote = computeQuote({
    shape: input.engagement,
    featureIds: input.featureIds,
    modifierIds: input.modifierIds,
  });

  const id = crypto.randomUUID();
  const now = new Date();
  const newRow: NewLicitacion = {
    id,
    nombre: input.nombre,
    email: input.email,
    empresa: input.empresa ?? null,
    telefono: input.telefono ?? null,
    pais: input.pais ?? null,
    tipo: input.tipo,
    engagement: input.engagement,
    urgencia: input.urgencia,
    featuresJson: JSON.stringify(input.featureIds),
    descripcion: input.descripcion,
    precioMin: quote.totalLow,
    precioMax: quote.totalHigh,
    banda: quote.bandLabel as 'Starter' | 'Standard' | 'Growth' | 'Enterprise',
    displayCurrency: input.displayCurrency ?? null,
    displayMin: input.displayMin ?? null,
    displayMax: input.displayMax ?? null,
    userId: input.userId ?? null,
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(licitacion).values(newRow).run();
  const row = await db.select().from(licitacion).where(eq(licitacion.id, id)).get();
  if (!row) throw new Error('licitacion insert failed: row not found after insert');
  return row;
}

export async function getById(db: DB, id: string): Promise<Licitacion | null> {
  const row = await db.select().from(licitacion).where(eq(licitacion.id, id)).get();
  return row ?? null;
}

export async function listByEmail(db: DB, email: string): Promise<Licitacion[]> {
  return db
    .select()
    .from(licitacion)
    .where(eq(licitacion.email, email))
    .orderBy(desc(licitacion.createdAt))
    .all();
}

export async function listAll(db: DB): Promise<Licitacion[]> {
  return db.select().from(licitacion).orderBy(desc(licitacion.createdAt)).all();
}

export type LicitacionStatus = Licitacion['status'];

export async function updateStatus(
  db: DB,
  id: string,
  status: LicitacionStatus
): Promise<Licitacion | null> {
  await db
    .update(licitacion)
    .set({ status, updatedAt: new Date() })
    .where(eq(licitacion.id, id))
    .run();
  return getById(db, id);
}
