import type { FastifyInstance } from 'fastify';
import type { Prisma } from '@prisma/client';
import { z } from 'zod';
import { GameRuleError } from '@neon-wreckers/game-engine';
import { progressionRules } from '@neon-wreckers/content';
import type { ApiContext } from '../types.js';
import { acquireTransactionLock } from '../lib/database.js';
import { requireUser } from '../services/auth.js';
import { enforceDurableCooldown, levelForXp } from '../services/actions.js';
import { stationDto } from '../services/station.js';

const contracts = [
  { slug: 'salvage-shift', name: 'Salvage Shift', description: 'Complete 8 salvage deployments today.', target: 8, metric: 'salvage', credits: 600, xp: 250 },
  { slug: 'fleet-returns', name: 'Fleet Returns', description: 'Claim 2 expedition returns today.', target: 2, metric: 'expedition', credits: 900, xp: 350 },
  { slug: 'fabricator-duty', name: 'Fabricator Duty', description: 'Start 5 fabrication jobs today.', target: 5, metric: 'crafting', credits: 500, xp: 300 }
] as const;

const prestigeTiers = [
  { name: 'Outpost', population: 0, bonus: 'Standard station services' },
  { name: 'Settlement', population: 100, bonus: '+5% contract token yield' },
  { name: 'Colony', population: 300, bonus: '+10% community event rewards' },
  { name: 'Trade Hub', population: 700, bonus: 'Expanded seasonal storefront' },
  { name: 'Sector Capital', population: 1_200, bonus: 'Capital display collection' }
] as const;

const communityVotes = [{
  slug: 'frontier-doctrine',
  name: 'Frontier Doctrine',
  description: 'Choose Station Zero’s operating doctrine for the next weekly cycle.',
  options: [
    { slug: 'salvage-yield', name: 'Recovery Surge', bonus: '+10% salvage contract rewards' },
    { slug: 'fleet-readiness', name: 'Fleet Readiness', bonus: 'Reduced expedition fatigue pressure' },
    { slug: 'trade-dividend', name: 'Trade Dividend', bonus: '+10% station sale value' }
  ]
}] as const;

const seasonalStore = [
  { slug: 'neon-pennant', name: 'Neon Wreckers Pennant', description: 'A durable quarters display from the current circuit.', tokens: 8, minPrestige: 0 },
  { slug: 'convoy-holomap', name: 'Convoy Holomap', description: 'Animated route-table cosmetic for veteran haulers.', tokens: 14, minPrestige: 2 },
  { slug: 'capital-command-plaque', name: 'Capital Command Plaque', description: 'A permanent Sector Capital collection piece.', tokens: 24, minPrestige: 4 }
] as const;

const operations = [
  {
    slug: 'deep-range-array',
    name: 'Deep-Range Array Calibration',
    description: 'Synchronize every scanner mast and expose higher-value wreck lanes for the whole station.',
    moduleSlug: 'command-pod',
    requirements: { scrap: 1200, electronics: 240, alloys: 160, researchData: 90 },
    reward: 'Station morale and power restored · final delivery awards 1,000 credits and 500 XP'
  },
  {
    slug: 'trade-convoy',
    name: 'Outer-Rim Trade Convoy',
    description: 'Provision a protected convoy that keeps Station Zero visible on independent trade routes.',
    moduleSlug: 'marketplace',
    requirements: { scrap: 900, electronics: 180, alloys: 220, researchData: 60 },
    reward: 'Station morale and population increase · final delivery awards 1,000 credits and 500 XP'
  },
  {
    slug: 'habitat-festival',
    name: 'Habitat Ring Festival',
    description: 'Turn recovered material into lighting, stages, food systems, and a reason to stay aboard.',
    moduleSlug: 'habitat-ring',
    requirements: { scrap: 700, electronics: 140, alloys: 120, researchData: 120 },
    reward: 'Station morale and population increase · final delivery awards 1,000 credits and 500 XP'
  }
] as const;

const contractRotationSchema = z.object({ entries: z.array(z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1).max(80),
  description: z.string().min(1).max(240),
  target: z.number().int().min(1).max(100),
  metric: z.enum(['salvage', 'expedition', 'crafting']),
  credits: z.number().int().min(0).max(100_000),
  xp: z.number().int().min(0).max(10_000)
})).min(1).max(12) });

