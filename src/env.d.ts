/// <reference types="@cloudflare/workers-types" />
/// <reference types="astro/client" />

/**
 * Cloudflare bindings disponibles en `Astro.locals.runtime.env`.
 * Definidos en wrangler.toml para producción, .dev.vars para dev.
 */
interface ENV {
  /** Cloudflare D1 database binding */
  DB: D1Database;
  /** BETTER_AUTH_SECRET (32+ chars random) */
  BETTER_AUTH_SECRET: string;
  /** BETTER_AUTH_URL (https://nx-studio.pages.dev en prod) */
  BETTER_AUTH_URL: string;
  /** Resend API key para emails transaccionales */
  RESEND_API_KEY: string;
  /** Email que recibe notificaciones de nuevas licitaciones */
  CONTACT_EMAIL: string;
  /** OAuth opcionales */
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
}

type Runtime = import('@astrojs/cloudflare').Runtime<ENV>;

declare namespace App {
  interface Locals extends Runtime {}
}
