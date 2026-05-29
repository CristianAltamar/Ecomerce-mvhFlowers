# 🌸 MVH Flores — Ecommerce Headless

Plataforma ecommerce para **MVH Flores** (Barranquilla, Colombia). Monorepo Turborepo + pnpm:
Next.js 14 (web + panel admin) + Express/Prisma (API) + PostgreSQL + Redis + Cloudinary + Bold.

## 📖 Documentación

**Toda la documentación del proyecto está en [`CLAUDE.md`](CLAUDE.md)** — estructura, API, frontend,
modelos de datos, servicios de terceros, sistema de tema, pagos, despliegue, convenciones y reglas.
Es la única fuente de verdad y se mantiene 100% al día con cada cambio.

## 🚀 Quick start

```bash
pnpm install
cp apps/api/.env.example apps/api/.env        # configurar credenciales
cp apps/web/.env.example apps/web/.env.local
docker compose up -d                          # Postgres + Redis
pnpm --filter @mvh/api db:migrate
pnpm --filter @mvh/api db:seed
pnpm dev                                       # web :3000 · api :4000
```

Credenciales demo: admin `admin@mvhflores.com` / `Admin123!` · cliente `cliente@test.com` / `Cliente123!`

> Ver [`CLAUDE.md §3`](CLAUDE.md) para comandos, migraciones y notas del entorno.

## 📄 Licencia

Propiedad de MVH Flores — Barranquilla, Colombia.
