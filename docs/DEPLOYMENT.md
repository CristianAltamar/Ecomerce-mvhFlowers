# 🚀 Despliegue

> Esta guía cubre el despliegue de la Entrega 1. El flujo completo (CI/CD, dominios, SSL) se documenta en Entrega 5.

## Opción 1 — Render + Vercel (recomendado, gratis para empezar)

### Backend en Render (Web Service)

1. **Crear PostgreSQL**: Dashboard → New → PostgreSQL → región: `Oregon` (o la más cercana a Colombia: `Ohio`). Plan free está bien para staging.
2. **Crear Web Service**:
   - Repo conectado a GitHub.
   - Build command: `corepack enable && pnpm install --frozen-lockfile && pnpm --filter @mvh/api db:generate && pnpm --filter @mvh/api build`
   - Start command: `pnpm --filter @mvh/api db:migrate:deploy && node apps/api/dist/server.js`
   - Health check path: `/api/v1/health`
3. **Variables de entorno** (copiar de `apps/api/.env.example`):
   - `DATABASE_URL` → la cadena interna que provee Render
   - `JWT_ACCESS_SECRET` y `JWT_REFRESH_SECRET` → generar con `openssl rand -base64 64`
   - `CORS_ORIGINS` → URL del frontend en Vercel
   - `NODE_ENV=production`
4. **Seed inicial** (una vez): `pnpm --filter @mvh/api db:seed` desde Shell de Render.

### Frontend en Vercel

1. Import del repo → Framework: Next.js → Root Directory: `apps/web`.
2. **Build Command override**: `cd ../.. && pnpm --filter @mvh/web build`
3. **Install Command override**: `cd ../.. && pnpm install`
4. Variables de entorno:
   - `NEXT_PUBLIC_API_URL=https://<tu-api>.onrender.com/api/v1`
   - `NEXT_PUBLIC_SITE_URL=https://<tu-dominio>.vercel.app`
5. Deploy → Vercel detecta Next.js y maneja edge functions automáticamente.

## Opción 2 — VPS propio (Docker Compose)

Para un VPS Linux con Docker y Docker Compose instalados.

### Setup inicial

```bash
ssh root@tu-servidor.com

# Instalar Docker (si no está)
curl -fsSL https://get.docker.com | sh

# Clonar
git clone https://github.com/tu-org/mvh-store.git
cd mvh-store

# Configurar env
cp .env.example .env
cp apps/api/.env.example apps/api/.env
# editar con valores reales

# Levantar BD + Redis
docker compose up -d postgres redis

# Build y correr API
docker build -f docker/api.Dockerfile -t mvh-api .
docker run -d --name mvh-api \
  --network mvh-store_mvh-net \
  -p 4000:4000 \
  --env-file apps/api/.env \
  mvh-api

# Migrar y seedear (una vez)
docker exec mvh-api pnpm --filter @mvh/api db:migrate:deploy
docker exec mvh-api pnpm --filter @mvh/api db:seed

# Build y correr Web
docker build -f docker/web.Dockerfile \
  --build-arg NEXT_PUBLIC_API_URL=https://api.tudominio.com/api/v1 \
  --build-arg NEXT_PUBLIC_SITE_URL=https://tudominio.com \
  -t mvh-web .
docker run -d --name mvh-web \
  -p 3000:3000 \
  mvh-web
```

### Nginx reverse proxy

```nginx
# /etc/nginx/sites-available/mvh
server {
    listen 80;
    server_name tudominio.com www.tudominio.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tudominio.com www.tudominio.com;

    ssl_certificate /etc/letsencrypt/live/tudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tudominio.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 443 ssl http2;
    server_name api.tudominio.com;
    ssl_certificate /etc/letsencrypt/live/api.tudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.tudominio.com/privkey.pem;

    location / {
        proxy_pass http://localhost:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# SSL gratis con Let's Encrypt
sudo certbot --nginx -d tudominio.com -d www.tudominio.com -d api.tudominio.com
```

## Checklist pre-producción

- [ ] **Secretos**: generar nuevos `JWT_ACCESS_SECRET` y `JWT_REFRESH_SECRET` (no usar los del `.env.example`).
- [ ] **CORS_ORIGINS**: configurar con el dominio real del frontend.
- [ ] **DATABASE_URL**: con SSL en producción (`?sslmode=require`).
- [ ] **NODE_ENV=production**: para que los logs sean JSON y los errores no expongan stack traces.
- [ ] **Backups de BD**: configurar snapshots diarios (Render lo hace; en VPS usar `pg_dump` + cron).
- [ ] **Healthchecks**: el orquestador (Render/k8s) debe usar `/api/v1/health`.
- [ ] **Rate limits**: revisar si los defaults son apropiados para el tráfico esperado.
- [ ] **Logs**: agregar Sentry o similar para errores en producción (pendiente — Entrega 5).
- [ ] **Bold**: completar credenciales reales una vez integrado (Entrega 2).

## Variables de entorno críticas

| Variable               | Producción debe ser                              |
| ---------------------- | ------------------------------------------------ |
| `NODE_ENV`             | `production`                                     |
| `JWT_ACCESS_SECRET`    | Aleatorio, ≥64 chars, único por entorno          |
| `JWT_REFRESH_SECRET`   | Aleatorio, ≥64 chars, ≠ del access               |
| `DATABASE_URL`         | Postgres gestionado con backups + SSL            |
| `CORS_ORIGINS`         | Sólo el dominio del frontend (no `*`)            |
| `BCRYPT_ROUNDS`        | 10–12 (más alto = más seguro pero más lento)     |

## Comandos útiles en producción

```bash
# Ver logs en vivo
docker logs -f mvh-api

# Backup manual de BD
docker exec mvh-postgres pg_dump -U mvh mvh_store > backup-$(date +%Y%m%d).sql

# Aplicar migración nueva sin downtime
docker exec mvh-api pnpm --filter @mvh/api db:migrate:deploy

# Inspeccionar BD
docker exec -it mvh-postgres psql -U mvh -d mvh_store
```
