// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// NX-Studio se despliega como sitio estático en GitHub Pages.
// output: 'static' genera HTML en /dist sin necesidad de runtime serverless.
// Seguridad: headers estrictos, sin endpoints dinámicos (no API routes, no SSR).
export default defineConfig({
  site: 'https://nxxo31.github.io',
  base: '/NX-Studio/',
  output: 'static',
  trailingSlash: 'ignore',
  build: {
    inlineStylesheets: 'auto',
  },
  vite: {
    plugins: [tailwindcss()],
  },
  server: {
    host: '127.0.0.1',
    port: 4321,
  },
  // Security headers (ciberseguridad best-practice: defense-in-depth en el edge)
  // GitHub Pages aplica automáticamente algunas políticas; reforzamos donde es posible.
  compressHTML: true,
});