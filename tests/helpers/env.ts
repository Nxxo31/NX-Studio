// Helper de creación de env de testing para better-auth + D1.
// Cada test que necesite un stack completo importa createTestEnv().
//
// Devuelve:
//   - env: el objeto env-like que createAuth() espera (con BETTER_AUTH_SECRET, BETTER_AUTH_URL, DB)
//   - db: la instancia Drizzle para asserts directos
//   - cleanup: () => void para liberar recursos (mejor-sqlite3 cierra solo en GC)

import { fakeD1, applyMigrations } from './d1-fake';
import { createDb } from '~/db';

export async function createTestEnv() {
  const d1 = fakeD1();
  await applyMigrations(d1);
  const db = createDb(d1);

  const env = {
    DB: d1,
    BETTER_AUTH_SECRET: 'test-secret-must-be-32-chars-or-more-for-real-use',
    BETTER_AUTH_URL: 'http://127.0.0.1:4321',
  };

  return { env, db };
}
