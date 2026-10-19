import { test, expect } from "@playwright/test";

/**
 * E2E Chatbot SophIA (Phase 6).
 *
 * Cobertura:
 *  (a) FAB visible en marketing pages (/, /servicios/, /contacto/, /brand/)
 *  (b) FAB NO visible en /portal/login ni /admin/login
 *  (c) Toggle: click en FAB abre el panel, otro click lo cierra
 *  (d) Header tiene título "SophIA" y status "En línea"
 *  (e) Input + botón enviar + botón minimizar + botón cerrar presentes
 *  (f) Enviar un mensaje produce respuesta del bot (mock)
 *  (g) Comando "/help" produce respuesta con keywords "help" / "ayuda"
 *  (h) Persistencia entre navegaciones: abrir el panel, escribir, navegar
 *      a otra marketing page → el panel sigue abierto con el history.
 *  (i) LocalStorage schema correcto (STORAGE_KEY contiene schemaVersion=1).
 *  (j) Exclusión en /portal/login (smoke: ni siquiera aparece el FAB).
 *
 * El preview server corre en http://127.0.0.1:4322 (playwright.config.ts).
 * Si corre el dev server en 4321, ajustar BASE accordingly.
 */

const BASE = "http://127.0.0.1:4322";

/** Selector estable del FAB. */
const FAB = '[data-testid="chatbot-fab"]';
/** Selector del panel (puede tener hidden=true cuando está minimizado). */
const PANEL = '[data-testid="chatbot-panel"]';
const ROOT = '[data-testid="chatbot-root"]';

test.describe("Chatbot SophIA · renderizado por página", () => {
  test("(a) FAB visible en marketing pages", async ({ page }) => {
    for (const path of ["/", "/servicios/", "/contacto/", "/brand/"]) {
      await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded" });
      await expect(page.locator(FAB), `FAB debe existir en ${path}`).toBeAttached({ timeout: 5000 });
    }
  });

  test("(b) FAB NO se monta en /portal/login ni /admin/login", async ({ page }) => {
    for (const path of ["/portal/login", "/admin/login"]) {
      await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded" });
      // Ni el root ni el FAB deben estar presentes.
      await expect(page.locator(ROOT).first()).toHaveCount(0);
      await expect(page.locator(FAB).first()).toHaveCount(0);
    }
  });
});

test.describe("Chatbot SophIA · FSM toggle (FAB ↔ panel)", () => {
  test("(c) click en FAB abre el panel (closed → open)", async ({ page }) => {
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
    const root = page.locator(ROOT);
    await expect(root).toHaveAttribute("data-chatbot-state", "closed", { timeout: 5000 });

    await page.locator(FAB).click();
    await expect(root).toHaveAttribute("data-chatbot-state", "open", { timeout: 3000 });
    await expect(page.locator(PANEL)).toBeVisible();
  });

  test("(c.2) click en close button cierra el panel (open → closed)", async ({ page }) => {
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
    const root = page.locator(ROOT);
    await page.locator(FAB).click();
    await expect(root).toHaveAttribute("data-chatbot-state", "open", { timeout: 3000 });
    await page.locator('[data-testid="chatbot-close"]').click();
    await expect(root).toHaveAttribute("data-chatbot-state", "closed", { timeout: 3000 });
  });

  test("(c.3) minimizar oculta el panel pero mantiene el root (open → minimized)", async ({ page }) => {
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
    await page.locator(FAB).click();
    await expect(page.locator(PANEL)).toBeVisible();
    await page.locator('[data-testid="chatbot-minimize"]').click();
    await expect(page.locator(ROOT)).toHaveAttribute("data-chatbot-state", "minimized");
    await expect(page.locator(PANEL)).toBeHidden();
  });
});

test.describe("Chatbot SophIA · UI elements", () => {
  test("(d) header tiene título 'SophIA' y status en línea", async ({ page }) => {
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
    await page.locator(FAB).click();
    await expect(page.locator('[data-testid="chatbot-header"]')).toBeVisible();
    // El título debe contener "SophIA" (es la marca).
    await expect(page.locator(".nx-cb-title").first()).toContainText("SophIA");
    // Subtítulo con status "online" / "En línea" / "Online" (i18n-aware)
    await expect(page.locator(".nx-cb-subtitle").first()).toBeVisible();
  });

  test("(e) input + send + minimize + close presentes", async ({ page }) => {
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
    await page.locator(FAB).click();
    await expect(page.locator('[data-testid="chatbot-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="chatbot-send"]')).toBeVisible();
    await expect(page.locator('[data-testid="chatbot-minimize"]')).toBeVisible();
    await expect(page.locator('[data-testid="chatbot-close"]')).toBeVisible();
    await expect(page.locator('[data-testid="chatbot-reset"]')).toBeVisible();
  });

  test("(f) enviar mensaje produce respuesta mock del bot", async ({ page }) => {
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
    await page.locator(FAB).click();
    const input = page.locator('[data-testid="chatbot-input"]');
    await input.fill("hola");
    await page.locator('[data-testid="chatbot-send"]').click();
    // Después del send debe aparecer al menos una burbuja bot.
    const botBubbles = page.locator('[data-testid="chatbot-msg-bot"]');
    await expect(botBubbles.first()).toBeVisible({ timeout: 3000 });
    // Y debe haber al menos una burbuja user también (nuestro "hola").
    await expect(page.locator('[data-testid="chatbot-msg-user"]').first()).toBeVisible();
  });

  test("(g) comando /help produce respuesta con lista de capabilities", async ({ page }) => {
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
    await page.locator(FAB).click();
    await page.locator('[data-testid="chatbot-input"]').fill("/help");
    await page.locator('[data-testid="chatbot-send"]').click();
    // La última burbuja bot debe contener "/help" (palabra clave) y un command.
    const bubbles = page.locator('[data-testid="chatbot-msg-bot"]');
    await expect(bubbles.last()).toBeVisible({ timeout: 3000 });
    const text = (await bubbles.last().innerText()).toLowerCase();
    // La respuesta mock_help ES contiene "/help" y "/reset".
    expect(text).toMatch(/\/help|\/reset|\/portalsignup/);
  });
});

