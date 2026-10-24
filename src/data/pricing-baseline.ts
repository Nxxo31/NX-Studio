// Research de mercado 2025-2026 — base para cotizar: nacional + internacional.
// Fuentes (consultadas 2026-10-23):
//  COLOMBIA: Syncra, MatuByte, Izaweb, ELSASTO, Plataforment, Vytra, GoDaddy LATAM, Alejandro Libreros
//  INTERNACIONAL: Clutch, Ptolemay, Startup House (CEE/UE/US), ProdGrade, NearYou benchmarks
// Rangos de MERCADO (qué cobra el mercado) — el cotizador calcula el precio del
// proyecto exacto con el pricing engine por features; estos son la referencia.

export type PresetLocale = 'es' | 'en' | 'pt';

export type Preset = {
  id: string;
  label: Record<PresetLocale, string>;
  shape: 'fixed' | 'retainer' | 'dedicated' | 'tm';
  /** ids de FEATURES del pricing engine que el preset pre-selecciona */
  features: string[];
  /** rango de mercado Colombia en COP */
  cop: [number, number];
  /** rango de mercado internacional en USD */
  usd: [number, number];
  /** plazo típico en semanas */
  weeks: [number, number];
};

export const PRESETS: Preset[] = [
  {
    id: 'landing',
    label: { es: 'Landing page', en: 'Landing page', pt: 'Landing page' },
    shape: 'fixed',
    features: ['landing', 'responsive', 'seo', 'deploy', 'docs'],
    cop: [500_000, 1_500_000],
    usd: [1_500, 8_000],
    weeks: [1, 3],
  },
  {
    id: 'corporativo',
    label: { es: 'Sitio corporativo + blog', en: 'Corporate site + blog', pt: 'Site corporativo + blog' },
    shape: 'fixed',
    features: ['landing', 'design-system', 'responsive', 'i18n', 'seo', 'analytics', 'deploy', 'docs'],
    cop: [1_200_000, 3_000_000],
    usd: [2_500, 12_000],
    weeks: [3, 6],
  },
  {
    id: 'ecommerce',
    label: { es: 'E-commerce / tienda online', en: 'E-commerce', pt: 'E-commerce' },
    shape: 'fixed',
    features: ['landing', 'design-system', 'responsive', 'auth', 'api', 'db', 'integrations', 'analytics', 'seo', 'testing', 'deploy', 'docs'],
    cop: [2_500_000, 20_000_000],
    usd: [5_000, 60_000],
    weeks: [6, 16],
  },
  {
    id: 'webapp',
    label: { es: 'Web app / SaaS', en: 'Web app / SaaS', pt: 'Web app / SaaS' },
    shape: 'fixed',
    features: ['discovery', 'design-system', 'dashboard', 'responsive', 'auth', 'api', 'db', 'integrations', 'analytics', 'testing', 'deploy', 'docs'],
    cop: [10_000_000, 50_000_000],
    usd: [15_000, 100_000],
    weeks: [8, 24],
  },
  {
    id: 'mobile',
    label: { es: 'App móvil (iOS + Android)', en: 'Mobile app', pt: 'App móvel' },
    shape: 'fixed',
    features: ['discovery', 'design-system', 'auth', 'api', 'db', 'integrations', 'testing', 'deploy', 'docs'],
    cop: [4_000_000, 40_000_000],
    usd: [10_000, 80_000],
    weeks: [8, 20],
  },
  {
    id: 'ia',
    label: { es: 'IA / Chatbot / Automatización', en: 'AI / Chatbot / Automation', pt: 'IA / Chatbot / Automação' },
    shape: 'fixed',
    features: ['discovery', 'design-system', 'api', 'db', 'integrations', 'testing', 'deploy', 'docs'],
    cop: [2_000_000, 15_000_000],
    usd: [5_000, 40_000],
    weeks: [4, 12],
  },
  {
    id: 'qa',
    label: { es: 'Testing & QA (retainer)', en: 'Testing & QA (retainer)', pt: 'Testing & QA (retainer)' },
    shape: 'retainer',
    features: ['testing', 'a11y', 'security'],
    cop: [1_500_000, 8_000_000],
    usd: [2_000, 12_000],
    weeks: [4, 12],
  },
];

/** Datos de mercado para mostrar junto a la cotización. */
export const MARKET = {
  /** Tarifas por hora en Colombia (COP). */
  hourlyCo: [
    { level: 'Junior', cop: [30_000, 50_000] as [number, number] },
    { level: 'Mid', cop: [60_000, 100_000] as [number, number] },
    { level: 'Senior', cop: [100_000, 150_000] as [number, number] },
    { level: 'Senior+ / Lead', cop: [150_000, 240_000] as [number, number] },
  ],
  /** Tarifas por hora internacionales. */
  hourlyIntl: [
    { region: 'US freelance', range: '$50–300 USD/h' },
    { region: 'US agencia', range: '$150–350 USD/h' },
    { region: 'Europa occidental', range: '€40–250/h' },
    { region: 'Europa del este', range: '$25–120 USD/h' },
    { region: 'LatAm nearshore', range: '$30–85 USD/h' },
  ],
  /** Piso mínimo: NINGÚN proyecto es gratis — hasta un blog tiene costo de
   *  diseño, desarrollo, dominio y hosting (research Colombia 2025-2026). */
  floorCop: 500_000,
  floorUsd: 150,
  /** Mantenimiento anual recomendado como % del valor del desarrollo. */
  maintenancePct: [15, 25] as [number, number],
};

export function formatCop(n: number): string {
  if (typeof Intl !== 'undefined') {
    try {
      return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
    } catch { /* fall through */ }
  }
  return `$${n.toLocaleString('en-US')} COP`;
}

export function formatUsd(n: number): string {
  return `$${n.toLocaleString('en-US')}`;
}
