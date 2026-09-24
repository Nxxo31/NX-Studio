#!/usr/bin/env node
/**
 * preview-clean.mjs
 *
 * Mata zombies de Astro (dev/preview servers que quedaron colgados)
 * y arranca limpio en el puerto 4321.
 *
 * Uso:
 *   node scripts/preview-clean.mjs dev      # astro dev
 *   node scripts/preview-clean.mjs preview  # astro preview
 *
 * Por qué existe:
 *   Astro escribe .astro/preview.json y .astro/dev.json con el PID del
 *   proceso. Si matamos el wrapper bash sin liberar el proceso node,
 *   el siguiente arranque falla con "Another astro preview server is
 *   already running". Este script lo limpia de forma idempotente.
 */

import { spawn, execFileSync } from "node:child_process";
import { existsSync, readFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const PORT = 4321;
const mode = process.argv[2] ?? "preview";

if (!["dev", "preview", "build"].includes(mode)) {
  console.error(`Modo inválido: ${mode}. Usa: dev | preview | build`);
  process.exit(1);
}

// 1. Limpiar lockfile stale del modo elegido
const lockFile = join(ROOT, ".astro", `${mode}.json`);
if (existsSync(lockFile)) {
  try {
    const meta = JSON.parse(readFileSync(lockFile, "utf8"));
    const pid = meta?.pid;
    if (pid && !isAlive(pid)) {
      console.log(`[clean] Lockfile stale: PID ${pid} ya no existe. Borrando ${mode}.json`);
      unlinkSync(lockFile);
    } else if (pid) {
      console.log(`[clean] PID ${pid} aún activo en :${meta.port ?? PORT}.`);
    }
  } catch {
    console.warn(`[clean] ${mode}.json corrupto, borrando`);
    try { unlinkSync(lockFile); } catch {}
  }
}

// 2. Liberar el puerto si quedó colgado
try {
  const out = execFileSync("netstat", ["-ano"], { encoding: "utf8" });
  const lines = out.split(/\r?\n/).filter((l) => l.includes(`:${PORT} `) && l.includes("LISTENING"));
  for (const line of lines) {
    const cols = line.trim().split(/\s+/);
    const pid = cols[cols.length - 1];
    if (pid && pid !== String(process.pid)) {
      console.log(`[clean] Matando PID ${pid} que ocupa :${PORT}`);
      try {
        execFileSync("taskkill", ["/F", "/PID", pid], { stdio: "ignore" });
      } catch {
        try {
          execFileSync("powershell", ["-Command", `Stop-Process -Id ${pid} -Force -ErrorAction SilentlyContinue`], { stdio: "ignore" });
        } catch {}
      }
    }
  }
} catch (e) {
  console.warn("[clean] netstat falló:", e.message);
}

// 3. Pequeña espera para que el SO libere el socket
await new Promise((r) => setTimeout(r, 800));

// 4. Arrancar Astro CLI con invocación explícita cmd.exe /c en Windows.
//    En git-bash/MSYS, spawn("astro.cmd", ..., {shell:true}) es inestable —
//    queda como cmd.exe sin ejecutar el .cmd interno. cmd.exe /c es predecible.
let cmd, args;
if (process.platform === "win32") {
  const astroCmd = join(ROOT, "node_modules", ".bin", "astro.cmd");
  if (!existsSync(astroCmd)) {
    console.error(`[error] No se encontró ${astroCmd}. ¿Hiciste npm install?`);
    process.exit(1);
  }
  cmd = "cmd.exe";
  args = ["/c", astroCmd, mode, `--port`, `${PORT}`, `--host`, `127.0.0.1`];
  console.log(`[run] ${cmd} ${args.join(" ")}`);
} else {
  cmd = "npx";
  args = ["astro", mode, `--port`, `${PORT}`, `--host`, `127.0.0.1`];
  console.log(`[run] ${cmd} ${args.join(" ")}`);
}

const child = spawn(cmd, args, {
  stdio: "ignore",
  detached: true,
  windowsHide: true,
  env: { ...process.env, FORCE_COLOR: "1" },
});

child.unref();
console.log(`[ok] Server detached (PID ${child.pid}). Verifica en http://127.0.0.1:${PORT}/NX-Studio/`);
console.log(`[ok] Para detenerlo: cmd /c taskkill /F /PID ${child.pid}`);

setTimeout(() => process.exit(0), 100);

/**
 * isAlive: ¿el PID existe en Windows?
 * Truco: tasklist con filtro por PID devuelve línea vacía si no existe.
 * Filtramos por "INFO: No tasks" para detectar ausencia.
 */
function isAlive(pid) {
  if (process.platform !== "win32") {
    try { process.kill(pid, 0); return true; } catch { return false; }
  }
  try {
    const out = execFileSync(
      "tasklist",
      ["/NH", "/FI", `PID eq ${pid}`],
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }
    );
    // tasklist devuelve "INFO: No tasks are running..." cuando no hay match
    const noTasks = /no tasks/i.test(out);
    const hasLine = out.split(/\r?\n/).some((l) => l.trim().split(/\s+/).includes(String(pid)));
    return hasLine && !noTasks;
  } catch {
    return false;
  }
}