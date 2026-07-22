import type { FastifyInstance } from 'fastify';
import type { ApiContext } from '../types.js';
import { requireUser } from '../services/auth.js';

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
      const counts = await context.gameQueue.getJobCounts('waiting', 'active', 'delayed', 'failed');
      context.metrics.setGauge('bullmq_waiting_jobs', counts.waiting ?? 0);
      context.metrics.setGauge('bullmq_active_jobs', counts.active ?? 0);
      context.metrics.setGauge('bullmq_delayed_jobs', counts.delayed ?? 0);
      context.metrics.setGauge('bullmq_failed_jobs', counts.failed ?? 0);
      dependencies.queue = 'up';
    } catch (error) {
      request.log.error({ err: error, requestId: request.id, dependency: 'redis' }, 'readiness dependency failed');
    }
    const ok = Object.values(dependencies).every(status => status === 'up');
    return reply.code(ok ? 200 : 503).send({ ok, dependencies });
  });

  app.get('/internal/metrics', async (_request, reply) => {
    reply.type('text/plain; version=0.0.4; charset=utf-8');
    return context.metrics.prometheus();
  });

  app.get('/api/v1/ws', { websocket: true }, async socket => {
    context.realtime.add(socket);
    if (socket.readyState === socket.OPEN) socket.send(JSON.stringify({ type: 'presence.updated', count: context.realtime.connectionCount }));
    context.realtime.broadcast({ type: 'presence.updated', count: context.realtime.connectionCount });
    socket.on('close', () => { context.realtime.remove(socket); context.realtime.broadcast({ type: 'presence.updated', count: context.realtime.connectionCount }); });
    socket.on('error', () => context.realtime.remove(socket));
  });

  app.get('/api/v1/player/ws', { websocket: true }, async (socket, request) => {
    try {
      const user = await requireUser(context.prisma, request);
      context.playerRealtime.add(user.player.id, socket);
      socket.send(JSON.stringify({ type: 'player.connected' }));
      socket.on('close', () => context.playerRealtime.remove(user.player.id, socket));
      socket.on('error', () => context.playerRealtime.remove(user.player.id, socket));
    } catch { socket.close(1008, 'Authentication required'); }
  });
}
