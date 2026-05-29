# MVH Flores — Instrucciones para Claude Code

Ecommerce headless de floristería premium (Barranquilla, Colombia).  
Monorepo Turborepo + pnpm. Leer este archivo **antes de cualquier tarea**.

---

## 1. Estructura del monorepo

```
mvh-store/
├── apps/
│   ├── web/          Next.js 14 App Router — tienda + panel admin
│   └── api/          Express + Prisma — REST API
├── packages/
│   ├── types/        Interfaces TypeScript compartidas (importar como @mvh/types)
│   ├── config/       tsconfig.base.json compartido
│   └── utils/        Utilidades compartidas
├── AGENT.md          Documentación técnica del proyecto (estructura, sistema de temas, endpoints)
└── CLAUDE.md         Este archivo — instrucciones de desarrollo
```

---

## 2. Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 14 App Router, React 18, TypeScript, TailwindCSS 3.4 |
| Estado cliente | Zustand (carrito + auth), TanStack Query v5 (server state) |
| Backend | Node.js + Express 4, Prisma ORM |
| Base de datos | PostgreSQL (Neon en prod) |
| Cache / colas | Redis + BullMQ (Upstash en prod) |
| Storage de imágenes | Cloudinary |
| Pasarela de pago | Bold (Colombia) con webhook HMAC-SHA256 |
| Emails | Nodemailer con BullMQ queue (SendGrid en prod) |
| Build | Turborepo + pnpm workspaces |
| Deploy | Vercel (web) + VPS Ubuntu con PM2 + Nginx (API) |

---

## 3. Cómo hacer peticiones al API (REGLA PRINCIPAL)

### 3.1 En Client Components (interactividad, formularios, admin)

**Siempre usar `authFetch` de `@/lib/auth-fetch`.**

```ts
import { authFetch } from '@/lib/auth-fetch';

// GET — retorna json.data directamente (ya desenvuelto)
const data = await authFetch<MiTipo>('/ruta/del/api');

// POST / PUT / PATCH — body como objeto (se serializa automáticamente)
const result = await authFetch<MiTipo>('/ruta', {
  method: 'POST',
  body: { campo: valor },
});

// PUT con parámetros de ruta
const updated = await authFetch<MiTipo>(`/admin/productos/${id}`, {
  method: 'PUT',
  body: payload,
});

// DELETE
await authFetch(`/admin/cupones/${id}`, { method: 'DELETE' });
```

**Por qué `authFetch` y no `fetch` directamente:**
- Agrega `Authorization: Bearer <token>` automáticamente desde el store de Zustand
- Si recibe 401, reintenta con `refreshSession()` una vez antes de fallar
- Lanza `ApiClientError` con `status` y `code` para manejo consistente
- Elimina la necesidad de leer `localStorage` manualmente

**Nunca hacer esto:**
```ts
// ❌ MAL — no usar fetch manual con localStorage en páginas admin
fetch(`${API_URL}/admin/...`, {
  headers: { Authorization: `Bearer ${localStorage.getItem('mvh_access_token')}` },
  body: JSON.stringify(data),
})
```

### 3.2 En Server Components (RSC) — solo lectura pública

Usar `apiFetch` de `@/lib/api-client` con tags de caché Next.js:

```ts
import { apiFetch } from '@/lib/api-client';

const products = await apiFetch<Product[]>('/products/featured', {
  tags: ['products:featured'],   // para revalidación on-demand
  revalidate: 300,               // 5 min ISR
});
```

O mejor aún, usar el objeto `api` de `@/lib/api.ts` que ya tiene los parámetros correctos:

```ts
import { api } from '@/lib/api';

const categories = await api.getCategories();
const product = await api.getProductBySlug(slug);
```

### 3.3 Con TanStack Query (Client Components que necesitan reactivity)

Patrón estándar del proyecto — combinar `authFetch` con `useQuery` / `useMutation`:

```ts
'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authFetch } from '@/lib/auth-fetch';

// Lectura
const { data, isLoading } = useQuery({
  queryKey: ['mi-recurso', id],
  queryFn: () => authFetch<MiTipo>(`/admin/mi-recurso/${id}`),
  staleTime: 60_000,
});

// Mutación
const qc = useQueryClient();
const mutation = useMutation({
  mutationFn: (payload: MiPayload) =>
    authFetch<MiTipo>('/admin/mi-recurso', { method: 'POST', body: payload }),
  onSuccess: () => {
    qc.invalidateQueries({ queryKey: ['mi-recurso'] });
  },
});

// Llamar la mutación
mutation.mutate(misDatos);
```

### 3.4 Variables de entorno relevantes

- `NEXT_PUBLIC_API_URL` — base URL del API (default: `http://localhost:4000/api/v1`)
- Importar como `API_URL` desde `@/lib/api-client` si se necesita la URL cruda

---

## 4. Cómo crear una nueva página de admin

### Estructura de archivos

```
apps/web/src/app/admin/
└── mi-seccion/
    ├── page.tsx          lista principal
    ├── nuevo/
    │   └── page.tsx      formulario de creación
    └── [id]/
        └── page.tsx      edición / detalle
```

### Checklist para nueva página admin

1. **Agregar al NAV** en `apps/web/src/app/admin/layout.tsx`:
   ```ts
   { href: '/admin/mi-seccion', label: 'Mi Sección', icon: '◆' }
   ```

2. **Marcar como Client Component** si tiene interactividad:
   ```ts
   'use client';
   ```

3. **Usar el patrón de carga estándar:**
   ```tsx
   const { data, isLoading } = useQuery({
     queryKey: ['mi-seccion'],
     queryFn: () => authFetch<MiTipo[]>('/admin/mi-seccion'),
   });

   if (isLoading) return <p className="text-sm text-burgundy-900/40 animate-pulse">Cargando…</p>;
   ```

4. **Botón guardar estándar:**
   ```tsx
   <button
     onClick={() => mutation.mutate(datos)}
     disabled={mutation.isPending}
     className="bg-burgundy-900 text-cream-50 text-xs uppercase tracking-widest px-6 py-2.5 hover:bg-burgundy-950 transition-colors disabled:opacity-40"
   >
     {mutation.isPending ? 'Guardando…' : 'Guardar'}
   </button>
   ```

5. **Feedback de mutación:**
   ```tsx
   {mutation.isError   && <span className="text-xs text-red-500">Error al guardar</span>}
   {mutation.isSuccess && <span className="text-xs text-emerald-600">✓ Guardado</span>}
   ```

---

## 5. Cómo crear un nuevo módulo de API

### Estructura de archivos

```
apps/api/src/modules/mi-modulo/
├── mi-modulo.service.ts      lógica de negocio + Prisma queries
├── mi-modulo.controller.ts   manejo de request/response
└── mi-modulo.routes.ts       definición de rutas Express
```

### Plantilla de servicio

```ts
import { prisma } from '../../config/prisma';
import { NotFoundError } from '../../lib/errors';

export const miModuloService = {
  async list() {
    return prisma.miModelo.findMany({ orderBy: { createdAt: 'desc' } });
  },

  async getById(id: string) {
    const item = await prisma.miModelo.findUnique({ where: { id } });
    if (!item) throw new NotFoundError('Recurso no encontrado');
    return item;
  },

  async create(data: CreateMiModelo) {
    return prisma.miModelo.create({ data });
  },
};
```

### Plantilla de controlador

```ts
import type { Request, Response } from 'express';
import { asyncHandler } from '../../lib/async-handler';
import { sendSuccess, sendCreated } from '../../lib/http';
import { miModuloService } from './mi-modulo.service';

export const miModuloController = {
  list: asyncHandler(async (_req: Request, res: Response) => {
    const items = await miModuloService.list();
    sendSuccess(res, items);
  }),

  getById: asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
    const item = await miModuloService.getById(req.params.id);
    sendSuccess(res, item);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const item = await miModuloService.create(req.body);
    sendCreated(res, item);
  }),
};
```