const operationRotationSchema = z.object({ entries: z.array(z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(300),
  moduleSlug: z.string().regex(/^[a-z0-9-]+$/),
  requirements: z.object({ scrap: z.number().int().positive(), electronics: z.number().int().positive(), alloys: z.number().int().positive(), researchData: z.number().int().positive() }),
  reward: z.string().min(1).max(240)
})).min(1).max(12) });

const inventorySlugs = { scrap: 'scrap', electronics: 'electronics', alloys: 'alloys', researchData: 'research-data' } as const;
type Material = keyof typeof inventorySlugs;

function utcDay() {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

function activeOperation(now = new Date(), available: ReadonlyArray<(typeof operations)[number] | z.infer<typeof operationRotationSchema>['entries'][number]> = operations) {
  const week = Math.floor(now.getTime() / (7 * 24 * 60 * 60_000));
  const selected = available[week % available.length];
  return { ...selected, period: week, projectKind: `operation:${selected.slug}:${week}` };
}

async function rotationContent(context: ApiContext) {
  const versions = await context.prisma.contentVersion.findMany({ where: { slug: { in: ['rotation.contracts', 'rotation.operations'] }, lifecycle: 'active' }, orderBy: { version: 'desc' } });
  const contractVersion = versions.find(version => version.slug === 'rotation.contracts');
  const operationVersion = versions.find(version => version.slug === 'rotation.operations');
  const customContracts = contractVersion ? contractRotationSchema.safeParse(contractVersion.contentJson) : null;
  const customOperations = operationVersion ? operationRotationSchema.safeParse(operationVersion.contentJson) : null;
  return {
    contracts: customContracts?.success ? customContracts.data.entries : contracts,
    operations: customOperations?.success ? customOperations.data.entries : operations,
    versions: { contracts: customContracts?.success ? contractVersion?.version ?? null : null, operations: customOperations?.success ? operationVersion?.version ?? null : null }
  };
}

function weekWindow(now = new Date()) {
  const start = new Date(now);
  start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7));
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 7);
  return { start, end, period: Math.floor(start.getTime() / (7 * 24 * 60 * 60_000)) };
}

function prestigeFor(population: number) {
  let rawIndex = 0;
  for (let index = 0; index < prestigeTiers.length; index += 1) {
    if (population >= prestigeTiers[index].population) rawIndex = index;
  }
  const index = Math.max(0, rawIndex);
  const current = prestigeTiers[index];
  const next = prestigeTiers[index + 1] ?? null;
  return { index, ...current, next, progress: next ? Math.min(100, Math.round(((population - current.population) / (next.population - current.population)) * 100)) : 100 };
}

async function contractProgress(transaction: Prisma.TransactionClient, playerId: string, metric: string, since: Date) {
  if (metric === 'salvage') return transaction.historyEntry.count({ where: { playerId, category: 'salvage', createdAt: { gte: since } } });
  if (metric === 'expedition') return transaction.historyEntry.count({ where: { playerId, category: 'expedition', title: 'Expedition rewards claimed', createdAt: { gte: since } } });
  return transaction.craftingJob.count({ where: { playerId, createdAt: { gte: since } } });
}

