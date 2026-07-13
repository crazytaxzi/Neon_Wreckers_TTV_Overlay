import type { FastifyInstance } from 'fastify';
import type { ApiContext } from '../types.js';
import { requireUser } from '../services/auth.js';
import { getOrCreateCurrentWreck } from '../services/salvage.js';
import { stationDto } from '../services/station.js';

export async function registerStationRoutes(app: FastifyInstance, context: ApiContext) {
  app.get('/api/v1/station', async request => ({ data: await stationDto(context.prisma), requestId: request.id }));

  app.get('/api/v1/wrecks/current', async request => ({
    data: await getOrCreateCurrentWreck(context),
    requestId: request.id
  }));

  app.get('/api/v1/inventory', async request => {
    const user = await requireUser(context.prisma, request);
    const inventory = await context.prisma.inventoryStack.findMany({
      where: { playerId: user.player.id },
      orderBy: { name: 'asc' }
    });
    return { data: inventory, requestId: request.id };
  });

  app.get('/api/v1/ships', async request => {
    const user = await requireUser(context.prisma, request);
    return { data: await context.prisma.ship.findMany({ where: { playerId: user.player.id } }), requestId: request.id };
  });

  app.get('/api/v1/crew', async request => {
    const user = await requireUser(context.prisma, request);
    return { data: await context.prisma.crewMember.findMany({ where: { playerId: user.player.id } }), requestId: request.id };
  });

  app.get('/api/v1/history', async request => ({
    data: await context.prisma.historyEntry.findMany({ orderBy: { createdAt: 'desc' }, take: 50 }),
    requestId: request.id
  }));

  app.get('/api/v1/notifications', async request => {
    const user = await requireUser(context.prisma, request);
    return {
      data: await context.prisma.notification.findMany({
        where: { playerId: user.player.id },
        orderBy: { createdAt: 'desc' },
        take: 40
      }),
      requestId: request.id
    };
  });
}
