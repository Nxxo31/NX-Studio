import { test, expect } from "@playwright/test";

test("probe · page.goto funciona con baseURL", async ({ page }) => {
  console.log("baseURL:", "http://127.0.0.1:4322/NX-Studio");
  await page.goto("/productos/");
  console.log("URL after goto:", page.url());
  console.log("Title:", await page.title());
  const html = await page.locator("html").innerHTML();
  console.log("HTML length:", html.length);
  const cardCount = await page.locator("[data-project-card]").count();
  console.log("Card count:", cardCount);
  expect(cardCount).toBe(11);
});
