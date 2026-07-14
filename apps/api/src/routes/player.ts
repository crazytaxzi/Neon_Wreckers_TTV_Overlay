import type { FastifyInstance } from 'fastify';
import type { ApiContext } from '../types.js';
import { requireUser } from '../services/auth.js';
import { stationDto } from '../services/station.js';

export async function registerPlayerRoutes(app: FastifyInstance, context: ApiContext) {
  app.get('/api/v1/marketplace/listings', async request => {
    await requireUser(context.prisma, request);
    const station = await stationDto(context.prisma);
    const market = station.modules.find((module: { slug: string; state: string }) => module.slug === 'marketplace');
    const unlocked = market?.state === 'active';
    return {
      data: {
        unlocked,
        listings: unlocked
          ? [
              { slug: 'fuel-cell-bundle', name: 'Fuel Cell Bundle', priceCredits: 240, itemSlug: 'fuel', quantity: 3 },
              { slug: 'refined-alloy-pack', name: 'Refined Alloy Pack', priceCredits: 360, itemSlug: 'alloys', quantity: 5 }
            ]
          : []
      },
      requestId: request.id
    };
  });

  app.get('/api/v1/quarters', async request => {
    const user = await requireUser(context.prisma, request);
    return {
      data: {
        playerId: user.player.id,
        layout: {
          theme: 'station-zero-default',
          objects: [
            { key: 'bed', x: 1, y: 2 },
            { key: 'relic-shelf', x: 4, y: 1 },
            { key: 'espresso-rig', x: 6, y: 3 }
          ]
        }
      },
      requestId: request.id
    };
  });
}
