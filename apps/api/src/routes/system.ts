import type { FastifyInstance } from 'fastify';
import type { ApiContext } from '../types.js';
import { requireUser } from '../services/auth.js';

function refreshWebsocketGauge(context: ApiContext) {
  context.metrics.setGauge(
    'websocket_connections',
    context.realtime.connectionCount + context.playerRealtime.connectionCount,
  );
}

async function refreshQueueGauges(context: ApiContext) {
  const counts = await context.gameQueue.getJobCounts('waiting', 'active', 'delayed', 'failed');
  context.metrics.setGauge('bullmq_waiting_jobs', counts.waiting ?? 0);
  context.metrics.setGauge('bullmq_active_jobs', counts.active ?? 0);
  context.metrics.setGauge('bullmq_delayed_jobs', counts.delayed ?? 0);
  context.metrics.setGauge('bullmq_failed_jobs', counts.failed ?? 0);
  return counts;
}

export async function registerSystemRoutes(app: FastifyInstance, context: ApiContext) {
  app.get('/health', async () => ({ ok: true, service: 'neon-wreckers-api', time: new Date().toISOString() }));

  app.get('/ready', async (request, reply) => {
    const dependencies: Record<string, 'up' | 'down'> = { database: 'down', queue: 'down' };
    try {
      await context.prisma.$queryRaw`SELECT 1`;
      dependencies.database = 'up';
    } catch (error) {
      context.metrics.increment('database_query_failures_total');
      request.log.error({ err: error, requestId: request.id, dependency: 'postgres' }, 'readiness dependency failed');
    }
    try {
      await refreshQueueGauges(context);
      dependencies.queue = 'up';
    } catch (error) {
      request.log.error({ err: error, requestId: request.id, dependency: 'redis' }, 'readiness dependency failed');
    }
    const ok = Object.values(dependencies).every(status => status === 'up');
    return reply.code(ok ? 200 : 503).send({ ok, dependencies });
  });

  app.get('/internal/metrics', async (request, reply) => {
    try {
      await refreshQueueGauges(context);
    } catch (error) {
      request.log.warn({ err: error, requestId: request.id, dependency: 'redis' }, 'queue metric refresh failed');
    }
    refreshWebsocketGauge(context);
    reply.type('text/plain; version=0.0.4; charset=utf-8');
    return context.metrics.prometheus();
  });

  app.get('/api/v1/ws', { websocket: true }, async socket => {
    context.realtime.add(socket);
    refreshWebsocketGauge(context);
    if (socket.readyState === socket.OPEN) socket.send(JSON.stringify({ type: 'presence.updated', count: context.realtime.connectionCount }));
    context.realtime.broadcast({ type: 'presence.updated', count: context.realtime.connectionCount });
    socket.on('close', () => {
      context.realtime.remove(socket);
      refreshWebsocketGauge(context);
      context.realtime.broadcast({ type: 'presence.updated', count: context.realtime.connectionCount });
    });
    socket.on('error', () => {
      context.realtime.remove(socket);
      refreshWebsocketGauge(context);
    });
  });

  app.get('/api/v1/player/ws', { websocket: true }, async (socket, request) => {
    try {
      const user = await requireUser(context.prisma, request);
      context.playerRealtime.add(user.player.id, socket);
      refreshWebsocketGauge(context);
      socket.send(JSON.stringify({ type: 'player.connected' }));
      socket.on('close', () => {
        context.playerRealtime.remove(user.player.id, socket);
        refreshWebsocketGauge(context);
      });
      socket.on('error', () => {
        context.playerRealtime.remove(user.player.id, socket);
        refreshWebsocketGauge(context);
      });
    } catch { socket.close(1008, 'Authentication required'); }
  });
}
