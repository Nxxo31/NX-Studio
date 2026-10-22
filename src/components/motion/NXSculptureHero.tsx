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
      src="/assets/sculpture/light.webp"
      darkSrc="/assets/sculpture/dark.webp"
      mobileSrc="/assets/sculpture/mobile-light.webp"
      mobileDarkSrc="/assets/sculpture/mobile-dark.webp"
      imageAlt="Escultura abstracta de filamentos metálicos y partículas — obra de NX-Studio"
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
      hint={props.hint}
      hintTouch={props.hintTouch}
      background="#050505"
      darkBackground="#050505"
      accentColor="#fafafa"
      headingFont="var(--font-display)"
      accentFont="'Instrument Serif', 'Times New Roman', serif"
      bodyFont="var(--font-body)"
      loadFonts={true}
      backdropText={props.backdropText ?? "NX"}
      showCredit={false}
      height="100svh"
      sculptureScale={0.95}
      mobileSculptureScale={1}
      sculptureY={3}
      interactive={true}
      strength={1}
      liquid={1.15}
      intro={true}
      restStyle="image"
    />
  )
}
