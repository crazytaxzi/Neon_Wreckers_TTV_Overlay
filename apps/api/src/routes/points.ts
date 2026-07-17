import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { ApiContext } from '../types.js';
import { requireUser } from '../services/auth.js';
import { executePointAction } from '../services/points.js';

const actionSchema = z.enum(['safety_override', 'rush_scan']);

export async function registerPointRoutes(app: FastifyInstance, context: ApiContext) {
  app.post('/api/v1/points/actions/:actionSlug', async request => {
    const user = await requireUser(context.prisma, request);
    const actionSlug = actionSchema.parse((request.params as { actionSlug: string }).actionSlug);
    const record = await executePointAction(context, user, actionSlug, request.headers['idempotency-key']?.toString() ?? '');
    return { data: record, requestId: request.id };
  });
}
