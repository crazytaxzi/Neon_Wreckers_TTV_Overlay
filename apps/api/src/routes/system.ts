import type { FastifyInstance } from 'fastify';
import type { ApiContext } from '../types.js';
import { requireUser } from '../services/auth.js';

export async function registerSystemRoutes(app: FastifyInstance, context: ApiContext) {
  app.get('/health', async () => ({
    ok: true,
    service: 'neon-wreckers-api',
    time: new Date().toISOString()
  }));

  app.get('/ready', async () => {
    await context.prisma.$queryRaw`SELECT 1`;
    await context.gameQueue.getJobCounts('waiting', 'active', 'delayed', 'failed');
    return { ok: true };
  });

  app.get('/internal/metrics', async (_request, reply) => {
    reply.type('text/plain; version=0.0.4; charset=utf-8');
    return context.metrics.prometheus();
  });

  app.get('/api/v1/ws', { websocket: true }, async socket => {
    context.realtime.add(socket);
    if (socket.readyState === socket.OPEN) {
      socket.send(JSON.stringify({ type: 'presence.updated', count: context.realtime.connectionCount }));
    }
    context.realtime.broadcast({ type: 'presence.updated', count: context.realtime.connectionCount });
    socket.on('close', () => {
      context.realtime.remove(socket);
      context.realtime.broadcast({ type: 'presence.updated', count: context.realtime.connectionCount });
    });
    socket.on('error', () => context.realtime.remove(socket));
  });

  app.get('/api/v1/player/ws', { websocket: true }, async (socket, request) => {
    try {
      const user = await requireUser(context.prisma, request);
      context.playerRealtime.add(user.player.id, socket);
      socket.send(JSON.stringify({ type: 'player.connected' }));
      socket.on('close', () => context.playerRealtime.remove(user.player.id, socket));
      socket.on('error', () => context.playerRealtime.remove(user.player.id, socket));
    } catch {
      socket.close(1008, 'Authentication required');
    }
  });
}
