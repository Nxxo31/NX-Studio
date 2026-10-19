// CRUD API para proyectos (B8 · T07).
// Acciones: create, update, delete, toggle-portal-visible.
// Cada acción registra audit_log. RBAC enforced via withRole.

import type { APIRoute } from 'astro';
import { env as runtimeEnv } from 'cloudflare:workers';
import { z } from 'zod';
import { createDb } from '~/db';
import { create as repoCreate, updateBySlug as repoUpdate, deleteBySlug as repoDelete, getBySlug as repoGet } from '~/server/proyecto-repo';
import { recordAudit } from '~/lib/audit';
import { withRole, getRequestIp, getRequestUA } from '~/lib/admin-handler';

export const prerender = false;

const CreateSchema = z.object({
  slug: z.string().min(1),
  code: z.string().min(1),
  name: z.string().min(1),
  tagline: z.string().min(1),
  descripcion: z.string().min(1),
  categoria: z.enum(['SaaS', 'IA', 'DevTools', 'Seguridad', '3D', 'Web', 'Backend']),
  stack: z.string().min(1), // JSON
  repoUrl: z.string().optional().nullable(),
  liveUrl: z.string().optional().nullable(),
  impact: z.string().optional().nullable(), // JSON
  year: z.coerce.number().int().min(2000).max(2100),
  status: z.enum(['activo', 'mantenimiento', 'archivado', 'beta']).default('activo'),
  destacado: z.coerce.boolean().default(false),
  clienteId: z.string().optional().nullable(),
  portalVisible: z.coerce.boolean().default(false),
});

const UpdateSchema = CreateSchema.partial().extend({ slug: z.string().min(1) });

const QuerySchema = z.object({
  action: z.enum(['create', 'update', 'delete', 'toggle-portal-visible']),
});

export const POST: APIRoute = withRole(
  ['admin', 'gatekeeper', 'designer', 'dev'],
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
        return new Response(JSON.stringify({ ok: false, error: 'datos inválidos', details: parsed.error.flatten() }), {
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
        action: 'proyecto.create',
        resourceType: 'proyecto',
        resourceId: row.id,
        beforeJson: null,
        afterJson: JSON.stringify({ slug: row.slug, name: row.name }),
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
        return new Response(JSON.stringify({ ok: false, error: 'proyecto no encontrado' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      const row = await repoUpdate(db, slug, updates);
      await recordAudit(db, {
        actorUserId: context.actor.id,
        action: 'proyecto.update',
        resourceType: 'proyecto',
        resourceId: row?.id ?? null,
        beforeJson: JSON.stringify({ name: before.name, status: before.status }),
        afterJson: JSON.stringify({ name: row?.name, status: row?.status }),
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
      if (!slugRaw || typeof slugRaw !== 'string') {
        return new Response(JSON.stringify({ ok: false, error: 'slug requerido' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      // Re-check role for delete: solo admin
      if (context.actor.role !== 'admin') {
        return new Response(JSON.stringify({ ok: false, error: 'forbidden: solo admin puede eliminar' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      const before = await repoGet(db, slugRaw);
      if (!before) {
        return new Response(JSON.stringify({ ok: false, error: 'proyecto no encontrado' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      await repoDelete(db, slugRaw);
      await recordAudit(db, {
        actorUserId: context.actor.id,
        action: 'proyecto.delete',
        resourceType: 'proyecto',
        resourceId: before.id,
        beforeJson: JSON.stringify({ slug: before.slug, name: before.name }),
        afterJson: null,
        ip: getRequestIp(context),
        userAgent: getRequestUA(context),
      });
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (query.data.action === 'toggle-portal-visible') {
      const slugRaw = (raw as { slug?: string }).slug;
      if (!slugRaw) {
        return new Response(JSON.stringify({ ok: false, error: 'slug requerido' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      const before = await repoGet(db, slugRaw);
      if (!before) {
        return new Response(JSON.stringify({ ok: false, error: 'proyecto no encontrado' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      const row = await repoUpdate(db, slugRaw, { portalVisible: !before.portalVisible });
      await recordAudit(db, {
        actorUserId: context.actor.id,
        action: 'proyecto.toggle_portal_visible',
        resourceType: 'proyecto',
        resourceId: row?.id ?? null,
        beforeJson: JSON.stringify({ portalVisible: before.portalVisible }),
        afterJson: JSON.stringify({ portalVisible: row?.portalVisible }),
        ip: getRequestIp(context),
        userAgent: getRequestUA(context),
      });
      return new Response(JSON.stringify({ ok: true, portalVisible: row?.portalVisible }), {
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
