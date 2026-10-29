# AGENTS.md — NX-Studio

**Proyecto:** Sitio web empresarial de NX-Studio (estudio de desarrollo LATAM)
**Stack:** Astro 7.3.2 + Tailwind v4 (vía @tailwindcss/vite) + TypeScript
**Output:** Cloudflare Workers SSR (D1 + Resend + better-auth) — https://nx-studio.nx-studio.workers.dev
**Identidad:** Monocromática única + temática galáctica (v0.10.0) — una escala de grises sobre el agujero negro, tipografía futurista self-hosted, superficies translúcidas. **Sin dark/light mode.** Detalles: `PROJECT.md § Identidad de marca`

## Reglas del proyecto

### Idioma y comunicación

- **Comunicación con Sebastian:** Español exclusivo
- **Contenido del sitio:** trilingüe ES/EN/PT (i18n auto-detect, memo #192); /admin y /docs quedan ES-only
- **Comentarios de código y docs:** Español
- **Nombres de variables, funciones, archivos:** Inglés
- **Términos técnicos estándar:** Inglés (commit, deploy, middleware, endpoint)
- **Razonamiento técnico interno:** Inglés

### Sistema de diseño — Monocromático futurista / galáctico (v0.10.0)

Tokens centralizados **solo** en `src/styles/global.css` (`@theme` + `:root`). No hay archivo de paletas: la escala de grises es la única paleta.

- Base `--nx-bg: #050505` calibrada contra el agujero negro. Superficies `--nx-surface: #0e0e0e`, `--nx-surface-raised: #171717`. Tinta `--nx-ink: #f2f2f2`, texto `--nx-text: #ffffff`, secundario `--nx-muted: #c2c2c2`, terciario `--nx-dim: #8f8f8f`.
- Blanco roto `--nx-primary: #fafafa` reservado para CTAs y texto-on-primary invertido. Acentos **lavados** (`--nx-secondary: #b8b8b8`, `--nx-accent: #b8b8b8`); semánticos desaturados (`--nx-success: #b6cfc0`, `--nx-warn: #cfc4a6`, `--nx-danger: #d3a9a9`).
- **NO hardcodear colores** — siempre `var(--nx-*)` o clases Tailwind `text-nx-text`, `bg-nx-surface`, `border-nx-border`.
- Tipografía **self-hosted** (OFL, cero peticiones a Google Fonts en runtime): `--font-display` = **Orbitron Variable** (display, geométrica y futurista), `--font-body` = Inter Variable, `--font-mono` = JetBrains Mono Variable. Radius progresivo `--radius-xs` 4px → `--radius-4xl` 48px.
- **Tracking de Orbitron:** la regla `h1,h2,h3,h4 { letter-spacing: 0.005em }` y la clase `.font-display` están **fuera de `@layer utilities` (unlayered)** → ganan sobre las utilidades `tracking-*` de Tailwind. No reintroducir tracking negativo: con Orbitron es ilegible.
- Detalles completos: `PROJECT.md` (canónico) + `DESIGN.md`

#### REGLA de tokens: duplicar en `@theme` y en `:root`

Un color se declara **DOS veces**:

| Bloque | Nombre | Para qué |
|---|---|---|
| `@theme` | `--color-nx-muted` | que exista la utilidad Tailwind `text-nx-muted` |
| `:root` | `--nx-muted` | consumirlo con `var(--nx-muted)` en CSS puro |

**En Tailwind v4 SOLO las variables `--color-*` de `@theme` generan utilidades.** Si declaras `--nx-muted` solo en `:root`, la clase `text-nx-muted` no existe: no hay error de build, la regla simplemente no se genera (pasó el 2026-10-28: 219 elementos en blanco puro). **Verifica siempre contra el CSS compilado** (`dist/client/_astro/*.css`), no contra el fuente: un grep en el fuente no prueba que la clase exista en el bundle.

#### Superficies translúcidas (la galaxia no se tapa)

`--nx-surface-translucent` (rgba(14,14,14,0.66)) y `--nx-surface-translucent-strong` (rgba(10,10,10,0.80)) con `backdrop-filter: blur(18px) saturate(140%)`. Nav, footer, `.glass-card`, `.glass`, `.glass-strong` y el chatbot usan translúcidos: el disco de acreción se ve a través del cristal.

- Escribe **solo** `backdrop-filter` (el estándar). **NUNCA** escribas `-webkit-backdrop-filter` a mano: Lightning CSS conserva solo el prefiado y el CSS compilado pierde la propiedad estándar (Firefox se queda sin blur).
- Una superficie **opaca** (`--nx-surface`) anula el blur: no hay nada detrás que difuminar.

#### Carve-out: el agujero negro ES un glow

`src/components/ui/optimized-black-hole.tsx` es el host del fondo global: `position: fixed; z-index: 0` detrás del contenido. Es el **único glow permitido en el proyecto** y la **única excepción de color del sitio** (la UI permanece monocroma) — no la reescribas como "prohibido".

Dos backends, ambos vivos:

| Backend | Papel | Detalle |
|---|---|---|
| `optimized-black-hole-vgpu/optimized-black-hole-utils/` | **PRIMARIO (WebGPU)** | Pipeline original de 21st.dev: raymarching de geodésicas nulas (lente gravitacional real), disco volumétrico con rampa térmica en color (brasa → ámbar → blanco cálido), bloom HDR. Entra por `dynamic import` → el chunk solo lo descarga quien tiene WebGPU. Requiere `vgpu@0.4.1`. |
| `optimized-black-hole.tsx` + `optimized-black-hole-utils/` | **FALLBACK (WebGL2)** | Renderer crudo (~9 KB) para navegadores sin WebGPU, fallo de init o `prefers-reduced-motion` (frame estático). Misma rampa térmica en color. |

Ambos degradan en silencio: si no hay WebGPU ni WebGL2, el canvas se oculta y el sitio sigue legible. Respeta `prefers-reduced-motion` y pausa fuera de viewport (`IntersectionObserver`) y en `document.hidden`.

No introduzcas un tercer fondo animado, ni CSS gradients como sustituto del agujero negro.

#### Puente legacy `--lava-*`: DRAINED (v0.10.0)

No queda ni una clase `lava-*` en el repo. El 2026-10-29 se migraron 284 ocurrencias en 30 archivos a `nx-*` y se eliminó el bridge de `global.css` (tokens `--lava-*`, `--bg-void`, `--bg-ember`, clases `.lava-card/.lava-btn/.lava-tag/.hairline`, utilidades `.text-lava-edge/.bg-lava-soft` y las reglas `[data-palette="glass-light"]` del sistema de paletas extinto). **No reintroduzcas `lava-*`** ni ninguna otra familia de nombres legacy: el vocabulario es `--nx-*` (tokens), `.glass-*` (superficies), `.nx-btn` / `.nx-tag` / `.nx-hairline` (controles) y utilidades Tailwind `text-nx-muted` / `text-nx-dim` / `text-nx-secondary`.

### Accesibilidad obligatoria

- Animaciones respetan `prefers-reduced-motion: reduce`
- Navegación 100% funcional solo con teclado
- `aria-pressed` en toggles, `aria-label` en iconos, `aria-hidden="true"` en decorativos
- Contraste mínimo WCAG 2.1 AA — `--nx-text` (#fff) sobre `--nx-bg` (#050505) y `--nx-muted` (#c2c2c2) sobre `--nx-bg` son AA; `--nx-dim` (#8f8f8f) es solo para texto terciario, nunca body text
- No usar solo color para transmitir información
- `prefers-reduced-motion` honrado en el agujero negro (frame estático); si no hay WebGL2 el canvas se oculta sin romper layout
- El hero del sitio usa tinta explícita (`textColor="var(--nx-text)"`): el componente vendorizado infiere la tinta del fondo con `hexToRgb()` y con `background="transparent"` cae al fallback claro → tinta casi negra ilegible sobre el agujero negro

### Ciberseguridad / seguridad

- SSR en Cloudflare Pages: runtime serverless con /api/* (licitacion, auth, admin) — cada endpoint nuevo requiere validación Zod + revisión de auth
- Headers de seguridad en `Base.astro`: `X-Content-Type-Options: nosniff`, `referrer: strict-origin-when-cross-origin`
- Canonical URLs por página (defense-in-depth para SEO anti-duplicación)
- `.gitignore` estricto: `.env*`, SQLite artifacts, IDE/editor temp, coverage, `.vitest/`
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
5. **Build gate**: `npm run build` debe dar exit 0 con todas las páginas compiladas (incluye el i18n-guard)
6. **Smoke test gate**: `npm run build` + servir `dist/client`, curl a todas las rutas afectadas, verificar HTTP 200
7. **Test gates**: `npm run test` (vitest, 299 tests) verde antes de commit. `npm run test:e2e` (playwright) requiere un preview server en `127.0.0.1:4322` arrancado a mano (`npx astro preview --port 4322`): `playwright.config.ts` no define `webServer`. Ojo: en esta máquina el runtime local de wrangler está roto (`No such module "@cloudflare/unenv-preset/node/process"`), así que las rutas SSR (`/portal`, `/admin`, `/api`) no se pueden ejercitar localmente.
8. Update PROJECT.md con resultados ANTES de commit
9. Commit atómico con conventional message (type(scope): description) — **1 cambio lógico = 1 commit**
10. `git push origin main` solo con working tree limpio y gates verdes

## Reglas críticas

- **NUNCA** usar colores hardcoded — siempre `var(--nx-*)` o clases Tailwind semánticas
- **NUNCA** declarar un color solo en `:root` — todo color va duplicado en `@theme` con prefijo `--color-*` (si no, la utilidad Tailwind no existe)
- **NUNCA** reintroducir paletas, dark/light mode, ni `PaletteSwitcher` — la identidad es monocromática única
- **NUNCA** introducir un glow nuevo — el agujero negro es el único carve-out
- **NUNCA** reintroducir `lava-*` ni otra familia legacy — el vocabulario es `--nx-*` / `.glass-*` / `.nx-*`
- **NUNCA** escribir `-webkit-backdrop-filter` a mano — solo `backdrop-filter` (el build añade el prefijo)
- **NUNCA** usar superficie opaca donde el fondo debe verse — el blur no difumina nada si no hay nada detrás
- **NUNCA** agregar `videoUrl` falso al catálogo (queda undefined hasta que el video exista)
- **NUNCA** publicar precio fijo en OSINT/Testing — solo rangos o tiers
- **NUNCA** copiar estilo visual de Vertex/Toptal/etc. — solo patrones estructurales
- **NUNCA** saltarse el smoke test después de añadir páginas nuevas
- **NUNCA** introducir dependencias pesadas (three.js, gsap, lenis) en el client bundle — el frontend sigue siendo mínimo
- **NUNCA** agregar endpoints/API routes sin validación Zod + secret scan + test — el backend vive en Pages Functions
- **NUNCA** confiar en `npm run dev` para verificación visual — ver "Bug conocido" abajo; usar `npm run build` + servir `dist/client`

## Bug RESUELTO: `astro dev` no hidrataba (0/4 islas)

**Resuelto 2026-10-22 (`dceb0a9`).** El bug (0/4 islas, 404 en `/@vite/client` y
`/@id/astro:scripts/before-hydration.js` DESDE DENTRO de la página) NO era la
cadena @astrojs/react — era `run_worker_first = true` (booleano) en
`wrangler.toml`: el plugin de Cloudflare enrutaba TODAS las requests de dev al
worker en miniflare ANTES del middleware de Vite (cloudflare/workers-sdk#14626).
Fix: forma **ARRAY** con las 30 rutas de página/API — el middleware i18n sigue
viendo cada página, los assets estáticos los sirve el binding y las URLs
internas de Vite pasan a Vite.

`astro dev` hidrata 4/4 con dev-toolbar vivo. **Si reaparece: NO tocar
@astrojs/react — revisar primero la forma de `run_worker_first` en
`wrangler.toml`.** El gate de verificación visual de producción sigue siendo
`npm run build` + `astro preview` (o prod directamente).

## Comandos frecuentes

```bash
# Dev server (NO trustworthy para verificación visual: 0/4 islas hidratan, ver "Bug conocido")
npm run dev -- --port 4321 --host 127.0.0.1

# Build producción (incluye el i18n-guard)
npm run build

# Preview estático para verificación visual y e2e (puerto que espera playwright)
npx astro preview --port 4322 --host 127.0.0.1

# Smoke test SSR local (el adapter cloudflare requiere wrangler para preview)
npm run build
npx wrangler pages dev dist --port 4321
# en otra terminal:
curl -s -o /dev/null -w "/ %{http_code}\n" http://127.0.0.1:4321/

# Suites
npm run test       # vitest 299 tests
npm run test:e2e   # playwright (necesita el preview en 4322)

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
- `DESIGN.md` — sistema de diseño canónico (tokens, gramática, do/don't)
- Astro docs: https://docs.astro.build
- Tailwind v4: https://tailwindcss.com/

---

*v0.10.0 — 2026-10-29: tipografía futurista self-hosted (Orbitron/Inter/JetBrains Mono), superficies translúcidas, utilities muertas arregladas (219 elementos), puente `--lava-*` drenado (284 usos), poda de huérfanos y artefactos, docs sincronizadas con el código.*
