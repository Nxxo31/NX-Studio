import * as React from "react"
import SculptureHero, { type SculptureHeroLink } from "../ui/liquid-sculpture-hero"

/**
 * NXSculptureHero — wrapper de SculptureHero para el sitio NX-Studio.
 * Sincroniza el tema del sitio (atributo data-palette en <html>, glass-dark /
 * glass-light) con el tema interno del hero, y aplica la identidad NX:
 * fondos glass, acento lava y tipografías del sistema.
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

const THEME_ATTR = "data-palette"

export default function NXSculptureHero(props: NXHeroProps) {
  const [mode, setMode] = React.useState<"light" | "dark">("dark")

  React.useEffect(() => {
    const root = document.documentElement
    const read = () =>
      setMode(root.getAttribute(THEME_ATTR) === "glass-light" ? "light" : "dark")
    read()
    const obs = new MutationObserver(read)
    obs.observe(root, { attributes: true, attributeFilter: [THEME_ATTR] })
    return () => obs.disconnect()
  }, [])

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
      theme={mode}
      eyebrow={props.eyebrow}
      headline={props.headline}
      headlineAccent={props.headlineAccent}
      body={props.body}
      primaryCta={props.primaryCta}
      secondaryCta={props.secondaryCta}
      hint={props.hint}
      hintTouch={props.hintTouch}
      background="#fafbff"
      darkBackground="#0a0b14"
      accentColor="#ff4500"
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
