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

const inventorySlugs = { scrap: 'scrap', electronics: 'electronics', alloys: 'alloys', researchData: 'research-data' } as const;
type Material = keyof typeof inventorySlugs;

function utcDay() {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

function activeOperation(now = new Date()) {
  const week = Math.floor(now.getTime() / (7 * 24 * 60 * 60_000));
  return { ...operations[week % operations.length], period: week, projectKind: `operation:${operations[week % operations.length].slug}:${week}` };
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
    const operation = activeOperation();
    const station = await context.prisma.station.findUniqueOrThrow({ where: { slug: 'station-zero' } });
    const module = await context.prisma.stationModule.findUnique({ where: { stationId_slug: { stationId: station.id, slug: operation.moduleSlug } } });
    const project = module
      ? await context.prisma.constructionProject.findFirst({ where: { moduleId: module.id, kind: operation.projectKind }, orderBy: { createdAt: 'desc' } })
      : null;
    const cooldowns = await context.prisma.actionCooldown.findMany({ where: { playerId: user.player.id, actionKey: { startsWith: 'contract:' } } });
    const progress = await Promise.all(contracts.map(async contract => ({
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
        }
      },
      requestId: request.id
    };
  });

  app.post('/api/v1/endgame/contracts/:slug/claim', async request => {
    const user = await requireUser(context.prisma, request);
    const slug = z.string().min(1).parse((request.params as { slug: string }).slug);
    const contract = contracts.find(candidate => candidate.slug === slug);
    if (!contract) throw new GameRuleError('CONTRACT_NOT_FOUND', 'That contract is not active.');
    const { start, end } = utcDay();
    const result = await context.prisma.$transaction(async transaction => {
      const progress = await contractProgress(transaction, user.player.id, contract.metric, start);
      if (progress < contract.target) throw new GameRuleError('CONTRACT_INCOMPLETE', `${contract.name} requires ${contract.target} progress.`);
      await enforceDurableCooldown(transaction, user.player.id, `contract:${contract.slug}`, Math.max(1, Math.ceil((end.getTime() - Date.now()) / 1000)));
      const player = await transaction.player.findUniqueOrThrow({ where: { id: user.player.id } });
      const updated = await transaction.player.update({ where: { id: player.id }, data: { credits: { increment: contract.credits }, xp: { increment: contract.xp }, level: levelForXp(player.xp + contract.xp, progressionRules.levelXp) } });
      return { progress, credits: contract.credits, xp: contract.xp, level: updated.level };
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
    const operation = activeOperation();
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
        await transaction.player.update({ where: { id: player.id }, data: { credits: { increment: 1000 }, xp: { increment: 500 }, level: levelForXp(player.xp + 500, progressionRules.levelXp) } });
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
}
