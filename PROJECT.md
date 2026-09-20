# PROJECT.md — NX-Studio

> **Estado:** Activo | **Versión:** 0.3.0 — SSG estático en GitHub Pages | **Stack:** Astro 7.3.2 + Tailwind v4 (vía @tailwindcss/vite) + TypeScript

## Visión General

NX-Studio es el sitio web **empresarial** de Sebastian Velasco para posicionar la marca,
captar leads B2B y mostrar capacidades técnicas avanzadas que lo diferencian en el
mercado latinoamericano. Complementa al portafolio personal (`portafolio/`, Next.js) — el
personal muestra el expertise individual, el empresarial posiciona la oferta.

**Objetivo:** Sitio visualmente impactante con identidad lava neon naranja/rojiza,
sistema de pricing engine por features (diferenciador backend), catálogo de proyectos
reales y marketplace de templates comprables. **SSG puro** desplegado en GitHub Pages
(`nxxo31.github.io/NX-Studio/`).

## Identidad de marca · Lava Neon

Paleta naranja/rojizo Matrix-style, centralizada en `src/styles/global.css`:

- `--lava-core: #ff4500` (primario)
- `--lava-edge: #ff6a00` (highlight)
- `--lava-deep: #8b0000` (sombras)
- `--bg-void: #0a0608` (fondo base con tinte rojizo)
- `--bg-ember: #14090c` (surface)
- `--text-primary: #f5e6d3` (texto cálido)

Geometría: bordes angulares con chamfers (clip-path), grid lines de fondo, scan-line
animation opcional, monospace para números/códigos.

## Estructura de páginas

```
/                           # Home (Hero, Servicios, Pricing CTA, Licitar CTA)
/servicios                  # Índice de servicios especializados
  ├── /osint                # OSINT: due diligence, brand threat, leak monitoring
  └── /testing              # QA: tiers Foundation/Accelerator/Strategic
/templates                  # Marketplace de templates comprables
  └── /[slug]               # Detalle por template (3 productos)
/cotizador                  # ★ Pricing engine (state local, tiempo real)
/laboratorio                # Chat IA + mockup preview
/contacto                   # Formulario WhatsApp + email
```

## Servicios ofrecidos

### Capacidades core

- Arquitectura de software a medida
- Desarrollo full-stack (web/mobile/PWA)
- IA aplicada (chatbots, RAG, agentes)
- Integraciones (Stripe, Resend, Twilio, OpenAI)
- Modernización de stacks legacy

### Servicios especializados

- **OSINT** — Investigación de fuentes abiertas (personas, empresas, marcas, dominios,
  dark web). Pricing role-based: Analyst $80/h, Senior $110/h, Specialist $140/h.
  GDPR compliant, métodos legales y éticos.
- **Testing & QA** — Manual + automation, performance, accesibilidad WCAG 2.1 AA,
  security pen-testing. Tiers Foundation/Accelerator/Strategic con platform fee
  separado de seat licenses (modelo OutpostQA).

### Productos

- **Templates comprables** — Landing Converter $290, Dashboard Starter $590,
  Headless E-commerce $890. One-time payment, código MIT-licensed.

## Pricing engine (diferenciador backend)

`src/data/pricing.ts` define:

- **18 features** organizadas en 5 categorías (core/design/backend/growth/ops)
- **4 engagement shapes**: fixed / retainer / dedicated / tm
- **3 modifiers**: rush +25%, bundle -10% (>80h), longterm -15% (≥12mo)
- **Cálculo**: `(sum(features) + baseFee) × multipliers` con rango ±15% (alineado
  industria: "no publicamos precio exacto")
- **Output**: banda Starter / Standard / Growth / Enterprise

UI con state local vanilla JS en `/cotizador`. Cálculo client-side — sin backend.

## Estado de implementación

| Fase | Descripción | Commit |
|------|-------------|--------|
| Phase 0 | Foundation: Astro 7 + Tailwind v4 + estructura | (anterior) |
| Phase 1 | Hero asimétrico, Servicios, Proceso 5 fases, LITA, Stack, Impacto, Contact | `ac3128b` |
| Phase 2 | Catálogo productos (11 repos reales) | `77ce0b8` |
| Phase 3 | Laboratorio IA (chatbot + Pollinations) | `77ce0b8` |
| Phase 4 | Pricing engine + Servicios especializados + Templates | `5282fff` |
| Phase 5 | Migración a SSG estático puro (GitHub Pages) | `3b97b1c` ★ |
| Phase 6 | Páginas /servicios + /templates marketplace | TBD ★ |
| Phase 7 | (futuro) /proceso, /precios, /productos, /docs | — |

