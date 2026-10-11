/**
 * Runtime i18n para componentes .astro (memo #191).
 * getLocale() lee Astro.locals.locale (seteado por src/middleware.ts);
 * getT() devuelve un traductor con fallback a 'es' para keys faltantes.
 */
import type { APIContext, AstroGlobal } from 'astro';
import { DEFAULT_LOCALE, isValidLocale, type Locale } from './country-map';
import { joinLocale } from './detect';
import es from './es.json';
import en from './en.json';
import pt from './pt.json';

export type Messages = typeof es;

const DICTS: Record<Locale, Messages> = { es, en, pt };

/** Base path legacy del sitio (home GitHub Pages); las rutas UI lo incluyen. */
const BASE = '/NX-Studio';

type AstroLike = Pick<AstroGlobal, 'locals'> & Partial<Pick<AstroGlobal, 'currentLocale'>>;

/** Locale activo del request: Astro.currentLocale (routing i18n) o
 *  Astro.locals.locale (middleware); 'es' si ninguno (tests, prerender). */
export function getLocale(Astro: AstroLike): Locale {
  const current = (Astro as { currentLocale?: unknown }).currentLocale;
  if (isValidLocale(current as string)) return current as Locale;
  const l = (Astro.locals as { locale?: unknown }).locale;
  return isValidLocale(l as string) ? (l as Locale) : DEFAULT_LOCALE;
}

export function getMessages(locale: Locale): Messages {
  return DICTS[locale];
}

function lookup(dict: unknown, key: string): string | undefined {
  let node: unknown = dict;
  for (const seg of key.split('.')) {
    if (node == null || typeof node !== 'object') return undefined;
    node = (node as Record<string, unknown>)[seg];
  }
  return typeof node === 'string' ? node : undefined;
}

/**
 * Traductor para un locale dado. Fallback chain por key: locale → es → key.
 * Uso en .astro: `const t = getT(Astro); t('nav.inicio')`.
 */
export function getT(AstroOrLocale: AstroLike | Locale) {
  const locale = typeof AstroOrLocale === 'string' ? AstroOrLocale : getLocale(AstroOrLocale);
  const dict = DICTS[locale];
  const fallback = DICTS[DEFAULT_LOCALE];
  return function t(key: string): string {
    return lookup(dict, key) ?? lookup(fallback, key) ?? key;
  };
}

/**
 * URL con prefijo de locale. 'es' va sin prefijo (prefixDefaultLocale=false).
 * Preserva el base path legacy '/NX-Studio' que ya usan Nav/Footer/Hero.
 *   localeUrl('/servicios/', 'en') → '/NX-Studio/en/servicios/'
 */
export function localeUrl(path: string, locale: Locale): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  if (locale === DEFAULT_LOCALE) return `${BASE}${p}`.replace(/\/{2,}/g, '/');
  return `${BASE}${joinLocale(locale, p)}`.replace(/\/{2,}/g, '/');
}

export { DEFAULT_LOCALE, LOCALES, isValidLocale } from './country-map';
export { LOCALE_COOKIE, joinLocale } from './detect';
export type { Locale };
