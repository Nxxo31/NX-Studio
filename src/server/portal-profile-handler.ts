// Handler puro (testeable) para POST /api/portal/profile.
// Extraído a ~/server para que tests/unit/portal-ui.test.ts no necesite
// importar astro:middleware/cloudflare:workers (virtual modules del runtime).

import type { z } from 'zod';
import { createDb } from '~/db';
import { recordActivity, updateUserProfile } from './portal-repo';
import { ProfilePatchSchema } from './portal-profile-schema';

export type ProfileSubmitResult =
  | { ok: true; status: 200; json: { ok: true; saved: true } }
  | { ok: false; status: 401 | 400 | 500; json: { ok: false; error: string; message?: string } };

/**
 * Procesa un submit del form de perfil. NO toca I/O — el caller (APIRoute)
 * se encarga de auth (getPortalUserId) y de armar la Response.
 */
export async function handleProfileSubmit(
  userId: string | null,
  rawBody: unknown,
  deps: { db: ReturnType<typeof createDb> }
): Promise<ProfileSubmitResult> {
  if (!userId) {
    return { ok: false, status: 401, json: { ok: false, error: 'unauthorized', message: 'No session' } };
  }
  let parsed: z.infer<typeof ProfilePatchSchema>;
  try {
    parsed = ProfilePatchSchema.parse(rawBody);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'validation_failed';
    return { ok: false, status: 400, json: { ok: false, error: 'validation_failed', message: msg } };
  }
  try {
    const updated = await updateUserProfile(deps.db, userId, parsed);
    if (!updated) {
      return { ok: false, status: 400, json: { ok: false, error: 'user_not_found' } };
    }
    await recordActivity(deps.db, {
      userId,
      action: 'profile_updated',
      entityType: 'user',
      entityId: userId,
      payload: { keys: Object.keys(parsed) },
    });
    return { ok: true, status: 200, json: { ok: true, saved: true } };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown';
    return { ok: false, status: 500, json: { ok: false, error: 'internal', message: msg } };
  }
}