import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

export default function PatternKinetic() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.6]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.2]);
  const y = useTransform(scrollYProgress, [0, 1], [0, -120]);

  return (
    <div ref={ref} className="relative w-full h-[140vh] bg-nx-bg overflow-hidden">
      <div className="sticky top-0 h-screen w-full flex flex-col items-center justify-center px-6">
        <motion.div style={{ scale, opacity, y }} className="w-full text-center">
          <motion.span
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="font-mono text-xs uppercase tracking-[0.3em] text-nx-text-dim"
          >
            NX-Studio · 2026
          </motion.span>

          <h2 className="mt-6 font-display text-[14vw] md:text-[12vw] font-bold leading-[0.85] tracking-tighter text-nx-text">
            {'WE BUILD\nSOFTWARE\nTHAT SHIPS.'.split('\n').map((line, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 80, filter: 'blur(12px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.8, delay: 0.2 + i * 0.15, ease: [0.22, 1, 0.36, 1] }}
                className="block"
                style={i === 1 ? { color: 'var(--nx-primary)' } : undefined}
              >
                {line}
              </motion.span>
            ))}
          </h2>

          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.9 }}
            className="mt-8 font-mono text-sm text-nx-text-muted"
          >
            Producto · Servicio · Plantillas
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 1.1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-nx-text-dim"
        >
          <span className="font-mono text-[10px] uppercase tracking-widest">scroll</span>
          <span className="block w-px h-8 bg-nx-border-strong" />
        </motion.div>
      </div>
    </div>
  );
}
