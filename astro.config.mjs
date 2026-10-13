// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';

// NX-Studio deploy: Cloudflare Pages con SSR + Resend para contacto.
// Output 'server' = SSR, /api/* routes se ejecutan como Pages Functions en el edge.
// Migración 2026-09-28 desde GitHub Pages static (decision operador AGENTS.md override).
// DB persistence via Cloudflare D1 (TODO Fase 2). Por ahora email-only via Resend.
export default defineConfig({
  site: 'https://nx-studio.nx-studio.workers.dev',
  output: 'server',
  trailingSlash: 'ignore',
  // i18n auto-detect by location (memo #191): set ES (LATAM default) +
  // EN (internacional) + PT (Brasil). prefixDefaultLocale=false → 'es' va
  // sin prefijo; /en/* y /pt/* los maneja src/middleware.ts (rewrite interno).
  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en', 'pt'],
    routing: {
      prefixDefaultLocale: false,
      // El redirect por geolocalización lo hace el middleware (cf-ipcountry
      // → Accept-Language → 'es'); el router built-in no redirige.
      redirectToDefaultLocale: false,
      // Fallback nativo: /en/* y /pt/* sirven las rutas ES con la URL
      // localizada (rewrite interno de Astro, status 200). El locale activo
      // llega vía Astro.currentLocale.
      fallbackType: 'rewrite',
    },
    fallback: { en: 'es', pt: 'es' },
  },
  build: {
    inlineStylesheets: 'auto',
  },
  adapter: cloudflare({
    imageService: 'compile',
    platformProxy: { enabled: true },
  }),
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '~': new URL('./src/', import.meta.url).pathname,
        '@': new URL('./src/', import.meta.url).pathname,
      },
    },
  },
  server: {
    host: '127.0.0.1',
    port: 4321,
  },
  compressHTML: true,
});