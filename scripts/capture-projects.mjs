// capture-projects.mjs
// Screenshot capture for portafolio empresarial projects.
// Usage: node scripts/capture-projects.mjs [--only slug1,slug2] [--skip-existing]
//
// Outputs to NX-Studio/public/projects/{slug}/:
//   - desktop-home.png        (1440x900, viewport above the fold)
//   - desktop-full.png        (1440x900, full page)
//   - mobile-home.png         (390x844, viewport above the fold)
//   - mobile-full.png         (390x844, full page)
//   - manifest.json           (metadata for /proyectos/[slug])
//
// Dev servers must already be running for local projects.
// Override with --serve "slug=http://host:port" if needed.

import { chromium } from "@playwright/test";
import { existsSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_BASE = join(ROOT, "public", "projects");

// Viewports
const DESKTOP = { width: 1440, height: 900, deviceScaleFactor: 1 };
const MOBILE = { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true };

// Project catalog — the 6 live + ready ones.
// path = "/" or "/es" etc.; if relative to baseUrl, it gets prepended.
const PROJECTS = [
  {
    slug: "nx-studio",
    name: "NX-Studio",
    baseUrl: "http://127.0.0.1:4321",
    paths: ["/NX-Studio/", "/NX-Studio/cotizador", "/NX-Studio/laboratorio"],
    segment: "ia-agentes",
    stack: ["Astro 7", "Tailwind v4", "TypeScript"],
    desc: "Sitio empresarial de NX-Studio con cotizador interactivo y catálogo de servicios.",
    liveUrl: "https://nxxo31.github.io/NX-Studio/",
    repo: "https://github.com/Nxxo31/NX-Studio",
    year: 2026,
    waitMs: 800,
  },
  {
    slug: "portafolio",
    name: "Portafolio personal",
    baseUrl: "http://127.0.0.1:3000",
    paths: ["/es", "/en"],
    segment: "ia-agentes",
    stack: ["Next.js 16", "React 19", "next-intl", "Three.js", "Tailwind v4"],
    desc: "Portafolio personal con constelación interactiva, blog MDX y soporte i18n ES/EN.",
    liveUrl: "https://sebastianvelasco.dev",
    repo: "https://github.com/Nxxo31/portafolio",
    year: 2026,
    waitMs: 1500, // Three.js scene init
  },
  {
    slug: "grani-usco",
    name: "Grani USCO",
    baseUrl: "http://127.0.0.1:3002", // Vercel deployment was down; capturing from local dev
    paths: ["/"],
    segment: "apps-saas",
    stack: ["Next.js", "Framer Motion", "Tailwind"],
    desc: "Plataforma académica de la Universidad Surcolombiana con animaciones.",
    liveUrl: "https://grani-usco.vercel.app",
    repo: null,
    year: 2025,
    waitMs: 1200,
  },
  {
    slug: "multra-eu",
    name: "Multra E.U.",
    baseUrl: "http://127.0.0.1:3003", // deployed on Render was down; serving static locally
    paths: ["/"],
    segment: "sitios-web",
    stack: ["Node.js", "Express", "SQLite/MySQL", "JWT", "Vanilla JS"],
    desc: "Sistema de gestión para CDA y gestoría vehicular en Neiva, Huila.",
    liveUrl: "https://multra-eu.onrender.com",
    repo: null,
    year: 2025,
    waitMs: 800,
  },
  {
    slug: "tic-tac-toe",
    name: "Triqui · Tic-Tac-Toe",
    baseUrl: "https://triqui-coral.vercel.app",
    paths: ["/"],
    segment: "juegos-3d",
    stack: ["HTML", "CSS", "Vanilla JS", "PWA", "Minimax + Alpha-Beta"],
    desc: "Tres en raya con IA invicta, PWA offline, zero dependencies.",
    liveUrl: "https://triqui-coral.vercel.app",
    repo: "https://github.com/Nxxo31/Tic-Tac-Toe",
    year: 2025,
    waitMs: 600,
  },
  {
    slug: "triqui",
    name: "Triqui (legacy)",
    baseUrl: "https://triqui-coral.vercel.app", // same as Tic-Tac-Toe (likely a duplicate fork)
    paths: ["/"],
    segment: "juegos-3d",
    stack: ["HTML", "CSS", "Vanilla JS", "PWA"],
    desc: "Versión legacy de Triqui (alias Tic-Tac-Toe).",
    liveUrl: "https://triqui-coral.vercel.app",
    repo: "https://github.com/Nxxo31/triqui",
    year: 2025,
    waitMs: 600,
  },
];

// ---- CLI args ----
const args = process.argv.slice(2);
const onlyIdx = args.indexOf("--only");
const onlySlugs = onlyIdx >= 0 ? args[onlyIdx + 1].split(",").map((s) => s.trim()) : null;
const skipExisting = args.includes("--skip-existing");

let projects = PROJECTS;
if (onlySlugs) projects = projects.filter((p) => onlySlugs.includes(p.slug));

// ---- Capture ----
// Use Microsoft Edge from Windows (system-installed) since Playwright's bundled
// Chromium download is blocked on this network.
const EDGE_PATH = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
if (!existsSync(EDGE_PATH)) {
  console.error(`Edge not found at ${EDGE_PATH}. Adjust EDGE_PATH or install Edge.`);
  process.exit(1);
}
const browser = await chromium.launch({ headless: true, executablePath: EDGE_PATH, args: ["--no-sandbox"] });
const summary = [];

for (const proj of projects) {
  const outDir = join(OUT_BASE, proj.slug);
  mkdirSync(outDir, { recursive: true });

  console.log(`\n→ ${proj.slug} (${proj.name})`);
  const heroPath = proj.paths[0] || "/";

  // Desktop capture
  try {
    const ctxDesktop = await browser.newContext({ viewport: { width: DESKTOP.width, height: DESKTOP.height }, deviceScaleFactor: DESKTOP.deviceScaleFactor });
    const page = await ctxDesktop.newPage();
    const url = `${proj.baseUrl}${heroPath}`;
    console.log(`  desktop → ${url}`);
    await page.goto(url, { waitUntil: "networkidle", timeout: 45000 }).catch((e) => console.warn(`  goto warn: ${e.message}`));
    await page.waitForTimeout(proj.waitMs || 800);
    await page.screenshot({ path: join(outDir, "desktop-home.png"), fullPage: false });
    await page.screenshot({ path: join(outDir, "desktop-full.png"), fullPage: true });
    await ctxDesktop.close();
  } catch (e) {
    console.error(`  ✗ desktop failed: ${e.message}`);
  }

  // Mobile capture
  try {
    const ctxMobile = await browser.newContext({
      viewport: { width: MOBILE.width, height: MOBILE.height },
      deviceScaleFactor: MOBILE.deviceScaleFactor,
      isMobile: MOBILE.isMobile,
      hasTouch: MOBILE.hasTouch,
    });
    const page = await ctxMobile.newPage();
    const url = `${proj.baseUrl}${heroPath}`;
    console.log(`  mobile  → ${url}`);
    await page.goto(url, { waitUntil: "networkidle", timeout: 45000 }).catch((e) => console.warn(`  goto warn: ${e.message}`));
    await page.waitForTimeout(proj.waitMs || 800);
    await page.screenshot({ path: join(outDir, "mobile-home.png"), fullPage: false });
    await page.screenshot({ path: join(outDir, "mobile-full.png"), fullPage: true });
    await ctxMobile.close();
  } catch (e) {
    console.error(`  ✗ mobile failed: ${e.message}`);
  }

  // Manifest
  const manifest = {
    slug: proj.slug,
    name: proj.name,
    desc: proj.desc,
    segment: proj.segment,
    stack: proj.stack,
    liveUrl: proj.liveUrl,
    repo: proj.repo,
    year: proj.year,
    baseUrl: proj.baseUrl,
    capturedAt: new Date().toISOString(),
    assets: {
      desktopHome: `projects/${proj.slug}/desktop-home.png`,
      desktopFull: `projects/${proj.slug}/desktop-full.png`,
      mobileHome: `projects/${proj.slug}/mobile-home.png`,
      mobileFull: `projects/${proj.slug}/mobile-full.png`,
    },
  };
  writeFileSync(join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2), "utf-8");
  summary.push({ slug: proj.slug, status: "captured" });
  console.log(`  ✓ saved manifest + 4 screenshots`);
}

await browser.close();

// Aggregate manifest for /proyectos/[slug] page
const aggregate = {
  generatedAt: new Date().toISOString(),
  count: summary.length,
  projects: summary,
};
writeFileSync(join(OUT_BASE, "index.json"), JSON.stringify(aggregate, null, 2), "utf-8");

console.log(`\n=== Done ===`);
console.log(`Captured ${summary.length} projects`);
console.log(`Output: ${OUT_BASE}`);
console.log(`Index: ${join(OUT_BASE, "index.json")}`);
