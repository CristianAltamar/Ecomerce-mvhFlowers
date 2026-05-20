# ====== DOCKERFILE PARA @mvh/api (producción) ======
# Build multi-stage para imagen final mínima.

# === Stage 1: deps ===
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY apps/api/package.json ./apps/api/
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/
COPY packages/config/package.json ./packages/config/

RUN pnpm install --frozen-lockfile

# === Stage 2: build ===
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages ./packages

COPY . .

RUN pnpm --filter @mvh/api db:generate
RUN pnpm --filter @mvh/api build

# === Stage 3: runtime ===
FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl tini

ENV NODE_ENV=production

# Usuario no-root por seguridad
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 mvhuser

COPY --from=builder --chown=mvhuser:nodejs /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=mvhuser:nodejs /app/apps/api/package.json ./apps/api/
COPY --from=builder --chown=mvhuser:nodejs /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder --chown=mvhuser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=mvhuser:nodejs /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder --chown=mvhuser:nodejs /app/packages ./packages

USER mvhuser
EXPOSE 4000

# tini garantiza que SIGTERM se propague para graceful shutdown
ENTRYPOINT ["/sbin/tini", "--"]
WORKDIR /app/apps/api
CMD ["node", "dist/server.js"]
