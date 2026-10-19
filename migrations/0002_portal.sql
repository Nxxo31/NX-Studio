-- Portal Cliente (B7)
-- Sesiones separadas de better-auth por seguridad.
-- Schema: 10 proyectos y licitaciones.
--
-- Nota: portal_session añade 'token' y 'updated_at' (no listados en el spec
-- funcional T01) porque better-auth mapea esta tabla a la sesión de su
-- adapter Drizzle y requiere esas columnas para identificar/actualizar
-- sesiones. Sin ellas createPortalAuth tira "Drizzle schema mismatch".
-- Ambas son populated automáticamente por better-auth en signIn/signOut.

CREATE TABLE IF NOT EXISTS portal_session (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  ip_address TEXT,
  user_agent TEXT,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch('subsec') * 1000)
);
CREATE INDEX IF NOT EXISTS idx_portal_session_user ON portal_session(user_id);

CREATE TABLE IF NOT EXISTS portal_activity (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  payload TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_portal_activity_user_created ON portal_activity(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_portal_activity_entity ON portal_activity(entity_type, entity_id);

CREATE TABLE IF NOT EXISTS portal_message (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  body TEXT NOT NULL,
  read_at INTEGER,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_portal_message_user_created ON portal_message(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS milestone (
  id TEXT PRIMARY KEY,
  proyecto_id TEXT NOT NULL REFERENCES proyecto(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  due_date INTEGER,
  completed_at INTEGER,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_milestone_proyecto ON milestone(proyecto_id, created_at);
CREATE INDEX IF NOT EXISTS idx_milestone_status ON milestone(status, due_date);

-- Extensión de proyecto para portal cliente
ALTER TABLE proyecto ADD COLUMN cliente_id TEXT REFERENCES user(id);
ALTER TABLE proyecto ADD COLUMN portal_visible INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_proyecto_cliente ON proyecto(cliente_id) WHERE cliente_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_proyecto_portal_visible ON proyecto(portal_visible) WHERE portal_visible = 1;
