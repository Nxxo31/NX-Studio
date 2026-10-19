// Admin Panel (B8) — guard extraído como función pura para testeo.
//
// Diferencias con portal-guard:
//   - Sesión de better-auth (cookie prefix 'nx-studio'), no portal_session.
//   - Valida el rol del user contra la whitelist [admin, gatekeeper, designer, dev].
//   - Si el user está autenticado pero su rol NO está en la whitelist
//     (caso típico: user nuevo con role='cliente' default), devuelve 403
//     con HTML para que el operador vea un mensaje legible.
//   - Si no hay sesión, redirige a /admin/login preservando el destino.
//
// El middleware en src/middleware.ts usa `astro:middleware` (módulo virtual
// que solo existe en el bundle del Pages Function). Extraemos la decisión a
// una función pura que el caller transforma en Response / next().
//
// Resultado:
//   { action: 'next', adminSession } — deja pasar con sesión validada
//   { action: 'redirect', location } — redirige a /admin/login
//   { action: 'forbidden', reason }  — 403 con mensaje legible

import { createAuth, type AuthEnv } from './auth';

const PUBLIC_ADMIN_PATHS = ['/admin/login'];

export type AdminRole = 'admin' | 'gatekeeper' | 'designer' | 'dev';

export const ADMIN_ROLES: AdminRole[] = ['admin', 'gatekeeper', 'designer', 'dev'];

export type AdminGuardResult =
  | { action: 'next'; adminSession: { user: { id: string; role: AdminRole; email?: string; name?: string } } }
  | { action: 'redirect'; location: string }
  | { action: 'forbidden'; reason: 'role-not-in-team' };

export interface AdminGuardContext {
  /** Pathname normalizado (sin base '/NX-Studio') */
  pathname: string;
  /** Request entrante — para extraer cookies */
  request: Request;
  /** Env de Cloudflare (con DB) o mock para tests */
  env: AuthEnv;
}

function isAdminPath(pathname: string): boolean {
  return pathname === '/admin' || pathname.startsWith('/admin/');
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function forbiddenPage(pathname: string): Response {
  // Mensaje literal del spec: "Acceso restringido al equipo NX-Studio"
  const safePath = escapeHtml(pathname);
  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>403 — Acceso restringido</title>
<style>
  body { font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; background: #0a0b14; color: #e7e9ee; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1rem; }
  main { max-width: 32rem; text-align: center; }
  h1 { font-size: 1.25rem; margin: 0 0 0.5rem; }
  p { margin: 0.5rem 0; color: #9aa0ad; }
  code { background: rgba(255,255,255,0.05); padding: 0.15rem 0.4rem; border-radius: 4px; font-size: 0.85em; }
  a { color: #ff6b3d; text-decoration: underline; }
</style>
</head>
<body>
  <main>
    <h1>403 · Acceso restringido al equipo NX-Studio</h1>
    <p>Tu cuenta no tiene permisos para acceder al panel.</p>
    <p>Ruta: <code>${safePath}</code></p>
    <p><a href="/admin/login">Volver al login</a></p>
  </main>
</body>
</html>`;
  return new Response(html, {
    status: 403,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

export async function adminGuard(ctx: AdminGuardContext): Promise<AdminGuardResult | { action: 'bypass' }> {
  if (!isAdminPath(ctx.pathname)) {
    return { action: 'bypass' };
  }

  // /admin/login es público: el usuario aún no tiene sesión y necesita ver el form.
  const isPublic = PUBLIC_ADMIN_PATHS.some(p => ctx.pathname === p || ctx.pathname.startsWith(p + '/'));
  if (isPublic) return { action: 'bypass' };

  const auth = createAuth(ctx.env);
  let session: Awaited<ReturnType<typeof auth.api.getSession>>;
  try {
    session = await auth.api.getSession({ headers: ctx.request.headers });
  } catch {
    session = null;
  }
  if (!session || !session.user || typeof session.user.id !== 'string') {
    return {
      action: 'redirect',
      location: `/admin/login?from=${encodeURIComponent(ctx.pathname)}`,
    };
  }

  const role = ((session.user as unknown as { role?: string }).role ?? 'cliente') as string;
  if (!(ADMIN_ROLES as string[]).includes(role)) {
    return { action: 'forbidden', reason: 'role-not-in-team' };
  }

  return {
    action: 'next',
    adminSession: {
      user: {
        id: session.user.id,
        role: role as AdminRole,
        email: session.user.email ?? undefined,
        name: session.user.name ?? undefined,
      },
    },
  };
}

/** Construye la Response 403 con el mensaje del spec. Útil para tests y
 *  para que el caller la devuelva sin acoplarse al HTML interno. */
export function renderAdminForbidden(pathname: string): Response {
  return forbiddenPage(pathname);
}
