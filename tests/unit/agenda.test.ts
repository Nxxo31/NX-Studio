// Tests de la lógica de agenda (slots, zona horaria, solapamiento).
//
// La agenda es la pieza que decide si el cliente puede reservar. Un error
// aquí significa: doble reserva, slot en hora equivocada, o un hueco en el
// horario laboral.

import { describe, it, expect } from 'vitest';
import {
  BOGOTA_UTC_OFFSET_MINUTES,
  DIAS_CON_AGENDA,
  DURACION_MINUTOS,
  bogotaLocalToUtc,
  fechaLocalBogota,
  generarSlots,
  horaLocalBogota,
  masDiasLocalBogota,
  seSolapan,
  slotsDisponibles,
  utcToBogotaParts,
} from '~/lib/agenda';

describe('agenda · zona horaria Bogotá', () => {
  it('convierte hora local a UTC con el offset de Colombia', () => {
    // 09:00 en Bogotá (UTC-5) = 14:00 UTC.
    const inicio = bogotaLocalToUtc(2026, 11, 12, 9 * 60);
    expect(new Date(inicio).toISOString()).toBe('2026-11-12T14:00:00.000Z');
  });

  it('el offset es -300 minutos (UTC-5, sin horario de verano)', () => {
    expect(BOGOTA_UTC_OFFSET_MINUTES).toBe(-300);
  });

  it('convierte UTC a hora local de Bogotá', () => {
    const partes = utcToBogotaParts(Date.parse('2026-11-12T14:00:00.000Z'));
    expect(partes.anio).toBe(2026);
    expect(partes.mes).toBe(11);
    expect(partes.dia).toBe(12);
    expect(partes.minutos).toBe(9 * 60);
  });

  it('ida y vuelta: local → UTC → local conserva la hora', () => {
    const original = 15 * 60 + 30;
    const utc = bogotaLocalToUtc(2026, 3, 15, original);
    const partes = utcToBogotaParts(utc);
    expect(partes.minutos).toBe(original);
    expect(partes.dia).toBe(15);
  });

  it('formatea fecha y hora locales', () => {
    const utc = bogotaLocalToUtc(2026, 12, 5, 17 * 60);
    expect(fechaLocalBogota(utc)).toBe('2026-12-05');
    expect(horaLocalBogota(utc)).toBe('17:00');
  });
});

describe('agenda · generación de slots', () => {
  it('solo genera slots en días laborales (lun-vie)', () => {
    // 2026-11-14 es sábado, 2026-11-16 es lunes.
    const sabado = generarSlots('2026-11-14', '2026-11-14');
    const lunes = generarSlots('2026-11-16', '2026-11-16');
    expect(sabado).toHaveLength(0);
    expect(lunes.length).toBeGreaterThan(0);
  });

  it('respeta las dos franjas laborales (mañana y tarde)', () => {
    const slots = generarSlots('2026-11-16', '2026-11-16');
    const horas = slots.map((s) => s.etiqueta);
    // Empieza a las 09:00 y la última franja termina antes de las 17:00.
    expect(horas[0]).toBe('09:00');
    expect(horas).toContain('11:15');
    // No hay slots entre las 12:00 y las 14:00 (hora de almuerzo).
    expect(horas).not.toContain('12:30');
    expect(horas).not.toContain('13:00');
  });

  it('el último slot cabe completo dentro de la franja', () => {
    const slots = generarSlots('2026-11-16', '2026-11-16');
    const ultimo = slots[slots.length - 1];
    const finLocal = utcToBogotaParts(ultimo.fin);
    expect(finLocal.minutos).toBeLessThanOrEqual(17 * 60);
  });

  it('cada slot dura lo declarado', () => {
    const slots = generarSlots('2026-11-16', '2026-11-16');
    for (const slot of slots) {
      expect(slot.fin - slot.inicio).toBe(DURACION_MINUTOS * 60_000);
    }
  });

  it('los días con agenda son lunes a viernes', () => {
    expect([...DIAS_CON_AGENDA].sort()).toEqual([1, 2, 3, 4, 5]);
  });
});

