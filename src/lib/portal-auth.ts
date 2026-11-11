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
// IMPORTANTE — el prefijo de cookie DEBE coincidir entre el factory y el
// handler que emite la sesión. El catch-all del portal vive en
// src/pages/api/portal/auth/[...all].ts y usa createPortalAuth() con
// `basePath: '/api/portal/auth'`, así que la cookie que emite es
// `__Secure-nx-studio-portal-.session_token` — la misma que lee
// getPortalUserId() aquí abajo. Si alguien cambia el prefix en un lado y no
// en el otro, el portal entra en loop de login (ver skill nx-studio).
//
// Uso típico:
//   // En API route:
//   const auth = createPortalAuth(env);
//   const result = await auth.api.signInEmail({ body: { email, password }, asResponse: true });
//
//   // En el middleware (ya integrado en src/middleware.ts):
//   const userId = await getPortalUserId(request, env);
//
// Magic link: se envía por Resend cuando hay RESEND_API_KEY; sin ella, el
// enlace se registra en consola (modo dev) y la UI avisa que aún no está
// disponible.

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
  /** Remitente del magic link (dominio verificado en Resend). */
  MAGIC_LINK_FROM?: string;
  /** Necesario para firmar las cookies; en dev puede faltar uno propio. */
  BETTER_AUTH_SECRET?: string;
};

/** Cookie prefix separado del admin/auth para evitar colisiones en el mismo navegador. */
const COOKIE_PREFIX = 'nx-studio-portal-';

/**
 * Base path del catch-all del portal. Debe coincidir con la ruta del
 * endpoint (src/pages/api/portal/auth/[...all].ts) — better-auth recorta
 * este prefijo antes de matchear las rutas internas.
 */
export const PORTAL_AUTH_BASE_PATH = '/api/portal/auth';

/**
 * Orígenes de desarrollo permitidos por better-auth.
 *
 * `trustedOrigins` compara el header `Origin` del browser contra la lista.
 * En local el servidor corre en http://127.0.0.1:4322 pero BETTER_AUTH_URL
 * apunta al dominio de producción → sin estas entradas, better-auth responde
 * "Invalid origin" y el login desde el navegador NO funciona en dev.
 *
 * En producción el origen real (BETTER_AUTH_URL) sigue siendo el permitido
 * principal; estas entradas solo habilitan loopback.
 */
const DEV_ORIGINS = [
  'http://localhost:4321',
  'http://127.0.0.1:4321',
  'http://localhost:4322',
  'http://127.0.0.1:4322',
];

/** Secret de desarrollo: solo se usa si no hay BETTER_AUTH_SECRET en env. */
const DEV_SECRET = 'dev-secret-not-for-production-must-be-32-chars-min-xxxxxxx';

export function createPortalAuth(env: PortalEnv) {
  const db = createDb(env.DB);

  const baseURL = env.BETTER_AUTH_URL ?? 'http://localhost:4321';

  return betterAuth({
    secret: env.BETTER_AUTH_SECRET ?? DEV_SECRET,
    baseURL,
    // Prefijo de ruta propio: las rutas internas del portal cuelgan de
    // /api/portal/auth/* en vez de /api/auth/*.
    basePath: PORTAL_AUTH_BASE_PATH,
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
    user: {
      additionalFields: {
        role: {
          type: 'string',
          defaultValue: 'cliente',
          required: false,
          input: false,
        },
        empresa: {
          type: 'string',
          required: false,
          input: true,
        },
        telefono: {
          type: 'string',
          required: false,
          input: true,
        },
        pais: {
          type: 'string',
          required: false,
          input: true,
        },
      },
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      autoSignIn: true,
      // Reset de contraseña del portal: envía el enlace por Resend.
      sendResetPassword: async ({ email, url }: { email?: string; url: string }) => {
        await enviarEmailMagicLink(env, email ?? '', url, 'restablecer tu contraseña');
      },
    },
    // Magic link: solo activo si hay RESEND_API_KEY configurada
    magicLink: {
      enabled: Boolean(env.RESEND_API_KEY),
      sendMagicLink: async ({ email, url }: { email?: string; url: string }) => {
        await enviarEmailMagicLink(env, email ?? '', url, 'entrar al portal');
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
    // Sin esto, better-auth rechaza el login del navegador en local con
    // "Invalid origin" (el Origin del browser no es el BETTER_AUTH_URL).
    trustedOrigins: [
      ...new Set([baseURL, ...DEV_ORIGINS]),
    ],
  });
}

/**
 * Envía el magic link por Resend. Sin RESEND_API_KEY cae en modo consola:
 * el enlace queda en el log del worker (útil en dev), nunca se pierde.
 */
async function enviarEmailMagicLink(
  env: PortalEnv,
  email: string,
  url: string,
  accion: string
): Promise<void> {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`[portal-auth] magic link (${accion}) para ${email}: ${url}`);
    return;
  }
  try {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from: env.MAGIC_LINK_FROM ?? 'NX-Studio <onboarding@resend.dev>',
        to: [email],
        subject: `NX-Studio — enlace para ${accion}`,
        html: `<p>Hola,</p><p>Usa este enlace para ${accion}:</p><p><a href="${url}">${url}</a></p><p>El enlace expira en poco tiempo. Si no lo pediste, ignora este correo.</p>`,
      }),
    });
    if (!resp.ok) {
      const detalle = await resp.text().catch(() => '');
      console.error('[portal-auth] Resend magic link failed:', resp.status, detalle.slice(0, 200));
    }
  } catch (err) {
    console.error('[portal-auth] magic link error:', err);
  }
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
