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
CONTACT_EMAIL=nxstudioing31@gmail.com
EOF

# 5. Dev server
npm run dev
```

## Deploy a producción

```bash
# 1. Build
npm run build

# 2. Deploy — Workers con static assets (el adapter @astrojs/cloudflare v14
#    genera dist/server/wrangler.json con bindings del wrangler.toml raíz)
npx wrangler deploy --config dist/server/wrangler.json

# 3. Secrets de producción (BETTER_AUTH_SECRET y CONTACT_EMAIL ya seteados
#    2026-10-13; falta RESEND_API_KEY cuando exista cuenta Resend)
npx wrangler secret put RESEND_API_KEY --config dist/server/wrangler.json

# 4. Aplicar schema + seed a D1 de producción
npm run db:migrate:remote
npm run db:seed:remote
```

## Rollback

```bash
# Listar deploys
npx wrangler deployments list --config dist/server/wrangler.json

# Rollback a una versión anterior
npx wrangler versions rollback --config dist/server/wrangler.json
```

## Endpoints activos

| Método | Ruta                    | Descripción                                |
|--------|-------------------------|--------------------------------------------|
| POST   | `/api/licitacion`       | Submit público del formulario /contacto    |
| ALL    | `/api/auth/[...all]`    | Better-auth: sign-up, sign-in, session, sign-out |

## Estructura de la DB

- **user** — usuarios (admin + clientes)
- **session** — sesiones activas
- **account** — providers (credential, google, github)
- **verification** — tokens de verificación (magic links, email verify)
- **licitacion** — todos los submits del formulario /contacto
- **proyecto** — 11 productos del catálogo
- **template** — 3 templates comprables
- **compra** — compras manuales de templates (operador confirma)

## Variables de entorno

| Var                    | Dónde va                | Descripción                            |
|------------------------|-------------------------|----------------------------------------|
| `BETTER_AUTH_SECRET`   | Cloudflare Pages secret | Secret de firma para sessions (openssl rand -base64 48) |
| `BETTER_AUTH_URL`      | `wrangler.toml` vars    | https://nx-studio.pages.dev            |
| `RESEND_API_KEY`       | Cloudflare Pages secret | re_xxxxxxxxxxxx                        |
| `CONTACT_EMAIL`        | Cloudflare Pages secret | nxstudioing31@gmail.com                |
| `GOOGLE_CLIENT_ID`     | Cloudflare Pages secret (opcional) | OAuth para login social |
| `GOOGLE_CLIENT_SECRET` | Cloudflare Pages secret (opcional) | OAuth para login social |

## Logs y observabilidad

```bash
# Tail de logs en tiempo real
wrangler pages deployment tail --project-name nx-studio

# Ver métricas en el dashboard de Cloudflare
# https://dash.cloudflare.com → Pages → nx-studio
```
