# MVH Flores — Referencia técnica del proyecto

> Para instrucciones de desarrollo, patrones de código y convenciones: ver **CLAUDE.md**.  
> Este archivo es referencia rápida de la arquitectura, endpoints y estructura de datos.

---

## Stack rápido

| Capa | Tecnología | Puerto dev |
|------|-----------|-----------|
| Frontend | Next.js 14 App Router + TailwindCSS 3 | 3000 |
| Backend | Express 4 + Prisma ORM | 4000 |
| DB | PostgreSQL (Neon prod) | — |
| Cache | Redis + BullMQ (Upstash prod) | 6379 |
| Storage | Cloudinary | — |
| Pagos | Bold Colombia | — |

---

## Árbol de carpetas clave

```
apps/web/src/
├── app/
│   ├── admin/                     Panel admin (requiere rol ADMIN o STAFF)
│   │   ├── layout.tsx             Guard de auth + sidebar
│   │   ├── page.tsx               Dashboard con métricas
│   │   ├── productos/             CRUD productos
│   │   ├── categorias/            CRUD categorías
│   │   ├── pedidos/               Gestión de pedidos
│   │   ├── cupones/               CRUD cupones
│   │   ├── entregas/              Zonas / franjas / fechas bloqueadas
│   │   ├── contenido/             Editor HTML políticas/FAQ/privacidad
│   │   └── configuracion/
│   │       └── temas/             Editor visual del tema
│   ├── auth/                      login, registro
│   ├── categoria/[slug]/          Catálogo por categoría
│   ├── checkout/                  Wizard de compra
│   ├── pedido/[id]/               Estado del pedido
│   └── layout.tsx                 Root layout + ThemeCssVars
├── components/                    Componentes compartidos
│   ├── theme-css-vars.tsx         Server Component — inyecta CSS vars del tema
│   ├── header-server.tsx
│   ├── footer.tsx
│   ├── cart-drawer.tsx
│   ├── product-card.tsx
│   └── search-modal.tsx
├── lib/
│   ├── api-client.ts              apiFetch() + ApiClientError + API_URL
│   ├── auth-fetch.ts              authFetch() — fetch autenticado con auto-refresh
│   ├── api.ts                     Objeto api.* para Server Components
│   ├── theme.ts                   ThemeConfig, DEFAULT_THEME, buildThemeCss()
│   └── cn.ts                      clsx + tailwind-merge helper
├── store/
│   ├── auth-store.ts              Zustand: user, accessToken, login/logout/refresh
│   ├── cart-store.ts              Zustand: items, addItem, removeItem (localStorage)
│   └── search-store.ts            Zustand: query, isOpen
├── providers/
│   ├── auth-provider.tsx          Restaura sesión en mount desde refreshToken
│   └── query-provider.tsx         TanStack Query client
└── styles/
    └── globals.css                Variables --th-*, clases .btn-*, animaciones

apps/api/src/
├── modules/
│   ├── admin/                     Todos los endpoints /admin/*
│   │   ├── admin.routes.ts        Router principal del panel admin
│   │   ├── admin.schemas.ts       Zod schemas para validación admin
│   │   ├── admin-products.*       CRUD productos
│   │   ├── admin-categories.*     CRUD categorías
│   │   ├── admin-orders.*         Gestión pedidos
│   │   ├── admin-metrics.*        Dashboard métricas
│   │   ├── admin-coupons.*        CRUD cupones
│   │   ├── admin-delivery.*       Zonas/slots/fechas
│   │   └── admin-media.*          Upload Cloudinary
│   ├── auth/                      login, register, refresh, logout
│   ├── products/                  GET /products, /products/:slug
│   ├── categories/                GET /categories, /categories/:slug
│   ├── orders/                    POST /orders, GET /orders/:id
│   ├── payments/                  Bold webhook
│   ├── delivery/                  GET zonas/slots públicos
│   ├── coupons/                   POST /coupons/validate
│   ├── addresses/                 CRUD direcciones del usuario
│   ├── site-content/              GET /site-content/:key (público)
│   ├── contact/                   POST /contact
│   └── health/                    GET /health
├── config/
│   ├── env.ts                     Variables de entorno validadas con Zod
│   ├── prisma.ts                  Instancia singleton de PrismaClient
│   ├── redis.ts                   Cliente Redis
│   └── logger.ts                  Pino logger
├── lib/
│   ├── http.ts                    sendSuccess(), sendCreated(), sendError()
│   ├── errors.ts                  AppError y subclases (NotFoundError, etc.)
│   ├── async-handler.ts           Wrapper Express para async/await
│   ├── jwt.ts                     Sign/verify access + refresh tokens
│   ├── cache.ts                   Redis get/set/del helpers
│   └── cloudinary.ts              Upload helper
├── middlewares/
│   ├── auth.ts                    requireAuth, optionalAuth, requireRole()
│   ├── validate.ts                validate(zodSchema, 'body'|'params'|'query')
│   ├── error-handler.ts           Handler central de errores Express
│   └── rate-limit.ts              express-rate-limit
└── queues/
    ├── email.queue.ts             BullMQ queue "emails"
    └── email.worker.ts            Worker nodemailer
```

