# PROJECT.md — NX-Studio

> **Estado:** Activo | **Versión:** 0.5.0 — Backend en Cloudflare Pages con D1 + Better-auth | **Stack:** Astro 7.3.2 + Tailwind v4 + TypeScript + Cloudflare adapter + Better-auth + Drizzle ORM

## Visión General

NX-Studio es el sitio web **empresarial** de Sebastian Velasco para posicionar la marca,
captar leads B2B y mostrar capacidades técnicas avanzadas que lo diferencian en el
mercado latinoamericano. Complementa al portafolio personal (`portafolio/`, Next.js) — el
personal muestra el expertise individual, el empresarial posiciona la oferta.

**Enfoque actual:** Solo productos de software (aplicaciones a medida, QA as a service,
templates comprables). **Servicios de investigación/OSINT eliminados del catálogo público**
(decisión operador 2026-10-09) — la oferta queda exclusivamente en construcción de
productos digitales.

**Backend state:** SSR completo en Cloudflare Pages. Better-auth para auth de cliente
(portal) y admin. Cloudflare D1 para persistencia. Email transaccional vía Resend.
Objetivo: un sitio funcional con formulario de contacto con persistencia real,
panel admin para el operador, y opcionalmente un portal de cliente donde ver el
estado de su licitación.

**Runtime:** Cloudflare Pages con output='server' — todos los `/api/*` routes son
Pages Functions ejecutadas en el edge. El frontend sigue siendo mayoritariamente
estático para SEO y velocidad.

## Identidad de marca · Sistema de diseño canónico

El sistema de diseño canónico vive en `DESIGN.md` (155 líneas, 4.8 KB).
NO duplicar tokens aquí — apuntar siempre a DESIGN.md.

Resumen: 5 paletas (4 dark + 1 light) que comparten el mismo contrato
de tokens. Default = `steel-indigo`. Auto-switch dark/light via
`prefers-color-scheme` la primera visita. Override manual con
`data-palette="<id>"` en `<html>`. IDs disponibles: `steel-indigo`,
`lava-pure`, `obsidian-teal`, `navy-gold`, `azure-light`.

WCAG 2.1 AA validado en todas las combinaciones. Geometría: bordes
angulares con chamfers (clip-path), grid lines, scan-line opcional,
monospace para números/códigos.

Histórico: la paleta "lava neon" (orange/rojiza) que documentaban las
versiones 0.2.0 → 0.4.0 quedó superseded por el sistema steel-indigo
con 5 paletas (sprint v0.5.0). Tokens legacy siguen disponibles como
`lava-pure` para secciones que necesiten el look Matrix.

## Estructura de páginas

```
/                           # Home (Hero con ProjectPreview, Servicios, Confianza,
                              #          Proceso, 2 CTAs)
/servicios                  # Índice de servicios especializados
  └── /testing              # QA: tiers Foundation/Accelerator/Strategic
/templates                  # Marketplace de templates comprables
  └── /[slug]               # Detalle por template (3 productos)
/cotizador                  # ★ Pricing engine (state local, tiempo real)
/laboratorio                # Chat IA + mockup preview
/contacto                   # Formulario WhatsApp + email
/brand                      # Preview del Brand component (3 variantes)  [sprint v0.3.0]
/logos                      # 8 prototipos con selector live                [sprint v0.3.0]
/palettes                   # 4 paletas con switcher sticky                 [sprint v0.3.0]
```

**OSINT eliminado del catálogo público** (2026-10-09). `/servicios/osint.astro` borrado,
feature `osint` removida de pricing.ts y FEATURES array en contacto.astro, Zod enum de
`/api/licitacion` actualizado, copy de Home/Base/Hero ajustado. Solo permanece
Testing & QA como servicio especializado.

## Servicios ofrecidos

### Capacidades core (productos de software)

- Arquitectura de software a medida
- Desarrollo full-stack (web/mobile/PWA)
- IA aplicada (chatbots, RAG, agentes)
- Integraciones (Stripe, Resend, Twilio, OpenAI)
- Modernización de stacks legacy

### Servicios especializados

- **Testing & QA** — Manual + automation, performance, accesibilidad WCAG 2.1 AA,
  security pen-testing. Tiers Foundation/Accelerator/Strategic con platform fee
  separado de seat licenses (modelo OutpostQA).

### Productos

