/**
 * Template Mockup Renderer — Phase 7.
 *
 * Server-rendered HTML/CSS grid de mockups para /templates (estilo Dribbble).
 * Cada template (Landing / Dashboard / E-commerce) muestra su layout característico
 * usando tokens CSS del sistema (--nx-bg, --nx-surface, --nx-primary, etc.).
 *
 * Reglas:
 * - 100% HTML/CSS inline, cero `<img>`, cero `<svg>`, cero URLs externas.
 * - Todo el color/spacing/typography hereda del theme activo (glass-dark / glass-light)
 *   via `var(--nx-*)` — sin re-render en theme switch.
 * - Para Dribbble-style richness: gradientes, micro-paddings, badges, chips. Mantener
 *   el bundle < 6KB serializado por card (grid de 3 columnas).
 * - Funciones puras, sin I/O, testeables directamente con vitest.
 */

import type { Template } from '../data/templates';

// ─── Tipos públicos ─────────────────────────────────────────────────────────

export type TemplateCategoryKey = 'landing' | 'dashboard' | 'ecommerce';

export type MockupStrings = {
  name: string;
  tagline: string;
  price: string;
  viewDemo: string;
  buy: string;
  stack: string;
  license: string;
  lastUpdated: string;
};

export type LandingBundle = {
  kind: 'landing';
  name: string;
  tagline: string;
  hero: { title: string; subtitle: string };
  cta: { label: string; secondaryLabel: string };
  features: Array<{ title: string; desc: string }>;
};

export type DashboardBundle = {
  kind: 'dashboard';
  name: string;
  tagline: string;
  sidebar: Array<{ label: string; active: boolean }>;
  stats: Array<{ label: string; value: string; trend: string; trendUp: boolean }>;
  table: { columns: string[]; rows: Array<{ cells: string[]; status: 'ok' | 'warn' | 'pending' }> };
};

export type EcommerceBundle = {
  kind: 'ecommerce';
  name: string;
  tagline: string;
  products: Array<{ name: string; price: string; hasImagePlaceholder: boolean }>;
  cart: { count: number; total: string };
};

export type MockupBundle = LandingBundle | DashboardBundle | EcommerceBundle;

export type PriceBucket = 'free' | '$' | '$$';

export type FilterSpec = {
  category?: 'all' | TemplateCategoryKey;
  price?: 'all' | PriceBucket;
  search?: string;
};

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Convierte categorías en el formato de src/data/templates.ts al subset
 * que tienen mockups server-rendered. SaaS/Auth/Blog caen a 'landing' como
 * fallback (la masonry siempre necesita una key para enrutar al render).
 */
export function categoryToKey(category: Template['category']): TemplateCategoryKey {
  switch (category) {
    case 'Landing': return 'landing';
    case 'Dashboard': return 'dashboard';
    case 'E-commerce': return 'ecommerce';
    // SaaS / Auth / Blog → renderizamos como Landing (los templates de
    // esas categorías son visualmente "tipo landing" en una gallery).
    default: return 'landing';
  }
}

/**
 * Lista de tokens CSS del sistema que el renderer referencia inline.
 * Garantiza que el test suite verifica que el renderer está integrado
 * con el design system y respeta el theme switch.
 */
export function getMockupTokens(): string[] {
  return [
    '--nx-bg',
    '--nx-surface',
    '--nx-raised',
    '--nx-text',
    '--nx-text-muted',
    '--nx-text-dim',
    '--nx-primary',
    '--nx-primary-soft',
    '--nx-text-on-primary',
    '--nx-border',
    '--nx-border-strong',
  ];
}

/**
 * Asigna el bucket de precio en función del valor numérico.
 *   0 → 'free', < 500 → '$', >= 500 → '$$'
 * Lanza error si recibe un bucket inválido (cast safety en runtime).
 */
export function toPriceBucket(input: number): PriceBucket {
  if (typeof input !== 'number' || Number.isNaN(input)) {
    throw new Error(`toPriceBucket: invalid input ${String(input)}`);
  }
  if (input === 0) return 'free';
  if (input < 500) return '$';
  return '$$';
}

// ─── Builders de bundle (data → estructura tipada) ──────────────────────────

const FEATURE_POOL = [
  { title: 'Velocidad brutal', desc: 'Carga < 1s, Lighthouse 95+, cero capas de más.' },
  { title: 'Seguridad real', desc: 'Auth con rates, CSRF tokens, headers hardened.' },
  { title: 'Cero basura', desc: 'Stack verificable, sin vendor lock-in ni telemetría.' },
];

