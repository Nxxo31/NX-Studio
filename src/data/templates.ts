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
    desc: 'Landing page con hero animado, secciones modulares, copy técnico, integraciones con Resend y Plausible, A/B testing nativo, OG cards dinámicas.',
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
      'Diseño custom (la plantilla viene con identidad lava neon)',
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
    desc: 'Dashboard multi-tenant con autenticación, tablas con filtros server-side, charts (Recharts), exports CSV/PDF, RBAC, dark/light mode.',
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
      'Diseño fuera del tema lava neon',
      'Deployment',
    ],
    featured: true,
  },
  {
    slug: 'ecommerce-headless',
    name: 'Headless E-commerce',
    tagline: 'Storefront con Stripe + Medusa backend',
    desc: 'E-commerce headless: storefront Next.js + backend Medusa, Stripe payments, inventory, cart persistente, checkout optimizado.',
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