/**
 * sync-project-images.ts — sincroniza las imágenes de los proyectos.
 *
 * Flujo (source of truth = carpeta en el escritorio):
 *   1. Para cada proyecto FINALIZADO (status 'live') asegura la subcarpeta
 *      Desktop\NX-Proyectos\<slug>\ (la crea si no existe).
 *   2. Copia las imágenes que el operador haya dejado ahí hacia
 *      public/proyectos/<slug>/ (carpeta gestionada: se regenera completa).
 *   3. Si un proyecto finalizado no tiene imágenes todavía, genera un
 *      placeholder SVG con la identidad NX para que el slider nunca quede vacío.
 *   4. Escribe el manifest src/data/project-images.json que consume el sitio.
 *
 * Uso:   npm run sync:proyectos
 * Override de la carpeta fuente:  NX_PROYECTOS_DIR=C:\ruta\nueva
 */

import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import { projects } from "../src/data/catalog";

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC_DIR = process.env.NX_PROYECTOS_DIR
  ?? path.join(os.homedir(), "Desktop", "NX-Proyectos");
const PUBLIC_DIR = path.join(ROOT, "public", "proyectos");
const MANIFEST_PATH = path.join(ROOT, "src", "data", "project-images.json");

const IMG_EXTS = new Set([".png", ".jpg", ".jpeg", ".webp", ".avif", ".gif"]);
const PLACEHOLDER_PREFIX = "nx-placeholder-";

function esc(s: string): string {
  const AMP = String.fromCharCode(38); // entity prefix, escrito por codigo para evitar decodificacion
  return s
    .replace(/&/g, AMP + "amp;")
    .replace(/</g, AMP + "lt;")
    .replace(/>/g, AMP + "gt;")
    .replace(/"/g, AMP + "quot;");
}

function makePlaceholder(name: string, tagline: string, category: string, variant: number): string {
  const hues = [14, 230, 160, 280, 45, 190, 330];
  const hue = hues[variant % hues.length];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <defs>
    <radialGradient id="g" cx="30%" cy="25%" r="90%">
      <stop offset="0%" stop-color="hsl(${hue} 70% 16%)"/>
      <stop offset="100%" stop-color="#0a0b14"/>
    </radialGradient>
  </defs>
  <rect width="1280" height="720" fill="url(#g)"/>
  <g stroke="#e8eaf6" stroke-opacity="0.06">
    ${Array.from({ length: 12 }, (_, i) => `<line x1="0" y1="${i * 60}" x2="1280" y2="${i * 60}"/>`).join("")}
    ${Array.from({ length: 22 }, (_, i) => `<line x1="${i * 60}" y1="0" x2="${i * 60}" y2="720"/>`).join("")}
  </g>
  <g transform="translate(72,96)" stroke="#ff4500" stroke-width="6" fill="none" stroke-linejoin="round">
    <path d="M30 0 L60 17 L60 51 L30 68 L0 51 L0 17 Z"/>
    <text x="30" y="46" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="30" fill="#ff4500" stroke="none">NX</text>
  </g>
  <text x="72" y="300" font-family="Arial, sans-serif" font-weight="700" font-size="64" fill="#e8eaf6">${esc(name)}</text>
  <text x="72" y="360" font-family="Arial, sans-serif" font-size="28" fill="#ff8a66">${esc(tagline)}</text>
  <rect x="72" y="420" rx="18" width="${category.length * 14 + 48}" height="36" fill="none" stroke="#e8eaf6" stroke-opacity="0.35"/>
  <text x="96" y="444" font-family="Arial, sans-serif" font-size="18" fill="#e8eaf6" fill-opacity="0.8">${esc(category)}</text>
  <text x="72" y="640" font-family="Arial, sans-serif" font-size="18" fill="#e8eaf6" fill-opacity="0.45">NX-Studio · vista previa del proyecto</text>
</svg>
`;
}

const LEEME = `NX-Proyectos — imágenes del portafolio NX-Studio
====================================================

Cada subcarpeta lleva el nombre de un proyecto terminado (slug).
Deja ahí las capturas de pantalla del proyecto (PNG, JPG o WebP).

Después ejecuta:

    npm run sync:proyectos

(en C:\\Users\\sebas\\Desktop\\proyectos\\NX-Studio)

Eso copia las imágenes al sitio, reemplaza los placeholders
automáticos y actualiza el slider del portafolio.

Consejos:
- Usa 3 a 6 imágenes por proyecto (portada, funcionalidades, resultados).
- La primera imagen en orden alfabético es la que sale primero en el slider.
- Nombres recomendados: 01-inicio.png, 02-panel.png, 03-reportes.png ...
`;

async function main() {
  const finished = projects.filter((p) => p.status === "live");
  console.log(`Proyectos finalizados: ${finished.length}`);
  console.log(`Carpeta fuente: ${SRC_DIR}\n`);

  if (!existsSync(SRC_DIR)) await mkdir(SRC_DIR, { recursive: true });
  await writeFile(path.join(SRC_DIR, "LEEME.txt"), LEEME, "utf8");

  const manifest: Record<string, string[]> = {};

  for (const p of finished) {
    const srcDir = path.join(SRC_DIR, p.slug);
    const dstDir = path.join(PUBLIC_DIR, p.slug);
    if (!existsSync(srcDir)) await mkdir(srcDir, { recursive: true });

    const srcFiles = (await readdir(srcDir))
      .filter((f) => IMG_EXTS.has(path.extname(f).toLowerCase()))
      .sort();

    // La carpeta public es gestionada: se regenera en cada sync.
    await rm(dstDir, { recursive: true, force: true });
    await mkdir(dstDir, { recursive: true });

    const outFiles: string[] = [];
    if (srcFiles.length > 0) {
      for (const f of srcFiles) {
        const data = await readFile(path.join(srcDir, f));
        await writeFile(path.join(dstDir, f), data);
        outFiles.push(`/proyectos/${p.slug}/${f}`);
      }
      console.log(`  ${p.slug}: ${srcFiles.length} imagen(es) copiada(s)`);
    } else {
      const name = `${PLACEHOLDER_PREFIX}1.svg`;
      await writeFile(
        path.join(dstDir, name),
        makePlaceholder(p.name, p.tagline, p.category, finished.indexOf(p)),
        "utf8"
      );
      outFiles.push(`/proyectos/${p.slug}/${name}`);
      console.log(`  ${p.slug}: placeholder generado (sin imágenes aún)`);
    }
    manifest[p.slug] = outFiles;
  }

  await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n", "utf8");
  console.log(`\nManifest actualizado: src/data/project-images.json`);
  console.log(`Proyectos con imágenes listas para el slider: ${Object.keys(manifest).length}`);
}

main().catch((e) => {
  console.error("FALLO:", e);
  process.exit(1);
});
