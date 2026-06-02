# MVH Flores — Documentación maestra del proyecto

Ecommerce headless de floristería premium (Barranquilla, Colombia). Monorepo Turborepo + pnpm.
Reemplaza la tienda anterior en WordPress + WooCommerce (mvhflores.com).

> **Este es el ÚNICO archivo de documentación del proyecto.** Contiene todo: estructura, servicios,
> API, frontend, modelos de datos, servicios de terceros, convenciones y reglas. Se carga
> automáticamente en cada sesión. Si algo no está aquí, hay que agregarlo aquí (no crear otros docs).

---

## ⚠️ REGLAS DE ORO (leer siempre primero)

1. **DOCUMENTAR CADA CAMBIO.** Toda modificación al proyecto (nuevo módulo, endpoint, campo de BD,
   componente, dependencia, regla de negocio, cambio de comportamiento) **debe reflejarse en este
   archivo en el mismo commit**. Si agregas un endpoint, actualiza la tabla de endpoints; si cambias
   el esquema, actualiza la sección de modelos; etc. Mantener CLAUDE.md 100% al día es obligatorio.
2. **DINERO EN PESOS, NUNCA CENTAVOS.** Todos los montos se almacenan y operan como **enteros de
   pesos colombianos (COP)**. No hay centavos, no hay decimales, no hay conversiones `*100`/`/100`.
   `formatCOP()` recibe pesos directamente. Ver §10.
3. **CACHÉ VERSIONADO.** Si cambias la *forma* de datos cacheados (renombrar/quitar campos), **sube
   `CACHE_VERSION`** en `apps/api/src/lib/cache.ts`. Ver §12.
4. **PETICIONES AL API:** en Client Components usar `authFetch`; en Server Components usar `api`/`apiFetch`. Nunca `fetch` manual con `localStorage`. Ver §6.
5. **RESPUESTAS DEL API:** siempre con los helpers de `apps/api/src/lib/http.ts` (`sendSuccess`, etc.). Nunca `res.json()` directo. Ver §7.
6. **ESTILOS:** usar las clases semánticas del tema (`bg-primary`, `text-accent`, `bg-surface`…), nunca hex de marca ni `burgundy/gold/cream`. Ver §15.

---

## 1. Stack y puertos

| Capa | Tecnología | Puerto dev |
|------|-----------|-----------|
| Frontend | Next.js 16 App Router (Turbopack por defecto), React 19, TypeScript 6, TailwindCSS 4 | 3000 |
| Estado cliente | Zustand 5 (carrito + auth + búsqueda), TanStack Query v5 (server state) | — |
| Backend | Node.js 22 + Express 5, Prisma ORM 7 (driver adapter `@prisma/adapter-pg`) | 4000 |
| Base de datos | PostgreSQL 16 (Neon en prod) | 5432 |
| Cache / colas | Redis + BullMQ (Upstash en prod) | 6379 |
| Storage de imágenes | Cloudinary (uploads restringidos + URLs firmadas) | — |
| Pasarela de pago | Bold (Colombia) — botón embebido + webhook HMAC-SHA256 | — |
| Emails | Nodemailer + cola BullMQ (Brevo/SMTP en prod) | — |
| Build | Turborepo + pnpm workspaces | — |
| Deploy | Vercel (web) + Railway o VPS (API) | — |

- **API base URL (dev):** `http://localhost:4000/api/v1`
- **Prisma Studio:** `http://localhost:5555`

---

## 2. Estructura del monorepo

```
mvh-store/
├── apps/
│   ├── web/          Next.js 14 App Router — tienda pública + panel admin (/admin)
│   └── api/          Express + Prisma — REST API
├── packages/
│   ├── types/        Interfaces TS compartidas → import { ... } from '@mvh/types'
│   ├── utils/        Utilidades compartidas → '@mvh/utils' (formatCOP, slugify, …)
│   └── config/       tsconfig base compartido (@mvh/config)
├── docker-compose.yml  Postgres 16 + Redis 7 para dev
├── CLAUDE.md         ESTE archivo — única fuente de documentación
└── README.md         Puntero corto a este archivo
```

> No existe `apps/admin` separado: el panel admin vive dentro de `apps/web` en la ruta `/admin`.

### Árbol detallado `apps/api/src/`

```
apps/api/src/
├── server.ts                 Entry point (createApp + listen + graceful shutdown)
├── app.ts                    Express app: helmet, CORS allowlist, compression, express.json
│                             (con verify→req.rawBody para webhook Bold), pino-http, rate-limit
├── routes.ts                 Router central: monta cada módulo bajo /api/v1
├── config/
│   ├── env.ts                Validación Zod de TODAS las env vars (falla al arrancar si faltan)
│   ├── prisma.ts             Singleton PrismaClient (Prisma 7: driver adapter @prisma/adapter-pg)
│   ├── redis.ts              getRedis() (cache) + createBullMQConnection()
│   └── logger.ts             Pino (pretty en dev, JSON en prod, redacta secretos)
├── lib/
│   ├── http.ts               sendSuccess/sendCreated/sendNoContent/sendError
│   ├── errors.ts             AppError + NotFoundError/BadRequestError/ConflictError/ForbiddenError
│   ├── async-handler.ts      asyncHandler() — envuelve controladores async
│   ├── jwt.ts                Firma/verifica access + refresh tokens
│   ├── pagination.ts         buildPaginated(), getSkipTake()
│   ├── cache.ts              cache.get/set/del/delPattern — CON NAMESPACE VERSIONADO (§12)
│   └── cloudinary.ts         instancia cloudinary + cloudinaryConfigured
├── middlewares/
│   ├── auth.ts               requireAuth, optionalAuth, requireRole('ADMIN','STAFF')
│   ├── validate.ts           validate(zodSchema, 'body'|'params'|'query')
│   ├── error-handler.ts      Handler central → JSON consistente; mapea Zod y Prisma (P2002/P2025/P2003)
│   ├── not-found.ts          404 handler
│   └── rate-limit.ts         generalLimiter + authLimiter (más estricto)
├── modules/
│   ├── auth/                 register, login, refresh, logout, me
│   ├── products/             GET /products (filtros), /products/featured, /products/:slug
│   │   └── product.mapper.ts Aplana ProductImage→Media (image.media.url → image.url)
│   ├── categories/           GET /categories (árbol), /categories/:slug
│   ├── orders/               POST /orders, GET /orders/:id, GET /orders (mis pedidos)
│   ├── payments/             POST /orders/:id/pay, POST /webhooks/bold
│   │   ├── payment-provider.interface.ts  Abstracción PaymentProvider
│   │   └── bold.provider.ts  BoldPaymentProvider (firma de integridad + verify webhook)
│   ├── delivery/             GET /delivery/zones, /delivery/slots (públicos)
│   ├── coupons/              POST /coupons/validate
│   ├── addresses/            CRUD direcciones del usuario (auth)
│   ├── site-content/         GET /site-content/:key (politicas, faq, privacidad, theme)
│   ├── contact/              POST /contact
│   ├── health/               GET /health (ping a BD)
│   └── admin/                TODO /admin/* (requiere ADMIN o STAFF)
│       ├── admin.routes.ts   Router del panel (aplica requireAuth + requireRole)
│       ├── admin.schemas.ts  Zod schemas del admin (productos, categorías, cupones, media, …)
│       ├── admin-products.*  CRUD productos + imágenes + variantes + precio/descuento + delete
│       ├── admin-categories.*  CRUD categorías
│       ├── admin-orders.*    Listar/ver/cambiar estado de pedidos
│       ├── admin-metrics.*   Dashboard (ingresos, conteos)
│       ├── admin-coupons.*   CRUD cupones
│       ├── admin-delivery.*  Zonas / franjas / fechas bloqueadas
│       └── admin-media.*     Biblioteca: list, upload, sync Cloudinary, PATCH (nombre/alt), delete
├── queues/
│   ├── email.queue.ts        Cola BullMQ "emails" + enqueueOrderConfirmation/enqueueStatusChanged
│   └── email.worker.ts       Worker que renderiza y envía con nodemailer
└── __tests__/                Tests Vitest (utils.test.ts, lib.test.ts)
```

