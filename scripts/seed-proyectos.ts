// Seed script para migrar catalog.ts a tabla proyecto en D1.
//
// Ejecutable:
//   npx tsx scripts/seed-proyectos.ts                    # solo dry-run, imprime qué haría
//   npx tsx scripts/seed-proyectos.ts --apply-local      # aplica contra .wrangler/state/.../miniflare-D1DatabaseObject/data.sqlite
//   npx tsx scripts/seed-proyectos.ts --db-path <path>   # aplica contra un sqlite path arbitrario
//
// Usado en deploy via wrangler: se aplica manualmente con `wrangler d1 execute`
// en la DB de producción antes del primer deploy.
//
// Source of truth: src/data/catalog.ts (los 11 proyectos estáticos de NX-Studio).
// Cada uno se migra a la tabla `proyecto` con timestamp actual (unixepoch ms).

import { projects } from '../src/data/catalog';
import type { NewProyecto } from '../src/db/schema';

/**
 * Convierte un Project del catalog.ts a un NewProyecto (Drizzle insert).
 * Aplica las transformaciones necesarias:
 * - `stack: string[]` → JSON string
 * - `impact: string` (texto plano) → JSON string con shape { metric, value }
 * - `category: 'live' | 'prototype' | 'archived'` → 'activo' | 'beta' | 'archivado'
 */
export function transformProject(p: (typeof projects)[number]): NewProyecto {
  return {
    id: crypto.randomUUID(),
    slug: p.slug,
    code: p.code,
    name: p.name,
    tagline: p.tagline,
    descripcion: p.desc,
    categoria: p.category,
    stack: JSON.stringify(p.stack),
    repoUrl: p.repo,
    liveUrl: p.demoUrl ?? null,
    impact: p.impact ?? null,
    year: parseInt(p.year, 10),
    status: p.status === 'live' ? 'activo' : p.status === 'prototype' ? 'beta' : 'archivado',
    destacado: p.slug === 'nexocore', // NexoCore es el flagship, el resto no
  };
}

/**
 * Genera el SQL batch para aplicar manualmente con wrangler d1 execute --file.
 * Útil para el deploy: un solo archivo SQL con todos los INSERTs.
 */
export function generateSeedSQL(): string {
  const lines: string[] = [
    '-- Seed: proyectos del catálogo',
    '-- Generado automáticamente. No editar a mano — re-generar con `npm run seed`.',
    '',
  ];
  for (const p of projects) {
    const t = transformProject(p);
    const stack = t.stack;
    const impact = t.impact ?? null;
    lines.push(`INSERT INTO proyecto (id, slug, code, name, tagline, descripcion, categoria, stack, repo_url, live_url, impact, year, status, destacado, created_at, updated_at) VALUES (
  '${t.id}',
  '${t.slug.replace(/'/g, "''")}',
  '${t.code}',
  '${t.name.replace(/'/g, "''")}',
  '${t.tagline.replace(/'/g, "''")}',
  '${t.descripcion.replace(/'/g, "''")}',
  '${t.categoria}',
  '${stack.replace(/'/g, "''")}',
  '${t.repoUrl}',
  ${t.liveUrl ? `'${t.liveUrl}'` : 'NULL'},
  ${impact ? `'${impact.replace(/'/g, "''")}'` : 'NULL'},
  ${t.year},
  '${t.status}',
  ${t.destacado ? 1 : 0},
  unixepoch('subsec') * 1000,
  unixepoch('subsec') * 1000
)
ON CONFLICT(slug) DO UPDATE SET
  name=excluded.name,
  tagline=excluded.tagline,
  descripcion=excluded.descripcion,
  categoria=excluded.categoria,
  stack=excluded.stack,
  repo_url=excluded.repo_url,
  live_url=excluded.live_url,
  impact=excluded.impact,
  year=excluded.year,
  status=excluded.status,
  destacado=excluded.destacado,
  updated_at=unixepoch('subsec') * 1000;
`);
  }
  return lines.join('\n');
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const sql = generateSeedSQL();

  if (args.includes('--apply-sql')) {
    console.log(sql);
  } else if (args.includes('--dry-run')) {
    console.log('[DRY RUN] Se aplicarían los siguientes proyectos:');
    for (const p of projects) {
      const t = transformProject(p);
      console.log(`  ${t.slug} (${t.categoria}) → destacado=${t.destacado}`);
    }
  } else {
    console.log('Uso:');
    console.log('  npx tsx scripts/seed-proyectos.ts --dry-run');
    console.log('  npx tsx scripts/seed-proyectos.ts --apply-sql > /tmp/proyectos.sql');
    console.log('  wrangler d1 execute nx-studio-db --remote --file /tmp/proyectos.sql');
  }
}
