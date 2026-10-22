# AGENTS.md — NX-Studio

**Proyecto:** Sitio web empresarial de NX-Studio (estudio de desarrollo LATAM)
**Stack:** Astro 7.3.2 + Tailwind v4 (vía @tailwindcss/vite) + TypeScript
**Output:** Cloudflare Workers SSR (D1 + Resend + better-auth) — https://nx-studio.nx-studio.workers.dev
**Identidad:** Monocromática única (v0.9.0) — escala de grises calibrada contra el agujero negro. **Sin dark/light mode.** Detalles: `PROJECT.md § Identidad de marca`

## Reglas del proyecto

### Idioma y comunicación

- **Comunicación con Sebastian:** Español exclusivo
- **Contenido del sitio:** trilingüe ES/EN/PT (i18n auto-detect, memo #192); /admin y /docs quedan ES-only
- **Comentarios de código y docs:** Español
- **Nombres de variables, funciones, archivos:** Inglés
- **Términos técnicos estándar:** Inglés (commit, deploy, middleware, endpoint)
- **Razonamiento técnico interno:** Inglés

### Sistema de diseño — Monocromático (v0.9.0)

Tokens centralizados **solo** en `src/styles/global.css` (`@theme` + `:root`). No hay archivo de paletas: la escala de grises es la única paleta.

- Base `--nx-bg: #050505` calibrada contra el agujero negro. Superficies `--nx-surface: #0e0e0e`, `--nx-surface-raised: #171717`. Tinta `--nx-ink: #ededed`, texto `--nx-text: #f5f5f5`.
- Blanco roto `--nx-primary: #fafafa` reservado para CTAs y texto-on-primary invertido. Acentos **lavados** (`--nx-secondary: #b8b8b8`, `--nx-accent: #b8b8b8`); semánticos desaturados (`--nx-success: #b6cfc0`, `--nx-warn: #cfc4a6`, `--nx-danger: #d3a9a9`).
- **NO hardcodear colores** — siempre `var(--nx-*)` o clases Tailwind `text-nx-text`, `bg-nx-surface`, `border-nx-border`.
- Tipografía: `--font-display` (Space Grotesk) para headings, `--font-mono` (JetBrains Mono) para código/números, `--font-body` (Inter) para texto. Radius progresivo `--radius-xs` 4px → `--radius-4xl` 48px (las esquinas cuadradas del brutalism ya no aplican).
- Detalles completos: `PROJECT.md` (canónico) + `DESIGN.md`

#### Carve-out: el agujero negro ES un glow

`src/components/ui/optimized-black-hole.tsx` (WebGL2, ~180 líneas, cero dependencias) dibuja el fondo global como `position: fixed; z-index: 0` detrás del contenido. Es el **único glow permitido en el proyecto** y la excepción explícita a la prohibición histórica de glows — no la reescribas como "prohibido".

Dos backends conviven en el repo, solo uno activo:

| | Estado | Detalle |
|---|---|---|
| `optimized-black-hole.tsx` + `optimized-black-hole-utils/` | **ACTIVO** | WebGL2 crudo, monocromo por construcción (`uMono = 1` en el shader). Respeta `prefers-reduced-motion`, `IntersectionObserver` (pausa fuera de viewport), `document.hidden`, cleanup con `WEBGL_lose_context`. Si WebGL2 falla: `canvas.style.display = 'none'` y degradación silenciosa. |
| `optimized-black-hole-vgpu/` | **DORMIDO** | WebGPU + WGSL de 21st.dev. Edit monocromático ya aplicado (rampa térmica neutralizada a luminancia en `shade.wgsl.ts`, `stars.warmth = 0`). No se importa desde ningún sitio. Activarlo requiere `npm i vgpu` (~8.7 MB unpacked, 57 deps transitivas) **y** un wrapper con detección de WebGPU + fallback a WebGL2: sin fallback, `initialize()` lanza, `ready` rechaza y el host queda con un rectángulo negro a pantalla completa. |

No introduzcas un tercer fondo animado, ni CSS gradients como sustituto del agujero negro.

#### Bridges legacy `--lava-*` (deprecados, aún en uso)

`global.css:328-336` mantiene un bloque "Bridge legacy" que mapea los nombres antiguos a tokens actuales:

```
--lava-core  → var(--nx-primary)      --lava-glow      → var(--nx-glow)
--lava-edge  → var(--nx-secondary)    --lava-glow-soft → var(--nx-primary-tint)
--lava-deep  → var(--nx-primary-deep) --bg-void        → var(--nx-bg)
--bg-ember   → var(--nx-surface)
```

Clases `.lava-card`, `.lava-card-accent`, `.lava-btn`, `.lava-btn-ghost`, `.lava-tag`, `.hairline` y utilidades `.text-lava-edge` / `.bg-lava-soft` **siguen en uso en ~20 archivos**. Rinden en escala de grises. Al tocar un archivo, migra sus `lava-*` a `nx-*`; no introduzcas más `lava-*` nuevos. El bridge se borra solo cuando el último uso desaparezca.

### Accesibilidad obligatoria

- Animaciones respetan `prefers-reduced-motion: reduce`
- Navegación 100% funcional solo con teclado
- `aria-pressed` en toggles, `aria-label` en iconos, `aria-hidden="true"` en decorativos
- Contraste mínimo WCAG 2.1 AA — verificar `--nx-ink` sobre `--nx-bg`
- No usar solo color para transmitir información
- `prefers-reduced-motion` honrado en el agujero negro (`uSway = 0`, `clickEffect` ripple desactivado cuando `reduce`); si WebGL2 no está disponible el canvas se oculta sin romper layout

### Ciberseguridad / seguridad

- SSR en Cloudflare Pages: runtime serverless con /api/* (licitacion, auth, admin) — cada endpoint nuevo requiere validación Zod + revisión de auth
- Headers de seguridad en `Base.astro`: `X-Content-Type-Options: nosniff`, `referrer: strict-origin-when-cross-origin`
- Canonical URLs por página (defense-in-depth para SEO anti-duplicación)
- `.gitignore` estricto: `.env*`, SQLite artifacts, IDE/editor temp, coverage
- **Secrets NUNCA en código fuente** — producción: `wrangler pages secret put <NAME> --project-name nx-studio`; local: `.dev.vars` (gitignored)
- Scripts third-party: revisar licencias antes de agregar dependencias
- Validación en dos capas: HTML5 client-side + Zod server-side en /api/* — los envíos de contacto persisten en D1 y notifican vía Resend

### Flujo de trabajo

- Antes de tocar código: cargar skills relevantes (astro-best-practices, design-md)
- Proyectos multi-fase: actualizar `PROJECT.md` con cada sprint
- Confirmar con Sebastian antes de cambios arquitectónicos o irreversibles
- 'Avanza con todo' = ejecutar autónomamente sin pausas
- **Conventional commits** (type(scope): description) — un commit por feature lógico

### Pricing engine (`src/data/pricing.ts`)

- **18 features** en 5 categorías (core/design/backend/growth/ops) — agregar nuevas features al array, no modificar existentes sin confirmar
- **4 engagement shapes**: añadir nuevas shapes requiere extender el tipo `EngagementShape` Y el objeto `ENGAGEMENT_SHAPES`
- **3 modifiers**: añadir al array `MODIFIERS` con su `appliesTo`
- **Output**: rango ±15%, banda Starter/Standard/Growth/Enterprise
- **Filosofía**: nunca publicar precio exacto, solo rango indicativo (alineado con industria)
- **Single source of truth**: este archivo es el canónico. NO duplicar en `lib/` ni otros paths.

### Servicios y templates

- **OSINT** (`/servicios/osint`): solo métodos legales y éticos, GDPR compliant. Pricing role-based.
- **Testing** (`/servicios/testing`): tiers con outcomes, NO horas facturadas. Platform fee separado de seat licenses.
- **Templates** (`/templates`): añadir al array `TEMPLATES` en `src/data/templates.ts`. Estructura incluye/excludes clara.

### Catálogo de productos (`src/data/catalog.ts`)

- **11 repos reales** de Nxxo31 mapeados a productos
- `videoUrl` queda undefined por ahora (se llenará cuando proyectos estén finalizados)
- Cada producto: slug, code, name, tagline, desc, category, stack, repo, impact, year, status
- Categorías: SaaS / IA / DevTools / Seguridad / 3D / Web / Backend

## Development loop

1. Leer PROJECT.md → revisar sprint activo y limitaciones conocidas
2. `git status` → ver estado del repo
3. Skills loaded automáticamente por el agente según stack
4. Para tareas >1 archivo o UI work: pensar primero qué construir, mostrar mockups si es UI, luego escribir código
5. **Build gate**: `npm run build` debe dar exit 0 con todas las páginas compiladas
6. **Smoke test gate**: `npm run build` + servir `dist/client`, curl a todas las rutas afectadas, verificar HTTP 200
7. **Test gates**: `npm run test` (vitest, 299 tests) + `npm run test:e2e` (playwright) en verde antes de commit
8. Update PROJECT.md con resultados ANTES de commit
9. Commit atómico con conventional message (type(scope): description) — **1 cambio lógico = 1 commit**
10. `git push origin main` solo con working tree limpio y gates verdes

## Reglas críticas

- **NUNCA** usar colores hardcoded — siempre `var(--nx-*)` o clases Tailwind semánticas
- **NUNCA** reintroducir paletas, dark/light mode, ni `PaletteSwitcher` — la identidad es monocromática única desde v0.9.0
- **NUNCA** introducir un glow nuevo — el agujero negro es el único carve-out
- **NUNCA** introducir `lava-*` nuevos — usa `nx-*` (el bridge legacy se está drenando)
- **NUNCA** activar `optimized-black-hole-vgpu/` sin fallback WebGL2 (rompe Safari <26 y Firefox <141 con un rectángulo negro)
- **NUNCA** agregar `videoUrl` falso al catálogo (queda undefined hasta que el video exista)
- **NUNCA** publicar precio fijo en OSINT/Testing — solo rangos o tiers
- **NUNCA** copiar estilo visual de Vertex/Toptal/etc. — solo patrones estructurales
- **NUNCA** saltarse el smoke test después de añadir páginas nuevas
- **NUNCA** introducir dependencias pesadas (three.js, gsap, lenis, vgpu) en el client bundle — el frontend sigue siendo mínimo
- **NUNCA** agregar endpoints/API routes sin validación Zod + secret scan + test — el backend vive en Pages Functions
- **NUNCA** confiar en `npm run dev` para verificación visual — ver "Bug conocido" abajo; usar `npm run build` + servir `dist/client`

## Bug conocido: `astro dev` no hidrata

En `astro dev` **0 de 4 islas hidratan**. Error: `Failed to fetch dynamically imported module: /@id/astro:scripts/before-hydration.js (404)`. Es **preexistente**, no lo causa el agujero negro ni la migración monocroma (Astro quita el atributo `ssr` de una isla al hidratarla; cuenta 0/4 significa ninguna hidrató). Incluye islas anteriores a este trabajo: `NXSculptureHero`, `ProjectSlider`, +2.

**Workaround de desarrollo: `npm run build` y servir `dist/client` estáticamente.** En build de producción hidrata 4/4 sin errores. No inventes workarounds sobre este bug ni persigas corregirlo durante tareas de otro alcance.

## Comandos frecuentes

```bash
# Dev server (NO trustworthy para verificación visual: 0/4 islas hidratan, ver "Bug conocido")
npm run dev -- --port 4321 --host 127.0.0.1

# Build producción
npm run build

# Smoke test SSR local (el adapter cloudflare requiere wrangler para preview)
npm run build
npx wrangler pages dev dist --port 4321
# en otra terminal:
curl -s -o /dev/null -w "/ %{http_code}\n" http://127.0.0.1:4321/

# Suites
npm run test       # vitest 299 tests
npm run test:e2e   # playwright

# Deploy producción (Workers con static assets)
npx wrangler deploy --config dist/server/wrangler.json

# Push
git push origin main
```

## MCPs activos esperados

dark-memory · playwright · context7 · github

## Documentación de referencia

- `docs/research-pricing-patterns.md` — benchmarks estructurales (NO visuales) de Vertex, Toptal, Andela, Arc.dev, OSINT firms, QA firms
- `PROJECT.md` — single source of truth del proyecto (identidad, sprints, arquitectura, limitaciones)
- Astro docs: https://docs.astro.build
- Tailwind v4: https://tailwindcss.com/

---

*v0.9.0 — 2026-10-21: identidad monocromática única. Eliminados el sistema de paletas, PaletteSwitcher, BackgroundDecor y WebGLBackground. Fondo global = agujero negro WebGL2 como único glow permitido. Documentado el bug preexistente de hidratación en `astro dev`.*