// Catálogo completo de servicios NX-Studio — trilingüe inline (es/en/pt).
// Data-driven: /servicios, el chatbot y el cotizador consumen este archivo.
// (Se mantiene el i18n JSON para headings de página; el contenido del catálogo
// vive aquí para poder escalar sin tocar 3 JSONs por cambio.)

export type ServiceLocale = 'es' | 'en' | 'pt';

export type Service = {
  slug: string;
  icon: string; // path SVG (viewBox 24)
  title: Record<ServiceLocale, string>;
  desc: Record<ServiceLocale, string>;
  /** línea mono corta tipo "// tag" */
  tag: Record<ServiceLocale, string>;
  /** preset del cotizador al que lleva el CTA (id en pricing-baseline.ts) */
  presetId?: string;
};

export const SERVICES: Service[] = [
  {
    slug: 'web',
    icon: 'M4 6h16v12H4zM4 10h16M8 14h4',
    title: { es: 'Desarrollo web a medida', en: 'Custom web development', pt: 'Desenvolvimento web sob medida' },
    desc: { es: 'Landing pages, sitios corporativos, e-commerce, PWAs y plataformas — con SEO técnico y performance desde el día 1.', en: 'Landing pages, corporate sites, e-commerce, PWAs and platforms — with technical SEO and performance from day 1.', pt: 'Landing pages, sites corporativos, e-commerce, PWAs e plataformas — com SEO técnico e performance desde o dia 1.' },
    tag: { es: '// web', en: '// web', pt: '// web' },
    presetId: 'corporativo',
  },
  {
    slug: 'mobile',
    icon: 'M7 2h10a2 2 0 012 2v16a2 2 0 01-2 2H7a2 2 0 01-2-2V4a2 2 0 012-2zM11 18h2',
    title: { es: 'Apps móviles', en: 'Mobile apps', pt: 'Apps móveis' },
    desc: { es: 'iOS + Android con Flutter/React Native: una base de código, dos tiendas, experiencia nativa.', en: 'iOS + Android with Flutter/React Native: one codebase, two stores, native experience.', pt: 'iOS + Android com Flutter/React Native: uma base de código, duas lojas, experiência nativa.' },
    tag: { es: '// mobile', en: '// mobile', pt: '// mobile' },
    presetId: 'mobile',
  },
  {
    slug: 'ia',
    icon: 'M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6l2.1 2.1m0-12.8l-2.1 2.1M7.7 16.3l-2.1 2.1M12 8a4 4 0 100 8 4 4 0 000-8z',
    title: { es: 'IA aplicada', en: 'Applied AI', pt: 'IA aplicada' },
    desc: { es: 'Chatbots con acceso a tus servicios, RAG sobre tus documentos, agentes y automatizaciones con LLMs.', en: 'Chatbots wired to your services, RAG over your documents, agents and LLM automations.', pt: 'Chatbots conectados aos seus serviços, RAG sobre seus documentos, agentes e automações com LLMs.' },
    tag: { es: '// ia', en: '// ai', pt: '// ia' },
    presetId: 'ia',
  },
  {
    slug: 'automation',
    icon: 'M13 10V3L4 14h7v7l9-11h-7z',
    title: { es: 'Automatizaciones e integraciones', en: 'Automations & integrations', pt: 'Automações e integrações' },
    desc: { es: 'WhatsApp Cloud API, CRMs, ERPs, pasarelas de pago (Wompi, PayU, PSE), facturación electrónica DIAN.', en: 'WhatsApp Cloud API, CRMs, ERPs, payment gateways (Wompi, PayU, PSE), DIAN e-invoicing.', pt: 'WhatsApp Cloud API, CRMs, ERPs, gateways de pagamento (Wompi, PayU, PSE), faturação eletrônica DIAN.' },
    tag: { es: '// automation', en: '// automation', pt: '// automação' },
    presetId: 'ia',
  },
  {
    slug: 'saas',
    icon: 'M4 4h16v6H4zM4 14h16v6H4zM8 7h.01M8 17h.01',
    title: { es: 'Productos SaaS', en: 'SaaS products', pt: 'Produtos SaaS' },
    desc: { es: 'Multi-tenant, suscripciones, dashboards, roles y facturación — arquitectura pensada para escalar.', en: 'Multi-tenant, subscriptions, dashboards, roles and billing — architecture built to scale.', pt: 'Multi-tenant, assinaturas, dashboards, roles e faturação — arquitetura pronta para escalar.' },
    tag: { es: '// saas', en: '// saas', pt: '// saas' },
    presetId: 'webapp',
  },
  {
    slug: 'ecommerce',
    icon: 'M6 2l-2 5v13a2 2 0 002 2h12a2 2 0 002-2V7l-2-5zM4 7h16M9 11a3 3 0 006 0',
    title: { es: 'E-commerce y marketplaces', en: 'E-commerce & marketplaces', pt: 'E-commerce e marketplaces' },
    desc: { es: 'Tiendas online y marketplaces con carrito, inventario, envíos y pasarelas locales.', en: 'Online stores and marketplaces with cart, inventory, shipping and local gateways.', pt: 'Lojas online e marketplaces com carrinho, estoque, envios e gateways locais.' },
    tag: { es: '// commerce', en: '// commerce', pt: '// comércio' },
    presetId: 'ecommerce',
  },
  {
    slug: 'qa',
    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    title: { es: 'Testing & QA', en: 'Testing & QA', pt: 'Testing & QA' },
    desc: { es: 'QA manual + automatizado, performance, accesibilidad WCAG 2.1 AA y seguridad. Tiers Foundation/Accelerator/Strategic.', en: 'Manual + automated QA, performance, WCAG 2.1 AA accessibility and security. Foundation/Accelerator/Strategic tiers.', pt: 'QA manual + automatizado, performance, acessibilidade WCAG 2.1 AA e segurança. Tiers Foundation/Accelerator/Strategic.' },
    tag: { es: '// quality', en: '// quality', pt: '// qualidade' },
    presetId: 'qa',
  },
  {
    slug: 'security',
    icon: 'M12 2l8 4v6c0 5-3.4 9.3-8 10-4.6-.7-8-5-8-10V6zM9 12l2 2 4-4',
    title: { es: 'Seguridad de software', en: 'Software security', pt: 'Segurança de software' },
    desc: { es: 'Auditorías OWASP, hardening de headers, gestión de secretos y checklist pre-lanzamiento.', en: 'OWASP audits, header hardening, secrets management and pre-launch checklists.', pt: 'Auditorias OWASP, hardening de headers, gestão de segredos e checklist pré-lançamento.' },
    tag: { es: '// security', en: '// security', pt: '// segurança' },
    presetId: 'qa',
  },
  {
    slug: 'design',
    icon: 'M12 19l7-7 3 3-7 7-3-3zM18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5zM2 2l7.586 7.586M11 11a2 2 0 11-4 0 2 2 0 014 0z',
    title: { es: 'UI/UX y design systems', en: 'UI/UX & design systems', pt: 'UI/UX e design systems' },
    desc: { es: 'Interfaces que convierten: research, wireframes, design tokens, prototipos y sistemas de componentes.', en: 'Interfaces that convert: research, wireframes, design tokens, prototypes and component systems.', pt: 'Interfaces que convertem: research, wireframes, design tokens, protótipos e sistemas de componentes.' },
    tag: { es: '// design', en: '// design', pt: '// design' },
    presetId: 'corporativo',
  },
  {
    slug: 'data',
    icon: 'M3 3v18h18M7 15v3M12 10v8M17 6v12',
    title: { es: 'Data & BI', en: 'Data & BI', pt: 'Data & BI' },
    desc: { es: 'Dashboards en tiempo real, reporting, ETL ligero y métricas que el negocio entiende.', en: 'Real-time dashboards, reporting, light ETL and metrics the business understands.', pt: 'Dashboards em tempo real, relatórios, ETL leve e métricas que o negócio entende.' },
    tag: { es: '// data', en: '// data', pt: '// data' },
    presetId: 'webapp',
  },
  {
    slug: 'cloud',
    icon: 'M17.5 19a4.5 4.5 0 100-9h-.3A7 7 0 104 15.9M12 12v9m-4-4l4-4 4 4',
    title: { es: 'Cloud & DevOps', en: 'Cloud & DevOps', pt: 'Cloud & DevOps' },
    desc: { es: 'CI/CD, infraestructura como código, Cloudflare/AWS, monitoreo y deployments sin drama.', en: 'CI/CD, infrastructure as code, Cloudflare/AWS, monitoring and drama-free deployments.', pt: 'CI/CD, infraestrutura como código, Cloudflare/AWS, monitoramento e deployments sem drama.' },
    tag: { es: '// ops', en: '// ops', pt: '// ops' },
    presetId: 'webapp',
  },
  {
    slug: 'migrations',
    icon: 'M4 4h7v7H4zM13 13h7v7h-7zM8 8h5v5',
    title: { es: 'Modernización y migraciones', en: 'Modernization & migrations', pt: 'Modernização e migrações' },
    desc: { es: 'Rescata ese sistema legacy: migración de stacks, refactors seguros con tests y cero downtime.', en: 'Rescue that legacy system: stack migrations, safe refactors with tests and zero downtime.', pt: 'Resgate aquele sistema legado: migração de stacks, refactors seguros com tests e zero downtime.' },
    tag: { es: '// legacy', en: '// legacy', pt: '// legacy' },
    presetId: 'webapp',
  },
  {
    slug: 'support',
    icon: 'M12 2a10 10 0 100 20 10 10 0 000-20zM12 8v5l3 3',
    title: { es: 'Mantenimiento y soporte', en: 'Maintenance & support', pt: 'Manutenção e suporte' },
    desc: { es: 'SLAs de respuesta, monitoreo, actualizaciones de seguridad y evolución continua (15-25% del desarrollo al año).', en: 'Response SLAs, monitoring, security updates and continuous evolution (15-25% of dev cost yearly).', pt: 'SLAs de resposta, monitoramento, atualizações de segurança e evolução contínua (15-25% do desenvolvimento ao ano).' },
    tag: { es: '// support', en: '// support', pt: '// suporte' },
    presetId: 'qa',
  },
  {
    slug: 'consulting',
    icon: 'M12 2a5 5 0 015 5c0 2-1 3-2 4h-6c-1-1-2-2-2-4a5 5 0 015-5zM9 16h6M10 20h4',
    title: { es: 'Consultoría y arquitectura', en: 'Consulting & architecture', pt: 'Consultoria e arquitetura' },
    desc: { es: 'Roadmaps técnicos, auditorías de código, decisiones de stack y CTO as a service.', en: 'Technical roadmaps, code audits, stack decisions and CTO as a service.', pt: 'Roadmaps técnicos, auditorias de código, decisões de stack e CTO as a service.' },
    tag: { es: '// cto', en: '// cto', pt: '// cto' },
    presetId: 'webapp',
  },
  {
    slug: 'templates',
    icon: 'M4 3h16l-6 8v7l-4 2v-9zM4 3h16',
    title: { es: 'Templates comprables', en: 'Buyable templates', pt: 'Templates compráveis' },
    desc: { es: 'Landing, dashboard y e-commerce listos para adaptar — código propio, MIT license, despliegue en horas.', en: 'Landing, dashboard and e-commerce ready to adapt — your own code, MIT license, deploy in hours.', pt: 'Landing, dashboard e e-commerce prontos para adaptar — código próprio, licença MIT, deploy em horas.' },
    tag: { es: '// templates', en: '// templates', pt: '// templates' },
  },
  {
    slug: 'seo',
    icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3a2 2 0 104 0V7',
    title: { es: 'SEO técnico', en: 'Technical SEO', pt: 'SEO técnico' },
    desc: { es: 'Core Web Vitals, datos estructurados, sitemaps, hreflang y arquitectura que Google entiende.', en: 'Core Web Vitals, structured data, sitemaps, hreflang and architecture Google understands.', pt: 'Core Web Vitals, dados estruturados, sitemaps, hreflang e arquitetura que o Google entende.' },
    tag: { es: '// seo', en: '// seo', pt: '// seo' },
    presetId: 'corporativo',
  },
];

export function serviceText(s: Service, locale: ServiceLocale) {
  return {
    title: s.title[locale] ?? s.title.es,
    desc: s.desc[locale] ?? s.desc.es,
    tag: s.tag[locale] ?? s.tag.es,
  };
}
