# syntax=docker/dockerfile:1.7

FROM node:22.16.0-bookworm-slim AS build

WORKDIR /workspace

RUN apt-get update  && apt-get install -y --no-install-recommends openssl ca-certificates  && rm -rf /var/lib/apt/lists/*

ENV CI=true
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable \
 && corepack prepare pnpm@10.32.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps ./apps
COPY packages ./packages
COPY infrastructure ./infrastructure
COPY content ./content
COPY assets ./assets
COPY tools ./tools

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile

RUN pnpm exec prisma generate \
    --schema infrastructure/database/prisma/schema.prisma

RUN pnpm run build

FROM node:22.16.0-bookworm-slim AS app

WORKDIR /app

RUN apt-get update  && apt-get install -y --no-install-recommends openssl ca-certificates  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production

COPY --from=build /workspace/package.json ./
COPY --from=build /workspace/node_modules ./node_modules

COPY --from=build /workspace/apps/api/package.json ./apps/api/package.json
COPY --from=build /workspace/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /workspace/apps/api/dist ./apps/api/dist

COPY --from=build /workspace/apps/worker/package.json ./apps/worker/package.json
COPY --from=build /workspace/apps/worker/node_modules ./apps/worker/node_modules
COPY --from=build /workspace/apps/worker/dist ./apps/worker/dist

COPY --from=build /workspace/packages ./packages
COPY --from=build /workspace/infrastructure/database/prisma ./infrastructure/database/prisma
COPY --from=build /workspace/infrastructure/database/dist ./infrastructure/database/dist
COPY --from=build /workspace/content ./content
COPY --from=build /workspace/assets ./assets

USER node

CMD ["node", "apps/api/dist/server.js"]

FROM nginx:1.27.5-alpine AS gateway

RUN rm -f /etc/nginx/conf.d/default.conf \
 && mkdir -p /srv/web /srv/admin /srv/overlay

COPY --from=build /workspace/apps/web/dist/ /srv/web/
COPY --from=build /workspace/apps/admin/dist/ /srv/admin/
COPY --from=build /workspace/apps/overlay/dist/ /srv/overlay/

COPY infrastructure/gateway/nginx.conf.template \
    /etc/nginx/templates/default.conf.template

EXPOSE 80 443
