---
version: stable
name: NX-Studio Theme System (Monochrome Galactic v0.10.0)
description: Una sola escala de grises sobre el agujero negro, tipografía futurista self-hosted y superficies de cristal translúcidas. Sin dark/light mode. Sin archivo de paletas.

colors:
  bg: "#050505"
  surface: "#0e0e0e"
  surface-raised: "#171717"
  surface-translucent: "rgba(14, 14, 14, 0.66)"
  surface-translucent-strong: "rgba(10, 10, 10, 0.80)"
  ink: "#f2f2f2"
  text: "#ffffff"
  muted: "#c2c2c2"
  dim: "#8f8f8f"
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
  display: "Orbitron Variable, system-ui, sans-serif"
  body: "Inter Variable, system-ui, sans-serif"
  mono: "JetBrains Mono Variable, ui-monospace, monospace"

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
    backgroundColor: "{colors.surface-translucent}"
    backdropFilter: "blur(18px) saturate(140%)"
    borderColor: "rgba(255, 255, 255, 0.09)"
    borderRadius: "14px"
  button:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.text-on-primary}"
---

# NX-Studio Theme System — MONOCROMÁTICO GALÁCTICO v0.10.0

Escala de grises **única**, montada sobre el agujero negro. Sin `data-palette`,
sin `prefers-color-scheme`, sin anti-FOUC de tema. El color base `#050505` está
calibrado contra el fondo del agujero negro para que el contenido flote sobre
él sin costura visible.

Tokens canónicos: `src/styles/global.css` (`@theme` + `:root`).

## Gramática

- **Tinta** (`--nx-ink #f2f2f2` / `--nx-text #ffffff`): estructura y texto.
- **Gris escalonado** (`--nx-muted #c2c2c2` / `--nx-dim #8f8f8f`): texto
  secundario y terciario. Antes no existían como utilidades (el sitio renderizaba
  en blanco puro); hoy son la base de la jerarquía tipográfica.
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
- **Background**: agujero negro (WebGPU, fallback WebGL2) como `fixed;
  z-index: 0`. No hay mesh CSS, ni gradientes de fondo, ni blur pesado.

### Tema galáctico: la galaxia no se tapa

El backdrop es un agujero negro con disco de acreción volumétrico. El sitio se
diseña **encima** de él, con superficies de cristal translúcidas:

| Token | Valor | Uso |
|---|---|---|
| `--nx-surface-translucent` | `rgba(14,14,14,0.66)` | cards, `.glass`, superficies de contenido |
| `--nx-surface-translucent-strong` | `rgba(10,10,10,0.80)` | nav, footer, panel del chatbot |

Con `backdrop-filter: blur(18px) saturate(140%)` el disco se difumina detrás del
panel y el texto compite con ruido, no con la galaxia. **Una superficie opaca
anula el efecto**: no hay nada detrás que difuminar.

> Escribe solo `backdrop-filter` (el estándar). Si añades a mano
> `-webkit-backdrop-filter`, Lightning CSS conserva únicamente el prefiado y el
> CSS compilado pierde la propiedad estándar.

### Tipografía futurista

Las tres familias son **self-hosted** (OFL, `@fontsource-variable/*@5.3.0`):
cero peticiones a Google Fonts en runtime.

- **Display — Orbitron Variable**: geométrica, de trazo grueso. Es la voz
  futurista de los headings. Tracking neutro `0.005em` (negativo la vuelve
  ilegible) y **fuera de `@layer utilities`** para ganar a `tracking-*` de
  Tailwind.
- **Body — Inter Variable**: lectura larga.
- **Mono — JetBrains Mono Variable**: códigos, números, etiquetas y el acento
  del hero en MAYÚSCULAS (el serif instrumentado quedó descartado).

### Carve-out: el agujero negro ES un glow

Único glow permitido y **única excepción de color del sitio** (decisión
operador, commits `09a93e6` + `401b306`): el pipeline WebGPU original de
21st.dev está activo — disco de acreción volumétrico con lente gravitacional
real, rampa térmica brasa → ámbar → blanco cálido y doppler beaming. La UI
sigue monocroma: **no propagues el color del backdrop a componentes, tokens ni
CTAs**.

El renderer WebGL2 es el fallback (sin WebGPU, fallo de init o
`prefers-reduced-motion`) y comparte la misma rampa.

### Hero

Solo-texto desde 2026-10-22: la escultura líquida se retiró del hero y el
agujero negro es el único visual (`sculpture={false}`, hero transparente). El
copy vive en la parte baja, con un scrim local (`.sh-root::before`) que lo
separa del disco. La tinta la fija el prop `textColor` del componente
vendorizado: nunca la infiere del fondo.

## Interacciones

- Hover botón = `translateY(-1px)` + brightness.
- Hover card = elevación por borde + superficie, sin offset duro.
- Motion: React islands con `framer-motion` en home; CSS animations +
  `IntersectionObserver` `.reveal` en el resto para mantener el bundle mínimo.

## Do

- Usar `var(--nx-*)` o las clases Tailwind `text-nx-text`, `bg-nx-surface`,
  `border-nx-border`, `text-nx-muted`, `text-nx-dim`.
- Declarar cada color dos veces: `--color-nx-*` en `@theme` (para la utilidad
  Tailwind) y `--nx-*` en `:root` (para `var()`).
- Verificar contra `npm run build` + `astro preview` (o prod). `astro dev`
  hidrata 4/4 desde `dceb0a9` — ver `AGENTS.md § Bug RESUELTO`.
- Comprobar el CSS **compilado** (`dist/client/_astro/*.css`), no el fuente.

## Don't

- No reintroducir paletas, dark/light mode, ni `PaletteSwitcher`.
- No crear tokens fuera de `global.css`.
- No añadir un segundo fondo animado ni CSS gradients sustituyendo el agujero negro.
- No usar `--nx-dim` para body text.
- No extender el color del agujero negro a la UI — la excepción es solo del backdrop.
- No reintroducir `lava-*` ni otra familia legacy de nombres.
- No escribir `-webkit-backdrop-filter` a mano.

## Histórico

- v0.2.0–v0.4.0: lava neon (Matrix orange, chamfers).
- v0.5.0: steel-indigo (Linear/Vercel vibe, 5 paletas).
- v0.7.0 (2026-10-14): brutalism.
- v0.8.0 (2026-10-14): glass/depth — 2 paletas, lava `#ff4500`, `data-palette`.
- **v0.9.0 (2026-10-21)**: monocromo. Una escala de grises, sin paletas,
  agujero negro como fondo global. Superset de los tres anteriores.
- **v0.9.1 (2026-10-23)**: pipeline WebGPU original activo + sprint comercial.
- **v0.10.0 (2026-10-29)**: tipografía futurista self-hosted (Orbitron),
  superficies translúcidas, puente `--lava-*` drenado, tokens reparados.
