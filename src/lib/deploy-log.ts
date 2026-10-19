// Helper de registro/consulta de deploy_log (B8 Admin Panel · spec_id 17 · T11).
//
// `recordDeploy` inserta una fila en deploy_log. Pensado para llamarse en:
//   - El módulo raíz de la Pages Function al hacer startup (worker_startup_ms = tiempo de boot)
//   - Webhooks de GitHub Actions / Cloudflare cuando hay un deploy manual
//
// `getRecentDeploys` devuelve los N más recientes ordenados desc por created_at
// para alimentar la vista "Deploy history" del panel.
//
// Las dos funciones son delgadas: encapsulan la creación del `id` con
// crypto.randomUUID() y delegan el timestamp a `new Date()` — Drizzle lo
// persiste como ms-epoch porque la columna usa mode 'timestamp_ms'.

import { desc } from 'drizzle-orm';
import { createDb } from '~/db';
import * as schema from '~/db/schema';

export type DeployEnv = { DB: D1Database };

export async function recordDeploy(env: DeployEnv, deploy: {
  versionId: string;
  commitSha?: string;
  branch?: string;
  environment?: 'production' | 'preview' | 'local';
  workerStartupMs?: number;
  status?: 'success' | 'failed' | 'in_progress';
}) {
  const db = createDb(env.DB);
  const id = crypto.randomUUID();
  // Drizzle's `timestamp_ms` mode requires a Date instance on insert; the column
  // itself is INTEGER (ms since epoch) at the SQL level.
  await db.insert(schema.deployLog).values({
    id,
    versionId: deploy.versionId,
    commitSha: deploy.commitSha ?? null,
    branch: deploy.branch ?? null,
    environment: deploy.environment ?? 'production',
    workerStartupMs: deploy.workerStartupMs ?? null,
    status: deploy.status ?? 'success',
    createdAt: new Date(),
  });
  return id;
}

export async function getRecentDeploys(env: DeployEnv, limit = 10) {
  const db = createDb(env.DB);
  return db.select().from(schema.deployLog).orderBy(desc(schema.deployLog.createdAt)).limit(limit).execute();
}