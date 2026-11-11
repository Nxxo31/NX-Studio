// Lógica de agendar cita — función pura, testeable sin HTTP.
//
// El wrapper Astro en src/pages/api/agenda/cita.ts solo hace request →
// handleAgendarCita.
//
// Regla de oro: el precio NUNCA viene del cliente. Se recomputa con
// computeQuote a partir de (engagement, features, modifiers) y ese es el
// snapshot que se guarda en la cita. Si el cliente manipula los totales, la
// cita guardará la cifra correcta.

import { z } from 'zod';
import type { DB } from '~/db';
import { computeQuote, FEATURES, type EngagementShape } from '~/data/pricing';
import type { EmailService } from '~/lib/email';
import { DURACION_MINUTOS, slotsDisponibles, fechaLocalBogota, horaLocalBogota } from '~/lib/agenda';
import { crearEventoMeet, type CalendarEnv } from '~/lib/google-calendar';
import { create, existeReservaEn, listReservasEnRango } from '~/server/cita-repo';

export const agendarCitaSchema = z.object({
  nombre: z.string().min(2, 'Nombre requerido').max(120),
  email: z.string().email('Email inválido'),
  telefono: z.string().max(40).optional().nullable(),
  empresa: z.string().max(120).optional().nullable(),
  notas: z.string().max(1000).optional().nullable(),
  /** Epoch ms (UTC) del inicio del slot elegido. */
  inicio: z.number().int().positive(),
  /** Origen del presupuesto: el cotizador manda engagement + features. */
  engagement: z.enum(['fixed', 'retainer', 'dedicated', 'tm']).default('fixed'),
  features: z.array(z.string()).default([]),
  modifiers: z.array(z.string()).default([]),
  /** Id de la licitacion previa, si el cliente ya había enviado el form. */
  licitacion_id: z.string().uuid().optional().nullable(),
  honeypot: z.string().optional(),
});

export type AgendarCitaInput = z.infer<typeof agendarCitaSchema>;

export type AgendarDeps = {
  db: DB;
  email: EmailService;
  contactEmail: string;
  calendar: CalendarEnv;
  /** Resuelve el user_id si hay sesión (opcional — la cita puede ser anónima). */
  resolveUserId?: () => Promise<string | null>;
};

export type AgendarResult =
  | {
      ok: true;
      cita_id: string;
      fecha: string;
      hora: string;
      duracion_min: number;
      meet_url: string | null;
      /** 'automatica' = se creó el Meet al vuelo; 'pendiente' = el operador lo confirma. */
      meet_estado: 'automatica' | 'pendiente';
      presupuesto: {
        total_low: number;
        total_high: number;
        band: string;
        total_hours: number;
      };
    }
  | {
      ok: false;
      error: 'spam_detected' | 'validation' | 'slot_no_disponible' | 'internal';
      issues?: z.ZodError['issues'];
      detail?: string;
    };

/**
 * Procesa el agendamiento de una cita:
 * 1. Valida con Zod + honeypot
 * 2. Recomputa el presupuesto (server-side)
 * 3. Verifica que el slot siga libre
 * 4. Crea el evento de Google Meet (si hay credenciales)
 * 5. Persiste la cita
 * 6. Avisa por email al cliente y al operador (no bloqueante)
 */
