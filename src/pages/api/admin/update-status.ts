// POST /api/admin/update-status
// Operador-only: cambia el status de una licitacion.
//
// Control de acceso: `withRole()` — exige sesión de better-auth con rol de
// equipo ([admin, gatekeeper, designer, dev]). El middleware puebla
// locals.portalSession para /api/admin/* y valida el rol antes de llegar
// aquí; este endpoint añade la segunda capa (RBAC explícito).
//
// ANTES este endpoint NO validaba nada en la app: la única protección era
// la policy de Cloudflare Access sobre /api/admin/* (que el operador aún no
// ha creado — T02 sigue pendiente). Sin esa policy, cualquiera podía
// cambiar el estado de una licitación. Ahora la app se protege sola.
//
// Acepta form-encoded (desde /admin) o JSON. Redirige a /admin en éxito;
// devuelve 400/404 en JSON cuando la request es fetch.

import type { APIRoute } from 'astro';
import { env as runtimeEnv } from 'cloudflare:workers';
import { z } from 'zod';
import { createDb } from '~/db';
import { updateStatus } from '~/server/licitacion-repo';
import { withRole } from '~/lib/admin-handler';

export const prerender = false;

const BodySchema = z.object({
  id: z.string().min(1),
  status: z.enum(['nueva', 'contactada', 'propuesta_enviada', 'aceptada', 'rechazada', 'completada']),
});

function jsonError(status: number, message: string) {
  return new Response(JSON.stringify({ ok: false, error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const POST: APIRoute = withRole(
  ['admin', 'gatekeeper', 'designer', 'dev'],
  async (context) => {
    // Astro v6+: locals.runtime.env fue removido — binding global cloudflare:workers.
    const env = runtimeEnv as unknown as { DB: D1Database };

    const ct = context.request.headers.get('content-type') ?? '';
    const wantsJson = ct.includes('application/json');

    let parsed: z.infer<typeof BodySchema>;
    try {
      const raw = wantsJson
        ? await context.request.json()
        : Object.fromEntries((await context.request.formData()).entries());
      parsed = BodySchema.parse(raw);
    } catch {
      return jsonError(400, 'bad request: id y status válidos requeridos');
    }

    const db = createDb(env.DB);
    const row = await updateStatus(db, parsed.id, parsed.status);
    if (!row) return jsonError(404, 'licitacion no encontrada');

    if (wantsJson) {
      return new Response(JSON.stringify({ ok: true, status: row.status }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return context.redirect(`/admin?updated=${encodeURIComponent(row.status)}`, 303);
  }
);
