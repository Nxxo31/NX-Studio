import { test, expect } from "@playwright/test";

/**
 * E2E Portal Cliente (B7 · T12).
 *
 * Cobertura:
 *  - /portal/login smoke: la página renderiza con su form y CTA.
 *  - Rutas privadas del portal devuelven 302 → /portal/login cuando NO hay cookie
 *    de sesión válida (test del route guard del middleware).
 *  - Login flow redirige a /portal/login cuando se intenta acceder sin auth.
 *  - Smoke checks: componentes UI (Button/Card/Input/Field) renderizan OK en
 *    /portal/login (visible via class names en el HTML servido).
 */

const BASE = "http://127.0.0.1:4322";

test.describe("Portal Cliente · auth + guard", () => {
  test("login page renders with email/password form + magic-link form", async ({ page }) => {
    const resp = await page.goto(`${BASE}/portal/login`, { waitUntil: "domcontentloaded" });
    expect(resp?.status()).toBe(200);

    // Email + password inputs visibles (form de email+password).
    const emailInput = page.locator('[data-testid="portal-login-form"] input[name="email"]');
    await expect(emailInput).toBeVisible();
    const passwordInput = page.locator('[data-testid="portal-login-form"] input[name="password"]');
    await expect(passwordInput).toBeVisible();

    // Magic-link form también presente.
    const magicForm = page.locator('[data-testid="portal-magic-form"]');
    await expect(magicForm).toBeVisible();

    // Brand / header copy.
    await expect(page.locator("h1")).toContainText(/Inicia sesi/i);
  });

  test("UI components (Button/Input) renderizan classnames esperados en /portal/login", async ({ page }) => {
    await page.goto(`${BASE}/portal/login`, { waitUntil: "domcontentloaded" });
    // El form de login usa <Button> (lava-btn class) y <Input> (nx-input class)
    // — verificamos que las clases CSS estén en el HTML servido.
    const html = await page.content();
    expect(html).toMatch(/class="[^"]*lava-btn[^"]*"/);
    expect(html).toMatch(/class="[^"]*nx-input[^"]*"/);
    expect(html).toMatch(/class="[^"]*nx-input-label[^"]*"/);
  });

  test("/portal redirige a /portal/login sin sesión (302)", async ({ request }) => {
    const resp = await request.get(`${BASE}/portal`, { maxRedirects: 0 });
    expect(resp.status()).toBe(302);
    expect(resp.headers().location).toMatch(/\/portal\/login\?from=/);
  });

  test("/portal/proyectos devuelve 302 sin auth", async ({ request }) => {
    const resp = await request.get(`${BASE}/portal/proyectos`, { maxRedirects: 0 });
    expect(resp.status()).toBe(302);
    expect(resp.headers().location).toMatch(/\/portal\/login/);
  });

  test("/portal/mensajes devuelve 302 sin auth", async ({ request }) => {
    const resp = await request.get(`${BASE}/portal/mensajes`, { maxRedirects: 0 });
    expect(resp.status()).toBe(302);
    expect(resp.headers().location).toMatch(/\/portal\/login/);
  });

  test("/portal/perfil devuelve 302 sin auth", async ({ request }) => {
    const resp = await page_get(request, `${BASE}/portal/perfil`);
    expect(resp.status()).toBe(302);
    expect(resp.headers().location).toMatch(/\/portal\/login/);
  });

  test("/portal/licitacion/[id] devuelve 302 sin auth (route guard antes de 404)", async ({ request }) => {
    const resp = await request.get(`${BASE}/portal/licitacion/abc-123`, { maxRedirects: 0 });
    expect(resp.status()).toBe(302);
    expect(resp.headers().location).toMatch(/\/portal\/login/);
  });

  test("/portal/proyectos/[slug] devuelve 302 sin auth", async ({ request }) => {
    const resp = await request.get(`${BASE}/portal/proyectos/foo-bar`, { maxRedirects: 0 });
    expect(resp.status()).toBe(302);
    expect(resp.headers().location).toMatch(/\/portal\/login/);
  });
});

/**
 * Wrapper para evitar warnings de lint por "await" en lugares raros.
 */
async function page_get(request: any, url: string) {
  return request.get(url, { maxRedirects: 0 });
}