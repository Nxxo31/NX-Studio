#!/usr/bin/env node
/**
 * Guard anti-regresión i18n — kanban t_7e96b98d.
 *
 * Contexto: v0.8.0 cableó el hero con t('pages.hero.*') pero el copy vive
 * bajo hero.* en los dicts. getT() devuelve la key cruda como fallback
 * (`?? key`) y el prerender estático la hornea en el HTML servido — el
 * usuario veía "pages.hero.headlineA" en la home de prod (/, /en/, /pt/).
 *
 * Este script falla (exit 1) si el HTML prerenderado contiene:
 *   a) cualquier key de los dicts (es/en/pt.json) como texto crudo, o
 *   b) texto con forma de namespace i18n (pages.* | hero.* | nav.* | ...),
 *      que captura también namespaces inventados que aún no están en dicts.
 *
 * Se cablea al final de `npm run build` (ver package.json) para que un
 * deploy nunca incluya claves sin resolver. También acepta un directorio
 * arbitrario para verificar snapshots de prod:
 *   node scripts/check-i18n-prerender.mjs [dir]   (default: dist/client)
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url)); // repo root
const TARGET = resolve(process.argv[2] ?? join(ROOT, 'dist/client'));

// Namespaces top-level de src/i18n/*.json — actualizar si se agrega uno.
const NAMESPACES = ['meta', 'nav', 'hero', 'footer', 'langSwitcher', 'common', 'pages'];
const NS_RE = new RegExp(
  `\\b(?:${NAMESPACES.join('|')})\\.[a-zA-Z][a-zA-Z0-9]*(?:\\.[a-zA-Z0-9]+)+`,
  'g',
);

function flatten(obj, prefix = '', out = []) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object') flatten(v, key, out);
    else out.push(key);
  }
  return out;
}

const dictKeys = new Set();
for (const l of ['es', 'en', 'pt']) {
  const dict = JSON.parse(readFileSync(join(ROOT, 'src/i18n', `${l}.json`), 'utf8'));
  for (const k of flatten(dict)) dictKeys.add(k);
}

function walkHtml(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walkHtml(p, out);
    else if (entry.endsWith('.html')) out.push(p);
  }
  return out;
}

const files = walkHtml(TARGET);
if (files.length === 0) {
  console.error(`[i18n-guard] No se encontró HTML en ${TARGET} — ¿se corrió el build?`);
  process.exit(1);
}

const hits = [];
for (const f of files) {
  const html = readFileSync(f, 'utf8');
  const rel = relative(ROOT, f).replace(/\\/g, '/');
  for (const key of dictKeys) {
    if (html.includes(key)) hits.push(`${rel}: dict key sin resolver "${key}"`);
  }
  for (const m of html.matchAll(NS_RE)) {
    hits.push(`${rel}: texto con forma de namespace "${m[0]}"`);
  }
}

if (hits.length > 0) {
  const uniq = [...new Set(hits)];
  console.error(`[i18n-guard] FALLA — ${uniq.length} claves i18n crudas en HTML servido:`);
  for (const h of uniq) console.error('  ' + h);
  console.error('[i18n-guard] Alguna llamada t() no está resolviendo. Revisa src/i18n/*.json y los call sites.');
  process.exit(1);
}

console.log(
  `[i18n-guard] OK — ${files.length} archivos HTML sin claves i18n crudas ` +
    `(${dictKeys.size} keys de es/en/pt verificadas por archivo).`,
);
