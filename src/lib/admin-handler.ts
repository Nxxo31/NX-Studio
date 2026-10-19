// Helpers para endpoints API del admin (B8).
//
// requireRole() de rbac.ts devuelve un MiddlewareHandler, no un APIRoute.
// Para endpoints API usamos estos wrappers que ejecutan requireRole()
// dentro del handler y devuelven un Response directamente.

import type { APIContext } from 'astro';
import { requireRole, type Role } from './rbac';

export interface RoleGuardedContext extends APIContext {
  /** user.id extraído del portal session, presente si pasó el guard */
  actor: { id: string; role: string };
}

/**
 * Helper para API routes: ejecuta requireRole y, si pasa, invoca el handler
 * con un context extendido que ya trae `actor` resuelto. Si falla,
 * devuelve el 401/403 directamente.
 */
export function withRole(
  allowed: Role[],
  handler: (ctx: RoleGuardedContext) => Promise<Response> | Response
): (ctx: APIContext) => Promise<Response> {
  const guard = requireRole(allowed);
  return async (ctx: APIContext) => {
    // requireRole chequea locals.portalSession.user.role
    const fakeNext = async () => {
      const locals = ctx.locals as { portalSession?: { user: { id: string; role: string } } };
      const u = locals.portalSession?.user;
      if (!u || !u.id) {
        return new Response(JSON.stringify({ ok: false, error: 'unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return handler({ ...ctx, actor: { id: u.id, role: u.role } });
    };
    // requireRole middleware uses (context, next)
    const res = await guard(ctx as unknown as Parameters<typeof guard>[0], fakeNext as Parameters<typeof guard>[1]);
    return res as Response;
  };
}

/** Extrae la IP del request, fallback a 'unknown' si no hay header. */
export function getRequestIp(ctx: APIContext): string | null {
  return (
    ctx.request.headers.get('cf-connecting-ip') ??
    ctx.request.headers.get('x-forwarded-for') ??
    null
  );
}

/** Extrae el user-agent, fallback a 'unknown'. */
export function getRequestUA(ctx: APIContext): string | null {
  return ctx.request.headers.get('user-agent') ?? null;
}
