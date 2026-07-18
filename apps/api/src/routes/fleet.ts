import type { FastifyInstance } from 'fastify';
import type { Prisma } from '@prisma/client';
import { z } from 'zod';
import { GameRuleError } from '@neon-wreckers/game-engine';
import { careerRules, crewRules, shipRules } from '@neon-wreckers/content';
import type { ApiContext } from '../types.js';
import { acquireTransactionLock } from '../lib/database.js';
import { requireUser } from '../services/auth.js';
import { stationDto } from '../services/station.js';
import { enforceDurableCooldown } from '../services/actions.js';

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

  app.post('/api/v1/ships/:id/rename', async request => {
    const user = await requireUser(context.prisma, request);
    const { id } = idSchema.parse(request.params);
    const { name } = z.object({ name: z.string().trim().min(2).max(40) }).parse(request.body);
    const result = await context.prisma.$transaction(async (transaction: Prisma.TransactionClient) => {
      await acquireTransactionLock(transaction, `player:${user.player.id}:fleet`);
      const target = await transaction.ship.findFirstOrThrow({ where: { id, playerId: user.player.id } });
      if (await transaction.expedition.findFirst({ where: { shipId: id, status: 'active' } })) throw new GameRuleError('SHIP_BUSY', 'Wait for this ship to return before renaming it.');
      if (target.name === name) throw new GameRuleError('SHIP_NAME_UNCHANGED', 'Choose a different ship name.');
      const charged = await transaction.player.updateMany({ where: { id: user.player.id, credits: { gte: shipRules.renameCredits } }, data: { credits: { decrement: shipRules.renameCredits } } });
      if (!charged.count) throw new GameRuleError('NOT_ENOUGH_CREDITS', `Renaming a ship costs ${shipRules.renameCredits} credits.`);
      const ship = await transaction.ship.update({ where: { id }, data: { name } });
      const station = await transaction.station.findUniqueOrThrow({ where: { slug: 'station-zero' } });
      const history = await transaction.historyEntry.create({ data: { stationId: station.id, playerId: user.player.id, category: 'fleet', title: 'Ship renamed', body: `${user.displayName} renamed ${target.name} to ${name} for ${shipRules.renameCredits.toLocaleString()} credits.`, actorDisplayName: user.displayName, details: { operation: 'ship-rename', shipId: id, oldName: target.name, newName: name, credits: shipRules.renameCredits } } });
      return { ship, history, creditsSpent: shipRules.renameCredits };
    });
    context.realtime.broadcast({ type: 'history.added', entry: result.history });
    return { data: result, requestId: request.id };
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

  app.post('/api/v1/ships/:id/skin', async request => {
    const user = await requireUser(context.prisma, request);
    const { id } = idSchema.parse(request.params);
    const { skinSlug } = z.object({ skinSlug: z.string().min(1) }).parse(request.body);
    const skin = shipRules.skins.find((candidate: { slug: string; classSlug: string; name: string; credits: number; cargoBonus?: number }) => candidate.slug === skinSlug);
    if (!skin) throw new GameRuleError('SKIN_NOT_FOUND', 'That ship skin is not available.');
    const result = await context.prisma.$transaction(async (transaction: Prisma.TransactionClient) => {
      await acquireTransactionLock(transaction, `player:${user.player.id}:fleet`);
      const target = await transaction.ship.findFirstOrThrow({ where: { id, playerId: user.player.id } });
      if (target.classSlug !== skin.classSlug) throw new GameRuleError('SKIN_CLASS_MISMATCH', 'That skin does not fit this ship class.');
      if (target.activeSkin === skin.slug) throw new GameRuleError('SKIN_ACTIVE', 'That skin is already active.');
      if (await transaction.expedition.findFirst({ where: { shipId: id, status: 'active' } })) throw new GameRuleError('SHIP_BUSY', 'Wait for this ship to return before changing its frame.');
      await enforceDurableCooldown(transaction, user.player.id, `ship-skin:${id}`, shipRules.skinCooldownSeconds);
      const owned = target.ownedSkins.includes(skin.slug);
      if (!owned) {
        const charged = await transaction.player.updateMany({ where: { id: user.player.id, credits: { gte: skin.credits } }, data: { credits: { decrement: skin.credits } } });
        if (!charged.count) throw new GameRuleError('NOT_ENOUGH_CREDITS', `This premium skin license costs ${skin.credits.toLocaleString()} credits.`);
      }
      const previous = shipRules.skins.find((candidate: { slug: string; cargoBonus?: number }) => candidate.slug === target.activeSkin);
      const ship = await transaction.ship.update({ where: { id }, data: { activeSkin: skin.slug, ...(!owned ? { ownedSkins: { push: skin.slug } } : {}), visualKey: `ship-${skin.slug}`, cargoCapacity: Math.max(1, target.cargoCapacity - Number(previous?.cargoBonus ?? 0) + Number(skin.cargoBonus ?? 0)) } });
      const station = await transaction.station.findUniqueOrThrow({ where: { slug: 'station-zero' } });
      const history = await transaction.historyEntry.create({ data: { stationId: station.id, playerId: user.player.id, category: 'fleet', title: owned ? 'Ship skin equipped' : 'Premium ship skin licensed', body: `${user.displayName} ${owned ? 'equipped' : `licensed for ${skin.credits.toLocaleString()} credits and equipped`} the ${skin.name} frame on ${target.name}. The 30-day refit cooldown is now active.`, actorDisplayName: user.displayName, details: { operation: owned ? 'ship-skin-equip' : 'ship-skin-purchase', shipId: id, shipName: target.name, skinSlug: skin.slug, skinName: skin.name, credits: owned ? 0 : skin.credits, cooldownSeconds: shipRules.skinCooldownSeconds } } });
      return { ship, history, purchased: !owned };
    });
    context.realtime.broadcast({ type: 'history.added', entry: result.history });
    return { data: result, requestId: request.id };
  });

  app.post('/api/v1/ships/:id/repair', async request => {
    const user = await requireUser(context.prisma, request);
    const { id } = idSchema.parse(request.params);
    const amount = z.object({ amount: z.number().int().positive().max(100) }).parse(request.body).amount;
    const station = await stationDto(context.prisma);
    const shipyard = station.modules.find(module => module.slug === 'shipyard');
    const shipyardMultiplier = shipyard?.state === 'active' ? 1 - Number(shipyard.effects.shipRepairDiscount ?? 0) : 1;
    const ship = await context.prisma.$transaction(async (transaction: Prisma.TransactionClient) => {
      await acquireTransactionLock(transaction, `player:${user.player.id}:fleet`);
      const target = await transaction.ship.findFirstOrThrow({ where: { id, playerId: user.player.id } });
      if (await transaction.expedition.findFirst({ where: { shipId: id, status: 'active' } })) throw new GameRuleError('SHIP_BUSY', 'This ship is away on expedition.');
      const hullUpgrade = shipRules.upgrades.find((candidate: { slug: string; repairDiscount?: number }) => candidate.slug === 'reinforced-hull');
      const upgradeMultiplier = target.upgrades.includes('reinforced-hull') ? 1 - Number(hullUpgrade?.repairDiscount ?? 0) : 1;
      const skin = shipRules.skins.find((candidate: { slug: string; repairDiscount?: number }) => candidate.slug === target.activeSkin);
      const skinMultiplier = 1 - Number(skin?.repairDiscount ?? 0);
      const multiplier = Number(careerRules[user.player.career]?.repairCostMultiplier ?? 1) * shipyardMultiplier * upgradeMultiplier * skinMultiplier;
      const credits = Math.ceil(amount * shipRules.repair.creditsPerCondition * multiplier);
      const alloys = Math.ceil(amount / 20) * shipRules.repair.alloysPerTwentyCondition;
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
    const { focus } = z.object({ focus: z.enum(['job', 'talent']) }).parse(request.body);
    const crew = await context.prisma.$transaction(async (transaction: Prisma.TransactionClient) => {
      const member = await transaction.crewMember.findFirstOrThrow({ where: { id, playerId: user.player.id } });
      if (await transaction.expedition.findFirst({ where: { crewIds: { has: id }, status: 'active' } })) throw new GameRuleError('CREW_BUSY', 'Crew cannot train while deployed.');
      if ((focus === 'job' ? member.jobStars : member.talentStars) >= 5) throw new GameRuleError('TRAINING_MAXED', `${focus === 'job' ? 'Job' : 'Talent'} training is already five stars.`);
      const credits = member.level * crewRules.trainCreditsPerLevel;
      const charged = await transaction.player.updateMany({ where: { id: user.player.id, credits: { gte: credits } }, data: { credits: { decrement: credits } } });
      if (!charged.count) throw new GameRuleError('NOT_ENOUGH_CREDITS', 'Not enough credits for training.');
      return transaction.crewMember.update({ where: { id }, data: { level: { increment: 1 }, ...(focus === 'job' ? { jobStars: { increment: 1 } } : { talentStars: { increment: 1 } }), morale: Math.min(100, member.morale + 5) } });
    });
    return { data: crew, requestId: request.id };
  });
}
