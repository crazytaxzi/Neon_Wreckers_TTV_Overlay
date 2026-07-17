import type { FastifyInstance } from 'fastify';
import type { Prisma } from '@prisma/client';
import { z } from 'zod';
import { GameRuleError } from '@neon-wreckers/game-engine';
import { careerRules, modulesBySlug } from '@neon-wreckers/content';
import type { ApiContext } from '../types.js';
import { acquireTransactionLock } from '../lib/database.js';
import { requireUser } from '../services/auth.js';
import { stationDto } from '../services/station.js';

const contributionSchema = z.object({
  moduleSlug: z.string().default('habitat-ring'),
  scrap: z.number().int().nonnegative().default(0),
  electronics: z.number().int().nonnegative().default(0),
  alloys: z.number().int().nonnegative().default(0),
  researchData: z.number().int().nonnegative().default(0)
}).refine(body => body.scrap + body.electronics + body.alloys + body.researchData > 0, 'Contribute at least one material.');

const inventorySlug: Record<string, string> = { scrap: 'scrap', electronics: 'electronics', alloys: 'alloys', researchData: 'research-data' };

function requirementsFor(definition: (typeof modulesBySlug)[string], level: number, kind: string) {
  const multiplier = kind === 'upgrade' ? level + 1 : kind === 'repair' ? 0.25 : 1;
  return Object.fromEntries(Object.entries(definition.construction.resources).map(([slug, amount]) => [slug, Math.max(amount === 0 ? 0 : 1, Math.ceil(amount * multiplier))]));
}

