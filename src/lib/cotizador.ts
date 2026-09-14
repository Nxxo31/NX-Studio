// src/lib/cotizador.ts
// Lógica de cálculo compartida (cliente + servidor).
// Mismo data que src/data/pricing.ts pero expuesto en /lib para uso server-side.

export type FeatureCategory = 'core' | 'design' | 'backend' | 'growth' | 'ops';

export type Feature = {
  id: string;
  name: string;
  description: string;
  hours: number;
  rate: number;
  category: FeatureCategory;
  optional?: boolean;
};

export type EngagementShape = 'fixed' | 'retainer' | 'dedicated' | 'tm';

export type Engagement = {
  id: EngagementShape;
  name: string;
  description: string;
  baseHours: number;
  baseFee: number;
};

export type Modifier = {
  id: string;
  name: string;
  description: string;
  multiplier: number;
  appliesTo: EngagementShape[];
};

export const BASE_RATE = 75;

export const ENGAGEMENTS: Record<EngagementShape, Engagement> = {
  fixed: { id: 'fixed', name: 'Per-sprint / Fixed', description: 'Alcance definido. Ideal para MVPs y releases puntuales.', baseHours: 8, baseFee: 600 },
  retainer: { id: 'retainer', name: 'Monthly Retainer', description: 'Equipo continuo, cuota mensual predecible.', baseHours: 40, baseFee: 1200 },
  dedicated: { id: 'dedicated', name: 'Dedicated Team', description: 'Equipo exclusivo full-time.', baseHours: 160, baseFee: 2400 },
  tm: { id: 'tm', name: 'Hourly / T&M', description: 'Para OSINT, auditoría o investigación donde el alcance evoluciona.', baseHours: 0, baseFee: 200 },
};

export const FEATURES: Feature[] = [
  { id: 'discovery',     name: 'Discovery + Scoping',     description: 'Workshop inicial, modelo de datos, sitemap, arquitectura de solución', hours: 12, rate: BASE_RATE, category: 'core' },
  { id: 'design-system', name: 'Design System base',      description: 'Tokens, componentes, theming, accesibilidad WCAG 2.1 AA',         hours: 20, rate: BASE_RATE, category: 'design' },
  { id: 'responsive',    name: 'Responsive + Mobile',      description: 'Breakpoints, optimización táctil, PWA opcional',                    hours: 12, rate: BASE_RATE, category: 'design' },
  { id: 'landing',       name: 'Landing page',             description: 'Hero, secciones, CTA, copy técnico, animaciones scroll',           hours: 16, rate: BASE_RATE, category: 'design', optional: true },
  { id: 'dashboard',     name: 'Dashboard / Admin panel',  description: 'Tablas, filtros, charts, exports, roles',                          hours: 32, rate: BASE_RATE, category: 'design', optional: true },
  { id: 'auth',          name: 'Auth + Roles',             description: 'NextAuth / Clerk, OAuth, magic keys,,, RBAC',                       hours: 16, rate: BASE_RATE, category: 'backend' },
  { id: 'api',           name: 'API REST/GraphQL',         description: 'Endpoints, validación Zod, OpenAPI spec, rate limiting',             hours: 24, rate: BASE_RATE, category: 'backend' },
  { id: 'db',            name: 'Database + ORM',           description: 'Postgres + Prisma/Drizzle, migraciones, seeds, RLS opcional',       hours: 16, rate: BASE_RATE, category: 'backend' },
  { id: 'integrations',  name: 'Integraciones externas',   description: 'Stripe/Resend/Twilio/S3/OpenAI/etc.',                              hours: 12, rate: BASE_RATE, category: 'backend', optional: true },
  { id: 'osint',         name: 'OSINT (investigación)',    description: 'Personas, empresas, dominios, redes, dark web leak monitoring',      hours: 24, rate: 110,       category: 'backend', optional: true },
  { id: 'analytics',     name: 'Analytics + Métricas',     description: 'PostHog/Plausible, eventos custom, funnels',                       hours: 8,  rate: BASE_RATE, category: 'growth',  optional: true },
  { id: 'seo',           name: 'SEO técnico + OG',         description: 'Sitemap, robots, JSON-LD, hreflang, OG cards',                     hours: 8,  rate: BASE_RATE, category: 'growth' },
  { id: 'i18n',          name: 'i18n (multi-idioma)',     description: 'ES/EN + extracción de strings + hreflang',                         hours: 12, rate: BASE_RATE, category: 'growth',  optional: true },
  { id: 'testing',       name: 'Testing (unit + e2e)',     description: 'Vitest/Playwright, CI gate, coverage report',                     hours: 16, rate: BASE_RATE, category: 'ops' },
  { id: 'a11y',          name: 'Auditoría a11y WCAG 2.1 AA',description: 'Lighthouse, axe-core, remediación priorizada',                    hours: 12, rate: BASE_RATE, category: 'ops',     optional: true },
  { id: 'security',      name: 'Pen-testing básico',        description: 'OWASP top10, dependency audit, headers CSP',                      hours: 8,  rate: BASE_RATE, category: 'ops',     optional: true },
  { id: 'deploy',        name: 'Deploy + CI/CD',            description: 'Vercel/GH Pages, GitHub Actions, environments, dominio custom',    hours: 8,  rate: BASE_RATE, category: 'ops' },
  { id: 'docs',          name: 'Docs técnicas',             description: 'README, AGENTS.md, runbooks, onboarding 30min',                   hours: 6,  rate: BASE_RATE, category: 'ops' },
];

export const MODIFIERS: Modifier[] = [
  { id: 'rush',     name: 'Rush (+25%)',                  description: 'Entrega en menos de 2 semanas o trabajo en fines de semana', multiplier: 1.25, appliesTo: ['fixed'] },
  { id: 'bundle',   name: 'Bundle discount (-10%)',       description: 'Más de 80 horas seleccionadas',                                multiplier: 0.90, appliesTo: ['fixed', 'tm'] },
  { id: 'longterm', name: 'Compromiso anual (-15%)',      description: 'Retainer o o dedicated con contrato ≥ 12 meses',                  multiplier: 0.85, appliesTo: ['retainer', 'dedicated'] },
];

export type QuoteInput = {
  shape: EngagementShape;
  featureIds: string[];
  modifierIds: string[];
};

export type QuoteBreakdown = {
  shape: Engagement;
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
  const shape = ENGAGEMENTS[input.shape];
  const features = input.featureIds
    .map((id) => FEATURES.find((f) => f.id === id))
    .filter((f): f is Feature => Boolean(f));

  const subtotalFeatures = features.reduce((acc, f) => acc + f.hours * f.rate, 0);
  const baseFee = shape.baseFee;

  const applicableModifiers = MODIFIERS.filter(
    (m) => m.appliesTo.includes(input.shape) && input.modifierIds.includes(m.id)
  );
  const totalMultiplier = applicableModifiers.reduce((acc, m) => acc * m.multiplier, 1);

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

export const FEATURE_INDEX: Record<string, Feature> = FEATURES.reduce((acc, f) => {
  acc[f.id] = f;
  return acc;
}, {} as Record<string, Feature>);