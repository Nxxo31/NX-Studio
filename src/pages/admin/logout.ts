// /admin/logout — endpoint POST que cierra la sesión better-auth y redirige.
//
// Better-auth expone /api/auth/sign-out como POST. La cookie de sesión tiene
// cookie prefix 'nx-studio' (mismo que /admin), así que la invalidación
// desde aquí cubre tanto el flujo de auth como las cookies de admin.
//
// Estrategia: forward al handler better-auth y devolver su respuesta. El
// handler setea headers que invalidan la cookie, así que encadenamos un
// redirect al /admin/login si el handler emite 200/redirect.

import type { APIRoute } from 'astro';
import { env as runtimeEnv } from 'cloudflare:workers';
import { createAuth } from '~/lib/auth';

export const prerender = false;

export const ALL: APIRoute = async ({ request }) => {
  const env = runtimeEnv as unknown as Parameters<typeof createAuth>[0];
  const auth = createAuth(env);

  // Construimos un Request POST para sign-out
  const signOutReq = new Request(new URL('/api/auth/sign-out', request.url), {
    method: 'POST',
    headers: request.headers,
  });

  let authRes: Response;
  try {
    authRes = await auth.handler(signOutReq);
  } catch {
    authRes = new Response('ok', { status: 200 });
  }

  // Construimos una respuesta 303 → /admin/login, preservando headers
  // (Set-Cookie) que invalidan la sesión.
  const headers = new Headers();
  for (const [k, v] of authRes.headers.entries()) {
    if (k.toLowerCase() === 'set-cookie') {
      headers.append('set-cookie', v);
    }
  }
  headers.set('Location', '/admin/login');
  return new Response(null, { status: 303, headers });
};
