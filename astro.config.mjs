// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';

// NX-Studio deploy: Cloudflare Pages con SSR + Resend para contacto.
// Output 'server' = SSR, /api/* routes se ejecutan como Pages Functions en el edge.
// Migración 2026-09-28 desde GitHub Pages static (decision operador AGENTS.md override).
// DB persistence via Cloudflare D1 (TODO Fase 2). Por ahora email-only via Resend.
export default defineConfig({
  site: 'https://nx-studio.pages.dev',
  output: 'server',
  trailingSlash: 'ignore',
  build: {
    inlineStylesheets: 'auto',
  },
  adapter: cloudflare({
    imageService: 'compile',
    platformProxy: { enabled: true },
  }),
  vite: {
    plugins: [tailwindcss()],
  },
  server: {
    host: '127.0.0.1',
    port: 4321,
  },
  compressHTML: true,
});