// Helpers para el viewer /admin/deploys (B8 · T11).
//
// Si wrangler está disponible en prod, refrescamos la lista de deploys
// ejecutando `wrangler deployments list --format=json` como subprocess.
// Si falla (entorno dev, sin auth de Cloudflare), caemos al fallback
// de la tabla deploy_log (lo que ya tenemos).

import type { DeployLog } from '~/db/schema';

export interface DeployRow {
  id: string;
  versionId: string;
  commitSha: string | null;
  branch: string | null;
  environment: 'production' | 'preview' | 'local' | string;
  status: 'success' | 'failed' | 'in_progress' | string;
  workerStartupMs: number | null;
  createdAt: Date | number;
}

export async function fetchWranglerDeploys(timeoutMs = 5000): Promise<DeployRow[] | null> {
  if (typeof process === 'undefined') return null;
  try {
    const { exec } = await import('node:child_process');
    return await new Promise<DeployRow[] | null>((resolve) => {
      const proc = exec('wrangler deployments list --format=json', { timeout: timeoutMs }, (err, stdout) => {
        if (err) return resolve(null);
        try {
          const parsed = JSON.parse(stdout) as unknown[];
          if (!Array.isArray(parsed)) return resolve(null);
          const rows: DeployRow[] = parsed.map((r) => {
            const o = r as Record<string, unknown>;
            const id = String(o.id ?? o.deployment_id ?? crypto.randomUUID());
            return {
              id,
              versionId: String(o.version_id ?? o.deployment_id ?? id),
              commitSha: (o.commit_sha ?? o.commit?.sha ?? null) as string | null,
              branch: (o.branch ?? null) as string | null,
              environment: String(o.environment ?? o.env ?? 'production'),
              status: String(o.status ?? 'success'),
              workerStartupMs: (o.worker_startup_ms ?? null) as number | null,
              createdAt: new Date(String(o.created_on ?? o.created_at ?? Date.now())),
            };
          });
          resolve(rows);
        } catch {
          resolve(null);
        }
      });
      void proc;
    });
  } catch {
    return null;
  }
}

export function deploysFromDb(rows: DeployLog[]): DeployRow[] {
  return rows.map((r) => ({
    id: r.id,
    versionId: r.versionId,
    commitSha: r.commitSha ?? null,
    branch: r.branch ?? null,
    environment: r.environment,
    status: r.status,
    workerStartupMs: r.workerStartupMs ?? null,
    createdAt: r.createdAt,
  }));
}

export function sortDeploysDesc(rows: DeployRow[]): DeployRow[] {
  return [...rows].sort((a, b) => {
    const ta = a.createdAt instanceof Date ? a.createdAt.getTime() : Number(a.createdAt);
    const tb = b.createdAt instanceof Date ? b.createdAt.getTime() : Number(b.createdAt);
    return tb - ta;
  });
}
