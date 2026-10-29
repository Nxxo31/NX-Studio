-- Newsletter (v0.11.0)
--
-- Captura de email para nutrir leads que no estan listos para contratar.
-- Doble opt-in NO implementado (el operador decide): el estado permite
-- dar de baja manualmente sin perder el historial.

CREATE TABLE IF NOT EXISTS newsletter_subscriber (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  locale TEXT,
  source TEXT,
  status TEXT NOT NULL DEFAULT 'activo' CHECK (status IN ('activo', 'baja')),
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_newsletter_created ON newsletter_subscriber(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_newsletter_status ON newsletter_subscriber(status, created_at DESC);