export function buildLandingMockup(input: { name: string; tagline: string; stack?: string[] }): LandingBundle {
  return {
    kind: 'landing',
    name: input.name,
    tagline: input.tagline,
    hero: {
      title: input.tagline,
      subtitle: input.stack?.length
        ? `Powered by ${input.stack.slice(0, 3).join(' · ')}.`
        : 'Listo para producción.',
    },
    cta: { label: 'Empezar', secondaryLabel: 'Ver demo' },
    features: FEATURE_POOL,
  };
}

const SEED_VALUES = [4231, 318, 4.7];
const SEED_TRENDS = ['+12.4% vs LM', '+3.1% esta sem', 'meta 4.5%'];
const SEED_TABLE: Array<{ cells: string[]; status: 'ok' | 'warn' | 'pending' }> = [
  { cells: ['Ana M.', 'Pro', '$2.4k', '✓'], status: 'ok' },
  { cells: ['Beto R.', 'Enterprise', '$12k', '✓'], status: 'ok' },
  { cells: ['Cris L.', 'Starter', '$0', '⏳'], status: 'pending' },
  { cells: ['Diana P.', 'Pro', '$1.9k', '✓'], status: 'ok' },
  { cells: ['Eli V.', 'Pro', '$3.1k', '!'], status: 'warn' },
];

export function buildDashboardMockup(input: { name: string; tagline: string }): DashboardBundle {
  return {
    kind: 'dashboard',
    name: input.name,
    tagline: input.tagline,
    sidebar: [
      { label: 'Inicio', active: true },
      { label: 'Reportes', active: false },
      { label: 'Proyectos', active: false },
      { label: 'Ajustes', active: false },
    ],
    stats: [
      { label: 'Ingresos · mes', value: `$${SEED_VALUES[0].toLocaleString()}`, trend: SEED_TRENDS[0], trendUp: true },
      { label: 'Usuarios activos', value: SEED_VALUES[1].toLocaleString(), trend: SEED_TRENDS[1], trendUp: true },
      { label: 'Conversión', value: `${SEED_VALUES[2]}%`, trend: SEED_TRENDS[2], trendUp: false },
    ],
    table: { columns: ['Usuario', 'Plan', 'MRR', 'OK'], rows: SEED_TABLE },
  };
}

const PRODUCT_POOL = [
  { name: 'Camisa brutal', price: '$48' },
  { name: 'Mochila lava', price: '$129' },
  { name: 'Polera 100%', price: '$55' },
  { name: 'Botella NX', price: '$32' },
  { name: 'Cuaderno A5', price: '$18' },
  { name: 'Sticker pack', price: '$8' },
];

export function buildEcommerceMockup(input: { name: string; tagline: string }): EcommerceBundle {
  const products = PRODUCT_POOL.slice(0, 4).map((p) => ({ ...p, hasImagePlaceholder: true as const }));
  const total = products
    .slice(0, 2)
    .reduce((sum, p) => sum + Number(p.price.replace(/[^0-9.]/g, '')), 0);
  return {
    kind: 'ecommerce',
    name: input.name,
    tagline: input.tagline,
    products,
    cart: { count: 2, total: `$${total}` },
  };
}

// ─── Renderers HTML (bundle → string) ───────────────────────────────────────
//
// Todos usan inline `style="...var(--nx-...)..."`. Sin <img>, sin <svg>,
// sin URL externas. Layouts tipo Dribbble: gradientes, badges, micro-paddings.

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const ROOT_TOKENS = [
  '--nx-bg',
  '--nx-surface',
  '--nx-raised',
  '--nx-text',
  '--nx-text-muted',
  '--nx-text-dim',
  '--nx-primary',
  '--nx-primary-soft',
  '--nx-text-on-primary',
  '--nx-border',
  '--nx-border-strong',
];

function buildStyleVars(): string {
  return ROOT_TOKENS.map((t) => `${t}: var(${t});`).join(' ');
}

/**
 * Asegura que el HTML resultante tenga un width uniforme. Devuelve el root
 * inline-style base para todos los mockups.
 */
function rootStyle(extra = ''): string {
  return [
    `all: 'unset'`,
    'display: block',
    'width: 100%',
    'height: 100%',
    `font-family: var(--font-mono, ui-monospace, monospace)`,
    'color: var(--nx-text)',
    'background: var(--nx-bg)',
    'overflow: hidden',
    'border-radius: 10px',
    'border: 1px solid var(--nx-border)',
    'box-sizing: border-box',
    extra,
  ]
    .filter(Boolean)
    .map((d) => d.replace(/^'|'$/g, ''))
    .join('; ');
}

