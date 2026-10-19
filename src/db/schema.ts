// Schema Drizzle para NX-Studio.
// Single source of truth para la forma de la DB.
//
// Tablas de Better-auth (4) son requeridas por su adapter Drizzle:
//   user, session, account, verification
//
// Tablas de negocio (4) son las que se conectan al dominio:
//   licitacion  — persiste cada submission del formulario /contacto
//   proyecto    — migra desde src/data/catalog.ts (11 productos)
//   template    — migra desde src/data/templates.ts (3 productos)
//   compra      — rastro de compras manuales confirmadas por el operador
//
// Convenciones:
// - snake_case en columnas (SQLite convention) — el adapter Better-auth mapea
//   camelCase ↔ snake_case automáticamente con CamelCasePlugin si hace falta.
// - Timestamps como integer (unix epoch) — Drizzle tiene mode 'timestamp' pero
//   integer es más portable y funciona con sqlite sin surprises.
// - IDs como text (UUID generado con crypto.randomUUID()) — más simple que
//   integer autoincrement para sincronizar con sistemas externos.

import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// ─── Better-auth tables ────────────────────────────────────────────────────

export const user = sqliteTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
  image: text('image'),
  // Custom fields para NX-Studio:
  role: text('role', { enum: ['cliente', 'admin'] }).notNull().default('cliente'),
  empresa: text('empresa'),
  telefono: text('telefono'),
  pais: text('pais'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch('subsec') * 1000)`),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch('subsec') * 1000)`),
});

export const session = sqliteTable('session', {
  id: text('id').primaryKey(),
  expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
  token: text('token').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch('subsec') * 1000)`),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch('subsec') * 1000)`),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
});

export const account = sqliteTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: integer('access_token_expires_at', { mode: 'timestamp_ms' }),
  refreshTokenExpiresAt: integer('refresh_token_expires_at', { mode: 'timestamp_ms' }),
  scope: text('scope'),
  password: text('password'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch('subsec') * 1000)`),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch('subsec') * 1000)`),
});

export const verification = sqliteTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch('subsec') * 1000)`),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch('subsec') * 1000)`),
});

// ─── Business tables ──────────────────────────────────────────────────────

export const licitacion = sqliteTable('licitacion', {
  id: text('id').primaryKey(),
  // Snapshot del submitter (no FK a user.id porque puede haber licitaciones
  // anónimas de gente no autenticada que llegan desde /contacto sin login).
  nombre: text('nombre').notNull(),
  email: text('email').notNull(),
  empresa: text('empresa'),
  telefono: text('telefono'),
  pais: text('pais'),
  tipo: text('tipo', { enum: ['webapp', 'landing', 'mobile', 'testing', 'template', 'otro'] }).notNull(),
  engagement: text('engagement', { enum: ['fixed', 'retainer', 'dedicated', 'tm'] }).notNull(),
  urgencia: text('urgencia', { enum: ['normal', 'rush', 'flexible'] }).notNull().default('normal'),
  featuresJson: text('features_json').notNull().default('[]'), // JSON array de feature ids
  descripcion: text('descripcion').notNull(),
  // Pricing calculado server-side (mirror del pricing engine)
  precioMin: real('precio_min').notNull(),
  precioMax: real('precio_max').notNull(),
  banda: text('banda', { enum: ['Starter', 'Standard', 'Growth', 'Enterprise'] }).notNull(),
  // Moneda que vio el cliente en el cotizador (COP u otra) + rango convertido,
  // para que el operador sepa el contexto exacto de la solicitud
  displayCurrency: text('display_currency'),
  displayMin: real('display_min'),
  displayMax: real('display_max'),
  // Status gestionado por el operador
  status: text('status', { enum: ['nueva', 'contactada', 'propuesta_enviada', 'aceptada', 'rechazada', 'completada'] })
    .notNull()
    .default('nueva'),
  // Link opcional al user si se autenticó antes de mandar la licitacion
  userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch('subsec') * 1000)`),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch('subsec') * 1000)`),
});

export const proyecto = sqliteTable('proyecto', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  code: text('code').notNull(), // ej. 'NXC' para NexoCore
  name: text('name').notNull(),
  tagline: text('tagline').notNull(),
  descripcion: text('descripcion').notNull(),
  categoria: text('categoria', {
    enum: ['SaaS', 'IA', 'DevTools', 'Seguridad', '3D', 'Web', 'Backend'],
  }).notNull(),
  stack: text('stack').notNull(), // JSON array
  repoUrl: text('repo_url'),
  liveUrl: text('live_url'),
  impact: text('impact'), // JSON object {metric, value}
  year: integer('year').notNull(),
  status: text('status', { enum: ['activo', 'mantenimiento', 'archivado', 'beta'] })
    .notNull()
    .default('activo'),
  destacado: integer('destacado', { mode: 'boolean' }).notNull().default(false),
  // ─── B7 Portal Cliente: columnas añadidas en migrations/0002_portal.sql ───
  // cliente_id referencia al user que contrató el proyecto (rol='cliente')
  clienteId: text('cliente_id').references(() => user.id),
  // portal_visible: 1 → proyecto aparece en el portal del cliente; 0 → oculto
  portalVisible: integer('portal_visible', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch('subsec') * 1000)`),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch('subsec') * 1000)`),
});

