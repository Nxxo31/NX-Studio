// Portal Cliente (B7) — better-auth factory + helpers.
//
// Por qué OTRA instancia de better-auth (no reusamos src/lib/auth.ts):
// 1. Sesiones separadas: usamos schema.portalSession como tabla de sesión.
//    Si la sesión admin/auth se compromete, el portal sigue sano.
// 2. Cookie prefix distinto ('nx-studio-portal-' vs 'nx-studio') —
//    previene colisiones y permite coexistencia en el mismo dominio.
// 3. Sin OAuth (Google/GitHub) — el portal es solo email+password y
//    magic-link opcional. OAuth viviría en createAuth() para /admin.
//
// Uso típico:
//   // En API route:
//   const auth = createPortalAuth(Astro.locals.runtime.env);
//   const result = await auth.api.signInEmail({ body: { email, password }, asResponse: true });
//
//   // En el middleware (ya integrado en src/middleware.ts):
//   const userId = await getPortalUserId(request, env);
//
// Stub de magic-link: solo loguea la URL. La implementación real con Resend
// llega en T09 (con circuito anti-spam y tokens firmados).

import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { createDb } from '~/db';
import * as schema from '~/db/schema';

/**
 * Env mínimo que createPortalAuth necesita. Compatible con
 * Astro.locals.runtime.env y con un objeto parcial para tests.
 */
export type PortalEnv = {
  DB: D1Database;
  BETTER_AUTH_URL?: string;
  RESEND_API_KEY?: string;
  /** Magic link sender (email con Resend) */
  MAGIC_LINK_FROM?: string;
  /** Necesario para firmar las cookies; en dev puede faltar uno propio. */
  BETTER_AUTH_SECRET?: string;
};

/** Cookie prefix separado del admin/auth para evitar colisiones en el mismo navegador. */
const COOKIE_PREFIX = 'nx-studio-portal-';

/** Secret de desarrollo: solo se usa si no hay BETTER_AUTH_SECRET en env. */
const DEV_SECRET = 'dev-secret-not-for-production-must-be-32-chars-min-xxxxxxx';

export function createPortalAuth(env: PortalEnv) {
  const db = createDb(env.DB);

  const baseURL = env.BETTER_AUTH_URL ?? 'http://localhost:4321';

  return betterAuth({
    secret: env.BETTER_AUTH_SECRET ?? DEV_SECRET,
    baseURL,
    database: drizzleAdapter(db, {
      provider: 'sqlite',
      schema: {
        user: schema.user,
        // Reusamos la tabla user de better-auth (mismo dominio de identidad)
        // pero la sesión del portal es nuestra propia tabla portal_session.
        // Así admin/auth y portal quedan aislados.
        session: schema.portalSession,
        account: schema.account,
        verification: schema.verification,
      },
    }),
    // Cookie prefix separado del admin/auth ('nx-studio') — ver razón arriba.
    advanced: {
      cookiePrefix: COOKIE_PREFIX,
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      autoSignIn: true,
    },
    // Magic link opcional — solo activo si hay RESEND_API_KEY configurada
    magicLink: {
      enabled: Boolean(env.RESEND_API_KEY),
      sendMagicLink: async ({ email, url }: { email: string; url: string }) => {
        // Stub — implementación real en T09 con Resend + rate limit
        // eslint-disable-next-line no-console
        console.log(`[portal-auth] magic link for ${email}: ${url}`);
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 días
      updateAge: 60 * 60 * 24, // refresh diario
      cookieCache: {
        enabled: true,
        maxAge: 60 * 5, // 5 min cache para no golpear DB en cada request
      },
    },
  });
}

/**
 * Extrae el user_id de un request autenticado al portal.
 * Devuelve null si no hay sesión válida.
 *
 * Uso en middleware/API routes:
 *   const userId = await getPortalUserId(request, env);
 *   if (!userId) return new Response('unauthorized', { status: 401 });
 */
export async function getPortalUserId(request: Request, env: PortalEnv): Promise<string | null> {
  // createPortalAuth es barato (no I/O en constructor), pero D1 binding vive
  // solo dentro del request, así que es correcto instanciarlo por llamada.
  const auth = createPortalAuth(env);
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (session && session.user && typeof session.user.id === 'string') {
      return session.user.id;
    }
  } catch {
    // Sesión inválida/expirada: getSession puede tirar — tratamos como null
    return null;
  }
  return null;
}