- **Templates comprables** — Landing Converter $290, Dashboard Starter $590,
  Headless E-commerce $890. One-time payment, código MIT-licensed.

> OSINT / investigación de fuentes abiertas **fuera de catálogo**. La página
> `/servicios/osint.astro` fue removida; si vuelve a necesitarse, hay que crearla
> de cero (no hay rastro del contenido anterior en `src/`).

## Pricing engine (diferenciador backend)

`src/data/pricing.ts` define:

- **18 features** organizadas en 5 categorías (core/design/backend/growth/ops)
- **4 engagement shapes**: fixed / retainer / dedicated / tm
- **3 modifiers**: rush +25%, bundle -10% (>80h), longterm -15% (≥12mo)
- **Cálculo**: `(sum(features) + baseFee) × multipliers` con rango ±15% (alineado
  industria: "no publicamos precio exacto")
- **Output**: banda Starter / Standard / Growth / Enterprise

UI con state local vanilla JS en `/cotizador`. **El cálculo se duplica en el servidor**
(vía `computeQuote` desde `~/data/pricing`) cuando se persiste la licitacion a D1 —
nunca confiamos en el total calculado por el cliente.

## Backend (funcionalidad, no solo UI)

Desde v0.5.0 hay un backend SSR en Cloudflare Pages (`output=server`):

- **`/api/licitacion`** — POST con Zod, pricing server-side (computeQuote), persistencia
  en D1 tabla `licitacion`, email de notificación al operador (Resend), honeypot
  anti-spam. **No requiere auth.** Si la request trae cookie de sesión, se vincula
  `user_id` — si no, sigue siendo anónima.
- **`/api/auth/[...all]`** — catch-all para better-auth. Endpoints: `sign-up/email`,
  `sign-in/email`, `sign-out`, `session`, `verify-email`, OAuth callbacks (si Google/GitHub
  están configurados).
- **`/portal/*`** — rutas protegidas (requieren sesión). El cliente ve el estado de
  sus licitaciones en tiempo real.
- **`/admin/*`** — rutas admin protegidas con Cloudflare Access (no better-auth).
  El operador gestiona licitaciones, marca status, y configura el sistema.

**DB (Cloudflare D1):**

| Tabla       | Contenido                                          |
|-------------|----------------------------------------------------|
| `user`      | Clientes + admin. role: 'cliente' (default) o 'admin' |
| `session`   | Sessions activas (DB session, no JWT)              |
| `account`   | Providers: 'credential' (password), 'google', 'github' |
| `verification` | Tokens magic link, email verify, password reset |
| `licitacion` | Todos los submits de /contacto — email, tipo, engagement, pricing, status |
| `proyecto`  | 11 productos del catálogo (NXC, SYN, E14...)       |
| `template`  | 3 templates comprables ($290/$590/$890)             |
| `compra`    | Compras manuales de templates (confirmadas por operador) |

**Stack del backend:**

| Capa        | Tecnología                                       |
|-------------|--------------------------------------------------|
| DB          | Cloudflare D1 (SQLite serverless)                |
| ORM         | Drizzle ORM 0.45                                  |
| Auth        | Better-auth 1.7 (OAuth + magic links + passwords) |
| Email       | Resend (mock en dev/tests)                        |
| Validación  | Zod 3                                            |
| Tests       | Vitest 5 + fake D1 (better-sqlite3 in-memory)    |

## Estado de implementación

| Fase | Descripción | Commit |
|------|-------------|--------|
| Phase 0 | Foundation: Astro 7 + Tailwind v4 + estructura | (anterior) |
| Phase 1 | Hero asimétrico, Servicios, Proceso 5 fases, LITA, Stack, Impacto, Contact | `ac3128b` |
| Phase 2 | Catálogo productos (11 repos reales) | `77ce0b8` |
| Phase 3 | Laboratorio IA (chatbot + Pollinations) | `77ce0b8` |
| Phase 4 | Pricing engine + Servicios especializados + Templates | `5282fff` |
| Phase 5 | Migración a SSG estático puro (GitHub Pages) | `3b97b1c` |
| Phase 6 | Servicios + templates marketplace + brand/logos/palettes | `53130aa`, `b5b2c7e` |
| Phase 7 | Reimaginación Home narrativa + WebGL hex/scan + ProjectPreview | ✓ |
| Phase 8 | Migración a Cloudflare Pages SSR + Resend + /api/licitacion | `7000794` ★ |
| Phase 9 | QA playwright suite + project screenshot capture pipeline | `8b88180` |
| Phase 10 | Backend foundation: D1, better-auth, schema, repos, seeds, tests | (este commit) ★ |
| Phase 11 | /admin panel (list + detail + status) + /docs público. Portal e i18n diferidos (decisión operador 2026-10-11) | — |

