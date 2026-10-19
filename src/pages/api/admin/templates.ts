// CRUD API para templates (B8 · T08).
// Mismo patrón que /api/admin/proyectos: action en el body, RBAC via withRole,
// audit_log en cada mutación.

import type { APIRoute } from 'astro';
import { env as runtimeEnv } from 'cloudflare:workers';
import { z } from 'zod';
import { createDb } from '~/db';
import { create as repoCreate, updateBySlug as repoUpdate, deleteBySlug as repoDelete, getBySlug as repoGet } from '~/server/template-repo';
import { recordAudit } from '~/lib/audit';
import { withRole, getRequestIp, getRequestUA } from '~/lib/admin-handler';

export const prerender = false;

const CreateSchema = z.object({
  slug: z.string().min(1),
  nombre: z.string().min(1),
  descripcionCorta: z.string().min(1),
  descripcionLarga: z.string().min(1),
  precioUsd: z.coerce.number().min(0),
  categoria: z.enum(['landing', 'dashboard', 'ecommerce']),
  stack: z.string().min(1), // JSON
  incluye: z.string().min(1), // JSON
  noIncluye: z.string().min(1), // JSON
  tiempoEntregaDias: z.coerce.number().int().min(1).max(365),
  destacado: z.coerce.boolean().default(false),
});

const UpdateSchema = CreateSchema.partial().extend({ slug: z.string().min(1) });

const QuerySchema = z.object({
  action: z.enum(['create', 'update', 'delete']),
});

export const POST: APIRoute = withRole(
  ['admin', 'gatekeeper', 'designer'],
  async (context) => {
    const env = runtimeEnv as unknown as { DB: D1Database };
    const db = createDb(env.DB);

    const ct = context.request.headers.get('content-type') ?? '';
    const raw = ct.includes('application/json')
      ? await context.request.json()
      : Object.fromEntries((await context.request.formData()).entries());

    const query = QuerySchema.safeParse(raw);
    if (!query.success) {
      return new Response(JSON.stringify({ ok: false, error: 'action inválida' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (query.data.action === 'create') {
      const parsed = CreateSchema.safeParse(raw);
      if (!parsed.success) {
        return new Response(JSON.stringify({ ok: false, error: 'datos inválidos' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      const before = await repoGet(db, parsed.data.slug);
      if (before) {
        return new Response(JSON.stringify({ ok: false, error: 'slug ya existe' }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      const row = await repoCreate(db, { ...parsed.data, id: crypto.randomUUID() });
      await recordAudit(db, {
        actorUserId: context.actor.id,
        action: 'template.create',
        resourceType: 'template',
        resourceId: row.id,
        beforeJson: null,
        afterJson: JSON.stringify({ slug: row.slug, nombre: row.nombre }),
        ip: getRequestIp(context),
        userAgent: getRequestUA(context),
      });
      return new Response(JSON.stringify({ ok: true, id: row.id, slug: row.slug }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (query.data.action === 'update') {
      const parsed = UpdateSchema.safeParse(raw);
      if (!parsed.success) {
        return new Response(JSON.stringify({ ok: false, error: 'datos inválidos' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      const { slug, ...updates } = parsed.data;
      const before = await repoGet(db, slug);
      if (!before) {
        return new Response(JSON.stringify({ ok: false, error: 'template no encontrado' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      const row = await repoUpdate(db, slug, updates);
      await recordAudit(db, {
        actorUserId: context.actor.id,
        action: 'template.update',
        resourceType: 'template',
        resourceId: row?.id ?? null,
        beforeJson: JSON.stringify({ nombre: before.nombre, precioUsd: before.precioUsd }),
        afterJson: JSON.stringify({ nombre: row?.nombre, precioUsd: row?.precioUsd }),
        ip: getRequestIp(context),
        userAgent: getRequestUA(context),
      });
      return new Response(JSON.stringify({ ok: true, slug: row?.slug }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (query.data.action === 'delete') {
      const slugRaw = (raw as { slug?: string }).slug;
      if (!slugRaw) {
        return new Response(JSON.stringify({ ok: false, error: 'slug requerido' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (context.actor.role !== 'admin') {
        return new Response(JSON.stringify({ ok: false, error: 'forbidden: solo admin puede eliminar' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      const before = await repoGet(db, slugRaw);
      if (!before) {
        return new Response(JSON.stringify({ ok: false, error: 'template no encontrado' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      await repoDelete(db, slugRaw);
      await recordAudit(db, {
        actorUserId: context.actor.id,
        action: 'template.delete',
        resourceType: 'template',
        resourceId: before.id,
        beforeJson: JSON.stringify({ slug: before.slug, nombre: before.nombre }),
        afterJson: null,
        ip: getRequestIp(context),
        userAgent: getRequestUA(context),
      });
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: false, error: 'acción no soportada' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
);
