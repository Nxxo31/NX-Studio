# AGENTS.md — NX-Studio

**Proyecto:** Sitio web empresarial de NX-Studio (estudio de desarrollo LATAM)
**Stack:** Astro 7.3.2 + Tailwind v4 (vía @tailwindcss/vite) + TypeScript
**Output:** Cloudflare Workers SSR (D1 + Resend + better-auth) — https://nx-studio.nx-studio.workers.dev
**Identidad:** Glass / depth (v0.8.0) — navy + glass + lava #ff4500, sombras suaves con profundidad, radius moderado, motion con Framer Motion

## Reglas del proyecto

### Idioma y comunicación

- **Comunicación con Sebastian:** Español exclusivo
- **Contenido del sitio:** trilingüe ES/EN/PT (i18n auto-detect, memo #192); /admin y /docs quedan ES-only
- **Comentarios de código y docs:** Español
- **Nombres de variables, funciones, archivos:** Inglés
- **Términos técnicos estándar:** Inglés (commit, deploy, middleware, endpoint)
- **Razonamiento técnico interno:** Inglés

### Sistema de diseño — Brutalism (v0.7.0)

Tokens centralizados en `src/styles/global.css` + `src/styles/palettes.css` (2 paletas: `brutal-dark` default, `brutal-cream`):

- Paleta: lava `#ff4500` (único acento) + tinta estructural `--nx-ink` (crema en dark, negra en cream) + amarillo `--nx-accent #ffd23f`
- Sombras duras: `--nx-shadow-sm/…/lg` = offset fijo sin blur, siempre en tinta
- Variables semánticas legacy bridge: `--lava-core`, `--lava-edge`, `--lava-deep`, `--bg-void`, `--bg-ember`
- **NO hardcodear colores** — siempre usar `var(--nx-*)`/`var(--lava-*)` o clases Tailwind `text-lava`, `bg-lava-soft`, `border-lava`
- Componentes base: `.lava-card`, `.lava-card-accent`, `.lava-btn`, `.lava-btn-ghost`, `.lava-tag`, `.hairline`
- Geometría brutalista: bordes 2-3px sólidos + sombras duras offset — **prohibidos** gradientes, blur, glows, chamfers clip-path; esquinas cuadradas (escala Tailwind radius anulada)
- Tipografía: `var(--font-display)` para headings, `var(--font-mono)` para código/números, `var(--font-body)` para texto
- Detalles completos: `DESIGN.md` (canónico)

### Accesibilidad obligatoria

- Animaciones respetan `prefers-reduced-motion: reduce`
- Navegación 100% funcional solo con teclado
- `aria-pressed` en toggles, `aria-label` en iconos, `aria-hidden="true"` en decorativos
- Contraste mínimo WCAG 2.1 AA — verificar lava-core sobre bg-void
- No usar solo color para transmitir información
- `prefers-reduced-motion` honored en WebGLBackground (CSS-only fallback)

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
7. **Smoke test gate**: levantar `npm run preview` y curl a todas las rutas afectadas, verificar HTTP 200
8. **Test gates**: `npm run test` (vitest, 107 tests) + `npm run test:e2e` (playwright) en verde antes de commit
9. Update PROJECT.md con resultados ANTES de commit
10. Commit atómico con conventional message (type(scope): description)
11. `git push origin main`

## Reglas críticas

- **NUNCA** usar colores hardcoded — siempre `var(--lava-*)` o clases Tailwind semánticas
- **NUNCA** cambiar paleta base sin confirmar (brutalism es la identidad v0.7.0+; lava #ff4500 se mantiene como acento desde v0.2.0)
- **NUNCA** agregar `videoUrl` falso al catálogo (queda undefined hasta que el video exista)
- **NUNCA** publicar precio fijo en OSINT/Testing — solo rangos o tiers
- **NUNCA** copiar estilo visual de Vertex/Toptal/etc. — solo patrones estructurales
- **NUNCA** saltarse el smoke test después de añadir páginas nuevas
- **NUNCA** introducir dependencias pesadas (three.js, gsap, lenis) en el client bundle — el frontend sigue siendo mínimo
- **NUNCA** agregar endpoints/API routes sin validación Zod + secret scan + test — el backend vive en Pages Functions

## Comandos frecuentes

```bash
# Dev server
npm run dev -- --port 4321 --host 127.0.0.1

# Build producción
npm run build

# Smoke test SSR local (el adapter cloudflare requiere wrangler para preview)
npm run build
npx wrangler pages dev dist --port 4321
# en otra terminal:
curl -s -o /dev/null -w "/ %{http_code}\n" http://127.0.0.1:4321/

# Suites
npm run test       # vitest 107 tests
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
- `PROJECT.md` — single source of truth del proyecto (sprints, arquitectura, limitaciones)
- Astro docs: https://docs.astro.build
- Tailwind v4: https://tailwindcss.com/

---

*v0.6.1 — 2026-10-13: actualizadas reglas post-migración a Cloudflare Pages SSR (D1 + Resend + better-auth) e i18n ES/EN/PT.*