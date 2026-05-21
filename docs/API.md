# 📡 API REST — Referencia

Base URL en desarrollo: `http://localhost:4000/api/v1`

## Formato de respuestas

Todas las respuestas usan envoltorio consistente:

**Éxito:**
```json
{ "ok": true, "data": { ... } }
```

**Error:**
```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Datos inválidos",
    "details": { "email": ["Email inválido"] }
  }
}
```

## Códigos de error

| Code               | HTTP | Significado                          |
| ------------------ | ---- | ------------------------------------ |
| `BAD_REQUEST`      | 400  | Solicitud malformada                 |
| `UNAUTHORIZED`     | 401  | Token faltante, inválido o expirado  |
| `FORBIDDEN`        | 403  | Sin permisos para la acción          |
| `NOT_FOUND`        | 404  | Recurso no existe                    |
| `CONFLICT`         | 409  | Estado conflictivo (ej. email duplicado) |
| `VALIDATION_ERROR` | 422  | Validación Zod falló                 |
| `RATE_LIMITED`     | 429  | Excediste el rate limit              |
| `INTERNAL_ERROR`   | 500  | Error no controlado                  |

---

## 🩺 Health

### `GET /health`
Devuelve estado del servidor y BD. Útil para load balancers.

```json
{
  "ok": true,
  "data": {
    "status": "healthy",
    "timestamp": "2026-05-20T10:30:00.000Z",
    "uptime": 1234.5,
    "checks": { "server": "ok", "database": "ok" }
  }
}
```

---

## 🔐 Auth

### `POST /auth/register`
**Body:**
```json
{
  "email": "user@example.com",
  "password": "Password123",
  "firstName": "María",
  "lastName": "García",
  "phone": "+57 300 123 4567"
}
```

**Validaciones:**
- `email` válido
- `password`: 8–100 chars, al menos 1 mayúscula, 1 minúscula, 1 número
- `phone` opcional (7–20 chars)

**Respuesta 201:**
```json
{
  "ok": true,
  "data": {
    "user": { "id": "...", "email": "...", "firstName": "...", "role": "CUSTOMER", ... },
    "tokens": {
      "accessToken": "eyJhbG...",
      "refreshToken": "eyJhbG...",
      "expiresIn": 900
    }
  }
}
```

### `POST /auth/login`
**Body:** `{ "email": "...", "password": "..." }`
Misma respuesta que `register`.

**Rate limit**: 10 intentos fallidos / 15 min por IP.

### `POST /auth/refresh`
**Body:** `{ "refreshToken": "..." }`
Devuelve nuevos tokens. **Rota el refresh**: el viejo queda revocado.

⚠️ Si el mismo refresh token se usa dos veces → todos los tokens del usuario se revocan automáticamente (mitigación de robo).

### `POST /auth/logout`
**Body:** `{ "refreshToken": "..." }`
Idempotente. Revoca el refresh token. Responde 204 sin contenido.

### `GET /auth/me`
**Header:** `Authorization: Bearer <accessToken>`
Devuelve el usuario actual.

---

## 💐 Products

### `GET /products`
**Query params:**
| Param        | Tipo   | Default  | Notas                                          |
| ------------ | ------ | -------- | ---------------------------------------------- |
| `page`       | int    | 1        | ≥ 1                                            |
| `perPage`    | int    | 20       | 1–100                                          |
| `category`   | string | —        | slug; incluye categorías hijas automáticamente |
| `featured`   | bool   | —        | `true` para solo destacados                    |
| `search`     | string | —        | busca en name/description/shortDescription     |
| `minPrice`   | int    | —        | en centavos                                    |
| `maxPrice`   | int    | —        | en centavos                                    |
| `sort`       | enum   | `newest` | `newest \| price_asc \| price_desc \| name_asc` |

**Respuesta:**
```json
{
  "ok": true,
  "data": {
    "data": [{ "id": "...", "slug": "...", "name": "...", "priceCents": 9000000, ... }],
    "meta": { "page": 1, "perPage": 20, "total": 12, "totalPages": 1 }
  }
}
```

### `GET /products/featured?limit=8`
Lista de productos destacados (max 20).

### `GET /products/:slug`
Detalle completo con imágenes y variantes. 404 si no existe o está inactivo.

