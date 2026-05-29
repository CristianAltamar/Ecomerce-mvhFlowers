# 🌸 MVH Flores — Ecommerce Headless

Plataforma ecommerce moderna para **MVH Flores** (Barranquilla, Colombia), construida con arquitectura headless. Reemplaza la solución actual basada en WordPress + WooCommerce.

> **Estado actual: Entrega 1 — Fundación del monorepo (Fases 1 y 2 del roadmap)**

---

## 📦 Estructura del proyecto

```
mvh-store/
├── apps/
│   ├── web/        → Frontend público (Next.js 14 + App Router)
│   ├── admin/      → Panel administrativo (pendiente — Entrega 3)
│   └── api/        → Backend REST (Node.js + Express + Prisma)
├── packages/
│   ├── types/      → Tipos TypeScript compartidos
│   ├── utils/      → Utilidades comunes
│   ├── config/     → Configuraciones compartidas (ESLint, TS)
│   └── ui/         → Componentes UI compartidos
├── docker/         → Dockerfiles y configuraciones
├── docs/           → Documentación técnica
└── docker-compose.yml
```

---

## 🧱 Stack tecnológico

| Capa            | Tecnologías                                                                 |
| --------------- | --------------------------------------------------------------------------- |
| **Frontend**    | Next.js 14, React 18, TypeScript, TailwindCSS, Zustand, TanStack Query, Zod |
| **Backend**     | Node.js 24, Express, TypeScript, Prisma ORM, JWT, Zod, Pino                 |
| **Base datos**  | PostgreSQL 16                                                               |
| **Cache/Queue** | Redis 7 + BullMQ (configurado, integración en Entrega 2)                    |
| **Infra**       | Docker, Docker Compose, pnpm workspaces, Turborepo                          |
| **Pagos**       | Bold (módulo aislado — integración en Entrega 2)                            |
| **Imágenes**    | Cloudinary (configurado, integración en Entrega 3)                          |

---

## 🚀 Quick Start

### Requisitos previos

- **Node.js** ≥ 22.x
- **pnpm** ≥ 11.x → `npm install -g pnpm@11`
- **Docker** y **Docker Compose**

### Instalación

```bash
# 1. Clonar e instalar dependencias
git clone <repo>
cd mvh-store
pnpm install

# 2. Configurar variables de entorno
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local

# 3. Levantar servicios (Postgres + Redis)
docker compose up -d

# 4. Aplicar migraciones y poblar BD
pnpm --filter @mvh/api db:migrate
pnpm --filter @mvh/api db:seed

# 5. Iniciar todo (API en :4000, Web en :3000)
pnpm dev
```

Una vez arriba:
- 🌐 **Web pública** → http://localhost:3000
- ⚙️ **API REST**   → http://localhost:4000
- 🩺 **Healthcheck** → http://localhost:4000/health
- 📚 **Docs API**   → http://localhost:4000/docs

---

## 🔐 Credenciales de prueba (post-seed)

| Rol     | Email                | Password   |
| ------- | -------------------- | ---------- |
| Admin   | `admin@mvhflores.com`| `Admin123!`|
| Cliente | `cliente@test.com`   | `Cliente123!`|

---

## 📜 Scripts principales

```bash
pnpm dev              # Inicia todas las apps en modo desarrollo
pnpm build            # Build de producción de todo el monorepo
pnpm lint             # Lint en todos los paquetes
pnpm test             # Tests en todos los paquetes
pnpm format           # Formatea código con Prettier

# Scripts específicos del API
pnpm --filter @mvh/api db:migrate     # Aplica migraciones Prisma
pnpm --filter @mvh/api db:seed        # Pobla BD con datos demo
pnpm --filter @mvh/api db:studio      # Abre Prisma Studio (GUI BD)
pnpm --filter @mvh/api db:reset       # Reset completo de BD
```

---

## 🗺️ Roadmap de entregas

- ✅ **Entrega 1** — Fundación: monorepo, BD, auth, catálogo público *(actual)*
- ⏳ **Entrega 2** — Carrito persistente, checkout, integración Bold
- ⏳ **Entrega 3** — Panel admin (CRUD productos, pedidos, métricas)
- ⏳ **Entrega 4** — Sistema de entregas (franjas, zonas), cupones
- ⏳ **Entrega 5** — SEO avanzado, Core Web Vitals, despliegue Vercel/VPS

---

## 📖 Documentación adicional

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — Arquitectura detallada
- [`docs/API.md`](docs/API.md) — Referencia de endpoints REST
- [`docs/DATABASE.md`](docs/DATABASE.md) — Modelo de datos
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — Guía de despliegue

---

## 📄 Licencia

Propiedad de MVH Flores — Barranquilla, Colombia.
