import { describe, it, expect } from 'vitest';
import {
  categoryToKey,
  getMockupTokens,
  buildLandingMockup,
  buildDashboardMockup,
  buildEcommerceMockup,
  renderMockup,
  filterTemplates,
  toPriceBucket,
  type MockupBundle,
  type PriceBucket,
} from '../../src/lib/template-mockup';
import type { Template } from '../../src/data/templates';

// ─── Stub i18n strings (no t() in unit tests) ────────────────────────────────
const i18nNames = {
  landing: 'Landing Converter',
  landingTagline: 'Landing de alta conversión con A/B testing',
  dashboard: 'Dashboard Starter',
  dashboardTagline: 'Panel admin con auth, tablas, charts y RBAC',
  ecommerce: 'Headless E-commerce',
  ecommerceTagline: 'Storefront con Stripe + Medusa backend',
} as const;

const sampleTpl = (overrides: Partial<Template> = {}): Template => ({
  slug: 'test',
  name: 'Test',
  tagline: 'tag',
  desc: 'desc',
  category: 'Landing',
  stack: ['Next.js', 'Tailwind v4', 'Resend'],
  price: 290,
  includes: ['incluye'],
  excludes: ['no incluye'],
  featured: true,
  ...overrides,
});

describe('template-mockup · categoryToKey', () => {
  it('mapea "Landing" → "landing"', () => {
    expect(categoryToKey('Landing')).toBe('landing');
  });
  it('mapea "Dashboard" → "dashboard"', () => {
    expect(categoryToKey('Dashboard')).toBe('dashboard');
  });
  it('mapea "E-commerce" → "ecommerce"', () => {
    expect(categoryToKey('E-commerce')).toBe('ecommerce');
  });
  it('cualquier otra categoría cae a "landing" como fallback', () => {
    expect(categoryToKey('SaaS' as never)).toBe('landing');
    expect(categoryToKey('Auth' as never)).toBe('landing');
    expect(categoryToKey('Blog' as never)).toBe('landing');
  });
});

describe('template-mockup · getMockupTokens', () => {
  it('lista tokens CSS del sistema que el mockup renderer usa', () => {
    const tokens = getMockupTokens();
    expect(tokens).toContain('--nx-bg');
    expect(tokens).toContain('--nx-surface');
    expect(tokens).toContain('--nx-text');
    expect(tokens).toContain('--nx-primary');
    expect(tokens).toContain('--nx-text-on-primary');
    expect(tokens).toContain('--nx-text-muted');
    expect(tokens).toContain('--nx-border');
    // Tokens suficientes para diseñar ≥3 paletas temáticas.
    expect(tokens.length).toBeGreaterThanOrEqual(8);
  });

  it('todos los tokens son nombres válidos (empiezan con --nx-)', () => {
    const tokens = getMockupTokens();
    for (const t of tokens) {
      expect(t).toMatch(/^--nx-/);
    }
  });
});

describe('template-mockup · buildLandingMockup', () => {
  it('devuelve bundle con name + tagline + 1 hero + 1 CTA + 3 features', () => {
    const m = buildLandingMockup({
      name: i18nNames.landing,
      tagline: i18nNames.landingTagline,
      stack: sampleTpl().stack,
    });
    expect(m.kind).toBe('landing');
    expect(m.name).toBe(i18nNames.landing);
    expect(m.tagline).toBe(i18nNames.landingTagline);
    expect(m.hero).toBeTruthy();
    expect(m.cta).toBeTruthy();
    expect(m.features).toHaveLength(3);
  });

  it('cada feature tiene título + descripción derivados del stack', () => {
    const m = buildLandingMockup({
      name: 'X',
      tagline: 'Y',
      stack: ['Astro', 'Tailwind', 'Framer'],
    });
    expect(m.features[0].title).toBeTruthy();
    expect(m.features[0].desc).toBeTruthy();
  });
});

