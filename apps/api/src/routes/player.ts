import type { FastifyInstance } from 'fastify';
import type { Prisma } from '@prisma/client';
import { z } from 'zod';
import { GameRuleError } from '@neon-wreckers/game-engine';
import { careerRules, craftingRules, items, itemsBySlug, marketplaceRules, modulesBySlug, progressionRules, quartersRules, shipRules } from '@neon-wreckers/content';
import type { ApiContext } from '../types.js';
import { requireUser } from '../services/auth.js';
import { stationDto } from '../services/station.js';
import { acquireTransactionLock } from '../lib/database.js';
import { enforceDurableCooldown, levelForXp } from '../services/actions.js';

const marketSchema = z.object({ slug: z.string().min(1), quantity: z.number().int().positive().default(1) });
const sellSchema = z.object({ itemSlug: z.string().min(1), quantity: z.number().int().positive() });
const quartersSchema = z.object({
  theme: z.enum(quartersRules.themes as [string, ...string[]]),
  objects: z.array(z.object({ key: z.enum(quartersRules.objects as [string, ...string[]]), x: z.number().int().min(0).lt(quartersRules.width), y: z.number().int().min(0).lt(quartersRules.height) })).max(30)
}).refine(body => new Set(body.objects.map(object => `${object.x}:${object.y}`)).size === body.objects.length, 'Quarters objects cannot overlap.');
const careerSchema = z.object({ career: z.enum(Object.keys(careerRules) as [string, ...string[]]) });
const auctionDurationSchema = z.union([z.literal(6), z.literal(12), z.literal(24), z.literal(48), z.literal(72)]);

function auctionCancellationFee(priceCredits: number) {
  return Math.min(250, Math.max(10, Math.ceil(priceCredits * 0.02)));
}

