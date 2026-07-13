# syntax=docker/dockerfile:1.7
FROM node:22.16.0-bookworm-slim AS build
WORKDIR /workspace
ENV CI=true
COPY package.json package-lock.json tsconfig.base.json ./
COPY apps ./apps
COPY packages ./packages
COPY infrastructure ./infrastructure
COPY content ./content
COPY assets ./assets
COPY tools ./tools
RUN npm ci --no-audit --no-fund
RUN npx prisma generate --schema infrastructure/database/prisma/schema.prisma
RUN npm run build
RUN npm prune --omit=dev --no-audit --no-fund

FROM node:22.16.0-bookworm-slim AS app
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /workspace/package.json /workspace/package-lock.json ./
COPY --from=build /workspace/node_modules ./node_modules
COPY --from=build /workspace/apps/api/package.json ./apps/api/package.json
COPY --from=build /workspace/apps/api/dist ./apps/api/dist
COPY --from=build /workspace/apps/worker/package.json ./apps/worker/package.json
COPY --from=build /workspace/apps/worker/dist ./apps/worker/dist
COPY --from=build /workspace/packages/content ./packages/content
COPY --from=build /workspace/packages/game-engine ./packages/game-engine
COPY --from=build /workspace/packages/integrations/package.json ./packages/integrations/package.json
COPY --from=build /workspace/packages/integrations/dist ./packages/integrations/dist
COPY --from=build /workspace/infrastructure/database/prisma ./infrastructure/database/prisma
COPY --from=build /workspace/infrastructure/database/migrations ./infrastructure/database/migrations
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
COPY infrastructure/gateway/nginx.conf.template /etc/nginx/templates/default.conf.template
EXPOSE 80 443
