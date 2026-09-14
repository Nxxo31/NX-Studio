// Cotizador por features — data layer
// Patrón estructural: base fee + features seleccionables + modifiers
// Output: rango indicativo USD, no precio fijo (alineado con industria: "no publicamos precio exacto")
// Referencia de patrones: Vertex pricing engine, Toptal engagement shapes, OSINT role-based

export type FeatureCategory = 'core' | 'design' | 'backend' | 'growth' | 'ops';

export type Feature = {
  id: string;
  name: string;
  description: string;
  hours: number;
  rate: number; // USD/hora (blended rate)
  category: FeatureCategory;
  optional?: boolean;
};

export type EngagementShape = 'fixed' | 'retainer' | 'dedicated' | 'tm';

export type Modifier = {
  id: string;
  name: string;
  description: string;
  multiplier: number; // 1.25 = +25%
  appliesTo: EngagementShape[];
};

export const ENGAGEMENT_SHAPES: Record<EngagementShape, {
  id: EngagementShape;
  name: string;
  description: string;
  baseHours: number;
  baseFee: number;
}> = {
  fixed: {
    id: 'fixed',
    name: 'Per-sprint / Fixed',
    description: 'Alcance definido, precio fijo por release. Ideal para MVPs y entregables puntuales.',
    baseHours: 8,
    baseFee: 600, // kickoff + scoping
  },
  retainer: {
    id: 'retainer',
    name: 'Monthly Retainer',
    description: 'Equipo continuo, cuota mensual predecible. Para productos que shippean cada sprint.',
    baseHours: 40,
    baseFee: 1200,
  },
  dedicated: {
    id: 'dedicated',
    name: 'Dedicated Team',
    description: 'Equipo exclusivo full-time. Solo si el roadmap justifica retención anual.',
    baseHours: 160,
    baseFee: 2400,
  },
  tm: {
    id: 'tm',
    name: 'Hourly / T&M',
    description: 'Para OSINT, auditoría o investigación donde el alcance evoluciona.',
    baseHours: 0,
    baseFee: 200,
  },
};

export const BASE_RATE = 75; // USD/hora blended (LATAM-aligned)

export const FEATURES: Feature[] = [
  // Core
  { id: 'discovery',     name: 'Discovery + Scoping',     description: 'Workshop inicial, modelo de datos, sitemap, arquitectura de solución', hours: 12, rate: BASE_RATE, category: 'core' },
  { id: 'design-system', name: 'Design System base',      description: 'Tokens, componentes, theming, accesibilidad WCAG 2.1 AA',         hours: 20, rate: BASE_RATE, category: 'design' },
  { id: 'responsive',    name: 'Responsive + Mobile',      description: 'Breakpoints, optimización táctil, PWA opcional',                    hours: 12, rate: BASE_RATE, category: 'design' },
  // Frontend
  { id: 'landing',       name: 'Landing page',             description: 'Hero, secciones, CTA, copy técnico, animaciones scroll',           hours: 16, rate: BASE_RATE, category: 'design', optional: true },
  { id: 'dashboard',     name: 'Dashboard / Admin panel',  description: 'Tablas, filtros, charts, exports, roles',                          hours: 32, rate: BASE_RATE, category: 'design', optional: true },
  { id: 'auth',          name: 'Auth + Roles',             description: 'NextAuth / Clerk, OAuth, magic links, RBAC',                        hours: 16, rate: BASE_RATE, category: 'backend' },
  // Backend
  { id: 'api',           name: 'API REST/GraphQL',         description: 'Endpoints, validación Zod, OpenAPI spec, rate limiting',             hours: 24, rate: BASE_RATE, category: 'backend' },
  { id: 'db',            name: 'Database + ORM',           description: 'Postgres + Prisma/Drizzle, migraciones, seeds, RLS opcional',       hours: 16, rate: BASE_RATE, category: 'backend' },
  { id: 'integrations',  name: 'Integraciones externas',   description: 'Stripe/Resend/Twilio/S3/OpenAI/etc.',                              hours: 12, rate: BASE_RATE, category: 'backend', optional: true },
  { id: 'osint',         name: 'OSINT (investigación)',    description: 'Personas, empresas, dominios, redes, dark web leak monitoring',      hours: 24, rate: 110,       category: 'backend', optional: true },
  // Growth / ops
  { id: 'analytics',     name: 'Analytics + Métricas',     description: 'PostHog/Plausible, eventos custom, funnels',                       hours: 8,  rate: BASE_RATE, category: 'growth',  optional: true },
  { id: 'seo',           name: 'SEO técnico + OG',         description: 'Sitemap, robots, JSON-LD, hreflang, OG cards',                     hours: 8,  rate: BASE_RATE, category: 'growth' },
  { id: 'i18n',          name: 'i18n (multi-idioma)',      description: 'ES/EN + extracción de strings + hreflang',                         hours: 12, rate: BASE_RATE, category: 'growth',  optional: true },
  // QA / ops
  { id: 'testing',       name: 'Testing (unit + e2e)',     description: 'Vitest/Playwright, CI gate, coverage report',                     hours: 16, rate: BASE_RATE, category: 'ops' },
  { id: 'a11y',          name: 'Auditoría a11y WCAG 2.1 AA',description: 'Lighthouse, axe-core, remediación priorizada',                    hours: 12, rate: BASE_RATE, category: 'ops',     optional: true },
  { id: 'security',      name: 'Pen-testing básico',        description: 'OWASP top10, dependency audit, headers CSP',                      hours: 8,  rate: BASE_RATE, category: 'ops',     optional: true },
  { id: 'deploy',        name: 'Deploy + CI/CD',            description: 'Vercel/GH Pages, GitHub Actions, environments, dominio custom',    hours: 8,  rate: BASE_RATE, category: 'ops' },
  { id: 'docs',          name: 'Docs técnicas',             description: 'README, AGENTS.md, runbooks, onboarding 30min',                   hours: 6,  rate: BASE_RATE, category: 'ops' },
];

