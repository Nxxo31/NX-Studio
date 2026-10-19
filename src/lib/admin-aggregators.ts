// Aggregators para /admin (dashboard de metricas B8).
//
// Funciones puras: dado un DB (Drizzle), devuelven metricas calculadas.
// Cada función es testeable en aislamiento con un D1 fake.
//
// Métricas del dashboard (T05):
//   - licitacionesMes        : count de licitacion con status='nueva' creadas este mes
//   - conversionRate         : (aceptadas + completadas) / total del mes
//   - mrrUsd                 : suma de precioMax de licitaciones con status='aceptada'
//   - deploys24h             : count de deploy_log con created_at > now-24h
//   - erroresAbiertos        : placeholder (no hay tabla de errores)
//   - gatekeeperHealth       : placeholder (no hay scheduler local)

import type { DB } from '~/db';
import { licitacion, deployLog } from '~/db/schema';
import { and, eq, gte, lte, sql, inArray } from 'drizzle-orm';

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

export interface DashboardMetrics {
  licitacionesMes: number;
  conversionRate: number;
  mrrUsd: number;
  deploys24h: number;
  erroresAbiertos: number;
  gatekeeperHealth: 'unknown' | 'ok' | 'degraded';
  generatedAt: number;
}

export async function computeLicitacionesMes(db: DB, now: Date = new Date()): Promise<number> {
  const since = startOfMonth(now);
  const rows = await db
    .select({ c: sql<number>`count(*)` })
    .from(licitacion)
    .where(and(eq(licitacion.status, 'nueva'), gte(licitacion.createdAt, since)))
    .all();
  return Number(rows[0]?.c ?? 0);
}

export async function computeConversionRate(db: DB, now: Date = new Date()): Promise<number> {
  const since = startOfMonth(now);
  const all = await db
    .select({ id: licitacion.id, status: licitacion.status })
    .from(licitacion)
    .where(gte(licitacion.createdAt, since))
    .all();
  if (all.length === 0) return 0;
  const won = all.filter((r) => r.status === 'aceptada' || r.status === 'completada').length;
  return won / all.length;
}

export async function computeMrrUsd(db: DB): Promise<number> {
  const rows = await db
    .select({ precioMax: licitacion.precioMax })
    .from(licitacion)
    .where(eq(licitacion.status, 'aceptada'))
    .all();
  return rows.reduce((sum, r) => sum + (r.precioMax ?? 0), 0);
}

export async function computeDeploys24h(db: DB, now: Date = new Date()): Promise<number> {
  const since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const rows = await db
    .select({ c: sql<number>`count(*)` })
    .from(deployLog)
    .where(gte(deployLog.createdAt, since))
    .all();
  return Number(rows[0]?.c ?? 0);
}

export function computeErroresAbiertos(): number {
  // Placeholder: no hay tabla de errores todavía.
  return 0;
}

export function computeGatekeeperHealth(): 'unknown' | 'ok' | 'degraded' {
  // Placeholder: scheduler es externo (Cloudflare cron).
  return 'unknown';
}

export async function computeDashboardMetrics(db: DB, now: Date = new Date()): Promise<DashboardMetrics> {
  const [licMes, conv, mrr, dep24] = await Promise.all([
    computeLicitacionesMes(db, now),
    computeConversionRate(db, now),
    computeMrrUsd(db),
    computeDeploys24h(db, now),
  ]);
  return {
    licitacionesMes: licMes,
    conversionRate: conv,
    mrrUsd: mrr,
    deploys24h: dep24,
    erroresAbiertos: computeErroresAbiertos(),
    gatekeeperHealth: computeGatekeeperHealth(),
    generatedAt: now.getTime(),
  };
}

/**
 * Filtros para queries de licitacion en /admin/licitacion (T06).
 */
export interface LicitacionFilters {
  status?: string;
  banda?: string;
  userId?: string;
  from?: Date;
  to?: Date;
}

export function applyLicitacionFilters<T extends { status: string; banda: string; userId: string | null; createdAt: Date }>(
  rows: T[],
  filters: LicitacionFilters
): T[] {
  return rows.filter((r) => {
    if (filters.status && r.status !== filters.status) return false;
    if (filters.banda && r.banda !== filters.banda) return false;
    if (filters.userId && r.userId !== filters.userId) return false;
    if (filters.from && r.createdAt < filters.from) return false;
    if (filters.to && r.createdAt > filters.to) return false;
    return true;
  });
}

/** Helper para filtrar in DB (Drizzle) — usado en /admin/licitacion page */
export function buildLicitacionWhere(filters: LicitacionFilters) {
  const conds = [];
  if (filters.status) conds.push(eq(licitacion.status, filters.status as 'nueva'));
  if (filters.banda) conds.push(eq(licitacion.banda, filters.banda as 'Starter'));
  if (filters.userId) conds.push(eq(licitacion.userId, filters.userId));
  if (filters.from) conds.push(gte(licitacion.createdAt, filters.from));
  if (filters.to) conds.push(lte(licitacion.createdAt, filters.to));
  return conds.length ? and(...conds) : undefined;
}

export { inArray };