function renderLandingHtml(b: LandingBundle, s: MockupStrings): string {
  return [
    `<div class="tpl-mockup tpl-mockup-landing" role="img" aria-label="${esc(b.name)} ${esc(s.stack)} preview" data-template-slug-preview="landing" style="${rootStyle()}">`,
    // Topbar
    `<div style="display:flex;align-items:center;gap:8px;padding:10px 14px;border-bottom:1px solid var(--nx-border);background:var(--nx-surface);">`,
    `<span style="width:9px;height:9px;border-radius:50%;background:var(--nx-primary);"></span>`,
    `<span style="font-size:11px;letter-spacing:0.18em;color:var(--nx-text-muted);">${esc(b.name.toUpperCase())}</span>`,
    `<span style="margin-left:auto;font-size:10px;color:var(--nx-text-dim);">// landing.${esc(b.kind)}</span>`,
    `</div>`,
    // Hero
    `<div style="padding:18px 16px;background:linear-gradient(135deg,var(--nx-primary) 0%,var(--nx-primary-soft) 100%);color:var(--nx-text-on-primary);">`,
    `<div style="font-size:10px;letter-spacing:0.2em;opacity:0.7;">// HERO</div>`,
    `<div style="font-size:18px;font-weight:800;line-height:1.2;margin:6px 0 8px;">${esc(b.hero.title)}</div>`,
    `<div style="font-size:11px;opacity:0.85;line-height:1.5;">${esc(b.hero.subtitle)}</div>`,
    `<div style="display:flex;gap:8px;margin-top:14px;">`,
    `<span style="display:inline-flex;align-items:center;padding:7px 14px;background:var(--nx-text-on-primary);color:var(--nx-primary);font-size:11px;font-weight:700;letter-spacing:0.1em;border-radius:5px;">${esc(b.cta.label.toUpperCase())}</span>`,
    `<span style="display:inline-flex;align-items:center;padding:7px 14px;border:1px solid var(--nx-text-on-primary);color:var(--nx-text-on-primary);font-size:11px;font-weight:700;letter-spacing:0.1em;border-radius:5px;">${esc(b.cta.secondaryLabel.toUpperCase())}</span>`,
    `</div>`,
    `</div>`,
    // Features
    `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;padding:12px;">`,
    ...b.features.map((f, i) =>
      [
        `<div style="padding:10px;background:var(--nx-surface);border:1px solid var(--nx-border);border-radius:6px;${i === 1 ? 'border-top:3px solid var(--nx-primary);' : ''}">`,
        `<div style="font-size:9px;letter-spacing:0.15em;color:var(--nx-text-dim);">// FEATURA ${String(i + 1).padStart(2, '0')}</div>`,
        `<div style="font-size:12px;font-weight:700;color:var(--nx-text);margin:4px 0;">${esc(f.title)}</div>`,
        `<div style="font-size:10px;color:var(--nx-text-muted);line-height:1.4;">${esc(f.desc)}</div>`,
        `</div>`,
      ].join(''),
    ),
    `</div>`,
    // Footer
    `<div style="padding:8px 14px;border-top:1px solid var(--nx-border);background:var(--nx-surface);display:flex;justify-content:space-between;align-items:center;font-size:10px;color:var(--nx-text-dim);">`,
    `<span>${esc(s.license)} · ${esc(s.price)}</span>`,
    `<span>${esc(b.name)}</span>`,
    `</div>`,
    `</div>`,
  ].join('');
}

