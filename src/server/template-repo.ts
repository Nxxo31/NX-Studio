// Repo: template (productos comprables one-time payment).
// Capa de acceso a datos para la tabla `template`.

import { eq, desc } from 'drizzle-orm';
import type { DB } from '~/db';
import { template, type Template, type NewTemplate } from '~/db/schema';

export async function create(db: DB, input: NewTemplate): Promise<Template> {
  const insert = { ...input };
  if (!insert.id) insert.id = crypto.randomUUID();
  await db.insert(template).values(insert).run();
  const row = await getBySlug(db, insert.slug);
  if (!row) throw new Error('template insert failed: row not found after insert');
  return row;
}

export async function getBySlug(db: DB, slug: string): Promise<Template | null> {
  const row = await db.select().from(template).where(eq(template.slug, slug)).get();
  return row ?? null;
}

export async function listAll(db: DB): Promise<Template[]> {
  return db.select().from(template).orderBy(desc(template.destacado), desc(template.precioUsd)).all();
}

export async function listDestacados(db: DB): Promise<Template[]> {
  return db.select().from(template).where(eq(template.destacado, true)).orderBy(desc(template.precioUsd)).all();
}

export async function listByCategory(db: DB, categoria: string): Promise<Template[]> {
  return db.select().from(template).where(eq(template.categoria, categoria)).all();
}

export async function updateBySlug(
  db: DB,
  slug: string,
  updates: Partial<Omit<NewTemplate, 'id' | 'slug'>>
): Promise<Template | null> {
  await db
    .update(template)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(template.slug, slug))
    .run();
  return getBySlug(db, slug);
}

export async function deleteBySlug(db: DB, slug: string): Promise<void> {
  await db.delete(template).where(eq(template.slug, slug)).run();
}
