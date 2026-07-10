FROM node:24-alpine AS base
RUN apk add --no-cache libc6-compat
RUN corepack enable

FROM base AS pruner
WORKDIR /app
COPY . .
RUN npx turbo prune @zelo/api --docker

FROM base AS installer
WORKDIR /app
COPY --from=pruner /app/out/json/ .
RUN pnpm install --frozen-lockfile --ignore-scripts
COPY --from=pruner /app/out/full/ .
ENV DATABASE_URL="postgresql://user:password@localhost:5432/db?schema=public"
ENV DIRECT_DATABASE_URL="postgresql://user:password@localhost:5432/db?schema=public"
RUN pnpm --filter @zelo/api exec prisma generate
RUN pnpm exec turbo run build --filter=@zelo/api

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=installer /app .
EXPOSE 3000
# Migrations are NOT run on container boot — run
# `pnpm --filter @zelo/api exec prisma migrate deploy` manually before deploying
# any schema change. docker-compose overrides `command:` for the api service to
# auto-migrate locally for convenience; this image's own CMD stays migration-free
# so Fly.io's machine config matches a known-working reference app exactly
# (native Docker CMD, no fly.toml [processes]/init.cmd override).
CMD ["node", "apps/api/dist/src/main.js"]
