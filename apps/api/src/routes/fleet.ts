import type { FastifyInstance } from 'fastify';
import type { Prisma } from '@prisma/client';
import { z } from 'zod';
import { GameRuleError } from '@neon-wreckers/game-engine';
import { careerRules, crewRules, shipRules } from '@neon-wreckers/content';
import type { ApiContext } from '../types.js';
import { acquireTransactionLock } from '../lib/database.js';
import { requireUser } from '../services/auth.js';
import { stationDto } from '../services/station.js';

const idSchema = z.object({ id: z.string().min(1) });

export async function registerFleetRoutes(app: FastifyInstance, context: ApiContext) {
  app.post('/api/v1/ships/purchase', async request => {
    const user = await requireUser(context.prisma, request);
    const body = z.object({ classSlug: z.string().min(1), name: z.string().trim().min(2).max(40).optional() }).parse(request.body);
    const definition = shipRules.purchases.find((candidate: { slug: string; name: string; credits: number; cargoCapacity: number; fuel: number; visualKey: string }) => candidate.slug === body.classSlug);
    if (!definition) throw new GameRuleError('SHIP_CLASS_NOT_FOUND', 'That ship class is not available.');
    const ship = await context.prisma.$transaction(async (transaction: Prisma.TransactionClient) => {
      await acquireTransactionLock(transaction, `player:${user.player.id}:fleet`);
      const station = await transaction.station.findUniqueOrThrow({ where: { slug: 'station-zero' } });
      const modules = await transaction.stationModule.findMany({ where: { stationId: station.id, slug: { in: ['marketplace', 'shipyard'] } } });
      if (modules.find(module => module.slug === 'marketplace')?.state !== 'active') throw new GameRuleError('MARKET_LOCKED', 'Repair the Marketplace before purchasing ships.');
      if (modules.find(module => module.slug === 'shipyard')?.state !== 'active') throw new GameRuleError('SHIPYARD_LOCKED', 'Complete the Shipyard before purchasing ships.');
      const [crewCount, shipCount] = await Promise.all([
        transaction.crewMember.count({ where: { playerId: user.player.id } }),
        transaction.ship.count({ where: { playerId: user.player.id } })
      ]);
      const fleetCapacity = Math.max(1, Math.floor(crewCount / shipRules.crewPerShip));
      if (shipCount >= fleetCapacity) throw new GameRuleError('FLEET_CREW_REQUIRED', `Recruit more crew. Each ship requires ${shipRules.crewPerShip} crew on the roster.`);
      const charged = await transaction.player.updateMany({ where: { id: user.player.id, credits: { gte: definition.credits } }, data: { credits: { decrement: definition.credits } } });
      if (!charged.count) throw new GameRuleError('NOT_ENOUGH_CREDITS', 'Not enough credits to purchase this ship.');
      return transaction.ship.create({ data: { playerId: user.player.id, name: body.name ?? `${definition.name} ${shipCount + 1}`, classSlug: definition.slug, condition: 100, fuel: definition.fuel, cargoCapacity: definition.cargoCapacity, upgrades: [], visualKey: definition.visualKey } });
    });
    return { data: ship, requestId: request.id };
  });

  app.post('/api/v1/ships/:id/refuel', async request => {
    const user = await requireUser(context.prisma, request);
    const { id } = idSchema.parse(request.params);
    const cells = z.object({ cells: z.number().int().positive().max(100) }).parse(request.body).cells;
    const ship = await context.prisma.$transaction(async (transaction: Prisma.TransactionClient) => {
      await acquireTransactionLock(transaction, `player:${user.player.id}:fleet`);
      const target = await transaction.ship.findFirstOrThrow({ where: { id, playerId: user.player.id } });
      const removed = await transaction.inventoryStack.updateMany({ where: { playerId: user.player.id, itemSlug: 'fuel', quantity: { gte: cells } }, data: { quantity: { decrement: cells } } });
      if (!removed.count) throw new GameRuleError('NO_FUEL', 'Not enough fuel cells in your hold.');
      return transaction.ship.update({ where: { id: target.id }, data: { fuel: { increment: cells * shipRules.refuel.fuelPerCell } } });
    });
    return { data: ship, requestId: request.id };
  });

  app.post('/api/v1/ships/:id/repair', async request => {
    const user = await requireUser(context.prisma, request);
    const { id } = idSchema.parse(request.params);
    const amount = z.object({ amount: z.number().int().positive().max(100) }).parse(request.body).amount;
    const station = await stationDto(context.prisma);
    const shipyard = station.modules.find(module => module.slug === 'shipyard');
    const shipyardMultiplier = shipyard?.state === 'active' ? 1 - Number(shipyard.effects.shipRepairDiscount ?? 0) : 1;
    const multiplier = Number(careerRules[user.player.career]?.repairCostMultiplier ?? 1) * shipyardMultiplier;
    const credits = Math.ceil(amount * shipRules.repair.creditsPerCondition * multiplier);
    const alloys = Math.ceil(amount / 20) * shipRules.repair.alloysPerTwentyCondition;
    const ship = await context.prisma.$transaction(async (transaction: Prisma.TransactionClient) => {
      await acquireTransactionLock(transaction, `player:${user.player.id}:fleet`);
      const target = await transaction.ship.findFirstOrThrow({ where: { id, playerId: user.player.id } });
      if (await transaction.expedition.findFirst({ where: { shipId: id, status: 'active' } })) throw new GameRuleError('SHIP_BUSY', 'This ship is away on expedition.');
      const charged = await transaction.player.updateMany({ where: { id: user.player.id, credits: { gte: credits } }, data: { credits: { decrement: credits } } });
      if (!charged.count) throw new GameRuleError('NOT_ENOUGH_CREDITS', 'Not enough credits for repairs.');
      if (alloys) {
        const removed = await transaction.inventoryStack.updateMany({ where: { playerId: user.player.id, itemSlug: 'alloys', quantity: { gte: alloys } }, data: { quantity: { decrement: alloys } } });
        if (!removed.count) throw new GameRuleError('NOT_ENOUGH_MATERIALS', 'Not enough alloys for repairs.');
      }
      return transaction.ship.update({ where: { id }, data: { condition: Math.min(100, target.condition + amount) } });
    });
    return { data: ship, requestId: request.id };
  });

  app.post('/api/v1/ships/:id/upgrade', async request => {
    const user = await requireUser(context.prisma, request);
    const { id } = idSchema.parse(request.params);
    const slug = z.object({ slug: z.string().min(1) }).parse(request.body).slug;
    const definition = shipRules.upgrades.find((candidate: { slug: string }) => candidate.slug === slug);
    if (!definition) throw new GameRuleError('UPGRADE_NOT_FOUND', 'Unknown ship upgrade.');
    const ship = await context.prisma.$transaction(async (transaction: Prisma.TransactionClient) => {
      await acquireTransactionLock(transaction, `player:${user.player.id}:fleet`);
      const target = await transaction.ship.findFirstOrThrow({ where: { id, playerId: user.player.id } });
      if (target.upgrades.includes(slug)) throw new GameRuleError('UPGRADE_OWNED', 'This upgrade is already installed.');
      const charged = await transaction.player.updateMany({ where: { id: user.player.id, credits: { gte: definition.credits } }, data: { credits: { decrement: definition.credits } } });
      if (!charged.count) throw new GameRuleError('NOT_ENOUGH_CREDITS', 'Not enough credits for this upgrade.');
      for (const [itemSlug, amount] of [['alloys', definition.alloys ?? 0], ['electronics', definition.electronics ?? 0]] as const) {
        if (amount > 0) {
          const removed = await transaction.inventoryStack.updateMany({ where: { playerId: user.player.id, itemSlug, quantity: { gte: amount } }, data: { quantity: { decrement: amount } } });
          if (!removed.count) throw new GameRuleError('NOT_ENOUGH_MATERIALS', `Not enough ${itemSlug} for this upgrade.`);
        }
      }
      return transaction.ship.update({ where: { id }, data: { upgrades: { push: slug }, condition: Math.min(100, target.condition + (definition.conditionBonus ?? 0)), cargoCapacity: target.cargoCapacity + (definition.cargoBonus ?? 0) } });
    });
    return { data: ship, requestId: request.id };
  });

  app.post('/api/v1/crew/recruit', async request => {
    const user = await requireUser(context.prisma, request);
    const body = z.object({ name: z.string().trim().min(2).max(40), role: z.enum(['pilot', 'engineer', 'medic', 'scout', 'quartermaster']) }).parse(request.body);
    const crew = await context.prisma.$transaction(async (transaction: Prisma.TransactionClient) => {
      await acquireTransactionLock(transaction, `player:${user.player.id}:crew`);
      if (await transaction.crewMember.count({ where: { playerId: user.player.id } }) >= crewRules.maxRoster) throw new GameRuleError('CREW_FULL', 'Your crew roster is full.');
      const charged = await transaction.player.updateMany({ where: { id: user.player.id, credits: { gte: crewRules.recruitCredits } }, data: { credits: { decrement: crewRules.recruitCredits } } });
      if (!charged.count) throw new GameRuleError('NOT_ENOUGH_CREDITS', 'Not enough credits to recruit crew.');
      return transaction.crewMember.create({ data: { playerId: user.player.id, name: body.name, role: body.role, traits: [] } });
    });
    return { data: crew, requestId: request.id };
  });

  app.post('/api/v1/crew/:id/train', async request => {
    const user = await requireUser(context.prisma, request);
    const { id } = idSchema.parse(request.params);
    const crew = await context.prisma.$transaction(async (transaction: Prisma.TransactionClient) => {
      const member = await transaction.crewMember.findFirstOrThrow({ where: { id, playerId: user.player.id } });
      const credits = member.level * crewRules.trainCreditsPerLevel;
      const charged = await transaction.player.updateMany({ where: { id: user.player.id, credits: { gte: credits } }, data: { credits: { decrement: credits } } });
      if (!charged.count) throw new GameRuleError('NOT_ENOUGH_CREDITS', 'Not enough credits for training.');
      return transaction.crewMember.update({ where: { id }, data: { level: { increment: 1 }, morale: Math.min(100, member.morale + 5) } });
    });
    return { data: crew, requestId: request.id };
  });
}