## Sprint actual

**Sprint v0.3.0 — SSG migration + servicios/templates pages (en progreso)**

Tareas completadas:
- [x] Migrar a output: 'static' (sin @astrojs/node, sin SSR)
- [x] Quitar dependencias innecesarias (three, gsap, lenis, resend, better-sqlite3)
- [x] Borrar archivos runtime (data/nx-studio.db*, src/lib/db.ts, src/pages/api/*)
- [x] Reescribir WebGLBackground como CSS-only (zero JS)
- [x] Refactor Nav a data-driven, agregar Servicios + Templates
- [x] Crear /servicios/{index, osint, testing}.astro
- [x] Crear /templates/{index, [slug]}.astro
- [x] Build exit 0, 11 páginas estáticas
- [x] Smoke test 11/11 HTTP 200
- [x] Headers de seguridad en Base.astro (X-Content-Type-Options, referrer, canonical, OG)

Pendientes:
- [ ] /proceso (metodología 5 fases)
- [ ] /precios (engagement shapes + tiers)
- [ ] /productos (catálogo 11 repos)
- [ ] /productos/[slug] (detalle por proyecto)
- [ ] /docs (research-pricing-patterns.md)
- [ ] Decidir i18n (ES vs ES+EN) — pendiente AGENTS.md

## Stack técnico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Framework | Astro | 7.3.2 |
| Styling | Tailwind CSS (vía Vite plugin) | 4.3.3 |
| TypeScript | | 5.7 |
| Hosting | GitHub Pages | (base: /NX-Studio/) |
| Identity | Lava neon (palette naranja/rojizo + chamfers + scan lines) | v0.3.0 |

## Decisiones arquitectónicas

| Decisión | Elegida | Razón |
|----------|---------|-------|
| Framework | Astro 7 | SSG + islands, ideal para sitios con poco JS |
| Output | `static` | GitHub Pages no soporta SSR; SSG es lo correcto |
| Pricing engine | Client-side (state local vanilla JS) | Sin backend, cálculo instantáneo, deploy simple |
| Engagement shapes | 4 formas (fixed/retainer/dedicated/tm) | Patrón consistente en B2B dev shops |
| OSINT pricing | Role-based (analyst/senior/specialist) | Alineado con benchmarks Smart Intelligence |
| QA pricing | Tiers + platform fee separado | Transparencia (OutpostQA pattern) |
| Templates | One-time payment, MIT-licensed | Modelo Arc.dev marketplace |
| Identidad | Lava neon naranja/rojizo | Distintiva vs competencia púrpura/azul |

## Seguridad

- Site 100% estático: sin endpoints dinámicos, sin superficie de ataque runtime
- Headers via `<meta>`: `X-Content-Type-Options: nosniff`, `referrer: strict-origin-when-cross-origin`
- Canonical URLs por página (evita contenido duplicado en Google index)
- `robots: index, follow`
- `.gitignore` estricto: `.env*`, SQLite artifacts, IDE/editor temp
- Secrets NUNCA en repo: API keys y tokens solo en runtime deployment
- OG/Twitter metadata en cada página (defense-in-depth en social sharing)

## Limitaciones conocidas

1. **Cotizador client-side**: el cálculo es local. Para enviar cotizaciones reales
   haría falta endpoint que persista (futuro: integración con backend externo).
2. **Templates sin payment real**: el botón de comprar redirige a
   `/contacto?topic=template&slug=X` — no hay Stripe checkout aún.
3. **OSINT sin intake form**: la página describe el servicio pero el intake se hace
   por el formulario de contacto general (param `topic=osint`).
4. **Sin i18n**: solo ES. Pendiente decisión.
5. **Catálogo sin videos**: `videoUrl` queda undefined en `catalog.ts` por ahora.
6. **Sin tests automatizados**: build manual + smoke test con curl.
7. **Páginas sin implementar** (ver Sprint actual): /proceso, /precios, /productos, /docs.

## Referencias

- `docs/research-pricing-patterns.md` — benchmarks estructurales (NO visuales) de
  Vertex, Toptal, Andela, Arc.dev, OSINT firms, QA firms.
- Astro docs: https://docs.astro.build
- Tailwind v4: https://tailwindcss.com/

---

*Generado por SophIA — Sebastian Velasco's autonomous operating system*
*v0.3.0: 2026-09-19 — Migración a SSG estático puro + páginas de servicios y marketplace.*