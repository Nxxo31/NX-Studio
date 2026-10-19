// POST /api/portal/profile — actualiza el contacto del cliente autenticado.
//
// Validación Zod (schema en ~/server/portal-profile-schema), update vía
// portal-repo.updateUserProfile, audit en portal_activity vía recordActivity.
// Responde 303 redirect a /portal/perfil?saved=1 (form-encoded) o JSON cuando
// el cliente envía application/json.

import type { APIRoute } from 'astro';
import { env as runtimeEnv } from 'cloudflare:workers';
import { createDb } from '~/db';
import { getPortalUserId } from '~/lib/portal-auth';
import { handleProfileSubmit } from '~/server/portal-profile-handler';

export const prerender = false;

function redirect(loc: string, status = 303): Response {
  return new Response(null, { status, headers: { Location: loc } });
}

function jsonError(status: number, code: string, message?: string): Response {
  return new Response(JSON.stringify({ ok: false, error: code, message: message ?? null }), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function jsonOk(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify({ ok: true, ...((payload as object) ?? {}) }), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export const POST: APIRoute = async (context) => {
  const env = runtimeEnv as unknown as { DB: D1Database };
  const ct = context.request.headers.get('content-type') ?? '';
  const wantsJson = ct.includes('application/json');

  const userId = await getPortalUserId(context.request, env);
  if (!userId) {
    return wantsJson ? jsonError(401, 'unauthorized') : redirect('/portal/login?from=/portal/perfil');
  }

  const db = createDb(env.DB);
  const body = wantsJson
    ? await context.request.json().catch(() => null)
    : Object.fromEntries((await context.request.formData()).entries());

  const result = await handleProfileSubmit(userId, body, { db });
  if (!result.ok) {
    if (wantsJson) return jsonError(result.status, result.json.error, result.json.message ?? undefined);
    const search = result.json.error === 'validation_failed' ? '?error=validation' : '?error=internal';
    return redirect(`/portal/perfil${search}`);
  }
  if (wantsJson) return jsonOk({ saved: true });
  return redirect('/portal/perfil?saved=1');
};