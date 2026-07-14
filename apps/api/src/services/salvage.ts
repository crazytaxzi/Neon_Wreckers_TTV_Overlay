import { discoverWreck, enforceCooldown, salvageWreck } from '@neon-wreckers/game-engine';
import { itemsBySlug, salvageCooldownSeconds, wreckArchetypes } from '@neon-wreckers/content';
import type { Prisma } from '@prisma/client';
import type { ApiContext, AuthenticatedUserWithPlayer } from '../types.js';
import { acquireTransactionLock } from '../lib/database.js';
import { stationDto } from './station.js';

const SCAN_COOLDOWN_SECONDS = 15;
const WRECK_LOCK_KEY = 'station-zero:wreck';

export async function getOrCreateCurrentWreck(context: ApiContext) {
  const current = await context.prisma.wreck.findFirst({
    where: { depleted: false },
    orderBy: { createdAt: 'desc' }
  });
  if (current) return current;

  const discovered = discoverWreck({ station: await stationDto(context.prisma), playerId: 'system', archetypes: wreckArchetypes });
  return context.prisma.$transaction(async (transaction: Prisma.TransactionClient) => {
    await acquireTransactionLock(transaction, WRECK_LOCK_KEY);
    const existing = await transaction.wreck.findFirst({
      where: { depleted: false },
      orderBy: { createdAt: 'desc' }
    });
    if (existing) return existing;

    const station = await transaction.station.findUniqueOrThrow({ where: { slug: 'station-zero' } });
    return transaction.wreck.create({
      data: {
        stationId: station.id,
        archetype: discovered.archetype,
        name: discovered.name,
        description: discovered.description,
        risk: discovered.risk,
        integrity: discovered.integrity,
        depleted: false,
        visualKey: discovered.visualKey,
        remainingLootBudget: discovered.remainingLootBudget,
        discoveredBy: discovered.discoveredBy
      }
    });
  });
}

export async function scanForWreck(context: ApiContext, user: AuthenticatedUserWithPlayer) {
  enforceCooldown({
    key: `scan:${user.player.id}`,
    cooldowns: context.cooldowns,
    seconds: SCAN_COOLDOWN_SECONDS
  });
  const discovered = discoverWreck({
    station: await stationDto(context.prisma),
    playerId: user.player.id,
    archetypes: wreckArchetypes
  });

  const result = await context.prisma.$transaction(async (transaction: Prisma.TransactionClient) => {
    await acquireTransactionLock(transaction, WRECK_LOCK_KEY);
    const station = await transaction.station.findUniqueOrThrow({ where: { slug: 'station-zero' } });
    await transaction.wreck.updateMany({
      where: { stationId: station.id, depleted: false },
      data: { depleted: true }
    });
    const wreck = await transaction.wreck.create({
      data: {
        stationId: station.id,
        archetype: discovered.archetype,
        name: discovered.name,
        description: discovered.description,
        risk: discovered.risk,
        integrity: discovered.integrity,
        depleted: false,
        visualKey: discovered.visualKey,
        remainingLootBudget: discovered.remainingLootBudget,
        discoveredBy: user.player.id
      }
    });
    const history = await transaction.historyEntry.create({
      data: {
        stationId: station.id,
        playerId: user.player.id,
        category: 'salvage',
        title: 'Signal acquired',
        body: `${user.displayName} located the ${wreck.name}.`,
        actorDisplayName: user.displayName
      }
    });
    return { wreck, history };
  });

  context.realtime.broadcast({ type: 'history.added', entry: result.history });
  context.realtime.broadcast({ type: 'wreck.updated', wreck: result.wreck });
  return result.wreck;
}

export async function deploySalvage(
  context: ApiContext,
  user: AuthenticatedUserWithPlayer,
  mode: 'cutters' | 'cargo' | 'override'
) {
  enforceCooldown({
    key: `salvage:${mode}:${user.player.id}`,
    cooldowns: context.cooldowns,
    seconds: salvageCooldownSeconds[mode]
  });
  const result = await context.prisma.$transaction(async (transaction: Prisma.TransactionClient) => {
    await acquireTransactionLock(transaction, WRECK_LOCK_KEY);
    const station = await transaction.station.findUniqueOrThrow({ where: { slug: 'station-zero' } });
    const wreck = await transaction.wreck.findFirstOrThrow({
      where: { stationId: station.id, depleted: false },
      orderBy: { createdAt: 'desc' }
    });
    const player = await transaction.player.findUniqueOrThrow({ where: { id: user.player.id } });
    const outcome = salvageWreck({
      wreck,
      player,
      items: itemsBySlug,
      careerBonus: player.career === 'salvager' ? 0.04 : 0,
      mode
    });
    await transaction.wreck.update({
      where: { id: wreck.id },
      data: {
        integrity: outcome.wreck.integrity,
        depleted: outcome.wreck.depleted,
        remainingLootBudget: outcome.wreck.remainingLootBudget
      }
    });
    await transaction.player.update({
      where: { id: player.id },
      data: {
        credits: Math.max(0, player.credits + outcome.credits),
        xp: { increment: outcome.success ? 12 : 3 }
      }
    });
    for (const stack of outcome.rewards) {
      await transaction.inventoryStack.upsert({
        where: { playerId_itemSlug: { playerId: player.id, itemSlug: stack.itemSlug } },
        update: { quantity: { increment: stack.quantity } },
        create: {
          playerId: player.id,
          itemSlug: stack.itemSlug,
          name: stack.name,
          quantity: stack.quantity,
          rarity: stack.rarity,
          visualKey: stack.visualKey
        }
      });
    }
    await transaction.station.update({
      where: { id: station.id },
      data: {
        power: Math.max(15, station.power - outcome.stationDamage.power),
        integrity: Math.max(1, station.integrity - outcome.stationDamage.integrity)
      }
    });
    const history = await transaction.historyEntry.create({
      data: {
        stationId: station.id,
        playerId: player.id,
        category: 'salvage',
        title: outcome.success ? 'Salvage secured' : 'Salvage accident',
        body: outcome.success
          ? `${user.displayName} recovered ${outcome.rewards.map(reward => `${reward.quantity} ${reward.name}`).join(', ')}.`
          : `${user.displayName}'s run went sideways. Repairs have been billed to the chaos jar.`,
        actorDisplayName: user.displayName
      }
    });
    return { outcome, history };
  });
  context.realtime.broadcast({ type: 'history.added', entry: result.history });
  context.realtime.broadcast({ type: 'station.updated', station: await stationDto(context.prisma) });
  const currentWreck = await context.prisma.wreck.findFirst({
    where: { depleted: false },
    orderBy: { createdAt: 'desc' }
  });
  if (currentWreck) context.realtime.broadcast({ type: 'wreck.updated', wreck: currentWreck });
  return result;
}
