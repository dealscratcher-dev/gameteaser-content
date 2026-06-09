# ============================================================
# TheGameBit – Next.js 15 App Dockerfile
# Supports: development  |  production
# Build arg:  --target dev   (default: production)
# ============================================================

# ---------- base ----------
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat curl
RUN npm install -g pnpm@9 turbo

# ---------- pruner ----------
# Turborepo prune keeps only deps needed by apps/web
FROM base AS pruner
WORKDIR /repo
COPY . .
RUN turbo prune --scope=web --docker

# ---------- deps ----------
FROM base AS deps
WORKDIR /repo

# Copy pruned lockfile + manifests
COPY --from=pruner /repo/out/json/ .
COPY --from=pruner /repo/out/pnpm-lock.yaml ./pnpm-lock.yaml

RUN pnpm install --frozen-lockfile

# ---------- builder ----------
FROM base AS builder
WORKDIR /repo

COPY --from=deps /repo/node_modules ./node_modules
COPY --from=pruner /repo/out/full/ .

# Disable Next.js telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm turbo run build --filter=web

# ---------- development ----------
FROM base AS dev
WORKDIR /repo

ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1

# Copy full source so hot-reload sees everything
COPY . .
RUN pnpm install

WORKDIR /repo/apps/web

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["pnpm", "dev"]

# ---------- production ----------
FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN apk add --no-cache curl

# Non-root user for security
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Standalone output from Next.js
COPY --from=builder --chown=nextjs:nodejs /repo/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /repo/apps/web/.next/static      ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /repo/apps/web/public             ./apps/web/public

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=45s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["node", "apps/web/server.js"]