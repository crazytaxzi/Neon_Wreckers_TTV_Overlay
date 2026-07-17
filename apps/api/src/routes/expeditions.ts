import type { FastifyInstance } from 'fastify';
import type { Prisma } from '@prisma/client';
import { z } from 'zod';
import { GameRuleError, launchExpedition, resolveExpedition } from '@neon-wreckers/game-engine';
import { expeditionDefinitions, itemsBySlug, progressionRules } from '@neon-wreckers/content';
import type { ApiContext } from '../types.js';
import { requireAdmin, requireUser } from '../services/auth.js';
import { acquireTransactionLock } from '../lib/database.js';
import { levelForXp } from '../services/actions.js';

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
    if (crew.some(member => member.injuredUntil && member.injuredUntil > new Date())) throw new GameRuleError('CREW_INJURED', 'An assigned crew member is still recovering.');
    const launched = launchExpedition({
      player: user.player,
      ship,
      crew,
      expeditionDefinition: definition
    });
    const expedition = await context.prisma.$transaction(async (transaction: Prisma.TransactionClient) => {
      await acquireTransactionLock(transaction, `player:${playerId}:expedition`);
      if (await transaction.expedition.findFirst({ where: { playerId, shipId: ship.id, status: 'active' } })) throw new GameRuleError('SHIP_BUSY', 'That ship is already away on expedition.');
      const active = await transaction.expedition.findMany({ where: { playerId, status: 'active' }, select: { crewIds: true } });
      const busyCrew = new Set(active.flatMap(candidate => candidate.crewIds));
      if (crew.some(member => busyCrew.has(member.id))) throw new GameRuleError('CREW_BUSY', 'An assigned crew member is already away.');
      const consumed = await transaction.ship.updateMany({ where: { id: ship.id, playerId, fuel: { gte: definition.fuelCost }, condition: { gt: 0 } }, data: { fuel: { decrement: definition.fuelCost } } });
      if (!consumed.count) throw new GameRuleError('NO_FUEL', 'The selected ship is unavailable or lacks fuel.');
      return transaction.expedition.create({
        data: {
          playerId,
          definition: body.definition,
          shipId: ship.id,
          crewIds: crew.map(member => member.id),
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
    const resolvedStatus =
      resolved.status === 'resolved' || resolved.status === 'failed'
        ? resolved.status
        : (() => {
            throw new GameRuleError(
              'EXPEDITION_RESOLUTION_INVALID',
              `Unexpected expedition resolution status: ${resolved.status}`
            );
          })();

    const updated = await context.prisma.expedition.updateMany({
      where: { id: expedition.id, status: 'active' },
      data: {
        status: resolvedStatus,
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
      const inventory = await transaction.inventoryStack.findMany({ where: { playerId } });
      const rewardItems = rewards.filter(reward => reward.itemSlug !== 'credits');
      const newSlugs = new Set(rewardItems.filter(reward => !inventory.some(stack => stack.itemSlug === reward.itemSlug)).map(reward => reward.itemSlug));
      if (inventory.length + newSlugs.size > user.player.inventoryCapacity) throw new GameRuleError('INVENTORY_FULL', 'Clear inventory space before claiming this expedition.');
      for (const reward of rewardItems) {
        const current = inventory.find(stack => stack.itemSlug === reward.itemSlug)?.quantity ?? 0;
        if (current + reward.quantity > itemsBySlug[reward.itemSlug].stackLimit) throw new GameRuleError('STACK_LIMIT', `${reward.name} stack limit reached.`);
      }
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
      const currentPlayer = await transaction.player.findUniqueOrThrow({ where: { id: playerId } });
      const xpGain = expedition.status === 'resolved' ? 30 : 10;
      await transaction.player.update({ where: { id: playerId }, data: { xp: { increment: xpGain }, level: levelForXp(currentPlayer.xp + xpGain, progressionRules.levelXp), reputation: { increment: expedition.status === 'resolved' ? 2 : 0 } } });
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
