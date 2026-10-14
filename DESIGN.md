---
version: alpha
name: NX-Studio Theme System (Brutalism)
description: 2 paletas brutalistas — brutal-dark (default) + brutal-cream. Validado WCAG 2.1 AA.

colors:
  # brutal-dark (default · dark) — near-black cálido + tinta crema + lava
  dark-bg: "#0f0e0c"
  dark-surface: "#191714"
  dark-raised: "#23201b"
  dark-ink: "#f5f0e4"
  dark-text: "#f5f0e4"
  dark-text-muted: "#b8b2a0"
  dark-text-dim: "#7d7768"
  dark-primary: "#ff4500"
  dark-accent: "#ffd23f"

  # brutal-cream (light) — crema papel + tinta negra + lava
  cream-bg: "#f2ecdf"
  cream-surface: "#faf6ec"
  cream-raised: "#fffdf6"
  cream-ink: "#141210"
  cream-text: "#141210"
  cream-text-muted: "#443f36"
  cream-text-dim: "#6b6558"
  cream-primary: "#ff4500"
  cream-accent: "#ffd23f"

components:
  # ─── contratos brutales (ambas paletas) ───
  # Card:    border 3px solid ink + shadow 6px 6px 0 ink (sin blur)
  # Accent:  border/shadow en lava #ff4500
  # Button:  bg lava, texto #141210, border 3px ink, shadow 4px 4px 0 ink.
  #          Hover = pressed físico (translate 2px, shadow 2px).
  # Tag:     bloque lava, border 2px ink, shadow 3px 3px 0 ink.
  # Nav:     borde inferior 3px ink, hover = inversión ink/bg.
  # Radius:  0 en toda la escala Tailwind (esquinas cuadradas).
  button-dark:
    backgroundColor: "{colors.dark-primary}"
    textColor: "#141210"
  button-cream:
    backgroundColor: "{colors.cream-primary}"
    textColor: "#141210"
  text-default-dark:
    backgroundColor: "{colors.dark-bg}"
    textColor: "{colors.dark-text}"
  text-muted-dark:
    backgroundColor: "{colors.dark-bg}"
    textColor: "{colors.dark-text-muted}"
  primary-on-dark:
    backgroundColor: "{colors.dark-bg}"
    textColor: "{colors.dark-primary}"
  text-default-cream:
    backgroundColor: "{colors.cream-bg}"
    textColor: "{colors.cream-text}"
  text-muted-cream:
    backgroundColor: "{colors.cream-bg}"
    textColor: "{colors.cream-text-muted}"
  primary-on-cream:
    backgroundColor: "{colors.cream-bg}"
    textColor: "{colors.cream-primary}"
---

# NX-Studio Theme System — BRUTALISM

2 paletas (1 dark + 1 light) que comparten el mismo contrato de tokens
`--nx-*`. Default = `brutal-dark`. Auto-switch via `prefers-color-scheme`
la primera visita (respetado salvo override explícito del usuario).

Activar manualmente: `data-palette="<id>"` en `<html>`.
IDs disponibles: `brutal-dark`, `brutal-cream`.

## Gramática visual

- **Tinta estructural** (`--nx-ink`): crema en dark, negro en cream.
  Gobierna bordes, sombras y color secundario de texto.
- **Lava** (`--nx-primary` `#ff4500`): único acento emocional — CTAs,
  tags, marca, `::selection`.
- **Amarillo** (`--nx-accent` `#ffd23f`): highlight secundario
  (focus ring, acentos puntuales).
- **Sombras duras**: offset fijo sin blur — `--nx-shadow-sm` (3px),
  `--nx-shadow` (6px), `--nx-shadow-lg` (10px), siempre en tinta.
- **Bordes**: 2-3px sólidos (nunca hairline translúcido en componentes;
  `--nx-border` 35% de tinta queda solo para dividores quietos).
- **Esquinas cuadradas**: toda la escala `--radius-*` de Tailwind = 0.
- **Estructura expuesta**: grilla uniforme 56px en el fondo, sin mask,
  sin grain, sin vignette.
- **Prohibidos**: gradientes, blur, backdrop-blur, glows, clip-path
  chamfers, glassmorphism. (`.lava-scan` y `.orb` están neutralizados
  y WebGLBackground/BackgroundDecor no se montan desde Base.astro.)

## Interacciones

- Hover de botón = press físico: `translate(2px,2px)` + sombra reducida;
  active = `translate(4px,4px)` + sombra cero.
- Hover de card = contra-sombra: `translate(-3px,-3px)` + sombra 9px.
- Hover de nav-link = inversión tinta/fondo; activo = chip lava con
  sombra 2px.
- Focus visible = outline 3px amarillo con offset 2px (`.lava-btn`),
  o sombra dura 4px en inputs (`.nx-input`).

## Do's and Don'ts

### Do

- Respetar `prefers-color-scheme` la primera visita si el usuario no ha tocado el switcher
- Persistir override en localStorage con key `nx-studio-theme`
- Pre-load script en `<head>` antes del body para evitar FOUC
- Usar `--nx-ink`/`--nx-shadow*` para toda estructura visual

### Don't

- No reintroducir gradientes/blur/glow — si un componente lo "necesita",
  resuelve con borde + sombra dura + color sólido
- No usar `--nx-text-dim` como texto de lectura — solo micro-labels UI
  (ratios bajo AA para body text)
- No usar `border-radius` — la escala está anulada; cualquier radius
  hardcoded rompe el sistema
- No crear tokens nuevos por fuera de `global.css`/`palettes.css`

## Histórico

- v0.2.0–v0.4.0: lava neon (Matrix orange, chamfers, glow).
- v0.5.0: steel-indigo (Linear/Vercel vibe, 5 paletas).
- v0.7.0 (2026-10-14, sprint brutalism): sistema brutalista de 2 paletas,
  autorizado por el operador en sesión opencode (`sess-29ba7c928aff3f8d`).
