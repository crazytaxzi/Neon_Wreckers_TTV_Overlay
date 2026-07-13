import type { FastifyInstance } from 'fastify';
import type { Prisma } from '@prisma/client';
import { z } from 'zod';
import type { ApiContext } from '../types.js';
import { acquireTransactionLock } from '../lib/database.js';
import { requireAdmin } from '../services/auth.js';
import { scanForWreck } from '../services/salvage.js';

const jsonValueSchema: z.ZodType<unknown> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonValueSchema),
    z.record(jsonValueSchema)
  ])
);

const configSchema = z.object({
  slug: z.string().trim().min(1).max(120).regex(/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/),
  lifecycle: z.enum(['draft', 'scheduled', 'active', 'retired', 'archived']).default('draft'),
  contentJson: z.record(jsonValueSchema),
  scheduledAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional()
}).refine(
  body => !body.scheduledAt || !body.expiresAt || Date.parse(body.expiresAt) > Date.parse(body.scheduledAt),
  { message: 'expiresAt must be later than scheduledAt.', path: ['expiresAt'] }
);

export async function registerAdminRoutes(app: FastifyInstance, context: ApiContext) {
  app.get('/api/v1/admin/config', async request => {
    await requireAdmin(context.prisma, request);
    return {
      data: await context.prisma.contentVersion.findMany({
        orderBy: [{ slug: 'asc' }, { version: 'desc' }],
        take: 100
      }),
      requestId: request.id
    };
  });

  app.post('/api/v1/admin/config', async request => {
    const user = await requireAdmin(context.prisma, request);
    const body = configSchema.parse(request.body);
    const created = await context.prisma.$transaction(async (transaction: Prisma.TransactionClient) => {
      await acquireTransactionLock(transaction, `content-version:${body.slug}`);
      const latest = await transaction.contentVersion.findFirst({
        where: { slug: body.slug },
        orderBy: { version: 'desc' }
      });
      const version = await transaction.contentVersion.create({
        data: {
          slug: body.slug,
          version: (latest?.version ?? 0) + 1,
          lifecycle: body.lifecycle,
          contentJson: JSON.parse(JSON.stringify(body.contentJson)) as Prisma.InputJsonValue,
          scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
          expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
          createdById: user.id
        }
      });
      await transaction.auditLog.create({
        data: {
          actorId: user.id,
          action: 'config.create',
          target: body.slug,
          after: JSON.parse(JSON.stringify(body)) as Prisma.InputJsonValue,
          requestId: request.id
        }
      });
      return version;
    });
    return { data: created, requestId: request.id };
  });

  app.post('/api/v1/admin/actions/spawn-wreck', async request => {
    const user = await requireAdmin(context.prisma, request);
    return { data: await scanForWreck(context, user), requestId: request.id };
  });
}
