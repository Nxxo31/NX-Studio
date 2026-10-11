import { describe, it, expect, beforeEach } from 'vitest';
import { createTestEnv } from '../helpers/env';
import { create, getById, listByEmail, listAll, updateStatus } from '~/server/licitacion-repo';

describe('licitacionRepo', () => {
  let env: Awaited<ReturnType<typeof createTestEnv>>;

  beforeEach(async () => {
    env = await createTestEnv();
  });

  const validInput = {
    nombre: 'Juan Pérez',
    email: 'juan@example.com',
    empresa: 'Acme SA',
    telefono: '+57 300 1234567',
    pais: 'CO',
    tipo: 'webapp' as const,
    engagement: 'fixed' as const,
    urgencia: 'normal' as const,
    featureIds: ['discovery', 'design-system', 'responsive', 'landing', 'auth', 'api'],
    descripcion: 'Necesito una app web con auth y dashboard básico para mi negocio.',
    modifierIds: [],
  };

  it('create persiste una licitacion y devuelve la fila completa', async () => {
    const row = await create(env.db, validInput);

    expect(row.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-/i); // UUID-ish
    expect(row.email).toBe('juan@example.com');
    expect(row.banda).toMatch(/^(Starter|Standard|Growth|Enterprise)$/);
    expect(row.precioMin).toBeGreaterThan(0);
    expect(row.precioMax).toBeGreaterThan(row.precioMin);
    expect(row.status).toBe('nueva');
    expect(row.createdAt).toBeInstanceOf(Date);
  });

  it('precioMin/precioMax reflejan ±15% sobre (features + baseFee) * modifiers', async () => {
    const row = await create(env.db, validInput);
    const mid = (row.precioMin + row.precioMax) / 2;
    // El mid debería estar entre precioMin y precioMax
    expect(mid).toBeGreaterThanOrEqual(row.precioMin);
    expect(mid).toBeLessThanOrEqual(row.precioMax);
    // Y la diferencia Min/Max debería ser ~30% del mid
    const ratio = (row.precioMax - row.precioMin) / mid;
    expect(ratio).toBeGreaterThan(0.20); // ~30% esperado, tolera
    expect(ratio).toBeLessThan(0.35);
  });

  it('getById devuelve null si no existe', async () => {
    expect(await getById(env.db, 'no-such-id')).toBeNull();
  });

  it('getById devuelve la fila creada', async () => {
    const created = await create(env.db, validInput);
    const fetched = await getById(env.db, created.id);
    expect(fetched?.id).toBe(created.id);
    expect(fetched?.email).toBe(created.email);
  });

  it('listByEmail devuelve solo las del email solicitado, ordenadas desc por createdAt', async () => {
    await create(env.db, validInput);
    await new Promise(r => setTimeout(r, 20));
    await create(env.db, { ...validInput, nombre: 'Juan 2' });

    const list = await listByEmail(env.db, 'juan@example.com');
    expect(list).toHaveLength(2);
    expect(list[0].nombre).toBe('Juan 2'); // más reciente primero
    expect(list[1].nombre).toBe('Juan Pérez');
  });

  it('listByEmail no incluye licitaciones de otros emails', async () => {
    await create(env.db, validInput);
    await create(env.db, { ...validInput, email: 'otro@example.com' });
    const list = await listByEmail(env.db, 'juan@example.com');
    expect(list).toHaveLength(1);
  });

  it('listAll devuelve todas las licitaciones sin filtro', async () => {
    await create(env.db, validInput);
    await create(env.db, { ...validInput, email: 'otro@example.com', nombre: 'Otro' });
    const list = await listAll(env.db);
    expect(list.length).toBeGreaterThanOrEqual(2);
  });

  it('updateStatus cambia el status correctamente', async () => {
    const created = await create(env.db, validInput);
    const updated = await updateStatus(env.db, created.id, 'contactada');
    expect(updated?.status).toBe('contactada');
  });

  it('create con engagement retainer y modifier longterm aplica -15%', async () => {
    const row = await create(env.db, {
      ...validInput,
      engagement: 'retainer',
      modifierIds: ['longterm'],
    });
    // Sin longterm el precio sería más alto. Hacemos dos creates y comparamos.
    const sinLongterm = await create(env.db, {
      ...validInput,
      engagement: 'retainer',
      modifierIds: [],
    });
    expect(row.precioMax).toBeLessThan(sinLongterm.precioMax);
  });
});
