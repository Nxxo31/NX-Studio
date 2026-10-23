// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import { fileURLToPath } from 'node:url';

const srcDir = fileURLToPath(new URL('./src/', import.meta.url));

// NX-Studio deploy: Cloudflare Pages con SSR + Resend para contacto.
// Output 'server' = SSR, /api/* routes se ejecutan como Pages Functions en el edge.
// Migración 2026-09-28 desde GitHub Pages static (decision operador AGENTS.md override).
// DB persistence via Cloudflare D1 (TODO Fase 2). Por ahora email-only via Resend.
export default defineConfig({
  site: 'https://nx-studio.nx-studio.workers.dev',
  output: 'static',
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
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      // El backend WebGPU esta dormido: sus archivos importan `vgpu`, que no
      // esta instalado. Vite lo descubre en el escaneo de deps, falla, y al
      // saltarse el pre-bundling TODO el dev server sirve 404 para los modulos
      // virtuales (/@vite/client, astro:scripts/*). Ver AGENTS.md > Bug conocido.
      exclude: ['vgpu', '@vgpu/core', '@vgpu/wgsl', '@vgpu/wgsl-std', '@vgpu/adapter-node'],
    },
    resolve: {
      // fileURLToPath, no .pathname: en Windows .pathname devuelve
      // "/C:/Users/..." con barra inicial, que no existe como ruta.
      // Vea AGENTS.md > Bug conocido.
      alias: {
        '~': srcDir,
        '@': srcDir,
      },
    },
  },
  server: {
    host: '127.0.0.1',
    port: 4321,
  },
  compressHTML: true,
});