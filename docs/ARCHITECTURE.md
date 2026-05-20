# 🏗️ Arquitectura — MVH Flores

## Visión general

MVH Flores es un ecommerce **headless** construido como **monorepo TypeScript** con `pnpm workspaces` + `Turborepo`. El frontend (Next.js) y el panel admin son aplicaciones independientes que consumen una **API REST** común. Esto permite escalar cada capa por separado, reemplazar piezas sin reescribir todo, y abrir la puerta a integraciones futuras (apps móviles, kiosks, etc).

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  apps/web        │     │  apps/admin      │     │  Future apps     │
│  (Next.js 14)    │     │  (pendiente)     │     │  (mobile, etc)   │
└────────┬─────────┘     └────────┬─────────┘     └────────┬─────────┘
         │                        │                        │
         │           REST /api/v1 │                        │
         └────────────────────────┼────────────────────────┘
                                  │
                       ┌──────────▼──────────┐
                       │  apps/api           │
                       │  (Express + Prisma) │
                       └──────────┬──────────┘
                                  │
              ┌───────────────────┼───────────────────┐
              │                   │                   │
        ┌─────▼─────┐      ┌──────▼──────┐     ┌──────▼──────┐
        │ PostgreSQL│      │ Redis (cache│     │ Bold        │
        │  (Prisma) │      │  + queues)  │     │ (pagos)     │
        └───────────┘      └─────────────┘     └─────────────┘
