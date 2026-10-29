import type { APIRoute } from 'astro';
import { env as runtimeEnv } from 'cloudflare:workers';
import { z } from 'zod';
import { createDb } from '~/db';
import { trackEvent } from '~/server/analytics-repo';

export const prerender = false;

/**
 * POST /api/analytics
 *
 * Receptor de eventos de primera parte (page views + conversiones).
 * Lo llama el beacon del cliente (src/lib/attribution.ts). Es best-effort:
 * si D1 falla, la pagina del visitante no se ve afectada.
 */

const eventSchema = z.object({
  name: z.string().min(1).max(64),
  path: z.string().max(200).optional().nullable(),
  locale: z.string().max(8).optional().nullable(),
  utm_source: z.string().max(120).optional().nullable(),
  referrer: z.string().max(300).optional().nullable(),
  props: z.record(z.unknown()).optional(),
});

export const POST: APIRoute = async ({ request }) => {
  const env = runtimeEnv as unknown as { DB: D1Database } & Record<string, unknown>;
  const body = await request.json().catch(() => null);
  const parsed = eventSchema.safeParse(body);

  if (!parsed.success) {
    return new Response(null, { status: 400 });
  }

  const data = parsed.data;
  try {
    const db = createDb(env.DB);
    await trackEvent(db, {
      name: data.name,
      path: data.path ?? null,
      locale: data.locale ?? null,
      utmSource: data.utm_source ?? null,
      referrer: data.referrer ?? null,
      props: data.props ?? undefined,
    });
    return new Response(null, { status: 204 });
  } catch (err) {
    console.error('analytics event failed (non-blocking):', err);
    return new Response(null, { status: 202 });
  }
};