function renderDashboardHtml(b: DashboardBundle, s: MockupStrings): string {
  return [
    `<div class="tpl-mockup tpl-mockup-dashboard" role="img" aria-label="${esc(b.name)} ${esc(s.stack)} preview" data-template-slug-preview="dashboard" style="${rootStyle()}">`,
    // Topbar
    `<div style="display:flex;align-items:center;gap:8px;padding:10px 14px;border-bottom:1px solid var(--nx-border);background:var(--nx-surface);">`,
    `<span style="width:9px;height:9px;border-radius:50%;background:var(--nx-primary);"></span>`,
    `<span style="font-size:11px;letter-spacing:0.18em;color:var(--nx-text-muted);">${esc(b.name.toUpperCase())}</span>`,
    `<span style="margin-left:auto;font-size:10px;color:var(--nx-text-dim);">// ${esc(b.kind)}.v1</span>`,
    `</div>`,
    // Body
    `<div style="display:grid;grid-template-columns:96px 1fr;min-height:180px;">`,
    // Sidebar
    `<div style="background:var(--nx-surface);border-right:1px solid var(--nx-border);padding:10px 8px;display:flex;flex-direction:column;gap:4px;">`,
    ...b.sidebar.map((it) =>
      [
        `<div style="font-size:10px;padding:6px 8px;border-radius:4px;color:${it.active ? 'var(--nx-text-on-primary)' : 'var(--nx-text-muted)'};background:${it.active ? 'var(--nx-primary)' : 'transparent'};font-weight:${it.active ? '700' : '400'};letter-spacing:0.05em;">${esc(it.label)}</div>`,
      ].join(''),
    ),
    `</div>`,
    // Main
    `<div style="padding:12px;display:flex;flex-direction:column;gap:10px;">`,
    // Stats
    `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">`,
    ...b.stats.map((st, i) =>
      [
        `<div style="padding:10px;background:var(--nx-raised);border:1px solid var(--nx-border);border-radius:6px;${i === 1 ? 'box-shadow:0 0 0 1px var(--nx-primary);' : ''}">`,
        `<div style="font-size:9px;letter-spacing:0.12em;color:var(--nx-text-dim);">${esc(st.label.toUpperCase())}</div>`,
        `<div style="font-size:18px;font-weight:800;color:var(--nx-text);margin:3px 0;">${esc(st.value)}</div>`,
        `<div style="font-size:9px;color:${st.trendUp ? 'var(--nx-primary)' : 'var(--nx-text-muted)'};">${esc(st.trend)}</div>`,
        `</div>`,
      ].join(''),
    ),
    `</div>`,
    // Table
    `<div style="border:1px solid var(--nx-border);border-radius:6px;overflow:hidden;">`,
    `<div style="display:grid;grid-template-columns:2fr 1fr 1fr 0.5fr;background:var(--nx-surface);padding:7px 10px;border-bottom:1px solid var(--nx-border);">`,
    ...b.table.columns.map((c) => `<span style="font-size:9px;letter-spacing:0.12em;color:var(--nx-text-dim);">${esc(c.toUpperCase())}</span>`),
    `</div>`,
    ...b.table.rows.map((row) =>
      [
        `<div style="display:grid;grid-template-columns:2fr 1fr 1fr 0.5fr;padding:6px 10px;border-bottom:1px solid var(--nx-border);font-size:10px;color:var(--nx-text);align-items:center;">`,
        ...row.cells.map((c, ci) => {
          const isStatus = ci === 3;
          const statusColor =
            row.status === 'ok' ? 'var(--nx-primary)' :
            row.status === 'warn' ? '#fbbf24' :
            'var(--nx-text-dim)';
          return `<span style="${isStatus ? `color:${statusColor};font-weight:700;` : 'color:var(--nx-text-muted);'}">${esc(c)}</span>`;
        }),
        `</div>`,
      ].join(''),
    ),
    `</div>`,
    `</div>`,
    `</div>`,
    // Footer
    `<div style="padding:7px 14px;border-top:1px solid var(--nx-border);background:var(--nx-surface);font-size:10px;color:var(--nx-text-dim);display:flex;justify-content:space-between;">`,
    `<span>${esc(s.license)} · ${esc(b.tagline).slice(0, 30)}</span>`,
    `<span>${esc(b.name)}</span>`,
    `</div>`,
    `</div>`,
  ].join('');
}