---

## 🌿 Categories

### `GET /categories`
Árbol completo (2 niveles de hijos).
```json
{
  "ok": true,
  "data": [
    {
      "id": "...",
      "slug": "estilo",
      "name": "Estilo",
      "children": [
        { "id": "...", "slug": "bouquets", "name": "Bouquets", "children": [] }
      ]
    }
  ]
}
```

### `GET /categories/:slug`
Categoría con hijos directos y padre.

---

## 🔑 Autenticación

Para endpoints protegidos:
```
Authorization: Bearer <accessToken>
```

Si el token expira (401), el cliente debe llamar `/auth/refresh` con el refresh token y reintentar.

## ⚙️ Rate limiting

- **General**: 100 req / 15 min por IP.
- **Auth** (register/login): 10 req / 15 min por IP (sólo cuenta intentos **fallidos**).

Cuando se excede, respuesta 429 con `code: RATE_LIMITED`.

---

## 📍 Addresses *(requiere auth)*

### `GET /addresses`
Lista las direcciones del usuario autenticado.

### `POST /addresses`
**Body:** `{ recipientName, phone, line1, line2?, neighborhood?, city?, notes?, isDefault? }`

### `PUT /addresses/:id`
Actualiza una dirección. Acepta campos parciales del mismo body.

### `DELETE /addresses/:id`
Elimina una dirección. Responde 204.

---

## 🚚 Delivery *(público)*

### `GET /delivery/zones`
Lista zonas de entrega activas con `feeCents` y barrios.

### `GET /delivery/slots`
Lista franjas horarias activas, ordenadas por posición.

### `GET /delivery/blocked-dates`
Fechas bloqueadas a partir de hoy (festivos, mantenimiento).

---

## 🏷️ Coupons

### `POST /coupons/validate`
**Body:** `{ "code": "BIENVENIDA10", "subtotalCents": 5000000 }`

**Respuesta:**
```json
{
  "ok": true,
  "data": {
    "coupon": { "id": "...", "code": "BIENVENIDA10", "type": "PERCENT", "value": 10, ... },
    "discountCents": 500000
  }
}
```

---

## 📦 Orders

### `POST /orders` *(auth opcional — soporta guest checkout)*
**Body:**
```json
{
  "items": [{ "productId": "...", "variantId": "...", "quantity": 1 }],
  "addressId": "...",
  "deliveryDate": "2026-06-01",
  "deliverySlotId": "...",
  "deliveryZoneId": "...",
  "couponCode": "BIENVENIDA10",
  "customerNote": "Dejar con el portero",
  "guestEmail": "guest@example.com"
}
```
Responde 201 con el pedido completo (número `MVH-YYYY-NNNNN`, items, totales).

### `GET /orders` *(auth requerida)*
Lista pedidos del usuario. Soporta `?page=1&perPage=10`.

### `GET /orders/:id` *(auth opcional)*
Detalle de un pedido. Si hay auth, valida que sea el propietario.

---

## 💳 Payments

### `POST /orders/:id/pay` *(auth opcional)*
Inicia el pago de un pedido PENDING.

**Body:**
```json
{
  "method": "BOLD_CARD",
  "returnUrl": "https://mvhflores.com/pedido/XXX?status=success",
  "cancelUrl": "https://mvhflores.com/pedido/XXX?status=cancelled"
}
```

**Respuesta:**
```json
{
  "ok": true,
  "data": {
    "paymentId": "bold_order_xxx",
    "redirectUrl": "https://checkout.bold.co/payment/link/...",
    "provider": "bold"
  }
}
```
→ Frontend redirige al usuario a `redirectUrl`.

### `POST /payments/webhooks/bold`
Endpoint para notificaciones de Bold (HMAC-SHA256 verificado).
No requiere auth. Bold llama aquí cuando el pago cambia de estado.

---

## 🧪 Probar rápido con curl

```bash
# Healthcheck
curl http://localhost:4000/api/v1/health

# Listar destacados
curl http://localhost:4000/api/v1/products/featured

# Detalle
curl http://localhost:4000/api/v1/products/sembrado-floral-primavera-radiante

# Login (post-seed)
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"cliente@test.com","password":"Cliente123!"}'
```