> **Prisma 7 (ver §14):** además existen `apps/api/prisma.config.ts` (config requerida por Prisma 7,
> reemplaza el bloque `"prisma"` de package.json y carga `.env`) y `apps/api/src/generated/prisma/`
> (cliente generado por el generator `prisma-client` — **gitignored**; se regenera con `prisma generate`).
> Los imports de `@prisma/client` se hicieron relativos a esa carpeta (`../generated/prisma/client`).

### Árbol detallado `apps/web/src/`

```
apps/web/src/
├── app/
│   ├── layout.tsx            Root layout: fuentes next/font, ThemeCssVars, HeaderServer, Footer, providers
│   ├── page.tsx              Home: hero (imagen del tema), ocasiones, destacados, promociones, CTA
│   ├── categoria/[slug]/     Catálogo por categoría (filtros precio, sort, paginación, price-filter.tsx)
│   ├── producto/[slug]/      Detalle producto + add-to-cart-button.tsx (variantes, cantidad)
│   ├── checkout/             Wizard de compra (dirección → entrega → cupón → pago)
│   ├── pedido/[id]/          Estado del pedido + BoldPaymentButton (polling PENDING→PAID)
│   ├── contacto/, politicas/, preguntas-frecuentes/, privacidad/
│   ├── auth/login/, auth/registro/
│   └── admin/                Panel (protegido por layout.tsx → rol ADMIN/STAFF)
│       ├── layout.tsx        Guard de auth + sidebar (NAV)
│       ├── page.tsx          Dashboard métricas
│       ├── productos/        Lista (filtros: búsqueda, categoría, estado) + nuevo/ + [id]/ (form)
│       │   └── _components/product-form.tsx   Form crear/editar (precio+descuento, imágenes, variantes, eliminar)
│       ├── categorias/, pedidos/, cupones/, entregas/, contenido/, media/
│       └── configuracion/temas/   Editor visual del tema (General, Marca, Botones, secciones)
├── components/
│   ├── theme-css-vars.tsx    Server Component: inyecta <style> con --th-* (usa getTheme())
│   ├── header-server.tsx     Server: arma nav desde /categories + logo del tema → <Header>
│   ├── header.tsx            Client: nav sticky, mobile menu, carrito, búsqueda, logo
│   ├── footer.tsx            Server (async): footer + logo claro del tema
│   ├── logo.tsx              Logo: imagen del tema si existe, si no logo tipográfico
│   ├── product-card.tsx, cart-drawer.tsx, search-modal.tsx
│   ├── bold-payment-button.tsx   Inyecta el script del botón de Bold con la config firmada
│   └── media-library.tsx     Modal selector de imágenes (reutilizado por producto, temas)
├── lib/
│   ├── api-client.ts         apiFetch() + ApiClientError + API_URL (maneja 204/sin cuerpo)
│   ├── auth-fetch.ts         authFetch() — agrega Bearer, auto-refresh en 401
│   ├── api.ts                Objeto api.* para Server Components (getCategories, getProductBySlug, …)
│   ├── theme.ts              ThemeConfig, DEFAULT_THEME, buildThemeCss(), mergeTheme(), hexToRgbChannels()
│   ├── theme-server.ts       getTheme() — carga el tema desde el API (Server Components)
│   └── cn.ts                 clsx + tailwind-merge
├── store/                    Zustand: auth-store.ts, cart-store.ts (localStorage), search-store.ts
├── providers/
│   ├── auth-provider.tsx     Restaura sesión al montar (refresh)
│   └── query-provider.tsx    QueryClient (staleTime global: 60s) ← OJO al cachear (§6/§13)
└── styles/globals.css        Tailwind 4: `@import "tailwindcss"` + `@config "../../tailwind.config.ts"`,
                              tokens --th-*, clases .btn-*, .container-mvh, animaciones
```

> **Config del frontend (raíz de `apps/web/`):** `tailwind.config.ts` (JS, se sigue usando vía `@config`),
> `postcss.config.js` (Tailwind 4 → plugin `@tailwindcss/postcss`; ya **no** lleva `autoprefixer`/`postcss-import`,
> van integrados) y `eslint.config.mjs` (ESLint flat config — reemplaza `.eslintrc.json`). Ver §24.

---

## 3. Comandos de desarrollo

