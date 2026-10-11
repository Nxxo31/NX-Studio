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
} from '~/server/template-repo';

describe('templateRepo', () => {
  let env: Awaited<ReturnType<typeof createTestEnv>>;

  beforeEach(async () => {
    env = await createTestEnv();
  });

  const landingConverter = {
    slug: 'landing-converter',
    nombre: 'Landing Converter',
    descripcionCorta: 'Landing de alta conversión',
    descripcionLarga: 'Landing page con hero animado, secciones modulares...',
    precioUsd: 290,
    categoria: 'landing' as const,
    stack: JSON.stringify(['Next.js 16', 'Tailwind v4', 'Resend']),
    incluye: JSON.stringify(['Código fuente MIT', 'Setup guiado']),
    noIncluye: JSON.stringify(['Diseño custom', 'Soporte post-compra']),
    tiempoEntregaDias: 3,
    destacado: true,
  };

  it('create persiste correctamente', async () => {
    const row = await create(env.db, landingConverter);
    expect(row.slug).toBe('landing-converter');
    expect(row.precioUsd).toBe(290);
    expect(row.destacado).toBe(true);
    expect(JSON.parse(row.stack)).toContain('Next.js 16');
  });

  it('getBySlug devuelve el template correcto', async () => {
    await create(env.db, landingConverter);
    const t = await getBySlug(env.db, 'landing-converter');
    expect(t?.nombre).toBe('Landing Converter');
  });

  it('getBySlug devuelve null si no existe', async () => {
    expect(await getBySlug(env.db, 'no-such')).toBeNull();
  });

  it('listAll ordena por destacado primero, luego precio desc', async () => {
    await create(env.db, { ...landingConverter, slug: 'a', precioUsd: 100, destacado: false });
    await create(env.db, { ...landingConverter, slug: 'b', precioUsd: 500, destacado: true });
    await create(env.db, { ...landingConverter, slug: 'c', precioUsd: 300, destacado: true });
    await create(env.db, { ...landingConverter, slug: 'd', precioUsd: 200, destacado: false });

    const list = await listAll(env.db);
    expect(list[0].slug).toBe('b'); // featured + mayor precio
    expect(list[1].slug).toBe('c'); // featured + 300
    expect(list[2].slug).toBe('d'); // not featured, 200
    expect(list[3].slug).toBe('a'); // not featured, 100
  });

  it('listDestacados devuelve solo los featured', async () => {
    await create(env.db, { ...landingConverter, slug: 'a', destacado: true });
    await create(env.db, { ...landingConverter, slug: 'b', destacado: false });
    const list = await listDestacados(env.db);
    expect(list).toHaveLength(1);
    expect(list[0].slug).toBe('a');
  });

  it('listByCategory filtra correctamente', async () => {
    await create(env.db, { ...landingConverter, slug: 'landing-1', categoria: 'landing' });
    await create(env.db, { ...landingConverter, slug: 'dash-1', categoria: 'dashboard' });
    await create(env.db, { ...landingConverter, slug: 'landing-2', categoria: 'landing' });

    const landings = await listByCategory(env.db, 'landing');
    expect(landings).toHaveLength(2);
  });

  it('updateBySlug modifica campos específicos', async () => {
    await create(env.db, landingConverter);
    const updated = await updateBySlug(env.db, 'landing-converter', {
      precioUsd: 390,
      destacado: false,
    });
    expect(updated?.precioUsd).toBe(390);
    expect(updated?.destacado).toBe(false);
    expect(updated?.nombre).toBe('Landing Converter'); // sin cambio
  });

  it('deleteBySlug borra el template', async () => {
    await create(env.db, landingConverter);
    await deleteBySlug(env.db, 'landing-converter');
    expect(await getBySlug(env.db, 'landing-converter')).toBeNull();
  });

  it('create con slug duplicado lanza UNIQUE violation', async () => {
    await create(env.db, landingConverter);
    await expect(create(env.db, landingConverter)).rejects.toThrow();
  });
});
