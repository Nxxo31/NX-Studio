// Agenda de citas — lógica pura, sin dependencias de Cloudflare.
//
// El cotizador estimates un precio; el cliente agenda una videollamada de 45
// minutos para revisar el alcance. Este módulo:
//
//   1. Define la agenda laboral del operador (días + franjas Horarias).
//   2. Genera los slots disponibles para un rango de fechas.
//   3. Excluye slots ya reservados.
//
// Zona horaria: America/Bogota es UTC-5 fijo (Colombia no aplica horario de
// verano desde 1992), así que la conversión es aritmética y no depende de la
// zona del servidor. Esto mantiene los slots correctos aunque el runtime
// corra en UTC.

/** Offset de Colombia respecto a UTC, en minutos (negativo). */
export const BOGOTA_UTC_OFFSET_MINUTES = -300;

export const TIMEZONE = 'America/Bogota';

/** Duración de la llamada de scoping, en minutos. */
export const DURACION_MINUTOS = 45;

/**
 * Agenda laboral del operador, en hora local de Bogotá.
 * Lun–Vie 09:00–12:00 y 14:00–17:00.
 */
export const FRANJAS_LABORALES: ReadonlyArray<{ inicio: number; fin: number }> = [
  { inicio: 9 * 60, fin: 12 * 60 },
  { inicio: 14 * 60, fin: 17 * 60 },
];

/** Días de la semana con agenda (0 = domingo … 6 = sábado). */
export const DIAS_CON_AGENDA: ReadonlySet<number> = new Set([1, 2, 3, 4, 5]);

/** Mínimo de horas de anticipación para poder reservar. */
export const HORAS_ANTICIPACION_MINIMA = 12;

/** Máximo de días hacia adelante que se puede reservar. */
export const DIAS_HORIZONTE = 60;

/** Granularidad de la grilla de slots, en minutos. */
export const PASO_SLOT_MINUTOS = 15;

export type Slot = {
  /** Epoch ms (UTC) del inicio del slot. */
  inicio: number;
  /** Epoch ms (UTC) del fin del slot. */
  fin: number;
  /** Etiqueta local "HH:MM" para mostrar en la UI. */
  etiqueta: string;
  /** Fecha local "YYYY-MM-DD". */
  fecha: string;
};

/** Convierte una fecha local de Bogotá a epoch ms (UTC). */
export function bogotaLocalToUtc(anio: number, mes: number, dia: number, minutos: number): number {
  // Bogotá es UTC-5: para tener 09:00 local necesitamos 14:00 UTC, así que
  // sumamos 5 horas al instante UTC de la misma fecha local.
  const base = Date.UTC(anio, mes - 1, dia, 0, 0, 0, 0);
  return base - BOGOTA_UTC_OFFSET_MINUTES * 60_000 + minutos * 60_000;
}

/** Convierte epoch ms (UTC) a fecha local de Bogotá. */
export function utcToBogotaParts(ms: number): {
  anio: number;
  mes: number;
  dia: number;
  minutos: number;
  diaSemana: number;
} {
  const desplazado = new Date(ms + BOGOTA_UTC_OFFSET_MINUTES * 60_000);
  return {
    anio: desplazado.getUTCFullYear(),
    mes: desplazado.getUTCMonth() + 1,
    dia: desplazado.getUTCDate(),
    minutos: desplazado.getUTCHours() * 60 + desplazado.getUTCMinutes(),
    diaSemana: desplazado.getUTCDay(),
  };
}

/** Etiqueta "YYYY-MM-DD" de la fecha local de Bogotá de un instante. */
export function fechaLocalBogota(ms: number): string {
  const p = utcToBogotaParts(ms);
  return `${p.anio}-${String(p.mes).padStart(2, '0')}-${String(p.dia).padStart(2, '0')}`;
}

/** Etiqueta "HH:MM" de la hora local de Bogotá de un instante. */
export function horaLocalBogota(ms: number): string {
  const p = utcToBogotaParts(ms);
  return `${String(Math.floor(p.minutos / 60)).padStart(2, '0')}:${String(p.minutos % 60).padStart(2, '0')}`;
}

