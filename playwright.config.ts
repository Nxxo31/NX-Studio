import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config para NX-Studio.
 *
 * Estrategia:
 * - Dev server (no preview) — corre cambios sin necesidad de re-build,
 *   útil durante desarrollo de tests. Para CI usar `npm run preview` (build).
 * - Base URL apunta a 127.0.0.1:4321 (dev server Astro) con base /NX-Studio/.
 * - Channel: 'chrome' usa el Chrome instalado en el sistema (ya está disponible,
 *   evita descargar el Chromium bundleado de Playwright).
 * - Single worker, no retries: NX-Studio es sitio estático, los flakos vienen
 *   del dev server y no del código. Si un test falla, queremos ver el fallo
 *   la primera vez.
 */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  use: {
    // baseURL SIN trailing slash — con slash y path que empieza con "/",
    // Playwright concatena y genera "//brand" (doble slash). Sin trailing
    // slash, `/brand/` queda como `…/NX-Studio/brand/` (single slash).
    // Para HTTP `request.get`, construimos la URL absoluta en el spec.
    // Puerto 4322: preview server (4321 está ocupado por dev server).
    baseURL: "http://127.0.0.1:4322/NX-Studio",
    // trace/screenshot deshabilitados por defecto (requieren binarios extra que
    // no pudimos descargar de cdn.playwright.dev en este entorno).
    // Reactivar cuando se ejecute en CI con `npx playwright install chromium` OK.
    trace: "off",
    screenshot: "off",
    video: "off",
    channel: "chrome",
    headless: true,
    locale: "es-CO",
    timezoneId: "America/Bogota",
    // Viewport desktop por defecto; los mobile tests lo sobreescriben.
    viewport: { width: 1280, height: 800 },
  },
  projects: [
    {
      name: "desktop-chrome",
      use: { ...devices["Desktop Chrome"], channel: "chrome" },
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 7"], channel: "chrome" },
    },
  ],
  // Sin webServer automático: el preview server lo arranco manualmente
  // (puerto 4322) y Playwright lo respeta via baseURL. Evita el race condition
  // donde Playwright intenta arrancar un segundo preview y choca con el lock
  // de Astro (race observada durante setup inicial).
  // webServer: { command: "...", url: "...", reuseExistingServer: true },
});
