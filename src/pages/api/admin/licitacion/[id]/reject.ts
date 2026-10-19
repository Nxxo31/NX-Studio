// POST /api/admin/licitacion/[id]/reject
// Cambia status='rechazada' y registra audit_log entry.

import type { APIRoute } from 'astro';
import { env as runtimeEnv } from 'cloudflare:workers';
import { z } from 'zod';
import { createDb } from '~/db';
import { getById as getLicitacion, updateStatus } from '~/server/licitacion-repo';
import { recordAudit } from '~/lib/audit';
import { withRole, getRequestIp, getRequestUA } from '~/lib/admin-handler';

export const prerender = false;

const ParamsSchema = z.object({ id: z.string().min(1) });

export const POST: APIRoute = withRole(['admin', 'gatekeeper'], async (context) => {
  const env = runtimeEnv as unknown as { DB: D1Database };
  const db = createDb(env.DB);

  const parsed = ParamsSchema.safeParse(context.params);
  if (!parsed.success) {
    return new Response(JSON.stringify({ ok: false, error: 'invalid id' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const id = parsed.data.id;
  const before = await getLicitacion(db, id);
  if (!before) {
    return new Response(JSON.stringify({ ok: false, error: 'licitacion no encontrada' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const row = await updateStatus(db, id, 'rechazada');
  await recordAudit(db, {
    actorUserId: context.actor.id,
    action: 'licitacion.reject',
    resourceType: 'licitacion',
    resourceId: id,
    beforeJson: JSON.stringify({ status: before.status }),
    afterJson: JSON.stringify({ status: 'rechazada' }),
    ip: getRequestIp(context),
    userAgent: getRequestUA(context),
  });

  return new Response(JSON.stringify({ ok: true, status: row?.status }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
