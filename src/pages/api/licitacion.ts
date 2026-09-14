import type { APIRoute } from 'astro';
import { z } from 'zod';
import { insertLicitacion, insertLog, getLicitacionByEmail, insertCotizacion } from '../../lib/db';
import { computeQuote, FEATURES } from '../../lib/cotizador';

export const prerender = false;

const schema = z.object({
  nombre: z.string().min(2).max(120),
  email: z.string().email().max(160),
  empresa: z.string().max(160).optional().nullable(),
  telefono: z.string().max(40).optional().nullable(),
  pais: z.string().max(80).optional().nullable(),
  tipo: z.enum(['landing', 'webapp', 'mobile', 'osint', 'testing', 'template', 'otro']),
  features: z.array(z.string()).max(50).default([]),
  engagement: z.enum(['fixed', 'retainer', 'dedicated', 'tm']).default('fixed'),
  modifiers: z.array(z.string()).max(10).default([]),
  urgencia: z.enum(['normal', 'rush', 'flexible']).default('normal'),
  descripcion: z.string().min(20).max(4000),
  honeypot: z.string().max(0).optional().default(''),
});

export const POST: APIRoute = async ({ request }) => {
  try {
    const raw = await request.json();
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: 'validation_error',
          issues: parsed.error.flatten().fieldErrors,
        }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      );
    }
    const data = parsed.data;

    // Honeypot
    if (data.honeypot && data.honeypot.length > 0) {
      return new Response(JSON.stringify({ ok: false, error: 'bot_detected' }), { status: 400 });
    }

    // Calcular presupuesto estimado con el cotizador
    const validFeatureIds = data.features.filter((id) => FEATURES.some((f) => f.id === id));
    const quote = computeQuote({
      shape: data.engagement,
      featureIds: validFeatureIds,
      modifierIds: data.modifiers,
    });

    // Insertar licitación
    const result = insertLicitacion.run({
      nombre: data.nombre,
      email: data.email,
      empresa: data.empresa || null,
      telefono: data.telefono || null,
      pais: data.pais || null,
      tipo: data.tipo,
      features_json: JSON.stringify(validFeatureIds),
      engagement: data.engagement,
      modifiers_json: JSON.stringify(data.modifiers),
      urgencia: data.urgencia,
      descripcion: data.descripcion,
      presupuesto_estimado_low: quote.totalLow,
      presupuesto_estimado_high: quote.totalHigh,
      horas_estimadas: quote.totalHours,
      status: 'nueva',
    });

    const licitacionId = Number(result.lastInsertRowid);

    // Insertar también una cotización persistida
    insertCotizacion.run({
      licitacion_id: licitacionId,
      nombre: data.nombre,
      email: data.email,
      engagement: data.engagement,
      feature_ids_json: JSON.stringify(validFeatureIds),
      modifier_ids_json: JSON.stringify(data.modifiers),
      total_low: quote.totalLow,
      total_high: quote.totalHigh,
      total_hours: quote.totalHours,
      band: quote.bandLabel,
    });

    insertLog.run(licitacionId, 'licitacion_creada', `tipo=${data.tipo} engagement=${data.engagement}`);

    return new Response(
      JSON.stringify({
        ok: true,
        licitacion_id: licitacionId,
        cotizacion: {
          total_low: quote.totalLow,
          total_high: quote.totalHigh,
          total_hours: quote.totalHours,
          band: quote.bandLabel,
          engagement: data.engagement,
          features: validFeatureIds,
        },
        next_steps: [
          'Recibirás un email de confirmación en los próximos minutos.',
          'El agente IA de NX-Studio leerá tu petición y enviará una propuesta detallada.',
          'Si todo encaja, agendamos 30min de scoping call.',
        ],
      }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );
  } catch (err) {
    console.error('[api/licitacion] error:', err);
    return new Response(
      JSON.stringify({ ok: false, error: 'internal_error', detail: String(err) }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
};

export const GET: APIRoute = async () => {
  const last = getLicitacionByEmail.get('demo@nxstudio.dev');
  return new Response(JSON.stringify({ ok: true, hint: 'POST con payload para crear licitación', sample: last }), {
    headers: { 'content-type': 'application/json' },
  });
};