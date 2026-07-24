import type { FastifyInstance } from 'fastify';
import type { Prisma } from '@prisma/client';
import { z } from 'zod';
import { GameRuleError } from '@neon-wreckers/game-engine';
import { progressionRules, quartersRules } from '@neon-wreckers/content';
import { requireUser } from '../services/auth.js';
import { enforceDurableCooldown, levelForXp } from '../services/actions.js';
import type { ApiContext } from '../types.js';

type QuartersObject = { key: string; x: number; y: number };

const fixtureSchema = z.object({
  objectKey: z.enum(quartersRules.objects as [string, ...string[]])
});

function installedObjects(value: Prisma.JsonValue): QuartersObject[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is QuartersObject => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return false;
    const record = entry as Record<string, unknown>;
    return typeof record.key === 'string' && Number.isInteger(record.x) && Number.isInteger(record.y);
  });
}

async function consumeInventory(
  transaction: Prisma.TransactionClient,
  playerId: string,
  itemSlug: string,
  quantity: number,
  itemName: string
) {
  const consumed = await transaction.inventoryStack.updateMany({
    where: { playerId, itemSlug, quantity: { gte: quantity } },
    data: { quantity: { decrement: quantity } }
  });
  if (!consumed.count) throw new GameRuleError('QUARTERS_SUPPLIES_REQUIRED', `Requires ${quantity} × ${itemName}.`);
}

async function boostIdleCrew(transaction: Prisma.TransactionClient, playerId: string, amount: number) {
  const [crew, activeExpeditions] = await Promise.all([
    transaction.crewMember.findMany({ where: { playerId } }),
    transaction.expedition.findMany({ where: { playerId, status: 'active' }, select: { crewIds: true } })
  ]);
  const deployedCrew = new Set(activeExpeditions.flatMap(expedition => expedition.crewIds));
  const idleCrew = crew.filter(member => !deployedCrew.has(member.id));
  await Promise.all(idleCrew.map(member => transaction.crewMember.update({
    where: { id: member.id },
    data: { morale: Math.min(100, member.morale + amount) }
  })));
  return idleCrew.length;
}

async function awardPlayer(
  transaction: Prisma.TransactionClient,
  playerId: string,
  reward: { credits?: number; xp?: number; reputation?: number }
) {
  const player = await transaction.player.findUniqueOrThrow({ where: { id: playerId } });
  const nextXp = player.xp + (reward.xp ?? 0);
  await transaction.player.update({
    where: { id: playerId },
    data: {
      credits: { increment: reward.credits ?? 0 },
      xp: { increment: reward.xp ?? 0 },
      reputation: { increment: reward.reputation ?? 0 },
      level: levelForXp(nextXp, progressionRules.levelXp)
    }
  });
}

export async function registerQuartersRoutes(app: FastifyInstance, context: ApiContext) {
  app.post('/api/v1/quarters/use', async request => {
    const user = await requireUser(context.prisma, request);
    const { objectKey } = fixtureSchema.parse(request.body);

    const result = await context.prisma.$transaction(async transaction => {
      const station = await transaction.station.findUniqueOrThrow({ where: { slug: 'station-zero' } });
      const habitat = await transaction.stationModule.findUnique({
        where: { stationId_slug: { stationId: station.id, slug: 'habitat-ring' } }
      });
      if (habitat?.state !== 'active') throw new GameRuleError('QUARTERS_LOCKED', 'Complete the Habitat Ring before using quarters fixtures.');

      const layout = await transaction.quartersLayout.findUnique({ where: { playerId: user.player.id } });
      if (!layout || !installedObjects(layout.objects).some(object => object.key === objectKey)) {
        throw new GameRuleError('QUARTERS_FIXTURE_NOT_INSTALLED', 'Install and save that fixture before using it.');
      }

      let title = '';
      let body = '';
      let rewards: Record<string, number> = {};
      let cooldownEndsAt: Date;

      if (objectKey === 'bed') {
        cooldownEndsAt = await enforceDurableCooldown(transaction, user.player.id, 'quarters:bed', 6 * 60 * 60);
        const crewAffected = await boostIdleCrew(transaction, user.player.id, 12);
        await awardPlayer(transaction, user.player.id, { xp: 10 });
        title = 'Recovery cycle completed';
        body = `${user.displayName} opened their recovery bunk to ${crewAffected} idle crew member${crewAffected === 1 ? '' : 's'}, restoring morale and earning 10 XP.`;
        rewards = { crewAffected, morale: 12, xp: 10 };
      } else if (objectKey === 'relic-shelf') {
        cooldownEndsAt = await enforceDurableCooldown(transaction, user.player.id, 'quarters:relic-shelf', 12 * 60 * 60);
        await consumeInventory(transaction, user.player.id, 'research-data', 1, 'Research Data');
        await awardPlayer(transaction, user.player.id, { credits: 125, xp: 50, reputation: 1 });
        title = 'Private archive decoded';
        body = `${user.displayName} decoded a research fragment in their quarters and earned 125 credits, 50 XP, and 1 reputation.`;
        rewards = { credits: 125, xp: 50, reputation: 1 };
      } else {
        cooldownEndsAt = await enforceDurableCooldown(transaction, user.player.id, 'quarters:espresso-rig', 60 * 60);
        await consumeInventory(transaction, user.player.id, 'water-cartridge', 1, 'Water Cartridge');
        await consumeInventory(transaction, user.player.id, 'nutrient-paste', 1, 'Nutrient Paste');
        const crewAffected = await boostIdleCrew(transaction, user.player.id, 8);
        await awardPlayer(transaction, user.player.id, { xp: 5 });
        title = 'Galley batch served';
        body = `${user.displayName} served a fresh galley batch to ${crewAffected} idle crew member${crewAffected === 1 ? '' : 's'}, restoring morale and earning 5 XP.`;
        rewards = { crewAffected, morale: 8, xp: 5 };
      }

      await transaction.notification.create({
        data: { playerId: user.player.id, type: 'quarters', title, body }
      });
      const history = await transaction.historyEntry.create({
        data: {
          stationId: station.id,
          playerId: user.player.id,
          category: 'quarters',
          title,
          body,
          actorDisplayName: user.displayName,
          details: { operation: `quarters:${objectKey}`, rewards }
        }
      });

      return {
        history,
        response: {
          objectKey,
          cooldownEndsAt: cooldownEndsAt.toISOString(),
          rewards
        }
      };
    });

    context.realtime.broadcast({ type: 'history.added', entry: result.history });
    return { data: result.response, requestId: request.id };
  });
}
