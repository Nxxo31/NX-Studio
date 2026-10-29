import type { APIRoute } from 'astro';
import { env as runtimeEnv } from 'cloudflare:workers';
import { z } from 'zod';
import { createDb } from '~/db';
import { subscribe } from '~/server/newsletter-repo';

export const prerender = false;

/**
 * POST /api/newsletter
 *
 * Alta de suscriptor al newsletter. Publico, sin auth, con honeypot
 * anti-bot. Idempotente por email.
 */

const bodySchema = z.object({
  email: z.string().email('Email inválido'),
  locale: z.string().max(8).optional().nullable(),
  source: z.string().max(120).optional().nullable(),
  honeypot: z.string().optional(),
});

export const POST: APIRoute = async ({ request }) => {
  const env = runtimeEnv as unknown as { DB: D1Database } & Record<string, unknown>;
  const body = await request.json().catch(() => null);

  if (body && typeof body === 'object' && typeof (body as { honeypot?: unknown }).honeypot === 'string') {
    if ((body as { honeypot: string }).honeypot.length > 0) {
      // Bot: respondemos ok para no darle pistas, pero no guardamos nada.
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ ok: false, error: 'validation' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  try {
    const db = createDb(env.DB);
    const row = await subscribe(db, {
      email: parsed.data.email,
      locale: parsed.data.locale ?? null,
      source: parsed.data.source ?? null,
    });
    return new Response(JSON.stringify({ ok: true, id: row.id }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  } catch (err) {
    console.error('newsletter subscribe failed:', err);
    return new Response(JSON.stringify({ ok: false, error: 'internal' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
};
