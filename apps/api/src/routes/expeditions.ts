import type { FastifyInstance } from 'fastify';
import type { Prisma } from '@prisma/client';
import { z } from 'zod';
import { GameRuleError, launchExpedition, resolveExpedition } from '@neon-wreckers/game-engine';
import { expeditionDefinitions, itemsBySlug } from '@neon-wreckers/content';
import type { ApiContext } from '../types.js';
import { requireAdmin, requireUser } from '../services/auth.js';

const launchSchema = z.object({
  definition: z.string().min(1).default('glass-belt-run'),
  shipId: z.string().optional(),
  crewIds: z.array(z.string()).optional()
});

export async function registerExpeditionRoutes(app: FastifyInstance, context: ApiContext) {
  app.get('/api/v1/expeditions', async request => {
    const user = await requireUser(context.prisma, request);
    return {
      data: await context.prisma.expedition.findMany({
        where: { playerId: user.player.id },
        orderBy: { createdAt: 'desc' },
        take: 30
      }),
      requestId: request.id
    };
  });

  app.post('/api/v1/expeditions/launch', async request => {
    const user = await requireUser(context.prisma, request);
    const playerId = user.player.id;
    const body = launchSchema.parse(request.body ?? {});
    const definition = expeditionDefinitions[body.definition];
    if (!definition) {
      throw new GameRuleError('EXPEDITION_NOT_FOUND', `Unknown expedition definition: ${body.definition}`);
    }

    const ship = body.shipId
      ? await context.prisma.ship.findFirstOrThrow({ where: { id: body.shipId, playerId } })
      : await context.prisma.ship.findFirstOrThrow({ where: { playerId }, orderBy: { createdAt: 'asc' } });
    const crew = await context.prisma.crewMember.findMany({
      where: {
        playerId,
        ...(body.crewIds?.length ? { id: { in: body.crewIds } } : {})
      },
      take: 4
    });
    const launched = launchExpedition({
      player: user.player,
      ship,
      crew,
      expeditionDefinition: definition
    });
    const expedition = await context.prisma.$transaction(async (transaction: Prisma.TransactionClient) => {
      await transaction.ship.update({ where: { id: ship.id }, data: { fuel: launched.ship.fuel } });
      return transaction.expedition.create({
        data: {
          playerId,
          definition: body.definition,
          name: launched.name,
          status: 'active',
          risk: launched.risk,
          launchedAt: new Date(launched.launchedAt),
          resolvesAt: new Date(launched.resolvesAt),
          incidentLog: launched.incidentLog,
          rewards: []
        }
      });
    });
    await context.gameQueue.add(
      'resolve-expedition',
      { expeditionId: expedition.id },
      {
        delay: Math.max(0, Date.parse(launched.resolvesAt) - Date.now()),
        jobId: `resolve:${expedition.id}`,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5_000 },
        removeOnComplete: 100,
        removeOnFail: 500
      }
    );
    const station = await context.prisma.station.findUniqueOrThrow({ where: { slug: 'station-zero' } });
    const history = await context.prisma.historyEntry.create({
      data: {
        stationId: station.id,
        playerId,
        category: 'expedition',
        title: 'Expedition launched',
        body: `${user.displayName} launched ${expedition.name}.`,
        actorDisplayName: user.displayName
      }
    });
    context.realtime.broadcast({ type: 'history.added', entry: history });
    return { data: expedition, requestId: request.id };
  });

  app.post('/api/v1/expeditions/:id/resolve-now', async request => {
    await requireAdmin(context.prisma, request);
    const id = String((request.params as { id: string }).id);
    const expedition = await context.prisma.expedition.findUniqueOrThrow({ where: { id } });
    const resolved = resolveExpedition({
      expedition: {
        ...expedition,
        incidentLog: expedition.incidentLog as string[],
        rewards: expedition.rewards as unknown[]
      },
      items: itemsBySlug,
      now: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    });
    const updated = await context.prisma.expedition.updateMany({
      where: { id: expedition.id, status: 'active' },
      data: {
        status: resolved.status,
        rewards: JSON.parse(JSON.stringify(resolved.rewards)),
        incidentLog: JSON.parse(JSON.stringify(resolved.incidentLog))
      }
    });
    if (updated.count === 0) {
      throw new GameRuleError('EXPEDITION_NOT_ACTIVE', 'This expedition is no longer active.');
    }
    const saved = await context.prisma.expedition.findUniqueOrThrow({ where: { id: expedition.id } });
    return { data: saved, requestId: request.id };
  });

  app.post('/api/v1/expeditions/:id/claim', async request => {
    const user = await requireUser(context.prisma, request);
    const playerId = user.player.id;
    const id = String((request.params as { id: string }).id);
    const expedition = await context.prisma.expedition.findFirstOrThrow({
      where: { id, playerId }
    });
    if (!['resolved', 'failed'].includes(expedition.status)) {
      throw new GameRuleError('EXPEDITION_NOT_CLAIMABLE', 'This expedition is not ready to claim.');
    }
    const rewards = expedition.rewards as Array<{
      itemSlug: string;
      name: string;
      quantity: number;
      rarity: string;
      visualKey: string;
    }>;
    const history = await context.prisma.$transaction(async (transaction: Prisma.TransactionClient) => {
      const claimed = await transaction.expedition.updateMany({
        where: { id: expedition.id, playerId, status: { in: ['resolved', 'failed'] } },
        data: { status: 'claimed' }
      });
      if (claimed.count === 0) {
        throw new GameRuleError('EXPEDITION_NOT_CLAIMABLE', 'This expedition has already been claimed.');
      }
      for (const stack of rewards.filter(reward => reward.itemSlug !== 'credits')) {
        await transaction.inventoryStack.upsert({
          where: { playerId_itemSlug: { playerId, itemSlug: stack.itemSlug } },
          update: { quantity: { increment: stack.quantity } },
          create: { playerId, ...stack }
        });
      }
      const credits = rewards.find(reward => reward.itemSlug === 'credits')?.quantity ?? 0;
      if (credits) {
        await transaction.player.update({ where: { id: playerId }, data: { credits: { increment: credits } } });
      }
      const station = await transaction.station.findUniqueOrThrow({ where: { slug: 'station-zero' } });
      return transaction.historyEntry.create({
        data: {
          stationId: station.id,
          playerId,
          category: 'expedition',
          title: 'Expedition rewards claimed',
          body: `${user.displayName} recovered rewards from ${expedition.name}.`,
          actorDisplayName: user.displayName
        }
      });
    });
    context.realtime.broadcast({ type: 'history.added', entry: history });
    return { data: { claimed: true, rewards }, requestId: request.id };
  });
}
