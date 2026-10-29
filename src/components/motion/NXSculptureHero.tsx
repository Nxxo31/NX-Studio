import * as React from "react"
import SculptureHero, { type SculptureHeroLink } from "../ui/liquid-sculpture-hero"

/**
 * NXSculptureHero — wrapper de SculptureHero para el sitio NX-Studio.
 * El sitio tiene identidad monocromatica unica (sin dark/light), asi que el
 * hero se fija siempre en modo oscuro y con acento neutro.
 */

export interface NXHeroProps {
  eyebrow: string
  headline: string
  headlineAccent: string
  body: string
  primaryCta: SculptureHeroLink
  secondaryCta: SculptureHeroLink
  hint: string
  hintTouch: string
  backdropText?: string
}

export default function NXSculptureHero(props: NXHeroProps) {
  return (
    <SculptureHero
      brand="NX-Studio"
      showNav={false}
      themeToggle={false}
      theme="dark"
      eyebrow={props.eyebrow}
      headline={props.headline}
      headlineAccent={props.headlineAccent}
      body={props.body}
      primaryCta={props.primaryCta}
      secondaryCta={props.secondaryCta}
      background="transparent"
      darkBackground="transparent"
      /* FIX 2026-10-28: el componente vendored inferia la tinta del fondo con
         hexToRgb(); "transparent" no parsea y cae al fallback claro, asi que
         terminaba con fg=#151514 (tinta casi negra) sobre el agujero negro.
         Se pasa textColor explicito (token del sistema) para fijar tinta clara. */
      textColor="var(--nx-text)"
      accentColor="var(--nx-primary)"
      headingFont="var(--font-display)"
      accentFont="var(--font-mono)"
      bodyFont="var(--font-body)"
      /* loadFonts={false}: el componente inyectaba Google Fonts (Geist +
         Instrument Serif) en runtime. Las tres familias ya son locales
         (self-hosted) y la tipografia de acento ahora es mono, no serif. */
      loadFonts={false}
      backdropText={props.backdropText ?? "NX"}
      showCredit={false}
      height="100svh"
      /* Solo-texto (2026-10-22, decision operador): la escultura liquida WebGL2
       * se retiro del hero — el fondo global (agujero negro) ES el visual.
       * Fondo transparente para que el canvas en z-0 se vea a traves del hero. */
      sculpture={false}
      interactive={false}
      hint=""
      hintTouch=""
      sculptureScale={0.95}
      mobileSculptureScale={1}
      sculptureY={3}
      restStyle="image"
    />
  )
}
