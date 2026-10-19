import { motion } from 'framer-motion';

const cards = [
  { span: 'lg:col-span-3 lg:row-span-2', kicker: '// FLAGSHIP', title: 'NexoCore', body: 'ERP / CRM / Analytics multi-tenant para PyMEs.', tag: 'live', accent: true },
  { span: 'lg:col-span-2', kicker: '// STATS', title: '11 / 24+ / 4sem', body: 'Productos live · tecnologías · sprint típico.', tag: 'now', accent: false },
  { span: 'lg:col-span-1', kicker: '// OS', body: 'LATAM remote-first.', tag: 'since 2023', accent: false },
  { span: 'lg:col-span-1', kicker: '// STACK', body: 'Astro · Cloudflare · D1.', tag: 'edge-native', accent: false },
  { span: 'lg:col-span-3', kicker: '// CTA', body: 'Reservá 30 min gratis. Te entrego prototipo funcional en 72h.', tag: '→', accent: true },
];

export default function PatternBento() {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center px-6 py-12 overflow-hidden">
      <div className="w-full max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="mb-10"
        >
          <span className="font-mono text-xs uppercase tracking-widest text-nx-text-dim">NX-Studio · glass/depth v0.8.0</span>
          <h2 className="mt-3 font-display text-4xl md:text-6xl font-bold tracking-tighter leading-[1.02] text-nx-text">
            Software que <span className="bg-gradient-to-r from-nx-primary to-nx-primary-soft bg-clip-text text-transparent">escala</span> contigo.
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 auto-rows-[minmax(0,1fr)]"
          style={{ minHeight: 480 }}
        >
          {cards.map((c, i) => (
            <motion.article
              key={i}
              variants={{ hidden: { opacity: 0, y: 20, scale: 0.97 }, show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } } }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className={`glass-card p-5 flex flex-col justify-between min-h-[160px] ${c.span} ${c.accent ? 'border-nx-primary' : ''}`}
              style={c.accent ? { borderColor: 'var(--nx-primary)', background: 'linear-gradient(180deg, var(--nx-surface), color-mix(in oklab, var(--nx-primary) 8%, var(--nx-surface)))' } : undefined}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-widest text-nx-text-dim">{c.kicker}</span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-nx-text-dim">{c.tag}</span>
              </div>
              <div>
                {c.title && <h3 className="font-display text-2xl font-bold text-nx-text">{c.title}</h3>}
                <p className="mt-1 text-sm text-nx-text-muted leading-relaxed">{c.body}</p>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
