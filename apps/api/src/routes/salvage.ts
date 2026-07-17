import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { ApiContext } from '../types.js';
import { requireUser } from '../services/auth.js';
import { deploySalvage, scanForWreck } from '../services/salvage.js';

const actionSchema = z.object({ mode: z.enum(['cutters', 'cargo']).default('cutters') });

export async function registerSalvageRoutes(app: FastifyInstance, context: ApiContext) {
  app.post('/api/v1/salvage/scan', async request => {
    const user = await requireUser(context.prisma, request);
    return { data: await scanForWreck(context, user), requestId: request.id };
  });

  app.post('/api/v1/salvage/deploy', async request => {
    const user = await requireUser(context.prisma, request);
    const body = actionSchema.parse(request.body ?? {});
    return { data: await deploySalvage(context, user, body.mode), requestId: request.id };
  });
}