export async function registerEndgameRoutes(app: FastifyInstance, context: ApiContext) {
  app.get('/api/v1/endgame', async request => {
    const user = await requireUser(context.prisma, request);
    const { start } = utcDay();
    const rotation = await rotationContent(context);
    const operation = activeOperation(new Date(), rotation.operations);
    const station = await context.prisma.station.findUniqueOrThrow({ where: { slug: 'station-zero' } });
    const module = await context.prisma.stationModule.findUnique({ where: { stationId_slug: { stationId: station.id, slug: operation.moduleSlug } } });
    const project = module
      ? await context.prisma.constructionProject.findFirst({ where: { moduleId: module.id, kind: operation.projectKind }, orderBy: { createdAt: 'desc' } })
      : null;
    const cooldowns = await context.prisma.actionCooldown.findMany({ where: { playerId: user.player.id, OR: [{ actionKey: { startsWith: 'contract:' } }, { actionKey: 'season:catch-up' }] } });
    const { start: weekStart, end: weekEnd, period } = weekWindow();
    const [voteEntries, publicQuarters] = await Promise.all([
      context.prisma.historyEntry.findMany({ where: { category: 'community-vote', createdAt: { gte: weekStart, lt: weekEnd } }, select: { playerId: true, details: true } }),
      context.prisma.quartersLayout.findMany({ include: { player: { include: { user: { select: { displayName: true, avatarUrl: true } } } } }, orderBy: { updatedAt: 'desc' }, take: 24 })
    ]);
    const vote = communityVotes[period % communityVotes.length];
    const tallies = Object.fromEntries(vote.options.map(option => [option.slug, voteEntries.filter(entry => (entry.details as { option?: string }).option === option.slug).length]));
    const myVote = voteEntries.find(entry => entry.playerId === user.player.id);
    const prestige = prestigeFor(station.population);
    const progress = await Promise.all(rotation.contracts.map(async contract => ({
      ...contract,
      progress: Math.min(contract.target, await contractProgress(context.prisma, user.player.id, contract.metric, start)),
      claimed: cooldowns.some(cooldown => cooldown.actionKey === `contract:${contract.slug}` && cooldown.expiresAt > new Date())
    })));
    return {
      data: {
        contracts: progress,
        operation: {
          ...operation,
          requirements: operation.requirements,
          contributed: (project?.contributed ?? {}) as Record<string, number>,
          completed: project?.status === 'completed'
        },
        prestige,
        vote: { ...vote, tallies, selected: (myVote?.details as { option?: string } | undefined)?.option ?? null, endsAt: weekEnd.toISOString() },
        seasonal: {
          name: station.activeSeason ?? 'Independent Circuit',
          tokens: user.player.seasonalTokens,
          owned: user.player.cosmetics,
          catchUpAvailable: user.player.level >= 10 && user.player.seasonalTokens < 8 && !cooldowns.some(cooldown => cooldown.actionKey === 'season:catch-up' && cooldown.expiresAt > new Date()),
          store: seasonalStore.map(item => ({ ...item, unlocked: prestige.index >= item.minPrestige, owned: user.player.cosmetics.includes(item.slug) }))
        },
        quartersDirectory: publicQuarters.map(layout => ({
          playerId: layout.playerId,
          displayName: layout.player.user.displayName,
          avatarUrl: layout.player.user.avatarUrl,
          theme: layout.theme,
          objects: layout.objects,
          updatedAt: layout.updatedAt.toISOString()
        })),
        rotationVersions: rotation.versions
      },
      requestId: request.id
    };
  });

  app.post('/api/v1/endgame/contracts/:slug/claim', async request => {
    const user = await requireUser(context.prisma, request);
    const slug = z.string().min(1).parse((request.params as { slug: string }).slug);
    const contract = (await rotationContent(context)).contracts.find(candidate => candidate.slug === slug);
    if (!contract) throw new GameRuleError('CONTRACT_NOT_FOUND', 'That contract is not active.');
    const { start, end } = utcDay();
    const result = await context.prisma.$transaction(async transaction => {
      const progress = await contractProgress(transaction, user.player.id, contract.metric, start);
      if (progress < contract.target) throw new GameRuleError('CONTRACT_INCOMPLETE', `${contract.name} requires ${contract.target} progress.`);
      await enforceDurableCooldown(transaction, user.player.id, `contract:${contract.slug}`, Math.max(1, Math.ceil((end.getTime() - Date.now()) / 1000)));
      const player = await transaction.player.findUniqueOrThrow({ where: { id: user.player.id } });
      const tokenYield = 2;
      const updated = await transaction.player.update({ where: { id: player.id }, data: { credits: { increment: contract.credits }, xp: { increment: contract.xp }, seasonalTokens: { increment: tokenYield }, level: levelForXp(player.xp + contract.xp, progressionRules.levelXp) } });
      return { progress, credits: contract.credits, xp: contract.xp, seasonalTokens: tokenYield, level: updated.level };
    });
    return { data: result, requestId: request.id };
  });

  app.post('/api/v1/endgame/operations/contribute', async request => {
    const user = await requireUser(context.prisma, request);
    const body = z.object({
      scrap: z.number().int().nonnegative().default(0),
      electronics: z.number().int().nonnegative().default(0),
      alloys: z.number().int().nonnegative().default(0),
      researchData: z.number().int().nonnegative().default(0)
    }).refine(value => Object.values(value).some(amount => amount > 0), 'Contribute at least one material.').parse(request.body ?? {});
    const operation = activeOperation(new Date(), (await rotationContent(context)).operations);
    const result = await context.prisma.$transaction(async transaction => {
      await acquireTransactionLock(transaction, `station-zero:operation:${operation.slug}`);
      await acquireTransactionLock(transaction, `player:${user.player.id}:inventory`);
      const station = await transaction.station.findUniqueOrThrow({ where: { slug: 'station-zero' } });
      const module = await transaction.stationModule.findUniqueOrThrow({ where: { stationId_slug: { stationId: station.id, slug: operation.moduleSlug } } });
      if (module.state !== 'active' || module.level < 1) throw new GameRuleError('OPERATION_LOCKED', `${module.name} must be online before this operation can begin.`);
      let project = await transaction.constructionProject.findFirst({ where: { moduleId: module.id, kind: operation.projectKind }, orderBy: { createdAt: 'desc' } });
      if (project?.status === 'completed') throw new GameRuleError('OPERATION_COMPLETE', 'This weekly station operation is already complete.');
      if (!project) project = await transaction.constructionProject.create({ data: { moduleId: module.id, targetLevel: module.level, kind: operation.projectKind, requirements: operation.requirements, contributed: {} } });
      const contributed = (project.contributed ?? {}) as Record<Material, number>;
      let accepted = false;
      for (const material of Object.keys(inventorySlugs) as Material[]) {
        const requested = body[material];
        const remaining = operation.requirements[material] - (contributed[material] ?? 0);
        const amount = Math.min(requested, Math.max(0, remaining));
        if (amount <= 0) continue;
        const removed = await transaction.inventoryStack.updateMany({ where: { playerId: user.player.id, itemSlug: inventorySlugs[material], quantity: { gte: amount } }, data: { quantity: { decrement: amount } } });
        if (!removed.count) throw new GameRuleError('NOT_ENOUGH_MATERIALS', `Not enough ${material}.`);
        contributed[material] = (contributed[material] ?? 0) + amount;
        accepted = true;
      }
      if (!accepted) throw new GameRuleError('MATERIAL_NOT_REQUIRED', 'The operation does not need those materials.');
      const completed = (Object.keys(operation.requirements) as Material[]).every(material => (contributed[material] ?? 0) >= operation.requirements[material]);
      await transaction.constructionProject.update({ where: { id: project.id }, data: { contributed: contributed as Prisma.InputJsonValue, status: completed ? 'completed' : 'active', completedAt: completed ? new Date() : null } });
      if (completed) {
        const player = await transaction.player.findUniqueOrThrow({ where: { id: user.player.id } });
        await transaction.player.update({ where: { id: player.id }, data: { credits: { increment: 1000 }, xp: { increment: 500 }, seasonalTokens: { increment: 5 }, level: levelForXp(player.xp + 500, progressionRules.levelXp) } });
        await transaction.station.update({ where: { id: station.id }, data: { morale: Math.min(100, station.morale + 10), power: Math.min(100, station.power + 10), population: { increment: 25 } } });
        await transaction.plaque.create({ data: { moduleId: module.id, title: operation.name, body: `${user.displayName} delivered the final load for the weekly station operation.`, playerName: user.displayName } });
      }
      const history = await transaction.historyEntry.create({ data: { stationId: station.id, playerId: user.player.id, category: 'construction', title: completed ? `${operation.name} completed` : `${operation.name} supplied`, body: completed ? `${user.displayName} completed the weekly station operation.` : `${user.displayName} contributed to the weekly station operation.`, actorDisplayName: user.displayName, details: { operation: operation.slug, contributed: body, completed } } });
      return { contributed, completed, history };
    });
    context.realtime.broadcast({ type: 'station.updated', station: await stationDto(context.prisma) });
    context.realtime.broadcast({ type: 'history.added', entry: result.history });
    return { data: { contributed: result.contributed, completed: result.completed }, requestId: request.id };
  });

  app.post('/api/v1/endgame/vote', async request => {
    const user = await requireUser(context.prisma, request);
    const option = z.object({ option: z.string().min(1) }).parse(request.body ?? {}).option;
    const { start, end, period } = weekWindow();
    const vote = communityVotes[period % communityVotes.length];
    const selected = vote.options.find(candidate => candidate.slug === option);
    if (!selected) throw new GameRuleError('VOTE_OPTION_NOT_FOUND', 'That community vote option is not active.');
    await context.prisma.$transaction(async transaction => {
      await acquireTransactionLock(transaction, `community-vote:${period}:player:${user.player.id}`);
      if (await transaction.historyEntry.findFirst({ where: { playerId: user.player.id, category: 'community-vote', createdAt: { gte: start, lt: end } } })) {
        throw new GameRuleError('VOTE_ALREADY_CAST', 'Your vote is locked for this weekly cycle.');
      }
      const station = await transaction.station.findUniqueOrThrow({ where: { slug: 'station-zero' } });
      await transaction.historyEntry.create({ data: { stationId: station.id, playerId: user.player.id, category: 'community-vote', title: `${vote.name}: ${selected.name}`, body: `${user.displayName} backed ${selected.name}.`, actorDisplayName: user.displayName, details: { vote: vote.slug, option: selected.slug, period } } });
    });
    return { data: { option, endsAt: end.toISOString() }, requestId: request.id };
  });

  app.post('/api/v1/endgame/store/:slug/purchase', async request => {
    const user = await requireUser(context.prisma, request);
    const slug = z.string().min(1).parse((request.params as { slug: string }).slug);
    const item = seasonalStore.find(candidate => candidate.slug === slug);
    if (!item) throw new GameRuleError('COSMETIC_NOT_FOUND', 'That seasonal cosmetic is not available.');
    const result = await context.prisma.$transaction(async transaction => {
      await acquireTransactionLock(transaction, `player:${user.player.id}:seasonal-store`);
      const [player, station] = await Promise.all([
        transaction.player.findUniqueOrThrow({ where: { id: user.player.id } }),
        transaction.station.findUniqueOrThrow({ where: { slug: 'station-zero' } })
      ]);
      if (prestigeFor(station.population).index < item.minPrestige) throw new GameRuleError('PRESTIGE_REQUIRED', 'Station prestige is not high enough for this collection.');
      if (player.cosmetics.includes(item.slug)) throw new GameRuleError('COSMETIC_OWNED', 'You already own this cosmetic.');
      if (player.seasonalTokens < item.tokens) throw new GameRuleError('NOT_ENOUGH_TOKENS', `You need ${item.tokens} seasonal tokens.`);
      return transaction.player.update({ where: { id: player.id }, data: { seasonalTokens: { decrement: item.tokens }, cosmetics: { push: item.slug } }, select: { seasonalTokens: true, cosmetics: true } });
    });
    return { data: result, requestId: request.id };
  });

  app.post('/api/v1/endgame/season/catch-up', async request => {
    const user = await requireUser(context.prisma, request);
    if (user.player.level < 10) throw new GameRuleError('CATCH_UP_LOCKED', 'Season catch-up unlocks at level 10.');
    if (user.player.seasonalTokens >= 8) throw new GameRuleError('CATCH_UP_NOT_REQUIRED', 'Your seasonal token balance is already on pace.');
    const { end } = weekWindow();
    const result = await context.prisma.$transaction(async transaction => {
      await enforceDurableCooldown(transaction, user.player.id, 'season:catch-up', Math.max(1, Math.ceil((end.getTime() - Date.now()) / 1000)));
      return transaction.player.update({ where: { id: user.player.id }, data: { seasonalTokens: { increment: 5 } }, select: { seasonalTokens: true } });
    });
    return { data: { ...result, granted: 5, resetsAt: end.toISOString() }, requestId: request.id };
  });

  app.post('/api/v1/endgame/quarters/:playerId/rate', async request => {
    const user = await requireUser(context.prisma, request);
    const targetPlayerId = z.string().min(1).parse((request.params as { playerId: string }).playerId);
    const rating = z.object({ rating: z.number().int().min(1).max(5) }).parse(request.body ?? {}).rating;
    if (targetPlayerId === user.player.id) throw new GameRuleError('SELF_RATING', 'You cannot rate your own quarters.');
    const { start, end } = utcDay();
    await context.prisma.$transaction(async transaction => {
      await acquireTransactionLock(transaction, `quarters-rating:${targetPlayerId}:${user.player.id}`);
      if (!await transaction.quartersLayout.findUnique({ where: { playerId: targetPlayerId } })) throw new GameRuleError('QUARTERS_NOT_FOUND', 'Those quarters are unavailable.');
      if (await transaction.historyEntry.findFirst({ where: { playerId: user.player.id, category: 'quarters-rating', createdAt: { gte: start, lt: end }, details: { path: ['targetPlayerId'], equals: targetPlayerId } } })) {
        throw new GameRuleError('RATING_COOLDOWN', 'You may rate these quarters again tomorrow.');
      }
      const station = await transaction.station.findUniqueOrThrow({ where: { slug: 'station-zero' } });
      await transaction.historyEntry.create({ data: { stationId: station.id, playerId: user.player.id, category: 'quarters-rating', title: 'Public quarters rated', body: `${user.displayName} rated a public quarters display ${rating}/5.`, actorDisplayName: user.displayName, details: { targetPlayerId, rating } } });
    });
    return { data: { targetPlayerId, rating }, requestId: request.id };
  });
}
