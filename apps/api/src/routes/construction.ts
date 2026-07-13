import type { FastifyInstance } from 'fastify';
import type { Prisma } from '@prisma/client';
import { z } from 'zod';
import { contributeConstruction, GameRuleError } from '@neon-wreckers/game-engine';
import type { ApiContext } from '../types.js';
import { acquireTransactionLock } from '../lib/database.js';
import { requireUser } from '../services/auth.js';
import { constructionProgressRules } from '@neon-wreckers/content';
import { stationDto } from '../services/station.js';

const contributionSchema = z.object({
  moduleSlug: z.string().default('habitat-ring'),
  scrap: z.number().int().nonnegative().default(10),
  electronics: z.number().int().nonnegative().default(0),
  alloys: z.number().int().nonnegative().default(0)
});

export async function registerConstructionRoutes(app: FastifyInstance, context: ApiContext) {
  app.post('/api/v1/construction/contribute', async request => {
    const user = await requireUser(context.prisma, request);
    const body = contributionSchema.parse(request.body ?? {});
    const transactionResult = await context.prisma.$transaction(async (transaction: Prisma.TransactionClient) => {
      await acquireTransactionLock(transaction, `station-zero:construction:${body.moduleSlug}`);
      await acquireTransactionLock(transaction, `player:${user.player.id}:inventory`);

      const currentStation = await stationDto(transaction);
      const inventory = await transaction.inventoryStack.findMany({
        where: { playerId: user.player.id }
      });
      const quantity = (slug: string) => inventory.find((item: { itemSlug: string; quantity: number }) => item.itemSlug === slug)?.quantity ?? 0;
      if (
        quantity('scrap') < body.scrap
        || quantity('electronics') < body.electronics
        || quantity('alloys') < body.alloys
      ) {
        throw new GameRuleError('NOT_ENOUGH_MATERIALS', 'Your hold does not have those construction materials.');
      }

      const result = contributeConstruction({
        station: currentStation,
        moduleSlug: body.moduleSlug,
        contribution: body,
        progressRules: constructionProgressRules,
        actorDisplayName: user.displayName
      });
      const contributions = { scrap: body.scrap, electronics: body.electronics, alloys: body.alloys };
      for (const [slug, amount] of Object.entries(contributions)) {
        if (amount > 0) {
          const deducted = await transaction.inventoryStack.updateMany({
            where: { playerId: user.player.id, itemSlug: slug, quantity: { gte: amount } },
            data: { quantity: { decrement: amount } }
          });
          if (deducted.count !== 1) {
            throw new GameRuleError('NOT_ENOUGH_MATERIALS', 'Construction materials changed before they could be committed.');
          }
        }
      }
      for (const module of result.station.modules) {
        await transaction.stationModule.updateMany({
          where: { stationId: currentStation.id, slug: module.slug },
          data: {
            state: module.state,
            progress: module.progress,
            level: module.level,
            integrity: module.integrity
          }
        });
      }
      await transaction.station.update({
        where: { id: currentStation.id },
        data: { population: result.station.population }
      });
      const history = [];
      for (const entry of result.history) {
        history.push(await transaction.historyEntry.create({
          data: {
            stationId: currentStation.id,
            playerId: user.player.id,
            category: entry.category,
            title: entry.title,
            body: entry.body,
            actorDisplayName: user.displayName
          }
        }));
      }
      return { result, history };
    });

    const station = await stationDto(context.prisma);
    context.realtime.broadcast({ type: 'station.updated', station });
    for (const entry of transactionResult.history) {
      context.realtime.broadcast({ type: 'history.added', entry });
    }
    return { data: { station, result: transactionResult.result }, requestId: request.id };
  });
}
