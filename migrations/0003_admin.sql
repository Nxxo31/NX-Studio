-- Admin Panel (B8)
-- audit_log INMUTABLE via trigger SQL

CREATE TABLE IF NOT EXISTS admin_session (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'gatekeeper', 'designer', 'dev')),
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_admin_session_user ON admin_session(user_id);

CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  actor_user_id TEXT NOT NULL REFERENCES user(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  before_json TEXT,
  after_json TEXT,
  ip TEXT,
  user_agent TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON audit_log(actor_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_resource ON audit_log(resource_type, resource_id, created_at DESC);

CREATE TRIGGER IF NOT EXISTS audit_log_no_update
BEFORE UPDATE ON audit_log
BEGIN
  SELECT RAISE(ABORT, 'audit_log is immutable: cannot update');
END;
CREATE TRIGGER IF NOT EXISTS audit_log_no_delete
BEFORE DELETE ON audit_log
BEGIN
  SELECT RAISE(ABORT, 'audit_log is immutable: cannot delete');
END;

CREATE TABLE IF NOT EXISTS deploy_log (
  id TEXT PRIMARY KEY,
  version_id TEXT NOT NULL,
  commit_sha TEXT,
  branch TEXT,
  environment TEXT NOT NULL DEFAULT 'production' CHECK (environment IN ('production', 'preview', 'local')),
  worker_startup_ms INTEGER,
  status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failed', 'in_progress')),
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_deploy_log_created ON deploy_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deploy_log_branch ON deploy_log(branch, created_at DESC);