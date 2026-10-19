import { test, expect } from "@playwright/test";

/**
 * E2E Admin Panel (B8 · T13).
 *
 * Cobertura:
 *  - (a) /admin/* sin auth redirige (302) a /admin/login.
 *  - (b) /admin/login renderiza con form (email + password + botón).
 *  - (c) Todas las rutas privadas del admin redirigen a /admin/login
 *    cuando NO hay cookie de sesión válida (test del admin guard).
 *  - (d) Smoke checks: el form de /admin/login renderiza los inputs
 *    esperados con los atributos correctos (type=email, type=password).
 *
 * NOTA: el preview server corre con el wrangler.toml de prod que NO tiene
 * seed de usuarios admin. Por eso el test solo cubre el flujo "sin auth".
 * El flujo autenticado se cubre en vitest (tests/unit/admin-ui.test.ts)
 * con mock sessions.
 */

const BASE = "http://127.0.0.1:4322";

test.describe("Admin · guard + redirect sin auth", () => {
  // (a) + (c) — cada ruta admin redirige a /admin/login
  const adminRoutes = [
    { path: "/admin", label: "dashboard" },
    { path: "/admin/licitacion", label: "licitacion" },
    { path: "/admin/proyectos", label: "proyectos" },
    { path: "/admin/templates", label: "templates" },
    { path: "/admin/usuarios", label: "usuarios" },
    { path: "/admin/audit", label: "audit" },
    { path: "/admin/deploys", label: "deploys" },
    { path: "/admin/proyectos/nuevo", label: "proyectos-nuevo" },
    { path: "/admin/templates/nuevo", label: "templates-nuevo" },
  ];

  for (const route of adminRoutes) {
    test(`(a/c) ${route.path} sin auth devuelve 302 → /admin/login`, async ({ request }) => {
      const resp = await request.get(`${BASE}${route.path}`, { maxRedirects: 0 });
      expect(resp.status(), `GET ${route.path} sin sesión debería redirigir`).toBe(302);
      const location = resp.headers().location ?? "";
      expect(location).toMatch(/\/admin\/login\?from=/);
    });
  }

  test("(a) redirect del dashboard preserva el destino en ?from=", async ({ request }) => {
    const resp = await request.get(`${BASE}/admin`, { maxRedirects: 0 });
    expect(resp.status()).toBe(302);
    const location = resp.headers().location ?? "";
    expect(location).toContain(encodeURIComponent("/admin"));
  });
});

test.describe("Admin · login page render", () => {
  test("(b) /admin/login responde 200 y renderiza el form", async ({ page }) => {
    const resp = await page.goto(`${BASE}/admin/login`, { waitUntil: "domcontentloaded" });
    expect(resp?.status()).toBe(200);

    // El card de login existe
    await expect(page.locator("[data-admin-login]")).toBeVisible();

    // Form con action al endpoint de better-auth
    const form = page.locator("[data-login-form]");
    await expect(form).toBeVisible();
    await expect(form).toHaveAttribute("method", "POST");
    await expect(form).toHaveAttribute("action", "/api/auth/sign-in/email");
  });

  test("(d) inputs email/password renderizan con los tipos correctos", async ({ page }) => {
    await page.goto(`${BASE}/admin/login`, { waitUntil: "domcontentloaded" });

    const email = page.locator("#email");
    await expect(email).toBeVisible();
    await expect(email).toHaveAttribute("type", "email");
    await expect(email).toHaveAttribute("name", "email");
    await expect(email).toHaveAttribute("required", "");

    const password = page.locator("#password");
    await expect(password).toBeVisible();
    await expect(password).toHaveAttribute("type", "password");
    await expect(password).toHaveAttribute("name", "password");
    await expect(password).toHaveAttribute("required", "");

    // Botón submit
    const submit = page.locator("[data-login-form] button[type='submit']");
    await expect(submit).toBeVisible();
    await expect(submit).toContainText(/entrar/i);
  });

  test("(d) título y copy del login", async ({ page }) => {
    await page.goto(`${BASE}/admin/login`, { waitUntil: "domcontentloaded" });
    await expect(page).toHaveTitle(/Login.*Admin.*NX-Studio/i);
    await expect(page.locator("h1")).toContainText("NX-Studio");
    await expect(page.locator(".sub")).toContainText(/acceso al panel/i);
  });

  test("(d) /admin/login es noindex (robots meta)", async ({ page }) => {
    await page.goto(`${BASE}/admin/login`, { waitUntil: "domcontentloaded" });
    const robots = page.locator('meta[name="robots"]');
    await expect(robots).toHaveAttribute("content", /noindex/i);
  });

  test("(b) /admin/login con ?from= propaga el hidden input", async ({ page }) => {
    await page.goto(`${BASE}/admin/login?from=/admin/audit`, { waitUntil: "domcontentloaded" });
    const fromInput = page.locator('[data-login-form] input[name="from"]');
    await expect(fromInput).toHaveValue("/admin/audit");
  });
});

test.describe("Admin · logout endpoint", () => {
  test("POST /admin/logout con Origin válido devuelve 303 a /admin/login", async ({ request }) => {
    const resp = await request.fetch(`${BASE}/admin/logout`, {
      method: "POST",
      maxRedirects: 0,
      headers: { origin: BASE },
    });
    // Sin sesión, el admin guard redirige (302 → /admin/login?from=…) o el
    // handler de better-auth responde y devolvemos 303 → /admin/login.
    expect([302, 303]).toContain(resp.status());
    const location = resp.headers().location ?? "";
    expect(location).toMatch(/^\/admin\/login/);
  });

  test("POST /admin/logout sin Origin es bloqueado por CSRF (403)", async ({ request }) => {
    const resp = await request.fetch(`${BASE}/admin/logout`, {
      method: "POST",
      maxRedirects: 0,
    });
    // Astro CSRF (security.checkOrigin) bloquea cross-site POST sin Origin.
    expect(resp.status()).toBe(403);
  });
});