---

## Endpoints de la API

Base: `http://localhost:4000/api/v1` (dev)

### Públicos

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/auth/register` | Registro de usuario |
| POST | `/auth/login` | Login → `{ user, tokens }` |
| POST | `/auth/refresh` | Renovar tokens |
| POST | `/auth/logout` | Invalida refreshToken |
| GET | `/categories` | Árbol de categorías |
| GET | `/categories/:slug` | Categoría por slug |
| GET | `/products` | Catálogo (filtros: category, search, featured, minPrice, maxPrice, sort, page, perPage) |
| GET | `/products/featured` | Productos destacados |
| GET | `/products/:slug` | Detalle de producto |
| GET | `/delivery/zones` | Zonas de entrega activas |
| GET | `/delivery/slots` | Franjas horarias activas |
| POST | `/coupons/validate` | Validar código de descuento |
| GET | `/site-content/:key` | Contenido de página (politicas, faq, privacidad, theme) |
| POST | `/contact` | Formulario de contacto |
| POST | `/payments/bold/webhook` | Webhook de Bold |

### Autenticados (Bearer token)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/addresses` | Mis direcciones |
| POST | `/addresses` | Crear dirección |
| PUT | `/addresses/:id` | Actualizar dirección |
| DELETE | `/addresses/:id` | Eliminar dirección |
| POST | `/orders` | Crear pedido |
| GET | `/orders/:id` | Estado de un pedido |

### Admin (ADMIN o STAFF)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/admin/metrics` | Dashboard métricas |
| GET/POST | `/admin/products` | Listar / crear productos |
| GET/PUT | `/admin/products/:id` | Obtener / actualizar producto |
| PATCH | `/admin/products/:id/toggle-active` | Activar/desactivar |
| POST | `/admin/products/:id/images` | Agregar imagen |
| DELETE | `/admin/products/:id/images/:imageId` | Eliminar imagen |
| POST/PUT/DELETE | `/admin/products/:id/variants/*` | Gestionar variantes |
| GET/POST | `/admin/categories` | Listar / crear categorías |
| GET/PUT | `/admin/categories/:id` | Obtener / actualizar |
| PATCH | `/admin/categories/:id/toggle-active` | Activar/desactivar |
| GET | `/admin/orders` | Listar pedidos (filtros: status, search, page) |
| GET | `/admin/orders/:id` | Detalle de pedido |
| PATCH | `/admin/orders/:id/status` | Cambiar estado |
| GET/POST | `/admin/coupons` | Listar / crear cupones |
| GET/PUT | `/admin/coupons/:id` | Obtener / actualizar |
| PATCH | `/admin/coupons/:id/toggle-active` | Activar/desactivar |
| DELETE | `/admin/coupons/:id` | Eliminar cupón |
| GET/POST | `/admin/delivery/zones` | Zonas de entrega |
| PUT/PATCH/DELETE | `/admin/delivery/zones/:id` | Gestionar zona |
| GET/POST | `/admin/delivery/slots` | Franjas horarias |
| PUT/PATCH/DELETE | `/admin/delivery/slots/:id` | Gestionar franja |
| GET/POST | `/admin/delivery/blocked-dates` | Fechas bloqueadas |
| DELETE | `/admin/delivery/blocked-dates/:id` | Desbloquear fecha |
| PUT | `/admin/site-content/:key` | Actualizar contenido (politicas, faq, privacidad, theme) |
| GET | `/admin/media` | Listar media |
| POST | `/admin/media/upload` | Subir imagen a Cloudinary (multipart/form-data, campo: file) |
| DELETE | `/admin/media/:id` | Eliminar imagen |

