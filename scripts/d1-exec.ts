// Ejecutor de SQL contra Cloudflare D1 (local o remoto) para los scripts de
// seed.
//
// Envuelve `wrangler d1 execute` porque el D1 real solo existe como binding
// dentro del worker: desde Node no hay driver. El comando se invoca con
// `npx wrangler` y parseamos el JSON que devuelve (`--json`).
//
// OJO: `CLOUDFLARE_API_TOKEN` inválido rompe wrangler con 9109/7403. El token
// por defecto del registry suele estar vencido, así que lo quitamos del
// entorno del hijo y dejamos que wrangler use el OAuth cacheado.

import { execFileSync } from 'node:child_process';
import path from 'node:path';

export type Target = 'local' | 'remote';

/**
 * Persist dir del D1 local. Debe coincidir con el que usa el dev server
 * (`wrangler dev --config dist/server/wrangler.json`), que resuelve el
 * persist relativo al config file → dist/server/.wrangler/state.
 * Con el dir equivocado, el script escribe en una base que el dev server
 * nunca ve.
 */
export const PERSIST_DIR_LOCAL = 'dist/server/.wrangler/state';

/** Ruta al CLI de wrangler local (evita npx y su shell). */
function wranglerCli(): string {
  return path.resolve('node_modules', 'wrangler', 'wrangler-dist', 'cli.js');
}

/**
 * Ejecuta una sentencia SQL y devuelve las filas como objetos.
 * Lanza si wrangler falla o si la consulta no devuelve JSON parseable.
 */
export function execute(target: Target, sql: string): Array<Record<string, unknown>> {
  const args = [
    wranglerCli(),
    'd1',
    'execute',
    'nx-studio-db',
    `--${target}`,
    '--command',
    sql,
    '--json',
  ];
  if (target === 'local') {
    args.push('--persist-to', PERSIST_DIR_LOCAL);
  }

  const env = { ...process.env };
  // Dejamos que wrangler use su OAuth cacheado en vez del token del registry.
  delete env.CLOUDFLARE_API_TOKEN;

  let stdout: string;
  try {
    // SIN shell: las comillas simples del SQL deben llegar literales a wrangler.
    stdout = execFileSync(process.execPath, args, {
      encoding: 'utf8',
      env,
      maxBuffer: 10 * 1024 * 1024,
    });
  } catch (err) {
    const salida = err instanceof Error ? (err as { stdout?: string }).stdout ?? '' : '';
    const stderr = err instanceof Error ? (err as { stderr?: string }).stderr ?? '' : '';
    throw new Error(
      `wrangler d1 execute falló: ${(salida || stderr).slice(0, 800)}`
    );
  }

  try {
    const parsed = JSON.parse(stdout) as Array<{ results?: Array<Record<string, unknown>> }>;
    const primer = parsed[0];
    return primer?.results ?? [];
  } catch {
    // wrangler envuelve el JSON en líneas de log en algunos casos: extraemos
    // el primer bloque JSON que se pueda parsear.
    const inicio = stdout.indexOf('[');
    const fin = stdout.lastIndexOf(']');
    if (inicio >= 0 && fin > inicio) {
      const parsed = JSON.parse(stdout.slice(inicio, fin + 1)) as Array<{
        results?: Array<Record<string, unknown>>;
      }>;
      return parsed[0]?.results ?? [];
    }
    throw new Error(`No se pudo parsear la salida de wrangler: ${stdout.slice(0, 300)}`);
  }
}