```

## Decisiones técnicas clave

### 1. Monorepo con pnpm + Turborepo
- **Por qué**: tipos compartidos entre front y back (`@mvh/types`), utilidades comunes (`@mvh/utils`), build cacheable e incremental.
- **Alternativa rechazada**: dos repos separados. Habríamos duplicado tipos y perdido feedback inmediato al cambiar contratos API.

### 2. Backend Express + Prisma (no NestJS, no Fastify)
- **Por qué Express**: maduro, ecosistema masivo, simple. Para un equipo que va a iterar rápido, el "magic" de NestJS añade fricción innecesaria.
- **Por qué Prisma**: type-safety end-to-end, migraciones declarativas, excelente DX. El costo (un binario en runtime) es trivial.

### 3. Arquitectura modular por dominio
Cada feature vive en `src/modules/<dominio>/` con:
- `*.schemas.ts` — validación Zod
- `*.service.ts` — lógica de negocio (pura, testeable, sin Express)
- `*.controller.ts` — orquestación HTTP
- `*.routes.ts` — montaje de rutas
- `*.test.ts` (opcional) — tests unitarios

Esto evita el típico anti-pattern "todo en `routes/`" que escala mal.

### 4. Capa de pagos abstraída
`PaymentProvider` (interface) → `BoldPaymentProvider`, `CashOnDeliveryProvider`, `MockPaymentProvider`. El resto del sistema **nunca** habla con Bold directamente. Si mañana migran a Wompi, Mercado Pago, o agregan PayU, sólo se implementa otra clase.

### 5. Autenticación: JWT con refresh tokens rotados
- **Access token (15 min)**: corto, en memoria en el cliente, no se guarda en BD.
- **Refresh token (30 días)**: largo, **se hashea con SHA-256** antes de guardarlo, se rota en cada `/refresh`. Si se detecta reuso → revoca **todos** los tokens del usuario (mitigación de robo).
- **¿Por qué hash?**: si la BD se filtra, los tokens no son utilizables.

### 6. Manejo de errores centralizado
- Clases `AppError` tipadas (BadRequest, NotFound, Conflict, etc.).
- Middleware `errorHandler` que traduce todo a JSON consistente: `{ ok: false, error: { code, message, details } }`.
- Errores de Zod, Prisma (P2002, P2025, P2003) se mapean automáticamente.

### 7. Frontend: Next.js 14 App Router con RSC
- Las páginas de catálogo se renderizan en server, consumen el API con `fetch` y aprovechan ISR (`revalidate: 300`).
- Interactividad puntual (`AddToCartButton`, `CartDrawer`) en Client Components.
- Resultado: **carga inicial rápida**, SEO completo, y bundle JS mínimo.

### 8. Paleta visual burdeos + dorado
- Definida en `tailwind.config.ts` con escala completa (50–950).
- Fuentes: **Playfair Display** (display), **Cormorant Garamond** (cuerpo), **Inter** (UI).
- Componentes globales (`btn-primary`, `eyebrow`, `gold-divider`, etc.) en `globals.css`.

## Estructura de carpetas detallada

```
mvh-store/
├── apps/
│   ├── api/
│   │   ├── prisma/
│   │   │   ├── schema.prisma       # Modelo de datos completo
│   │   │   └── seed.ts             # Datos demo del catálogo real
│   │   └── src/
│   │       ├── config/             # env, prisma, redis, logger
│   │       ├── lib/                # errors, http, jwt, pagination
│   │       ├── middlewares/        # auth, validate, rate-limit, error-handler
│   │       ├── modules/
│   │       │   ├── auth/           # register/login/refresh/logout
│   │       │   ├── products/       # listing, detail, filters
│   │       │   ├── categories/     # tree, by-slug
│   │       │   ├── payments/       # interface + Bold stub
│   │       │   └── health/         # healthcheck
│   │       ├── __tests__/          # tests unitarios
│   │       ├── app.ts              # Express app config
│   │       ├── routes.ts           # router central
│   │       └── server.ts           # entry point + graceful shutdown
│   └── web/
│       └── src/
│           ├── app/                # App Router (RSC)
│           │   ├── layout.tsx      # layout root con providers
│           │   ├── page.tsx        # homepage
│           │   ├── categoria/[slug]/
│           │   ├── producto/[slug]/
│           │   ├── contacto/
│           │   ├── not-found.tsx
│           │   └── error.tsx
│           ├── components/         # UI compartida
│           ├── lib/                # api-client, cn, utils
│           ├── store/              # Zustand stores
│           ├── providers/          # React contexts
│           └── styles/             # CSS global
├── packages/
│   ├── types/                      # DTOs, enums, API shapes
│   ├── utils/                      # formatCOP, slugify, etc.
│   └── config/                     # tsconfig.base.json
├── docker/
│   ├── api.Dockerfile
│   └── web.Dockerfile
├── docs/                           # documentación técnica
└── docker-compose.yml              # Postgres + Redis
```

## Flujo de una request típica

**Ejemplo: `GET /api/v1/products?category=bouquets&page=1`**

1. Express recibe la request, pasa por `helmet` → `cors` → `compression` → `pinoHttp` (logger) → `generalLimiter` (rate limit).
2. Router monta `/api/v1` → `/products` → `productRouter.list`.
3. Middleware `validate(listProductsQuerySchema, 'query')` parsea y valida con Zod. Si falla → `ZodError` → manejado por `errorHandler` → 422.
4. `productController.list` (envuelto en `asyncHandler`) llama a `productService.list(query)`.
5. `productService` construye el `where` de Prisma, ejecuta `Promise.all([findMany, count])`, mapea con `buildPaginated`.
6. `sendSuccess(res, result)` → cliente recibe `{ ok: true, data: { data: [...], meta: {...} } }`.

Si algo falla:
- Excepción tipada (ej. `NotFoundError`) → manejada por `errorHandler` → status correcto + JSON consistente.
- Excepción Prisma → mapeada (ej. `P2002` → 409 Conflict).
- Excepción inesperada → logueada + 500 genérico (sin filtrar stack en producción).

## Estrategia de cache

- **Next.js fetch cache** con `revalidate: 300` para catálogo (5 min). Productos no cambian segundo a segundo.
- **Tags por entidad** (`tags: ['product:slug']`) para revalidación on-demand cuando el admin actualice un producto (Entrega 3).
- **Redis** disponible para sesiones, queues y cache de queries pesadas — uso completo en Entrega 4.

## Próximos pasos arquitectónicos

- **Entrega 2**: módulos `cart` y `checkout` en API, integración Bold completa, webhook de pagos.
- **Entrega 3**: `apps/admin` con autenticación de roles, CRUD de productos, dashboard.
- **Entrega 4**: sistema de entregas (zonas, slots, fechas bloqueadas), cupones aplicables en checkout.
- **Entrega 5**: optimización Core Web Vitals, OG images dinámicas, sitemap, despliegue.
