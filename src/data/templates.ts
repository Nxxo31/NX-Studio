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
    tagline: 'Página de aterrizaje que convierte, con prueba A/B incluida',
    desc: 'Página de aterrizaje con imagen principal animada, secciones que se reordenan fácil, textos técnicos, envío de correos con Resend, estadísticas con Plausible, prueba A/B de dos versiones y vistas previas para redes sociales.',
    category: 'Landing',
    stack: ['Next.js 16', 'Tailwind v4', 'Resend', 'Plausible', 'Framer Motion'],
    price: 290,
    includes: [
      'Código fuente completo con licencia MIT (puedes usarlo comercialmente)',
      'Publicación en Vercel explicada paso a paso',
      'Prueba A/B incluida con dos versiones de la página',
      'Estadísticas de visitas con Plausible ya configurado',
      'Envío de correos con Resend (3 plantillas de email)',
      'Documentación y un video de 20 minutos explicando el uso'
    ],
    excludes: [
      'Diseño a medida (la plantilla conserva su identidad propia)',
      'Redacción de los textos de venta',
      'Hosting mensual (el plan gratuito de Vercel alcanza)',
      'Acompañamiento después de la compra'
    ],
    featured: true,
  },
  {
    slug: 'dashboard-starter',
    name: 'Dashboard Starter',
    tagline: 'Panel de control con inicio de sesión, tablas, gráficas y permisos',
    desc: 'Panel de control para varias empresas, con inicio de sesión, tablas que se filtran desde el servidor, gráficas, exportación a Excel y PDF, permisos por rol y modo claro u oscuro.',
    category: 'Dashboard',
    stack: ['Next.js 16', 'Prisma', 'PostgreSQL', 'NextAuth', 'Tailwind v4', 'Recharts'],
    price: 590,
    includes: [
      'Base de datos preparada para varias empresas, con los datos de cada una aislados',
      'Inicio de sesión con correo y contraseña, o con Google y redes sociales',
      '3 niveles de permisos: administrador, editor y lector',
      'Tablas con paginación, filtros y orden por columna',
      '4 tipos de gráfica (líneas, barras, circular y de área)',
      'Exportar a Excel (CSV) y a PDF',
      'Datos de ejemplo y la base de datos ya creada'
    ],
    excludes: [
      'Proveedor de inicio de sesión propio',
      'Diseño que se aparte de la identidad del sitio',
      'Publicación en producción'
    ],
    featured: true,
  },
  {
    slug: 'ecommerce-headless',
    name: 'Headless E-commerce',
    tagline: 'Tienda online con pagos por Stripe y gestión de pedidos',
    desc: 'Tienda online donde la vitrina y el sistema de pedidos están separados: catálogo, control de stock, carrito que no se pierde al cerrar la página y pago con Stripe.',
    category: 'E-commerce',
    stack: ['Next.js 16', 'Medusa', 'Stripe', 'Tailwind v4', 'PostgreSQL'],
    price: 890,
    includes: [
      'Tienda y panel básico de administración',
      'Pago con Stripe, con avisos automáticos cuando se confirma',
      'Control de inventario',
      'Carrito que se conserva al cerrar y queda guardado en el servidor',
      'Catálogo con filtros y buscador',
      'Gestión de pedidos'
    ],
    excludes: [
      'Integración con transportadoras (UPS, FedEx, DHL)',
      'Varias monedas o varios idiomas',
      'Suscripciones periódicas',
      'Diseño a medida'
    ],
  },
];

export function getFeaturedTemplates(): Template[] {
  return TEMPLATES.filter((t) => t.featured);
}

export function getTemplateBySlug(slug: string): Template | undefined {
  return TEMPLATES.find((t) => t.slug === slug);
}