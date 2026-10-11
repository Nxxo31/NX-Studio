import type { APIRoute } from 'astro';
import { createDb } from '~/db';
import { createEmailService } from '~/lib/email';
import { handleLicitacionSubmit, type SubmitDeps } from '~/server/licitacion-handler';
import { getUserIdFromRequest } from '~/lib/session';

export const prerender = false;

/**
 * POST /api/licitacion
 *
 * Submit público del formulario /contacto. NO requiere autenticación —
 * es el punto de entrada para que cualquier visitante envíe una licitacion.
 *
 * Si la request trae una cookie de sesión válida, se vincula `user_id` a la
 * licitacion. Si no, sigue siendo anónima.
 *
 * Validación con Zod (esquema en ~/server/licitacion-handler), pricing
 * engine server-side (computeQuote desde ~/data/pricing), persistencia en D1,
 * notificación por email no bloqueante.
 */
export const POST: APIRoute = async ({ request, locals }) => {
  const env = locals.runtime.env;

  const db = createDb(env.DB);
  const email = createEmailService({
    apiKey: env.RESEND_API_KEY ?? import.meta.env.RESEND_API_KEY ?? '',
    defaultFrom: 'onboarding@resend.dev',
  });

  const deps: SubmitDeps = {
    db,
    email,
    contactEmail:
      env.CONTACT_EMAIL ??
      import.meta.env.CONTACT_EMAIL ??
      'nxstudioing31@gmail.com',
    authEnv: env,
    resolveUserId: getUserIdFromRequest,
  };

  const body = await request.json().catch(() => null);
  const result = await handleLicitacionSubmit(body, request, deps);

  const status = result.ok ? 200 : result.error === 'spam_detected' ? 400 : result.error === 'validation' ? 400 : 500;

  return new Response(JSON.stringify(result), {
    status,
    headers: { 'content-type': 'application/json' },
  });
};
