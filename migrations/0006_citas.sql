-- 0006_citas.sql — Citas de scoping por videollamada (Meet).
--
-- Flujo: el cliente cotiza en /cotizador -> agenda una llamada en /agendar ->
-- se persiste la cita con el precio ESTIMADO que devuelve el cotizador
-- (recomputado en el servidor; nunca se confía en el total del cliente).
--
-- meet_url se llena solo si hay credenciales de Google Calendar configuradas
-- (GOOGLE_CALENDAR_*). Sin ellas la cita queda en estado 'pendiente' y el
-- operador confirma el enlace desde /admin/citas.

CREATE TABLE IF NOT EXISTS cita (
  id TEXT PRIMARY KEY,

  -- Vinculos opcionales. user_id: cliente autenticado en el portal.
  -- licitacion_id: la licitacion que origino el presupuesto cotizado.
  user_id TEXT REFERENCES user(id) ON DELETE SET NULL,
  licitacion_id TEXT REFERENCES licitacion(id) ON DELETE SET NULL,

  -- Snapshot del cliente (puede agendar sin tener cuenta).
  nombre TEXT NOT NULL,
  email TEXT NOT NULL,
  telefono TEXT,
  empresa TEXT,

  -- Agendamiento. fecha = epoch ms (UTC) del INICIO de la llamada.
  -- America/Bogota es UTC-5 fijo (sin horario de verano desde 1992).
  fecha INTEGER NOT NULL,
  duracion_min INTEGER NOT NULL DEFAULT 60,
  timezone TEXT NOT NULL DEFAULT 'America/Bogota',

  -- Videollamada.
  meet_url TEXT,
  meet_id TEXT,
  calendar_event_id TEXT,

  -- Estado del ciclo de vida de la cita.
  estado TEXT NOT NULL DEFAULT 'pendiente',

  -- Snapshot del presupuesto del cotizador (recomputado server-side).
  banda TEXT,
  precio_min REAL,
  precio_max REAL,
  horas_estimadas REAL,
  engagement TEXT,
  features_json TEXT,
  modifiers_json TEXT,

  notas TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch('subsec') * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch('subsec') * 1000)
);

CREATE INDEX IF NOT EXISTS idx_cita_fecha ON cita(fecha);
CREATE INDEX IF NOT EXISTS idx_cita_user ON cita(user_id);
CREATE INDEX IF NOT EXISTS idx_cita_email ON cita(email);
CREATE INDEX IF NOT EXISTS idx_cita_estado ON cita(estado);

-- Red de seguridad contra la doble reserva: dos clientes que pulsan "reservar"
-- a la vez en el mismo slot no pueden crear dos citas. El índice es PARCIAL:
-- solo bloquea las citas que ocupan el calendario (las canceladas liberan
-- el slot y pueden repetirse en la misma hora).
CREATE UNIQUE INDEX IF NOT EXISTS idx_cita_slot_unico
  ON cita(fecha) WHERE estado != 'cancelada';
