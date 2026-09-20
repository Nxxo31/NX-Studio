# NX-Studio

Sitio web **empresarial** de NX-Studio — estudio de desarrollo LATAM.
Stack: Astro 7 (SSG) + Tailwind v4 + TypeScript.

**Live:** https://nxxo31.github.io/NX-Studio/

## Features

- **Pricing engine interactivo** — `/cotizador` calcula rangos de inversión en tiempo real
- **Servicios especializados** — OSINT, Testing & QA con pricing transparente
- **Templates marketplace** — starters MIT-licensed (Landing, Dashboard, E-commerce)
- **Lava neon identity** — paleta naranja/rojizo con geometría angular Matrix-style
- **SSG puro** — desplegado en GitHub Pages, sin backend, sin SSR
- **Security-first** — headers estrictos, canonical URLs, sin superficie de ataque runtime

## Project Structure

```
src/
├── pages/                  # Rutas Astro
│   ├── index.astro         # Home
│   ├── cotizador.astro     # Pricing engine
│   ├── laboratorio.astro   # Chat IA + mockup preview
│   ├── contacto.astro      # Formulario de contacto
│   ├── servicios/
│   │   ├── index.astro     # Índice
│   │   ├── osint.astro
│   │   └── testing.astro
│   └── templates/
│       ├── index.astro     # Marketplace
│       └── [slug].astro    # Detalle por template
├── components/             # Nav, Hero, Footer, WebGLBackground
├── layouts/                # Base layout con security headers
├── lib/                    # (vacío — lógica vive en /data/)
├── data/                   # Single source of truth: pricing, templates, catalog
└── styles/                 # global.css con tokens lava neon
```

## Getting Started

```bash
# Install
npm install

# Dev
npm run dev -- --port 4321 --host 127.0.0.1

# Build (static output to ./dist/)
npm run build

# Preview production build
npm run preview -- --port 4321 --host 127.0.0.1
```

## Deploy

Push to `main` → GitHub Actions build → deploy to `nxxo31.github.io/NX-Studio/`.

## Docs

- `PROJECT.md` — single source of truth (sprints, arquitectura, limitaciones)
- `AGENTS.md` — reglas del proyecto para agentes
- `docs/research-pricing-patterns.md` — benchmarks de pricing

## License

Private — © 2026 NX-Studio. Todos los derechos reservados.