## Sprint v0.4.0 (cerrado)

**Reimaginación narrativa del Home**

Tareas completadas:
- [x] Reescribir Home (`src/pages/index.astro`) con narrativa 3 bloques:
      ¿Qué hacemos? → ¿Por qué confiar? → ¿Cómo trabajamos? → 2 CTAs finales
- [x] Reemplazar terminal animado del Hero por `<ProjectPreview>` del flagship NexoCore
- [x] Reescribir `WebGLBackground.astro` con 4 capas CSS+SVG (hex grid, scan lines,
      2 glows lavanda/lava, vignette). Sigue siendo 100% CSS+SVG, zero JS.
- [x] Crear `src/components/ProjectPreview.astro` — mockup browser-dashboard por
      categoría (SaaS/IA/DevTools/Seguridad/3D/Web/Backend), 576 líneas, 0 JS, 0 canvas
- [x] Crear `scripts/preview-clean.mjs` — limpia lockfiles stale de Astro
      (`.astro/dev.json`, `.astro/preview.json`). Resuelve `Another astro server is
      already running` cuando se mata el wrapper bash sin liberar node.
- [x] `package.json`: scripts `dev:clean` y `preview:clean` que invocan el script
- [x] Tuning visual en `global.css`: grid 0.5→0.25, grain 0.25→0.35
- [x] Nav: Brand variant `wordmark` → `lockup`
- [x] Build exit 0, 14 páginas estáticas (incluye /brand /logos /palettes del sprint previo)
- [x] Smoke test 12/12 HTTP 200
- [x] Cero dependencias nuevas — sigue siendo solo `astro` + `tailwindcss`

**Sprint v0.3.0 — SSG + servicios/templates + brand system (cerrado en `b5b2c7e`)**

