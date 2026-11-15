/**
 * Guard anti-regresión de las páginas legales (Términos / Privacidad / Cookies).
 *
 * Contexto (2026-11-10): la sesión anterior creó src/pages/legal/*.astro con
 * `@apply text-nx-text` dentro de un `<style>` scoped de Astro. Tailwind v4
 * no resuelve las clases del theme en un scope de componente sin `@reference`
 * al CSS global → el build moría con:
 *   "Cannot apply unknown utility class `text-nx-text`"
 * Además las páginas pedían `t('pages.legal.…')` cuando el copy vive bajo
 * `pages.legal.*` en los dicts, y es.json no tenía el bloque `legal` en
 * absoluto (el locale por defecto renderizaba claves crudas).
 *
 * Este test falla si:
 *   a) falta alguna de las 3 páginas o su componente LegalSections;
 *   b) alguna página usa `@apply` sin `@reference` al CSS global;
 *   c) los 3 dicts no tienen `pages.legal` con la misma forma;
 *   d) es/en/pt no tienen el mismo número de secciones por documento;
 *   e) el Footer enlaza las rutas legales con keys que no existen en es.json.
 */
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import es from '../../src/i18n/es.json';
import en from '../../src/i18n/en.json';
import pt from '../../src/i18n/pt.json';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const LEGAL_DIR = join(ROOT, 'src', 'pages', 'legal');
const DOCS = ['terminos', 'privacidad', 'cookies'] as const;

type Dict = Record<string, unknown>;

function lookup(dict: Dict, key: string): unknown {
  let node: unknown = dict;
  for (const seg of key.split('.')) {
    if (node == null || typeof node !== 'object') return undefined;
    node = (node as Record<string, unknown>)[seg];
  }
  return node;
}

/** Subclaves de un dict, en cualquier nivel (para comparar formas). */
function keyPaths(obj: unknown, prefix = ''): string[] {
  return Object.entries(obj as Dict)
    .flatMap(([k, v]) =>
      v !== null && typeof v === 'object'
        ? keyPaths(v, `${prefix}${k}.`)
        : [`${prefix}${k}`],
    )
    .sort();
}

describe('páginas legales: existen y el copy está en los 3 dicts', () => {
  it('existen las 3 páginas y el componente compartido', () => {
    for (const doc of DOCS) {
      expect(existsSync(join(LEGAL_DIR, `${doc}.astro`)), `falta ${doc}.astro`).toBe(true);
    }
    expect(existsSync(join(ROOT, 'src', 'components', 'LegalSections.astro'))).toBe(true);
  });

  it('cada página pide sus keys con el namespace correcto (pages.legal.*)', () => {
    for (const doc of DOCS) {
      const src = readFileSync(join(LEGAL_DIR, `${doc}.astro`), 'utf8');
      expect(src).toContain(`t('pages.legal.${doc}.title')`);
      expect(src).toContain(`t('pages.legal.${doc}.description')`);
      expect(src).toContain(`t('pages.legal.${doc}.lastUpdated')`);
      // La sección es un array: no puede pasar por t() (solo resuelve strings).
      expect(src).not.toContain(`t('pages.legal.${doc}.sections')`);
    }
  });

  it('ninguna página usa @apply sin @reference al CSS global', () => {
    for (const doc of DOCS) {
      const src = readFileSync(join(LEGAL_DIR, `${doc}.astro`), 'utf8');
      if (src.includes('@apply')) {
        expect(
          src.includes('@reference'),
          `${doc}.astro usa @apply pero no declara @reference → Tailwind v4 no resuelve el theme en scope de componente`,
        ).toBe(true);
      }
    }
  });

  it('los 3 dicts tienen pages.legal con la misma forma exacta', () => {
    const esPaths = keyPaths(lookup(es as Dict, 'pages.legal'));
    expect(esPaths.length).toBeGreaterThan(0);
    expect(keyPaths(lookup(en as Dict, 'pages.legal'))).toEqual(esPaths);
    expect(keyPaths(lookup(pt as Dict, 'pages.legal'))).toEqual(esPaths);
  });

  it('cada documento tiene el mismo número de secciones en es/en/pt', () => {
    for (const doc of DOCS) {
      const counts = [es, en, pt].map((d) => {
        const legal = lookup(d as Dict, 'pages.legal') as Dict;
        const entry = legal[doc] as Dict;
        return (entry.sections as unknown[]).length;
      });
      expect(counts[0], `${doc}: es=${counts[0]} en=${counts[1]} pt=${counts[2]}`).toBeGreaterThan(0);
      expect(counts[1]).toBe(counts[0]);
      expect(counts[2]).toBe(counts[0]);
    }
  });

  it('las keys del Footer legal existen en es.json (locale por defecto)', () => {
    for (const key of ['linkTerminos', 'linkPrivacidad', 'linkCookies']) {
      expect(
        lookup(es as Dict, `footer.${key}`),
        `footer.${key} ausente en es.json → el footer renderiza la key cruda`,
      ).toBeTruthy();
      expect(lookup(en as Dict, `footer.${key}`)).toBeTruthy();
      expect(lookup(pt as Dict, `footer.${key}`)).toBeTruthy();
    }
  });

  it('el Footer enlaza las 3 rutas legales', () => {
    const footer = readFileSync(join(ROOT, 'src', 'components', 'Footer.astro'), 'utf8');
    for (const doc of DOCS) {
      expect(footer, `Footer.astro no enlaza /legal/${doc}`).toContain(`/legal/${doc}`);
    }
  });
});
