import { test, expect } from "@playwright/test";

/**
 * Tests de interacciones — flujo de usuario sobre componentes que tienen JS:
 * filtro por categoría en /productos, mobile menu en Nav, hover en cards.
 *
 * Por qué esto y no visual regression: NX-Studio es dark mode + lava/indigo,
 * la regresión visual típica es de spacing/color y se cubre mejor con revisión
 * manual + lighthouse. El valor de los tests E2E está en flujos funcionales.
 */

test.describe("/productos · filtro por categoría", () => {
  test("Todos muestra los 11 productos", async ({ page }) => {
    await page.goto("/productos/");
    await expect(page.locator("[data-project-card]")).toHaveCount(11);
    await expect(page.locator(".cat-group-hidden")).toHaveCount(0);
  });

  test("click en 'SaaS' filtra a 1 card visible + persiste en hash", async ({ page }) => {
    await page.goto("/productos/");

    // Click en chip SaaS
    await page.locator('#cat-filter [data-cat="SaaS"]').click();

    // Solo el grupo SaaS visible
    await expect(page.locator(".cat-group")).toHaveCount(1);
    await expect(page.locator(".cat-group:not(.cat-group-hidden)")).toHaveCount(1);
    await expect(page.locator("[data-project-card]:not(.cat-hidden)")).toHaveCount(1);

    // Hash de la URL actualizado
    expect(new URL(page.url()).hash).toBe("#SaaS");

    // Chip activo cambió
    await expect(page.locator('#cat-filter [data-cat="SaaS"]')).toHaveClass(/cat-chip-active/);
    await expect(page.locator('#cat-filter [data-cat="all"]')).not.toHaveClass(/cat-chip-active/);
  });

  test("click en 'Seguridad' muestra 2 cards (flag-edge + nexoaccmanager)", async ({ page }) => {
    await page.goto("/productos/");
    await page.locator('#cat-filter [data-cat="Seguridad"]').click();
    await expect(page.locator("[data-project-card]:not(.cat-hidden)")).toHaveCount(2);
  });

  test("restaurar filtro desde hash al recargar", async ({ page }) => {
    await page.goto("/productos/#IA");
    // Solo grupo IA visible
    await expect(page.locator(".cat-group-hidden")).toHaveCount(6); // 7 grupos totales, 1 visible
    await expect(page.locator(".cat-group:not(.cat-group-hidden)")).toHaveCount(1);
    // 2 cards IA: e14-fraud-detector + tic-tac-toe
    await expect(page.locator("[data-project-card]:not(.cat-hidden)")).toHaveCount(2);
  });
});

test.describe("Nav · mobile menu", () => {
  test.use({ viewport: { width: 375, height: 800 } });

  test("menu colapsado por defecto, abre al click y navega", async ({ page }) => {
    await page.goto("/");

    // Mobile menu empieza oculto
    const menu = page.locator("#mobile-menu");
    await expect(menu).toBeHidden();

    // Click toggle → visible
    await page.locator("#mobile-toggle").click();
    await expect(menu).toBeVisible();

    // Click en un link navega
    await page.locator('#mobile-menu a[href*="productos"]').click();
    await expect(page).toHaveURL(/\/productos\/?$/);

    // Después de navegar, el menú se cierra (en el handler actual NO se cierra
    // automáticamente — eso es una mejora pendiente del componente Nav).
    // Por ahora solo validamos la navegación efectiva.
    await expect(page.locator("h1")).toContainText(/productos/i);
  });
});

test.describe("Card hover", () => {
  test("hover en card cambia color del nombre del proyecto", async ({ page }) => {
    await page.goto("/productos/");

    const firstCard = page.locator("[data-project-card]").first();
    const titleLink = firstCard.locator("h3");

    // Antes del hover: color base (nx-text)
    const colorBefore = await titleLink.evaluate((el) => getComputedStyle(el).color);

    // Hover sobre la card
    await firstCard.hover();
    // Pequeña espera para que la transición CSS arranque
    await page.waitForTimeout(200);

    const colorAfter = await titleLink.evaluate((el) => getComputedStyle(el).color);

    // El color debe haber cambiado (transición de grupo)
    expect(colorAfter).not.toBe(colorBefore);
  });
});