---

## Modelos Prisma principales

```prisma
User       — id, email, firstName, lastName, phone, role (CUSTOMER|ADMIN|STAFF), addresses
Product    — id, name, slug, price, compareAtPrice, stock, images, variants, category
Category   — id, name, slug, parent, children
Order      — id, user, items, total, status, payment, deliverySlot, address
Payment    — id, order, provider (BOLD), status, boldOrderId, webhookData
Coupon     — id, code, type (PERCENT|FIXED), value, minOrder, maxUses, usedCount
DeliveryZone  — id, name, price, isActive
DeliverySlot  — id, label, startTime, endTime, maxOrders, isActive
BlockedDate   — id, date, reason
SiteContent   — id, key (unique), content (text), updatedAt
Media         — id, url, publicId, filename, mimeType, width, height, size
```

---

## Sistema de tema (`--th-*`)

Los tokens CSS `--th-*` son la fuente de verdad de estilos. Se guardan como JSON en `SiteContent.key = 'theme'`.

```ts
// Estructura de ThemeConfig (apps/web/src/lib/theme.ts)
type FontKey = 'display' | 'serif' | 'sans';
type SectionKey = 'header' | 'footer' | 'hero' | 'tienda' | 'producto' | 'checkout';

interface SectionStyle {
  background: string;  // hex → --th-surface dentro de la sección
  text: string;        // hex → --th-primary dentro de la sección
  accent: string;      // hex → --th-accent dentro de la sección
  headingFont: FontKey;
  bodyFont: FontKey;
}

interface ThemeConfig {
  colors: {
    primary: string; primaryLight: string;   // marca (burdeos)
    accent: string;  accentLight: string;    // acento (dorado)
    surface: string;                         // fondo
    muted: string;                           // superficie/borde suave
    ink: string;                             // tono más oscuro
  };
  fonts:   { heading: FontKey; body: FontKey; ui: FontKey };
  buttons: { radius: number; uppercase: boolean };  // radius 0|4|8|9999
  sections: Record<SectionKey, SectionStyle>;       // colores + tipografía por sección
}
```

Flujo: `globals.css (defaults)` → sobreescrito por `ThemeCssVars` (Server Component lee DB) → aplicado a toda la app.

**Clases semánticas:** la paleta de marca se expone como clases `primary`, `primary-light`, `accent`, `accent-light`, `surface`, `muted`, `ink` (variaciones por opacidad). Cada color tiene su gemelo en canales RGB (`--th-primary-rgb: 90 16 40`) y la paleta usa `rgb(var(--th-*-rgb) / <alpha-value>)`. `burgundy/gold/cream` son legacy.

**Por sección:** `buildThemeCss()` emite `:root` + un bloque `[data-th-section="<key>"]{…}` por sección que sobreescribe surface/primary/accent + fuentes en ese subárbol. Las raíces de sección llevan `data-th-section` (ej. `<footer data-th-section="footer">`). Convención: fondo = `bg-surface`, texto = `text-primary` (incluso en footer/hero oscuros). Ver detalle en **CLAUDE.md §8**.

---

## Formato de respuesta del API

```json
// Éxito
{ "ok": true, "data": { ... } }

// Paginado
{ "ok": true, "data": { "data": [...], "meta": { "page": 1, "perPage": 20, "total": 100, "totalPages": 5 } } }

// Error
{ "ok": false, "error": { "code": "NOT_FOUND", "message": "Producto no encontrado", "details": {} } }
```

`apiFetch()` y `authFetch()` desenvuelven `json.data` automáticamente. Solo se recibe el error si `ok: false`.

---

## Fuentes cargadas (siempre disponibles)

| CSS var | Tailwind class | Fuente |
|---------|---------------|--------|
| `--font-display` | `font-display` | Playfair Display |
| `--font-serif`   | `font-serif`   | Cormorant Garamond |
| `--font-sans`    | `font-sans`    | Inter |

Las clases Tailwind referencian `var(--th-font-heading/body/ui)` → intercambiables desde admin.

---

## Paleta de colores Tailwind

```
burgundy: 50→950  (principal: 900 = #5a1028)
gold:     50→950  (principal: 500 = #d49328)
cream:    50→400 + DEFAULT (#f7f1e3)
```
