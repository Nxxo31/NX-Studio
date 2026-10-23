# PROJECT.md — NX-Studio

> **Estado:** Activo — sprint Reimaginación cerrado | **Versión:** 0.9.0 — Cloudflare Workers con static assets, D1 (15 tablas), portal cliente + admin panel live | **Stack:** Astro 7.3.2 + Tailwind v4 + TypeScript + @astrojs/cloudflare + better-auth 1.7.7 + Drizzle ORM

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

**Runtime:** Cloudflare Workers con static assets (`nx-studio.nx-studio.workers.dev`)
— `output: 'static'` con `prerender = false` explícito en las rutas on-demand
(APIs, /portal/*, /admin/*, /productos, /templates). El resto del sitio queda
prerendered para SEO y velocidad.

## Identidad de marca · Sistema de diseño canónico

**Identidad actual: monocromática única (v0.9.0, 2026-10-21). Sin dark/light mode.** Única excepción de color: la rampa térmica del agujero negro (2026-10-23).

El sitio entero usa **una sola escala de grises** calibrada contra el fondo del
agujero negro. Tokens canónicos en `src/styles/global.css` (`@theme` + `:root`).
**No existe archivo de paletas** — se eliminó en v0.9.0.

| Rol | Token | Valor |
|---|---|---|
| Fondo base (calibrado al agujero negro) | `--nx-bg` | `#050505` |
| Superficie | `--nx-surface` | `#0e0e0e` |
| Superficie elevada | `--nx-surface-raised` | `#171717` |
| Tinta estructural | `--nx-ink` | `#ededed` |
| Texto | `--nx-text` | `#f5f5f5` |
| CTA / blanco roto | `--nx-primary` | `#fafafa` |
| Acento lavado | `--nx-secondary` / `--nx-accent` | `#b8b8b8` |
| Semánticos desaturados | `--nx-success` / `--nx-warn` / `--nx-danger` | `#b6cfc0` / `#cfc4a6` / `#d3a9a9` |

Tipografía: `--font-display` (Space Grotesk) · `--font-body` (Inter) ·
`--font-mono` (JetBrains Mono). Radius progresivo `--radius-xs` 4px →
`--radius-4xl` 48px.

### Fondo global: agujero negro

`src/components/ui/optimized-black-hole.tsx` (host fino) +
`optimized-black-hole-utils/renderer.ts` (WebGL2, cero dependencias) se renderiza
como `position: fixed; z-index: 0` detrás del contenido en `Base.astro`.
**Rampa térmica original en color** (restaurada 2026-10-23 por decisión del
operador, commit `09a93e6`): brasa → ámbar → blanco cálido con doppler beaming
relativista — valores canónicos del autor del componente (vercel-labs/vgpu).
Es el **único glow permitido** del proyecto y desde 2026-10-23 también la
**única excepción de color del sitio** (la UI permanece monocroma). La opción
`monochrome` del renderer permite volver al gris legacy v0.9.0.

Degradación: si WebGL2 no está disponible, `canvas.style.display = 'none'` y el
sitio sigue legible. Respeta `prefers-reduced-motion`, pausa fuera de viewport
(`IntersectionObserver`) y en `document.hidden`.

**Hero solo-texto (2026-10-22, decisión operador):** la escultura líquida WebGL2
se retiró del hero — `sculpture={false}` en `NXSculptureHero` (el componente
genérico `SculptureHero` ganó la prop `sculpture`, default `true`, con render
condicional del stage y guard en el effect de carga). El fondo global — el
agujero negro — es el único visual del hero; el hero va con fondo transparente
para que el canvas en z-0 se vea a través. Commit `27d6581`.

Existe un **segundo backend dormido** en `src/components/ui/optimized-black-hole-vgpu/`
(WebGPU + WGSL de 21st.dev, edit monocromático ya aplicado). No se importa desde
ningún sitio. Activarlo está **decidido como no** (2026-10-21): ~8.7 MB unpacked /
57 deps transitivas, y sin un wrapper de fallback a WebGL2 el sitio muestra un
rectángulo negro a pantalla completa en Safari <26 y Firefox <141.

> **Override normativo:** las reglas operativas viven en `AGENTS.md`. Este
> documento describe; `AGENTS.md` obliga. Ante conflicto, `AGENTS.md` manda.

Histórico: lava neon v0.2.0→v0.4.0 (Matrix orange, chamfers) →
steel-indigo v0.5.0 (5 paletas, Linear vibe) → brutalism v0.7.0 (2026-10-14) →
glass/depth v0.8.0 → **monocromático v0.9.0 (2026-10-21)**.

### Sprint monocromático v0.9.0 (2026-10-21)

Colapso del sistema de paletas a escala de grises única. Autorizado por el
operador.

**Eliminado:** `src/styles/palettes.css`, `src/components/PaletteSwitcher.astro`,
`src/pages/palettes.astro`, `src/components/BackgroundDecor.astro`,
`src/components/WebGLBackground.astro` (huérfanos del starfield viejo y del
showcase de paletas).

**Reescrito:** `src/styles/global.css` — `@theme` + `:root` a monocromo, mesh
`body::before` con radiales lava/indigo eliminado, import de `palettes.css`
retirado. `Base.astro` — anti-FOUC de tema removido, `<html>` ya no lleva
`data-palette`; el canvas del agujero negro queda como backdrop fijo z-0.
`Nav.astro` — imports y usos de `PaletteSwitcher` fuera (desktop y mobile); el
slot mobile del switcher se sustituyó por el CTA "Pedir propuesta" para no
dejar hueco visual. `NXSculptureHero.tsx` — theme fijo `'dark'`,
`accentColor #ff4500 → #fafafa`, background/darkBackground → `#050505`,
`MutationObserver` sobre `data-palette` eliminado.

**Añadido:** `src/components/ui/optimized-black-hole.tsx` +
`optimized-black-hole-utils/` (activo, WebGL2) y
`optimized-black-hole-vgpu/` (dormido, WebGPU de 21st.dev).

**Resultado:** `npm run build` exit 0, i18n-guard OK, 93 HTML generados
(96 → 93 = se fueron las 3 locales de `/palettes`). Verificación visual con
Playwright sobre `dist/client`: nav y CTAs en blanco, sin chips de tema,
agujero negro monocromo visible detrás del contenido.

**Nota operativa (actualizada 2026-10-23):** `astro dev` hidrata 4/4 desde
`dceb0a9` — el bug 0/4 islas era `run_worker_first` booleano en `wrangler.toml`.
Detalle en §Limitaciones conocidas 9.

**Bridges legacy:** `global.css:328-336` mantiene `--lava-core/edge/deep/glow/
glow-soft`, `--bg-void/ember` mapeados a tokens actuales, más las clases
`.lava-card/.lava-card-accent/.lava-btn/.lava-btn-ghost/.lava-tag/.hairline` y
utilidades `.text-lava-edge/.bg-lava-soft`. Rinden en escala de grises y siguen
en uso en ~20 archivos. Se drenan de forma incremental, no en un commit aparte.

### Sprint brutalism (2026-10-14) — histórico, superseded por v0.9.0

Refactor completo del UI a neobrutalismo (token-level + componentes base):

- `src/styles/global.css`: tokens + clases `.lava-card/.lava-btn/.lava-tag/
  .nav-link/.card-hover` redefinidas a bordes 2-3px + sombras duras
  `--nx-shadow-sm/…/lg` (offset fijo, sin blur). Eliminados grain SVG,
  vignette, chamfers, `.orb` y `.lava-scan` (neutralizados). Radius
  anulado vía tokens Tailwind `@theme --radius-*: 0`.
- `src/styles/palettes.css`: 2 paletas (`brutal-dark`, `brutal-cream`).
- `Base.astro`: anti-FOUC apunta a las nuevas IDs; WebGLBackground y
  BackgroundDecor desmontados (archivos conservados, reversibles).
- Componentes: Nav/Footer con bordes 3px sólidos (sin glass),
  PaletteSwitcher con nuevas IDs, Brand glifo plano lava (sin gradientes
  ni glow SVG), Hero chips como bloques sólidos, ProjectPreview sin
  halo/chamfer/sparkline con gradientes.
- `palettes.astro`: showcase reescrito a las 2 paletas nuevas + i18n
  ES/EN/PT actualizado.
- Tests: `tests/interactions.spec.ts` — el test de hover ahora aserta el
  contrato brutalista (borde cambia a lava). Build exit 0, vitest
  107/107. E2E: 42/52 passing = baseline (los 10 fallos restantes son
  preexistentes del sprint v0.5.0: `/servicios/osint/` 404 tras la
  retirada de OSINT 2026-10-09, título "Marca", `.status-live`
  duplicado, filtro SaaS — cubiertos por kanban t_a6154bf7).

Lección operativa: un comentario CSS con `*/` dentro del texto
(ej. `bg-nx-*/text-nx-*`) rompe el parser de `@import` de Tailwind v4
con error opaco "Missing opening (". Evitar esa secuencia en comentarios.

### Sprint 2026-10-14 (cont.) · Test pass + reemplazo de Pollinations + Lab brutalista

Diagnóstico end-to-end del sistema (sweep Playwright sobre 15 rutas en ambos
temas + interacción real de forms + backend API):

- **Frontend limpio**: 0 console errors, 0 page errors, 0 network 4xx/5xx en
  las 15 rutas × 2 paletas. La refactorización brutalista no introdujo
  regresiones.
- **Backend descubierto**: el form de `/contacto` devuelve 500 en local
  preview (`Failed query: insert into "licitacion"`). Root cause: `astro preview`
  para el adapter Cloudflare NO aplica las migraciones de Drizzle; solo
  `wrangler pages dev` lo hace. En producción (`nx-studio.nx-studio.workers.dev`)
  la tabla existe y los submits funcionan (las plantillas de email confirman
  flujo operativo). Acción: probar contacto en `wrangler pages dev` o staging,
  no en `astro preview`.
- **Fix preventivo real**: `computeQuote` tenía `let bandLabel = 'USD'` como
  default antes del if/else. Aunque todos los branches lo reasignan a un valor
  válido, el tipado era permisivo y un valor no-enum rompería la inserción
  D1 (banda es `text('banda', { enum: ['Starter','Standard','Growth','Enterprise'] })`).
  Cambiado a tipo estricto + default válido. Safety improvement, no bug activo.
- **Lab: Pollinations reemplazado**. El generador de mockups vía
  `image.pollinations.ai/prompt/...` produce imágenes IA mediocres,
  depende de una API pública sin SLA, puede fallar, y rompe la estética
  brutalista. Reemplazado por un generador SVG determinista en el navegador
  (`src/lib/mockup.ts`) que produce 5 tipos de wireframe brutalista
  (dashboard, landing, mobile, ecommerce, tool) con los tokens del estudio
  (lava + tinta, bordes duros, monospace). Cero red, cero claves, instantáneo.
  El chat de 5 preguntas + botón Regenerar (variaciones seeded) + output de
  SPEC copyable (resumen estructurado del producto que el visitante puede
  llevarse). Además el componente `Lab.astro` (home) y el disclaimer del Lab
  se limpiaron de gradientes/blur/soft-shadows heredados.
- **Portfolio quality**: 0 gradientes, 0 soft-shadows, 0 blur residuales en
  pages o components (grep). El sistema brutalista se mantiene consistente.

Verificación gates finales: build exit 0, vitest 107/107, e2e 43/52
(zero regresión; los 9 fallos restantes son los preexistentes del sprint
v0.5.0), smoke 13/13, Lab interact test 200 con SVG renderizado
(17 rects + 23 texts, status "✓ Mobile · v1"), contacto 500 (env).

## Estructura de páginas

```
/                           # Home (Hero solo-texto sobre el agujero negro global,
                              #          Servicios, Confianza, Proceso, 2 CTAs, Chatbot)
/servicios                  # Índice de servicios especializados
  └── /testing              # QA: tiers Foundation/Accelerator/Strategic
/productos                  # Catálogo de proyectos (18, SSR + GitHub live)
  └── /[slug]               # Detalle por proyecto
/templates                  # Marketplace de templates (SSR + filtros query string)
  └── /[slug]               # Detalle por template (3 productos)
/cotizador                  # ★ Pricing engine (state local, tiempo real)
/laboratorio                # Chat IA + mockup SVG determinista
/contacto                   # Formulario WhatsApp + email (D1 + Resend)
/docs                       # Pricing / engagement / licencias (público)
/brand /logos /style-lab    # Previews de marca e identidad            [históricos]
/portal/*                   # Portal de cliente (B7): login, dashboard, licitaciones,
                              #   proyectos, mensajes, perfil
/admin/*                    # Panel admin (B8): login, métricas, CRUD licitaciones/
                              #   proyectos/templates, usuarios, audit, deploys
```

(`/palettes` fue eliminada en v0.9.0.)

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
- **`/portal/*`** (Fase B7, live 2026-10-19) — portal de cliente: login (password +
  magic link), dashboard, licitaciones, proyectos, mensajes, perfil. Auth propia
  con sesión D1 (`lib/portal-auth.ts`, cookies `nx-studio-portal-`) + middleware
  guard + notificaciones Resend (`lib/portal-notifications.ts`).
- **`/admin/*`** (Fase B8, live 2026-10-19) — panel del operador: login con
  `admin_session`, RBAC 20 acciones × 4 roles (`lib/rbac.ts`), CRUD de
  licitaciones/proyectos/templates, gestión de usuarios, audit log INMUTABLE
  (triggers SQL) y deploy log. Cloudflare Access sobre `/admin*` queda como capa
  extra recomendada (pendiente en el dashboard CF, ~10 min; no bloquea — el panel
  ya exige login + RBAC).

**DB (Cloudflare D1):**

| Tabla | Contenido |
|-------|-----------|
| `user` | Clientes + admin. Custom: role, empresa, telefono, pais |
| `session` | Sessions better-auth (DB session, no JWT) |
| `account` | Providers: 'credential' (password), 'google', 'github' |
| `verification` | Tokens magic link, email verify, password reset |
| `licitacion` | Submits de /contacto — email, tipo, engagement, pricing, status, moneda display |
| `proyecto` | Catálogo de proyectos (18) + `cliente_id`, `portal_visible` (ext. B7) |
| `template` | 3 templates comprables ($290/$590/$890) |
| `compra` | Compras manuales de templates (confirmadas por operador) |
| `portal_session` | Sesiones del portal de cliente (B7) |
| `portal_activity` | Log de actividad del portal (B7) |
| `portal_message` | Mensajes cliente ↔ operador (B7) |
| `milestone` | Hitos por proyecto, visibles en el portal (B7) |
| `admin_session` | Sesiones del panel admin (B8) |
| `audit_log` | Audit INMUTABLE de acciones admin — triggers SQL (B8) |
| `deploy_log` | Registro de deploys visible en /admin/deploys (B8) |

**15 tablas** (8 core + 4 portal + 3 admin), schema canónico en
`src/db/schema.ts`. Migraciones `0002_portal.sql` y `0003_admin.sql` aplicadas
a la DB remota el 2026-10-22 (`wrangler d1 execute --remote` con el oauth
cacheado — `unset CLOUDFLARE_API_TOKEN` primero; ver `docs/deploy.md`).

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
| Phase 11 | /admin panel (list + detail + status) + /docs público. Portal diferido (re-confirmado 2026-10-13) | `ec901fd` |
| i18n | ES/EN/PT auto-detect cf-ipcountry + cookie override + switcher footer + traducción completa (memo #192) | `32f01d8`, `82506a1` |
| Phase 12 | Identidad monocromática v0.9.0: colapso de paletas a escala de grises + agujero negro WebGL2 como fondo global + eliminación de PaletteSwitcher/BackgroundDecor/WebGLBackground/palettes.astro | (v0.9.0) |
| B7 | Portal de cliente `/portal/*` — 13/13 tasks (dark-memory spec 16) | `617f8ff` + `d48ae48`, merge `e72a946` |
| B8 | Admin panel `/admin/*` — RBAC 20×4 + audit + deploys (spec 17) | `005bf68` + `db54d10`, merge `6c16cc6` |
| Phase 6 | Chatbot SophIA — FSM + 11 intents ES/EN/PT, bundle 12.9KB | `43f2627` |
| Phase 7 | Templates marketplace Dribbble-style (SSR + filtros) | `2f42ef1` |
| Q4 | Fix hidratación React #425/#423 (inline `<style>` RCDATA) | `35e054cd` |
| Fix dev | `astro dev` hidrata 4/4 — `run_worker_first` array | `dceb0a9` |
| Hero | Hero solo-texto — escultura retirada, el agujero negro es el visual | `27d6581` |
| Q6 | Restauración de la rampa térmica original del agujero negro (color) | `09a93e6` |

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
- [x] /portal/* portal cliente — LIVE desde B7 (2026-10-19, spec 16)
- [x] i18n — decidido e implementado: ES/EN/PT auto-detect (memo #192),
      commits `32f01d8` (infraestructura) + `82506a1` (traducción)
- [ ] /proceso (metodología 5 fases) — la versión inline del Home ya cubre esto
- [ ] /precios (engagement shapes + tiers) — el cotizador y /docs ya cubren pricing
- [x] /productos (catálogo 18 proyectos) + /productos/[slug] — live con
      integración GitHub (`api/proyectos.ts`)

## Sprint actual

**Cierre del sprint Reimaginación → v1.0 (2026-10-23)**

Backlog del sprint cerrado al 100%: fases 1-8 + B0-B8 (portal y admin live en
producción), chatbot SophIA, templates marketplace, identidad monocromática con
agujero negro global, hero solo-texto, D1 remoto con las 15 tablas y `astro dev`
hidratando 4/4. La Fase B9 (i18n + docs técnicos) se cierra con este realineo de
documentación — i18n verificado por el i18n-guard del build (669 keys, 93
archivos, 0 claves crudas en prerender). Único pendiente externo: T02 — crear la
Cloudflare Access policy sobre `/admin*` en el dashboard CF (~10 min, capa extra
de defensa sobre el login+RBAC que ya protege el panel).

---

**Sprint v0.6.0 — Phase 11 acotada: /admin panel + /docs público (2026-10-11)** *(histórico)*

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
- **i18n**: DECIDIDO 2026-10-11 (memo #192): ES/EN/PT con auto-detect
  cf-ipcountry + override por cookie `nx-studio-locale` + switcher en footer.
  Implementado en `32f01d8` (infraestructura: detect.ts, country-map.ts,
  middleware, LanguageSwitcher) y `82506a1` (traducción de body copy en las
  páginas públicas). Supersede el "ES-only" de este sprint: el contenido del
  sitio es trilingüe; la comunicación con el operador sigue en español.

### Sprint v0.6.1 — i18n ES/EN/PT (2026-10-11 → 2026-10-12)

- [x] Infraestructura auto-detect: `src/i18n/{detect,country-map,index}.ts`,
      `src/middleware.ts` (cf-ipcountry → Accept-Language → default es),
      cookie `nx-studio-locale` TTL 365d, `LanguageSwitcher.astro` en Footer
- [x] Traducción body copy: `src/i18n/{es,en,pt}.json` aplicada a las páginas
      públicas
- [x] NO TOCAR respetado: /api/*, /admin, /docs (quedan ES-only deliberadamente)
- [x] Verificación 2026-10-13 (operador, sesión opencode): `npm run build`
      exit 0 (adapter Cloudflare), vitest **107/107**

### Deploy 2026-10-13 — Cloudflare Workers + limpieza base path

**URL pública: https://nx-studio.nx-studio.workers.dev** (el subdomain de la
cuenta CF ya era "nx-studio"). El "pages.dev NXDOMAIN" quedó explicado: el
adapter @astrojs/cloudflare v14.3.3 targetea **Workers con static assets**
(dist/client + dist/server + wrangler.json generado), NO Pages clásico —
pages.dev nunca fue el destino de este build.

Provisioning creado (primera vez):
- D1 `nx-studio-db` id `9e19c8e0-57fb-4ab0-b572-80889c292987` + migrations
  (8 tablas) + seeds (proyectos + templates) aplicados en remoto.
- KV namespace `SESSION` id `f091bf1a355141128fad68a23cab69b3` — binding que
  el adapter agrega para Astro sessions (sin id el deploy falla con
  "SESSION bindings must have an id field").
- Secrets producción: `BETTER_AUTH_SECRET` (aleatorio 48B) +
  `CONTACT_EMAIL`. **FALTA `RESEND_API_KEY`** (el form /contacto persiste en
  D1 pero no envía email hasta que el operador cree la cuenta/key Resend).
- `workers_dev = true` + var `BETTER_AUTH_URL` actualizadas al dominio real.

Limpieza base path legacy `/NX-Studio` (33 ediciones, 16 archivos):
- `src/i18n/index.ts`: `localeUrl()` ya no inyecta BASE → links, canonical y
  hreflang limpios.
- Nav/Footer/Brand/Lab/Base.astro, productos/{index,[slug]}, templates/[slug],
  playwright.config + 2 specs, capture-projects.mjs, manifest nx-studio.
- `src/middleware.ts` conserva el BASE solo para normalizar inbound viejos.
- og:image: apuntaba a `raw.githubusercontent.../master/public/og-image.svg`
  (archivo inexistente → 404). Ahora usa el screenshot propio
  `/projects/nx-studio/desktop-home.png`.
- `astro.config.mjs` site → URL real (canonical/hreflang/og correctos).

Verificación en vivo: `/`, `/servicios`, `/en/docs/`, `/favicon.svg`,
og-image → todos 200; canonical `https://nx-studio.nx-studio.workers.dev/`.
Build exit 0 + vitest 107/107 tras la limpieza.

### Sprint v0.7.0 — canales de contacto + monedas display (2026-10-13)

Requisitos operador: WhatsApp +57 310 331 2705 como canal de cotizaciones,
peticiones a sebasvelascodev3101@gmail.com, info organizada al operador,
Laboratorio + Cotizador funcionando, precios en COP u otra moneda.

- [x] **Cotizador multi-moneda**: selector COP (default) / USD / EUR / MXN /
      BRL / ARS / CLP / PEN / GBP con tasas live de open.er-api.com (cache
      localStorage 24h, fallback estático si la API cae) + ancla "≈ USD"
      bajo el rango.
- [x] **Contexto cotizador→contacto**: el CTA lleva `?from=cotizador&shape=
      &features=&mods=&cur=&low=&high=`; /contacto pre-marca features, setea
      engagement/urgencia y muestra banner "Tu cotización €X — Y".
- [x] **WhatsApp integrado**: botón en cotizador con resumen prefilled,
      tarjeta directa en /contacto y footer, CTA en el panel de éxito.
- [x] **Moneda display persistida**: schema licitacion + columnas
      `display_currency/display_min/display_max` (ALTER remoto + local +
      init.sql + fixture tests); el admin muestra "vista cliente: EUR X – Y"
      junto al rango USD canónico.
- [x] **Email al operador mejorado**: features con nombres legibles (no IDs),
      horas estimadas, rango que vio el cliente. `CONTACT_EMAIL` secret
      actualizado a sebasvelascodev3101@gmail.com.
- [x] **Fix bug pre-existente**: respuesta del handler nunca incluyó
      `total_hours` (el form mostraba "undefinedh") — ahora se computa via
      computeQuote y viaja en cotizacion.total_hours.
- [x] Limpieza: stray `</Layout>` en contacto.astro; placeholders de contacto
      (`+57 1 234 5678`, `hola@nxstudio.dev`) reemplazados por datos reales.
- [x] i18n: keys nuevas en es/en/pt (currency, whatsappCta, quoteBanner).
- [x] Verificación Playwright en vivo: cotizador COP/EUR con tasas live,
      prefill, submit E2E con display EUR persistido en D1 (fila probe
      eliminada tras verificar), **Laboratorio completo: 5 mensajes →
      mockup Pollinations 768px renderizado**, 0 errores de consola.

PENDIENTE: `RESEND_API_KEY` — sin cuenta Resend el email queda en modo mock
(el form persiste en D1 y el admin lo muestra; WhatsApp funciona ya).

**PENDIENTES del deploy (sección anterior):**

1. ~~KNOWN ISSUE — SSR i18n 302~~ **RESUELTO 2026-10-13** (aprobación operador
   "Prerender + worker-first"): output `'static'` + `prerender=false` explícito
   en las 5 rutas on-demand (api/licitacion, api/auth/[...all],
   api/admin/update-status, admin/index, admin/licitacion/[id]) + `[assets]
   run_worker_first = true` en wrangler.toml — el middleware i18n ve cada
   request (auto-detect cf-ipcountry) y las páginas pre-renderizadas se
   sirven vía el binding ASSETS. Verificado en vivo: `/`, `/en/`, `/pt/`,
   `/en/servicios`, `/en/docs/` → todos 200 (antes las SSR devolvían 302).
2. **Cloudflare Access policy** para `/admin*` + `/api/admin*` en el
   dashboard CF — sin ella esas rutas quedan expuestas.
3. `RESEND_API_KEY` cuando exista cuenta Resend.
4. PAT del remote de GitHub ya limpiado (era cleartext); **rotar el PAT**
   recomendado — quedó expuesto en configs de workers previos.
5. Env var User-level `CLOUDFLARE_API_TOKEN` INVÁLIDO (not_before 2027-05-31)
   — regenerarlo desbloquea mymochis OCI y el MCP Code Mode.

## Stack técnico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Framework | Astro | 7.3.2 |
| Styling | Tailwind CSS (vía Vite plugin) | 4.3.3 |
| TypeScript | | 5.7 |
| Hosting | Cloudflare Workers (SSR + static assets) | nx-studio.nx-studio.workers.dev |
| Identity | Monocromática única + agujero negro WebGL2 como fondo global | v0.9.0 |

## Decisiones arquitectónicas

| Decisión | Elegida | Razón |
|----------|---------|-------|
| Framework | Astro 7 | SSG + islands, ideal para sitios con poco JS |
| Output | serverless SSR en Cloudflare Pages | Phase 8 (`7000794`): /api/licitacion + D1 requieren runtime; el SSG de Phase 5 quedó atrás |
| Pricing engine | Client-side (state local vanilla JS) | Sin backend, cálculo instantáneo, deploy simple |
| Engagement shapes | 4 formas (fixed/retainer/dedicated/tm) | Patrón consistente en B2B dev shops |
| OSINT pricing | Role-based (analyst/senior/specialist) | Alineado con benchmarks Smart Intelligence |
| QA pricing | Tiers + platform fee separado | Transparencia (OutpostQA pattern) |
| Templates | One-time payment, MIT-licensed | Modelo Arc.dev marketplace |
| Identidad | Lava neon naranja/rojizo | Distintiva vs competencia púrpura/azul |

## Seguridad

- SSR en Cloudflare Pages: endpoints dinámicos bajo /api/* (licitacion, auth,
  admin) con validación Zod; /admin* y /api/admin* protegidos por Cloudflare
  Access (policy en el dashboard — pendiente crear antes de producción)
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
3. **Portal de cliente y admin LIVE** (2026-10-19): la limitación original
   (diferido 2026-10-11) quedó superada — /portal/* y /admin/* tienen E2E
   Playwright propios (portal.spec, admin.spec) y D1 remoto con las 15 tablas.
4. **Seed de producción se aplica manualmente**: `npm run db:seed:remote` requiere
   `wrangler` + auth Cloudflare. No hay CI/CD todavía.
5. **i18n resuelto** (v0.6.1): ES/EN/PT auto-detect + switcher. /admin y /docs
   quedan ES-only deliberadamente.
6. **Catálogo sin videos**: `videoUrl` queda undefined en la seed por ahora.
8. **Tests: vitest (299 unit/integration, 16 archivos) + Playwright E2E.
   Arquitectura de tests con fake D1 + vitest para backend, Playwright para UI.**
9. **`astro dev` hidrata 4/4 desde `dceb0a9`** (2026-10-22): el bug 0/4 islas era
   `run_worker_first = true` (booleano) en `wrangler.toml` enrutando las requests
   de dev al worker antes del middleware de Vite; el fix es la forma ARRAY con
   las rutas de página/API. Si reaparece: revisar `run_worker_first`, NO la
   cadena @astrojs/react. Para verificación visual de producción, el gate sigue
   siendo `npm run build` + `astro preview` (o prod).
10. **Puente legacy `--lava-*` sigue en uso** (~20 archivos): drained
    incrementalmente, no bloquea funcionalidad.
11. **`.dev.vars` gitignored** contiene `TWENTYFIRST_API_KEY` (21st.dev) para
    el backend VGPU dormido. Si ese backend se reactiva, el nombre de env var
    debe reconciliarse con lo que `@21st.dev/vgpu` espere.

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
