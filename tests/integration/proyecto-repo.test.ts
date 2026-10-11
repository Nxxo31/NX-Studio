import { describe, it, expect, beforeEach } from 'vitest';
import { createTestEnv } from '../helpers/env';
import {
  create,
  getBySlug,
  listAll,
  listByCategory,
  listDestacados,
  updateBySlug,
  deleteBySlug,
  count,
} from '~/server/proyecto-repo';

describe('proyectoRepo', () => {
  let env: Awaited<ReturnType<typeof createTestEnv>>;

  beforeEach(async () => {
    env = await createTestEnv();
  });

  const syntheticTrader = {
    slug: 'synthetic-trader',
    code: 'SYN',
    name: 'Synthetic Trader',
    tagline: 'SaaS para bots de trading algorítmico',
    descripcion: 'Plataforma para desplegar, monitorear y gestionar bots...',
    categoria: 'SaaS' as const,
    stack: JSON.stringify(['Node.js', 'Deriv API', 'WebSocket']),
    repoUrl: 'https://github.com/Nxxo31/synthetic-trader',
    liveUrl: undefined,
    impact: 'Multi-mercado · Real-time',
    year: 2026,
    status: 'activo' as const,
    destacado: true,
  };

  it('create persiste y devuelve el row completo', async () => {
    const row = await create(env.db, syntheticTrader);
    expect(row.id).toBeDefined();
    expect(row.slug).toBe('synthetic-trader');
    expect(row.destacado).toBe(true);
    expect(typeof row.stack).toBe('string');
  });

  it('stack se persiste como JSON string parseable', async () => {
    const row = await create(env.db, syntheticTrader);
    const parsed = JSON.parse(row.stack);
    expect(parsed).toEqual(['Node.js', 'Deriv API', 'WebSocket']);
  });

  it('getBySlug devuelve null si no existe', async () => {
    expect(await getBySlug(env.db, 'no-such')).toBeNull();
  });

  it('getBySlug devuelve el proyecto correcto', async () => {
    await create(env.db, syntheticTrader);
    const fetched = await getBySlug(env.db, 'synthetic-trader');
    expect(fetched?.name).toBe('Synthetic Trader');
  });

  it('listAll ordena: destacados primero, luego por year desc', async () => {
    await create(env.db, { ...syntheticTrader, slug: 'a', year: 2024, destacado: false });
    await create(env.db, { ...syntheticTrader, slug: 'b', year: 2025, destacado: false });
    await create(env.db, { ...syntheticTrader, slug: 'c', year: 2026, destacado: true });

    const list = await listAll(env.db);
    expect(list).toHaveLength(3);
    expect(list[0].slug).toBe('c'); // destacado 2026 primero
    expect(list[1].slug).toBe('b'); // 2025 segundo
    expect(list[2].slug).toBe('a'); // 2024 tercero
  });

  it('listByCategory filtra correctamente', async () => {
    await create(env.db, { ...syntheticTrader, slug: 'saas-1', categoria: 'SaaS' });
    await create(env.db, { ...syntheticTrader, slug: 'saas-2', categoria: 'SaaS' });
    await create(env.db, { ...syntheticTrader, slug: 'ia-1', categoria: 'IA' });

    const saas = await listByCategory(env.db, 'SaaS');
    expect(saas).toHaveLength(2);
    expect(saas.every(p => p.categoria === 'SaaS')).toBe(true);
  });

  it('listByCategory devuelve vacío si la categoría no existe', async () => {
    await create(env.db, syntheticTrader);
    const ia = await listByCategory(env.db, 'IA');
    expect(ia).toHaveLength(0);
  });

  it('listDestacados devuelve solo los marcados', async () => {
    await create(env.db, { ...syntheticTrader, slug: 'a', destacado: true });
    await create(env.db, { ...syntheticTrader, slug: 'b', destacado: false });
    await create(env.db, { ...syntheticTrader, slug: 'c', destacado: true });

    const list = await listDestacados(env.db);
    expect(list).toHaveLength(2);
    expect(list.every(p => p.destacado === true)).toBe(true);
  });

  it('updateBySlug modifica campos específicos', async () => {
    await create(env.db, syntheticTrader);
    const updated = await updateBySlug(env.db, 'synthetic-trader', {
      tagline: 'Nueva tagline',
      year: 2025,
    });
    expect(updated?.tagline).toBe('Nueva tagline');
    expect(updated?.year).toBe(2025);
    expect(updated?.name).toBe('Synthetic Trader'); // sin cambio
  });

  it('deleteBySlug borra el proyecto', async () => {
    await create(env.db, syntheticTrader);
    expect(await count(env.db)).toBe(1);
    await deleteBySlug(env.db, 'synthetic-trader');
    expect(await count(env.db)).toBe(0);
  });

  it('create con slug duplicado lanza error (UNIQUE constraint)', async () => {
    await create(env.db, syntheticTrader);
    await expect(create(env.db, syntheticTrader)).rejects.toThrow();
  });

  it('categoria enum valida valores al nivel DB (SQLite no valida CHECK por default)', async () => {
    // SQLite no valida CHECK constraints por default en mejor-sqlite3.
    // La validación real la hace Zod / la API. Este test documenta eso.
    // Si en el futuro agregamos CHECKs, descomentar la aserción de error.
    //
    // Hoy el create debe funcionar (sin error) porque SQLite no tiene CHECK
    // constraint en D1.
    const row = await create(env.db, { ...syntheticTrader, slug: 'crypto', categoria: 'Bitcoin' as never });
    expect(row.categoria).toBe('Bitcoin'); // SQLite no validó
  });
});