describe('template-mockup · buildDashboardMockup', () => {
  it('devuelve bundle con sidebar + 3 stat cards + 1 tabla ≥4 filas', () => {
    const m = buildDashboardMockup({
      name: i18nNames.dashboard,
      tagline: i18nNames.dashboardTagline,
    });
    expect(m.kind).toBe('dashboard');
    expect(m.sidebar).toBeTruthy();
    expect(m.stats).toHaveLength(3);
    expect(m.table).toBeTruthy();
    expect(m.table.rows.length).toBeGreaterThanOrEqual(4);
  });

  it('cada stat tiene label + value + trend', () => {
    const m = buildDashboardMockup({ name: 'X', tagline: 'Y' });
    for (const s of m.stats) {
      expect(s.label).toBeTruthy();
      expect(s.value).toBeTruthy();
      expect(s.trend).toBeTruthy();
    }
  });
});

describe('template-mockup · buildEcommerceMockup', () => {
  it('devuelve bundle con product grid (≥4 productos) + cart summary', () => {
    const m = buildEcommerceMockup({
      name: i18nNames.ecommerce,
      tagline: i18nNames.ecommerceTagline,
    });
    expect(m.kind).toBe('ecommerce');
    expect(m.products.length).toBeGreaterThanOrEqual(4);
    expect(m.cart).toBeTruthy();
    expect(m.cart.count).toBeGreaterThanOrEqual(1);
    expect(m.cart.total).toBeTruthy();
  });

  it('cada producto tiene name + price + image placeholder', () => {
    const m = buildEcommerceMockup({ name: 'X', tagline: 'Y' });
    for (const p of m.products) {
      expect(p.name).toBeTruthy();
      expect(p.price).toBeTruthy();
      expect(p.hasImagePlaceholder).toBe(true);
    }
  });
});

