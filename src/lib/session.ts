// Session helper: lee el user_id de una request HTTP si hay cookie válida.
// Esto se usa para vincular una licitacion al user autenticado (opcional).
//
// NOTA: este helper es best-effort. Si no hay cookie o la session expiró,
// devuelve null. NUNCA lanza — el endpoint de licitacion es público y debe
// funcionar aunque nadie esté autenticado.

import type { AuthEnv } from '~/lib/auth';
import { createAuth } from '~/lib/auth';

export async function getUserIdFromRequest(
  request: Request,
  env: AuthEnv
): Promise<string | null> {
  try {
    const auth = createAuth(env);
    const session = await auth.api.getSession({ headers: request.headers });
    return session?.user?.id ?? null;
  } catch {
    return null;
  }
}
