import { describe, it, expect } from 'vitest';
import { transformTemplate, generateSeedSQL } from '../../scripts/seed-templates';
import { createTestEnv } from '../helpers/env';
import { listAll } from '~/server/template-repo';

describe('seed-templates', () => {
  describe('transformTemplate', () => {
    it('mapea un Template del catálogo a NewTemplate válido', () => {
      const x = transformTemplate({
        slug: 'test',
        name: 'Test Template',
        tagline: 'tag',
        desc: 'desc',
        category: 'Landing',
        stack: ['A', 'B'],
        price: 100,
        includes: ['incluye'],
        excludes: ['no incluye'],
        featured: true,
      });
      expect(x.slug).toBe('test');
      expect(x.categoria).toBe('landing');
      expect(x.precioUsd).toBe(100);
      expect(x.stack).toBe('["A","B"]');
      expect(x.incluye).toBe('["incluye"]');
      expect(x.noIncluye).toBe('["no incluye"]');
      expect(x.destacado).toBe(true);
    });

    it('Dashboard category mapea a "dashboard"', () => {
      expect(transformTemplate({ category: 'Dashboard' } as never).categoria).toBe('dashboard');
    });

    it('E-commerce category mapea a "ecommerce"', () => {
      expect(transformTemplate({ category: 'E-commerce' } as never).categoria).toBe('ecommerce');
    });

    it('tiempoEntregaDias asigna según el slug conocido', () => {
      expect(transformTemplate({ slug: 'landing-converter' } as never).tiempoEntregaDias).toBe(3);
      expect(transformTemplate({ slug: 'dashboard-starter' } as never).tiempoEntregaDias).toBe(5);
      expect(transformTemplate({ slug: 'ecommerce-headless' } as never).tiempoEntregaDias).toBe(7);
    });
  });

  describe('generateSeedSQL', () => {
    it('genera un SQL con 3 INSERTs', () => {
      const sql = generateSeedSQL();
      const matches = sql.match(/INSERT INTO template/g);
      expect(matches).not.toBeNull();
      expect(matches!.length).toBe(3);
    });

    it('usa ON CONFLICT para idempotencia', () => {
      const sql = generateSeedSQL();
      expect(sql).toContain('ON CONFLICT(slug) DO UPDATE SET');
    });
  });

  describe('seed real (integration)', () => {
    it('aplicar el seed inserta exactamente 3 templates', async () => {
      const env = await createTestEnv();
      const sql = generateSeedSQL();
      const statements = sql.split(/;\s*$/gm).map(s => s.trim()).filter(Boolean);
      for (const stmt of statements) {
        await env.db.$client.exec(stmt + ';');
      }
      const all = await listAll(env.db);
      expect(all).toHaveLength(3);
    });

    it('re-aplicar es idempotente (no duplica por slug)', async () => {
      const env = await createTestEnv();
      const sql = generateSeedSQL();
      const statements = sql.split(/;\s*$/gm).map(s => s.trim()).filter(Boolean);
      for (const stmt of statements) await env.db.$client.exec(stmt + ';');
      for (const stmt of statements) await env.db.$client.exec(stmt + ';');
      const all = await listAll(env.db);
      expect(all).toHaveLength(3);
    });
  });
});
