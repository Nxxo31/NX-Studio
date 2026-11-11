// POST /api/agenda/cita
//
// Agenda una llamada de scoping por videollamada. Público: el cliente llega
// desde el cotizador sin necesidad de cuenta.
//
// Si hay credenciales de Google Calendar, se crea el Meet automáticamente.
// Si no, la cita queda 'pendiente' y el operador confirma el enlace desde
// /admin/citas — el cliente nunca ve un enlace roto.

import type { APIRoute } from 'astro';
import { env as runtimeEnv } from 'cloudflare:workers';
import { createDb } from '~/db';
import { createEmailService } from '~/lib/email';
import { handleAgendarCita } from '~/server/agenda-handler';
import { getUserIdFromRequest } from '~/lib/session';
import type { AuthEnv } from '~/lib/auth';
import type { CalendarEnv } from '~/lib/google-calendar';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const env = runtimeEnv as unknown as {
    DB: D1Database;
    RESEND_API_KEY?: string;
    CONTACT_EMAIL?: string;
    EMAIL_FROM?: string;
    BETTER_AUTH_SECRET?: string;
    BETTER_AUTH_URL?: string;
  } & CalendarEnv;

  const db = createDb(env.DB);
  const email = createEmailService({
    apiKey: env.RESEND_API_KEY ?? import.meta.env.RESEND_API_KEY ?? '',
    defaultFrom:
      env.EMAIL_FROM ??
      import.meta.env.EMAIL_FROM ??
      'NX-Studio <onboarding@resend.dev>',
  });

  const body = await request.json().catch(() => null);
  const result = await handleAgendarCita(body, {
    db,
    email,
    contactEmail:
      env.CONTACT_EMAIL ??
      import.meta.env.CONTACT_EMAIL ??
      'nxstudioing31@gmail.com',
    calendar: env,
    resolveUserId: () =>
      getUserIdFromRequest(request, env as unknown as AuthEnv).catch(() => null),
  });

  const status =
    result.ok
      ? 200
      : result.error === 'spam_detected'
        ? 400
        : result.error === 'validation'
          ? 400
          : result.error === 'slot_no_disponible'
            ? 409
            : 500;

  return new Response(JSON.stringify(result), {
    status,
    headers: { 'content-type': 'application/json' },
  });
};
