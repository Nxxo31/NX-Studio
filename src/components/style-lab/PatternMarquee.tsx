import { motion } from 'framer-motion';

const marqueeItems = [
  '11 productos live', '24+ tecnologías', 'LATAM remote-first', 'Astro · Cloudflare · D1', 'Motion · Glass · Steel', 'Cotizador · Lab · Templates', 'Web · Mobile · Trading', 'Desde 2023', 'Brutalism · Glass · Editorial · Bento',
];

export default function PatternMarquee() {
  return (
    <div className="relative w-full h-full flex flex-col">
      <div className="relative w-full overflow-hidden border-y border-nx-border bg-nx-surface py-5">
        <motion.div
          className="flex gap-10 whitespace-nowrap"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ x: { duration: 28, ease: 'linear', repeat: Infinity } }}
        >
          {[...marqueeItems, ...marqueeItems, ...marqueeItems].map((t, i) => (
            <span key={i} className="font-display text-3xl md:text-5xl font-bold text-nx-text">
              {t} <span className="text-nx-primary mx-6">◆</span>
            </span>
          ))}
        </motion.div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
          className="w-full max-w-6xl"
        >
          <motion.h2
            variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.6 } } }}
            className="font-display text-4xl md:text-6xl font-bold tracking-tighter leading-[1.02] text-nx-text"
          >
            Construimos productos <span className="bg-gradient-to-r from-nx-primary to-nx-primary-soft bg-clip-text text-transparent">a tu velocidad</span>.
          </motion.h2>
          <motion.p
            variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, delay: 0.1 } } }}
            className="mt-4 max-w-2xl text-nx-text-muted text-lg"
          >
            Software que escala contigo. Construimos aplicaciones a medida, QA as a service, y templates comprables.
          </motion.p>

          <motion.div
            variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, delay: 0.2 } } }}
            className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3"
          >
            {['Producto a medida', 'QA as a service', 'Templates comprables'].map((t, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -3 }}
                className="glass-card p-5"
              >
                <div className="font-mono text-[10px] uppercase tracking-widest text-nx-text-dim">// 0{i+1}</div>
                <div className="mt-2 font-display text-lg font-semibold text-nx-text">{t}</div>
                <div className="mt-1 text-xs text-nx-text-muted">Empezá con un estimado en 5 minutos.</div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
