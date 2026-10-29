// Email service — wrapper sobre Resend con fallback a console en tests/dev.
// En producción usa RESEND_API_KEY; en tests/mock retorna Promise<void> sin enviar.

import { Resend } from 'resend';

export type EmailMessage = {
  from?: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
  /** Reply-To: para que el operador responda directo al lead. */
  replyTo?: string;
};

export type EmailService = {
  send: (msg: EmailMessage) => Promise<void>;
  /**
   * 'live' = se envia de verdad. 'mock' = sin RESEND_API_KEY: solo loguea.
   * El lead se marca email_sent=0 cuando es mock, para que ningun contacto
   * quede invisible por falta de configuracion.
   */
  mode?: 'live' | 'mock';
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
      mode: 'mock' as const,
      send: async (msg) => {
        if (typeof console !== 'undefined') {
          console.log(`[email mock] to=${msg.to} subject=${msg.subject}`);
        }
      },
    };
  }

  const resend = new Resend(apiKey);

  return {
    mode: 'live' as const,
    send: async (msg) => {
      await resend.emails.send({
        from: msg.from ?? defaultFrom,
        to: msg.to,
        subject: msg.subject,
        html: msg.html,
        text: msg.text,
        replyTo: msg.replyTo,
      });
    },
  };
}
