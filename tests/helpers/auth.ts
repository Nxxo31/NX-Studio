// Helper para tests de better-auth.
// Crea un `auth` instance con fake D1 + secret de testing.

import { fakeD1, applyMigrations } from './d1-fake';
import { createAuth, type AuthEnv } from '~/lib/auth';

export async function createTestAuth(extraEnv: Partial<AuthEnv> = {}) {
  const d1 = fakeD1();
  await applyMigrations(d1);

  const env: AuthEnv = {
    DB: d1,
    BETTER_AUTH_SECRET: 'test-secret-must-be-32-chars-or-more-for-real-use',
    BETTER_AUTH_URL: 'http://127.0.0.1:4321',
    ...extraEnv,
  };

  const auth = createAuth(env);
  return { auth, env, d1 };
}
