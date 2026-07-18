import type { FastifyInstance } from 'fastify';
import type { Prisma } from '@prisma/client';
import { z } from 'zod';
import { GameRuleError } from '@neon-wreckers/game-engine';
import type { ApiContext } from '../types.js';
import { requireUser } from '../services/auth.js';
import { getOrCreateCurrentWreck } from '../services/salvage.js';
import { stationDto } from '../services/station.js';
import { acquireTransactionLock } from '../lib/database.js';
import { enforceDurableCooldown } from '../services/actions.js';

export async function registerStationRoutes(app: FastifyInstance, context: ApiContext) {
  app.get('/api/v1/station', async request => ({ data: await stationDto(context.prisma), requestId: request.id }));

  app.get('/api/v1/wrecks/current', async request => ({
    data: await getOrCreateCurrentWreck(context),
    requestId: request.id
  }));

  app.get('/api/v1/inventory', async request => {
    const user = await requireUser(context.prisma, request);
    const inventory = await context.prisma.inventoryStack.findMany({
      where: { playerId: user.player.id },
      orderBy: { name: 'asc' }
    });
    return { data: inventory, requestId: request.id };
  });

  app.get('/api/v1/ships', async request => {
    const user = await requireUser(context.prisma, request);
    return { data: await context.prisma.ship.findMany({ where: { playerId: user.player.id } }), requestId: request.id };
  });

  app.get('/api/v1/crew', async request => {
    const user = await requireUser(context.prisma, request);
    return { data: await context.prisma.crewMember.findMany({ where: { playerId: user.player.id } }), requestId: request.id };
  });

  app.get('/api/v1/cooldowns', async request => {
    const user = await requireUser(context.prisma, request);
    return {
      data: await context.prisma.actionCooldown.findMany({
        where: { playerId: user.player.id, expiresAt: { gt: new Date() } },
        select: { actionKey: true, expiresAt: true },
        orderBy: { expiresAt: 'asc' }
      }),
      requestId: request.id
    };
  });

  app.get('/api/v1/history', async request => ({
    data: await context.prisma.historyEntry.findMany({ orderBy: { createdAt: 'desc' }, take: 50 }),
    requestId: request.id
  }));

  app.get('/api/v1/notifications', async request => {
    const user = await requireUser(context.prisma, request);
    return {
      data: await context.prisma.notification.findMany({
        where: { playerId: user.player.id },
        orderBy: { createdAt: 'desc' },
        take: 40
      }),
      requestId: request.id
    };
  });

  app.post('/api/v1/station/refine', async request => {
    const user = await requireUser(context.prisma, request);
    const scrap = z.object({ scrap: z.number().int().min(10).max(1000) }).parse(request.body).scrap;
    const station = await stationDto(context.prisma);
    const refinery = station.modules.find(module => module.slug === 'refinery');
    if (refinery?.state !== 'active') throw new GameRuleError('REFINERY_OFFLINE', 'The Refinery module is offline.');
    const alloys = Math.floor(scrap * Number(refinery.effects.scrapToAlloyRate ?? 0));
    if (alloys < 1) throw new GameRuleError('REFINE_TOO_SMALL', 'Submit enough scrap to produce at least one alloy.');
    await context.prisma.$transaction(async (transaction: Prisma.TransactionClient) => {
      await acquireTransactionLock(transaction, `player:${user.player.id}:refinery`);
      const removed = await transaction.inventoryStack.updateMany({ where: { playerId: user.player.id, itemSlug: 'scrap', quantity: { gte: scrap } }, data: { quantity: { decrement: scrap } } });
      if (!removed.count) throw new GameRuleError('NOT_ENOUGH_MATERIALS', 'Not enough scrap to refine.');
      await transaction.inventoryStack.upsert({ where: { playerId_itemSlug: { playerId: user.player.id, itemSlug: 'alloys' } }, update: { quantity: { increment: alloys } }, create: { playerId: user.player.id, itemSlug: 'alloys', name: 'Refined Alloys', quantity: alloys, rarity: 'uncommon', visualKey: 'item-alloys' } });
    });
    return { data: { scrapConsumed: scrap, alloysProduced: alloys }, requestId: request.id };
  });

  app.post('/api/v1/station/maintain', async request => {
    const user = await requireUser(context.prisma, request);
    const body = z.object({ action: z.enum(['repair-hull', 'fuel-reactor', 'food-drive', 'medical-clinic']) }).parse(request.body);
    const rules = {
      'repair-hull': { items: { 'hull-plate': 2, 'sealant-foam': 3 }, integrity: 8, power: 0, population: 0, morale: 1, cooldown: 120, label: 'Station hull repaired' },
      'fuel-reactor': { items: { fuel: 2, 'reactor-coolant': 1 }, integrity: 0, power: 15, population: 0, morale: 1, cooldown: 120, label: 'Reactor refueled' },
      'food-drive': { items: { 'ration-pack': 10, 'water-cartridge': 5 }, integrity: 0, power: 0, population: 6, morale: 4, cooldown: 300, label: 'Residents supplied' },
      'medical-clinic': { items: { 'medical-supplies': 4 }, integrity: 0, power: -2, population: 3, morale: 6, cooldown: 300, label: 'Community clinic completed' }
    } as const;
    const rule = rules[body.action];
    const result = await context.prisma.$transaction(async transaction => {
      const cooldownEndsAt = await enforceDurableCooldown(transaction, user.player.id, `station:${body.action}`, rule.cooldown);
      for (const [itemSlug, quantity] of Object.entries(rule.items)) {
        const removed = await transaction.inventoryStack.updateMany({ where: { playerId: user.player.id, itemSlug, quantity: { gte: quantity } }, data: { quantity: { decrement: quantity } } });
        if (!removed.count) throw new GameRuleError('NOT_ENOUGH_MATERIALS', `Requires ${quantity} × ${itemsBySlugFallback(itemSlug)}.`);
      }
      const station = await transaction.station.findUniqueOrThrow({ where: { slug: 'station-zero' } });
      const updated = await transaction.station.update({ where: { id: station.id }, data: {
        integrity: Math.max(0, Math.min(100, station.integrity + rule.integrity)),
        power: Math.max(0, Math.min(100, station.power + rule.power)),
        population: Math.max(0, station.population + rule.population),
        morale: Math.max(0, Math.min(100, station.morale + rule.morale))
      } });
      const received = [rule.integrity && `+${rule.integrity} hull integrity`, rule.power && `${rule.power > 0 ? '+' : ''}${rule.power} power`, rule.population && `+${rule.population} population`, rule.morale && `+${rule.morale} morale`].filter(Boolean).join(', ');
      await transaction.notification.create({ data: { playerId: user.player.id, type: 'reward', title: rule.label, body: `Your action provided ${received}. Cooldown: ${rule.cooldown} seconds.` } });
      await transaction.historyEntry.create({ data: { stationId: station.id, playerId: user.player.id, category: 'community', title: rule.label, body: `${user.displayName} provided ${received}.`, actorDisplayName: user.displayName } });
      return { action: body.action, received, station: { integrity: updated.integrity, power: updated.power, population: updated.population, morale: updated.morale }, cooldownEndsAt: cooldownEndsAt.toISOString() };
    });
    return { data: result, requestId: request.id };
  });

  app.post('/api/v1/notifications/:id/read', async request => {
    const user = await requireUser(context.prisma, request);
    const id = String((request.params as { id: string }).id);
    const updated = await context.prisma.notification.updateMany({ where: { id, playerId: user.player.id }, data: { readAt: new Date() } });
    return { data: { read: updated.count === 1 }, requestId: request.id };
  });

  app.post('/api/v1/notifications/read-all', async request => {
    const user = await requireUser(context.prisma, request);
    const updated = await context.prisma.notification.updateMany({ where: { playerId: user.player.id, readAt: null }, data: { readAt: new Date() } });
    return { data: { count: updated.count }, requestId: request.id };
  });
}

function itemsBySlugFallback(slug: string) {
  return slug.replaceAll('-', ' ');
}