```bash
pnpm install                              # instalar dependencias (monorepo)
pnpm dev                                  # levanta web (:3000) + api (:4000) en paralelo
pnpm --filter web dev                     # solo frontend
pnpm --filter api dev                     # solo API (tsx watch)
pnpm build                                # build de todo
pnpm --filter web type-check              # tsc --noEmit (web)
pnpm --filter api type-check              # tsc --noEmit (api)
pnpm test                                 # tests (Vitest)

# Prisma / BD (filtro: api o @mvh/api)
pnpm --filter @mvh/api db:migrate         # prisma migrate dev (crear/aplicar migración)
pnpm --filter @mvh/api db:migrate:deploy  # aplicar migraciones (producción)
pnpm --filter @mvh/api db:seed            # poblar BD (tsx prisma/seed.ts)
pnpm --filter @mvh/api db:studio          # Prisma Studio (GUI)
pnpm --filter @mvh/api db:reset           # reset + reseed (¡borra datos!)
pnpm --filter api exec prisma generate    # regenerar cliente Prisma (tras cambiar schema)
```

**Entorno Windows / node por `fnm`:** en este equipo `node`/`pnpm` NO están en el PATH del shell
no interactivo (los gestiona fnm). Para correr comandos hay que prepender el dir del multishell:
```powershell
$dir = (Get-ChildItem "$env:LOCALAPPDATA\fnm_multishells" -Directory | Sort-Object LastWriteTime -Descending | Where-Object { Test-Path (Join-Path $_.FullName 'node.exe') } | Select-Object -First 1).FullName
$env:Path = "$dir;$env:Path"
```
- `prisma generate` falla con **EPERM** (unlink del query engine .dll) mientras `pnpm dev` corre:
  hay que **detener el dev server** antes de generar/migrar.
- Cambios en el backend requieren **reiniciar la API** (o que `tsx watch` recargue) para tomar efecto.
- **Prisma 7:** `migrate dev`/`db push` **ya NO** ejecutan `prisma generate` automáticamente — correrlo
  aparte tras cambiar el schema. La config vive en `apps/api/prisma.config.ts` (carga `.env`, ahí va la
  `DATABASE_URL` para el CLI). El `postinstall` (`prisma generate`) regenera el cliente en `src/generated/prisma`.

### Flujo de migración (importante)
1. Editar `apps/api/prisma/schema.prisma`. (En Prisma 7 el `datasource` **no** lleva `url`; la URL del CLI
   está en `prisma.config.ts`. El runtime se conecta vía driver adapter en `config/prisma.ts`.)
2. Si hay que **preservar/transformar datos** (renombrar columnas, etc.), escribir la migración SQL a
   mano en `apps/api/prisma/migrations/<timestamp>_<nombre>/migration.sql` (rename + UPDATE).
3. El usuario corre `pnpm --filter @mvh/api db:migrate` (aplica) y luego `… exec prisma generate`
   (Prisma 7 ya no lo encadena solo).
4. Reiniciar `pnpm dev`.

---

## 4. Variables de entorno

### apps/api/.env (validadas en `config/env.ts` — la app no arranca si falta una obligatoria)
```
NODE_ENV=development
PORT=4000
API_BASE_URL=http://localhost:4000
WEB_BASE_URL=http://localhost:3000          # base del frontend (redirección Bold)
CORS_ORIGINS=http://localhost:3000          # CSV de orígenes permitidos
DATABASE_URL=postgresql://...               # OBLIGATORIA
REDIS_URL=redis://localhost:6379            # opcional (sin esto: sin cache/colas)
JWT_ACCESS_SECRET=<min 32 chars>            # OBLIGATORIA
JWT_REFRESH_SECRET=<min 32 chars>           # OBLIGATORIA
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d
BCRYPT_ROUNDS=10
RATE_LIMIT_WINDOW_MS=900000  RATE_LIMIT_MAX=100  AUTH_RATE_LIMIT_MAX=10
CLOUDINARY_CLOUD_NAME=  CLOUDINARY_API_KEY=  CLOUDINARY_API_SECRET=
BOLD_API_KEY=            # llave de IDENTIDAD (pública, va en data-api-key)
BOLD_SECRET_KEY=         # llave SECRETA (firma de integridad + verificación webhook)
BOLD_WEBHOOK_SECRET=     # opcional: override de llave para verificar webhook
BOLD_ENVIRONMENT=sandbox # sandbox | production
BOLD_WEBHOOK_SKIP_VERIFY=false  # solo dev/sandbox: omite verificación de firma
SMTP_HOST=  SMTP_PORT=587  SMTP_SECURE=false  SMTP_USER=  SMTP_PASS=
SMTP_FROM=MVH Flores <hola@mvhflores.co>
LOG_LEVEL=info
```

### apps/web/.env.local
```
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_WHATSAPP_NUMBER=573224513906
NEXT_PUBLIC_WHATSAPP_LINK=https://wa.me/573224513906
```

---

## 5. Cómo crear un módulo de API (patrón por dominio)

Cada feature vive en `apps/api/src/modules/<dominio>/` con: `*.schemas.ts` (Zod), `*.service.ts`
(lógica + Prisma, sin Express), `*.controller.ts` (HTTP), `*.routes.ts` (rutas). Se monta en `routes.ts`.

```ts
// service
export const miModuloService = {
  async list() { return prisma.miModelo.findMany({ orderBy: { createdAt: 'desc' } }); },
  async getById(id: string) {
    const item = await prisma.miModelo.findUnique({ where: { id } });
    if (!item) throw new NotFoundError('Recurso no encontrado');
    return item;
  },
};

// controller (SIEMPRE envolver en asyncHandler)
export const miModuloController = {
  list: asyncHandler(async (_req, res) => sendSuccess(res, await miModuloService.list())),
  getById: asyncHandler(async (req: Request<{ id: string }>, res) =>
    sendSuccess(res, await miModuloService.getById(req.params.id))),
};

// routes
const router = Router();
router.get('/', miModuloController.list);
router.get('/:id', validate(idParamsSchema, 'params'), miModuloController.getById);
router.post('/', requireAuth, requireRole('ADMIN'), validate(createSchema), miModuloController.create);
export { router as miModuloRouter };

// routes.ts → router.use('/mi-modulo', miModuloRouter);
```

---

## 6. Cómo pedir datos al API (frontend)

### Client Components → `authFetch` de `@/lib/auth-fetch`
Agrega `Authorization: Bearer <token>` desde Zustand, reintenta una vez con refresh en 401, lanza
`ApiClientError` con `status`/`code`, y desenvuelve `json.data`. Maneja respuestas 204 (DELETE).
```ts
const data = await authFetch<MiTipo>('/ruta');                                  // GET
const r = await authFetch<MiTipo>('/ruta', { method: 'POST', body: payload });  // POST/PUT/PATCH
await authFetch(`/admin/cupones/${id}`, { method: 'DELETE' });                  // DELETE (204 OK)
```
**Nunca** usar `fetch` manual con `localStorage.getItem('mvh_access_token')`.

