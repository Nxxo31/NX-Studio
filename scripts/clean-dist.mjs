// Workaround para Node 26: fs.rmdirSync ya no acepta recursive →
// astro build (emptyDir) crea dist limpio si el directorio no existe.
// Script de un solo uso para limpiar dist antes del build.
import { rmSync } from 'node:fs';
for (const d of ['dist', '.build-check']) {
  rmSync(new URL(`../${d}`, import.meta.url), { recursive: true, force: true, maxRetries: 5 });
}
console.log('cleaned');
