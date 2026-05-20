# 🗄️ Modelo de Datos

Esquema completo en `apps/api/prisma/schema.prisma`. PostgreSQL 16.

## Diagrama lógico (relaciones)

```
User ──< Address
     ──< Order ──< OrderItem >── Product
     ──< RefreshToken         >── ProductVariant
     ──< AuditLog
                       Order ──< Payment
                             ──< OrderStatusHistory
                             >── Coupon
                             >── Address

Category (self-ref hierarchy) ──< Product ──< ProductImage
                                         ──< ProductVariant
                                         ──< InventoryMovement

DeliveryZone, DeliverySlot, BlockedDate, Banner  (standalone)
```

## Entidades principales

### `users`
Tabla central de autenticación.
| Campo            | Tipo         | Notas                                |
| ---------------- | ------------ | ------------------------------------ |
| `id`             | cuid         | PK                                   |
| `email`          | string       | UNIQUE, lowercase                    |
| `passwordHash`   | string       | bcrypt (10 rounds)                   |
| `role`           | enum         | `CUSTOMER` \| `ADMIN` \| `STAFF`     |
| `isActive`       | boolean      | Para desactivar sin borrar           |
| `emailVerifiedAt`| datetime?    | Para flujo de verificación (futuro)  |

### `refresh_tokens`
- `tokenHash` SHA-256 del token (nunca guardamos el JWT en plaintext).
- `revokedAt` se setea al rotar; refresh queda invalidado.
- Si se intenta usar dos veces el mismo → revocamos **todos** los tokens del user.

### `categories`
Jerarquía self-referencial via `parentId`. El seed crea hasta 2 niveles (estilo > bouquets, ocasión > amor, etc.).

### `products`
| Campo                 | Tipo  | Notas                              |
| --------------------- | ----- | ---------------------------------- |
| `priceCents`          | int   | **Centavos COP** — nunca floats    |
| `compareAtPriceCents` | int?  | Precio "antes" para mostrar descuento |
| `isFeatured`          | bool  | Aparece en home                    |
| `isActive`            | bool  | Soft delete                        |
| `stock`               | int   | Si no hay variantes, este es el stock |

**Por qué centavos**: COP no usa decimales en la práctica, pero el modelo en centavos evita errores de redondeo y es consistente con Stripe/Bold (que usan unidad mínima). Frontend formatea con `formatCOP()` del paquete `@mvh/utils`.

### `product_variants`
Para productos con múltiples tamaños/presentaciones. Cada variante tiene su propio `sku`, `priceCents` y `stock`. El producto principal mantiene un stock total (lo gestionará la lógica de inventario en Entrega 3).

### `orders`
**Snapshot completo** del pedido: copia los datos del comprador, dirección, zona, productos, precios al momento de la compra. Esto garantiza que aunque cambien después en BD, el pedido histórico no se altere.

Estados (`OrderStatus`): `PENDING` → `PAID` → `PROCESSING` → `OUT_FOR_DELIVERY` → `DELIVERED` (o `CANCELLED`, `REFUNDED`).

### `order_status_history`
Log auditable de cada cambio de estado. Permite reconstruir la línea de tiempo del pedido y saber qué staff hizo qué.

### `payments`
Una orden puede tener varios payments (reintentos, contra-entrega + propina, etc.). Guarda `rawRequest`/`rawResponse` del proveedor para debugging y disputas.

### `coupons`
- Tipos: `PERCENT` (1-100) o `FIXED` (centavos).
- `maxDiscountCents` para topear porcentajes en compras grandes.
- `usageLimit` global + `perUserLimit` (validación en checkout, Entrega 2).

### `delivery_zones` / `delivery_slots` / `blocked_dates`
Reglas de entrega:
- Zona del cliente determina el `feeCents` de envío.
- Slot horario que el cliente elige al checkout.
- Fechas bloqueadas (festivos, mantenimientos) impiden agendar.

### `audit_logs`
Log inmutable de acciones críticas (`USER_LOGIN`, `ORDER_STATUS_CHANGED`, `PRODUCT_UPDATED`, etc.). Incluye `ipAddress`, `userAgent` y `metadata` arbitrario.

## Índices clave

```prisma
@@index([email])              // users
@@index([slug])               // products, categories
@@index([categoryId])         // products
@@index([isActive, isFeatured]) // products (filtros homepage)
@@index([status])             // orders (panel admin)
@@index([createdAt])          // orders, audit_logs (reportes)
@@index([providerPaymentId])  // payments (lookups por webhook)
```

## Migraciones

Las migraciones de Prisma viven en `apps/api/prisma/migrations/`.

```bash
# Crear migración tras cambiar schema.prisma
pnpm --filter @mvh/api db:migrate

# Aplicar migraciones existentes (producción)
pnpm --filter @mvh/api db:migrate:deploy

# Reset completo (sólo desarrollo)
pnpm --filter @mvh/api db:reset
```

## Datos demo (seed)

`prisma/seed.ts` crea un dataset inspirado en el catálogo real de mvhflores.com:
- **2 usuarios**: admin + cliente
- **~13 categorías** con jerarquía real (estilo > bouquets/sembrados/..., ocasión > amor/amistad/...)
- **12 productos** con precios reales en COP (de $40.000 a $397.000), todos con imágenes
- **Variantes** auto-generadas (Mediano/Grande) para productos premium
- **4 zonas de entrega** (Norte, Centro, Sur, Sur-Occidente) con barrios reales
- **4 franjas horarias** (8AM, 11AM, 2PM, 5PM)
- **1 cupón demo** (`BIENVENIDA10`)
- **1 banner** de home
- **1 dirección demo** del cliente

Ejecuta:
```bash
pnpm --filter @mvh/api db:seed
```
