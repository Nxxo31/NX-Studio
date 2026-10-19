import { motion } from 'framer-motion';

const headline = ['Software', 'que', 'se', 'entrega', 'a', 'la', 'velocidad', 'de', 'la', 'voz', 'del', 'cliente.'];

export default function PatternEditorial() {
  return (
    <div className="relative w-full h-full overflow-hidden bg-nx-bg">
      <div className="absolute inset-0 -z-10 opacity-40" style={{
        background: 'radial-gradient(60% 50% at 20% 20%, rgba(255,69,0,0.25), transparent 60%), radial-gradient(50% 40% at 80% 70%, rgba(129,140,248,0.30), transparent 60%)',
        animation: 'aurora 18s ease-in-out infinite alternate',
      }} />
      <style>{`@keyframes aurora { 0% { transform: translate3d(0,0,0) scale(1); } 100% { transform: translate3d(-4%,2%,0) scale(1.08); } }`}</style>

      <div className="w-full h-full grid grid-cols-12 items-center gap-6 px-8 md:px-16 py-12">
        <div className="col-span-12 md:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
            className="font-mono text-[11px] uppercase tracking-[0.3em] text-nx-text-dim"
          >
            NX-Studio<br />Est. 2023<br />Neiva · LATAM
          </motion.div>
        </div>

        <div className="col-span-12 md:col-span-8">
          <h2
            className="font-serif text-5xl md:text-7xl lg:text-8xl font-medium leading-[0.95] text-nx-text tracking-tight"
            style={{ fontFamily: '"Playfair Display", "Source Serif Pro", Georgia, serif' }}
          >
            {headline.map((w, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
                whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.7, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                className="inline-block mr-3"
                style={i === 1 || i === 6 ? { fontStyle: 'italic', color: 'var(--nx-primary)' } : undefined}
              >
                {w}
              </motion.span>
            ))}
          </h2>
        </div>

        <div className="col-span-12 md:col-span-2 md:text-right">
          <motion.p
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.6 }}
            className="font-mono text-xs text-nx-text-muted"
          >
            Estudio de software<br />que diseña y construye<br />productos para producción.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.4 }}
          className="col-span-12 mt-8 flex items-center gap-4"
        >
          <a href="#" onClick={(e) => e.preventDefault()} className="lava-btn">Reservar consulta →</a>
          <a href="#" onClick={(e) => e.preventDefault()} className="font-mono text-xs uppercase tracking-widest text-nx-text-muted hover:text-nx-text">Ver portafolio</a>
        </motion.div>
      </div>
    </div>
  );
}
