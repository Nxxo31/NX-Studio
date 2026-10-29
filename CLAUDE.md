## Development

- `npm run dev` sirve en :4321 pero **no es confiable para verificación visual**
  (0/4 islas hidratan en dev desde `dceb0a9`; ver `AGENTS.md § Bug RESUELTO`).
  Para mirar el sitio: `npm run build` y luego
  `npx astro preview --port 4322 --host 127.0.0.1` (es el puerto que espera
  Playwright, `baseURL: http://127.0.0.1:4322`).
- Gates antes de commit: `npm run build` (exit 0 + i18n-guard) y
  `npm run test` (299). `npm run test:e2e` necesita el preview levantado a mano
  (`playwright.config.ts` no define `webServer`).
- Un commit atómico por cambio lógico, conventional commits.

## Design

- Tokens **solo** en `src/styles/global.css` (`@theme` + `:root`). Cada color se
  declara dos veces: `--color-nx-*` en `@theme` (para que exista la utilidad
  Tailwind) y `--nx-*` en `:root` (para `var()`). Sin el prefijo `--color-*` la
  utilidad no se genera y el build no avisa.
- `DESIGN.md` es el sistema de diseño canónico; `AGENTS.md` manda sobre
  `PROJECT.md`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
