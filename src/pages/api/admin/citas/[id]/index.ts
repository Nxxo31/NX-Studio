// POST /api/admin/citas/[id]
//
// Acciones del operador sobre una cita:
//   - confirm-link  → adjunta el enlace de Meet que confirms a mano
//   - cancel        → cancela la cita
//   - complete      → marca la llamada como realizada
//   - notes         → guarda notas de la llamada
//
// Toda acción deja rastro en audit_log.

import type { APIRoute } from 'astro';
import { env as runtimeEnv } from 'cloudflare:workers';
import { z } from 'zod';
import { createDb } from '~/db';
import {
  getById,
  updateEstado,
  updateMeet,
  updateNotas,
} from '~/server/cita-repo';
import { recordAudit } from '~/lib/audit';
import { withRole, getRequestIp, getRequestUA } from '~/lib/admin-handler';

export const prerender = false;

const ParamsSchema = z.object({ id: z.string().min(1) });

const BodySchema = z.object({
  action: z.enum(['confirm-link', 'cancel', 'complete', 'notes']),
  meet_url: z.string().url().optional(),
  notas: z.string().max(1000).optional(),
});

/**
 * Acepta los dos formatos que llegan aquí:
 *   - JSON (fetch desde el cliente)
 *   - application/x-www-form-urlencoded (form nativo de /admin/citas)
 */
async function leerBody(request: Request): Promise<unknown> {
  const tipo = request.headers.get('content-type') ?? '';
  if (tipo.includes('application/json')) {
    return request.json().catch(() => null);
  }
  if (tipo.includes('form-urlencoded') || tipo.includes('multipart/form-data')) {
    const form = await request.formData().catch(() => null);
    if (!form) return null;
    const datos: Record<string, string> = {};
    for (const [key, value] of form.entries()) {
      if (typeof value === 'string') datos[key] = value;
    }
    return datos;
  }
  return request.json().catch(() => null);
}

export const POST: APIRoute = withRole(
  ['admin', 'gatekeeper', 'designer', 'dev'],
  async (context) => {
    const env = runtimeEnv as unknown as { DB: D1Database };
    const db = createDb(env.DB);

    const parsedParams = ParamsSchema.safeParse(context.params);
    if (!parsedParams.success) {
      return new Response(JSON.stringify({ ok: false, error: 'id inválido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const id = parsedParams.data.id;

    const raw = await leerBody(context.request);
    const esForm = !(
      context.request.headers.get('content-type') ?? ''
    ).includes('application/json');
    const parsedBody = BodySchema.safeParse(raw);
    if (!parsedBody.success) {
      return new Response(JSON.stringify({ ok: false, error: 'payload inválido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const body = parsedBody.data;

    const before = await getById(db, id);
    if (!before) {
      return new Response(JSON.stringify({ ok: false, error: 'cita no encontrada' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let row = before;

    switch (body.action) {
      case 'confirm-link': {
        if (!body.meet_url) {
          return new Response(JSON.stringify({ ok: false, error: 'meet_url requerido' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        row = (await updateMeet(db, id, { url: body.meet_url })) ?? before;
        break;
      }
      case 'cancel':
        row = (await updateEstado(db, id, 'cancelada')) ?? before;
        break;
      case 'complete':
        row = (await updateEstado(db, id, 'completada')) ?? before;
        break;
      case 'notes':
        row = (await updateNotas(db, id, body.notas ?? null)) ?? before;
        break;
    }

    await recordAudit(db, {
      actorUserId: context.actor.id,
      action: `cita.${body.action}`,
      resourceType: 'cita',
      resourceId: id,
      beforeJson: JSON.stringify({
        estado: before.estado,
        meet_url: before.meetUrl,
        notas: before.notas,
      }),
      afterJson: JSON.stringify({
        estado: row.estado,
        meet_url: row.meetUrl,
        notas: row.notas,
      }),
      ip: getRequestIp(context),
      userAgent: getRequestUA(context),
    });

    // Si viene de un form nativo, redirigimos al listado (un JSON crudo en el
    // navegador sería confuso para el operador).
    if (esForm) {
      return Response.redirect('/admin/citas', 303);
    }

    return new Response(JSON.stringify({ ok: true, cita: row }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
);
