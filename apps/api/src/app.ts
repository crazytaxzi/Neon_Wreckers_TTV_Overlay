import crypto from 'node:crypto';
import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import websocket from '@fastify/websocket';
import { PrismaClient } from '@prisma/client';
import { Queue } from 'bullmq';
import { createLoyaltyProvider, parseRedisConnection } from '@neon-wreckers/integrations';
import { corsOrigins, env, isProd, trustProxy } from './env.js';
import { errorResponse } from './lib/errors.js';
import { PlayerRealtimeHub, RealtimeHub } from './lib/realtime.js';
import { registerAdminRoutes } from './routes/admin.js';
import { registerAuthRoutes } from './routes/auth.js';
import { registerConstructionRoutes } from './routes/construction.js';
import { registerExpeditionRoutes } from './routes/expeditions.js';
import { registerEventSubRoutes } from './routes/eventsub.js';
import { registerFleetRoutes } from './routes/fleet.js';
import { registerIntegrationRoutes } from './routes/integrations.js';
import { registerPlayerRoutes } from './routes/player.js';
import { registerPointRoutes } from './routes/points.js';
import { registerSalvageRoutes } from './routes/salvage.js';
import { registerStationRoutes } from './routes/station.js';
import { registerSystemRoutes } from './routes/system.js';
import type { ApiContext } from './types.js';
import { RequestMetrics } from './services/metrics.js';

const apiContentSecurityPolicy = {
  directives: {
    defaultSrc: ["'none'"],
    baseUri: ["'none'"],
    formAction: ["'none'"],
    frameAncestors: ["'none'"],
    objectSrc: ["'none'"]
  }
} as const;

type MetricsRequest = {
  metricsStartedAt?: number;
};

export async function buildApp() {
  const prisma = new PrismaClient();
  const gameQueue = new Queue('neon-wreckers-game', { connection: parseRedisConnection(env.REDIS_URL) });
  const context: ApiContext = {
    prisma,
    gameQueue,
    loyaltyProvider: createLoyaltyProvider({
      provider: env.STREAMELEMENTS_PROVIDER,
      apiBase: env.STREAMELEMENTS_API_BASE,
      jwt: env.STREAMELEMENTS_JWT
    }),
    realtime: new RealtimeHub(),
    playerRealtime: new PlayerRealtimeHub(),
    metrics: new RequestMetrics()
  };

  const app = Fastify({
    trustProxy,
    logger: { level: env.LOG_LEVEL },
    genReqId: request => {
      const supplied = request.headers['x-request-id']?.toString();
      return supplied && /^[A-Za-z0-9._:-]{1,128}$/.test(supplied) ? supplied : crypto.randomUUID();
    }
  });

  await app.register(helmet, { global: true, contentSecurityPolicy: apiContentSecurityPolicy });
  await app.register(cors, { origin: corsOrigins, credentials: true });
  await app.register(cookie, { secret: env.SESSION_SECRET });
  await app.register(rateLimit, {
    max: env.RATE_LIMIT_MAX,
    timeWindow: `${env.RATE_LIMIT_WINDOW_SECONDS} seconds`,
    keyGenerator: request => request.ip
  });
  await app.register(websocket);

  app.addHook('onRequest', async (request, reply) => {
    (request as typeof request & MetricsRequest).metricsStartedAt = performance.now();
    context.metrics.begin();
    reply.header('x-request-id', request.id);
  });
  app.addHook('onResponse', async (request, reply) => {
    const startedAt = (request as typeof request & MetricsRequest).metricsStartedAt ?? performance.now();
    const route = request.routeOptions.url || 'unmatched';
    context.metrics.record(
      request.method,
      route,
      reply.statusCode,
      performance.now() - startedAt,
      Number(reply.getHeader('content-length') ?? 0)
    );
  });
  app.setErrorHandler((error, request, reply) => {
    const response = errorResponse(error, isProd);
    request.log.error({ err: error, requestId: request.id }, 'request failed');
    if ('details' in response && response.details?.retryAfterSeconds) {
      reply.header('retry-after', response.details.retryAfterSeconds);
    }
    reply.code(response.statusCode).send({
      error: {
        code: response.code,
        message: response.message,
        ...('details' in response ? { details: response.details } : {})
      },
      requestId: request.id
    });
  });
  app.addHook('onClose', async () => {
    await gameQueue.close();
    await prisma.$disconnect();
  });

  await registerSystemRoutes(app, context);
  await registerAuthRoutes(app, context);
  await registerStationRoutes(app, context);
  await registerSalvageRoutes(app, context);
  await registerConstructionRoutes(app, context);
  await registerPointRoutes(app, context);
  await registerExpeditionRoutes(app, context);
  await registerFleetRoutes(app, context);
  await registerPlayerRoutes(app, context);
  await registerIntegrationRoutes(app, context);
  await registerEventSubRoutes(app, context);
  await registerAdminRoutes(app, context);

  return app;
}