export async function registerPlayerRoutes(app: FastifyInstance, context: ApiContext) {
  app.get('/api/v1/items/catalog', async request => ({
    data: items.map(item => ({
      ...item,
      valueCredits: item.valueCredits || marketplaceRules.sellPrices[item.slug] || 0,
      vendorSellCredits: marketplaceRules.sellPrices[item.slug] ?? 0,
      sellable: marketplaceRules.sellPrices[item.slug] != null
    })),
    requestId: request.id
  }));

  app.get('/api/v1/crafting/recipes', async request => {
    await requireUser(context.prisma, request);
    const station = await stationDto(context.prisma);
    return { data: Object.entries(craftingRules).map(([slug, recipe]) => {
      const module = station.modules.find(candidate => candidate.slug === recipe.stationModule);
      const speedBonus = Math.min(0.4, Number(module?.effects.craftingSpeedBonus ?? 0));
      const inputValue = Object.entries(recipe.inputs).reduce((total, [itemSlug, quantity]) => total + itemsBySlug[itemSlug].valueCredits * quantity, 0);
      const outputValue = Object.entries(recipe.outputs).reduce((total, [itemSlug, quantity]) => total + itemsBySlug[itemSlug].valueCredits * quantity, 0);
      return { slug, ...recipe, baseDurationSeconds: recipe.durationSeconds, durationSeconds: Math.max(1, Math.ceil(recipe.durationSeconds * (1 - speedBonus))), inputValue, outputValue, valueAdded: outputValue - inputValue, efficiency: inputValue ? outputValue / inputValue : 0, unlocked: module?.state === 'active' };
    }), requestId: request.id };
  });

  app.post('/api/v1/crafting/craft', async request => {
    const user = await requireUser(context.prisma, request);
    const body = z.object({ recipeSlug: z.string().min(1), quantity: z.number().int().positive().max(10).default(1) }).parse(request.body);
    const recipe = craftingRules[body.recipeSlug];
    if (!recipe) throw new GameRuleError('RECIPE_NOT_FOUND', 'Unknown crafting recipe.');
    const station = await stationDto(context.prisma);
    const craftingModule = station.modules.find(module => module.slug === recipe.stationModule);
    if (craftingModule?.state !== 'active') throw new GameRuleError('CRAFTING_STATION_OFFLINE', `Requires the active ${recipe.stationModule.replaceAll('-', ' ')} module.`);
    const durationSeconds = Math.max(1, Math.ceil(recipe.durationSeconds * (1 - Math.min(0.4, Number(craftingModule.effects.craftingSpeedBonus ?? 0))))) * body.quantity;
    const result = await context.prisma.$transaction(async transaction => {
      const cooldownEndsAt = await enforceDurableCooldown(transaction, user.player.id, `craft:${body.recipeSlug}`, durationSeconds);
      await acquireTransactionLock(transaction, `player:${user.player.id}:crafting`);
      for (const [itemSlug, amount] of Object.entries(recipe.inputs)) {
        const required = amount * body.quantity;
        const removed = await transaction.inventoryStack.updateMany({ where: { playerId: user.player.id, itemSlug, quantity: { gte: required } }, data: { quantity: { decrement: required } } });
        if (!removed.count) throw new GameRuleError('NOT_ENOUGH_MATERIALS', `Requires ${required} × ${itemsBySlug[itemSlug].name}.`);
      }
      const job = await transaction.craftingJob.create({ data: { playerId: user.player.id, recipeSlug: body.recipeSlug, quantity: body.quantity, resolvesAt: cooldownEndsAt } });
      return { jobId: job.id, quantity: body.quantity, cooldownEndsAt: cooldownEndsAt.toISOString() };
    });
    await context.gameQueue.add('resolve-crafting', { craftingJobId: result.jobId }, { jobId: `craft-${result.jobId}`, delay: Math.max(0, Date.parse(result.cooldownEndsAt) - Date.now()), attempts: 5, backoff: { type: 'exponential', delay: 5_000 }, removeOnComplete: 100, removeOnFail: 500 });
    return { data: result, requestId: request.id };
  });

  app.get('/api/v1/marketplace/listings', async request => {
    await requireUser(context.prisma, request);
    const station = await stationDto(context.prisma);
    const market = station.modules.find((module: { slug: string; state: string }) => module.slug === 'marketplace');
    const unlocked = market?.state === 'active';
    return {
      data: {
        unlocked,
        ships: { purchases: shipRules.purchases, upgrades: shipRules.upgrades, skins: shipRules.skins, skinCooldownSeconds: shipRules.skinCooldownSeconds, repair: shipRules.repair, crewPerShip: shipRules.crewPerShip, renameCredits: shipRules.renameCredits },
        listings: unlocked
          ? [
              ...marketplaceRules.listings
            ]
          : []
      },
      requestId: request.id
    };
  });

  app.get('/api/v1/quarters', async request => {
    const user = await requireUser(context.prisma, request);
    return {
      data: { playerId: user.player.id, layout: await context.prisma.quartersLayout.upsert({ where: { playerId: user.player.id }, create: { playerId: user.player.id, theme: 'station-zero-default', objects: [{ key: 'bed', x: 1, y: 2 }] }, update: {} }).then(layout => ({ theme: layout.theme, objects: layout.objects })) },
      requestId: request.id
    };
  });

  app.get('/api/v1/auction/listings', async request => {
    const user = await requireUser(context.prisma, request);
    const listings = await context.prisma.auctionListing.findMany({
      where: { status: 'active', expiresAt: { gt: new Date() } },
      include: { seller: { include: { user: { select: { displayName: true } } } } },
      orderBy: { createdAt: 'desc' }, take: 100
    });
    return { data: listings.map(listing => ({ ...listing, sellerName: listing.seller.user.displayName, ownListing: listing.sellerId === user.player.id, cancellationFee: auctionCancellationFee(listing.priceCredits) })), requestId: request.id };
  });

  app.post('/api/v1/auction/list', async request => {
    const user = await requireUser(context.prisma, request);
    const body = z.object({ itemSlug: z.string().min(1), quantity: z.number().int().positive().max(999), priceCredits: z.number().int().positive().max(10_000_000), durationHours: auctionDurationSchema.default(48) }).parse(request.body);
    const item = itemsBySlug[body.itemSlug];
    if (!item || item.slug === 'credits') throw new GameRuleError('ITEM_NOT_LISTABLE', 'That item cannot be auctioned.');
    const listing = await context.prisma.$transaction(async transaction => {
      await acquireTransactionLock(transaction, `player:${user.player.id}:auction`);
      const removed = await transaction.inventoryStack.updateMany({ where: { playerId: user.player.id, itemSlug: body.itemSlug, quantity: { gte: body.quantity } }, data: { quantity: { decrement: body.quantity } } });
      if (!removed.count) throw new GameRuleError('NOT_ENOUGH_ITEMS', 'Not enough inventory to create this listing.');
      const created = await transaction.auctionListing.create({ data: { sellerId: user.player.id, itemSlug: item.slug, itemName: item.name, quantity: body.quantity, priceCredits: body.priceCredits, expiresAt: new Date(Date.now() + body.durationHours * 60 * 60_000) } });
      await transaction.notification.create({ data: { playerId: user.player.id, type: 'auction', title: 'Auction listed', body: `${body.quantity} × ${item.name} listed for ${body.priceCredits.toLocaleString()} credits for ${body.durationHours} hours.` } });
      return created;
    });
    return { data: listing, requestId: request.id };
  });

  app.post('/api/v1/auction/:id/buy', async request => {
    const user = await requireUser(context.prisma, request);
    const id = String((request.params as { id: string }).id);
    const result = await context.prisma.$transaction(async transaction => {
      await acquireTransactionLock(transaction, `auction:${id}`);
      const listing = await transaction.auctionListing.findUnique({ where: { id } });
      if (!listing || listing.status !== 'active' || listing.expiresAt <= new Date()) throw new GameRuleError('LISTING_UNAVAILABLE', 'This auction is no longer available.');
      if (listing.sellerId === user.player.id) throw new GameRuleError('OWN_LISTING', 'You cannot buy your own listing.');
      const charged = await transaction.player.updateMany({ where: { id: user.player.id, credits: { gte: listing.priceCredits } }, data: { credits: { decrement: listing.priceCredits } } });
      if (!charged.count) throw new GameRuleError('NOT_ENOUGH_CREDITS', 'Not enough credits for this auction.');
      await transaction.player.update({ where: { id: listing.sellerId }, data: { credits: { increment: listing.priceCredits } } });
      const item = itemsBySlug[listing.itemSlug];
      await transaction.inventoryStack.upsert({ where: { playerId_itemSlug: { playerId: user.player.id, itemSlug: listing.itemSlug } }, update: { quantity: { increment: listing.quantity } }, create: { playerId: user.player.id, itemSlug: listing.itemSlug, name: listing.itemName, quantity: listing.quantity, rarity: item.rarity, visualKey: item.visualKey } });
      await transaction.auctionListing.update({ where: { id }, data: { status: 'sold', buyerId: user.player.id, soldAt: new Date() } });
      await transaction.notification.createMany({ data: [
        { playerId: user.player.id, type: 'reward', title: 'Auction purchase received', body: `Received ${listing.quantity} × ${listing.itemName} for ${listing.priceCredits.toLocaleString()} credits.` },
        { playerId: listing.sellerId, type: 'reward', title: 'Auction sold', body: `${listing.quantity} × ${listing.itemName} sold. You received ${listing.priceCredits.toLocaleString()} credits.` }
      ] });
      return { received: { itemSlug: listing.itemSlug, name: listing.itemName, quantity: listing.quantity }, creditsSpent: listing.priceCredits };
    });
    return { data: result, requestId: request.id };
  });

  app.post('/api/v1/auction/:id/cancel', async request => {
    const user = await requireUser(context.prisma, request);
    const id = String((request.params as { id: string }).id);
    const result = await context.prisma.$transaction(async transaction => {
      await acquireTransactionLock(transaction, `auction:${id}`);
      const listing = await transaction.auctionListing.findUnique({ where: { id } });
      if (!listing || listing.status !== 'active') throw new GameRuleError('LISTING_UNAVAILABLE', 'This auction is no longer active.');
      if (listing.sellerId !== user.player.id) throw new GameRuleError('NOT_LISTING_OWNER', 'Only the seller may cancel this auction.');
      const item = itemsBySlug[listing.itemSlug];
      const current = await transaction.inventoryStack.findUnique({ where: { playerId_itemSlug: { playerId: user.player.id, itemSlug: listing.itemSlug } } });
      if ((current?.quantity ?? 0) + listing.quantity > item.stackLimit) throw new GameRuleError('STACK_LIMIT', `Make room in your ${listing.itemName} stack before cancelling.`);
      const cancellationFee = auctionCancellationFee(listing.priceCredits);
      const charged = await transaction.player.updateMany({ where: { id: user.player.id, credits: { gte: cancellationFee } }, data: { credits: { decrement: cancellationFee } } });
      if (!charged.count) throw new GameRuleError('NOT_ENOUGH_CREDITS', `Cancelling this auction costs ${cancellationFee} credits.`);
      await transaction.auctionListing.update({ where: { id }, data: { status: 'cancelled' } });
      await transaction.inventoryStack.upsert({ where: { playerId_itemSlug: { playerId: user.player.id, itemSlug: listing.itemSlug } }, update: { quantity: { increment: listing.quantity } }, create: { playerId: user.player.id, itemSlug: listing.itemSlug, name: listing.itemName, quantity: listing.quantity, rarity: item.rarity, visualKey: item.visualKey } });
      await transaction.notification.create({ data: { playerId: user.player.id, type: 'auction', title: 'Auction cancelled', body: `${listing.quantity} × ${listing.itemName} returned to your hold. Cancellation fee: ${cancellationFee} credits.` } });
      return { cancelled: true, returned: { itemSlug: listing.itemSlug, name: listing.itemName, quantity: listing.quantity }, cancellationFee };
    });
    return { data: result, requestId: request.id };
  });

  app.post('/api/v1/quarters', async request => {
    const user = await requireUser(context.prisma, request);
    const body = quartersSchema.parse(request.body);
    const station = await stationDto(context.prisma);
    if (station.modules.find(module => module.slug === 'habitat-ring')?.state !== 'active') throw new GameRuleError('QUARTERS_LOCKED', 'Complete the Habitat Ring to customize quarters.');
    const layout = await context.prisma.quartersLayout.upsert({ where: { playerId: user.player.id }, create: { playerId: user.player.id, theme: body.theme, objects: body.objects }, update: { theme: body.theme, objects: body.objects } });
    return { data: { playerId: user.player.id, layout: { theme: layout.theme, objects: layout.objects } }, requestId: request.id };
  });

  app.post('/api/v1/marketplace/buy', async request => {
    const user = await requireUser(context.prisma, request);
    const body = marketSchema.parse(request.body);
    const listing = marketplaceRules.listings.find((candidate: { slug: string; name: string; priceCredits: number; itemSlug: string; quantity: number }) => candidate.slug === body.slug);
    if (!listing) throw new GameRuleError('LISTING_NOT_FOUND', 'Marketplace listing not found.');
    const station = await stationDto(context.prisma);
    if (station.modules.find(module => module.slug === 'marketplace')?.state !== 'active') throw new GameRuleError('MARKET_LOCKED', 'The Marketplace module is offline.');
    const totalCredits = listing.priceCredits * body.quantity;
    const item = itemsBySlug[listing.itemSlug];
    const result = await context.prisma.$transaction(async (transaction: Prisma.TransactionClient) => {
      await acquireTransactionLock(transaction, `player:${user.player.id}:market`);
      const charged = await transaction.player.updateMany({ where: { id: user.player.id, credits: { gte: totalCredits } }, data: { credits: { decrement: totalCredits } } });
      if (!charged.count) throw new GameRuleError('NOT_ENOUGH_CREDITS', 'Not enough credits for this purchase.');
      const quantity = listing.quantity * body.quantity;
      const current = await transaction.inventoryStack.findUnique({ where: { playerId_itemSlug: { playerId: user.player.id, itemSlug: item.slug } } });
      if (!current && await transaction.inventoryStack.count({ where: { playerId: user.player.id } }) >= user.player.inventoryCapacity) throw new GameRuleError('INVENTORY_FULL', 'Inventory capacity reached.');
      if ((current?.quantity ?? 0) + quantity > item.stackLimit) throw new GameRuleError('STACK_LIMIT', `${item.name} stack limit reached.`);
      const inventory = await transaction.inventoryStack.upsert({ where: { playerId_itemSlug: { playerId: user.player.id, itemSlug: item.slug } }, update: { quantity: { increment: quantity } }, create: { playerId: user.player.id, itemSlug: item.slug, name: item.name, quantity, rarity: item.rarity, visualKey: item.visualKey } });
      await transaction.marketTransaction.create({ data: { playerId: user.player.id, direction: 'buy', itemSlug: item.slug, quantity, credits: totalCredits } });
      return { inventory, creditsSpent: totalCredits };
    });
    return { data: result, requestId: request.id };
  });

  app.post('/api/v1/marketplace/sell', async request => {
    const user = await requireUser(context.prisma, request);
    const body = sellSchema.parse(request.body);
    const unit = marketplaceRules.sellPrices[body.itemSlug];
    if (unit == null) throw new GameRuleError('ITEM_NOT_SELLABLE', 'This item cannot be sold.');
    const station = await stationDto(context.prisma);
    if (station.modules.find(module => module.slug === 'marketplace')?.state !== 'active') throw new GameRuleError('MARKET_LOCKED', 'The Marketplace module is offline.');
    const careerMultiplier = Number(careerRules[user.player.career]?.marketSpreadMultiplier ?? 1);
    const marketBonus = Number(station.modules.find(module => module.slug === 'marketplace')?.effects.marketSellBonus ?? 0);
    const credits = Math.floor(unit * body.quantity / careerMultiplier * (1 + marketBonus));
    await context.prisma.$transaction(async (transaction: Prisma.TransactionClient) => {
      await acquireTransactionLock(transaction, `player:${user.player.id}:market`);
      const removed = await transaction.inventoryStack.updateMany({ where: { playerId: user.player.id, itemSlug: body.itemSlug, quantity: { gte: body.quantity } }, data: { quantity: { decrement: body.quantity } } });
      if (!removed.count) throw new GameRuleError('NOT_ENOUGH_ITEMS', 'Not enough inventory to complete the sale.');
      await transaction.player.update({ where: { id: user.player.id }, data: { credits: { increment: credits } } });
      await transaction.marketTransaction.create({ data: { playerId: user.player.id, direction: 'sell', itemSlug: body.itemSlug, quantity: body.quantity, credits } });
    });
    return { data: { sold: true, credits }, requestId: request.id };
  });

  app.post('/api/v1/museum/donate', async request => {
    const user = await requireUser(context.prisma, request);
    const body = z.object({ itemSlug: z.string().min(1), quantity: z.number().int().positive().max(10).default(1) }).parse(request.body);
    const item = itemsBySlug[body.itemSlug];
    if (!item?.tags.includes('museum')) throw new GameRuleError('ITEM_NOT_EXHIBITABLE', 'Only museum artifacts can be donated.');
    const station = await context.prisma.station.findUniqueOrThrow({ where: { slug: 'station-zero' } });
    const museum = await context.prisma.stationModule.findUnique({ where: { stationId_slug: { stationId: station.id, slug: 'museum' } } });
    if (museum?.state !== 'active') throw new GameRuleError('MUSEUM_LOCKED', 'Complete the Museum before donating artifacts.');
    const baseReward = body.itemSlug === 'quantum-key'
      ? { credits: 1500, xp: 100, reputation: 5, morale: 2 }
      : { credits: 450, xp: 25, reputation: 1, morale: 1 };
    const rewardMultiplier = 1 + Number(modulesBySlug.museum.effects.donationRewardBonus ?? 0) * museum.level;
    const reward = {
      credits: Math.floor(baseReward.credits * body.quantity * rewardMultiplier),
      xp: Math.floor(baseReward.xp * body.quantity * rewardMultiplier),
      reputation: baseReward.reputation * body.quantity,
      morale: baseReward.morale * body.quantity
    };
    const dayStart = new Date();
    dayStart.setUTCHours(0, 0, 0, 0);
    const result = await context.prisma.$transaction(async (transaction: Prisma.TransactionClient) => {
      await acquireTransactionLock(transaction, 'station-zero:museum-intake');
      const donatedToday = (await transaction.museumExhibit.aggregate({ where: { donatedAt: { gte: dayStart } }, _sum: { quantity: true } }))._sum.quantity ?? 0;
      const dailyCapacity = Number(modulesBySlug.museum.effects.artifactDailyIntake ?? 0) * museum.level;
      if (donatedToday + body.quantity > dailyCapacity) throw new GameRuleError('MUSEUM_INTAKE_FULL', `The museum can process ${Math.max(0, dailyCapacity - donatedToday)} more artifacts today.`);
      const removed = await transaction.inventoryStack.updateMany({ where: { playerId: user.player.id, itemSlug: body.itemSlug, quantity: { gte: body.quantity } }, data: { quantity: { decrement: body.quantity } } });
      if (!removed.count) throw new GameRuleError('ITEM_NOT_OWNED', 'You do not own this artifact.');
      const currentPlayer = await transaction.player.findUniqueOrThrow({ where: { id: user.player.id } });
      await transaction.player.update({ where: { id: user.player.id }, data: { credits: { increment: reward.credits }, xp: { increment: reward.xp }, level: levelForXp(currentPlayer.xp + reward.xp, progressionRules.levelXp), reputation: { increment: reward.reputation } } });
      await transaction.station.update({ where: { id: station.id }, data: { morale: Math.min(100, station.morale + reward.morale) } });
      const exhibit = await transaction.museumExhibit.create({ data: { playerId: user.player.id, itemSlug: item.slug, name: item.name, quantity: body.quantity } });
      if (body.itemSlug === 'quantum-key') await transaction.plaque.create({ data: { moduleId: museum.id, title: `${item.name} archived`, body: `${user.displayName} surrendered ${body.quantity} legendary key${body.quantity === 1 ? '' : 's'} for public study.`, playerName: user.displayName } });
      const history = await transaction.historyEntry.create({ data: { stationId: station.id, playerId: user.player.id, category: 'museum', title: 'Museum collection expanded', body: `${user.displayName} donated ${body.quantity} × ${item.name} and earned ${reward.credits.toLocaleString()} credits.`, actorDisplayName: user.displayName } });
      return { exhibit, history, reward, donatedToday: donatedToday + body.quantity, dailyCapacity };
    });
    context.realtime.broadcast({ type: 'history.added', entry: result.history });
    context.realtime.broadcast({ type: 'station.updated', station: await stationDto(context.prisma) });
    return { data: result, requestId: request.id };
  });

  app.post('/api/v1/player/career', async request => {
    const user = await requireUser(context.prisma, request);
    const body = careerSchema.parse(request.body);
    const player = await context.prisma.$transaction(async (transaction: Prisma.TransactionClient) => {
      const current = await transaction.player.findUniqueOrThrow({ where: { id: user.player.id } });
      if (current.careerChosenAt) {
        await enforceDurableCooldown(transaction, current.id, 'career-change', progressionRules.careerChangeCooldownSeconds);
        const charged = await transaction.player.updateMany({ where: { id: current.id, credits: { gte: progressionRules.careerChangeCredits } }, data: { credits: { decrement: progressionRules.careerChangeCredits } } });
        if (!charged.count) throw new GameRuleError('NOT_ENOUGH_CREDITS', 'Not enough credits to retrain careers.');
      }
      return transaction.player.update({ where: { id: current.id }, data: { career: body.career as never, careerChosenAt: current.careerChosenAt ?? new Date(), careerChangedAt: current.careerChosenAt ? new Date() : null } });
    });
    return { data: player, requestId: request.id };
  });
}