Tareas completadas (referencia):
- [x] Migrar a output: 'static' (sin @astrojs/node, sin SSR)
- [x] Quitar dependencias innecesarias (three, gsap, lenis, resend, better-sqlite3)
- [x] Borrar archivos runtime (data/nx-studio.db*, src/lib/db.ts, src/pages/api/*)
- [x] Reescribir WebGLBackground como CSS-only (zero JS) — primera iteración
- [x] Refactor Nav a data-driven, agregar Servicios + Templates
- [x] Crear /servicios/{index, osint, testing}.astro
- [x] Crear /templates/{index, [slug]}.astro
- [x] Crear /brand, /logos, /palettes (Brand component + palette switcher)
- [x] Build exit 0, 14 páginas estáticas
- [x] Smoke test HTTP 200
- [x] Headers de seguridad en Base.astro

Pendientes (futuros sprints):
- [ ] /portal/* portal cliente — diferido por decisión operador 2026-10-11
      (requiere better-auth verificado E2E en Pages Functions antes de exponerse)
- [ ] i18n — BLOQUEADO hasta decisión operador (ES-only por ahora)
- [ ] /proceso (metodología 5 fases) — la versión inline del Home ya cubre esto
- [ ] /precios (engagement shapes + tiers) — el cotizador y /docs ya cubren pricing
- [ ] /productos (catálogo 11 repos) + /productos/[slug]

## Sprint actual

**Sprint v0.6.0 — Phase 11 acotada: /admin panel + /docs público (2026-10-11)**

Scope definido por el operador (kanban t_c45baff3): Phase 11 original era
demasiado amplio (admin + portal + i18n + docs). Se acotó a:

- [x] `src/pages/admin/index.astro` — listado de licitaciones con filtro por
      status, contadores, rango de precios, update inline de estado
- [x] `src/pages/admin/licitacion/[id].astro` — detalle completo de una
      licitacion (contacto, engagement, features cotizadas, descripción, estado)
- [x] `src/pages/api/admin/update-status.ts` — POST form/JSON, validación Zod,
      redirect 303 al panel; protección por Cloudflare Access (no auth in-app,
      decisión operador)
- [x] `src/pages/docs.astro` — documentación pública derivada de
      `docs/research-pricing-patterns.md` (pricing por features, 4 engagement
      shapes, tiers QA, licencia de templates). Sin sección OSINT (fuera de
      catálogo desde 2026-10-09)
- [x] Footer: link a /docs en columna "Sitio"
- [x] Build exit 0 (`npx astro build --outDir .build-check` — el outDir
      temporal evita un lock EPERM de `dist/` por proceso huérfano; `dist/`
      es gitignored así que no afecta el commit)
- [x] vitest 80/80 tests verdes

Decisiones registradas:
- **Auth de /admin**: Cloudflare Access sobre `/admin*` y `/api/admin*`
  (no better-auth). Documentado como decisión operador. Nota de deploy:
  requiere crear la Access policy en el dashboard Cloudflare antes de
  exponer producción — sin esa policy las rutas quedan abiertas.
- **/portal cliente**: NO implementado en este sprint. El scaffolding de
  better-auth existe (Phase 10) pero el portal requiere pruebas E2E antes
  de exponer a clientes. Queda como pendiente.
- **i18n**: NO decidido. El sitio queda ES-only (consistente con AGENTS.md
  "Español exclusivo"). La decisión ES vs ES+EN queda con el operador.

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

1. **Cotizador ahora persiste en D1**: el cálculo client-side sigue existiendo para
   UX (real-time) pero el `submit` pasa por el servidor (D1 + email + pricing
   server-side). Email al operador vía Resend.
2. **Templates sin payment real**: el botón de comprar redirige a
   `/contacto?topic=template&slug=X` — no hay Stripe checkout (supuesto de cobro
   manual, respeta preferencia del operador).
3. **Sin portal de cliente**: diferido (decisión operador 2026-10-11). El
   scaffolding better-auth existe (Phase 10) pero el portal no se expone hasta
   tener pruebas E2E sobre Pages Functions.
4. **Seed de producción se aplica manualmente**: `npm run db:seed:remote` requiere
   `wrangler` + auth Cloudflare. No hay CI/CD todavía.
5. **Sin i18n**: solo ES. Pendiente decisión.
6. **Catálogo sin videos**: `videoUrl` queda undefined en la seed por ahora.
7. **Tests: vitest + playwright: 80 unit/integration tests + E2E Playwright. Arquitectura
   de tests con fake D1 + vitest para backend, Playwright para UI.
8. **Working tree con cambios sin commitear** (Nav.astro, Base.astro, global.css,
   palettes.css, Brand.astro, productos/[slug], templates/[slug]): migración
   parcial a nueva paleta / decoraciones / DESIGN.md — no pushear sin revisar.

## Referencias

- `docs/research-pricing-patterns.md` — benchmarks estructurales (NO visuales) de
  Vertex, Toptal, Andela, Arc.dev, OSINT firms, QA firms.
- `docs/deploy.md` — instrucciones de deploy a Cloudflare Pages (auth, secrets, seeds)
- Astro docs: https://docs.astro.build
- Tailwind v4: https://tailwindcss.com/
- Better-auth: https://better-auth.com
- Cloudflare D1: https://developers.cloudflare.com/d1/

---

*Generado por SophIA — Sebastian Velasco's autonomous operating system*
*v0.5.0: 2026-10-09 — Backend foundation: D1 + better-auth + Cloudflare Pages + tests.*

## Histórico documentos consolidados (archivado 2026-10-11)

Los siguientes 3 documentos fueron consolidados o superseded por las
secciones de este PROJECT.md. Se mueven a `_archive/2026-10-11/`
para cumplir la regla "no archivos .md sueltos" (memo #172):

| Archivo                          | Tamaño | Razón del archivo                                       |
|----------------------------------|--------|--------------------------------------------------------|
| `PORTFOLIO_CONCEPT.md`           | 4.8 KB | Narrativa alternativa de portafolio. Duplica §Servicios |
| `NX-STUDIO_COMPLETE_MODEL.md`    | 15 KB  | Narrativa "LATAM partner" con LITA. Supersedida por §Visión + §Stack |
| `RESEARCH.md`                    | 9 KB   | Research de competencia y pricing. Migrado a dark-memory memo #186 |

Mantenido en root (no es cruft):
- `DESIGN.md` (155 líneas, 4.8 KB) — sistema de diseño canónico.

Acceso al histórico: `_archive/2026-10-11/` sigue accesible vía git log.
