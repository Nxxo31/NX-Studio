// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://nxxo31.github.io',
  base: '/NX-Studio/',
  vite: {
    plugins: [tailwindcss()],
  },
});
