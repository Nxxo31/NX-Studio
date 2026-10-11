// Fake D1 binding para tests unit/integration.
//
// Por qué existe: D1 es SQLite, pero su API es específica del runtime de
// Cloudflare Workers (D1PreparedStatement, .all(), .first(), .run()). Para
// testear el código de aplicación en Node, montamos un shim que envuelve
// better-sqlite3 y expone la misma superficie que D1Database.
//
// Ref: https://developers.cloudflare.com/d1/platform/client-api/
//
// USO en tests:
//
//   import { fakeD1, applyMigrations } from './d1-fake';
//   const env = { DB: fakeD1(), BETTER_AUTH_SECRET: 'test-secret-...' };
//   await applyMigrations(env.DB);
//   const auth = createAuth(env);
//   const db = createDb(env.DB);
//   // ... tu test

import BetterSqlite3 from 'better-sqlite3';

/**
 * D1PreparedStatement fake.
 * Métodos bind/first/all/run viven en el mismo objeto (D1 devuelve `this`
 * desde bind, no un objeto nuevo). Esto es crítico para que
 * drizzle-orm/d1 pueda hacer `stmt.bind(...).all().then(...)`.
 */
class FakeD1Statement implements D1PreparedStatement {
  private stmt: BetterSqlite3.Statement;
  private boundParams: unknown[] = [];

  constructor(stmt: BetterSqlite3.Statement) {
    this.stmt = stmt;
  }

  bind(...params: unknown[]): D1PreparedStatement {
    this.boundParams = params;
    return this;
  }

  async first<T = unknown>(col?: string): Promise<T | null> {
    try {
      const row = this.boundParams.length
        ? this.stmt.get(...(this.boundParams as never[]))
        : this.stmt.get();
      if (row === undefined || row === null) return null;
      if (col && typeof row === 'object') {
        return (row as Record<string, unknown>)[col] as T;
      }
      return row as T;
    } catch {
      return null;
    }
  }

  async all<T = unknown>(): Promise<D1Result<T>> {
    try {
      const rows = this.boundParams.length
        ? this.stmt.all(...(this.boundParams as never[]))
        : this.stmt.all();
      return {
        results: rows as T[],
        success: true,
        meta: emptyMeta(),
      };
    } catch (e) {
      return { results: [], success: false, meta: emptyMeta(), error: String(e) };
    }
  }

  async run(): Promise<D1Result> {
    try {
      const info = this.boundParams.length
        ? this.stmt.run(...(this.boundParams as never[]))
        : this.stmt.run();
      return {
        success: true,
        meta: {
          ...emptyMeta(),
          changes: info.changes,
          last_row_id: Number(info.lastInsertRowid),
          rows_written: info.changes,
        },
      };
    } catch (e) {
      // Fake D1 no lanza — devolvió { success: false, error }. Pero better-sqlite3
      // SÍ lanza en constraints. Drizzle espera un throw para propagar el error.
      // Lo re-lanzamos para que los tests detecten el problema correctamente.
      throw e;
    }
  }

  raw<T = unknown>(): T[] {
    try {
      // D1 .raw() returns rows as ARRAYS (positional), no objects.
      // better-sqlite3 .all() returns objects, hay que convertir.
      const rows = this.boundParams.length
        ? this.stmt.all(...(this.boundParams as never[]))
        : this.stmt.all();
      const positional = rows.map((row) => Object.values(row as Record<string, unknown>));
      return positional as unknown as T[];
    } catch {
      return [];
    }
  }
}

function emptyMeta(): D1Meta {
  return { duration: 0, changes: 0, last_row_id: 0, size_after: 0, rows_read: 0, rows_written: 0 };
}

/**
 * D1Database fake backed por better-sqlite3 in-memory.
 */
export class FakeD1Database implements D1Database {
  private sqlite: BetterSqlite3.Database;

  constructor() {
    this.sqlite = new BetterSqlite3(':memory:');
    this.sqlite.pragma('journal_mode = WAL');
    this.sqlite.pragma('foreign_keys = ON');
  }

  prepare(query: string): D1PreparedStatement {
    return new FakeD1Statement(this.sqlite.prepare(query));
  }

  async exec(multiStatement: string): Promise<void> {
    this.sqlite.exec(multiStatement);
  }

  async batch(statements: D1PreparedStatement[]): Promise<D1Result[]> {
    const results: D1Result[] = [];
    for (const stmt of statements) {
      results.push(await stmt.run());
    }
    return results;
  }

  async dump(): Promise<ArrayBuffer> {
    const data = this.sqlite.serialize();
    return new TextEncoder().encode(data).buffer;
  }

