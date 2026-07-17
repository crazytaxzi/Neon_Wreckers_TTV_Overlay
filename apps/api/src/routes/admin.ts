import type { FastifyInstance } from 'fastify';
import type { Prisma } from '@prisma/client';
import { z } from 'zod';
import type { ApiContext } from '../types.js';
import { acquireTransactionLock } from '../lib/database.js';
import { requireAdmin } from '../services/auth.js';
import { scanForWreck } from '../services/salvage.js';
import { eventsBySlug } from '@neon-wreckers/content';
import { GameRuleError } from '@neon-wreckers/game-engine';
import os from 'node:os';
import { statfs } from 'node:fs/promises';
import { env } from '../env.js';

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
  app.get('/api/v1/admin/overview', async request => {
    await requireAdmin(context.prisma, request);
    const [players, activeExpeditions, activeEvents, cooldowns, pendingTransactions, queue, disk] = await Promise.all([
      context.prisma.player.count(), context.prisma.expedition.count({ where: { status: 'active' } }), context.prisma.runtimeEvent.count({ where: { status: 'active' } }), context.prisma.actionCooldown.count({ where: { expiresAt: { gt: new Date() } } }), context.prisma.loyaltyTransaction.count({ where: { status: { in: ['pending', 'ambiguous'] } } }), context.gameQueue.getJobCounts('waiting', 'active', 'delayed', 'failed', 'completed'), statfs('/app').catch(() => null)
    ]);
    const memory = process.memoryUsage();
    const timers = await context.prisma.expedition.findMany({ where: { status: 'active' }, include: { player: { include: { user: { select: { displayName: true } } } } }, orderBy: { resolvesAt: 'asc' }, take: 50 });
    return { data: { service: { uptimeSeconds: Math.floor(process.uptime()), startedAt: context.metrics.startedAt, node: process.version, loadAverage: os.loadavg(), cpuCount: os.cpus().length, memory: { rss: memory.rss, heapUsed: memory.heapUsed, heapTotal: memory.heapTotal }, disk: disk ? { total: disk.blocks * disk.bsize, free: disk.bfree * disk.bsize, used: (disk.blocks - disk.bfree) * disk.bsize } : null, sockets: context.realtime.connectionCount }, throughput: context.metrics.snapshot(), database: { players, activeExpeditions, activeEvents, activeCooldowns: cooldowns, pendingTransactions }, queue, timers: timers.map(timer => ({ id: timer.id, name: timer.name, playerName: timer.player.user.displayName, resolvesAt: timer.resolvesAt })), cloudSafeZone: { machine: 'e2-micro', eligibleRegions: ['us-west1', 'us-central1', 'us-east1'], vmHoursPerMonth: 'one eligible instance for the number of hours in the month', standardDiskGbMonth: 30, outboundGbMonth: 1, estimatedOverage: { vmUsdPerHour: 0.01, standardDiskUsdPerGbMonth: 0.04, premiumEgressUsdPerGbFrom: 0.08 }, disclaimer: 'Estimates only; region, network tier, taxes, discounts, and current Google pricing affect billing.' } }, requestId: request.id };
  });

  app.get('/api/v1/admin/players', async request => {
    await requireAdmin(context.prisma, request);
    const query = z.object({ q: z.string().max(100).optional() }).parse(request.query);
    const users = await context.prisma.user.findMany({
      where: query.q ? { OR: [{ displayName: { contains: query.q, mode: 'insensitive' } }, { twitchLogin: { contains: query.q, mode: 'insensitive' } }] } : {},
      include: { player: { include: { cooldowns: { where: { expiresAt: { gt: new Date() } } } } } },
      orderBy: { displayName: 'asc' },
      take: 100
    });
    return { data: users.filter(user => user.player).map(user => ({ id: user.player!.id, userId: user.id, displayName: user.displayName, twitchLogin: user.twitchLogin, credits: user.player!.credits, xp: user.player!.xp, level: user.player!.level, reputation: user.player!.reputation, bannedUntil: user.player!.bannedUntil, cooldowns: user.player!.cooldowns })), requestId: request.id };
  });

  app.post('/api/v1/admin/players/:id/adjust', async request => {
    const admin = await requireAdmin(context.prisma, request); const id = String((request.params as { id: string }).id);
    const body = z.object({ credits: z.number().int().min(-10_000_000).max(10_000_000).default(0), xp: z.number().int().min(-10_000_000).max(10_000_000).default(0), reputation: z.number().int().min(-100_000).max(100_000).default(0), reason: z.string().trim().min(3).max(300) }).parse(request.body);
    const player = await context.prisma.$transaction(async transaction => { const current = await transaction.player.findUniqueOrThrow({ where: { id } }); const updated = await transaction.player.update({ where: { id }, data: { credits: Math.max(0, current.credits + body.credits), xp: Math.max(0, current.xp + body.xp), reputation: Math.max(0, current.reputation + body.reputation) } }); await transaction.auditLog.create({ data: { actorId: admin.id, action: 'player.adjust', target: id, before: { credits: current.credits, xp: current.xp, reputation: current.reputation }, after: { ...body, credits: updated.credits, xp: updated.xp, reputation: updated.reputation }, requestId: request.id } }); return updated; });
    return { data: player, requestId: request.id };
  });

  app.post('/api/v1/admin/players/:id/cooldowns/reset', async request => {
    const admin = await requireAdmin(context.prisma, request); const playerId = String((request.params as { id: string }).id); const body = z.object({ actionKey: z.string().min(1).optional(), reason: z.string().trim().min(3).max(300) }).parse(request.body);
    const removed = await context.prisma.actionCooldown.deleteMany({ where: { playerId, ...(body.actionKey ? { actionKey: body.actionKey } : {}) } });
    await context.prisma.auditLog.create({ data: { actorId: admin.id, action: 'cooldown.reset', target: playerId, after: { actionKey: body.actionKey ?? '*', count: removed.count, reason: body.reason }, requestId: request.id } });
    return { data: { reset: removed.count }, requestId: request.id };
  });

  app.get('/api/v1/admin/transactions', async request => { await requireAdmin(context.prisma, request); return { data: await context.prisma.loyaltyTransaction.findMany({ include: { user: { select: { displayName: true, twitchLogin: true } } }, orderBy: { createdAt: 'desc' }, take: 100 }), requestId: request.id }; });
  app.post('/api/v1/admin/transactions/:id/refund', async request => {
    const admin = await requireAdmin(context.prisma, request); const id = String((request.params as { id: string }).id); const body = z.object({ reason: z.string().trim().min(3).max(300) }).parse(request.body); const transaction = await context.prisma.loyaltyTransaction.findUniqueOrThrow({ where: { id }, include: { user: true } });
    if (!['committed', 'ambiguous'].includes(transaction.status)) throw new GameRuleError('NOT_REFUNDABLE', 'Only committed or ambiguous point transactions can be refunded.');
    const username = String((transaction.requestJson as Record<string, unknown>).username ?? transaction.user.twitchLogin ?? transaction.user.displayName);
    const credit = await context.loyaltyProvider.credit({ channelId: env.STREAMELEMENTS_CHANNEL_ID, username, amount: transaction.amount, reason: body.reason, idempotencyKey: `admin-refund:${transaction.id}`, priorReference: transaction.externalReference ?? undefined });
    const updated = await context.prisma.$transaction(async prisma => { const tx = await prisma.loyaltyTransaction.update({ where: { id }, data: { status: 'refunded', responseJson: { adminRefundReference: credit.externalReference, reason: body.reason } } }); await prisma.auditLog.create({ data: { actorId: admin.id, action: 'loyalty.refund', target: id, after: { amount: transaction.amount, reason: body.reason, reference: credit.externalReference }, requestId: request.id } }); return tx; });
    return { data: updated, requestId: request.id };
  });

  app.post('/api/v1/admin/events/:slug/reset', async request => { const admin = await requireAdmin(context.prisma, request); const slug = String((request.params as { slug: string }).slug); const body = z.object({ stopActive: z.boolean().default(false), reason: z.string().trim().min(3).max(300) }).parse(request.body); const result = body.stopActive ? await context.prisma.runtimeEvent.updateMany({ where: { slug, status: 'active' }, data: { status: 'completed', endsAt: new Date() } }) : { count: 0 }; await context.prisma.runtimeEvent.deleteMany({ where: { slug, status: { not: 'active' } } }); await context.prisma.auditLog.create({ data: { actorId: admin.id, action: 'event.timer.reset', target: slug, after: { ...body, stopped: result.count }, requestId: request.id } }); return { data: { reset: true, stopped: result.count }, requestId: request.id }; });

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
    return { data: await scanForWreck(context, user, true), requestId: request.id };
  });

  app.post('/api/v1/admin/events/:slug/trigger', async request => {
    const user = await requireAdmin(context.prisma, request);
    const slug = String((request.params as { slug: string }).slug);
    const definition = eventsBySlug[slug];
    if (!definition) throw new GameRuleError('EVENT_NOT_FOUND', 'Unknown live event.');
    const now = new Date();
    const recent = await context.prisma.runtimeEvent.findFirst({ where: { slug, startsAt: { gt: new Date(now.getTime() - definition.cooldownMinutes * 60_000) } }, orderBy: { startsAt: 'desc' } });
    if (recent) throw new GameRuleError('EVENT_COOLDOWN', 'This event is still cooling down.');
    const station = await context.prisma.station.findUniqueOrThrow({ where: { slug: 'station-zero' } });
    const runtime = await context.prisma.$transaction(async (transaction: Prisma.TransactionClient) => {
      const created = await transaction.runtimeEvent.create({ data: { slug, status: 'active', source: 'admin', payload: JSON.parse(JSON.stringify(definition)) as Prisma.InputJsonValue, startsAt: now, endsAt: new Date(now.getTime() + definition.durationMinutes * 60_000) } });
      for (const action of definition.actions) {
        if (action.type === 'damageModule') {
          const moduleSlug = String(action.params.module ?? '');
          const amount = Number(action.params.amount ?? 0);
          const module = await transaction.stationModule.findUnique({ where: { stationId_slug: { stationId: station.id, slug: moduleSlug } } });
          if (module) await transaction.stationModule.update({ where: { id: module.id }, data: { integrity: Math.max(0, module.integrity - amount), state: module.integrity - amount <= 0 ? 'disabled' : 'damaged' } });
        }
        if (action.type === 'notify') await transaction.stationAlert.create({ data: { stationId: station.id, severity: String(action.params.severity ?? 'warning'), title: String(action.params.title ?? definition.name), body: `${definition.name} is active.`, expiresAt: created.endsAt } });
      }
      await transaction.historyEntry.create({ data: { stationId: station.id, category: 'event', title: definition.name, body: `${user.displayName} activated ${definition.name}.`, actorDisplayName: user.displayName } });
      return created;
    });
    if (definition.actions.some(action => action.type === 'spawnWreck')) await scanForWreck(context, user, true);
    context.realtime.broadcast({ type: 'station.updated', station: await (await import('../services/station.js')).stationDto(context.prisma) });
    return { data: runtime, requestId: request.id };
  });
}
