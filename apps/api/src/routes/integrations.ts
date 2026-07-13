import type { FastifyInstance } from 'fastify';
import { env } from '../env.js';
import type { ApiContext } from '../types.js';
import { requireAdmin, requireUser } from '../services/auth.js';

export async function registerIntegrationRoutes(app: FastifyInstance, context: ApiContext) {
  app.get('/api/v1/integrations/streamelements/health', async request => {
    await requireAdmin(context.prisma, request);
    return { data: await context.loyaltyProvider.health(), requestId: request.id };
  });

  app.get('/api/v1/integrations/streamelements/balance', async request => {
    const user = await requireUser(context.prisma, request);
    return {
      data: await context.loyaltyProvider.getBalance({
        channelId: env.STREAMELEMENTS_CHANNEL_ID,
        username: user.twitchLogin || user.displayName
      }),
      requestId: request.id
    };
  });
}
