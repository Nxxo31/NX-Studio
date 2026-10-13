import { defineMiddleware } from 'astro:middleware';
import { detectLocale, LOCALE_COOKIE } from './i18n/detect';
import type { Locale } from './i18n/country-map';

/**
 * i18n server-side (memo #191). Corre en el edge como Pages Function
 * (output 'server' + @astrojs/cloudflare).
 *
 * Comportamiento:
 * - /api, /admin y assets: bypass total.
 * - /en/*, /pt/*: setea Astro.locals.locale y reescribe internamente
 *   a la ruta sin prefijo (el navegador mantiene la URL localizada).
 * - /es/*: redirect al path sin prefijo (default locale sin prefijo).
 * - Sin prefijo: cookie manual > cf-ipcountry > Accept-Language > 'es'.
 *   Locale no-default detectado → 302 al path prefijado.
 *
 * Base path legacy '/NX-Studio' (home GitHub Pages): los links UI ya NO lo
 * incluyen (limpiado 2026-10-13); se conserva solo para normalizar inbound
 * links viejos del deploy anterior.
 *
 * La cookie 'nx-studio-locale' (TTL 365d) la setea LanguageSwitcher
 * cuando el usuario elige idioma manualmente; aquí solo se lee
 * (o se borra si tiene un valor inválido).
 */
const BASE = '/NX-Studio';

export const onRequest = defineMiddleware((context, next) => {
  const { pathname, search } = context.url;

  const hasBase = pathname === BASE || pathname.startsWith(`${BASE}/`);
  const logical = hasBase ? pathname.slice(BASE.length) || '/' : pathname;

  const result = detectLocale({
    pathname: logical,
    cfIpCountry: context.request.headers.get('cf-ipcountry'),
    acceptLanguage: context.request.headers.get('accept-language'),
    cookieLocale: context.cookies.get(LOCALE_COOKIE)?.value ?? null,
  });

  if (result.action === 'bypass') return next();

  if (result.action === 'redirect') {
    const prefix = hasBase ? BASE : '';
    return context.redirect(`${prefix}${result.location}${search}`, 302);
  }

  // serve — el routing de /en/* y /pt/* lo resuelve el fallback nativo de
  // Astro i18n (fallbackType: 'rewrite' en astro.config.mjs).
  (context.locals as { locale?: Locale }).locale = result.locale;

  // Limpieza defensiva: cookie inválida se descarta una vez.
  const cookieValue = context.cookies.get(LOCALE_COOKIE)?.value;
  if (cookieValue !== undefined && !['es', 'en', 'pt'].includes(cookieValue)) {
    context.cookies.delete(LOCALE_COOKIE, { path: '/' });
  }

  return next();
});