describe('agenda · disponibilidad', () => {
  const ahora = bogotaLocalToUtc(2026, 11, 10, 10 * 60); // martes 10:00

  it('excluye los slots que ya están reservados', () => {
    const libres = slotsDisponibles('2026-11-16', '2026-11-16', [], ahora);
    const objetivo = libres[0];
    expect(objetivo).toBeDefined();

    const conReserva = slotsDisponibles(
      '2026-11-16',
      '2026-11-16',
      [{ inicio: objetivo.inicio, fin: objetivo.fin }],
      ahora
    );
    expect(conReserva.some((s) => s.inicio === objetivo.inicio)).toBe(false);
    expect(conReserva.length).toBeLessThan(libres.length);
  });

  it('una reserva bloquea también los slots que se solapan con ella', () => {
    // La llamada dura 45 min y la grilla es de 15: una reserva de 09:00–09:45
    // choca con 09:15 y 09:30 (el operador está ocupado). Es lo correcto:
    // el operador no puede estar en dos llamadas a la vez.
    const libres = slotsDisponibles('2026-11-16', '2026-11-16', [], ahora);
    const objetivo = libres[0]; // 09:00
    const conReserva = slotsDisponibles(
      '2026-11-16',
      '2026-11-16',
      [{ inicio: objetivo.inicio, fin: objetivo.fin }],
      ahora
    );
    // 09:15 y 09:30 quedan fuera; 09:45 (que empieza justo al terminar) sigue.
    const etiquetas = conReserva.map((s) => s.etiqueta);
    expect(etiquetas).not.toContain('09:00');
    expect(etiquetas).not.toContain('09:15');
    expect(etiquetas).not.toContain('09:30');
    expect(etiquetas).toContain('09:45');
  });

  it('excluye slots que se solapan parcialmente', () => {
    const libres = slotsDisponibles('2026-11-16', '2026-11-16', [], ahora);
    const objetivo = libres[2];
    // Reserva que empieza 10 min después del slot y dura 20: solapa.
    const solapada = slotsDisponibles(
      '2026-11-16',
      '2026-11-16',
      [{ inicio: objetivo.inicio + 10 * 60_000, fin: objetivo.inicio + 30 * 60_000 }],
      ahora
    );
    expect(solapada.some((s) => s.inicio === objetivo.inicio)).toBe(false);
  });

  it('respeta la anticipación mínima de 12 horas', () => {
    // "ahora" = martes 10/11 a las 10:00 Bogotá. Un slot del mismo día a las
    // 14:00 está a solo 4 horas → no se puede reservar. Uno del día siguiente
    // a las 09:00 está a 23 horas → sí.
    const mismoDia = slotsDisponibles('2026-11-10', '2026-11-10', [], ahora);
    expect(mismoDia).toHaveLength(0);

    const manana = slotsDisponibles('2026-11-11', '2026-11-11', [], ahora);
    expect(manana.length).toBeGreaterThan(0);
    expect(manana[0].etiqueta).toBe('09:00');
  });

  it('excluye slots del pasado', () => {
    const slots = slotsDisponibles('2026-11-09', '2026-11-09', [], ahora);
    expect(slots).toHaveLength(0);
  });

  it('no devuelve nada si el rango está invertido', () => {
    expect(slotsDisponibles('2026-11-20', '2026-11-10', [], ahora)).toHaveLength(0);
  });
});

describe('agenda · solapamiento', () => {
  it('detecta intervalos que se cruzan', () => {
    expect(
      seSolapan({ inicio: 0, fin: 100 }, { inicio: 50, fin: 150 })
    ).toBe(true);
    expect(
      seSolapan({ inicio: 0, fin: 100 }, { inicio: 100, fin: 150 })
    ).toBe(false);
    expect(
      seSolapan({ inicio: 0, fin: 100 }, { inicio: 200, fin: 300 })
    ).toBe(false);
  });
});

describe('agenda · helpers de fecha', () => {
  it('masDiasLocalBogota avanza días', () => {
    const hoy = '2026-11-10';
    expect(masDiasLocalBogota(3, bogotaLocalToUtc(2026, 11, 10, 12 * 60))).toBe('2026-11-13');
    expect(hoy).toBe('2026-11-10');
  });
});
