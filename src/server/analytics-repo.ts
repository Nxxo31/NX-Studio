// Repo: analytics_event.
// Capa de acceso a datos para los eventos de captacion (primera parte).
//
// Eventos: page_view (navegacion) y conversiones (lead, quote, newsletter,
// CTA). No contienen PII: solo ruta, locale, utm_source, referrer y props.

import { eq, gte, desc, sql } from 'drizzle-orm';
import type { DB } from '~/db';
import { analyticsEvent, type AnalyticsEvent } from '~/db/schema';

export type TrackEventInput = {
  name: string;
  path?: string | null;
  locale?: string | null;
  utmSource?: string | null;
  referrer?: string | null;
  props?: Record<string, unknown>;
};

export async function trackEvent(db: DB, input: TrackEventInput): Promise<void> {
  const id = crypto.randomUUID();
  const now = new Date();
  await db
    .insert(analyticsEvent)
    .values({
      id,
      name: input.name.slice(0, 64),
      path: input.path?.slice(0, 200) ?? null,
      locale: input.locale?.slice(0, 8) ?? null,
      utmSource: input.utmSource?.slice(0, 120) ?? null,
      referrer: input.referrer?.slice(0, 300) ?? null,
      props: input.props ? JSON.stringify(input.props).slice(0, 2000) : null,
      createdAt: now,
    })
    .run();
}

export async function listRecent(db: DB, limit = 50): Promise<AnalyticsEvent[]> {
  return db
    .select()
    .from(analyticsEvent)
    .orderBy(desc(analyticsEvent.createdAt))
    .limit(limit)
    .all();
}

/** Conteo por nombre de evento dentro de la ventana (ultimos N ms). */
export async function countByName(
  db: DB,
  sinceMs: number
): Promise<{ name: string; count: number }[]> {
  const rows = await db
    .select({
      name: analyticsEvent.name,
      count: sql<number>`count(*)`,
    })
    .from(analyticsEvent)
    .where(gte(analyticsEvent.createdAt, new Date(sinceMs)))
    .groupBy(analyticsEvent.name)
    .all();
  return rows.map((r) => ({ name: r.name, count: Number(r.count) }));
}

/** Origenes (utm_source) mas frecuentes en la ventana. */
export async function topSources(
  db: DB,
  sinceMs: number
): Promise<{ source: string; count: number }[]> {
  const rows = await db
    .select({
      source: analyticsEvent.utmSource,
      count: sql<number>`count(*)`,
    })
    .from(analyticsEvent)
    .where(gte(analyticsEvent.createdAt, new Date(sinceMs)))
    .groupBy(analyticsEvent.utmSource)
    .all();
  return rows
    .filter((r) => r.source)
    .map((r) => ({ source: r.source as string, count: Number(r.count) }))
    .sort((a, b) => b.count - a.count);
}

/** Rutas mas vistas en la ventana. */
export async function topPaths(
  db: DB,
  sinceMs: number
): Promise<{ path: string; count: number }[]> {
  const rows = await db
    .select({
      path: analyticsEvent.path,
      count: sql<number>`count(*)`,
    })
    .from(analyticsEvent)
    .where(gte(analyticsEvent.createdAt, new Date(sinceMs)))
    .groupBy(analyticsEvent.path)
    .all();
  return rows
    .filter((r) => r.path)
    .map((r) => ({ path: r.path as string, count: Number(r.count) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);
}

export async function countSince(db: DB, sinceMs: number): Promise<number> {
  const rows = await db
    .select({ count: sql<number>`count(*)` })
    .from(analyticsEvent)
    .where(gte(analyticsEvent.createdAt, new Date(sinceMs)))
    .all();
  return Number(rows[0]?.count ?? 0);
}

export async function existsByName(db: DB, name: string): Promise<boolean> {
  const row = await db
    .select({ id: analyticsEvent.id })
    .from(analyticsEvent)
    .where(eq(analyticsEvent.name, name))
    .limit(1)
    .get();
  return Boolean(row);
}
