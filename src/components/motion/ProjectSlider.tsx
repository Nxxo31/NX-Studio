import * as React from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"

/**
 * ProjectSlider — carrusel de proyectos finalizados.
 * Muestra las capturas de cada proyecto (con miniaturas cuando hay varias)
 * y sus funcionalidades en lenguaje llano. Islas React + framer-motion.
 */

export interface SliderProject {
  slug: string
  name: string
  tagline: string
  category: string
  highlights: string[]
  images: string[]
  href: string
}

export interface SliderLabels {
  features: string
  prev: string
  next: string
  view: string
}

interface Props {
  projects: SliderProject[]
  labels: SliderLabels
}

export default function ProjectSlider({ projects, labels }: Props) {
  const [idx, setIdx] = React.useState(0)
  const [imgIdx, setImgIdx] = React.useState(0)
  const reduced = useReducedMotion()
  const total = projects.length

  React.useEffect(() => {
    setImgIdx(0)
  }, [idx])

  if (total === 0) return null
  const p = projects[Math.min(idx, total - 1)]
  const img = p.images[Math.min(imgIdx, p.images.length - 1)] ?? p.images[0]

  const go = (d: number) => setIdx((i) => (i + d + total) % total)

  const slide = {
    initial: { opacity: 0, x: reduced ? 0 : 32 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: reduced ? 0 : -32 },
    transition: reduced ? { duration: 0.15 } : { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
  }

  return (
    <div
      className="glass-card overflow-hidden nx-slider"
      role="group"
      aria-roledescription="carrusel"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") { e.preventDefault(); go(-1) }
        if (e.key === "ArrowRight") { e.preventDefault(); go(1) }
      }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* Preview del proyecto */}
        <div className="relative lg:col-span-7 border-b lg:border-b-0 lg:border-r border-nx-border bg-nx-surface-overlay min-h-[260px] sm:min-h-[340px]">
          <AnimatePresence mode="wait" initial={false}>
            <motion.img
              key={`${p.slug}-${img}`}
              src={img}
              alt={`${p.name} — vista previa`}
              draggable={false}
              initial={slide.initial}
              animate={slide.animate}
              exit={slide.exit}
              transition={slide.transition}
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
            />
          </AnimatePresence>

          {total > 1 && (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label={`${labels.prev}: ${p.name}`}
                className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full glass-card flex items-center justify-center text-nx-text hover:text-lava-edge transition-colors"
                style={{ padding: 0 }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M10 3 5 8l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label={`${labels.next}: ${p.name}`}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full glass-card flex items-center justify-center text-nx-text hover:text-lava-edge transition-colors"
                style={{ padding: 0 }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m6 3 5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            </>
          )}

          <span className="absolute left-4 top-4 lava-tag">{p.category}</span>
          <span className="absolute right-4 bottom-3 font-mono text-xs text-nx-dim bg-nx-bg/70 rounded px-2 py-0.5">
            {idx + 1} / {total}
          </span>

          {p.images.length > 1 && (
            <div className="absolute bottom-3 left-4 flex gap-1.5">
              {p.images.map((im, i) => (
                <button
                  key={im}
                  type="button"
                  onClick={() => setImgIdx(i)}
                  aria-label={`Vista ${i + 1} de ${p.name}`}
                  className="nx-slider-thumb"
                  data-active={i === imgIdx ? "1" : "0"}
                >
                  <img src={im} alt="" loading="lazy" draggable={false} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Funcionalidades */}
        <div className="lg:col-span-5 p-6 lg:p-8 flex flex-col">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={p.slug}
              initial={slide.initial}
              animate={slide.animate}
              exit={slide.exit}
              transition={slide.transition}
              className="flex flex-col flex-1"
            >
              <h3 className="font-display text-2xl lg:text-3xl font-bold text-nx-text">{p.name}</h3>
              <p className="text-lava-edge font-mono text-sm mt-1.5 mb-5">{p.tagline}</p>

              <p className="font-mono text-xs uppercase tracking-widest text-nx-dim mb-3">{labels.features}</p>
              <ul className="space-y-2.5 mb-6">
                {p.highlights.map((h) => (
                  <li key={h} className="flex items-start gap-2.5 text-sm text-nx-text-muted leading-snug">
                    <svg className="mt-0.5 shrink-0 text-lava-edge" width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="m3 8.5 3.2 3.2L13 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {h}
                  </li>
                ))}
              </ul>

              <div className="mt-auto">
                <a href={p.href} className="lava-btn lava-btn-ghost">{labels.view}</a>
              </div>
            </motion.div>
          </AnimatePresence>

          {total > 1 && (
            <div className="flex items-center gap-2 mt-6 pt-4 border-t border-nx-border">
              {projects.map((pp, i) => (
                <button
                  key={pp.slug}
                  type="button"
                  onClick={() => setIdx(i)}
                  aria-label={`${i + 1}: ${pp.name}`}
                  aria-current={i === idx ? "true" : "false"}
                  className="nx-slider-dot"
                  data-active={i === idx ? "1" : "0"}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .nx-slider:focus-visible { outline: 2px solid var(--nx-secondary); outline-offset: 2px; }
        .nx-slider-dot { width: 8px; height: 8px; border-radius: 999px; background: var(--nx-border-strong); border: none; padding: 0; cursor: pointer; transition: all .2s ease; }
        .nx-slider-dot[data-active="1"] { background: var(--nx-primary); width: 22px; }
        .nx-slider-dot:hover { background: var(--nx-primary-soft); }
        .nx-slider-thumb { width: 44px; height: 30px; border-radius: 6px; overflow: hidden; padding: 0; border: 1px solid var(--nx-border); cursor: pointer; opacity: .65; transition: all .15s ease; }
        .nx-slider-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .nx-slider-thumb[data-active="1"] { opacity: 1; border-color: var(--nx-primary); }
        .nx-slider-thumb:hover { opacity: 1; }
      `}</style>
    </div>
  )
}
