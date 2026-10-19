// B7 Portal Cliente (T03) — guard extraído como función pura para testeo.
//
// El middleware en src/middleware.ts usa `astro:middleware` (módulo virtual
// de Astro que solo existe en el bundle del Pages Function). Para poder
// testear la lógica en vitest sin mockear el módulo virtual, extraemos la
// decisión a una función pura que devuelve un resultado que el caller
// transforma en Response / next().
//
// Resultado:
//   { action: 'next' }              — deja pasar, no hay guard
//   { action: 'next', portalSession } — deja pasar con sesión validada
//   { action: 'redirect', location } — redirige a /portal/login

import { getPortalUserId, type PortalEnv } from './portal-auth';

const PUBLIC_PORTAL_PATHS = ['/portal/login', '/portal/register', '/portal/forgot-password'];

export type PortalGuardResult =
  | { action: 'next'; portalSession?: { user: { id: string } } }
  | { action: 'redirect'; location: string };

export interface PortalGuardContext {
  /** Pathname normalizado (sin base '/NX-Studio') */
  pathname: string;
  /** Request entrante — para extraer cookies */
  request: Request;
  /** Env de Cloudflare (con DB) o mock para tests */
  env: PortalEnv;
}

export async function portalGuard(ctx: PortalGuardContext): Promise<PortalGuardResult> {
  // Aplica solo a /portal y /portal/*
  if (!(ctx.pathname === '/portal' || ctx.pathname.startsWith('/portal/'))) {
    return { action: 'next' };
  }

  const isPublic = PUBLIC_PORTAL_PATHS.some(p => ctx.pathname === p || ctx.pathname.startsWith(p + '/'));
  if (isPublic) return { action: 'next' };

  const userId = await getPortalUserId(ctx.request, ctx.env);
  if (!userId) {
    return {
      action: 'redirect',
      location: `/portal/login?from=${encodeURIComponent(ctx.pathname)}`,
    };
  }
  return { action: 'next', portalSession: { user: { id: userId } } };
}
