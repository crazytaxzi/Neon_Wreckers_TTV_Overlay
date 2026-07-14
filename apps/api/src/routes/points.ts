import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { GameRuleError } from '@neon-wreckers/game-engine';
import { env } from '../env.js';
import { HttpError, isDatabaseError } from '../lib/errors.js';
import type { ApiContext } from '../types.js';
import { requireUser } from '../services/auth.js';
import { pointActions } from '@neon-wreckers/content';
import { runChargedAction } from '../services/loyalty.js';
import { deploySalvage, scanForWreck } from '../services/salvage.js';

const actionSchema = z.enum(['safety_override', 'rush_scan']);

type DeploySalvageResult = Awaited<ReturnType<typeof deploySalvage>>;
type ScanForWreckResult = Awaited<ReturnType<typeof scanForWreck>>;
type PointActionResult = DeploySalvageResult | ScanForWreckResult;

export async function registerPointRoutes(app: FastifyInstance, context: ApiContext) {
  app.post('/api/v1/points/actions/:actionSlug', async request => {
    const user = await requireUser(context.prisma, request);
    if (env.FEATURE_POINTS_ACTIONS !== 'true') {
      throw new HttpError(503, 'Point-funded actions are disabled.', 'POINT_ACTIONS_DISABLED');
    }
    const actionSlug = actionSchema.parse((request.params as { actionSlug: string }).actionSlug);
    const idempotencyKey = request.headers['idempotency-key']?.toString();
    if (!idempotencyKey) throw new GameRuleError('IDEMPOTENCY_REQUIRED', 'Send an Idempotency-Key header.');

    const existing = await context.prisma.loyaltyTransaction.findUnique({ where: { idempotencyKey } });
    if (existing) return { data: existing, requestId: request.id };

    const amount = pointActions[actionSlug].cost;
    const username = user.twitchLogin || user.displayName;
    let record;
    try {
      record = await context.prisma.loyaltyTransaction.create({
        data: {
          provider: context.loyaltyProvider.name,
          idempotencyKey,
          playerId: user.player.id,
          userId: user.id,
          broadcasterId: env.STREAMER_TWITCH_ID,
          amount,
          actionSlug,
          status: 'pending',
          requestJson: { username }
        }
      });
    } catch (error) {
      if (isDatabaseError(error, 'P2002')) {
        const replay = await context.prisma.loyaltyTransaction.findUniqueOrThrow({ where: { idempotencyKey } });
        return { data: replay, requestId: request.id };
      }
      throw error;
    }

    let result;
    try {
      result = await runChargedAction(
        context.loyaltyProvider,
        {
          channelId: env.STREAMELEMENTS_CHANNEL_ID,
          username,
          amount,
          reason: `Neon Wreckers ${actionSlug}`,
          refundReason: `Refund ${actionSlug}`,
          idempotencyKey
        },
        async (): Promise<PointActionResult> => {
            if (actionSlug === 'safety_override') {
              return deploySalvage(context, user, 'override');
            }

            return scanForWreck(context, user);
          }
      );
    } catch (error) {
      await context.prisma.loyaltyTransaction.update({
        where: { id: record.id },
        data: { status: 'failed', error: error instanceof Error ? error.message : String(error) }
      });
      throw error;
    }

    if (result.status === 'committed') {
      const committed = await context.prisma.loyaltyTransaction.update({
        where: { id: record.id },
        data: {
          status: 'committed',
          externalReference: result.debitReference,
          responseJson: JSON.parse(JSON.stringify({ outcome: result.outcome }))
        }
      });
      return { data: committed, requestId: request.id };
    }

    if (result.status === 'refunded') {
      const refunded = await context.prisma.loyaltyTransaction.update({
        where: { id: record.id },
        data: {
          status: 'refunded',
          externalReference: result.debitReference,
          error: result.error instanceof Error ? result.error.message : String(result.error)
        }
      });
      return { data: refunded, requestId: request.id };
    }

    const ambiguous = await context.prisma.loyaltyTransaction.update({
      where: { id: record.id },
      data: {
        status: 'ambiguous',
        externalReference: result.debitReference,
        error: `${result.error instanceof Error ? result.error.message : String(result.error)}; refund failed: ${result.refundError instanceof Error ? result.refundError.message : String(result.refundError)}`
      }
    });
    return { data: ambiguous, requestId: request.id };
  });
}
