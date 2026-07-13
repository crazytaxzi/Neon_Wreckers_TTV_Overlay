import type { FastifyInstance } from 'fastify';
import type { ApiContext } from '../types.js';

export async function registerSystemRoutes(app: FastifyInstance, context: ApiContext) {
  app.get('/health', async () => ({ ok: true, service: 'neon-wreckers-api', time: new Date().toISOString() }));
  app.get('/ready', async () => {
    await context.prisma.$queryRaw`SELECT 1`;
    return { ok: true };
  });
  app.get('/metrics', async () => ({
    sockets: context.realtime.connectionCount,
    provider: context.loyaltyProvider.name,
    time: new Date().toISOString()
  }));

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
}