export const template = sqliteTable('template', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  nombre: text('nombre').notNull(),
  descripcionCorta: text('descripcion_corta').notNull(),
  descripcionLarga: text('descripcion_larga').notNull(),
  precioUsd: real('precio_usd').notNull(),
  categoria: text('categoria', { enum: ['landing', 'dashboard', 'ecommerce'] }).notNull(),
  stack: text('stack').notNull(), // JSON array
  incluye: text('incluye').notNull(), // JSON array
  noIncluye: text('no_incluye').notNull(), // JSON array
  tiempoEntregaDias: integer('tiempo_entrega_dias').notNull(),
  destacado: integer('destacado', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch('subsec') * 1000)`),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch('subsec') * 1000)`),
});

export const compra = sqliteTable('compra', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  templateId: text('template_id').references(() => template.id, { onDelete: 'set null' }),
  montoUsd: real('monto_usd').notNull(),
  // Estado del pago manual (Nequi/Bancolombia/Stripe Connect a nombre del operador).
  // El operador confirma por fuera y actualiza este status.
  status: text('status', { enum: ['pendiente', 'confirmada', 'rechazada', 'reembolsada'] })
    .notNull()
    .default('pendiente'),
  metodoPago: text('metodo_pago', { enum: ['nequi', 'bancolombia', 'stripe_connect', 'otro'] }),
  comprobanteUrl: text('comprobante_url'),
  notasOperador: text('notas_operador'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch('subsec') * 1000)`),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch('subsec') * 1000)`),
});

// ─── B7 Portal Cliente tables ───────────────────────────────────────────
// Esquema propio: sesiones, actividad, mensajería y milestones. Mantenidas
// separadas de la tabla session de better-auth para que un compromiso del
// portal no afecte la sesión admin/auth y viceversa.

export const portalSession = sqliteTable('portal_session', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  // token + updatedAt son necesarios porque better-auth mapea esta tabla
  // a su session interna — sin ellos el adapter tira "Drizzle schema mismatch".
  // Se exponen aquí para mantener simetría con la tabla `session` original.
  token: text('token').notNull().unique(),
    // better-auth espera `ipAddress` (lo busca por nombre camelCase en el
    // schema); Drizzle mapea a columna SQL `ip_address` automáticamente.
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
  // epoch ms — better-auth trabaja en ms, mantenemos consistencia interna
  expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch('subsec') * 1000)`),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch('subsec') * 1000)`),
});

export const portalActivity = sqliteTable('portal_activity', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id'),
  payload: text('payload'), // JSON serializado
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch('subsec') * 1000)`),
});

export const portalMessage = sqliteTable('portal_message', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  // inbound  ← mensaje del cliente hacia el operador
  // outbound ← mensaje del operador hacia el cliente
  direction: text('direction', { enum: ['inbound', 'outbound'] }).notNull(),
  body: text('body').notNull(),
  readAt: integer('read_at', { mode: 'timestamp_ms' }),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch('subsec') * 1000)`),
});

export const milestone = sqliteTable('milestone', {
  id: text('id').primaryKey(),
  proyectoId: text('proyecto_id').notNull().references(() => proyecto.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status', { enum: ['pending', 'in_progress', 'completed', 'cancelled'] })
    .notNull()
    .default('pending'),
  dueDate: integer('due_date', { mode: 'timestamp_ms' }),
  completedAt: integer('completed_at', { mode: 'timestamp_ms' }),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch('subsec') * 1000)`),
});

// Type exports para usar en el código de aplicación
export type User = typeof user.$inferSelect;
export type Licitacion = typeof licitacion.$inferSelect;
export type NewLicitacion = typeof licitacion.$inferInsert;
export type Proyecto = typeof proyecto.$inferSelect;
export type NewProyecto = typeof proyecto.$inferInsert;
export type Template = typeof template.$inferSelect;
export type NewTemplate = typeof template.$inferInsert;
export type Compra = typeof compra.$inferSelect;
export type NewCompra = typeof compra.$inferInsert;
export type PortalSession = typeof portalSession.$inferSelect;
export type NewPortalSession = typeof portalSession.$inferInsert;
export type PortalActivity = typeof portalActivity.$inferSelect;
export type NewPortalActivity = typeof portalActivity.$inferInsert;
export type PortalMessage = typeof portalMessage.$inferSelect;
export type NewPortalMessage = typeof portalMessage.$inferInsert;
export type Milestone = typeof milestone.$inferSelect;
export type NewMilestone = typeof milestone.$inferInsert;
