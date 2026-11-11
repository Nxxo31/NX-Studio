// GET /api/agenda/disponibilidad
//
// Slots libres para agendar una llamada de scoping. Público (no requiere
// sesión): el cotizador es público y el cliente puede ver la agenda antes de
// decidir si deja sus datos.
//
// Query params:
//   desde — "YYYY-MM-DD" (local Bogotá). Default: hoy.
//   hasta — "YYYY-MM-DD" (local Bogotá). Default: hoy + 14 días.
//
// Respuesta:
//   { ok, timezone, duracion_min, slots: [{ inicio, fin, etiqueta, fecha }] }

import type { APIRoute } from 'astro';
import { env as runtimeEnv } from 'cloudflare:workers';
import { createDb } from '~/db';
import {
  DIAS_HORIZONTE,
  DURACION_MINUTOS,
  TIMEZONE,
  hoyLocalBogota,
  masDiasLocalBogota,
  slotsDisponibles,
} from '~/lib/agenda';
import { listReservasEnRango } from '~/server/cita-repo';

export const prerender = false;

const FECHA_RE = /^\d{4}-\d{2}-\d{2}$/;

export const GET: APIRoute = async ({ url }) => {
  const hoy = hoyLocalBogota();
  const desde = url.searchParams.get('desde') ?? hoy;
  const hasta = url.searchParams.get('hasta') ?? masDiasLocalBogota(14);

  if (!FECHA_RE.test(desde) || !FECHA_RE.test(hasta)) {
    return json({ ok: false, error: 'validation' }, 400);
  }

  // No dejamos consultar más allá del horizonte configurado.
  const limite = masDiasLocalBogota(DIAS_HORIZONTE);
  const desdeFinal = desde < hoy ? hoy : desde;
  const hastaFinal = hasta > limite ? limite : hasta;

  if (hastaFinal < desdeFinal) {
    return json({ ok: true, timezone: TIMEZONE, duracion_min: DURACION_MINUTOS, slots: [] });
  }

  try {
    const env = runtimeEnv as unknown as { DB: D1Database };
    const db = createDb(env.DB);

    // Reservas que bloquean el calendario en el rango pedido (con margen).
    const desdeUtc = new Date(`${desdeFinal}T00:00:00-05:00`);
    const hastaUtc = new Date(`${hastaFinal}T23:59:59-05:00`);
    const reservados = await listReservasEnRango(db, desdeUtc, hastaUtc);

    const slots = slotsDisponibles(desdeFinal, hastaFinal, reservados);

    return json({
      ok: true,
      timezone: TIMEZONE,
      duracion_min: DURACION_MINUTOS,
      slots: slots.map((s) => ({
        inicio: s.inicio,
        fin: s.fin,
        etiqueta: s.etiqueta,
        fecha: s.fecha,
      })),
    });
  } catch (err) {
    console.error('agenda/disponibilidad failed:', err);
    return json({ ok: false, error: 'internal' }, 500);
  }
};

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json',
      'cache-control': 'no-store',
    },
  });
}
