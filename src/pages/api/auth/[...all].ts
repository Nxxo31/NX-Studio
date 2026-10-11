// Catch-all route para better-auth.
// better-auth expone muchos endpoints (sign-in, sign-up, OAuth callbacks,
// session refresh, etc.). Un solo archivo maneja todos los paths
// `api/auth/*` y los forward al handler de better-auth.

import type { APIRoute } from 'astro';
import { createAuth } from '~/lib/auth';

export const prerender = false;

export const ALL: APIRoute = async ({ request, locals }) => {
  const env = locals.runtime.env;
  const auth = createAuth(env);
  return auth.handler(request);
};
