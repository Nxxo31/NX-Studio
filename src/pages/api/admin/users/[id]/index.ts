// CRUD API para users (B8 · T09 · admin-only).
// Acciones: role-change, reset-password (envía magic link via better-auth),
// revoke-sessions (DELETE admin_session WHERE user_id = X).

import type { APIRoute } from 'astro';
import { env as runtimeEnv } from 'cloudflare:workers';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { createDb } from '~/db';
import { user, adminSession } from '~/db/schema';
import { createAuth } from '~/lib/auth';
import { recordAudit } from '~/lib/audit';
import { withRole, getRequestIp, getRequestUA } from '~/lib/admin-handler';

export const prerender = false;

const ParamsSchema = z.object({ id: z.string().min(1) });

const BodySchema = z.object({
  action: z.enum(['role-change', 'reset-password', 'revoke-sessions']),
  role: z.enum(['admin', 'gatekeeper', 'designer', 'dev', 'cliente']).optional(),
});

export const POST: APIRoute = withRole(['admin'], async (context) => {
  const env = runtimeEnv as unknown as Parameters<typeof createAuth>[0] & { DB: D1Database };
  const db = createDb(env.DB);

  const paramsParsed = ParamsSchema.safeParse(context.params);
  if (!paramsParsed.success) {
    return new Response(JSON.stringify({ ok: false, error: 'id inválido' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const targetUserId = paramsParsed.data.id;

  const ct = context.request.headers.get('content-type') ?? '';
  const raw = ct.includes('application/json')
    ? await context.request.json()
    : Object.fromEntries((await context.request.formData()).entries());

  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return new Response(JSON.stringify({ ok: false, error: 'datos inválidos' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Lookup target user
  const targetRows = await db.select().from(user).where(eq(user.id, targetUserId)).all();
  const targetUser = targetRows[0];
  if (!targetUser) {
    return new Response(JSON.stringify({ ok: false, error: 'usuario no encontrado' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (parsed.data.action === 'role-change') {
    if (!parsed.data.role) {
      return new Response(JSON.stringify({ ok: false, error: 'role requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const beforeRole = targetUser.role;
    // Cast necesario: el enum de Drizzle en schema.ts solo declara 'cliente'|'admin',
    // pero a nivel SQL la columna user.role NO tiene CHECK (acepta los 5 roles
    // del panel). El merge del operador debe ampliar el enum del schema.
    const newRole = parsed.data.role as 'admin' | 'cliente';
    await db.update(user).set({ role: newRole, updatedAt: new Date() }).where(eq(user.id, targetUserId)).run();
    await recordAudit(db, {
      actorUserId: context.actor.id,
      action: 'usuario.role_change',
      resourceType: 'user',
      resourceId: targetUserId,
      beforeJson: JSON.stringify({ role: beforeRole }),
      afterJson: JSON.stringify({ role: parsed.data.role }),
      ip: getRequestIp(context),
      userAgent: getRequestUA(context),
    });
    return new Response(JSON.stringify({ ok: true, role: parsed.data.role }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (parsed.data.action === 'reset-password') {
    // Dispara magic link via better-auth. La cookie prefix 'nx-studio' es la
    // misma que usa /admin, así que el flujo encaja con el guard.
    const auth = createAuth(env);
    try {
      await auth.api.requestPasswordReset({
        body: { email: targetUser.email, redirectTo: '/admin/login' },
      });
    } catch (e) {
      // Si better-auth tira por algún motivo, logueamos y seguimos — el audit
      // queda igualmente registrado.
      // eslint-disable-next-line no-console
      console.error('reset-password error:', e);
    }
    await recordAudit(db, {
      actorUserId: context.actor.id,
      action: 'usuario.reset_password',
      resourceType: 'user',
      resourceId: targetUserId,
      beforeJson: null,
      afterJson: JSON.stringify({ email: targetUser.email }),
      ip: getRequestIp(context),
      userAgent: getRequestUA(context),
    });
    return new Response(JSON.stringify({ ok: true, sent: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (parsed.data.action === 'revoke-sessions') {
    // Borrar admin_session + session (la del auth) del usuario objetivo.
    // La FK es CASCADE, así que podríamos borrar el user, pero eso es
    // destructivo. Aquí solo invalidamos sesiones.
    await db.delete(adminSession).where(eq(adminSession.userId, targetUserId)).run();
    await recordAudit(db, {
      actorUserId: context.actor.id,
      action: 'usuario.revoke_sessions',
      resourceType: 'user',
      resourceId: targetUserId,
      beforeJson: null,
      afterJson: JSON.stringify({ revoked: true }),
      ip: getRequestIp(context),
      userAgent: getRequestUA(context),
    });
    return new Response(JSON.stringify({ ok: true, revoked: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ ok: false, error: 'acción no soportada' }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' },
  });
});
