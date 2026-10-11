# Deploy: NX-Studio Backend a Cloudflare Pages

## Pre-requisitos

1. Cuenta Cloudflare con Pages habilitado
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

# 2. Deploy (wrangler detecta Pages automáticamente)
wrangler pages deploy dist --project-name nx-studio

# 3. Configurar secrets de producción
wrangler pages secret put BETTER_AUTH_SECRET --project-name nx-studio
wrangler pages secret put RESEND_API_KEY --project-name nx-studio
wrangler pages secret put CONTACT_EMAIL --project-name nx-studio

# 4. Aplicar schema + seed a D1 de producción
npm run db:migrate:remote
npm run db:seed:remote
```

## Rollback

```bash
# Listar deploys
wrangler pages deployment list --project-name nx-studio

# Rollback a un deploy anterior
wrangler pages deployment rollback <deployment-id> --project-name nx-studio
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
