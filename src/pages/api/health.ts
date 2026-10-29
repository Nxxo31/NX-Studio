import type { APIRoute } from 'astro';
import { env as runtimeEnv } from 'cloudflare:workers';

export const prerender = false;

/**
 * GET /api/health
 *
 * Sonda de operacion sin exponer secretos: devuelve SOLO booleanos y
 * nombres de modo. El operador la usa para verificar, tras un deploy,
 * que el aviso de leads esta en modo live y no en mock.
 *
 * - email: 'live' = RESEND_API_KEY presente (los avisos salen). 'mock' =
 *   falta la key: el lead se guarda en D1 pero NO se avisa a nadie.
 * - from: 'dominio' = EMAIL_FROM configurado (entrega a cualquier
 *   destinatario). 'onboarding' = solo entrega al email de la cuenta Resend.
 */
export const GET: APIRoute = async () => {
  const env = runtimeEnv as unknown as {
    RESEND_API_KEY?: string;
    CONTACT_EMAIL?: string;
    EMAIL_FROM?: string;
  } & Record<string, unknown>;

  const hasKey = Boolean(env.RESEND_API_KEY);
  const from = env.EMAIL_FROM ?? '';

  return new Response(
    JSON.stringify({
      ok: true,
      email: hasKey ? 'live' : 'mock',
      email_from: from ? 'dominio' : 'onboarding',
      contact_email_configurado: Boolean(env.CONTACT_EMAIL),
      aviso: hasKey
        ? null
        : 'RESEND_API_KEY ausente: los leads se guardan pero no se avisa por email (wrangler secret put RESEND_API_KEY --config dist/server/wrangler.json)',
    }),
    {
      status: 200,
      headers: {
        'content-type': 'application/json',
        'cache-control': 'no-store',
      },
    }
  );
};
