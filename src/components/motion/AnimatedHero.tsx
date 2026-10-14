import { motion, useReducedMotion } from 'framer-motion';

type CTA = { label: string; href: string };
type Stat = { value: string; label: string };

export type AnimatedHeroProps = {
  badge: string;
  titleA: string;
  titleEm: string;
  titleB: string;
  subtitlePre: string;
  subtitleStrong: string;
  subtitlePost: string;
  chips: string[];
  primaryCta: CTA;
  secondaryCta: CTA;
  stats: Stat[];
};

export default function AnimatedHero(props: AnimatedHeroProps) {
  const reduce = useReducedMotion();

  const container = {
    hidden: {},
    show: {
      transition: { staggerChildren: reduce ? 0 : 0.08, delayChildren: 0.05 },
    },
  };
  const item = {
    hidden: { opacity: 0, y: 24, filter: 'blur(8px)' },
    show: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
    },
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="relative"
    >
      <motion.div variants={item} className="inline-flex">
        <span className="lava-tag">
          <span className="relative flex h-2 w-2">
            <span className="absolute inset-0 animate-ping rounded-full bg-nx-primary opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-nx-primary" />
          </span>
          {props.badge}
        </span>
      </motion.div>

      <motion.h1
        variants={item}
        className="mt-6 font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.04] tracking-tight"
      >
        {props.titleA}{' '}
        <span className="bg-gradient-to-r from-nx-primary to-nx-primary-soft bg-clip-text text-transparent">
          {props.titleEm}
        </span>
        <span className="block mt-2">{props.titleB}</span>
      </motion.h1>

      <motion.p
        variants={item}
        className="mt-6 max-w-2xl text-lg text-nx-text-muted leading-relaxed"
      >
        {props.subtitlePre} <b className="text-nx-text font-semibold">{props.subtitleStrong}</b>{props.subtitlePost}
      </motion.p>

      <motion.div variants={item} className="mt-8 flex flex-wrap gap-2">
        {props.chips.map((c) => (
          <span key={c} className="lava-tag">{c}</span>
        ))}
      </motion.div>

      <motion.div variants={item} className="mt-10 flex flex-wrap gap-3">
        <a href={props.primaryCta.href} className="lava-btn glow-lava">
          <span>{props.primaryCta.label}</span>
          <span aria-hidden>→</span>
        </a>
        <a href={props.secondaryCta.href} className="lava-btn lava-btn-ghost">
          {props.secondaryCta.label}
        </a>
      </motion.div>

      <motion.div
        variants={item}
        className="mt-12 grid grid-cols-3 gap-6 border-t border-nx-border pt-6 max-w-2xl"
      >
        {props.stats.map((s) => (
          <div key={s.label}>
            <div className="font-display text-3xl font-bold text-nx-text">{s.value}</div>
            <div className="mt-1 font-mono text-xs text-nx-text-dim uppercase tracking-widest">{s.label}</div>
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
}
