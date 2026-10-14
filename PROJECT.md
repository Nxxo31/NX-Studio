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

El sistema de diseño canónico vive en `DESIGN.md`.
NO duplicar tokens aquí — apuntar siempre a DESIGN.md.

Resumen: 2 paletas brutalistas (`brutal-dark` default + `brutal-cream`)
que comparten el mismo contrato de tokens `--nx-*`. Lava `#ff4500` como
único acento + tinta estructural (crema en dark, negro en cream) +
sombras duras sin blur + esquinas cuadradas (radius = 0 en toda la
escala Tailwind v4) + grilla expuesta. Auto-switch dark/light via
`prefers-color-scheme` la primera visita. Override manual con
`data-palette="<id>"` en `<html>`.

Histórico: lava neon v0.2.0→v0.4.0 (Matrix orange, chamfers) →
steel-indigo v0.5.0 (5 paletas, Linear vibe) → **brutalism v0.7.0
(2026-10-14, autorizado por el operador)**.

### Sprint brutalism (2026-10-14)

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
| Phase 11 | /admin panel (list + detail + status) + /docs público. Portal diferido (re-confirmado 2026-10-13) | `ec901fd` |
| i18n | ES/EN/PT auto-detect cf-ipcountry + cookie override + switcher footer + traducción completa (memo #192) | `32f01d8`, `82506a1` |

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
- [ ] /portal/* portal cliente — diferido por decisión operador 2026-10-11,
      re-confirmado 2026-10-13 (requiere better-auth verificado E2E en Pages
      Functions antes de exponerse)
- [x] i18n — decidido e implementado: ES/EN/PT auto-detect (memo #192),
      commits `32f01d8` (infraestructura) + `82506a1` (traducción)
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
| Identity | Lava neon (palette naranja/rojizo + chamfers + scan lines) | v0.3.0 |

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
3. **Sin portal de cliente**: diferido (decisión operador 2026-10-11). El
   scaffolding better-auth existe (Phase 10) pero el portal no se expone hasta
   tener pruebas E2E sobre Pages Functions.
4. **Seed de producción se aplica manualmente**: `npm run db:seed:remote` requiere
   `wrangler` + auth Cloudflare. No hay CI/CD todavía.
5. **i18n resuelto** (v0.6.1): ES/EN/PT auto-detect + switcher. /admin y /docs
   quedan ES-only deliberadamente.
6. **Catálogo sin videos**: `videoUrl` queda undefined en la seed por ahora.
7. **Tests: vitest + playwright: 80 unit/integration tests + E2E Playwright. Arquitectura
   de tests con fake D1 + vitest para backend, Playwright para UI.
8. **Working tree limpio** (verificado 2026-10-13): los cambios de paleta /
   decoraciones antes listados aquí ya están commiteados.

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
