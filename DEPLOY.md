# Deploy MVH Flores — Guía v1

Stack: Vercel (frontend) + Railway (API) + Neon + Upstash + Cloudinary + Brevo

---

## PASO 1 — Crear servicios externos

### 1.1 Neon PostgreSQL (gratuito)
1. Ir a https://neon.tech → Sign up
2. Crear proyecto: nombre `mvh-store`, región `US East (Ohio)`
3. Copiar la **Connection string** (formato `postgresql://...?sslmode=require`)
4. En el dashboard de Neon ir a **Branches → main → Connection Details**
5. Guardar: `DATABASE_URL=postgresql://...`

### 1.2 Upstash Redis (gratuito)
1. Ir a https://upstash.com → Sign up
2. Crear database Redis: nombre `mvh-cache`, región `US-East-1`
3. En la database ir a **Details → Connect** → seleccionar **ioredis**
4. Copiar la URL que empieza con `rediss://` (con TLS)
5. Guardar: `REDIS_URL=rediss://:PASSWORD@ENDPOINT.upstash.io:6380`

### 1.3 Cloudinary (gratuito — 25 GB)
1. Ir a https://cloudinary.com → Sign up
2. En el dashboard copiar: Cloud name, API Key, API Secret
3. Guardar:
   ```
   CLOUDINARY_CLOUD_NAME=mvhflores
   CLOUDINARY_API_KEY=...
   CLOUDINARY_API_SECRET=...
   ```

### 1.4 Brevo — Email transaccional (gratuito — 300 emails/día)
1. Ir a https://brevo.com → Sign up
2. Ir a **SMTP & API → SMTP**
3. Copiar servidor, puerto y credenciales
4. Guardar:
   ```
   SMTP_HOST=smtp-relay.brevo.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=tu@email.com
   SMTP_PASS=TU_BREVO_SMTP_KEY
   SMTP_FROM=MVH Flores <hola@mvhflores.co>
   ```

### 1.5 Generar JWT Secrets
Ejecutar dos veces en PowerShell (o en cualquier terminal):
```powershell
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(64))
```
Guardar dos valores distintos:
```
JWT_ACCESS_SECRET=valor1
JWT_REFRESH_SECRET=valor2
```

---

## PASO 2 — Deploy API en Railway

1. Ir a https://railway.app → Sign up con GitHub
2. **New Project → Deploy from GitHub repo** → seleccionar `mvh-store`
3. Railway detecta el `railway.json` automáticamente
4. Ir a **Variables** y agregar todas estas:

```
NODE_ENV=production
PORT=4000
API_BASE_URL=https://TU-APP.railway.app
CORS_ORIGINS=https://mvhflores.vercel.app,https://mvhflores.co
DATABASE_URL=postgresql://...     (de Neon)
REDIS_URL=rediss://...            (de Upstash)
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d
BCRYPT_ROUNDS=12
CLOUDINARY_CLOUD_NAME=mvhflores
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
BOLD_API_KEY=...
BOLD_SECRET_KEY=...
BOLD_WEBHOOK_SECRET=...
BOLD_ENVIRONMENT=production
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=...
SMTP_PASS=...
SMTP_FROM=MVH Flores <hola@mvhflores.co>
LOG_LEVEL=info
```

5. Hacer click en **Deploy** — Railway ejecuta build + migración automáticamente
6. Una vez activo, copiar la URL pública: `https://mvh-api-XXXX.railway.app`
7. Verificar: `https://mvh-api-XXXX.railway.app/api/v1/health`

---

## PASO 3 — Deploy Frontend en Vercel

1. Ir a https://vercel.com → Sign up con GitHub
2. **Add New → Project** → seleccionar repo `mvh-store`
3. Configurar:
   - **Framework Preset:** Next.js (auto-detectado)
   - **Root Directory:** `apps/web`  ← IMPORTANTE
   - Build/Output: Vercel lee `apps/web/vercel.json` automáticamente
4. Agregar **Environment Variables**:

```
NEXT_PUBLIC_API_URL=https://mvh-api-XXXX.railway.app/api/v1
NEXT_PUBLIC_SITE_URL=https://mvhflores.vercel.app
NEXT_PUBLIC_WHATSAPP_NUMBER=573224513906
NEXT_PUBLIC_WHATSAPP_LINK=https://wa.link/fusg0p
```

5. Click **Deploy**
6. Una vez activo, copiar la URL: `https://mvhflores.vercel.app` (o la que asigne Vercel)

---

## PASO 4 — Actualizar CORS en Railway

Una vez que tengas la URL de Vercel, volver a Railway y actualizar:
```
CORS_ORIGINS=https://mvhflores.vercel.app,https://mvhflores.co,https://www.mvhflores.co
API_BASE_URL=https://mvh-api-XXXX.railway.app
```
Luego redeploy.

---

## PASO 5 — Seed inicial (primer admin)

Desde tu máquina local, con el `DATABASE_URL` de Neon en el clipboard:

```powershell
# En el repo local
$env:DATABASE_URL="postgresql://..."  # URL de Neon
cd apps/api
pnpm db:seed
```

O desde Railway: **Settings → Deploy → Run Command** → `pnpm --filter @mvh/api db:seed`

---

## PASO 6 — Dominio propio (opcional, si tienes mvhflores.co)

### API (Railway)
- En Railway: **Settings → Networking → Custom Domain** → agregar `api.mvhflores.co`
- En tu registrador de dominio: agregar CNAME `api` → la URL de Railway

### Frontend (Vercel)
- En Vercel: **Settings → Domains** → agregar `mvhflores.co` y `www.mvhflores.co`
- En tu registrador: agregar los registros A/CNAME que muestra Vercel

---

## Resumen de costos (tier gratuito)

| Servicio   | Plan   | Límite free                        |
|------------|--------|------------------------------------|
| Vercel     | Hobby  | 100 GB bandwidth, builds ilimitados|
| Railway    | Trial  | $5 crédito → luego ~$3-5/mes      |
| Neon       | Free   | 0.5 GB, 191 compute hours/mes      |
| Upstash    | Free   | 10K comandos/día, 256 MB           |
| Cloudinary | Free   | 25 GB storage, 25K transforms/mes  |
| Brevo      | Free   | 300 emails/día                     |