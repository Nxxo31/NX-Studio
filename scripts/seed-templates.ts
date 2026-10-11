// Seed script para migrar templates.ts a tabla template en D1.
//
// Ejecutable:
//   npx tsx scripts/seed-templates.ts --dry-run
//   npx tsx scripts/seed-templates.ts --apply-sql > /tmp/templates.sql
//
// Source of truth: src/data/templates.ts (los 3 templates estáticos de NX-Studio).

import { TEMPLATES } from '../src/data/templates';
import type { NewTemplate } from '../src/db/schema';

export function transformTemplate(t: (typeof TEMPLATES)[number]): NewTemplate {
  // Mapear Category de TEMPLATES a nuestra enum minúscula
  const CATEGORY_MAP: Record<string, string> = {
    Landing: 'landing',
    Dashboard: 'dashboard',
    'E-commerce': 'ecommerce',
    SaaS: 'landing',       // fallback — solo hay 3 templates en data hoy
    Auth: 'landing',
    Blog: 'landing',
  };

  return {
    id: crypto.randomUUID(),
    slug: t.slug,
    nombre: t.name,
    descripcionCorta: t.tagline,
    descripcionLarga: t.desc,
    precioUsd: t.price,
    categoria: (CATEGORY_MAP[t.category] ?? 'landing') as NewTemplate['categoria'],
    stack: JSON.stringify(t.stack),
    incluye: JSON.stringify(t.includes),
    noIncluye: JSON.stringify(t.excludes),
    tiempoEntregaDias: t.slug === 'landing-converter' ? 3 : t.slug === 'dashboard-starter' ? 5 : 7,
    destacado: t.featured ?? false,
  };
}

export function generateSeedSQL(): string {
  const lines: string[] = [
    '-- Seed: templates del marketplace',
    '-- Generado automáticamente. No editar a mano.',
    '',
  ];
  for (const t of TEMPLATES) {
    const x = transformTemplate(t);
    const esc = (s: string) => s.replace(/'/g, "''");
    lines.push(`INSERT INTO template (id, slug, nombre, descripcion_corta, descripcion_larga, precio_usd, categoria, stack, incluye, no_incluye, tiempo_entrega_dias, destacado, created_at, updated_at) VALUES (
  '${x.id}',
  '${esc(x.slug)}',
  '${esc(x.nombre)}',
  '${esc(x.descripcionCorta)}',
  '${esc(x.descripcionLarga)}',
  ${x.precioUsd},
  '${x.categoria}',
  '${esc(x.stack)}',
  '${esc(x.incluye)}',
  '${esc(x.noIncluye)}',
  ${x.tiempoEntregaDias},
  ${x.destacado ? 1 : 0},
  unixepoch('subsec') * 1000,
  unixepoch('subsec') * 1000
)
ON CONFLICT(slug) DO UPDATE SET
  nombre=excluded.nombre,
  descripcion_corta=excluded.descripcion_corta,
  descripcion_larga=excluded.descripcion_larga,
  precio_usd=excluded.precio_usd,
  categoria=excluded.categoria,
  stack=excluded.stack,
  incluye=excluded.incluye,
  no_incluye=excluded.no_incluye,
  tiempo_entrega_dias=excluded.tiempo_entrega_dias,
  destacado=excluded.destacado,
  updated_at=unixepoch('subsec') * 1000;
`);
  }
  return lines.join('\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const sql = generateSeedSQL();
  if (args.includes('--apply-sql')) console.log(sql);
  else {
    console.log('[DRY RUN] Templates a sembrar:');
    for (const t of TEMPLATES) {
      const x = transformTemplate(t);
      console.log(`  ${x.slug} → ${x.categoria} $${x.precioUsd} (${x.tiempoEntregaDias}d)`);
    }
  }
}
