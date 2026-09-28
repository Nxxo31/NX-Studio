import type { APIRoute } from 'astro';
import { z } from 'zod';
import { Resend } from 'resend';

export const prerender = false;

const licitacionSchema = z.object({
  nombre: z.string().min(2, 'Nombre requerido'),
  email: z.string().email('Email inválido'),
  empresa: z.string().optional().nullable(),
  telefono: z.string().optional().nullable(),
  pais: z.string().optional().nullable(),
  tipo: z.enum(['webapp', 'landing', 'mobile', 'osint', 'testing', 'template', 'otro']),
  engagement: z.enum(['fixed', 'retainer', 'dedicated', 'tm']),
  urgencia: z.enum(['normal', 'rush', 'flexible']).default('normal'),
  features: z.array(z.string()).default([]),
  descripcion: z.string().min(20, 'Descripción mínimo 20 chars'),
  honeypot: z.string().optional(),
});

const FEATURE_BASE = 80;
const FEATURE_HOURS: Record<string, number> = {
  discovery: 8, 'design-system': 16, responsive: 6, landing: 12, dashboard: 24,
  auth: 16, api: 32, db: 20, integrations: 24, osint: 40,
  analytics: 16, seo: 8, i18n: 20, testing: 20, a11y: 8,
  security: 16, deploy: 8, docs: 12,
};
const ENGAGEMENT_BASE: Record<string, { base: number; hours: number; mult: number }> = {
  fixed:    { base: 1500, hours: 0,  mult: 1.0 },
  retainer: { base: 800,  hours: 0,  mult: 1.15 },
  dedicated:{ base: 3000, hours: 0,  mult: 1.25 },
  tm:       { base: 200,  hours: 0,  mult: 1.05 },
};
const URGENCY_MULT: Record<string, number> = { normal: 1.0, rush: 1.35, flexible: 0.85 };

function bandFor(total: number): string {
  if (total < 5000) return 'Starter';
  if (total < 15000) return 'Standard';
  if (total < 40000) return 'Growth';
  return 'Enterprise';
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();

    if (body.honeypot && body.honeypot.length > 0) {
      return new Response(JSON.stringify({ ok: false, error: 'spam_detected' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      });
    }

    const parsed = licitacionSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ ok: false, error: 'validation', issues: parsed.error.flatten() }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      });
    }

    const data = parsed.data;
    const eng = ENGAGEMENT_BASE[data.engagement];
    const urgencyMult = URGENCY_MULT[data.urgencia] ?? 1.0;

    let totalHours = eng.hours;
    let subtotalFeatures = 0;
    for (const f of data.features) {
      const h = FEATURE_HOURS[f] ?? 0;
      totalHours += h;
      subtotalFeatures += h * FEATURE_BASE;
    }
    const baseFee = eng.base;
    const subtotal = subtotalFeatures + baseFee;
    const subtotalWithMult = subtotal * eng.mult * urgencyMult;
    const totalLow = Math.round(subtotalWithMult * 0.85);
    const totalHigh = Math.round(subtotalWithMult * 1.15);
    const band = bandFor((totalLow + totalHigh) / 2);

    const id = `lic-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,6)}`;

    const resendKey = locals.runtime?.env?.RESEND_API_KEY ?? import.meta.env.RESEND_API_KEY;
    const contactEmail = locals.runtime?.env?.CONTACT_EMAIL ?? import.meta.env.CONTACT_EMAIL ?? 'nxstudioing31@gmail.com';

    if (resendKey) {
      try {
        const resend = new Resend(resendKey);
        await resend.emails.send({
          from: 'onboarding@resend.dev',
          to: contactEmail,
          subject: `[NX-Studio] Licitación #${id} · ${data.nombre}`,
          html: `
            <h2>Nueva licitación #${id}</h2>
            <p><b>Nombre:</b> ${data.nombre}</p>
            <p><b>Email:</b> ${data.email}</p>
            ${data.empresa ? `<p><b>Empresa:</b> ${data.empresa}</p>` : ''}
            ${data.telefono ? `<p><b>Teléfono:</b> ${data.telefono}</p>` : ''}
            ${data.pais ? `<p><b>País:</b> ${data.pais}</p>` : ''}
            <p><b>Tipo:</b> ${data.tipo} · <b>Engagement:</b> ${data.engagement} · <b>Urgencia:</b> ${data.urgencia}</p>
            <p><b>Rango:</b> $${totalLow.toLocaleString()} - $${totalHigh.toLocaleString()} (${band})</p>
            <p><b>Features:</b> ${data.features.join(', ') || '(ninguna)'}</p>
            <hr/>
            <p>${data.descripcion.replace(/\n/g, '<br/>')}</p>
          `,
        });
      } catch (err) {
        console.error('Resend error (non-blocking):', err);
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        licitacion_id: id,
        cotizacion: {
          total_low: totalLow,
          total_high: totalHigh,
          total_hours: totalHours,
          band,
        },
        next_steps: [
          'Revisión de scope por Sebastian en 24h hábiles',
          'Propuesta detallada con mockup preview HTML',
          'Link de agendamiento para llamada de scoping',
        ],
      }),
      {
        status: 200,
        headers: { 'content-type': 'application/json' },
      },
    );
  } catch (err) {
    console.error('licitacion error:', err);
    return new Response(JSON.stringify({ ok: false, error: 'internal', detail: String(err) }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
};