export const MODIFIERS: Modifier[] = [
  {
    id: 'rush',
    name: 'Rush (+25%)',
    description: 'Entrega en menos de 2 semanas o trabajo en fines de semana',
    multiplier: 1.25,
    appliesTo: ['fixed'],
  },
  {
    id: 'bundle',
    name: 'Bundle discount (-10%)',
    description: 'Más de 80 horas seleccionadas',
    multiplier: 0.90,
    appliesTo: ['fixed', 'tm'],
  },
  {
    id: 'longterm',
    name: 'Compromiso anual (-15%)',
    description: 'Retainer o dedicated con contrato ≥ 12 meses',
    multiplier: 0.85,
    appliesTo: ['retainer', 'dedicated'],
  },
];

export const CATEGORIES: Record<FeatureCategory, { name: string; description: string }> = {
  core:    { name: 'Core',        description: 'Imprescindibles para que el proyecto exista' },
  design:  { name: 'Diseño + UX', description: 'Visual, interacción, responsive' },
  backend: { name: 'Backend',     description: 'API, datos, auth, integraciones' },
  growth:  { name: 'Growth',      description: 'SEO, analytics, i18n' },
  ops:     { name: 'QA + Ops',    description: 'Testing, accesibilidad, deploy, docs' },
};

export type QuoteInput = {
  shape: EngagementShape;
  featureIds: string[];
  modifierIds: string[];
};

export type QuoteBreakdown = {
  shape: typeof ENGAGEMENT_SHAPES[EngagementShape];
  features: Array<{ feature: Feature; subtotal: number }>;
  modifiers: Modifier[];
  subtotalFeatures: number;
  baseFee: number;
  multiplier: number;
  totalLow: number;
  totalHigh: number;
  totalHours: number;
  bandLabel: string;
};

export function computeQuote(input: QuoteInput): QuoteBreakdown {
  const shape = ENGAGEMENT_SHAPES[input.shape];
  const features = input.featureIds
    .map((id) => FEATURES.find((f) => f.id === id))
    .filter((f): f is Feature => Boolean(f));

  const subtotalFeatures = features.reduce((acc, f) => acc + f.hours * f.rate, 0);
  const baseFee = shape.baseFee;

  const applicableModifiers = MODIFIERS.filter((m) =>
    m.appliesTo.includes(input.shape) && input.modifierIds.includes(m.id)
  );
  const totalMultiplier = applicableModifiers.reduce((acc, m) => acc * m.multiplier, 1);

  // Rango ±15% (alineado con industria: estimaciones indicativas, no exactas)
  const mid = (subtotalFeatures + baseFee) * totalMultiplier;
  const totalLow = Math.round(mid * 0.85);
  const totalHigh = Math.round(mid * 1.15);
  const totalHours = features.reduce((acc, f) => acc + f.hours, 0) + shape.baseHours;

  let bandLabel = 'USD';
  if (totalHigh >= 50000) bandLabel = 'Enterprise';
  else if (totalHigh >= 15000) bandLabel = 'Growth';
  else if (totalHigh >= 5000) bandLabel = 'Standard';
  else bandLabel = 'Starter';

  return {
    shape,
    features: features.map((f) => ({ feature: f, subtotal: f.hours * f.rate })),
    modifiers: applicableModifiers,
    subtotalFeatures,
    baseFee,
    multiplier: totalMultiplier,
    totalLow,
    totalHigh,
    totalHours,
    bandLabel,
  };
}