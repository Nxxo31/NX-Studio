// RBAC matrix + middleware requireRole para B8 Admin Panel (spec_id 17 · T01).
//
// 4 roles del panel: admin, gatekeeper, designer, dev.
// 19 acciones agrupadas por dominio: licitacion, proyecto, template, usuario,
// audit_log, deploy.
//
// Uso típico en un endpoint de API:
//   import { requireRole } from '~/lib/rbac';
//   export const POST: APIRoute = requireRole(['admin', 'gatekeeper'])(async (ctx) => {
//     ...
//   });
//
// El middleware asume que `context.locals.portalSession` fue seteado por un
// middleware upstream (Cloudflare Access T02, fuera de scope de este ticket)
// y que el usuario tiene una propiedad `role` válida.

import type { MiddlewareHandler } from 'astro';

export type Role = 'admin' | 'gatekeeper' | 'designer' | 'dev';

export const RBAC_MATRIX: Record<string, Role[]> = {
  'licitacion.read': ['admin', 'gatekeeper', 'designer', 'dev'],
  'licitacion.create': ['admin', 'gatekeeper'],
  'licitacion.update': ['admin', 'gatekeeper'],
  'licitacion.delete': ['admin'],
  'proyecto.read': ['admin', 'gatekeeper', 'designer', 'dev'],
  'proyecto.create': ['admin', 'gatekeeper', 'designer', 'dev'],
  'proyecto.update': ['admin', 'gatekeeper', 'designer', 'dev'],
  'proyecto.delete': ['admin'],
  'template.read': ['admin', 'gatekeeper', 'designer', 'dev'],
  'template.create': ['admin', 'gatekeeper', 'designer'],
  'template.update': ['admin', 'gatekeeper', 'designer'],
  'template.delete': ['admin'],
  'usuario.read': ['admin'],
  'usuario.create': ['admin'],
  'usuario.update': ['admin'],
  'usuario.delete': ['admin'],
  'usuario.reset_password': ['admin'],
  'audit_log.read': ['admin', 'gatekeeper'],
  'deploy.read': ['admin', 'gatekeeper', 'designer', 'dev'],
  'deploy.trigger': ['admin', 'gatekeeper'],
};

export function canRole(role: Role, action: string): boolean {
  const allowed = RBAC_MATRIX[action];
  if (!allowed) return false;
  return allowed.includes(role);
}

export function requireRole(allowedRoles: Role[]): MiddlewareHandler {
  return async (context, next) => {
    const portalSession = (context.locals as any).portalSession;
    if (!portalSession?.user) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401, headers: { 'Content-Type': 'application/json' }
      });
    }
    const role = (portalSession.user as any).role as Role | undefined;
    if (!role || !allowedRoles.includes(role)) {
      return new Response(JSON.stringify({ error: 'forbidden', required: allowedRoles, actual: role ?? null }), {
        status: 403, headers: { 'Content-Type': 'application/json' }
      });
    }
    return next();
  };
}