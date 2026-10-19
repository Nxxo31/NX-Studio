/**
 * github.ts — capa de datos en vivo desde la API pública de GitHub.
 *
 * Trae los repos públicos de Nxxo31, los normaliza y los cachea en memoria
 * del Worker (TTL 1h + dedupe de requests en vuelo). Sin autenticación:
 * datos públicos, rate limit de GitHub cubierto por el cache.
 * Si GitHub falla o responde mal, el caller degrada a los datos estáticos
 * del catálogo (nunca rompe la página).
 */

import { z } from "zod";
import { projects } from "../data/catalog";
import projectImages from "../data/project-images.json";

export const GITHUB_USER = "Nxxo31";
const TTL_MS = 60 * 60 * 1000;
const FETCH_TIMEOUT_MS = 6000;

const GithubRepoSchema = z.object({
  name: z.string(),
  fork: z.boolean(),
  description: z.string().nullable().optional(),
  html_url: z.string(),
  homepage: z.string().nullable().optional(),
  language: z.string().nullable().optional(),
  topics: z.array(z.string()).optional(),
  stargazers_count: z.number().optional(),
  pushed_at: z.string(),
  archived: z.boolean().optional(),
});

export type RepoLive = z.infer<typeof GithubRepoSchema>;

let cache: { at: number; data: RepoLive[] } | null = null;
let inflight: Promise<RepoLive[]> | null = null;

async function fetchAndNormalize(): Promise<RepoLive[]> {
  const res = await fetch(
    `https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&sort=updated`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "nx-studio-portfolio",
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    }
  );
  if (!res.ok) throw new Error(`GitHub API ${res.status}`);
  const raw: unknown = await res.json();
  const parsed = z.array(GithubRepoSchema).safeParse(raw);
  if (!parsed.success) throw new Error("GitHub API: respuesta con formato inesperado");
  return parsed.data.filter((r) => !r.fork);
}

/** Repos en vivo (cacheados 1h). Lanza si GitHub falla — el caller decide
 *  si degrada con `.catch(() => [])`. */
export async function getLiveRepos(): Promise<RepoLive[]> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.data;
  if (inflight) return inflight;
  inflight = fetchAndNormalize()
    .then((data) => {
      cache = { at: Date.now(), data };
      return data;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/** Nombre del repo a partir de su URL pública. */
export function repoNameFromUrl(repoUrl: string): string {
  return repoUrl.replace(/\/+$/, "").split("/").pop() ?? "";
}

/** Merge catálogo + imágenes + datos vivos de GitHub para render/UI. */
export interface ProjectLive {
  slug: string;
  name: string;
  tagline: string;
  category: string;
  status: "live" | "prototype" | "archived";
  year: string;
  repoUrl: string;
  highlights: string[];
  images: string[];
  github: {
    stars: number;
    language: string | null;
    topics: string[];
    pushedAt: string;
    homepage: string | null;
  } | null;
}

export function mergeProjects(live: RepoLive[]): ProjectLive[] {
  const byName = new Map(live.map((r) => [r.name, r]));
  const images: Record<string, string[]> = projectImages;
  return projects.map((p) => {
    const r = byName.get(repoNameFromUrl(p.repo));
    return {
      slug: p.slug,
      name: p.name,
      tagline: p.tagline,
      category: p.category,
      status: p.status,
      year: p.year,
      repoUrl: p.repo,
      highlights: p.highlights,
      images: images[p.slug] ?? [],
      github: r
        ? {
            stars: r.stargazers_count ?? 0,
            language: r.language ?? null,
            topics: r.topics ?? [],
            pushedAt: r.pushed_at,
            homepage: r.homepage || null,
          }
        : null,
    };
  });
}