function renderEcommerceHtml(b: EcommerceBundle, s: MockupStrings): string {
  return [
    `<div class="tpl-mockup tpl-mockup-ecommerce" role="img" aria-label="${esc(b.name)} ${esc(s.stack)} preview" data-template-slug-preview="ecommerce" style="${rootStyle()}">`,
    // Topbar
    `<div style="display:flex;align-items:center;gap:8px;padding:10px 14px;border-bottom:1px solid var(--nx-border);background:var(--nx-surface);">`,
    `<span style="width:9px;height:9px;border-radius:50%;background:var(--nx-primary);"></span>`,
    `<span style="font-size:11px;letter-spacing:0.18em;color:var(--nx-text-muted);">${esc(b.name.toUpperCase())}</span>`,
    `<span style="margin-left:auto;font-size:10px;color:var(--nx-text-dim);">// ${esc(b.kind)}.v1</span>`,
    `</div>`,
    // Search bar
    `<div style="display:flex;align-items:center;gap:8px;padding:10px 14px;border-bottom:1px solid var(--nx-border);">`,
    `<div style="flex:1;padding:6px 10px;background:var(--nx-surface);border:1px solid var(--nx-border);border-radius:5px;font-size:10px;color:var(--nx-text-dim);">buscar productos...</div>`,
    `<span style="display:inline-flex;align-items:center;gap:4px;padding:6px 10px;background:var(--nx-primary);color:var(--nx-text-on-primary);font-size:10px;font-weight:700;border-radius:5px;">CART · ${b.cart.count}</span>`,
    `</div>`,
    // Product grid
    `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;padding:10px 12px;">`,
    ...b.products.map((p) =>
      [
        `<div style="background:var(--nx-surface);border:1px solid var(--nx-border);border-radius:6px;overflow:hidden;">`,
        // Image placeholder via gradient (no <img>, no http URL).
        `<div style="aspect-ratio:1/1;background:linear-gradient(135deg,var(--nx-surface) 0%,var(--nx-raised) 100%);display:flex;align-items:center;justify-content:center;font-size:10px;color:var(--nx-text-dim);">IMG</div>`,
        `<div style="padding:6px 8px;">`,
        `<div style="font-size:10px;font-weight:700;color:var(--nx-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(p.name)}</div>`,
        `<div style="display:flex;align-items:center;justify-content:space-between;margin-top:4px;">`,
        `<span style="font-size:11px;font-weight:800;color:var(--nx-primary);">${esc(p.price)}</span>`,
        `<span style="width:20px;height:20px;display:inline-flex;align-items:center;justify-content:center;background:var(--nx-primary);color:var(--nx-text-on-primary);border-radius:4px;font-weight:800;line-height:1;">+</span>`,
        `</div>`,
        `</div>`,
        `</div>`,
      ].join(''),
    ),
    `</div>`,
    // Footer
    `<div style="padding:8px 14px;border-top:1px solid var(--nx-border);background:var(--nx-surface);display:flex;justify-content:space-between;font-size:10px;color:var(--nx-text-dim);">`,
    `<span>${esc(s.license)} · cart total: ${esc(b.cart.total)}</span>`,
    `<span>${esc(b.name)}</span>`,
    `</div>`,
    `</div>`,
  ].join('');
}

/**
 * Renderiza el mockup. Con `asBundle=true` retorna la estructura tipada
 * (para tests y para composición); con `asBundle=false` (default) retorna
 * el string HTML listo para inyectar via `set:html`.
 */
export function renderMockup(template: Template, strings: MockupStrings, asBundle?: false): string;
export function renderMockup(template: Template, strings: MockupStrings, asBundle: true): MockupBundle;
export function renderMockup(template: Template, strings: MockupStrings, asBundle = false): string | MockupBundle {
  const key = categoryToKey(template.category);
  const stack = template.stack;
  if (key === 'landing') {
    const bundle = buildLandingMockup({ name: strings.name, tagline: strings.tagline, stack });
    return asBundle ? bundle : renderLandingHtml(bundle, strings);
  }
  if (key === 'dashboard') {
    const bundle = buildDashboardMockup({ name: strings.name, tagline: strings.tagline });
    return asBundle ? bundle : renderDashboardHtml(bundle, strings);
  }
  const bundle = buildEcommerceMockup({ name: strings.name, tagline: strings.tagline });
  return asBundle ? bundle : renderEcommerceHtml(bundle, strings);
}

// ─── Filtros de la grid (data → list) ───────────────────────────────────────

// Map explícito entre key de filtro y source category. SaaS/Auth/Blog NO
// caen en 'landing' en el grid: solo aparecen cuando el filtro es 'all'.
// Esto preserva la taxonomía real del catálogo y evita que un usuario que
// filtra por Landing vea items que en verdad son SaaS.
const CATEGORY_KEY_TO_SOURCE: Record<'landing' | 'dashboard' | 'ecommerce', Template['category']> = {
  landing: 'Landing',
  dashboard: 'Dashboard',
  ecommerce: 'E-commerce',
};

/**
 * Filtra templates por categoría, bucket de precio, y search (en nombre +
 * tagline + desc). Filter vacío / 'all' → no filtra. Devuelve array nuevo.
 */
export function filterTemplates<T extends Template>(items: T[], spec: FilterSpec): T[] {
  const cat = spec.category ?? 'all';
  const price = spec.price ?? 'all';
  const search = (spec.search ?? '').trim().toLowerCase();

  return items.filter((tpl) => {
    // Categoría
    if (cat !== 'all' && tpl.category !== CATEGORY_KEY_TO_SOURCE[cat]) return false;

    // Precio (price=0 cae a 'free' bucket; cualquier otro a $ o $$)
    if (price !== 'all') {
      if (price === 'free') {
        if (tpl.price !== 0) return false;
      } else {
        // '$' or '$$'
        if (tpl.price === 0) return false;
        const bucket = toPriceBucket(tpl.price);
        if (bucket !== price) return false;
      }
    }

    // Búsqueda por nombre / tagline / desc
    if (search) {
      const haystack = `${tpl.name} ${tpl.tagline} ${tpl.desc}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }

    return true;
  });
}
