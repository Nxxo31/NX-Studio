// Better-auth factory + helpers.
// Crea una instancia de `auth` por-request, dado el env de Cloudflare.
// Esto es OBLIGATORIO en Cloudflare: el D1 binding (`env.DB`) solo existe
// dentro del request handler, así que el adapter de better-auth debe
// construirse en cada request.
//
// Uso típico:
//   // En un API route:
//   const auth = createAuth(Astro.locals.runtime.env);
//   const result = await auth.api.signUpEmail({ body: {...}, asResponse: false });
//
//   // En el catch-all route:
//   return createAuth(env).handler(request);

import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { createDb } from '~/db';
import * as schema from '~/db/schema';

/**
 * Env mínimo que createAuth necesita. Compatible con Astro.locals.runtime.env
 * y con un objeto parcial para tests.
 */
export type AuthEnv = {
  DB: D1Database;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  // Opcionales — si faltan, no se configura OAuth
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
};

export function createAuth(env: AuthEnv) {
  const db = createDb(env.DB);

  // Detectamos si hay OAuth configurado
  const socialProviders: Record<string, { clientId: string; clientSecret: string }> = {};
  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
    socialProviders.google = {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    };
  }
  if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) {
    socialProviders.github = {
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    };
  }

  return betterAuth({
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    database: drizzleAdapter(db, {
      provider: 'sqlite',
      schema: {
        user: schema.user,
        session: schema.session,
        account: schema.account,
        verification: schema.verification,
      },
    }),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false, // simplifica el flujo inicial; se puede cambiar
      minPasswordLength: 8,
      maxPasswordLength: 128,
      autoSignIn: true,
    },
    socialProviders,
    user: {
      additionalFields: {
        role: {
          type: 'string',
          defaultValue: 'cliente',
          required: false,
          input: false, // no se setea via signup, solo internamente
        },
        empresa: {
          type: 'string',
          required: false,
          input: true,
        },
        telefono: {
          type: 'string',
          required: false,
          input: true,
        },
        pais: {
          type: 'string',
          required: false,
          input: true,
        },
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 días
      updateAge: 60 * 60 * 24, // 1 día
      cookieCache: {
        enabled: true,
        maxAge: 60 * 5, // 5 min cache para evitar golpear DB en cada request
      },
    },
    advanced: {
      cookiePrefix: 'nx-studio',
    },
    trustedOrigins: [env.BETTER_AUTH_URL],
  });
}

export type Auth = ReturnType<typeof createAuth>;
