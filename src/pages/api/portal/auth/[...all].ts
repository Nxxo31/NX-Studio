// Catch-all de better-auth PARA EL PORTAL.
//
// Por qué existe aparte de src/pages/api/auth/[...all].ts:
// El portal usa su propia instancia de better-auth (createPortalAuth) con:
//   - tabla de sesiones `portal_session` (aislada de la sesión admin)
//   - cookie prefix `nx-studio-portal-` (sin colisión con `nx-studio`)
//   - basePath `/api/portal/auth`
//
// El endpoint DEBE vivir en la misma ruta que el basePath, porque better-auth
// recorta el prefijo antes de matchear sus rutas internas (/sign-in/email,
// /magic-link/verify, etc).
//
// Si el form de /portal/login hace POST a /api/auth/sign-in/email (el
// catch-all admin), emite la cookie `nx-studio.session_token` y el
// portalGuard lee `nx-studio-portal-.session_token` → nunca coincide → loop
// de login. Mantener las dos piezas alineadas (basePath aquí, prefix en
// src/lib/portal-auth.ts).

import type { APIRoute } from 'astro';
import { env as runtimeEnv } from 'cloudflare:workers';
import { createPortalAuth, type PortalEnv } from '~/lib/portal-auth';

export const prerender = false;

export const ALL: APIRoute = async ({ request }) => {
  const env = runtimeEnv as unknown as PortalEnv;
  const auth = createPortalAuth(env);
  return auth.handler(request);
};
