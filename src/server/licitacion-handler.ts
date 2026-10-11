// Licitacion endpoint logic — pure function, testable sin HTTP.
// El wrapper Astro en src/pages/api/licitacion.ts solo hace request → handleLicitacionSubmit.

import { z } from 'zod';
import type { DB } from '~/db';
import { create } from '~/server/licitacion-repo';
import type { EmailService } from '~/lib/email';
import type { AuthEnv } from '~/lib/auth';
import { getUserIdFromRequest } from '~/lib/session';

export const licitacionSchema = z.object({
  nombre: z.string().min(2, 'Nombre requerido'),
  email: z.string().email('Email inválido'),
  empresa: z.string().optional().nullable(),
  telefono: z.string().optional().nullable(),
  pais: z.string().optional().nullable(),
  tipo: z.enum(['webapp', 'landing', 'mobile', 'testing', 'template', 'otro']),
  engagement: z.enum(['fixed', 'retainer', 'dedicated', 'tm']),
  urgencia: z.enum(['normal', 'rush', 'flexible']).default('normal'),
  features: z.array(z.string()).default([]),
  descripcion: z.string().min(20, 'Descripción mínimo 20 chars'),
  honeypot: z.string().optional(),
});

export type LicitacionInput = z.infer<typeof licitacionSchema>;

export type SubmitDeps = {
  db: DB;
  email: EmailService;
  contactEmail: string;
  authEnv: AuthEnv;
  // Inyectable para tests (default: getUserIdFromRequest)
  resolveUserId?: (request: Request, env: AuthEnv) => Promise<string | null>;
};

export type SubmitResult =
  | {
      ok: true;
      licitacion_id: string;
      cotizacion: {
        total_low: number;
        total_high: number;
        banda: string;
      };
      next_steps: string[];
    }
  | {
      ok: false;
      error: 'spam_detected' | 'validation' | 'internal';
      issues?: z.ZodError['issues'];
      detail?: string;
    };

/**
 * Procesa el submit de una licitacion:
 * 1. Valida con Zod
 * 2. Honeypot anti-spam
 * 3. Lee sesión opcional para vincular user_id
 * 4. Persiste en DB (con pricing server-side)
 * 5. Envía email de notificación al operador (no bloqueante)
 *
 * NUNCA rechaza por falta de sesión — el endpoint es público.
 */
export async function handleLicitacionSubmit(
  rawBody: unknown,
  request: Request,
  deps: SubmitDeps
): Promise<SubmitResult> {
  try {
    const body = rawBody as Record<string, unknown> | null;
    if (!body) {
      return { ok: false, error: 'validation' };
    }

    // Honeypot
    if (typeof body.honeypot === 'string' && body.honeypot.length > 0) {
      return { ok: false, error: 'spam_detected' };
    }

    // Validación
    const parsed = licitacionSchema.safeParse(body);
    if (!parsed.success) {
      return { ok: false, error: 'validation', issues: parsed.error.issues };
    }
    const data = parsed.data;

    // Sesión opcional
    const resolveUserId = deps.resolveUserId ?? getUserIdFromRequest;
    const userId = await resolveUserId(request, deps.authEnv).catch(() => null);

    // Persistir
    const row = await create(deps.db, {
      nombre: data.nombre,
      email: data.email,
      empresa: data.empresa ?? null,
      telefono: data.telefono ?? null,
      pais: data.pais ?? null,
      tipo: data.tipo,
      engagement: data.engagement,
      urgencia: data.urgencia,
      featureIds: data.features,
      descripcion: data.descripcion,
      modifierIds: [],
      userId,
    });

    // Email al operador — NO debe romper el submit si falla
    try {
      await deps.email.send({
        to: deps.contactEmail,
        subject: `[NX-Studio] Licitación #${row.id.slice(0, 8)} · ${data.nombre}`,
        html: `
          <h2>Nueva licitación #${row.id}</h2>
          <p><b>Nombre:</b> ${escapeHtml(data.nombre)}</p>
          <p><b>Email:</b> ${escapeHtml(data.email)}</p>
          ${data.empresa ? `<p><b>Empresa:</b> ${escapeHtml(data.empresa)}</p>` : ''}
          ${data.telefono ? `<p><b>Teléfono:</b> ${escapeHtml(data.telefono)}</p>` : ''}
          ${data.pais ? `<p><b>País:</b> ${escapeHtml(data.pais)}</p>` : ''}
          <p><b>Tipo:</b> ${data.tipo} · <b>Engagement:</b> ${data.engagement} · <b>Urgencia:</b> ${data.urgencia}</p>
          <p><b>Rango:</b> $${row.precioMin.toLocaleString()} - $${row.precioMax.toLocaleString()} (${row.banda})</p>
          <p><b>Features:</b> ${data.features.join(', ') || '(ninguna)'}</p>
          ${userId ? `<p><b>User ID:</b> ${userId}</p>` : ''}
          <hr/>
          <p>${escapeHtml(data.descripcion).replace(/\n/g, '<br/>')}</p>
        `,
      });
    } catch (err) {
      console.error('Email notification failed (non-blocking):', err);
    }

    return {
      ok: true,
      licitacion_id: row.id,
      cotizacion: {
        total_low: row.precioMin,
        total_high: row.precioMax,
        band: row.banda, // frontend usa .band, no .banda
      },
      next_steps: [
        'Revisión de scope por Sebastian en 24h hábiles',
        'Propuesta detallada con mockup preview HTML',
        'Link de agendamiento para llamada de scoping',
      ],
    };
  } catch (err) {
    console.error('licitacion error:', err);
    return { ok: false, error: 'internal', detail: String(err) };
  }
}

function escapeHtml(s: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return s.split('').map((ch) => map[ch] ?? ch).join('');
}
