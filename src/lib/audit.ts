// Helpers para audit_log (B8 Admin Panel).
//
// Cada acción admin (cambiar status, CRUD, reset password, etc.) debe
// registrar una fila en audit_log con: actorUserId, action, resourceType,
// resourceId, beforeJson, afterJson, ip, userAgent.
//
// La tabla audit_log tiene un trigger SQL BEFORE UPDATE/DELETE que rechaza
// cualquier modificación — es INMUTABLE. Insert es la única operación
// permitida. Ver migrations/0003_admin.sql.

import type { DB } from '~/db';
import { auditLog, type AuditLog, type NewAuditLog } from '~/db/schema';
import { and, eq, gte, like, lte, desc, sql } from 'drizzle-orm';

export type AuditAction =
  | 'licitacion.approve'
  | 'licitacion.reject'
  | 'licitacion.contact'
  | 'licitacion.update_status'
  | 'proyecto.create'
  | 'proyecto.update'
  | 'proyecto.delete'
  | 'proyecto.toggle_portal_visible'
  | 'template.create'
  | 'template.update'
  | 'template.delete'
  | 'usuario.role_change'
  | 'usuario.reset_password'
  | 'usuario.revoke_sessions';

export type AuditResourceType =
  | 'licitacion'
  | 'proyecto'
  | 'template'
  | 'user'
  | 'admin_session';

export interface AuditEntry {
  actorUserId: string;
  action: AuditAction | string;
  resourceType: AuditResourceType | string;
  resourceId?: string | null;
  beforeJson?: string | null;
  afterJson?: string | null;
  ip?: string | null;
  userAgent?: string | null;
}

export async function recordAudit(db: DB, entry: AuditEntry): Promise<string> {
  const id = crypto.randomUUID();
  const row: NewAuditLog = {
    id,
    actorUserId: entry.actorUserId,
    action: entry.action,
    resourceType: entry.resourceType,
    resourceId: entry.resourceId ?? null,
    beforeJson: entry.beforeJson ?? null,
    afterJson: entry.afterJson ?? null,
    ip: entry.ip ?? null,
    userAgent: entry.userAgent ?? null,
    createdAt: new Date(),
  };
  await db.insert(auditLog).values(row).run();
  return id;
}

export interface AuditFilters {
  actorUserId?: string;
  from?: Date;
  to?: Date;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  page?: number;
  pageSize?: number;
}

export interface AuditPage {
  rows: AuditLog[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export async function queryAudit(db: DB, filters: AuditFilters): Promise<AuditPage> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(200, Math.max(1, filters.pageSize ?? 50));
  const conds = [];
  if (filters.actorUserId) conds.push(eq(auditLog.actorUserId, filters.actorUserId));
  if (filters.from) conds.push(gte(auditLog.createdAt, filters.from));
  if (filters.to) conds.push(lte(auditLog.createdAt, filters.to));
  if (filters.action) conds.push(like(auditLog.action, `%${filters.action}%`));
  if (filters.resourceType) conds.push(eq(auditLog.resourceType, filters.resourceType));
  if (filters.resourceId) conds.push(eq(auditLog.resourceId, filters.resourceId));

  const whereExpr = conds.length ? and(...conds) : undefined;

  const totalRows = await db
    .select({ c: sql<number>`count(*)` })
    .from(auditLog)
    .where(whereExpr ?? sql`1=1`)
    .all();
  const total = Number(totalRows[0]?.c ?? 0);

  const offset = (page - 1) * pageSize;
  const rows = await db
    .select()
    .from(auditLog)
    .where(whereExpr ?? sql`1=1`)
    .orderBy(desc(auditLog.createdAt))
    .limit(pageSize)
    .offset(offset)
    .all();

  return {
    rows,
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}
