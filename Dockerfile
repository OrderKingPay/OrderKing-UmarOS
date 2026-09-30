FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS builder
WORKDIR /app
COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./
COPY HDmaster ./HDmaster
COPY orderking-customers ./orderking-customers
COPY orderking-partners ./orderking-partners
COPY orderking-riders ./orderking-riders
COPY Apps-integration- ./Apps-integration-
COPY packages ./packages
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

ARG APP_DIR
ENV APP_DIR=${APP_DIR}

RUN pnpm --filter ${APP_DIR} run build

FROM base AS runner
WORKDIR /app
ARG APP_DIR
ENV APP_DIR=${APP_DIR}
ENV NODE_ENV=production
ENV PORT=8080

COPY --from=builder /app/${APP_DIR}/.output ./output

EXPOSE 8080
CMD ["node", "output/server/index.mjs"]
