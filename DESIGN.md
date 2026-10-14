---
version: alpha
name: NX-Studio Theme System (Glass / Depth v0.8.0)
description: 2 paletas glass — glass-dark (default) + glass-light. Navy + glass + lava accent + Framer Motion. shadcn/ui-compatible.

colors:
  dark-bg: "#0a0b14"
  dark-surface: "#11132a"
  dark-raised: "#181a35"
  dark-ink: "#e8eaf6"
  dark-text: "#f1f3ff"
  dark-text-muted: "#9b9ec4"
  dark-text-dim: "#5b5e85"
  dark-primary: "#ff4500"
  dark-secondary: "#818cf8"
  dark-accent: "#ffd23f"

  cream-bg: "#fafbff"
  cream-surface: "#ffffff"
  cream-raised: "#f4f5fb"
  cream-ink: "#0a0b14"
  cream-text: "#0a0b14"
  cream-text-muted: "#4a4d6b"
  cream-text-dim: "#7a7d9a"
  cream-primary: "#ff4500"
  cream-secondary: "#4f46e5"
  cream-accent: "#ffd23f"

components:
  card-glass:
    backgroundColor: "{colors.dark-surface}"
    borderColor: "rgba(255, 255, 255, 0.08)"
    borderRadius: "14px"
    boxShadow: "0 8px 24px -8px rgba(0, 0, 0, 0.5)"
  button-dark:
    backgroundColor: "{colors.dark-primary}"
    textColor: "#0a0b14"
---

# NX-Studio Theme System — GLASS / DEPTH v0.8.0

2 paletas (glass-dark + glass-light) que comparten el mismo contrato de
tokens `--nx-*`. Default = `glass-dark`. Auto-switch via
`prefers-color-scheme` la primera visita.

Activar: `data-palette="<id>"` en `<html>`. IDs: `glass-dark`, `glass-light`.

## Gramática

- **Glass**: `backdrop-filter: blur(14px) saturate(140%)` sobre surface
  con alpha 0.72, border 1px ink @ 8% opacity, radius 14px.
- **Tinta** (`--nx-ink`): cream dark / negro light — borders + secundario.
- **Lava** (`--nx-primary` `#ff4500`): único acento emocional (CTAs,
  tags, marca, selection, glows).
- **Indigo** (`--nx-secondary`): acento de profundidad.
- **Amarillo** (`--nx-accent` `#ffd23f`): focus rings.
- **Sombras con profundidad**: `--nx-shadow-sm/…/lg` (suaves, sin offsets
  duros), `--nx-glow` (lava 32px).
- **Background mesh**: `body::before` con dos radiales lava + indigo
  baja opacidad.
- **Radius moderado**: xs 4, sm 6, md 10, lg 14, xl 20 (glass, no 0).
- **Motion**: Framer Motion (React island) en home para hero stagger.
  CSS animations + IntersectionObserver `.reveal` en el resto para
  mantener bundle mínimo.

## Interacciones

- Hover botón = translate(-1px) + shadow-lg + glow lava + brightness.
- Hover card = translate(-3px,-3px) + shadow 9px.
- Hover nav-link = inversión ink/bg.
- Framer Motion hero: stagger entrance, fade+translateY+blur(8px)→0.

## Do

- Respetar prefers-color-scheme la primera visita.
- Persistir override en localStorage con key `nx-studio-theme`.
- Anti-FOUC en `<head>` antes del body.
- Usar `<AnimatedHero client:load>` para motion premium en hero.
- Usar `.glass-card` (o alias `.lava-card`) en cards.

## Don't

- No reintroducir borders 3px ink ni shadows duras offset
  (`shadow-[Npx_Npx_0_...]`) — usar `--nx-shadow` suave.
- No usar `--nx-text-dim` para body text.
- No reintroducir WebGLBackground/BackgroundDecor ni gradientes pesados.
- No crear tokens nuevos fuera de `global.css`/`palettes.css`.

## Histórico

- v0.2.0–v0.4.0: lava neon (Matrix orange, chamfers).
- v0.5.0: steel-indigo (Linear/Vercel vibe, 5 paletas).
- v0.7.0 (2026-10-14): brutalism — supersedido.
- **v0.8.0 (2026-10-14, sprint glass/depth)**: supersede brutalism.
  React 18 + @astrojs/react 4 + framer-motion 11. Home con React island
  + stagger entrance; resto del sitio con glass system consistente +
  CSS animations.
