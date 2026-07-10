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
RUN pnpm install --frozen-lockfile
COPY --from=pruner /app/out/full/ .
RUN pnpm --filter @zelo/api exec prisma generate
RUN pnpm exec turbo run build --filter=@zelo/api

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=installer /app .
EXPOSE 3000
CMD ["sh", "-c", "pnpm --filter @zelo/api exec prisma migrate deploy && node apps/api/dist/src/main.js"]
