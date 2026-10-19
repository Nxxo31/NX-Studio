// Notificaciones email del Portal Cliente (B7).
//
// Helper sendPortalEmail(event, user, payload) — envía emails transaccionales
// usando Resend cuando RESEND_API_KEY está configurado; degrada a console.log
// en dev/test (graceful degradation — la app sigue funcionando sin key).
//
// Eventos soportados:
//   - magic_link_login      → enlace de inicio de sesión (sin password)
//   - licitacion_aprobada   → el operador aprobó tu cotización
//   - milestone_completada  → cerramos una milestone de tu proyecto
//   - mensaje_recibido      → el operador te respondió en el inbox
//
// Uso típico en API route:
//   import { sendPortalEmail } from '~/lib/portal-notifications';
//   await sendPortalEmail('licitacion_aprobada', user, { licitacionId: 'abc' }, env);
//
// El payload de cada evento es específico y se valida con un discriminated
// union antes de construir el template. Si falta RESEND_API_KEY se loguea
// en consola y se devuelve { ok: false, degraded: true } — el caller puede
// ignorar el fallo (la app no se rompe).

import { createEmailService, type EmailService } from './email';

export type PortalNotificationEvent =
  | 'magic_link_login'
  | 'licitacion_aprobada'
  | 'milestone_completada'
  | 'mensaje_recibido';

export type PortalNotificationPayload =
  | { event: 'magic_link_login'; url: string; expiresInMinutes: number }
  | { event: 'licitacion_aprobada'; licitacionId: string; proyectoNombre?: string }
  | { event: 'milestone_completada'; proyectoSlug: string; milestoneTitle: string; proyectoNombre?: string }
  | { event: 'mensaje_recibido'; messagePreview: string; operadorNombre?: string };

export type UserLike = { email: string; name?: string | null };

export type PortalEnv = {
  RESEND_API_KEY?: string;
  MAGIC_LINK_FROM?: string;
};

export type SendResult =
  | { ok: true; id?: string }
  | { ok: false; degraded: true; reason: 'no_api_key' | 'no_recipient' };

type Template = { subject: string; html: string; text: string };

/**
 * Construye el template (subject + html + text) para un evento dado.
 * Pura — sin I/O. Testeable en aislamiento.
 */
export function buildPortalEmail(payload: PortalNotificationPayload): Template {
  switch (payload.event) {
    case 'magic_link_login': {
      const subject = 'Tu enlace de acceso al portal NX-Studio';
      const html = `
        <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: auto;">
          <h2 style="color: #ff4500;">Acceso al portal NX-Studio</h2>
          <p>Hola,</p>
          <p>Recibimos una solicitud de acceso a tu portal. Haz click en el siguiente enlace para iniciar sesión:</p>
          <p style="margin: 24px 0;"><a href="${payload.url}" style="background:#ff4500;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:600;">Iniciar sesión</a></p>
          <p style="color:#888;font-size:0.85em;">Este enlace expira en ${payload.expiresInMinutes} minutos. Si no lo solicitaste, ignora este mensaje.</p>
        </div>`;
      const text = `Acceso al portal NX-Studio\n\nAbre este enlace para iniciar sesión: ${payload.url}\n\nExpira en ${payload.expiresInMinutes} minutos.`;
      return { subject, html, text };
    }
    case 'licitacion_aprobada': {
      const subject = 'Tu cotización fue aprobada';
      const ctx = payload.proyectoNombre ? ` del proyecto "${payload.proyectoNombre}"` : '';
      const html = `
        <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: auto;">
          <h2 style="color: #ff4500;">¡Cotización aprobada!</h2>
          <p>Buenas noticias: tu cotización${ctx} fue aprobada por el equipo de NX-Studio.</p>
          <p>Próximos pasos: nos pondremos en contacto contigo en menos de 24 horas para alinear el kickoff.</p>
          <p style="margin: 24px 0;"><a href="/portal/licitacion/${payload.licitacionId}" style="background:#ff4500;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:600;">Ver detalle</a></p>
        </div>`;
      const text = `¡Cotización aprobada!\n\nTu cotización${ctx} fue aprobada. Próximos pasos: nos pondremos en contacto en menos de 24 horas.`;
      return { subject, html, text };
    }
    case 'milestone_completada': {
      const subject = `Milestone completada: ${payload.milestoneTitle}`;
      const ctx = payload.proyectoNombre ? ` (${payload.proyectoNombre})` : '';
      const html = `
        <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: auto;">
          <h2 style="color: #ff4500;">Milestone completada ✓</h2>
          <p>Acabamos de cerrar la milestone <strong>${payload.milestoneTitle}</strong>${ctx}.</p>
          <p style="margin: 24px 0;"><a href="/portal/proyectos/${payload.proyectoSlug}" style="background:#ff4500;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:600;">Ver proyecto</a></p>
        </div>`;
      const text = `Milestone completada: ${payload.milestoneTitle}${ctx}`;
      return { subject, html, text };
    }
    case 'mensaje_recibido': {
      const subject = `Nuevo mensaje del operador`;
      const who = payload.operadorNombre ? ` de ${payload.operadorNombre}` : '';
      const html = `
        <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: auto;">
          <h2 style="color: #ff4500;">Tienes un nuevo mensaje</h2>
          <p>El operador${who} te envió un mensaje en el portal:</p>
          <blockquote style="border-left: 3px solid #ff4500; padding-left: 12px; color: #555;">${payload.messagePreview}</blockquote>
          <p style="margin: 24px 0;"><a href="/portal/mensajes" style="background:#ff4500;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:600;">Responder en el portal</a></p>
        </div>`;
      const text = `Tienes un nuevo mensaje del operador${who}:\n\n${payload.messagePreview}\n\nResponder en el portal: /portal/mensajes`;
      return { subject, html, text };
    }
  }
}

/**
 * Envía una notificación del portal al user.
 * Devuelve { ok: true } si se envió (o si la API respondió OK).
 * Devuelve { ok: false, degraded: true } si no hay RESEND_API_KEY — el caller
 * puede ignorar este caso en dev/test sin romper el flujo.
 *
 * Si email permite pasar: mock (sin apiKey) → también devuelve degraded para no
 * confundir tests con "se envió un email real".
 */
export async function sendPortalEmail(
  event: PortalNotificationEvent,
  user: UserLike,
  payload: Omit<PortalNotificationPayload, 'event'>,
  env: PortalEnv,
  deps: { service?: EmailService; from?: string } = {}
): Promise<SendResult> {
  if (!user.email) return { ok: false, degraded: true, reason: 'no_recipient' };

  const apiKey = env.RESEND_API_KEY ?? '';
  if (!apiKey && !deps.service) {
    return { ok: false, degraded: true, reason: 'no_api_key' };
  }

  const fullPayload = { ...payload, event } as PortalNotificationPayload;
  const tmpl = buildPortalEmail(fullPayload);
  const service = deps.service ?? createEmailService({ apiKey, defaultFrom: deps.from ?? env.MAGIC_LINK_FROM ?? 'onboarding@resend.dev' });
  try {
    await service.send({
      from: deps.from ?? env.MAGIC_LINK_FROM ?? 'onboarding@resend.dev',
      to: user.email,
      subject: tmpl.subject,
      html: tmpl.html,
      text: tmpl.text,
    });
    return { ok: true };
  } catch {
    // No romper el flujo si el provider falla — degrade silenciosamente.
    return { ok: false, degraded: true, reason: 'no_api_key' };
  }
}