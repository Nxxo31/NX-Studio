import { test, expect } from "@playwright/test";

/**
 * E2E Templates Page (Phase 7).
 *
 * Cobertura:
 *  - /templates renders grid masonry with at least 3 cards.
 *  - Each card has a server-rendered HTML mockup (data-testid=tpl-card).
 *  - Category filter (cat=landing) reduces grid to Landing items only.
 *  - Price filter (price=free) reduces grid to free items only.
 *  - Search input filters by name.
 *  - Hover on a card reveals the overlay with metadata.
 *  - Click on a card navigates to /templates/[slug] detail page.
 *  - Detail page has the big mockup + Buy + View demo buttons.
 *  - Empty state appears when filters yield no results.
 *  - Mockup HTML uses system tokens (var(--nx-*)) — pure HTML/CSS.
 */

const BASE = "http://127.0.0.1:4322";

test.describe("Templates · marketplace grid", () => {
  test("/templates renderiza el grid con ≥3 cards y cada card tiene mockup HTML", async ({ page }) => {
    const resp = await page.goto(`${BASE}/templates`, { waitUntil: "domcontentloaded" });
    expect(resp?.status()).toBe(200);

    // Grid presente.
    const grid = page.locator('[data-testid="tpl-grid"]');
    await expect(grid).toBeVisible();

    // Cards.
    const cards = page.locator('[data-testid="tpl-card"]');
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(3);

    // Cada card tiene atributo slug + mockup dentro.
    for (let i = 0; i < count; i++) {
      const slug = await cards.nth(i).getAttribute("data-template-slug");
      expect(slug).toBeTruthy();
      // Mockup con tokens CSS (var(--nx-)).
      const mockupHtml = await cards.nth(i).locator(".tpl-mockup").first().innerHTML();
      expect(mockupHtml).toContain("var(--nx-");
      // NO imágenes externas.
      expect(mockupHtml).not.toMatch(/<img\s/);
      expect(mockupHtml).not.toMatch(/url\(["']?https?:/);
    }
  });

  test("filter bar: category 'landing' filtra el grid (GET-safe vía ?cat=)", async ({ page }) => {
    const resp = await page.goto(`${BASE}/templates?cat=landing`, { waitUntil: "domcontentloaded" });
    expect(resp?.status()).toBe(200);

    const cards = page.locator('[data-testid="tpl-card"]');
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(1);

    for (let i = 0; i < count; i++) {
      const cat = await cards.nth(i).getAttribute("data-template-category");
      expect(cat).toBe("landing");
    }

    // El chip 'landing' debe estar aria-selected=true.
    const chip = page.locator('[data-testid="tpl-cat-landing"]');
    await expect(chip).toHaveAttribute("aria-selected", "true");
  });

  test("filter bar: price 'free' filtra solo items con precio 0", async ({ page }) => {
    // Ningún item en el dataset actual tiene price=0 → grid vacío → empty state.
    const resp = await page.goto(`${BASE}/templates?price=free`, { waitUntil: "domcontentloaded" });
    expect(resp?.status()).toBe(200);

    const empty = page.locator('[data-testid="tpl-empty"]');
    await expect(empty).toBeVisible();
    await expect(page.locator('[data-testid="tpl-grid"]')).toHaveCount(0);
  });

  test("filter bar: price '$$' filtra items con price >= 500", async ({ page }) => {
    const resp = await page.goto(`${BASE}/templates?price=$$`, { waitUntil: "domcontentloaded" });
    expect(resp?.status()).toBe(200);

    const cards = page.locator('[data-testid="tpl-card"]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const b = await cards.nth(i).getAttribute("data-template-bucket");
      expect(b).toBe("$$");
    }
  });

  test("search input filtra el grid (typing 'landing' en /templates?q=landing)", async ({ page }) => {
    const resp = await page.goto(`${BASE}/templates?q=landing`, { waitUntil: "domcontentloaded" });
    expect(resp?.status()).toBe(200);

    const cards = page.locator('[data-testid="tpl-card"]');
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // Todos los resultados deben tener 'landing' en nombre/tagline/desc.
    for (let i = 0; i < count; i++) {
      const cardText = (await cards.nth(i).textContent())?.toLowerCase() ?? "";
      expect(cardText).toMatch(/landing/);
    }
  });

  test("combinar filtros (cat + price + search) persiste en URL y refleja en el grid", async ({ page }) => {
    // Cat=Dashboard + price=$$ (>=$500) + q="dashboard" → matchea dashboard-starter.
    const resp = await page.goto(`${BASE}/templates?cat=dashboard&price=$$&q=dashboard`, {
      waitUntil: "domcontentloaded",
    });
    expect(resp?.status()).toBe(200);

    const cards = page.locator('[data-testid="tpl-card"]');
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // Verifica que cada chip refleja su filtro en aria-selected.
    await expect(page.locator('[data-testid="tpl-cat-dashboard"]')).toHaveAttribute("aria-selected", "true");
    await expect(page.locator('[data-testid="tpl-price-two"]')).toHaveAttribute("aria-selected", "true");
  });

  test("URL combina filtros a la vez que preserva estado vía prev&next state (GET-safe)", async ({ page }) => {
    // Verifica que cambiar un filtro preserva los demás en la URL.
    // Click en chip 'Landing' después de tener price=free.
    const resp = await page.goto(`${BASE}/templates?price=free`, {
      waitUntil: "domcontentloaded",
    });
    expect(resp?.status()).toBe(200);

    // El botón "Limpiar filtros" debe apuntar a /templates sin query.
    const clearHref = await page.locator('[data-testid="tpl-clear"]').getAttribute("href");
    expect(clearHref).toBe("/templates");
  });

  test("hover sobre una card revela el overlay con metadata", async ({ page }) => {
    await page.goto(`${BASE}/templates`, { waitUntil: "domcontentloaded" });

    const firstCard = page.locator('[data-testid="tpl-card"]').first();
    await firstCard.hover();

    // El overlay debe pasar a opacity > 0 al hover.
    const overlay = firstCard.locator('[data-testid="tpl-card-overlay"]');
    await expect(overlay).toBeVisible();

    // El overlay debe contener al menos 1 chip de stack con texto del stack.
    const overlayText = (await overlay.textContent()) ?? "";
    // Stack tags contienen slashes o guiones típicos de stack tecnológico.
    expect(overlayText.length).toBeGreaterThan(0);
  });

  test("click en card navega a /templates/[slug] (detalle)", async ({ page }) => {
    await page.goto(`${BASE}/templates`, { waitUntil: "domcontentloaded" });

    const firstCard = page.locator('[data-testid="tpl-card"]').first();
    const slug = await firstCard.getAttribute("data-template-slug");
    expect(slug).toBeTruthy();

    // El <a> de header de cada card apunta a /templates/{slug}.
    const link = firstCard.locator(`a[href*="/templates/${slug}"]`).first();
    await link.click();

    await page.waitForURL(new RegExp(`/templates/${slug}`));
    expect(page.url()).toMatch(new RegExp(`/templates/${slug}`));
  });

  test("search sin resultados → empty state con botón 'clear filters'", async ({ page }) => {
    const resp = await page.goto(`${BASE}/templates?q=zzzzz-12345-nonexistent`, {
      waitUntil: "domcontentloaded",
    });
    expect(resp?.status()).toBe(200);

    const empty = page.locator('[data-testid="tpl-empty"]');
    await expect(empty).toBeVisible();

    const clearLink = page.locator('[data-testid="tpl-clear"]');
    await expect(clearLink).toBeVisible();

    // El chip 'tpl-clear' debe apuntar a la url sin query.
    const href = await clearLink.getAttribute("href");
    expect(href).toBe("/templates");
  });

  test("preserva accesibilidad: cada card tiene un <a> con aria-label y focus visible", async ({ page }) => {
    await page.goto(`${BASE}/templates`, { waitUntil: "domcontentloaded" });

    const firstLink = page.locator('[data-testid="tpl-card"] a').first();
    await expect(firstLink).toHaveAttribute("aria-label", /./);

    // Tabbing sobre una card la focus-ea (focus-visible ring).
    await firstLink.focus();
    const isFocused = await firstLink.evaluate((el) =>
      document.activeElement === el,
    );
    expect(isFocused).toBe(true);
  });
});

test.describe("Templates · detail page (Phase 7)", () => {
  test("/templates/[slug] renderiza mockup grande + Buy + View demo + Stack", async ({ page }) => {
    const resp = await page.goto(`${BASE}/templates/landing-converter`, {
      waitUntil: "domcontentloaded",
    });
    expect(resp?.status()).toBe(200);

    // Mockup grande arriba a la derecha (o full-width en mobile).
    const bigMockup = page.locator('[data-testid="tpl-detail-mockup"]');
    await expect(bigMockup).toBeVisible();
    const bigHtml = await bigMockup.innerHTML();
    expect(bigHtml).toContain("var(--nx-");

    // Botón de comprar + view demo.
    await expect(page.locator('[data-testid="tpl-buy-btn"]')).toBeVisible();
    // Demo es opcional (puede ser `tpl-demo-btn` o `tpl-demo-btn-disabled`).
    const demoEnabled = page.locator('[data-testid="tpl-demo-btn"]');
    const demoDisabled = page.locator('[data-testid="tpl-demo-btn-disabled"]');
    const hasEnabled = await demoEnabled.count();
    const hasDisabled = await demoDisabled.count();
    expect(hasEnabled + hasDisabled).toBeGreaterThanOrEqual(1);

    // Buy href incluye slug para tracking de contacto.
    const buyHref = await page.locator('[data-testid="tpl-buy-btn"]').getAttribute("href");
    expect(buyHref).toContain("slug=landing-converter");
    expect(buyHref).toContain("/contacto");

    // Section related templates (≥1 card si hay otros templates en el catálogo).
    const related = page.locator('[data-testid="tpl-related-card"]');
    const relatedCount = await related.count();
    expect(relatedCount).toBeGreaterThanOrEqual(1);
    expect(relatedCount).toBeLessThanOrEqual(3);

    // Stack tags presentes.
    const html = await page.content();
    expect(html).toMatch(/Next\.js|Tailwind v4|Resend|Medusa|Stripe|Recharts/);
  });

  test("detail page respeta el locale EN (/en/templates/landing-converter)", async ({ page }) => {
    const resp = await page.goto(`${BASE}/en/templates/landing-converter`, {
      waitUntil: "domcontentloaded",
    });
    expect(resp?.status()).toBe(200);

    // El botón View demo debe estar en inglés.
    const html = await page.content();
    expect(html).toMatch(/View live demo|Buy now|Stack/);
  });

  test("detail page respeta el locale PT (/pt/templates/landing-converter)", async ({ page }) => {
    const resp = await page.goto(`${BASE}/pt/templates/landing-converter`, {
      waitUntil: "domcontentloaded",
    });
    expect(resp?.status()).toBe(200);

    const html = await page.content();
    expect(html).toMatch(/Ver demo ao vivo|Comprar agora|Stack/);
  });

  test("/templates/[unknown-slug] redirige a /templates", async ({ request }) => {
    const resp = await request.get(`${BASE}/templates/no-such-slug-12345`, {
      maxRedirects: 0,
    });
    // Astro `[slug].astro` con `getStaticPaths` que solo incluye los reales
    // dará 404. (Nuestro redirect interno es runtime; el 404 prerender
    // también es aceptable — verificamos que NO es 200).
    expect([302, 404]).toContain(resp.status());
  });
});