export async function registerConstructionRoutes(app: FastifyInstance, context: ApiContext) {
  app.post('/api/v1/construction/start', async request => {
    const user = await requireUser(context.prisma, request);
    const body = z.object({ moduleSlug: z.string().min(1), kind: z.enum(['upgrade', 'repair']) }).parse(request.body);
    const definition = modulesBySlug[body.moduleSlug];
    if (!definition) throw new GameRuleError('MODULE_NOT_FOUND', 'Unknown module.');
    const station = await context.prisma.station.findUniqueOrThrow({ where: { slug: 'station-zero' } });
    const module = await context.prisma.stationModule.findUniqueOrThrow({ where: { stationId_slug: { stationId: station.id, slug: body.moduleSlug } } });
    if (body.kind === 'upgrade' && (module.state !== 'active' || module.level >= definition.maxLevel)) throw new GameRuleError('MODULE_NOT_UPGRADABLE', 'This module cannot be upgraded.');
    if (body.kind === 'repair' && !['damaged', 'disabled'].includes(module.state)) throw new GameRuleError('MODULE_NOT_DAMAGED', 'This module does not need repair.');
    const updated = await context.prisma.$transaction(async (transaction: Prisma.TransactionClient) => {
      await acquireTransactionLock(transaction, `station-zero:construction:${body.moduleSlug}`);
      await transaction.constructionProject.updateMany({ where: { moduleId: module.id, status: 'active' }, data: { status: 'cancelled' } });
      await transaction.constructionProject.create({ data: { moduleId: module.id, targetLevel: body.kind === 'upgrade' ? module.level + 1 : module.level, kind: body.kind, requirements: requirementsFor(definition, module.level, body.kind), contributed: {} } });
      await transaction.auditLog.create({ data: { actorId: user.id, action: `construction.${body.kind}`, target: body.moduleSlug, requestId: request.id } });
      return transaction.stationModule.update({ where: { id: module.id }, data: { state: body.kind === 'upgrade' ? 'upgrading' : 'damaged', progress: 0 } });
    });
    context.realtime.broadcast({ type: 'station.updated', station: await stationDto(context.prisma) });
    return { data: updated, requestId: request.id };
  });

  app.post('/api/v1/construction/contribute', async request => {
    const user = await requireUser(context.prisma, request);
    const body = contributionSchema.parse(request.body ?? {});
    const transactionResult = await context.prisma.$transaction(async (transaction: Prisma.TransactionClient) => {
      await acquireTransactionLock(transaction, `station-zero:construction:${body.moduleSlug}`);
      await acquireTransactionLock(transaction, `player:${user.player.id}:inventory`);
      const station = await transaction.station.findUniqueOrThrow({ where: { slug: 'station-zero' } });
      const module = await transaction.stationModule.findUniqueOrThrow({ where: { stationId_slug: { stationId: station.id, slug: body.moduleSlug } } });
      const definition = modulesBySlug[body.moduleSlug];
      if (!definition) throw new GameRuleError('MODULE_NOT_FOUND', `Unknown module ${body.moduleSlug}.`);
      const modules = await transaction.stationModule.findMany({ where: { stationId: station.id } });
      if (module.state === 'locked' && !definition.prerequisites.every(slug => modules.find(candidate => candidate.slug === slug)?.state === 'active')) throw new GameRuleError('MODULE_PREREQUISITES', 'Complete the prerequisite modules first.');
      if (!['locked', 'building', 'upgrading', 'damaged'].includes(module.state)) throw new GameRuleError('MODULE_NOT_CONTRIBUTABLE', `${module.name} is not accepting resources.`);
      const kind = module.state === 'upgrading' ? 'upgrade' : module.state === 'damaged' ? 'repair' : 'build';
      let project = await transaction.constructionProject.findFirst({ where: { moduleId: module.id, status: 'active' }, orderBy: { createdAt: 'desc' } });
      if (!project) project = await transaction.constructionProject.create({ data: { moduleId: module.id, targetLevel: kind === 'upgrade' ? module.level + 1 : Math.max(1, module.level), kind, requirements: requirementsFor(definition, module.level, kind), contributed: {} } });
      const requirements = project.requirements as Record<string, number>;
      const contributed = project.contributed as Record<string, number>;
      const requested = { scrap: body.scrap, electronics: body.electronics, alloys: body.alloys, researchData: body.researchData };
      const builderMultiplier = Number(careerRules[user.player.career]?.constructionProgressMultiplier ?? 1);
      let acceptedAnything = false;
      for (const [contentSlug, requestedAmount] of Object.entries(requested)) {
        if (requestedAmount <= 0) continue;
        const required = requirements[contentSlug] ?? 0;
        if (required <= 0) throw new GameRuleError('MATERIAL_NOT_REQUIRED', `${contentSlug} is not required for this project.`);
        const remaining = Math.max(0, required - (contributed[contentSlug] ?? 0));
        if (remaining === 0) continue;
        const accepted = Math.min(requestedAmount, Math.ceil(remaining / builderMultiplier));
        const deducted = await transaction.inventoryStack.updateMany({ where: { playerId: user.player.id, itemSlug: inventorySlug[contentSlug], quantity: { gte: accepted } }, data: { quantity: { decrement: accepted } } });
        if (!deducted.count) throw new GameRuleError('NOT_ENOUGH_MATERIALS', `Not enough ${contentSlug}.`);
        contributed[contentSlug] = Math.min(required, (contributed[contentSlug] ?? 0) + Math.floor(accepted * builderMultiplier));
        acceptedAnything = true;
      }
      if (!acceptedAnything) throw new GameRuleError('PROJECT_COMPLETE', 'This project does not need those materials.');
      const requiredEntries = Object.entries(requirements).filter(([, amount]) => amount > 0);
      const trackedProgress = requiredEntries.length ? Math.floor(requiredEntries.reduce((sum, [slug, amount]) => sum + Math.min(1, (contributed[slug] ?? 0) / amount), 0) / requiredEntries.length * 100) : 100;
      const progress = Math.max(module.progress, trackedProgress);
      const completed = progress >= 100;
      await transaction.constructionProject.update({ where: { id: project.id }, data: { contributed: contributed as Prisma.InputJsonValue, status: completed ? 'completed' : 'active', completedAt: completed ? new Date() : null } });
      const nextLevel = completed ? project.targetLevel : module.level;
      const nextModule = await transaction.stationModule.update({ where: { id: module.id }, data: { state: completed ? 'active' : module.state === 'locked' ? 'building' : module.state, progress, level: nextLevel, integrity: completed ? 100 : module.integrity } });
      if (completed && kind === 'build' && body.moduleSlug === 'habitat-ring') await transaction.station.update({ where: { id: station.id }, data: { population: { increment: 80 } } });
      if (completed) await transaction.plaque.create({ data: { moduleId: module.id, title: `${module.name} ${kind === 'upgrade' ? `reached level ${nextLevel}` : kind === 'repair' ? 'repaired' : 'entered service'}`, body: `${user.displayName} delivered the final project load.`, playerName: user.displayName } });
      const history = await transaction.historyEntry.create({ data: { stationId: station.id, playerId: user.player.id, category: 'construction', title: completed ? `${module.name} project completed` : `${module.name} advanced`, body: completed ? `${user.displayName} completed the ${kind} project.` : `${user.displayName} moved construction to ${progress}%.`, actorDisplayName: user.displayName } });
      return { completed, progress, projectId: project.id, module: nextModule, history };
    });
    const station = await stationDto(context.prisma);
    context.realtime.broadcast({ type: 'station.updated', station });
    context.realtime.broadcast({ type: 'history.added', entry: transactionResult.history });
    return { data: { station, result: transactionResult }, requestId: request.id };
  });
}