### Plantilla de rutas

```ts
import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { idParamsSchema, createMiModuloSchema } from '../admin/admin.schemas';
import { miModuloController } from './mi-modulo.controller';

const router = Router();

// Público
router.get('/', miModuloController.list);
router.get('/:id', validate(idParamsSchema, 'params'), miModuloController.getById);

// Protegido
router.post('/', requireAuth, requireRole('ADMIN'), validate(createMiModuloSchema), miModuloController.create);

export { router as miModuloRouter };
```

### Registrar en el servidor

En `apps/api/src/server.ts` (o donde estén montadas las rutas):
```ts
app.use('/api/v1/mi-modulo', miModuloRouter);
```

---

## 6. Formato de respuesta del API

**Siempre** usar las helpers de `apps/api/src/lib/http.ts`:

```ts
// ✅ Respuesta exitosa: { ok: true, data: ... }
sendSuccess(res, datos);           // 200
sendCreated(res, datos);           // 201
sendNoContent(res);                // 204

// ✅ Error: { ok: false, error: { code, message, details? } }
// Lanzar un AppError — el error handler central lo convierte
throw new NotFoundError('Producto no encontrado');
throw new BadRequestError('Datos inválidos', zodError.flatten());
throw new ForbiddenError();
```

**Nunca** usar `res.json()` directamente — siempre pasar por las helpers.

---

## 7. Validación con Zod (API)

Los schemas Zod viven en `apps/api/src/modules/admin/admin.schemas.ts`.  
Usar el middleware `validate()`:

```ts
import { z } from 'zod';
import { validate } from '../../middlewares/validate';

const crearProductoSchema = z.object({
  name: z.string().min(2).max(200),
  price: z.number().positive(),
  // ...
});

// En rutas:
router.post('/products', validate(crearProductoSchema), controller.create);
router.get('/products/:id', validate(idParamsSchema, 'params'), controller.getById);
```

`validate(schema, 'params' | 'query' | 'body')` — segundo argumento es la fuente, default `'body'`.

---

## 8. Sistema de Tema Visual

Todo el estilo visual está centralizado en variables CSS `--th-*`.

| Archivo | Responsabilidad |
|---------|----------------|
| `apps/web/src/lib/theme.ts` | Tipos TS (`ThemeConfig`, `SectionStyle`), defaults, `buildThemeCss()`, `mergeTheme()`, `hexToRgbChannels()` |
| `apps/web/src/components/theme-css-vars.tsx` | Server Component: lee DB → inyecta `<style>` con `--th-*` globales + bloques por sección |
| `apps/web/src/styles/globals.css` | Tokens `--th-*` con valores por defecto (hex + canales RGB) |
| `apps/web/tailwind.config.ts` | Colores semánticos + `fontFamily.*` usan `var(--th-*)` |

**Para cambiar estilos:** Editar los tokens en `globals.css` (código) o desde `/admin/configuracion/temas` (runtime).  
**Para agregar nuevos tokens:** Añadir en `globals.css` + `theme.ts` + `buildThemeCss()`.

### Clases semánticas (NO usar burgundy/gold/cream ni hex hardcodeado)

La paleta de marca se expone como **7 clases semánticas** que apuntan a las variables del tema. **Toda clase que las use cambia automáticamente** al editar el tema en admin. Las variaciones se logran con **opacidad** (`/10`, `/50`), no con escalas.

