/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

// Vitest para unit/integration tests del backend (better-auth, DB, business logic).
// Separado de Playwright (tests/*.spec.ts) que cubre E2E.
//
// Estrategia:
// - Node environment por default — fast feedback para lógica pura
// - En los tests que tocan DB, se monta el fake D1 (in-memory SQLite via better-sqlite3)
// - Aliases para mantener compatibilidad con imports del src/
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts'],
    exclude: ['node_modules', 'dist', 'tests/**/*.spec.ts'],
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/db/**', 'src/lib/**', 'src/server/**'],
      exclude: ['**/*.d.ts', '**/index.ts'],
    },
  },
  resolve: {
    alias: {
      '~': new URL('./src/', import.meta.url).pathname,
      '@': new URL('./src/', import.meta.url).pathname,
    },
  },
});
