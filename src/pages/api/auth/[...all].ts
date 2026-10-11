// Catch-all route para better-auth.
// better-auth expone muchos endpoints (sign-in, sign-up, OAuth callbacks,
// session refresh, etc.). Un solo archivo maneja todos los paths
// `api/auth/*` y los forward al handler de better-auth.

import type { APIRoute } from 'astro';
import { env as runtimeEnv } from 'cloudflare:workers';
import { createAuth } from '~/lib/auth';

export const prerender = false;

export const ALL: APIRoute = async ({ request }) => {
  // Astro v6+: locals.runtime.env fue removido — binding global `cloudflare:workers`.
  const env = runtimeEnv as unknown as Parameters<typeof createAuth>[0];
  const auth = createAuth(env);
  return auth.handler(request);
};