| Clase Tailwind | Variable | Reemplazó a |
|----------------|----------|-------------|
| `primary`       | `--th-primary`       | burgundy-900 |
| `primary-light` | `--th-primary-light` | burgundy-800/700 |
| `accent`        | `--th-accent`        | gold-500/600/700 |
| `accent-light`  | `--th-accent-light`  | gold-50..400 |
| `surface`       | `--th-surface`       | cream / cream-50 |
| `muted`         | `--th-muted`         | cream-100..400 |
| `ink`           | `--th-ink`           | burgundy-950 |

**Regla:** usa estas clases (`bg-primary`, `text-primary/60`, `border-primary/10`, `bg-surface`, `text-accent`, `bg-muted`, `bg-ink`) o `var(--th-*)`. **Nunca** escribas hex de marca (`#5a1028`, `#d49328`…) ni clases `burgundy/gold/cream` (legacy, solo fallback) en componentes nuevos.

**Convención de secciones:** en cualquier sección, el **fondo** es `bg-surface` y el **texto** principal es `text-primary` (incluso en secciones oscuras como footer/hero — su `surface` por defecto es oscuro y su `primary` claro). Así el override por sección funciona uniforme.

**Opacidad:** funciona porque cada token tiene su gemelo en canales RGB (`--th-primary-rgb: 90 16 40`) y la paleta se define como `rgb(var(--th-primary-rgb) / <alpha-value>)`. Si agregas un color, emite también su `-rgb` en `buildThemeCss()` (usa `hexToRgbChannels()`).

### Personalización por sección (`data-th-section`)

`ThemeConfig.sections` permite colores + tipografía por sección (`header`, `hero`, `tienda`, `producto`, `checkout`, `footer`). `buildThemeCss()` emite, además de `:root`, un bloque `[data-th-section="<key>"]{…}` que sobreescribe `--th-surface` (← background), `--th-primary` (← text), `--th-accent` y las fuentes **dentro de ese subárbol** (cascada de CSS vars).

Para que una sección sea personalizable, su elemento raíz lleva `data-th-section="<key>"` (ej. `<footer data-th-section="footer">`). Funciona en Server y Client Components (es un atributo estático). Si creas una sección nueva: añade la key a `SectionKey`/`SECTION_ORDER`/`SECTION_LABELS` en `theme.ts` y el atributo en su raíz.

Variables disponibles:
```css
--th-primary / --th-primary-light   /* marca (burdeos) */
--th-accent  / --th-accent-light    /* acento (dorado) */
--th-surface                        /* fondo */
--th-muted                          /* superficie/borde suave */
--th-ink                            /* tono más oscuro */
--th-btn-radius / --th-btn-transform
--th-font-heading / --th-font-body / --th-font-ui
/* cada color de marca tiene también su gemelo --th-*-rgb (canales) */
```

---

## 9. Clases CSS reutilizables (globals.css)

```html
<!-- Botones -->
<button class="btn-primary">Comprar</button>
<button class="btn-outline">Ver más</button>
<button class="btn-on-dark">Sobre fondo oscuro</button>

<!-- Layout -->
<div class="container-mvh">...</div>       <!-- max-w-7xl con padding responsivo -->

<!-- Tipografía -->
<p class="eyebrow">Categoría</p>           <!-- uppercase tracking-widest gold -->

<!-- Decoración -->
<div class="gold-divider"><span>◈</span></div>   <!-- separador con gradiente dorado -->
<p class="ornament-line">Texto ornamental</p>

<!-- Contenido HTML -->
<article class="prose-mvh">...</article>   <!-- estilos para HTML renderizado -->

<!-- Card de producto -->
<div class="product-card">...</div>

<!-- Sombras premium -->
<div class="shadow-premium">...</div>
<div class="shadow-premium-lg">...</div>
```

---

## 10. Fuentes tipográficas

Las 3 fuentes siempre están precargadas vía `next/font/google` en `apps/web/src/app/layout.tsx`.

```tsx
// Clases Tailwind
font-display   → Playfair Display (titulares, editorial)
font-serif     → Cormorant Garamond (cuerpo, premium)
font-sans      → Inter (UI, legibilidad)

// CSS variables originales (next/font)
var(--font-display)
var(--font-serif)
var(--font-sans)
```