  withSession(_session: string): D1Database {
    throw new Error('withSession() not supported in fake');
  }
}

export function fakeD1(): D1Database {
  return new FakeD1Database();
}

export const MIGRATION_SQL = `
-- subsegundos para que createdAt distinga inserts del mismo segundo (importante para ordering de listByEmail)
CREATE TABLE IF NOT EXISTS user (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  email_verified INTEGER NOT NULL DEFAULT 0,
  image TEXT,
  role TEXT NOT NULL DEFAULT 'cliente',
  empresa TEXT,
  telefono TEXT,
  pais TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch('subsec') * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch('subsec') * 1000)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS session (
  id TEXT PRIMARY KEY NOT NULL,
  expires_at INTEGER NOT NULL,
  token TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL DEFAULT (unixepoch('subsec') * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch('subsec') * 1000),
  ip_address TEXT,
  user_agent TEXT,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS account (
  id TEXT PRIMARY KEY NOT NULL,
  account_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  access_token TEXT,
  refresh_token TEXT,
  id_token TEXT,
  access_token_expires_at INTEGER,
  refresh_token_expires_at INTEGER,
  scope TEXT,
  password TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch('subsec') * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch('subsec') * 1000)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS verification (
  id TEXT PRIMARY KEY NOT NULL,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch('subsec') * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch('subsec') * 1000)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS licitacion (
  id TEXT PRIMARY KEY NOT NULL,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL,
  empresa TEXT,
  telefono TEXT,
  pais TEXT,
  tipo TEXT NOT NULL,
  engagement TEXT NOT NULL,
  urgencia TEXT NOT NULL DEFAULT 'normal',
  features_json TEXT NOT NULL DEFAULT '[]',
  descripcion TEXT NOT NULL,
  precio_min REAL NOT NULL,
  precio_max REAL NOT NULL,
  banda TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'nueva',
  user_id TEXT REFERENCES user(id) ON DELETE SET NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch('subsec') * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch('subsec') * 1000)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS proyecto (
  id TEXT PRIMARY KEY NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  tagline TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  categoria TEXT NOT NULL,
  stack TEXT NOT NULL,
  repo_url TEXT,
  live_url TEXT,
  impact TEXT,
  year INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'activo',
  destacado INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch('subsec') * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch('subsec') * 1000)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS template (
  id TEXT PRIMARY KEY NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  descripcion_corta TEXT NOT NULL,
  descripcion_larga TEXT NOT NULL,
  precio_usd REAL NOT NULL,
  categoria TEXT NOT NULL,
  stack TEXT NOT NULL,
  incluye TEXT NOT NULL,
  no_incluye TEXT NOT NULL,
  tiempo_entrega_dias INTEGER NOT NULL,
  destacado INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch('subsec') * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch('subsec') * 1000)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS compra (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  template_id TEXT REFERENCES template(id) ON DELETE SET NULL,
  monto_usd REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendiente',
  metodo_pago TEXT,
  comprobante_url TEXT,
  notas_operador TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch('subsec') * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch('subsec') * 1000)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_licitacion_email ON licitacion(email);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_licitacion_status ON licitacion(status);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_proyecto_slug ON proyecto(slug);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_proyecto_categoria ON proyecto(categoria);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_template_slug ON template(slug);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_compra_user ON compra(user_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_session_user ON session(user_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_account_user ON account(user_id);
`;

export async function applyMigrations(d1: D1Database): Promise<void> {
  const statements = MIGRATION_SQL
    .split('--> statement-breakpoint')
    .map(s => s.trim())
    .filter(Boolean);
  for (const stmt of statements) {
    await d1.exec(stmt);
  }
}

// Types — Drizzle espera la forma completa de D1
interface D1Meta {
  duration: number;
  changes: number;
  last_row_id: number;
  size_after: number;
  rows_read: number;
  rows_written: number;
}
interface D1Result<T = unknown> {
  results?: T[];
  success: boolean;
  meta: D1Meta;
  error?: string;
}
interface D1PreparedStatement {
  bind(...params: unknown[]): D1PreparedStatement;
  first<T = unknown>(col?: string): Promise<T | null>;
  all<T = unknown>(): Promise<D1Result<T>>;
  run(): Promise<D1Result>;
  raw<T = unknown>(): T[];
}
interface D1Database {
  prepare(query: string): D1PreparedStatement;
  exec(multiStatement: string): Promise<void>;
  batch(statements: D1PreparedStatement[]): Promise<D1Result[]>;
  dump(): Promise<ArrayBuffer>;
  withSession(session: string): D1Database;
}
