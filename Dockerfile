FROM node:24-bookworm-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@12.8.1 --activate

FROM base AS builder
WORKDIR /app
COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./
COPY HDmaster ./HDmaster
COPY orderking-customers ./orderking-customers
COPY orderking-partners ./orderking-partners
COPY orderking-riders ./orderking-riders
COPY Apps-integration- ./Apps-integration-
COPY packages ./packages

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --no-frozen-lockfile

ARG APP_DIR
RUN test -n "$APP_DIR"
RUN cd "$APP_DIR" && pnpm run build && cp -R .output /image-output

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

COPY --from=builder /image-output ./output

EXPOSE 8080
CMD ["node", "output/server/index.mjs"]