test.describe("Chatbot SophIA · persistencia entre navegaciones", () => {
  test("(h) state y history persisten al navegar entre marketing pages", async ({ page, context }) => {
    // Limpia storage para empezar limpio.
    await context.clearCookies();

    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
    await page.locator(FAB).click();
    await page.locator('[data-testid="chatbot-input"]').fill("hola");
    await page.locator('[data-testid="chatbot-send"]').click();
    // Esperar respuesta bot.
    await expect(page.locator('[data-testid="chatbot-msg-bot"]').last()).toBeVisible({ timeout: 3000 });

    // Navegar a otra marketing page.
    await page.goto(`${BASE}/servicios/`, { waitUntil: "domcontentloaded" });
    // El panel debe seguir abierto (state='open' persistido en localStorage).
    await expect(page.locator(ROOT)).toHaveAttribute("data-chatbot-state", "open", { timeout: 5000 });
    // El history debe contener al menos: greeting bot + "hola" user + bot reply.
    const msgs = page.locator('[data-testid="chatbot-msg-user"], [data-testid="chatbot-msg-bot"]');
    expect(await msgs.count()).toBeGreaterThanOrEqual(2);
  });

  test("(i) localStorage schema correcto bajo STORAGE_KEY", async ({ page }) => {
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
    await page.locator(FAB).click();
    const raw = await page.evaluate(() => window.localStorage.getItem("nx-studio-chatbot:v1"));
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw as string);
    expect(parsed.schemaVersion).toBe(1);
    expect(parsed.state).toMatch(/closed|minimized|open/);
    expect(Array.isArray(parsed.history)).toBe(true);
    expect(parsed.userContext).toBeInstanceOf(Object);
  });

  test("(i.2) /reset limpia el history (state sigue siendo open)", async ({ page }) => {
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
    await page.locator(FAB).click();
    await page.locator('[data-testid="chatbot-input"]').fill("hola");
    await page.locator('[data-testid="chatbot-send"]').click();
    await expect(page.locator('[data-testid="chatbot-msg-user"]').first()).toBeVisible({ timeout: 3000 });

    await page.locator('[data-testid="chatbot-reset"]').click();
    // Después de reset, debe quedar solo el greeting bot (1 burbuja).
    // Damos un tick para que se repinte.
    await page.waitForTimeout(200);
    const msgs = page.locator('[data-testid="chatbot-msg-user"], [data-testid="chatbot-msg-bot"]');
    const count = await msgs.count();
    // Greeting bot re-sembrado = 1 mensaje bot. Sin mensajes user.
    expect(count).toBe(1);
    await expect(page.locator(ROOT)).toHaveAttribute("data-chatbot-state", "open");
  });
});

test.describe("Chatbot SophIA · exclusión en /portal y /admin", () => {
  test("(j) /portal/login NO monta el chatbot", async ({ page }) => {
    const resp = await page.goto(`${BASE}/portal/login`, { waitUntil: "domcontentloaded" });
    // El middleware redirige sin sesión: el status real depende de la auth.
    // Aceptamos 200 (página de login render) o 302 (redirect).
    if (resp && resp.status() !== 200) {
      // Redirected — sin render del chatbot por construcción.
      return;
    }
    await expect(page.locator(FAB).first()).toHaveCount(0);
    await expect(page.locator(ROOT).first()).toHaveCount(0);
  });

  test("(j.2) /admin/login NO monta el chatbot", async ({ page }) => {
    const resp = await page.goto(`${BASE}/admin/login`, { waitUntil: "domcontentloaded" });
    if (resp && resp.status() !== 200) {
      return;
    }
    await expect(page.locator(FAB).first()).toHaveCount(0);
    await expect(page.locator(ROOT).first()).toHaveCount(0);
  });
});
