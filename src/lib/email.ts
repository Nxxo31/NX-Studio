// Email service — wrapper sobre Resend con fallback a console en tests/dev.
// En producción usa RESEND_API_KEY; en tests/mock retorna Promise<void> sin enviar.

import { Resend } from 'resend';

export type EmailMessage = {
  from?: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export type EmailService = {
  send: (msg: EmailMessage) => Promise<void>;
};

/**
 * Crea un EmailService.
 * - Si `apiKey` está vacío, devuelve un mock que solo loguea (útil en tests/dev).
 * - Si hay apiKey, instancia Resend.
 *
 * `defaultFrom` debe ser un email del dominio verificado en Resend.
 */
export function createEmailService(opts: { apiKey?: string; defaultFrom: string }): EmailService {
  const { apiKey, defaultFrom } = opts;

  if (!apiKey) {
    // Mock mode: solo loguea. No envía emails reales.
    return {
      send: async (msg) => {
        if (typeof console !== 'undefined') {
          console.log(`[email mock] to=${msg.to} subject=${msg.subject}`);
        }
      },
    };
  }

  const resend = new Resend(apiKey);

  return {
    send: async (msg) => {
      await resend.emails.send({
        from: msg.from ?? defaultFrom,
        to: msg.to,
        subject: msg.subject,
        html: msg.html,
        text: msg.text,
      });
    },
  };
}