### Server Components → `api` de `@/lib/api` (o `apiFetch` con tags/revalidate)
```ts
import { api } from '@/lib/api';
const categories = await api.getCategories();
const product = await api.getProductBySlug(slug);
// o: apiFetch<Product[]>('/products/featured', { tags: ['products:featured'], revalidate: 300 })
```

### TanStack Query (Client con reactividad) — patrón estándar
```ts
const { data, isLoading } = useQuery({ queryKey: ['recurso', id], queryFn: () => authFetch(`/admin/recurso/${id}`) });
const qc = useQueryClient();
const m = useMutation({ mutationFn: (p) => authFetch('/admin/recurso', { method:'POST', body:p }),
  onSuccess: () => qc.invalidateQueries({ queryKey: ['recurso'] }) });
```
> **OJO:** el QueryClient tiene `staleTime: 60_000`. Tras una mutación que afecte un detalle, invalida
> **y/o** usa `setQueryData` para reflejar el cambio al instante (si no, al navegar al detalle dentro
> del minuto se ve dato viejo). Ej.: el toggle de "activo" en la lista de productos hace
> `setQueryData(['admin-product', id], productoActualizado)`. Para sincronizaciones largas (sync de
> Cloudinary) usar **estado local** (`useState`) en vez de `isPending` de la mutación.

---

## 7. Formato de respuesta del API

```jsonc
{ "ok": true, "data": { ... } }                                  // éxito
{ "ok": true, "data": { "data": [...], "meta": { "page":1, "perPage":20, "total":100, "totalPages":5 } } } // paginado
{ "ok": false, "error": { "code": "NOT_FOUND", "message": "...", "details": {} } } // error
```
Helpers en `apps/api/src/lib/http.ts`: `sendSuccess(res,data)` (200), `sendCreated` (201),
`sendNoContent` (204). Errores: lanzar `throw new NotFoundError(...)` etc. (el error-handler los traduce).

---

## 8. Endpoints del API

Base: `http://localhost:4000/api/v1`

