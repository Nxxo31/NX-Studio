-- Seed: templates del marketplace
-- Generado automáticamente. No editar a mano.

INSERT INTO template (id, slug, nombre, descripcion_corta, descripcion_larga, precio_usd, categoria, stack, incluye, no_incluye, tiempo_entrega_dias, destacado, created_at, updated_at) VALUES (
  '61580d02-a4e0-48a5-a955-a85d819fa0e9',
  'landing-converter',
  'Landing Converter',
  'Landing de alta conversión con A/B testing integrado',
  'Landing page con hero animado, secciones modulares, copy técnico, integraciones con Resend y Plausible, A/B testing nativo, OG cards dinámicas.',
  290,
  'landing',
  '["Next.js 16","Tailwind v4","Resend","Plausible","Framer Motion"]',
  '["Código fuente completo MIT-licensed","Setup en Vercel guiado paso a paso","A/B testing nativo (2 variants baked)","Plausible analytics preconfigurado","Resend integration (3 templates de email)","Documentación + video walkthrough 20min"]',
  '["Diseño custom (la plantilla conserva su identidad propia)","Copywriting","Hosting mensual (Vercel free tier OK)","Soporte post-compra"]',
  3,
  1,
  unixepoch('subsec') * 1000,
  unixepoch('subsec') * 1000
)
ON CONFLICT(slug) DO UPDATE SET
  nombre=excluded.nombre,
  descripcion_corta=excluded.descripcion_corta,
  descripcion_larga=excluded.descripcion_larga,
  precio_usd=excluded.precio_usd,
  categoria=excluded.categoria,
  stack=excluded.stack,
  incluye=excluded.incluye,
  no_incluye=excluded.no_incluye,
  tiempo_entrega_dias=excluded.tiempo_entrega_dias,
  destacado=excluded.destacado,
  updated_at=unixepoch('subsec') * 1000;

INSERT INTO template (id, slug, nombre, descripcion_corta, descripcion_larga, precio_usd, categoria, stack, incluye, no_incluye, tiempo_entrega_dias, destacado, created_at, updated_at) VALUES (
  'd97b317c-b274-4f72-846a-7ee497ecfd2e',
  'dashboard-starter',
  'Dashboard Starter',
  'Panel admin con auth, tablas, charts y RBAC',
  'Dashboard multi-tenant con autenticación, tablas con filtros server-side, charts (Recharts), exports CSV/PDF, RBAC, dark/light mode.',
  590,
  'dashboard',
  '["Next.js 16","Prisma","PostgreSQL","NextAuth","Tailwind v4","Recharts"]',
  '["Multi-tenant schema + RLS","NextAuth (credentials + OAuth)","RBAC con 3 roles (admin/editor/viewer)","Tablas con paginación + filtros + sorts","4 tipos de charts (line/bar/pie/area)","Exports CSV + PDF","Seed script + DB migrations"]',
  '["Auth provider custom","Diseño fuera de la identidad del sitio","Deployment"]',
  5,
  1,
  unixepoch('subsec') * 1000,
  unixepoch('subsec') * 1000
)
ON CONFLICT(slug) DO UPDATE SET
  nombre=excluded.nombre,
  descripcion_corta=excluded.descripcion_corta,
  descripcion_larga=excluded.descripcion_larga,
  precio_usd=excluded.precio_usd,
  categoria=excluded.categoria,
  stack=excluded.stack,
  incluye=excluded.incluye,
  no_incluye=excluded.no_incluye,
  tiempo_entrega_dias=excluded.tiempo_entrega_dias,
  destacado=excluded.destacado,
  updated_at=unixepoch('subsec') * 1000;

INSERT INTO template (id, slug, nombre, descripcion_corta, descripcion_larga, precio_usd, categoria, stack, incluye, no_incluye, tiempo_entrega_dias, destacado, created_at, updated_at) VALUES (
  '18db2040-8b19-4cb2-a6b3-5b506e72e892',
  'ecommerce-headless',
  'Headless E-commerce',
  'Storefront con Stripe + Medusa backend',
  'E-commerce headless: storefront Next.js + backend Medusa, Stripe payments, inventory, cart persistente, checkout optimizado.',
  890,
  'ecommerce',
  '["Next.js 16","Medusa","Stripe","Tailwind v4","PostgreSQL"]',
  '["Storefront + admin panel básico","Stripe checkout + webhooks","Inventory tracking","Cart persistente (localStorage + DB)","Catálogo con filtros + búsqueda","Orders management"]',
  '["Shipping integrations (UPS/FedEx/DHL)","Multi-currency / multi-locale","Subscriptions","Diseño custom"]',
  7,
  0,
  unixepoch('subsec') * 1000,
  unixepoch('subsec') * 1000
)
ON CONFLICT(slug) DO UPDATE SET
  nombre=excluded.nombre,
  descripcion_corta=excluded.descripcion_corta,
  descripcion_larga=excluded.descripcion_larga,
  precio_usd=excluded.precio_usd,
  categoria=excluded.categoria,
  stack=excluded.stack,
  incluye=excluded.incluye,
  no_incluye=excluded.no_incluye,
  tiempo_entrega_dias=excluded.tiempo_entrega_dias,
  destacado=excluded.destacado,
  updated_at=unixepoch('subsec') * 1000;

