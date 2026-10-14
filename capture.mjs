import { chromium } from '@playwright/test';

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'es-CO' });
const page = await ctx.newPage();

const shots = [];

// === NX-Studio brutalism (current deployed) — 2 themes, 4 pages ===
const NX = 'https://nx-studio.nx-studio.workers.dev';
const nxPages = [
  ['nx-brutal-dark-home.png',       '/',              'brutal-dark'],
  ['nx-brutal-dark-productos.png',  '/productos/',    'brutal-dark'],
  ['nx-brutal-dark-laboratorio.png','/laboratorio/',  'brutal-dark'],
  ['nx-brutal-dark-contacto.png',   '/contacto/',     'brutal-dark'],
  ['nx-brutal-cream-home.png',      '/',              'brutal-cream'],
  ['nx-brutal-cream-laboratorio.png','/laboratorio/', 'brutal-cream'],
];
for (const [name, path, theme] of nxPages) {
  await page.goto(NX + '/');
  await page.evaluate((t) => localStorage.setItem('nx-studio-theme', t), theme);
  await page.goto(NX + path, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'C:/Users/sebas/' + name, fullPage: true });
  shots.push(name);
}

// === 21st.dev — reference ===
const t21 = [
  ['21st-home.png',       'https://21st.dev/'],
  ['21st-blocks.png',     'https://21st.dev/blocks'],
  ['21st-components.png', 'https://21st.dev/components'],
  ['21st-agents.png',     'https://21st.dev/agents'],
];
for (const [name, url] of t21) {
  try {
    const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'C:/Users/sebas/' + name, fullPage: false });
    shots.push(name + ' (' + resp?.status() + ')');
  } catch (e) { shots.push(name + ' FAIL: ' + e.message); }
}

await browser.close();
console.log('SHOTS:');
shots.forEach(s => console.log(' -', s));
