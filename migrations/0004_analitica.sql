-- Analitica de captacion (v0.11.0)
--
-- 1) Atribucion por lead: de donde vino el contacto (utm + referrer + landing).
--    Sin esto no hay forma de saber que campana o canal trae clientes.
-- 2) Eventos de primera parte (page views + conversiones) en D1: los datos
--    existen aunque no se configure ningun proveedor externo (Plausible).
-- 3) Trazabilidad del envio de email: si la notificacion al operador falla,
--    el lead queda en D1 con email_sent=0 y el admin lo muestra.

ALTER TABLE licitacion ADD COLUMN utm_source TEXT;
ALTER TABLE licitacion ADD COLUMN utm_medium TEXT;
ALTER TABLE licitacion ADD COLUMN utm_campaign TEXT;
ALTER TABLE licitacion ADD COLUMN utm_content TEXT;
ALTER TABLE licitacion ADD COLUMN utm_term TEXT;
ALTER TABLE licitacion ADD COLUMN referrer TEXT;
ALTER TABLE licitacion ADD COLUMN landing_path TEXT;
ALTER TABLE licitacion ADD COLUMN email_sent INTEGER NOT NULL DEFAULT 0;
ALTER TABLE licitacion ADD COLUMN email_error TEXT;

CREATE INDEX IF NOT EXISTS idx_licitacion_utm_source ON licitacion(utm_source, created_at DESC);

CREATE TABLE IF NOT EXISTS analytics_event (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  path TEXT,
  locale TEXT,
  utm_source TEXT,
  referrer TEXT,
  props TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_analytics_event_created ON analytics_event(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_event_name ON analytics_event(name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_event_source ON analytics_event(utm_source, created_at DESC);
