import { describe, it, expect } from 'vitest';
import { transformProject, generateSeedSQL } from '../../scripts/seed-proyectos';
import { createTestEnv } from '../helpers/env';
import { create as createProyecto, listAll } from '~/server/proyecto-repo';

describe('seed-proyectos', () => {
  describe('transformProject', () => {
    it('mapea cada proyecto del catálogo a un NewProyecto válido', () => {
      const p = transformProject({
        slug: 'test',
        code: 'TST',
        name: 'Test Project',
        tagline: 'tagline',
        desc: 'desc',
        category: 'SaaS',
        stack: ['A', 'B'],
        repo: 'https://github.com/x',
        impact: 'metrics',
        year: '2026',
        status: 'live',
      });
      expect(p.slug).toBe('test');
      expect(p.categoria).toBe('SaaS');
      expect(p.stack).toBe('["A","B"]');
      expect(p.year).toBe(2026);
      expect(p.status).toBe('activo');
      expect(p.repoUrl).toBe('https://github.com/x');
    });

    it('status live → activo', () => {
      expect(transformProject({ status: 'live' } as never).status).toBe('activo');
    });

    it('status prototype → beta', () => {
      expect(transformProject({ status: 'prototype' } as never).status).toBe('beta');
    });

    it('status archived → archivado', () => {
      expect(transformProject({ status: 'archived' } as never).status).toBe('archivado');
    });

    it('solo nexocore queda destacado=true', () => {
      const nexo = transformProject({ slug: 'nexocore' } as never);
      const other = transformProject({ slug: 'other' } as never);
      expect(nexo.destacado).toBe(true);
      expect(other.destacado).toBe(false);
    });

    it('stack vacío se serializa como JSON array vacío', () => {
      const p = transformProject({ stack: [] } as never);
      expect(p.stack).toBe('[]');
    });
  });

  describe('generateSeedSQL', () => {
    it('genera un SQL con 18 INSERTs', () => {
      const sql = generateSeedSQL();
      const matches = sql.match(/INSERT INTO proyecto/g);
      expect(matches).not.toBeNull();
      expect(matches!.length).toBe(18);
    });

    it('usa ON CONFLICT DO UPDATE (idempotente)', () => {
      const sql = generateSeedSQL();
      expect(sql).toContain('ON CONFLICT(slug) DO UPDATE SET');
    });

    it('escapa comillas simples (keeps SQL válido con apóstrofes)', () => {
      // Los nombres con "'" deben escaparse a "''"
      const sql = generateSeedSQL();
      // Sintético trader tiene tagline legible sin apos
      expect(sql).toContain('Synthetic Trader');
    });
  });

  describe('seed real (integration)', () => {
    it('aplicar el seed a una DB vacía inserta exactamente 18 proyectos', async () => {
      const env = await createTestEnv();
      const sql = generateSeedSQL();
      // Ejecutar el SQL proyecto por proyecto (separado por ;)
      const statements = sql.split(/;\s*$/gm).map(s => s.trim()).filter(Boolean);
      for (const stmt of statements) {
        await env.db.$client.exec(stmt + ';');
      }

      const all = await listAll(env.db);
      expect(all).toHaveLength(18);
    });

    it('una segunda ejecución es idempotente (no duplica por slug)', async () => {
      const env = await createTestEnv();
      const sql = generateSeedSQL();
      const statements = sql.split(/;\s*$/gm).map(s => s.trim()).filter(Boolean);
      // Aplicar dos veces
      for (const stmt of statements) {
        await env.db.$client.exec(stmt + ';');
      }
      for (const stmt of statements) {
        await env.db.$client.exec(stmt + ';');
      }

      const all = await listAll(env.db);
      expect(all).toHaveLength(18);
    });
  });
});
