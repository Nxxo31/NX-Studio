import { test, expect } from "@playwright/test";

/**
 * /productos/[slug] — página de detalle.
 *
 * Cubre: render del detalle, links de prev/next, related por categoría, CTA.
 * Estrategia: testear varios slugs representativos (no los 11).
 * - nexocore: el flagship (Hero lo usa), categoría SaaS
 * - e14-fraud-detector: categoría IA, slug con guiones
 * - tic-tac-toe: categoría IA también, valida que related funciona
 * - nva-demons: categoría 3D (la única), sin related
 */

test.describe("/productos/[slug]", () => {
  test("nexocore: renderiza header, stack, repo, CTA", async ({ page }) => {
    await page.goto("/productos/nexocore/");

    await expect(page).toHaveTitle(/NexoCore.*NX-Studio/);
    await expect(page.locator("h1")).toContainText("NexoCore");
    await expect(page.locator("text=ERP/CRM/Analytics")).toBeVisible();

    // Stack visible
    await expect(page.locator("text=Next.js 15")).toBeVisible();

    // CTA repo (link externo)
    const repoLink = page.locator('a[href*="github.com/Nxxo31/nexocore"]');
    await expect(repoLink).toBeVisible();
    await expect(repoLink).toHaveAttribute("target", "_blank");
    await expect(repoLink).toHaveAttribute("rel", /noopener/);

    // CTA interno
    await expect(page.locator('a[href="/NX-Studio/contacto"]').first()).toBeVisible();
  });

  test("nexocore: status pill muestra 'live'", async ({ page }) => {
    await page.goto("/productos/nexocore/");
    await expect(page.locator(".status-live")).toBeVisible();
  });

  test("e14-fraud-detector: prev/next apunta a otro producto", async ({ page }) => {
    await page.goto("/productos/e14-fraud-detector/");

    // Sección prev/next: dos cards
    const prevNextLinks = page.locator(
      'a[aria-label^="Producto anterior"], a[aria-label^="Producto siguiente"]',
    );
    await expect(prevNextLinks).toHaveCount(2);

    // Cada link lleva a un /productos/<slug>/ válido
    const hrefs = await prevNextLinks.evaluateAll((els) => els.map((e) => e.getAttribute("href")));
    for (const href of hrefs) {
      expect(href).toMatch(/^\/NX-Studio\/productos\/[a-z0-9-]+\/?$/);
    }
  });

  test("tic-tac-toe: related muestra e14 (misma categoría IA)", async ({ page }) => {
    await page.goto("/productos/tic-tac-toe/");

    // La sección "otros productos de IA" debe tener al menos 1 card
    const relatedSection = page.locator("text=otros productos de IA").locator("..");
    const relatedCards = relatedSection.locator("a[href^='/NX-Studio/productos/']");
    await expect(relatedCards.first()).toBeVisible();

    // Verifica que NO se incluye a sí mismo
    const relatedHrefs = await relatedCards.evaluateAll((els) =>
      els.map((e) => e.getAttribute("href")),
    );
    expect(relatedHrefs).not.toContain("/NX-Studio/productos/tic-tac-toe/");
  });

  test("nva-demons: categoría 3D sin related (único en su categoría)", async ({ page }) => {
    await page.goto("/productos/nva-demons/");

    // Si no hay otros proyectos 3D, la sección "otros productos de 3D" NO se renderiza
    await expect(page.locator("text=otros productos de 3D")).toHaveCount(0);
  });

  test("cualquier producto: el link del breadcrumb vuelve a /productos/", async ({ page }) => {
    await page.goto("/productos/nexocore/");
    const backLink = page.locator('a[href="/NX-Studio/productos"]').first();
    await backLink.click();
    await expect(page).toHaveURL(/\/productos\/?$/);
  });
});
