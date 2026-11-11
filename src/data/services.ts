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
    desc: { es: 'Páginas de aterrizaje, sitios corporativos y tiendas en línea, diseñadas para funcionar bien desde el primer día del cliente.', en: 'Landing pages, corporate sites and online stores, built to work well from the customer\'s first visit.', pt: 'Landing pages, sites corporativos e lojas online, construídas para funcionar bem desde a primeira visita do cliente.' },
    tag: { es: '// web', en: '// web', pt: '// web' },
    presetId: 'corporativo',
  },
  {
    slug: 'mobile',
    icon: 'M7 2h10a2 2 0 012 2v16a2 2 0 01-2 2H7a2 2 0 01-2-2V4a2 2 0 012-2zM11 18h2',
    title: { es: 'Apps móviles', en: 'Mobile apps', pt: 'Apps móveis' },
    desc: { es: 'Aplicaciones para iOS y Android con un solo código para ambas tiendas, con experiencia nativa.', en: 'iOS and Android apps with a single codebase for both app stores, with native experience.', pt: 'Aplicações para iOS e Android com um único código para ambas lojas, com experiência nativa.' },
    tag: { es: '// mobile', en: '// mobile', pt: '// mobile' },
    presetId: 'mobile',
  },
  {
    slug: 'ia',
    icon: 'M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6l2.1 2.1m0-12.8l-2.1 2.1M7.7 16.3l-2.1 2.1M12 8a4 4 0 100 8 4 4 0 000-8z',
    title: { es: 'IA aplicada', en: 'Applied AI', pt: 'IA aplicada' },
    desc: { es: 'Un asistente que responde preguntas usando la información de tu empresa, y tareas repetitivas que se hacen solas.', en: 'A virtual assistant that answers questions using your company\'s information, and repetitive tasks that run themselves.', pt: 'Um assistente que responde perguntas usando informações da sua empresa, e tarefas repetitivas que se fazem sozinhas.' },
    tag: { es: '// ia', en: '// ai', pt: '// ia' },
    presetId: 'ia',
  },
  {
    slug: 'automation',
    icon: 'M13 10V3L4 14h7v7l9-11h-7z',
    title: { es: 'Automatizaciones e integraciones', en: 'Automations & integrations', pt: 'Automações e integrações' },
    desc: { es: 'Conexión de WhatsApp con tus sistemas de gestión y procesamiento de pagos, incluyendo facturación electrónica para cumplir con la normativa.', en: 'WhatsApp integration with your business systems (CRM, ERP) and payment processing, including electronic invoicing to comply with regulations.', pt: 'Integração do WhatsApp com seus sistemas de gestão e processamento de pagamentos, incluindo emissão eletrônica de notas fiscais para cumprir a regulamentação.' },
    tag: { es: '// automation', en: '// automation', pt: '// automação' },
    presetId: 'ia',
  },
  {
    slug: 'saas',
    icon: 'M4 4h16v6H4zM4 14h16v6H4zM8 7h.01M8 17h.01',
    title: { es: 'Productos SaaS', en: 'SaaS products', pt: 'Produtos SaaS' },
    desc: { es: 'Sistema donde empresas comparten la misma instalación, con cobro por suscripción y paneles de control, para crecer con tu negocio.', en: 'System where multiple customers share one installation, with subscription billing and access controls, to scale with your business.', pt: 'Sistema onde empresas compartilham a mesma instalação, com cobro por assinatura e painéis de controle, para crescer com o seu negócio.' },
    tag: { es: '// saas', en: '// saas', pt: '// saas' },
    presetId: 'webapp',
  },
  {
    slug: 'ecommerce',
    icon: 'M6 2l-2 5v13a2 2 0 002 2h12a2 2 0 002-2V7l-2-5zM4 7h16M9 11a3 3 0 006 0',
    title: { es: 'E-commerce y marketplaces', en: 'E-commerce & marketplaces', pt: 'E-commerce e marketplaces' },
    desc: { es: 'Tiendas en línea y mercados con carrito de compras, control de stock, envíos y pasarelas de pago locales.', en: 'Online stores and marketplaces with shopping cart, inventory management, shipping and local payment gateways.', pt: 'Lojas online e marketplaces com carrinho de compras, controle de estoque, envios e gateways de pagamento locais.' },
    tag: { es: '// commerce', en: '// commerce', pt: '// comércio' },
    presetId: 'ecommerce',
  },
  {
    slug: 'qa',
    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    title: { es: 'Testing & QA', en: 'Testing & QA', pt: 'Testing & QA' },
    desc: { es: 'Pruebas manuales y automatizadas para validar que tu software funciona bien, sea accesible y seguro, con distintos niveles de servicio.', en: 'Manual and automated QA to validate your software works properly, is accessible and secure, with different service tiers.', pt: 'QA manual e automatizado para validar que seu software funciona bem, seja acessível e seguro.' },
    tag: { es: '// quality', en: '// quality', pt: '// qualidade' },
    presetId: 'qa',
  },
  {
    slug: 'security',
    icon: 'M12 2l8 4v6c0 5-3.4 9.3-8 10-4.6-.7-8-5-8-10V6zM9 12l2 2 4-4',
    title: { es: 'Seguridad de software', en: 'Software security', pt: 'Segurança de software' },
    desc: { es: 'Análisis de seguridad siguiendo buenas prácticas, hardening de headers y checklist pre-lanzamiento.', en: 'Security analysis following best practices, hardening of headers, secure secrets management and pre-launch checklist.', pt: 'Análise de segurança seguindo boas práticas, hardening de headers, gestão segura de segredos e checklist pré-lançamento.' },
    tag: { es: '// security', en: '// security', pt: '// segurança' },
    presetId: 'qa',
  },
  {
    slug: 'design',
    icon: 'M12 19l7-7 3 3-7 7-3-3zM18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5zM2 2l7.586 7.586M11 11a2 2 0 11-4 0 2 2 0 014 0z',
    title: { es: 'UI/UX y design systems', en: 'UI/UX & design systems', pt: 'UI/UX e design systems' },
    desc: { es: 'Diseño de interfaces que convierten visitantes en clientes: investigación, wireframes y sistemas de componentes.', en: 'Design of interfaces that convert visitors into customers: research, wireframes, design tokens, prototypes and reusable component systems.', pt: 'Design de interfaces que convertem visitantes em clientes: research, wireframes, design tokens, protótipos e sistemas de componentes reutilizáveis.' },
    tag: { es: '// design', en: '// design', pt: '// design' },
    presetId: 'corporativo',
  },
  {
    slug: 'data',
    icon: 'M3 3v18h18M7 15v3M12 10v8M17 6v12',
    title: { es: 'Data & BI', en: 'Data & BI', pt: 'Data & BI' },
    desc: { es: 'Paneles con datos actualizados, reportes automáticos, procesamiento ligero y métricas que el negocio entiende.', en: 'Real-time dashboards with updated data, automated reporting, light ETL and metrics the business actually understands.', pt: 'Dashboards em tempo real com dados atualizados, relatórios automáticos, ETL leve e métricas que o negócio realmente entende.' },
    tag: { es: '// data', en: '// data', pt: '// data' },
    presetId: 'webapp',
  },
  {
    slug: 'cloud',
    icon: 'M17.5 19a4.5 4.5 0 100-9h-.3A7 7 0 104 15.9M12 12v9m-4-4l4-4 4 4',
    title: { es: 'Cloud & DevOps', en: 'Cloud & DevOps', pt: 'Cloud & DevOps' },
    desc: { es: 'Configuración y despliegue automático de servicios, gestión de infraestructura como código, monitoreo y despliegues sin complicaciones.', en: 'Automatic service deployment, infrastructure as code management, monitoring and drama-free deployments.', pt: 'Configuração e deploy automático de serviços, gestão de infraestrutura como código, monitoramento e deployments sem drama.' },
    tag: { es: '// ops', en: '// ops', pt: '// ops' },
    presetId: 'webapp',
  },
  {
    slug: 'migrations',
    icon: 'M4 4h7v7H4zM13 13h7v7h-7zM8 8h5v5',
    title: { es: 'Modernización y migraciones', en: 'Modernization & migrations', pt: 'Modernização e migrações' },
    desc: { es: 'Rescate y modernización de sistemas heredados: migración de pilas tecnológicas, refactoring seguro con tests y sin tiempo de inactividad.', en: 'Rescue and modernization of legacy systems: stack migrations, safe refactoring with tests and zero downtime.', pt: 'Resgate e modernização de sistemas legados: migração de stacks, refactoring seguro com tests e zero downtime.' },
    tag: { es: '// legacy', en: '// legacy', pt: '// legacy' },
    presetId: 'webapp',
  },
  {
    slug: 'support',
    icon: 'M12 2a10 10 0 100 20 10 10 0 000-20zM12 8v5l3 3',
    title: { es: 'Mantenimiento y soporte', en: 'Maintenance & support', pt: 'Manutenção e suporte' },
    desc: { es: 'Acuerdos de nivel de servicio para respuesta rápida, monitoreo, actualizaciones de seguridad y evolución del sistema.', en: 'Service level agreements for quick response, monitoring, security updates and continuous evolution.', pt: 'SLAs para resposta rápida, monitoramento e atualizações de segurança.' },
    tag: { es: '// support', en: '// support', pt: '// suporte' },
    presetId: 'qa',
  },
  {
    slug: 'consulting',
    icon: 'M12 2a5 5 0 015 5c0 2-1 3-2 4h-6c-1-1-2-2-2-4a5 5 0 015-5zM9 16h6M10 20h4',
    title: { es: 'Consultoría y arquitectura', en: 'Consulting & architecture', pt: 'Consultoria e arquitetura' },
    desc: { es: 'Roadmaps técnicos, auditorías de código, decisiones sobre qué tecnologías usar y un CTO a tu disposición.', en: 'Technical roadmaps, code audits, decisions on what technologies to use and a CTO available to your team.', pt: 'Roadmaps técnicos, auditorías de código, decisões sobre tecnologias e um CTO ao seu dispor.' },
    tag: { es: '// cto', en: '// cto', pt: '// cto' },
    presetId: 'webapp',
  },
  {
    slug: 'templates',
    icon: 'M4 3h16l-6 8v7l-4 2v-9zM4 3h16',
    title: { es: 'Templates comprables', en: 'Buyable templates', pt: 'Templates compráveis' },
    desc: { es: 'Landing pages, dashboards y tiendas en línea listos para adaptar con tu propio código, licencia MIT y despliegue en pocas horas.', en: 'Landing pages, dashboards and online stores ready to adapt with your own code, MIT license and deployment in hours.', pt: 'Landing pages, dashboards e lojas online prontos para adaptar com seu próprio código, licença MIT e deploy em poucas horas.' },
    tag: { es: '// templates', en: '// templates', pt: '// templates' },
  },
  {
    slug: 'seo',
    icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3a2 2 0 104 0V7',
    title: { es: 'SEO técnico', en: 'Technical SEO', pt: 'SEO técnico' },
    desc: { es: 'Optimización para que Google entienda tu sitio: Core Web Vitals, datos estructurados y sitemaps.', en: 'Optimization so Google understands your site: Core Web Vitals, structured data, sitemaps, hreflang and architecture search engines can read.', pt: 'Otimização para o Google entender seu site: Core Web Vitals, dados estruturados e sitemaps.' },
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