/**
 * Genera todos los slots posibles (sin aplicar reservas) dentro de un rango
 * de fechas locales. Devuelve el inicio del slot; el fin se calcula con la
 * duración de la llamada.
 */
export function generarSlots(
  desdeFechaLocal: string,
  hastaFechaLocal: string
): Slot[] {
  const slots: Slot[] = [];

  for (const fecha of iterarFechasLocales(desdeFechaLocal, hastaFechaLocal)) {
    const [anio, mes, dia] = fecha.split('-').map(Number);
    const diaSemana = new Date(Date.UTC(anio, mes - 1, dia)).getUTCDay();
    if (!DIAS_CON_AGENDA.has(diaSemana)) continue;

    for (const franja of FRANJAS_LABORALES) {
      for (
        let minuto = franja.inicio;
        minuto + DURACION_MINUTOS <= franja.fin;
        minuto += PASO_SLOT_MINUTOS
      ) {
        const inicio = bogotaLocalToUtc(anio, mes, dia, minuto);
        slots.push({
          inicio,
          fin: inicio + DURACION_MINUTOS * 60_000,
          etiqueta: `${String(Math.floor(minuto / 60)).padStart(2, '0')}:${String(minuto % 60).padStart(2, '0')}`,
          fecha,
        });
      }
    }
  }

  return slots;
}

/** Itera los días entre dos fechas locales "YYYY-MM-DD", inclusive. */
function iterarFechasLocales(desde: string, hasta: string): string[] {
  const inicio = Date.parse(`${desde}T00:00:00Z`);
  const fin = Date.parse(`${hasta}T00:00:00Z`);
  if (Number.isNaN(inicio) || Number.isNaN(fin) || fin < inicio) return [];

  const fechas: string[] = [];
  const unDia = 86_400_000;
  // Redondeamos al inicio del día para no arrastrar horas del parseo.
  for (let t = Math.floor(inicio / unDia) * unDia; t <= fin; t += unDia) {
    const d = new Date(t);
    fechas.push(
      `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
    );
  }
  return fechas;
}

/**
 * Slots realmente Reservables: dentro de la agenda laboral, con anticipación
 * mínima, dentro del horizonte, y sin chocar con reservas existentes.
 */
export function slotsDisponibles(
  desdeFechaLocal: string,
  hastaFechaLocal: string,
  reservados: ReadonlyArray<{ inicio: number | Date; fin: number | Date }>,
  ahora: number = Date.now()
): Slot[] {
  const ahoraMinimo = ahora + HORAS_ANTICIPACION_MINIMA * 3_600_000;
  const ahoraMaximo = ahora + DIAS_HORIZONTE * 86_400_000;

  return generarSlots(desdeFechaLocal, hastaFechaLocal).filter((slot) => {
    if (slot.inicio < ahoraMinimo) return false;
    if (slot.inicio > ahoraMaximo) return false;
    // Un slot choca si se solapa con cualquier reserva existente.
    const choca = reservados.some((r) => {
      const rInicio = r.inicio instanceof Date ? r.inicio.getTime() : r.inicio;
      const rFin = r.fin instanceof Date ? r.fin.getTime() : r.fin;
      return slot.inicio < rFin && rInicio < slot.fin;
    });
    return !choca;
  });
}

/** Detecta solapamiento entre dos intervalos [inicio, fin). */
export function seSolapan(
  a: { inicio: number; fin: number },
  b: { inicio: number; fin: number }
): boolean {
  return a.inicio < b.fin && b.inicio < a.fin;
}

/** Fecha local de Bogotá de "hoy" (para rangos que empiezan hoy). */
export function hoyLocalBogota(ahora: number = Date.now()): string {
  return fechaLocalBogota(ahora);
}

/** Fecha local de Bogotá de "hoy + N días". */
export function masDiasLocalBogota(dias: number, ahora: number = Date.now()): string {
  return fechaLocalBogota(ahora + dias * 86_400_000);
}
