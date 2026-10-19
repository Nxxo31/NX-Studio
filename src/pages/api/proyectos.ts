import type { APIRoute } from "astro";
import { z } from "zod";
import { getLiveRepos, mergeProjects } from "~/lib/github";

export const prerender = false;

/**
 * GET /api/proyectos
 *
 * Endpoint público de solo lectura: proyectos del portafolio con datos en
 * vivo desde GitHub (stars, lenguaje, última actualización). Sin
 * autenticación — información pública del operador de GitHub Nxxo31.
 *
 * Query params:
 *   - categoria: filtra por categoría del catálogo (opcional)
 *   - status:    'live' | 'prototype' | 'archived' (opcional)
 *
 * Degradación: si GitHub no responde, se sirven los datos estáticos del
 * catálogo con github: null. El endpoint nunca falla por culpa de GitHub.
 */

const QuerySchema = z.object({
  categoria: z.string().optional(),
  status: z.enum(["live", "prototype", "archived"]).optional(),
});

export const GET: APIRoute = async ({ url }) => {
  const params = Object.fromEntries(url.searchParams.entries());
  const parsed = QuerySchema.safeParse(params);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ ok: false, error: "validation", details: parsed.error.flatten() }),
      { status: 400, headers: { "content-type": "application/json" } }
    );
  }

  const { categoria, status } = parsed.data;
  let live;
  try {
    live = await getLiveRepos();
  } catch {
    live = [];
  }

  let proyectos = mergeProjects(live);
  if (categoria) proyectos = proyectos.filter((p) => p.category === categoria);
  if (status) proyectos = proyectos.filter((p) => p.status === status);

  return new Response(
    JSON.stringify({
      ok: true,
      count: proyectos.length,
      generatedAt: new Date().toISOString(),
      githubLive: live.length > 0,
      proyectos,
    }),
    {
      status: 200,
      headers: {
        "content-type": "application/json",
        "cache-control": "public, max-age=300",
      },
    }
  );
};
