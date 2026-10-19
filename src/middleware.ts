import { defineMiddleware } from 'astro:middleware';
import { detectLocale, LOCALE_COOKIE } from './i18n/detect';
import type { Locale } from './i18n/country-map';
import { portalGuard } from './lib/portal-guard';
import type { PortalEnv } from './lib/portal-auth';
import { env as runtimeEnv } from 'cloudflare:workers';

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
 * ─── B7 Portal Cliente (T03) ────────────────────────────────────────────
 * /portal/* tiene su propio guard ANTES del i18n porque:
 *  1. El portal es i18n-internal por ahora (todo en español).
 *  2. Si la sesión expira queremos redirigir al usuario a /portal/login
 *     sin reescribir el locale.
 *  3. /admin y /portal son dominios distintos — portal usa su propio
 *     cookie prefix ('nx-studio-portal-') y tablas (portal_session).
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

/** Rutas del portal accesibles sin sesión (auth flows). */
const PUBLIC_PORTAL_PATHS = ['/portal/login', '/portal/register', '/portal/forgot-password'];

function stripBase(pathname: string): string {
  if (pathname === BASE) return '/';
  if (pathname.startsWith(`${BASE}/`)) return pathname.slice(BASE.length) || '/';
  return pathname;
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname, search } = context.url;

  const logical = stripBase(pathname);

  // ─── B7 Portal guard (auth) ──────────────────────────────────────────
  // Corre ANTES del i18n. Si no hay sesión en rutas privadas, redirect
  // a /portal/login preservando el destino. Si hay sesión, popular
  // locals.portalSession para que las rutas downstream lo usen.
  const portalResult = await portalGuard({
      pathname: logical,
      request: context.request,
      env: runtimeEnv as unknown as PortalEnv,
    });
  if (portalResult.action === 'redirect') {
    return context.redirect(portalResult.location, 302);
  }
  if (portalResult.portalSession) {
    (context.locals as { portalSession?: { user: { id: string } } }).portalSession = portalResult.portalSession;
  }
  if (logical === '/portal' || logical.startsWith('/portal/')) {
    // Bypass i18n para /portal/* — el portal no se localiza por ahora
    return next();
  }

  const hasBase = pathname === BASE || pathname.startsWith(`${BASE}/`);

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
