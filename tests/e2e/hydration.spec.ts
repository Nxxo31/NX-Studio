import { test, expect } from "@playwright/test";

/**
 * E2E Hydration · SSR/CSR mismatch regression
 *
 * Coverage:
 *  - Navega a /, /en/, /pt/ y verifica que no se emitan errores React #425
 *    ("Text content does not match server-rendered HTML") ni #423
 *    ("There was an error while hydrating").
 *  - Los errores se originaban en el contenido del <style> de las islas
 *    React NXSculptureHero y ProjectSlider: el SSR HTML-escapaba los `"` y `'`
 *    del CSS a `&quot;` / `&#x27;`, pero el browser NO decodifica entities
 *    dentro de <style> (RCDATA), así que el DOM quedaba con entidades literales
 *    y React (que escribe el texto raw vía dangerouslySetInnerHTML o via
 *    nodeValue) producía un string diferente → text content mismatch → #425.
 *  - Fix: usar single quotes en selectores CSS + dangerouslySetInnerHTML para
 *    que el contenido del <style> no sea escapado por React ni por Astro.
 */
const BASE = "http://127.0.0.1:4322";

const HYDRATION_PATTERNS = [
  /did not match/i,
  /hydrat/i,
  /Minified React error #425/,
  /Minified React error #423/,
  /Text content does not match/,
  /There was an error while hydrating/,
];

function isHydrationRelated(text: string): boolean {
  return HYDRATION_PATTERNS.some((re) => re.test(text));
}

test.describe("Home · hydration (SSR/CSR mismatch)", () => {
  for (const path of ["/", "/en/", "/pt/"] as const) {
    test(`no hydration errors on ${path}`, async ({ page }) => {
      const collected: { type: string; text: string }[] = [];

      page.on("console", (msg) => {
        collected.push({ type: msg.type(), text: msg.text() });
      });
      page.on("pageerror", (err) => {
        collected.push({ type: "pageerror", text: err.message });
      });

      const resp = await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded" });
      expect(resp?.status()).toBe(200);

      // Espera a que terminen los useEffects de las islas (canvas + data-gl="on"
      // se setean en useEffect → cualquier error React #425/#423 se emite
      // antes de que eso pase, pero damos un margen para cubrirlo).
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(500);

      const offenders = collected.filter((m) =>
        isHydrationRelated(m.text),
      );

      if (offenders.length > 0) {
        const detail = offenders
          .map((o) => `[${o.type}] ${o.text}`)
          .join("\n");
        throw new Error(
          `Hydration errors found on ${path}:\n${detail}\n(total: ${offenders.length})`,
        );
      }

      // Sanity check: la página realmente hidrato las islas (no fallback a
      // client-render por error). NXSculptureHero setea data-gl="on" en
      // useEffect tras WebGL init.
      await expect(page.locator(".sh-root")).toHaveCount(1);
      await expect(page.locator(".nx-slider")).toHaveCount(1);
    });
  }
});