describe('template-mockup · renderMockup', () => {
  const tpl = sampleTpl({ slug: 'landing-converter', category: 'Landing' });
  const strings = {
    name: i18nNames.landing,
    tagline: i18nNames.landingTagline,
    price: '$290',
    viewDemo: 'View demo',
    buy: 'Buy',
    stack: 'Stack',
    license: 'MIT',
    lastUpdated: 'Updated',
  };

  it('renderiza un mockup Landing con HTML válido (incluye tokens CSS)', () => {
    const html = renderMockup(tpl, strings);
    expect(html).toContain('<');
    expect(html).toContain('var(--nx-');
    // Landing tiene "hero" + "CTA" + "features" → strings propias.
    expect(html.length).toBeGreaterThan(200);
  });

  it('renderiza un mockup Dashboard con sidebar + stats + tabla', () => {
    const html = renderMockup(
      { ...tpl, category: 'Dashboard' },
      { ...strings, name: i18nNames.dashboard, tagline: i18nNames.dashboardTagline },
    );
    expect(html).toContain('var(--nx-');
    expect(html).toContain('></span>'); // dashboard variants
  });

  it('renderiza un mockup Ecommerce con product grid + cart', () => {
    const html = renderMockup(
      { ...tpl, category: 'E-commerce' },
      { ...strings, name: i18nNames.ecommerce, tagline: i18nNames.ecommerceTagline },
    );
    expect(html).toContain('var(--nx-');
    expect(html).toContain('+'); // add-to-cart button
  });

  it('NO incluye imágenes externas (todo HTML/CSS inline)', () => {
    const html = renderMockup(tpl, strings);
    expect(html).not.toMatch(/<img\s/);
    expect(html).not.toMatch(/url\(['"]?https?:/); // no background-image URLs externas
    expect(html).not.toMatch(/<svg/); // SVG está OK pero este renderer usa solo HTML
  });

  it('bundle respeta el contrato: hero/stats/products por kind', () => {
    const landingBundle: MockupBundle = renderMockup(tpl, strings, true) as MockupBundle;
    expect(landingBundle.kind).toBe('landing');
    if (landingBundle.kind === 'landing') {
      expect(landingBundle.hero).toBeTruthy();
      expect(landingBundle.features).toHaveLength(3);
    }
  });

  it('bundle size es razonable (< 6KB serializado) para mantener bundle del grid ligero', () => {
    const html = renderMockup(tpl, strings);
    expect(html.length).toBeLessThan(6000);
  });
});

describe('template-mockup · filterTemplates', () => {
  const templates: Template[] = [
    sampleTpl({ slug: 'a', category: 'Landing', price: 0, name: 'Landing Free' }),
    sampleTpl({ slug: 'b', category: 'Landing', price: 290, name: 'Landing Pro' }),
    sampleTpl({ slug: 'c', category: 'Dashboard', price: 590, name: 'Dash Pro' }),
    sampleTpl({ slug: 'd', category: 'E-commerce', price: 890, name: 'Shop Pro' }),
    sampleTpl({ slug: 'saas', category: 'SaaS' as never, price: 1000, name: 'SaaS Thing' }),
  ];

  it('category: "all" devuelve todos los templates', () => {
    expect(filterTemplates(templates, { category: 'all' }).length).toBe(5);
  });

  it('category: "landing" filtra por Landing', () => {
    const r = filterTemplates(templates, { category: 'landing' });
    expect(r.map((t) => t.slug)).toEqual(['a', 'b']);
  });

  it('category: "dashboard" filtra por Dashboard', () => {
    const r = filterTemplates(templates, { category: 'dashboard' });
    expect(r.map((t) => t.slug)).toEqual(['c']);
  });

  it('category: "ecommerce" filtra por E-commerce', () => {
    const r = filterTemplates(templates, { category: 'ecommerce' });
    expect(r.map((t) => t.slug)).toEqual(['d']);
  });

  it('price: "free" devuelve solo los de price=0', () => {
    const r = filterTemplates(templates, { price: 'free' });
    expect(r.map((t) => t.slug)).toEqual(['a']);
  });

  it('price: "$" devuelve los de price < 500', () => {
    const r = filterTemplates(templates, { price: '$' });
    expect(r.map((t) => t.slug)).toEqual(['b']);
  });

  it('price: "$$" devuelve los de price >= 500', () => {
    const r = filterTemplates(templates, { price: '$$' });
    expect(r.map((t) => t.slug)).toEqual(['c', 'd', 'saas']);
  });

  it('search: filtra por nombre case-insensitive (también tagline)', () => {
    expect(filterTemplates(templates, { search: 'pro' }).map((t) => t.slug)).toEqual(['b', 'c', 'd']);
    expect(filterTemplates(templates, { search: 'LANDING' }).map((t) => t.slug)).toEqual(['a', 'b']);
  });

  it('combina filtros (category + price)', () => {
    const r = filterTemplates(templates, { category: 'landing', price: 'free' });
    expect(r.map((t) => t.slug)).toEqual(['a']);
  });

  it('combina filtros (category + price + search)', () => {
    const r = filterTemplates(templates, {
      category: 'dashboard',
      price: '$$',
      search: 'pro',
    });
    expect(r.map((t) => t.slug)).toEqual(['c']);
  });

  it('search sin resultados devuelve array vacío', () => {
    expect(filterTemplates(templates, { search: 'xyz-123' })).toEqual([]);
  });
});

describe('template-mockup · toPriceBucket', () => {
  it('price=0 → "free"', () => {
    expect(toPriceBucket(0)).toBe('free');
  });
  it('price<500 → "$"', () => {
    expect(toPriceBucket(290)).toBe('$');
    expect(toPriceBucket(499)).toBe('$');
  });
  it('price>=500 → "$$"', () => {
    expect(toPriceBucket(500)).toBe('$$');
    expect(toPriceBucket(890)).toBe('$$');
  });
  it('rechaza buckets desconocidos', () => {
    // @ts-expect-error — verificamos que se valida en runtime
    expect(() => toPriceBucket('free')).toThrow();
  });
});