### Públicos
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/health` | Health check (ping BD) |
| POST | `/auth/register` · `/auth/login` · `/auth/refresh` · `/auth/logout` | Auth |
| GET | `/auth/me` | Usuario actual (requiere token) |
| GET | `/categories` · `/categories/:slug` | Árbol de categorías / por slug |
| GET | `/products` | Catálogo. Filtros: `category, search, featured, onSale, minPrice, maxPrice` (en pesos), `sort` (newest\|price_asc\|price_desc\|name_asc), `page, perPage` |
| GET | `/products/featured` · `/products/:slug` | Destacados / detalle |
| GET | `/delivery/zones` · `/delivery/slots` | Zonas y franjas activas |
| POST | `/coupons/validate` | Validar cupón `{ code, subtotal }` |
| GET | `/site-content/:key` | Contenido (`politicas`, `faq`, `privacidad`, `theme`) |
| POST | `/contact` | Formulario de contacto |
| POST | `/orders/:id/pay` | Iniciar pago (auth opcional). Bold → `{ provider, paymentId, bold: BoldButtonConfig }`; contraentrega → `bold: null` |
| POST | `/webhooks/bold` | Webhook de Bold (header `x-bold-signature`) |

### Autenticados (Bearer)
| Método | Ruta |
|--------|------|
| GET/POST | `/addresses` · PUT/DELETE `/addresses/:id` |
| POST | `/orders` (crear) · GET `/orders/:id` · GET `/orders` (mis pedidos) |

### Admin (rol ADMIN o STAFF)
| Método | Ruta | Notas |
|--------|------|-------|
| GET | `/admin/metrics` | Dashboard |
| GET/POST | `/admin/products` | Listar (filtros: `search, categoryId, isActive, page`) / crear |
| GET/PUT | `/admin/products/:id` | Obtener / actualizar (precio+descuento, ver §11) |
| PATCH | `/admin/products/:id/toggle-active` | Activar/desactivar (devuelve el producto) |
| DELETE | `/admin/products/:id` | **Eliminar producto** (cascada imágenes/variantes; pedidos conservan histórico) |
| POST | `/admin/products/:id/images` | Agregar imagen — body `{ mediaId, alt?, position? }` (FK a Media) |
| DELETE | `/admin/products/:id/images/:imageId` | Quitar imagen del producto (no borra el Media) |
| POST/PUT/DELETE | `/admin/products/:id/variants[/:variantId]` | Variantes |
| GET/POST | `/admin/categories` · GET/PUT `/admin/categories/:id` · PATCH `…/toggle-active` | |
| GET | `/admin/orders` · GET `/admin/orders/:id` · PATCH `/admin/orders/:id/status` | |
| GET/POST/PUT/PATCH/DELETE | `/admin/coupons[/:id]` | CRUD cupones |
| GET/POST/PUT/PATCH/DELETE | `/admin/delivery/zones[/:id]` · `/admin/delivery/slots[/:id]` | |
| GET/POST | `/admin/delivery/blocked-dates` · DELETE `…/:id` | |
| PUT | `/admin/site-content/:key` | Guardar `politicas, faq, privacidad, theme` |
| GET | `/admin/media` | Listar biblioteca (`?perPage=100`) |
| POST | `/admin/media/upload` | Subir (multipart, campo `file`) → restringida + URL firmada (§9) |
| POST | `/admin/media/sync` | Importar de Cloudinary lo que falte + re-firmar URLs existentes |
| PATCH | `/admin/media/:id` | Editar `{ filename?, alt? }` |
| DELETE | `/admin/media/:id` | Borra de Cloudinary y de BD (FK SetNull en imágenes de producto) |

---

## 9. Sistema de Media / Cloudinary

- **Modelo `Media`** = biblioteca central de imágenes. Campos: `url` (URL de entrega FIRMADA),
  `publicId`, `alt`, `filename`, `mimeType`, `sizeBytes`, `width`, `height`.
- **`ProductImage` referencia `Media` por FK** (`mediaId`, `onDelete: SetNull`). NO guarda la URL.
  La URL/alt se exponen al front uniendo con Media vía `product.mapper.ts` (`flattenImages`/`mapProduct`),
  que transforma `image.media.url → image.url`. **Cualquier servicio que devuelva productos debe usar
  este mapper** (lo usan `products/product.service.ts` y `admin/admin-products.service.ts`).
- **Imágenes restringidas (privadas):** las subidas van a Cloudinary con `access_mode: 'authenticated'`
  (no accesibles por URL pública directa). Para que se vean en admin **y** en la tienda, se entregan con
  **URLs firmadas** (`cloudinary.url(publicId, { sign_url:true, secure:true, version })`,
  helper `signedDeliveryUrl` en `admin-media.service.ts`). La firma deriva del `api_secret`, no expira.
  - *Nota:* el "Public/Restricted" del panel de Cloudinary es `access_control` (tokens temporales), una
    feature distinta de `access_mode`. Nosotros usamos `access_mode` + URLs firmadas (permanentes).
- **Sync (`/admin/media/sync`):** lista la carpeta `mvh-flores` de Cloudinary (paginado, cap 20 páginas),
  crea los Media que falten y **re-firma las URLs existentes** (corrige las que quedaron sin firmar).
  `api.resources` NO devuelve `access_mode`, por eso **siempre se firma** (firmar una pública también funciona).
- **UI:** pestaña `/admin/media` (editar nombre/alt, subir, borrar, sincronizar) + componente modal
  `MediaLibrary` (selector reutilizado en producto y en Temas). Ambos **auto-sincronizan una vez por
  sesión** (flag `sessionStorage 'mvh_media_synced'`) y exponen botón manual de sync con estado local.
- **next/image:** `apps/web/next.config.js` permite `res.cloudinary.com`, `images.unsplash.com`, `mvhflores.co`.

---

## 10. Convención de dinero — PESOS

Todo el sistema usa **enteros de pesos COP** (no centavos). Campos: `Product.price`,
`Product.compareAtPrice`, `ProductVariant.price`, `Order.subtotal/discount/tax/total/shippingFee`,
`OrderItem.unitPrice/subtotal`, `Payment.amount`, `Coupon.value` (pesos si FIXED) / `minPurchase` /
`maxDiscount`, `DeliveryZone.fee`.

- `formatCOP(pesos)` (en `@mvh/utils`) formatea directo, **no divide**. No existe `pesosToCents`.
- A Bold se le envía `order.total` en **pesos** (Bold COP espera pesos; enviar centavos causaba el bug
  de "x100" en el monto). Ver §17.
- Nunca reintroducir centavos ni conversiones `*100`/`/100` para dinero (`/100` solo es válido para
  matemática de porcentajes, p. ej. descuento PERCENT).

---

## 11. Precio y descuento de producto

- El admin ingresa **Precio base** (`price`) + **Descuento** opcional: `discountType` (`PERCENT` | `FIXED`)
  y `discountValue`. El **backend** (`admin-products.service.ts → computePricing`) calcula:
  - sin descuento → `price = base`, `compareAtPrice = null`, `discountType/Value = null`.
  - con descuento → `price = final` (base − %/fijo), `compareAtPrice = base` (precio tachado),
    y guarda `discountType/discountValue` para poder re-editar.
- **Regla:** el descuento no puede dejar el precio en 0 o menos (PERCENT < 100; FIXED < base).
  Validado en el cliente (preview en vivo en `product-form.tsx`) y en el servidor
  (Zod `superRefine` en `admin.schemas.ts` + chequeo en el service).
- La tienda muestra "en oferta" cuando `compareAtPrice > price` (lógica en `product.service` `onSale`).
- Enum Prisma: `DiscountType { PERCENT, FIXED }`.

---

## 12. Caché (Redis) — versionado

`apps/api/src/lib/cache.ts` antepone un **namespace versionado** a todas las claves
(`CACHE_VERSION`, actualmente `'v2'`). **Regla:** cuando cambie la *forma* de los datos cacheados
(renombrar/quitar campos), **subir `CACHE_VERSION`** (`v2`→`v3`): las entradas viejas dejan de leerse
y se regeneran frescas, sin tener que vaciar Redis (esto evitó el bug de `$ NaN` tras pasar a pesos).
Claves de productos: `products:slug:<slug>`, `products:featured:<n>`, `products:list:<base64>`.
Invalidación en mutaciones: `cache.delPattern('products:*')` (admin de productos y de media).

---

## 13. Autenticación y roles

- **Roles:** `CUSTOMER | ADMIN | STAFF`. El panel `/admin/*` exige `ADMIN` o `STAFF`
  (guard en `apps/web/src/app/admin/layout.tsx`; en API `requireAuth + requireRole`).
- **JWT con rotación:** access (15 min, en memoria del cliente) + refresh (30 d, hasheado SHA-256 en BD,
  se rota en cada `/refresh`; si se detecta reuso → revoca todos los tokens del usuario).
- **Frontend:** `useAuthStore` (Zustand) expone `user`, `accessToken`, `login/logout/refreshSession`.
  Fuera de componentes: `useAuthStore.getState()`.

---

## 14. Modelos Prisma (estado actual)

Esquema en `apps/api/prisma/schema.prisma` (PostgreSQL). **Prisma 7:** generator `prisma-client` con
`output = "../src/generated/prisma"`; el `datasource` solo declara `provider` (la `url` se quitó del
schema y vive en `prisma.config.ts`); el cliente se instancia con driver adapter `@prisma/adapter-pg`
(`config/prisma.ts`). Relaciones resumidas:
```
User ──< Address, Order, RefreshToken, AuditLog
Category (self-ref parent/children) ──< Product
Product ──< ProductImage >── Media,  ──< ProductVariant, OrderItem, InventoryMovement
Order ──< OrderItem, Payment, OrderStatusHistory ; >── Coupon, Address
Media ──< ProductImage
DeliveryZone, DeliverySlot, BlockedDate, SiteContent, Banner (standalone)
```

Campos clave (post-migración pesos + media + descuento):
- **Product**: `slug` (unique), `name`, `description`, `shortDescription`, `price` (pesos),
  `compareAtPrice?` (derivado), `discountType?` (`DiscountType`), `discountValue?`, `currency`,
  `isFeatured`, `isActive`, `stock`, `categoryId?`, `metaTitle?`, `metaDescription?`, relaciones
  `images (ProductImage[])`, `variants`, `orderItems`, `inventoryMovements`.
- **ProductImage**: `productId`, `mediaId?` (FK→Media, SetNull), `alt?` (override), `position`. (Sin `url`.)
- **Media**: `url`, `publicId?`, `alt?`, `filename`, `mimeType?`, `sizeBytes?`, `width?`, `height?`, `productImages`.
- **ProductVariant**: `sku` (unique), `name`, `price` (pesos), `stock`, `isDefault`.
- **Category**: `slug` (unique), `name`, `description?`, `imageUrl?`, `position`, `isActive`, `parentId?`.
- **Order**: snapshot completo. `orderNumber` (unique `MVH-AAAA-#####`), datos comprador/guest, envío
  (snapshot), `deliveryDate/Slot/Zone`, `shippingFee`, `subtotal`, `discount`, `tax`, `total` (pesos),
  `couponId?/couponCode?`, `status` (`OrderStatus`), `customerNote?`, `internalNote?`, `items`, `payments`, `statusHistory`.
- **OrderItem**: `productId?`, `variantId?`, snapshots `productName/variantName/imageUrl`, `unitPrice`, `quantity`, `subtotal`.
- **Payment**: `orderId`, `provider` ("bold"/"cash"), `method` (`PaymentMethod`), `status` (`PaymentStatus`),
  `amount` (pesos), `providerPaymentId?`, `providerReference?`, `rawRequest?/rawResponse?` (Json), `paidAt?`.
- **Coupon**: `code` (unique), `type` (`CouponType`), `value` (% o pesos), `minPurchase`, `maxDiscount?`,
  `usageLimit?`, `usageCount`, `perUserLimit?`, `startsAt?/expiresAt?`, `isActive`.
- **DeliveryZone**: `name`, `fee` (pesos), `neighborhoods String[]`, `isActive`.
- **DeliverySlot**: `label`, `startTime`, `endTime`, `position`, `isActive`.
- **BlockedDate**: `date` (unique), `reason?`.
- **SiteContent**: `key` (PK: `politicas|faq|privacidad|theme`), `content` (text/JSON).
- **Banner**: existe en el esquema pero **NO se usa** (la imagen del hero vive en el tema, §15).

Enums: `Role`, `OrderStatus` (PENDING→PAID→PROCESSING→OUT_FOR_DELIVERY→DELIVERED / CANCELLED / REFUNDED),
`PaymentStatus`, `PaymentMethod` (BOLD_CARD/PSE/NEQUI, CASH_ON_DELIVERY), `CouponType` (PERCENT/FIXED),
`DiscountType` (PERCENT/FIXED), `InventoryReason`.

---

## 15. Sistema de tema visual (`--th-*`)

Estilos centralizados en variables CSS `--th-*`. El tema se guarda como JSON en `SiteContent.key='theme'`
y se edita en `/admin/configuracion/temas`.

| Archivo | Rol |
|---------|-----|
| `apps/web/src/lib/theme.ts` | Tipos (`ThemeConfig`, `SectionStyle`), `DEFAULT_THEME`, `buildThemeCss()`, `mergeTheme()`, `hexToRgbChannels()` |
| `apps/web/src/lib/theme-server.ts` | `getTheme()` (Server) — lee el tema del API |
| `apps/web/src/components/theme-css-vars.tsx` | Server Component → inyecta `<style>` con `--th-*` globales + por sección |
| `apps/web/src/styles/globals.css` | Defaults de los tokens (hex + canales RGB) |
| `apps/web/tailwind.config.ts` | Colores semánticos + `fontFamily.*` usan `var(--th-*)` |

### Clases semánticas (NO usar hex de marca ni burgundy/gold/cream)
`primary`, `primary-light`, `accent`, `accent-light`, `surface`, `muted`, `ink` → mapean a `--th-*`.
Variaciones por **opacidad** (`text-primary/60`, `border-primary/10`, `bg-accent/20`), no escalas.
Funciona porque cada token tiene gemelo RGB (`--th-primary-rgb: 90 16 40`) y la paleta es
`rgb(var(--th-primary-rgb) / <alpha-value>)`. `burgundy/gold/cream` quedan como **legacy/fallback**.
**Convención de sección:** fondo = `bg-surface`, texto = `text-primary` (incluso en footer/hero oscuros,
cuyo `surface` por defecto es oscuro y su `primary` claro).

### `ThemeConfig`
```ts
type FontKey = 'display' | 'serif' | 'sans';
type SectionKey = 'header' | 'footer' | 'hero' | 'tienda' | 'producto' | 'checkout';
interface ThemeConfig {
  colors: { primary; primaryLight; accent; accentLight; surface; muted; ink };   // hex
  fonts:  { heading: FontKey; body: FontKey; ui: FontKey };
  buttons:{ radius: number; uppercase: boolean };                                 // radius 0|4|8|9999
  logo:   { lightUrl: string|null; darkUrl: string|null };                        // logos subibles
  hero:   { imageUrl: string|null };                                              // imagen del hero
  sections: Record<SectionKey, { background; text; accent; headingFont; bodyFont }>;
}
```
- **Logo:** se sube desde Temas → pestaña **Marca** (claro para fondos oscuros = footer; oscuro para
  fondos claros = header). El componente `Logo` usa la imagen si existe, si no el logo tipográfico.
  `HeaderServer` pasa `logo.darkUrl`; `Footer` usa `logo.lightUrl`.
- **Hero:** la imagen destacada de la home se elige en Temas → Marca; `page.tsx` la lee con `getTheme()`
  (fallback a una imagen por defecto).
- **Por sección:** `buildThemeCss()` emite `:root` + un bloque `[data-th-section="<key>"]{…}` por sección
  que sobreescribe surface/primary/accent + fuentes en ese subárbol. Las raíces de sección llevan
  `data-th-section` (ej. `<footer data-th-section="footer">`). Para agregar una sección: añadir la key a
  `SectionKey`/`SECTION_ORDER`/`SECTION_LABELS` y el atributo en su raíz.

---

## 16. Clases CSS y fuentes

Clases reutilizables (`globals.css`): `.btn-primary`, `.btn-outline`, `.btn-on-dark`, `.container-mvh`
(max-w-7xl + padding), `.eyebrow`, `.gold-divider`, `.ornament-line`, `.prose-mvh`, `.product-card`,
`.shadow-premium`, `.shadow-premium-lg`.

Fuentes (precargadas con `next/font/google` en `layout.tsx`):
| Tailwind | CSS var | Fuente |
|----------|---------|--------|
| `font-display` | `var(--font-display)` | Playfair Display |
| `font-serif` | `var(--font-serif)` | Cormorant Garamond |
| `font-sans` | `var(--font-sans)` | Inter |

Las clases del tema referencian `var(--th-font-heading/body/ui)` → intercambiables desde admin.

---

## 17. Pagos — Bold (botón embebido)

Método: **botón de pagos de Bold** + firma de integridad calculada en el servidor (NO API de payment-link).
1. Checkout crea el pedido (PENDING) → `router.push('/pedido/[id]')`.
2. `/pedido/[id]` pide config a `POST /orders/:id/pay`; el server arma `BoldButtonConfig` con
   `amount = order.total` (**pesos**), la llave de identidad (`BOLD_API_KEY`) y la firma
   `SHA256(referencia + monto + divisa + BOLD_SECRET_KEY)`.
3. `<BoldPaymentButton>` (`components/bold-payment-button.tsx`) inyecta el script con los `data-*`.
   El usuario paga; Bold redirige a `/pedido/[id]?status=success` (el redirect **no** marca PAID).
4. Bold notifica a `POST /webhooks/bold`. Se verifica `x-bold-signature` (HMAC con `BOLD_SECRET_KEY`;
   en sandbox se puede omitir con `BOLD_WEBHOOK_SKIP_VERIFY=true`). Se busca el `Payment` por
   `providerReference` (= `orderNumber`) y se transiciona PENDING→PAID/CANCELLED.
5. La página de pedido hace polling PENDING→PAID.

El body crudo del webhook se captura en el `verify` de `express.json` (`app.ts`) como `req.rawBody`
(la firma se valida sobre los bytes exactos, **nunca** re-serializar el JSON). Capa abstracta:
`PaymentProvider` (interface) → `BoldPaymentProvider`; el resto del sistema no habla con Bold directo.

---

## 18. Emails (cola)

Las acciones que generan correos (confirmación de pedido, cambio de estado) encolan en BullMQ
(`queues/email.queue.ts`) y el `email.worker.ts` los renderiza y envía con nodemailer (SMTP de Brevo en
prod). Sin `REDIS_URL` no hay cola; sin SMTP no se envían (degradación silenciosa, no rompe el flujo).

- **Consumo de Redis en reposo (Upstash cobra por comando):** BullMQ hace *polling* aunque nadie use
  la app. El worker se configura con `drainDelay: 60` (s) y `stalledInterval: 300_000` (ms) para bajar
  ~12x los comandos en reposo (de ~840/h a ~70/h). **No afecta la latencia de envío:** al encolar un
  job, el push despierta el bloqueo al instante; el `drainDelay` solo aplica con la cola vacía. Si vuelve
  a notarse consumo alto en Upstash, revisar primero estos intervalos (no el cache: `cache.ts` solo
  ejecuta comandos bajo demanda).

---

## 19. Cómo crear una página de admin

1. Carpeta en `apps/web/src/app/admin/mi-seccion/` (`page.tsx`, `nuevo/page.tsx`, `[id]/page.tsx`).
2. Agregar al NAV en `apps/web/src/app/admin/layout.tsx`: `{ href:'/admin/mi-seccion', label:'…', icon:'◆' }`.
3. `'use client'`, cargar con `useQuery` + `authFetch`, loading `text-primary/40 animate-pulse`.
4. Botón guardar: `bg-primary text-surface text-xs uppercase tracking-widest px-6 py-2.5 hover:bg-primary-light disabled:opacity-40`.
5. Feedback: `mutation.isError` → rojo; `mutation.isSuccess` → `text-emerald-600`.

---

## 20. Convenciones generales

- Client Components: `'use client'` solo cuando hay interactividad/estado/hooks. Resto: Server Components.
- Params tipados en API: `Request<{ id: string }>` (por `noUncheckedIndexedAccess`).
- Todos los controladores Express envueltos en `asyncHandler()`.
- Sin `console.log` en prod: usar el logger Pino (`config/logger.ts`).
- Imágenes: subir vía `/admin/media/upload` (Cloudinary); referenciar por `mediaId`. Nunca local.
- Markdown de referencias de archivos en respuestas: usar enlaces `[texto](ruta)` relativos.

---

## 21. Deployment

Producción objetivo: **Vercel (web) + Railway (API) + Neon (Postgres) + Upstash (Redis) + Cloudinary + Brevo (SMTP)**.

- **Web → Vercel:** Root Directory `apps/web` (lee `apps/web/vercel.json`). Env: `NEXT_PUBLIC_API_URL`,
  `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_WHATSAPP_NUMBER`, `NEXT_PUBLIC_WHATSAPP_LINK`.
- **API → Railway:** detecta `railway.json`, build + `db:migrate:deploy` automático. Cargar todas las
  env de §4 (con `NODE_ENV=production`, `BOLD_ENVIRONMENT=production`, `BCRYPT_ROUNDS=12`, `CORS_ORIGINS`
  con los dominios de Vercel/propios). Alternativa: VPS Ubuntu con PM2 + Nginx.
- **DB → Neon:** `DATABASE_URL=postgresql://...?sslmode=require`.
- **Cache → Upstash:** `REDIS_URL=rediss://...` (TLS).
- **Seed inicial (primer admin):** correr `db:seed` con el `DATABASE_URL` de prod, o desde Railway.
- Tras tener la URL de Vercel, actualizar `CORS_ORIGINS` y `API_BASE_URL` en la API y redeploy.

---

## 22. Servicios de terceros (resumen)

| Servicio | Uso | Config |
|----------|-----|--------|
| **Cloudinary** | Almacenamiento/CDN de imágenes (subidas restringidas + URLs firmadas) | `CLOUDINARY_*`; carpeta `mvh-flores` |
| **Bold** (Colombia) | Pasarela de pago (botón embebido + webhook HMAC) | `BOLD_*` |
| **Neon** | PostgreSQL gestionado (prod) | `DATABASE_URL` |
| **Upstash** | Redis gestionado: cache + colas BullMQ (prod) | `REDIS_URL` |
| **Brevo** | SMTP para emails transaccionales (prod) | `SMTP_*` |
| **Vercel** | Hosting del frontend Next.js | — |
| **Railway** | Hosting de la API Express | `railway.json` |

---

## 23. Credenciales de prueba (post-seed)

| Rol | Email | Password |
|-----|-------|----------|
| Admin | `admin@mvhflores.com` | `Admin123!` |
| Cliente | `cliente@test.com` | `Cliente123!` |

El seed (`apps/api/prisma/seed.ts`) crea: 2 usuarios, ~13 categorías (jerarquía estilo/ocasión),
12 productos con imágenes (Media + ProductImage por FK) y precios reales en pesos, variantes
Mediano/Grande para premium, 4 zonas de entrega, 4 franjas horarias, 1 cupón (`BIENVENIDA10`),
1 dirección demo.
```

---

## 24. Actualización mayor de dependencias (2026-06)

Se actualizaron **todas** las dependencias a su última versión. Saltos mayores e implicaciones:

| Paquete | De → A | Notas de migración |
|---------|--------|--------------------|
| next | 14 → 16.2.6 | Turbopack por defecto (sin `--turbopack`); `next lint` eliminado → ESLint CLI; `params`/`searchParams` ahora **async** (Promises) en páginas server (`categoria/[slug]`, `producto/[slug]`). |
| react / react-dom | 18 → 19.2.6 | + `@types/react`/`@types/react-dom` 19. |
| tailwindcss | 3.4 → 4.3 | `postcss.config.js` usa `@tailwindcss/postcss` (sin `autoprefixer`/`postcss-import`); `globals.css` usa `@import "tailwindcss"` + `@config`; clases renombradas en el código: `flex-shrink-0→shrink-0`, `backdrop-blur-sm→backdrop-blur-xs`, `rounded→rounded-sm`. Se conserva el config JS y el sistema `--th-*` (§15). |
| prisma / @prisma/client | 5.19 → 7.8 | Ver §14: generator `prisma-client` + `output`, driver adapter `@prisma/adapter-pg` (+`pg`), `prisma.config.ts`, imports relativos al cliente generado, `url` fuera del schema. |
| express | 4.21 → 5.2 | `req.params.X` pasa a `string \| string[]`: los handlers con params se tipan `Request<{ id: string }>` (§20). |
| zod | 3.23 → 4.4 | Retrocompatible aquí (`.email()`/`.url()`/`.flatten()` siguen funcionando, deprecados). |
| express-rate-limit | 7 → 8 | Opción `max` → `limit`. |
| eslint | 8 → **9.39** (flat config) | `eslint.config.mjs` con la config flat nativa de `eslint-config-next`. **No 10**: ESLint 10 aún rompe con el plugin de Next 16 (`scopeManager.addGlobals`). 2 reglas nuevas de react-hooks (`set-state-in-effect`, `static-components`) quedan **off** (marcaban código que funciona; revisar aparte). |
| typescript | 5.5 → 6.0 | `ignoreDeprecations: "6.0"` en `tsconfig.base.json` (`node10`/`baseUrl` deprecados en TS 6). |
| vitest | 2 → 4.1 | Requiere `vite` (peer ≥6) — añadido `vite` 8 como devDep; web usa `--passWithNoTests`. |
| @types/node | 20 → **22** | Fijado a la línea 22 (coincide con el runtime Node 22; **no** 25). |
| otras | zustand 5, helmet 8, pino 10 / pino-http 11 / pino-pretty 13, dotenv 17, bcryptjs 3 (sin `@types/bcryptjs`), framer-motion 12, tailwind-merge 3, ioredis 5.11, bullmq, prettier, turbo | Sin cambios de código. |

- **pnpm overrides** (`pnpm-workspace.yaml`): `@types/express`→5 (los `@types/compression`/`@types/multer` arrastraban v4) e `ioredis`→5.11 (BullMQ traía 5.10).
- **Verificado:** `type-check`, `build` y `test` (api: 16 tests) en verde para todo el monorepo; lint del web limpio; el cliente Prisma 7 + adapter se instancian en runtime.
- **Fix Railway build (`PrismaConfigEnvError`):** en build, `DATABASE_URL` no está disponible (solo en
  runtime). `prisma.config.ts` usa `process.env.DATABASE_URL ?? 'postgresql://localhost:5432/placeholder'`
  en lugar del helper `env()` de Prisma (que lanza excepción si la var no existe). `prisma generate` no
  necesita conexión real; `db:migrate:deploy` corre en el start command donde sí hay `DATABASE_URL`.


  ## Fix Express 5: validación de query/params via `res.locals` ✅ COMPLETADO

Después de actualizar a **Express 5.2 / router 2.2**, `req.query` ya no debe reasignarse directamente porque puede comportarse como propiedad de solo lectura/getter. Esto causaba el error:

```txt
Cannot set property query of #<IncomingMessage> which has only a getter
```

El problema estaba en `apps/api/src/middlewares/validate.ts`, donde se hacía algo equivalente a:

```ts
req[source] = parsed;
```

Cuando `source === 'query'`, Express 5 no permite esa reasignación.

### Nueva regla del middleware `validate`

El middleware `validate()` debe guardar los datos validados en `res.locals` para `query` y `params`, y solo puede reasignar `req.body` cuando `source === 'body'`.

Implementación base:

```ts
import type { RequestHandler } from 'express';
import { ZodError, type ZodType } from 'zod';

type Source = 'body' | 'query' | 'params';

export function validate(schema: ZodType, source: Source = 'body'): RequestHandler {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req[source]);

      if (source === 'query') {
        res.locals.validatedQuery = parsed;
      } else if (source === 'params') {
        res.locals.validatedParams = parsed;
      } else {
        req.body = parsed;
      }

      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return next(err);
      }

      next(err);
    }
  };
}
```

### Regla para controladores

Cuando una ruta use:

```ts
validate(schema, 'query')
```

el controlador **no debe leer `req.query`** para pasarlo al service.

Debe leer:

```ts
res.locals.validatedQuery
```

Ejemplo correcto:

```ts
list: asyncHandler(async (_req: Request, res: Response) => {
  const query = res.locals.validatedQuery as ListProductsQuery;
  const result = await productService.list(query);
  sendSuccess(res, result);
});
```

No usar:

```ts
const result = await productService.list(req.query as unknown as ListProductsQuery);
```

porque `req.query` conserva strings originales como:

```ts
page: '1'
perPage: '12'
```

y Prisma falla con:

```txt
Argument take: Invalid value provided. Expected Int, provided String.
```

Todos los módulos migrados: `products`, `orders`, `addresses`, `payments`, `admin/products`,
`admin/orders`, `admin/categories`, `admin/coupons`, `admin/delivery`, `admin/media`.
Type-check en verde tras la migración.

