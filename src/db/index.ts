// DB factory — Drizzle adapter sobre D1.
//
// Por qué factory function: D1 binding (`env.DB`) SOLO existe dentro del
// request handler en Cloudflare Pages. Si inicializamos la DB a nivel de
// módulo, falla en SSR (porque el módulo se importa fuera del request).
// El patrón es: crear la instancia por cada request.
//
// Uso:
//   import { createDb } from '~/db';
//   const db = createDb(Astro.locals.runtime.env.DB);

import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/d1';
import * as schema from './schema';

export type DB = ReturnType<typeof createDb>;

export function createDb(d1Binding: D1Database) {
  return drizzle(d1Binding, { schema });
}

// Re-export del schema para que callers importen todo desde un solo lugar
export { schema };
