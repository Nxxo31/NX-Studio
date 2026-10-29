// Repo: newsletter_subscriber.
// Alta de suscriptores al newsletter. Idempotente por email: si el email ya
// existe, se reactiva (status 'activo') y no se duplica la fila.

import { eq, desc } from 'drizzle-orm';
import type { DB } from '~/db';
import {
  newsletterSubscriber,
  type NewsletterSubscriber,
  type NewNewsletterSubscriber,
} from '~/db/schema';

export type SubscribeInput = {
  email: string;
  locale?: string | null;
  source?: string | null;
};

export async function subscribe(db: DB, input: SubscribeInput): Promise<NewsletterSubscriber> {
  const email = input.email.trim().toLowerCase();
  const existing = await db
    .select()
    .from(newsletterSubscriber)
    .where(eq(newsletterSubscriber.email, email))
    .get();

  if (existing) {
    if (existing.status === 'activo') return existing;
    await db
      .update(newsletterSubscriber)
      .set({ status: 'activo' })
      .where(eq(newsletterSubscriber.id, existing.id))
      .run();
    return { ...existing, status: 'activo' };
  }

  const row: NewNewsletterSubscriber = {
    id: crypto.randomUUID(),
    email,
    locale: input.locale ?? null,
    source: input.source ?? null,
    status: 'activo',
    createdAt: new Date(),
  };
  await db.insert(newsletterSubscriber).values(row).run();
  return { ...row, status: 'activo' };
}

export async function listAll(db: DB, limit = 200): Promise<NewsletterSubscriber[]> {
  return db
    .select()
    .from(newsletterSubscriber)
    .orderBy(desc(newsletterSubscriber.createdAt))
    .limit(limit)
    .all();
}

export async function countActive(db: DB): Promise<number> {
  const rows = await db
    .select()
    .from(newsletterSubscriber)
    .where(eq(newsletterSubscriber.status, 'activo'))
    .all();
  return rows.length;
}
