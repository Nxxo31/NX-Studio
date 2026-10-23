---
version: stable
name: NX-Studio Theme System (Monochrome v0.9.0)
description: Una sola escala de grises calibrada contra el agujero negro WebGL2. Sin dark/light mode. Sin archivo de paletas.

colors:
  bg: "#050505"
  surface: "#0e0e0e"
  raised: "#171717"
  ink: "#ededed"
  text: "#f5f5f5"
  text-muted: "#a3a3a3"
  text-dim: "#6b6b6b"
  primary: "#fafafa"
  primary-soft: "#d4d4d4"
  primary-deep: "#a3a3a3"
  secondary: "#b8b8b8"
  accent: "#b8b8b8"
  text-on-primary: "#050505"
  success: "#b6cfc0"
  warn: "#cfc4a6"
  danger: "#d3a9a9"

typography:
  display: "Space Grotesk, system-ui, sans-serif"
  body: "Inter, system-ui, sans-serif"
  mono: "JetBrains Mono, ui-monospace, monospace"

radius:
  xs: 4px
  sm: 6px
  md: 10px
  lg: 14px
  xl: 20px
  "2xl": 28px
  "3xl": 36px
  "4xl": 48px

components:
  card:
    backgroundColor: "{colors.surface}"
    borderColor: "rgba(255, 255, 255, 0.09)"
    borderRadius: "14px"
  button:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.text-on-primary}"
---

# NX-Studio Theme System — MONOCHROME v0.9.0

Escala de grises **única**. Sin `data-palette`, sin `prefers-color-scheme`, sin
anti-FOUC de tema. El color base `#050505` está calibrado contra el fondo del
agujero negro para que el contenido flote sobre él sin costura visible.

Tokens canónicos: `src/styles/global.css` (`@theme` + `:root`).

## Gramática

- **Tinta** (`--nx-ink #ededed` / `--nx-text #f5f5f5`): estructura y texto.
- **Blanco roto** (`--nx-primary #fafafa`): **solo** CTAs y texto invertido
  sobre primario. Es el valor de máximo contraste del sistema, no un color de
  decoración.
- **Acentos lavados** (`--nx-secondary` / `--nx-accent #b8b8b8`): etiquetas,
  metadatos, iconografía secundaria. Nunca compiten con el CTA.
- **Semánticos desaturados** (`--nx-success #b6cfc0`, `--nx-warn #cfc4a6`,
  `--nx-danger #d3a9a9`): presentes pero sin saturación, para no romper la
  lectura monocroma.
- **Bordes hairline**: `rgba(255,255,255,0.09)` base, `0.16` fuerte. La
  separación se hace por luminancia, no por color.
- **Radius progresivo**: xs 4 → 4xl 48px.
- **Background**: agujero negro WebGL2 (`optimized-black-hole.tsx`) como
  `fixed; z-index: 0`. No hay mesh CSS, ni gradientes de fondo, ni blur pesado.

### Carve-out: el agujero negro ES un glow

Único glow permitido. Es una excepción deliberada a la prohibición histórica de
glows, y la razón de que `#050505` sea el color base. No lo trates como una
violación a corregir.

**Y desde 2026-10-23 es también la única excepción de COLOR del sitio** (decisión
operador, commits `09a93e6` + `401b306`): el pipeline WebGPU original de 21st.dev
está activo — disco de acreción volumétrico con lente gravitacional real, rampa
térmica brasa → ámbar → blanco cálido y doppler beaming. La UI sigue monocroma:
no propagues el color del backdrop a componentes, tokens ni CTAs.

## Interacciones

- Hover botón = `translateY(-1px)` + brightness.
- Hover card = elevación por borde + superficie, sin offset duro.
- Motion: React islands con `framer-motion` en home; CSS animations +
  `IntersectionObserver` `.reveal` en el resto para mantener el bundle mínimo.
- Hero: **solo-texto** (2026-10-22). La escultura líquida se retiró del hero; el
  fondo global de agujero negro es el único visual — el hero va transparente.

## Do

- Usar `var(--nx-*)` o las clases Tailwind `text-nx-text`, `bg-nx-surface`,
  `border-nx-border`.
- Verificar contra `npm run build` + `astro preview` (o prod). `astro dev`
  hidrata 4/4 desde `dceb0a9` — ver `AGENTS.md § Bug RESUELTO`.
- Migrar `lava-*` → `nx-*` en cualquier archivo que toques.

## Don't

- No reintroducir paletas, dark/light mode, ni `PaletteSwitcher`.
- No crear tokens fuera de `global.css`.
- No añadir un segundo fondo animado ni CSS gradients sustituyendo el agujero negro.
- No usar `--nx-text-dim` para body text.
- No extender el color del agujero negro a la UI — la excepción es solo del backdrop.
- No introducir `lava-*` nuevos (el bridge legacy se está drenando).

## Histórico

- v0.2.0–v0.4.0: lava neon (Matrix orange, chamfers).
- v0.5.0: steel-indigo (Linear/Vercel vibe, 5 paletas).
- v0.7.0 (2026-10-14): brutalism.
- v0.8.0 (2026-10-14): glass/depth — 2 paletas, lava `#ff4500`, `data-palette`.
- **v0.9.0 (2026-10-21)**: monocromo. Una escala de grises, sin paletas,
  agujero negro WebGL2 como fondo global. Superset de los tres anteriores.