# NX-Studio

Sitio web **empresarial** de NX-Studio — estudio de desarrollo LATAM.
Stack: Astro 7 (SSR en Cloudflare Workers) + Tailwind v4 + TypeScript + React islands.

**Live:** https://nx-studio.nx-studio.workers.dev

## Features

- **Agujero negro global** — pipeline WebGPU original de 21st.dev (disco de acreción volumétrico con lente gravitacional real) con fallback WebGL2; es el único glow y la única excepción de color del sitio
- **Identidad monocromática futurista** — una escala de grises sobre el fondo, tipografía self-hosted (Orbitron · Inter · JetBrains Mono) y superficies de cristal translúcidas
- **Pricing engine interactivo** — `/cotizador` calcula rangos de inversión en tiempo real (nada es gratis: hay piso de mercado)
- **Portal de cliente** — `/portal`: licitaciones, proyectos, perfil, mensajes, notificaciones (D1 + better-auth)
- **Panel admin** — `/admin`: catálogo, licitaciones, plantillas, usuarios, auditoría, deploys
- **Catálogo de productos** — 11 repos reales mapeados a productos; plantillas comprables en `/templates`
- **Chatbot SophIA** — asistente flotante con FSM y respuestas por página
- **Trilingüe** — ES/EN/PT con auto-detect y switcher

## Project Structure

```
src/
├── pages/                  # Rutas Astro (marketing + /portal + /admin + /api)
├── components/             # Nav, Footer, Brand, chatbot, motion islands, style-lab
│   └── ui/                 # agujero negro (WebGPU + fallback WebGL2), vendor liquid-sculpture-hero
├── layouts/                # Base.astro: canvas del fondo, scrim, headers de seguridad
├── lib/                    # auth, rbac, mockups, chatbot FSM, deploy log
├── server/                 # handlers + repos (Drizzle → D1)
├── data/                   # single source of truth: pricing, templates, catalog, services
├── i18n/                   # es.json · en.json · pt.json + detector
├── db/                     # schema Drizzle
└── styles/                 # global.css (tokens @theme + :root) y chatbot.css
```

## Getting Started

```bash
npm install
npm run build                                  # build de producción + i18n-guard
npx astro preview --port 4322 --host 127.0.0.1   # verificación visual (NO uses dev para esto)
npm run test                                   # vitest (299)
npm run test:e2e                               # playwright (necesita el preview en :4322)
```

> `npm run dev` no es confiable para verificación visual: el sitio se ve sin
> animaciones y sin el fondo. Usa `build` + `preview`.

## Deploy

```bash
npx wrangler deploy --config dist/server/wrangler.json
```

Detalle de secrets, migraciones D1 y rollback: `docs/deploy.md`.

## Docs

- `PROJECT.md` — single source of truth (identidad, sprints, arquitectura, limitaciones)
- `AGENTS.md` — reglas operativas del proyecto (manda sobre PROJECT.md)
- `DESIGN.md` — sistema de diseño canónico (tokens, gramática, do/don't)
- `docs/research-pricing-patterns.md` — benchmarks de pricing (estructurales, no visuales)

## License

Private — © 2026 NX-Studio. Todos los derechos reservados.
