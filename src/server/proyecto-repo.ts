// Repo: proyecto (catálogo de proyectos).
// Capa de acceso a datos para la tabla `proyecto`.

import { eq, desc } from 'drizzle-orm';
import type { DB } from '~/db';
import { proyecto, type Proyecto, type NewProyecto } from '~/db/schema';

/**
 * Inserta un proyecto nuevo. No actualiza si ya existe por slug (error del
 * UNIQUE constraint).
 */
export async function create(db: DB, input: NewProyecto): Promise<Proyecto> {
  const insert = { ...input };
  if (!insert.id) insert.id = crypto.randomUUID();
  await db.insert(proyecto).values(insert).run();
  const row = await getBySlug(db, insert.slug);
  if (!row) throw new Error('proyecto insert failed: row not found after insert');
  return row;
}

/**
 * Recupera un proyecto por slug.
 */
export async function getBySlug(db: DB, slug: string): Promise<Proyecto | null> {
  const row = await db.select().from(proyecto).where(eq(proyecto.slug, slug)).get();
  return row ?? null;
}

/**
 * Lista todos los proyectos ordenados por destacado DESC + year DESC + created_at DESC.
 */
export async function listAll(db: DB): Promise<Proyecto[]> {
  return db.select().from(proyecto).orderBy(desc(proyecto.destacado), desc(proyecto.year)).all();
}

/**
 * Lista proyectos filtrados por categoría. 'all' devuelve todos.
 */
export async function listByCategory(
  db: DB,
  categoria: string
): Promise<Proyecto[]> {
  if (categoria === 'all') return listAll(db);
  return db.select().from(proyecto).where(eq(proyecto.categoria, categoria)).orderBy(desc(proyecto.year)).all();
}

/**
 * Lista solo los destacados (para el Hero).
 */
export async function listDestacados(db: DB): Promise<Proyecto[]> {
  return db.select().from(proyecto).where(eq(proyecto.destacado, true)).orderBy(desc(proyecto.year)).all();
}

/**
 * Actualiza un proyecto existente por slug.
 */
export async function updateBySlug(
  db: DB,
  slug: string,
  updates: Partial<Omit<NewProyecto, 'id' | 'slug'>>
): Promise<Proyecto | null> {
  await db
    .update(proyecto)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(proyecto.slug, slug))
    .run();
  return getBySlug(db, slug);
}

/**
 * Elimina un proyecto por slug.
 */
export async function deleteBySlug(db: DB, slug: string): Promise<void> {
  await db.delete(proyecto).where(eq(proyecto.slug, slug)).run();
}

/**
 * Conteo total de proyectos.
 */
export async function count(db: DB): Promise<number> {
  const rows = await db.select({ count: proyecto.id }).from(proyecto).all();
  return rows.length;
}