---

## 11. Auth en el frontend

### Leer el usuario actual

```ts
import { useAuthStore } from '@/store/auth-store';

// En componentes React
const user = useAuthStore((s) => s.user);       // PublicUser | null
const isLoading = useAuthStore((s) => s.isLoading);

// Fuera de componentes (ej: en funciones de fetch)
const { accessToken } = useAuthStore.getState();
```

### Guards de ruta (admin)

El layout de admin (`apps/web/src/app/admin/layout.tsx`) ya protege todas las rutas `/admin/*`.  
Redirige a `/auth/login` si no hay sesión, y a `/` si el rol no es ADMIN o STAFF.

### Roles disponibles

```ts
type Role = 'CUSTOMER' | 'ADMIN' | 'STAFF'
```

---

## 12. Patrones de color Tailwind (clases semánticas)

Usa las clases semánticas del tema (ver §8). Las variaciones se hacen con opacidad.

```html
<!-- Marca / principal -->
bg-primary    text-primary    border-primary
text-primary/60   border-primary/10   bg-primary/5
text-primary-light                    <!-- variante clara -->

<!-- Acento (dorado) -->
bg-accent     text-accent     border-accent
text-accent-light   bg-accent/20

<!-- Fondo / superficies -->
bg-surface    bg-muted        text-surface
bg-ink        text-ink/40                   <!-- tono más oscuro -->

<!-- Feedback (no tematizado) -->
text-emerald-600   <!-- éxito -->
text-red-500       <!-- error -->
text-primary/40 animate-pulse  <!-- loading -->
```

> `burgundy-*`, `gold-*`, `cream-*` siguen definidos como **legacy/fallback** pero no deben usarse en código nuevo.

---

## 13. Convenciones generales

- **Client Components:** `'use client'` en la primera línea, solo cuando es necesario (eventos, hooks de React, estado)
- **Server Components:** por defecto en App Router; ideal para fetch de datos, SEO, layouts
- **Rutas de params tipados en API:** usar `Request<{ id: string }>` para evitar errores TypeScript con `noUncheckedIndexedAccess`
- **asyncHandler:** envolver TODOS los controladores Express en `asyncHandler()` para propagación de errores
- **Sin console.log en producción:** usar el logger de Pino (`apps/api/src/config/logger.ts`)
- **Cache Redis:** usar helpers de `apps/api/src/lib/cache.ts` para invalidar en mutaciones
- **Imágenes:** subir siempre a través de `/admin/media/upload` (Cloudinary) — no almacenar localmente
- **Pagos (Bold):** método botón embebido + firma de integridad (ver flujo en AGENT.md). El front renderiza `<BoldPaymentButton>` con la config de `POST /orders/:id/pay`; el estado real lo confirma el webhook `POST /webhooks/bold`. NO confiar en el redirect para marcar PAID. El body crudo del webhook está en `req.rawBody` (capturado en el `verify` de `express.json`) — nunca re-parsees el body para validar la firma HMAC

---

## 14. Variables de entorno

### apps/web (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### apps/api (.env)
```
DATABASE_URL=postgresql://...
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=<min 32 chars>
JWT_REFRESH_SECRET=<min 32 chars>
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
BOLD_API_KEY=
BOLD_SECRET_KEY=
BOLD_WEBHOOK_SECRET=
```

---

## 15. Comandos de desarrollo

```bash
# Instalar dependencias
pnpm install

# Levantar todo en paralelo (web + api)
pnpm dev

# Solo frontend
pnpm --filter web dev

# Solo API
pnpm --filter api dev

# Build
pnpm build

# Generar cliente Prisma después de cambiar schema
pnpm --filter api prisma generate

# Crear migración
pnpm --filter api prisma migrate dev --name nombre-de-la-migracion
```
