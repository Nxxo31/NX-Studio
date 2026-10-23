# Deploy: NX-Studio Backend a Cloudflare Workers

## Pre-requisitos

1. Cuenta Cloudflare con Workers habilitado (OAuth vía `npx wrangler login`;
   ojo: si `CLOUDFLARE_API_TOKEN` está en el environment y es inválido,
   wrangler falla con 9109 — unsetearlo para usar OAuth)
2. `wrangler` CLI instalado globalmente (`npm install -g wrangler`)
3. Cuenta Resend con dominio verificado

## Setup inicial (una sola vez)

```bash
# 1. Crear la DB D1
npm run db:create
# Anota el database_id que te devuelve y actualiza wrangler.toml

# 2. Aplicar el schema inicial a la DB local (para dev)
npm run db:migrate:local

# 3. Seed el catálogo + templates en la DB local
npm run seed:dry        # ver qué se va a insertar
npm run db:seed:local   # aplica contra .wrangler/state/...

# 4. Configurar secrets locales (crear .dev.vars)
cat > .dev.vars <<EOF
BETTER_AUTH_SECRET=$(openssl rand -base64 48)
BETTER_AUTH_URL=http://127.0.0.1:4321
RESEND_API_KEY=re_xxxxxxxxxxxx
CONTACT_EMAIL=sebasvelascodev3101@gmail.com
EOF

# 5. Dev server
npm run dev
```

## Deploy a producción

```bash
# 1. Build
npm run build

# 2. Deploy — Workers con static assets (el adapter @astrojs/cloudflare v14
#    genera dist/server/wrangler.json con bindings del wrangler.toml raíz).
#    OJO: si CLOUDFLARE_API_TOKEN está en el environment y está vencido,
#    wrangler falla con 9109/7403 — unsetearlo y usar el oauth cacheado:
unset CLOUDFLARE_API_TOKEN
npx wrangler deploy --config dist/server/wrangler.json

# 3. Secrets de producción (BETTER_AUTH_SECRET y CONTACT_EMAIL ya seteados
#    2026-10-13; falta RESEND_API_KEY cuando exista cuenta Resend)
npx wrangler secret put RESEND_API_KEY --config dist/server/wrangler.json

# 4. Migraciones D1 a la DB remota — NO se aplican solas con el deploy.
#    Requiere unset CLOUDFLARE_API_TOKEN (el oauth cacheado sí sirve).
#    Estado: base + seeds aplicados 2026-10-13; 0002_portal + 0003_admin
#    aplicados 2026-10-22 (15 tablas en remoto, verificado con PRAGMA).
unset CLOUDFLARE_API_TOKEN
npx wrangler d1 execute nx-studio-db --remote --file migrations/0002_portal.sql
npx wrangler d1 execute nx-studio-db --remote --file migrations/0003_admin.sql
```

## Rollback

```bash
# Listar deploys
npx wrangler deployments list --config dist/server/wrangler.json

# Rollback a una versión anterior
npx wrangler versions rollback --config dist/server/wrangler.json
```

## Endpoints activos

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/licitacion` | Submit público del formulario /contacto |
| ALL | `/api/auth/[...all]` | Better-auth: sign-up, sign-in, session, sign-out |
| GET | `/api/proyectos` | Catálogo de proyectos (D1 + GitHub live) |
| ALL | `/api/portal/profile` | Portal cliente: perfil (B7) |
| POST | `/api/admin/update-status` | Admin: update de estado de licitación |
| POST | `/api/admin/licitacion/[id]/approve·reject·contact` | Admin: acciones con audit (B8) |
| CRUD | `/api/admin/proyectos`, `/api/admin/templates` | Admin: CRUD catálogo/templates (B8) |
| ALL | `/api/admin/users/[id]` | Admin: role, reset-password, revoke sessions |
| POST | `/admin/logout` | Logout admin (CSRF: chequeo de Origin) |

## Estructura de la DB

- **user** — usuarios (admin + clientes; custom: role, empresa, telefono, pais)
- **session** — sesiones better-auth
- **account** — providers (credential, google, github)
- **verification** — tokens de verificación (magic links, email verify)
- **licitacion** — submits de /contacto (+ moneda display)
- **proyecto** — catálogo de proyectos (18) + cliente_id, portal_visible
- **template** — 3 templates comprables
- **compra** — compras manuales de templates (operador confirma)
- **portal_session / portal_activity / portal_message / milestone** — portal de cliente (B7, migration 0002)
- **admin_session / audit_log (INMUTABLE) / deploy_log** — panel admin (B8, migration 0003)

## Variables de entorno

| Var                    | Dónde va                | Descripción                            |
|------------------------|-------------------------|----------------------------------------|
| `BETTER_AUTH_SECRET`   | Cloudflare Pages secret | Secret de firma para sessions (openssl rand -base64 48) |
| `BETTER_AUTH_URL`      | `wrangler.toml` vars    | https://nx-studio.nx-studio.workers.dev |
| `RESEND_API_KEY`       | Cloudflare Pages secret | re_xxxxxxxxxxxx                        |
| `CONTACT_EMAIL`        | Worker secret (ya seteado) | sebasvelascodev3101@gmail.com          |
| `GOOGLE_CLIENT_ID`     | Cloudflare Pages secret (opcional) | OAuth para login social |
| `GOOGLE_CLIENT_SECRET` | Cloudflare Pages secret (opcional) | OAuth para login social |

## Logs y observabilidad

```bash
# Tail de logs en tiempo real (Workers)
npx wrangler tail

# Ver métricas en el dashboard de Cloudflare
# https://dash.cloudflare.com → Workers → nx-studio
```
