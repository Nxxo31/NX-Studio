/**
 * Guard anti-regresión i18n (kanban t_7e96b98d).
 *
 * Contexto: v0.8.0 (bf711ec) cableó el AnimatedHero island con
 * t('pages.hero.*'), un namespace que NO existe en los dicts — el copy del
 * hero vive bajo `hero.*` top-level. getT() devuelve la key cruda como
 * fallback (`?? key`) y el prerender estático la hornea en el HTML servido
 * de /, /en/ y /pt/ (visible al usuario en prod desde 2026-10-14).
 *
 * Este test asegura que TODO call site literal `t('…')` en src/ resuelva a
 * copy real en los tres dicts (es/en/pt). Si alguien inventa un namespace
 * o borra una key, falla aquí — antes del build y del deploy.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import es from '../../src/i18n/es.json';
import en from '../../src/i18n/en.json';
import pt from '../../src/i18n/pt.json';
import { getT } from '../../src/i18n/index';

type Dict = Record<string, unknown>;

/** Misma semántica de lookup que src/i18n/index.ts (walk por segmentos). */
function lookup(dict: Dict, key: string): string | undefined {
  let node: unknown = dict;
  for (const seg of key.split('.')) {
    if (node == null || typeof node !== 'object') return undefined;
    node = (node as Record<string, unknown>)[seg];
  }
  return typeof node === 'string' ? node : undefined;
}

const SRC = fileURLToPath(new URL('../../src', import.meta.url));

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (/\.(astro|tsx|ts)$/.test(entry)) out.push(p);
  }
  return out;
}

/** Call sites con key literal: t('algo.algo') — dinámicos quedan fuera
 * (los cubre el guard de build scripts/check-i18n-prerender.mjs). */
const T_CALL = /\bt\(\s*(['"])((?:[a-zA-Z0-9_]+\.)*[a-zA-Z0-9_]+)\1/g;

const callSites: { file: string; key: string }[] = [];
for (const file of walk(SRC)) {
  const src = readFileSync(file, 'utf8');
  for (const m of src.matchAll(T_CALL)) {
    callSites.push({ file: file.slice(SRC.length + 1).replace(/\\/g, '/'), key: m[2] });
  }
}
const uniqueKeys = [...new Set(callSites.map((c) => c.key))].sort();

describe('i18n: call sites literales de src/ resuelven en los dicts', () => {
  it('encuentra call sites t(\'…\') (sanity del scanner)', () => {
    // El sitio tiene >100 call sites literales; si esto baja, el scanner se rompió.
    expect(callSites.length).toBeGreaterThan(100);
  });

  it('mecanismo de la regresión: getT devuelve la key cruda si no existe', () => {
    const t = getT('es');
    // Namespace inexistente → fallback `?? key` (exactamente lo que v0.8.0 horneó en prod).
    expect(t('pages.hero.badge')).toBe('pages.hero.badge');
    // Namespace correcto → copy real.
    expect(t('hero.badge')).not.toBe('hero.badge');
    expect(t('hero.badge')).toMatch(/online/i);
  });

  it('toda key literal existe en es.json (default) — si no, se renderiza cruda', () => {
    const missing = uniqueKeys.filter((k) => lookup(es as Dict, k) === undefined);
    expect(
      missing,
      `keys sin copy ES (t() las devolvería crudas → HTML servido roto):\n${missing.join('\n')}`,
    ).toEqual([]);
  });

  it('paridad EN: toda key literal existe en en.json', () => {
    const missing = uniqueKeys.filter((k) => lookup(en as Dict, k) === undefined);
    expect(
      missing,
      `keys sin copy EN (la ruta /en/ mostraría copy ES):\n${missing.join('\n')}`,
    ).toEqual([]);
  });

  it('paridad PT: toda key literal existe en pt.json', () => {
    const missing = uniqueKeys.filter((k) => lookup(pt as Dict, k) === undefined);
    expect(
      missing,
      `keys sin copy PT (la ruta /pt/ mostraría copy ES):\n${missing.join('\n')}`,
    ).toEqual([]);
  });
});
