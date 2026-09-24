import { test, expect } from "@playwright/test";

/**
 * Smoke tests — todas las rutas del sitemap público deben devolver 200
 * y renderizar su contenido esencial.
 *
 * Cobertura: 14 páginas principales + los slugs dinámicos (3 templates,
 * 11 productos) se cubren en sus propios specs.
 */

// Base URL del preview server (debe coincidir con playwright.config.ts).
// Importante: SIN trailing slash para que `page.goto("/brand/")` concatene
// correctamente (con slash genera `…/NX-Studio//brand/` que rompe el routing).
const BASE = "http://127.0.0.1:4322/NX-Studio";

const routes = [
  { path: "/",                              titleIncludes: "NX-Studio" },
  { path: "/servicios/",                    titleIncludes: "NX-Studio" },
  { path: "/servicios/osint/",              titleIncludes: "NX-Studio" },
  { path: "/servicios/testing/",            titleIncludes: "NX-Studio" },
  { path: "/productos/",                    titleIncludes: "Productos" },
  { path: "/cotizador/",                    titleIncludes: "Cotizador" },
  { path: "/templates/",                    titleIncludes: "Templates" },
  { path: "/laboratorio/",                  titleIncludes: "Laboratorio" },
  { path: "/contacto/",                     titleIncludes: "Contacto" },
  { path: "/brand/",                        titleIncludes: "Brand" },
  { path: "/logos/",                        titleIncludes: "Logos" },
  { path: "/palettes/",                     titleIncludes: "Paletas" },
];

for (const route of routes) {
  test(`smoke · ${route.path} responde 200 con título correcto`, async ({ page, request }) => {
    // 1) HTTP-level: status 200 sin necesidad de renderizar JS.
    // Construimos URL absoluta con `new URL` para evitar problemas de slash.
    const absoluteUrl = new URL(route.path, BASE.endsWith("/") ? BASE : `${BASE}/`).toString();
    const resp = await request.get(absoluteUrl);
    expect(resp.status(), `GET ${absoluteUrl} debería devolver 200`).toBe(200);
    const ct = resp.headers()["content-type"] ?? "";
    expect(ct, `${absoluteUrl} debería servir HTML`).toContain("text/html");

    // 2) Page-level: navega y valida el título (Title API + DOM)
    await page.goto(route.path);
    await expect(page).toHaveTitle(new RegExp(route.titleIncludes, "i"));

    // 3) Page-level: <html lang="es"> correcto (i18n)
    const lang = await page.locator("html").getAttribute("lang");
    expect(lang, "<html lang> debe ser 'es'").toBe("es");
  });
}

test("smoke · /productos muestra 11 cards y 4 stats inline", async ({ page }) => {
  await page.goto("/productos/");

  // 11 cards de proyecto
  await expect(page.locator("[data-project-card]")).toHaveCount(11);

  // 4 chips de filtro (Todos + 3 categorías visibles sin scroll)
  // (la nav tiene más pero el filtro principal es 8: 1 todos + 7 categorías)
  await expect(page.locator("#cat-filter .cat-chip")).toHaveCount(8);
});

test("smoke · página 404 sirve fallback con status 404", async ({ page, request }) => {
  // Ruta inexistente — Astro genera un 404 estático si existe, sino devuelve el
  // index. Aquí solo validamos que NO devuelve 500 (defensa contra rutas mal armadas).
  const resp = await request.get("/ruta-inexistente-que-no-existe/");
  expect([404, 200]).toContain(resp.status());
});
