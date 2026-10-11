---
version: alpha
name: NX-Studio Theme System
description: 5 brand palettes para NX-Studio — 4 dark + 1 light. Validado WCAG 2.1 AA.

colors:
  # steel-indigo (default · dark) — bumped #5e6ad2 → #7c84e8 (5.21:1 AA)
  steel-bg: "#0b0b14"
  steel-surface: "#15172a"
  steel-text: "#f1f1f4"
  steel-text-muted: "#9b9bad"
  steel-text-dim: "#4a4a60"
  steel-primary: "#7c84e8"
  steel-accent: "#ff6a00"

  # lava-pure (dark warm)
  lava-bg: "#0a0608"
  lava-surface: "#14090c"
  lava-text: "#f5e6d3"
  lava-text-muted: "#a89580"
  lava-primary: "#ff4500"
  lava-secondary: "#d97706"

  # obsidian-teal (dark monochrome)
  teal-bg: "#000000"
  teal-surface: "#0a0a0a"
  teal-text: "#fafafa"
  teal-text-muted: "#a3a3a3"
  teal-primary: "#0f766e"

  # navy-gold (dark premium)
  navy-bg: "#0a0e1a"
  navy-surface: "#111827"
  navy-text: "#faf7f0"
  navy-text-muted: "#b8a890"
  navy-primary: "#d4a574"
  navy-secondary: "#3b82f6"

  # azure-light (light · B2B)
  azure-bg: "#ffffff"
  azure-surface: "#f8fafc"
  azure-surface-raised: "#f1f5f9"
  azure-text: "#0f172a"
  azure-text-muted: "#475569"
  azure-text-dim: "#64748b"
  azure-primary: "#2563eb"
  azure-primary-deep: "#1d4ed8"
  azure-secondary: "#6366f1"
  azure-accent: "#06b6d4"

components:
  # ─── steel-indigo · dark (default) ───
  text-default-steel:
    backgroundColor: "{colors.steel-bg}"
    textColor: "{colors.steel-text}"
  text-muted-steel:
    backgroundColor: "{colors.steel-bg}"
    textColor: "{colors.steel-text-muted}"
  primary-on-bg-steel:
    backgroundColor: "{colors.steel-bg}"
    textColor: "{colors.steel-primary}"
  button-primary-steel:
    backgroundColor: "{colors.steel-primary}"
    textColor: "#ffffff"

  # ─── lava-pure · dark warm ───
  text-default-lava:
    backgroundColor: "{colors.lava-bg}"
    textColor: "{colors.lava-text}"
  text-muted-lava:
    backgroundColor: "{colors.lava-bg}"
    textColor: "{colors.lava-text-muted}"
  primary-on-bg-lava:
    backgroundColor: "{colors.lava-bg}"
    textColor: "{colors.lava-primary}"
  button-primary-lava:
    backgroundColor: "{colors.lava-primary}"
    textColor: "#0a0608"

  # ─── obsidian-teal · dark monochrome ───
  text-default-teal:
    backgroundColor: "{colors.teal-bg}"
    textColor: "{colors.teal-text}"
  text-muted-teal:
    backgroundColor: "{colors.teal-bg}"
    textColor: "{colors.teal-text-muted}"
  primary-on-bg-teal:
    backgroundColor: "{colors.teal-bg}"
    textColor: "{colors.teal-primary}"
  button-primary-teal:
    backgroundColor: "{colors.teal-primary}"
    textColor: "#ffffff"

  # ─── navy-gold · dark premium ───
  text-default-navy:
    backgroundColor: "{colors.navy-bg}"
    textColor: "{colors.navy-text}"
  text-muted-navy:
    backgroundColor: "{colors.navy-bg}"
    textColor: "{colors.navy-text-muted}"
  primary-on-bg-navy:
    backgroundColor: "{colors.navy-bg}"
    textColor: "{colors.navy-primary}"
  button-primary-navy:
    backgroundColor: "{colors.navy-primary}"
    textColor: "{colors.navy-bg}"

  # ─── azure-light · light B2B ───
  text-default-azure:
    backgroundColor: "{colors.azure-bg}"
    textColor: "{colors.azure-text}"
  text-muted-azure:
    backgroundColor: "{colors.azure-bg}"
    textColor: "{colors.azure-text-muted}"
  text-dim-azure:
    backgroundColor: "{colors.azure-bg}"
    textColor: "{colors.azure-text-dim}"
  primary-on-bg-azure:
    backgroundColor: "{colors.azure-bg}"
    textColor: "{colors.azure-primary}"
  button-primary-azure:
    backgroundColor: "{colors.azure-primary}"
    textColor: "#ffffff"
  button-primary-soft-azure:
    backgroundColor: "{colors.azure-surface}"
    textColor: "{colors.azure-primary}"
  surface-default-azure:
    backgroundColor: "{colors.azure-surface}"
    textColor: "{colors.azure-text}"
---

# NX-Studio Theme System

5 paletas (4 dark + 1 light) que comparten el mismo contrato de tokens.
Default = steel-indigo. Auto-switch dark/light via `prefers-color-scheme`
la primera visita (respetado salvo override explicito del usuario).

Activar manualmente: `data-palette="<id>"` en `<html>`.
IDs disponibles: `steel-indigo`, `lava-pure`, `obsidian-teal`, `navy-gold`, `azure-light`.

## Do's and Don'ts

### Do

- Respetar `prefers-color-scheme` la primera visita si el usuario no ha tocado el switcher
- Persistir override en localStorage con key `nx-studio-theme`
- Pre-load script en `<head>` antes del body para evitar FOUC
- Transicion suave entre temas (CSS transition 200ms en colores bg/text)

### Don't

- No usar `--nx-text-dim` (#94a3b8) como texto normal — solo UI/large text
  (ratio 3.3:1 sobre blanco no cumple 4.5:1 para body text)
- No usar `text-lava-edge` (indigo bridge en steel-indigo) esperando buen
  contraste — su ratio es 3.0:1 sobre bg navy