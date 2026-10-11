/**
 * Detección de locale server-side (memo #191). Lógica pura para testeo con vitest;
 * src/middleware.ts es el wrapper Astro/Cloudflare sobre estas funciones.
 *
 * Cadena de fallback: cookie manual > path prefix > cf-ipcountry > Accept-Language > 'es'.
 */
import { DEFAULT_LOCALE, countryToLocale, isValidLocale, type Locale } from './country-map';

export const LOCALE_COOKIE = 'nx-studio-locale';
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 365d

/** Prefijos que nunca pasan por detección/redirect i18n. */
const BYPASS_PREFIXES = ['/api', '/admin', '/_astro', '/_image'];

export interface DetectInput {
  pathname: string;
  cfIpCountry?: string | null;
  acceptLanguage?: string | null;
  cookieLocale?: string | null;
}

export type DetectResult =
  | { action: 'bypass' }
  | { action: 'serve'; locale: Locale; /** path sin prefijo de locale para rewrite interno */ stripPrefix?: string }
  | { action: 'redirect'; locale: Locale; location: string };

/** true si el path es asset con extensión (favicon.svg, logo.png, etc.). */
function looksLikeAsset(pathname: string): boolean {
  const last = pathname.split('/').pop() ?? '';
  return /\.[a-z0-9]{1,8}$/i.test(last);
}

export function shouldBypass(pathname: string): boolean {
  if (BYPASS_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'))) return true;
  return looksLikeAsset(pathname);
}

/** Primer locale soportado en un header Accept-Language, o null. */
export function localeFromAcceptLanguage(header: string | null | undefined): Locale | null {
  if (!header) return null;
  // Parse "pt-BR,pt;q=0.9,en-US;q=0.8" respetando orden por q desc.
  const entries = header
    .split(',')
    .map((part) => {
      const [tag, ...params] = part.trim().split(';');
      const qParam = params.find((p) => p.trim().startsWith('q='));
      const q = qParam ? parseFloat(qParam.trim().slice(2)) : 1;
      return { tag: tag.trim().toLowerCase(), q: Number.isFinite(q) ? q : 0 };
    })
    .filter((e) => e.q > 0)
    .sort((a, b) => b.q - a.q);
  for (const { tag } of entries) {
    const lang = tag.split('-')[0];
    if (isValidLocale(lang)) return lang;
  }
  return null;
}

/** Normaliza slashes al final: '/pt' y '/pt/' se tratan igual. */

/**
 * Decide qué hacer con un request. Orden estricto:
 * 1. bypass (api/admin/assets) — no tocar.
 * 2. path ya prefijado (/en/*, /pt/*) → serve ese locale (rewrite interno del caller).
 *    /es/* → redirect al path sin prefijo (default locale va sin prefijo).
 * 3. cookie manual válida → si != 'es', redirect al path prefijado; si 'es', serve.
 * 4. detección: cf-ipcountry → country-map; si null, Accept-Language.
 * 5. detected != 'es' → redirect 302 al path prefijado. Si 'es' → serve default.
 */
export function detectLocale(input: DetectInput): DetectResult {
  // Preservar trailing slash tal cual: el redirect debe conservar el path exacto.
  const pathname = input.pathname || '/';

  if (shouldBypass(pathname)) return { action: 'bypass' };

  // 2. Path prefijado
  const seg = pathname.split('/')[1];
  if (isValidLocale(seg) && (pathname === `/${seg}` || pathname.startsWith(`/${seg}/`))) {
    if (seg === DEFAULT_LOCALE) {
      const stripped = pathname.slice(3) || '/';
      return { action: 'redirect', locale: 'es', location: stripped };
    }
    return { action: 'serve', locale: seg, stripPrefix: `/${seg}` };
  }

  // 3. Cookie manual (override del switcher)
  if (isValidLocale(input.cookieLocale)) {
    if (input.cookieLocale === DEFAULT_LOCALE) return { action: 'serve', locale: 'es' };
    return {
      action: 'redirect',
      locale: input.cookieLocale,
      location: joinLocale(input.cookieLocale, pathname),
    };
  }

  // 4. Detección por país, luego Accept-Language
  const detected =
    countryToLocale(input.cfIpCountry) ??
    localeFromAcceptLanguage(input.acceptLanguage) ??
    DEFAULT_LOCALE;

  if (detected === DEFAULT_LOCALE) return { action: 'serve', locale: 'es' };
  return { action: 'redirect', locale: detected, location: joinLocale(detected, pathname) };
}

/** '/en' + '/servicios/' = '/en/servicios/' */
export function joinLocale(locale: Locale, path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `/${locale}${p}`.replace(/\/{2,}/g, '/');
}