export async function handleAgendarCita(
  rawBody: unknown,
  deps: AgendarDeps
): Promise<AgendarResult> {
  try {
    const body = rawBody as Record<string, unknown> | null;
    if (!body) return { ok: false, error: 'validation' };

    // Honeypot anti-spam
    if (typeof body.honeypot === 'string' && body.honeypot.length > 0) {
      return { ok: false, error: 'spam_detected' };
    }

    const parsed = agendarCitaSchema.safeParse(body);
    if (!parsed.success) {
      return { ok: false, error: 'validation', issues: parsed.error.issues };
    }
    const data = parsed.data;

    // ── 1. Presupuesto recalculado en el servidor ───────────────────────
    const quote = computeQuote({
      shape: data.engagement,
      featureIds: data.features,
      modifierIds: data.modifiers,
    });

    // ── 2. Verificar que el slot sigue libre ────────────────────────────
    const inicio = new Date(data.inicio);
    const fechaLocal = fechaLocalBogota(inicio.getTime());

    // Las reservas reales del día (pendientes y confirmadas) son las que
    // bloquean el calendario. Sin esta consulta, dos clientes podrían
    // reservar el mismo slot a la vez.
    const reservas = await listReservasEnRango(
      deps.db,
      new Date(`${fechaLocal}T00:00:00-05:00`),
      new Date(`${fechaLocal}T23:59:59-05:00`)
    ).catch(() => []);

    const slots = slotsDisponibles(fechaLocal, fechaLocal, reservas, Date.now());
    const slotValido = slots.some((s) => s.inicio === inicio.getTime());

    if (!slotValido) {
      // Puede ser un slot ya reservado (o fuera de la agenda) — en ambos
      // casos el cliente debe elegir otro.
      const yaReservado = await existeReservaEn(deps.db, inicio).catch(() => false);
      return { ok: false, error: 'slot_no_disponible', detail: yaReservado ? 'reservado' : 'fuera_de_agenda' };
    }

    // ── 3. Crear la videollamada ────────────────────────────────────────
    const featureNames = data.features
      .map((id) => FEATURES.find((f) => f.id === id)?.name ?? id)
      .filter(Boolean);

    const evento = await crearEventoMeet(deps.calendar, {
      titulo: `Scoping NX-Studio · ${data.nombre}`,
      descripcion: [
        `Cliente: ${data.nombre} <${data.email}>`,
        data.empresa ? `Empresa: ${data.empresa}` : null,
        `Presupuesto estimado: $${quote.totalLow.toLocaleString()} - $${quote.totalHigh.toLocaleString()} (${quote.bandLabel})`,
        `Horas estimadas: ${quote.totalHours}h`,
        featureNames.length ? `Incluye: ${featureNames.join(', ')}` : null,
        data.notas ? `Notas: ${data.notas}` : null,
      ]
        .filter(Boolean)
        .join('\n'),
      inicio: inicio.getTime(),
      duracionMinutos: DURACION_MINUTOS,
      attendees: [{ email: data.email, nombre: data.nombre }],
    });

    // ── 4. Persistir ────────────────────────────────────────────────────
    const resolveUserId = deps.resolveUserId ?? (async () => null);
    const userId = await resolveUserId().catch(() => null);

    let row: Awaited<ReturnType<typeof create>>;
    try {
      row = await create(deps.db, {
        nombre: data.nombre,
        email: data.email,
        telefono: data.telefono ?? null,
        empresa: data.empresa ?? null,
        fecha: inicio,
        duracionMin: DURACION_MINUTOS,
        userId,
        licitacionId: data.licitacion_id ?? null,
        meetUrl: evento?.meetUrl ?? null,
        calendarEventId: evento?.eventId ?? null,
        estado: evento ? 'confirmada' : 'pendiente',
        banda: quote.bandLabel,
        precioMin: quote.totalLow,
        precioMax: quote.totalHigh,
        horasEstimadas: quote.totalHours,
        engagement: data.engagement,
        featuresJson: JSON.stringify(data.features),
        modifiersJson: JSON.stringify(data.modifiers),
        notas: data.notas ?? null,
      });
    } catch (err) {
      // El índice único (idx_cita_slot_unico) es la red de seguridad contra
      // la carrera: dos requests simultáneos sobre el mismo slot.
      const mensaje = err instanceof Error ? err.message : String(err);
      if (mensaje.includes('UNIQUE') || mensaje.includes('constraint')) {
        console.warn('Cita duplicada en el mismo slot (carrera):', mensaje.slice(0, 120));
        return { ok: false, error: 'slot_no_disponible', detail: 'reservado' };
      }
      throw err;
    }

    // ── 5. Emails (no bloqueantes) ──────────────────────────────────────
    const meetEstado = evento ? 'automatica' : 'pendiente';
    const fechaLegible = `${fechaLocal} ${horaLocalBogota(inicio.getTime())}`;

    try {
      await deps.email.send({
        to: data.email,
        subject: `[NX-Studio] Tu llamada está agendada · ${fechaLegible}`,
        html: `
          <h2>Tu llamada con NX-Studio está agendada</h2>
          <p><b>Fecha:</b> ${escapeHtml(fechaLegible)} (hora de Bogotá, ${DURACION_MINUTOS} minutos)</p>
          ${
            evento
              ? `<p><b>Enlace de la videollamada:</b> <a href="${escapeHtml(evento.meetUrl)}">${escapeHtml(evento.meetUrl)}</a></p>
                 <p>Entra al enlace un par de minutos antes. Si no puedes, responde este correo y lo movemos.</p>`
              : `<p>Estamos confirmando el enlace de la videollamada. Te lo enviamos por este mismo correo en cuanto esté listo.</p>`
          }
          <hr/>
          <p><b>Resumen del presupuesto que we're cotizando:</b></p>
          <p>Rango estimado: <b>$${quote.totalLow.toLocaleString()} – $${quote.totalHigh.toLocaleString()}</b> (banda ${quote.bandLabel}) · ${quote.totalHours}h estimadas</p>
          <p>En la llamada revisamos el alcance y ajustamos ese rango. El precio final se define después, con el alcance cerrado.</p>
          <p>Referencia de la cita: <code>${row.id}</code></p>
        `,
        text: `Tu llamada con NX-Studio está agendada para ${fechaLegible} (${DURACION_MINUTOS} min, hora de Bogotá). ${
          evento ? `Enlace: ${evento.meetUrl}` : 'Te enviamos el enlace de videollamada por este correo en breve.'
        } Presupuesto estimado: $${quote.totalLow} – $${quote.totalHigh} (${quote.bandLabel}). Referencia: ${row.id}`,
      });
    } catch (err) {
      console.error('Email al cliente falló (la cita ya está reservada):', err);
    }

    try {
      await deps.email.send({
        to: deps.contactEmail,
        replyTo: data.email,
        subject: `[NX-Studio] Cita agendada #${row.id.slice(0, 8)} · ${data.nombre}`,
        html: `
          <h2>Nueva cita agendada</h2>
          <p><b>Cliente:</b> ${escapeHtml(data.nombre)} &lt;${escapeHtml(data.email)}&gt;</p>
          ${data.empresa ? `<p><b>Empresa:</b> ${escapeHtml(data.empresa)}</p>` : ''}
          ${data.telefono ? `<p><b>Teléfono:</b> ${escapeHtml(data.telefono)}</p>` : ''}
          <p><b>Fecha:</b> ${escapeHtml(fechaLegible)} · ${DURACION_MINUTOS} min</p>
          <p><b>Presupuesto cotizado:</b> $${quote.totalLow.toLocaleString()} – $${quote.totalHigh.toLocaleString()} (${quote.bandLabel}) · ${quote.totalHours}h</p>
          ${featureNames.length ? `<p><b>Features:</b> ${escapeHtml(featureNames.join(', '))}</p>` : ''}
          ${data.notas ? `<p><b>Notas:</b> ${escapeHtml(data.notas)}</p>` : ''}
          <p><b>Meet:</b> ${evento ? `<a href="${escapeHtml(evento.meetUrl)}">${escapeHtml(evento.meetUrl)}</a>` : 'PENDIENTE — confirmar enlace en /admin/citas'}</p>
          <p><b>ID de la cita:</b> ${row.id}</p>
        `,
      });
    } catch (err) {
      console.error('Email al operador falló (la cita ya está reservada):', err);
    }

    return {
      ok: true,
      cita_id: row.id,
      fecha: fechaLocal,
      hora: horaLocalBogota(inicio.getTime()),
      duracion_min: DURACION_MINUTOS,
      meet_url: evento?.meetUrl ?? null,
      meet_estado: meetEstado,
      presupuesto: {
        total_low: quote.totalLow,
        total_high: quote.totalHigh,
        band: quote.bandLabel,
        total_hours: quote.totalHours,
      },
    };
  } catch (err) {
    console.error('agendar cita error:', err);
    return { ok: false, error: 'internal', detail: String(err) };
  }
}

function escapeHtml(s: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return s.split('').map((ch) => map[ch] ?? ch).join('');
}
