import type { APIRoute } from 'astro';
import { z } from 'zod';
import { insertCotizacion } from '../../lib/db';
import { computeQuote } from '../../lib/cotizador';

export const prerender = false;

const schema = z.object({
  nombre: z.string().min(2).max(120),
  email: z.string().email().max(160),
  engagement: z.enum(['fixed', 'retainer', 'dedicated', 'tm']).default('fixed'),
  features: z.array(z.string()).max(50).default([]),
  modifiers: z.array(z.string()).max(10).default([]),
  licitacion_id: z.number().int().positive().optional().nullable(),
});

export const POST: APIRoute = async ({ request }) => {
  try {
    const raw = await request.json();
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      return new Response(JSON.stringify({ ok: false, error: 'validation_error', issues: parsed.error.flatten() }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      });
    }
    const data = parsed.data;
    const quote = computeQuote({
      shape: data.engagement,
      featureIds: data.features,
      modifierIds: data.modifiers,
    });

    const result = insertCotizacion.run({
      licitacion_id: data.licitacion_id || null,
      nombre: data.nombre,
      email: data.email,
      engagement: data.engagement,
      feature_ids_json: JSON.stringify(data.features),
      modifier_ids_json: JSON.stringify(data.modifiers),
      total_low: quote.totalLow,
      total_high: quote.totalHigh,
      total_hours: quote.totalHours,
      band: quote.bandLabel,
    });

    return new Response(
      JSON.stringify({
        ok: true,
        cotizacion_id: Number(result.lastInsertRowid),
        quote,
      }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );
  } catch (err) {
    console.error('[api/cotizacion] error:', err);
    return new Response(JSON.stringify({ ok: false, error: 'internal_error' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
};