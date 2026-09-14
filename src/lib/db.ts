// src/lib/db.ts
// SQLite persistence layer para NX-Studio
// Tablas:
//   licitaciones  → leads que llegan del formulario principal
//   cotizaciones  → cotizaciones generadas (vinculadas a una licitacion opcionalmente)
//   mockups       → mockups HTML generativos generados en el laboratorio
//   leads_log     → log de comunicaciones (emails enviados, eventos)

import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const DB_PATH = process.env.NX_DB_PATH || './data/nx-studio.db';

mkdirSync(dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS licitaciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    nombre TEXT NOT NULL,
    email TEXT NOT NULL,
    empresa TEXT,
    telefono TEXT,
    pais TEXT,
    tipo TEXT NOT NULL,
    features_json TEXT NOT NULL DEFAULT '[]',
    engagement TEXT NOT NULL DEFAULT 'fixed',
    modifiers_json TEXT NOT NULL DEFAULT '[]',
    urgencia TEXT,
    descripcion TEXT NOT NULL,
    presupuesto_estimado_low INTEGER,
    presupuesto_estimado_high INTEGER,
    horas_estimadas INTEGER,
    status TEXT NOT NULL DEFAULT 'nueva',
    agente_respuesta_id TEXT,
    agente_enviado_at TEXT,
    UNIQUE(email, created_at)
  );

  CREATE TABLE IF NOT EXISTS cotizaciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    licitacion_id INTEGER REFERENCES licitaciones(id) ON DELETE SET NULL,
    nombre TEXT NOT NULL,
    email TEXT NOT NULL,
    engagement TEXT NOT NULL,
    feature_ids_json TEXT NOT NULL,
    modifier_ids_json TEXT NOT NULL DEFAULT '[]',
    total_low INTEGER NOT NULL,
    total_high INTEGER NOT NULL,
    total_hours INTEGER NOT NULL,
    band TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS mockups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    licitacion_id INTEGER REFERENCES licitaciones(id) ON DELETE SET NULL,
    prompt TEXT NOT NULL,
    html_preview TEXT NOT NULL,
    style TEXT NOT NULL DEFAULT 'corporate',
    paleta TEXT NOT NULL DEFAULT 'lava'
  );

  CREATE TABLE IF NOT EXISTS leads_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    licitacion_id INTEGER REFERENCES licitaciones(id) ON DELETE CASCADE,
    event TEXT NOT NULL,
    detail TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_licitaciones_status ON licitaciones(status);
  CREATE INDEX IF NOT EXISTS idx_licitaciones_email ON licitaciones(email);
  CREATE INDEX IF NOT EXISTS idx_licitaciones_created ON licitaciones(created_at);
  CREATE INDEX IF NOT EXISTS idx_cotizaciones_email ON cotizaciones(email);
  CREATE INDEX IF NOT EXISTS idx_mockups_created ON mockups(created_at);
  CREATE INDEX IF NOT EXISTS idx_leads_log_licitacion ON leads_log(licitacion_id);
`);

console.log(`[nx-studio/db] SQLite inicial at ${DB_PATH}`);

// ============================================================
// Tipos
// ============================================================
export type LicitacionStatus = 'nueva' | 'en_revision' | 'respondida' | 'descartada' | 'cerrada';

export type Licitacion = {
  id: number;
  created_at: string;
  updated_at: string;
  nombre: string;
  email: string;
  empresa: string | null;
  telefono: string | null;
  pais: string | null;
  tipo: string;
  features_json: string;
  engagement: string;
  modifiers_json: string;
  urgencia: string | null;
  descripcion: string;
  presupuesto_estimado_low: number | null;
  presupuesto_estimado_high: number | null;
  horas_estimadas: number | null;
  status: LicitacionStatus;
  agente_respuesta_id: string | null;
  agente_enviado_at: string | null;
};

export type Cotizacion = {
  id: number;
  created_at: string;
  licitacion_id: number | null;
  nombre: string;
  email: string;
  engagement: string;
  feature_ids_json: string;
  modifier_ids_json: string;
  total_low: number;
  total_high: number;
  total_hours: number;
  band: string;
};

export type Mockup = {
  id: number;
  created_at: string;
  licitacion_id: number | null;
  prompt: string;
  html_preview: string;
  style: string;
  paleta: string;
};

// ============================================================
// Licitaciones
// ============================================================
export const insertLicitacion = db.prepare(`
  INSERT INTO licitaciones (
    nombre, email, empresa, telefono, pais, tipo,
    features_json, engagement, modifiers_json, urgencia, descripcion,
    presupuesto_estimado_low, presupuesto_estimado_high, horas_estimadas, status
  ) VALUES (
    @nombre, @email, @empresa, @telefono, @pais, @tipo,
    @features_json, @engagement, @modifiers_json, @urgencia, @descripcion,
    @presupuesto_estimado_low, @presupuesto_estimado_high, @horas_estimadas, @status
  )
`);

export const getLicitacion = db.prepare(`SELECT * FROM licitaciones WHERE id = ?`);
export const getLicitacionByEmail = db.prepare(
  `SELECT * FROM licitaciones WHERE email = ? ORDER BY created_at DESC LIMIT 1`
);
export const listLicitaciones = db.prepare(
  `SELECT * FROM licitaciones ORDER BY created_at DESC LIMIT ?`
);
export const updateLicitacionStatus = db.prepare(
  `UPDATE licitaciones SET status = ?, updated_at = datetime('now') WHERE id = ?`
);
export const markLicitacionEnviada = db.prepare(
  `UPDATE licitaciones SET agente_enviado_at = datetime('now'), agente_respuesta_id = ?, status = 'respondida', updated_at = datetime('now') WHERE id = ?`
);

// ============================================================
// Cotizaciones
// ============================================================
export const insertCotizacion = db.prepare(`
  INSERT INTO cotizaciones (
    licitacion_id, nombre, email, engagement,
    feature_ids_json, modifier_ids_json, total_low, total_high, total_hours, band
  ) VALUES (
    @licitacion_id, @nombre, @email, @engagement,
    @feature_ids_json, @modifier_ids_json, @total_low, @total_high, @total_hours, @band
  )
`);

export const listCotizaciones = db.prepare(
  `SELECT * FROM cotizaciones ORDER BY created_at DESC LIMIT ?`
);

// ============================================================
// Mockups
// ============================================================
export const insertMockup = db.prepare(`
  INSERT INTO mockups (licitacion_id, prompt, html_preview, style, paleta)
  VALUES (@licitacion_id, @prompt, @html_preview, @style, @paleta)
`);

export const getMockup = db.prepare(`SELECT * FROM mockups WHERE id = ?`);
export const listMockups = db.prepare(
  `SELECT * FROM mockups ORDER BY created_at DESC LIMIT ?`
);

// ============================================================
// Log
// ============================================================
export const insertLog = db.prepare(
  `INSERT INTO leads_log (licitacion_id, event, detail) VALUES (?, ?, ?)`
);
export const listLog = db.prepare(
  `SELECT * FROM leads_log WHERE licitacion_id = ? ORDER BY created_at DESC`
);

export { db };