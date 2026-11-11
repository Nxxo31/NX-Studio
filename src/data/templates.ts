// Templates — productos one-time-payment
// Inspirado en Arc.dev marketplace + Cadence engagement shape (one-off project starter)
// Estructura: nombre / slug / descripción / stack / precio fijo / lo que incluye / lo que NO incluye / demo

export type Template = {
  slug: string;
  name: string;
  tagline: string;
  desc: string;
  category: 'Landing' | 'Dashboard' | 'E-commerce' | 'SaaS' | 'Auth' | 'Blog';
  stack: string[];
  price: number; // USD one-time
  includes: string[];
  excludes: string[];
  demoUrl?: string;
  repoUrl?: string;
  featured?: boolean;
};

export const TEMPLATES: Template[] = [
  {
    slug: 'landing-converter',
    name: 'Landing Converter',
    tagline: 'Landing de alta conversión con A/B testing integrado',
    desc: 'Página de aterrizaje con imagen principal animada, secciones que se reordenan fácil, textos técnicos, envío de correos con Resend, estadísticas con Plausible, prueba A/B de dos versiones y vistas previas para redes sociales.',
    category: 'Landing',
    stack: ['Next.js 16', 'Tailwind v4', 'Resend', 'Plausible', 'Framer Motion'],
    price: 290,
    includes: [
      'Código fuente completo MIT-licensed',
      'Setup en Vercel guiado paso a paso',
      'A/B testing nativo (2 variants baked)',
      'Plausible analytics preconfigurado',
      'Resend integration (3 templates de email)',
      'Documentación + video walkthrough 20min',
    ],
    excludes: [
      'Diseño custom (la plantilla conserva su identidad propia)',
      'Copywriting',
      'Hosting mensual (Vercel free tier OK)',
      'Soporte post-compra',
    ],
    featured: true,
  },
  {
    slug: 'dashboard-starter',
    name: 'Dashboard Starter',
    tagline: 'Panel admin con auth, tablas, charts y RBAC',
    desc: 'Panel de control para varias empresas, con inicio de sesión, tablas que se filtran desde el servidor, gráficas, exportación a Excel y PDF, permisos por rol y modo claro u oscuro.',
    category: 'Dashboard',
    stack: ['Next.js 16', 'Prisma', 'PostgreSQL', 'NextAuth', 'Tailwind v4', 'Recharts'],
    price: 590,
    includes: [
      'Multi-tenant schema + RLS',
      'NextAuth (credentials + OAuth)',
      'RBAC con 3 roles (admin/editor/viewer)',
      'Tablas con paginación + filtros + sorts',
      '4 tipos de charts (line/bar/pie/area)',
      'Exports CSV + PDF',
      'Seed script + DB migrations',
    ],
    excludes: [
      'Auth provider custom',
      'Diseño fuera de la identidad del sitio',
      'Deployment',
    ],
    featured: true,
  },
  {
    slug: 'ecommerce-headless',
    name: 'Headless E-commerce',
    tagline: 'Storefront con Stripe + Medusa backend',
    desc: 'Tienda online donde la vitrina y el sistema de pedidos están separados: catálogo, control de stock, carrito que no se pierde al cerrar la página y pago con Stripe.',
    category: 'E-commerce',
    stack: ['Next.js 16', 'Medusa', 'Stripe', 'Tailwind v4', 'PostgreSQL'],
    price: 890,
    includes: [
      'Storefront + admin panel básico',
      'Stripe checkout + webhooks',
      'Inventory tracking',
      'Cart persistente (localStorage + DB)',
      'Catálogo con filtros + búsqueda',
      'Orders management',
    ],
    excludes: [
      'Shipping integrations (UPS/FedEx/DHL)',
      'Multi-currency / multi-locale',
      'Subscriptions',
      'Diseño custom',
    ],
  },
];

export function getFeaturedTemplates(): Template[] {
  return TEMPLATES.filter((t) => t.featured);
}

export function getTemplateBySlug(slug: string): Template | undefined {
  return TEMPLATES.find((t) => t.slug === slug);
}