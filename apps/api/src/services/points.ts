import { GameRuleError } from '@neon-wreckers/game-engine';
import { pointActions } from '@neon-wreckers/content';
import { env } from '../env.js';
import { HttpError, isDatabaseError } from '../lib/errors.js';
import type { ApiContext, AuthenticatedUserWithPlayer } from '../types.js';
import { runChargedAction } from './loyalty.js';
import { deploySalvage, scanForWreck } from './salvage.js';

export type PointActionSlug = 'safety_override' | 'rush_scan';

export async function executePointAction(context: ApiContext, user: AuthenticatedUserWithPlayer, actionSlug: PointActionSlug, idempotencyKey: string) {
  if (env.FEATURE_POINTS_ACTIONS !== 'true') throw new HttpError(503, 'Point-funded actions are disabled.', 'POINT_ACTIONS_DISABLED');
  if (!idempotencyKey) throw new GameRuleError('IDEMPOTENCY_REQUIRED', 'Send an Idempotency-Key header.');
  const existing = await context.prisma.loyaltyTransaction.findUnique({ where: { idempotencyKey } });
  if (existing) {
    if (existing.playerId !== user.player.id || existing.actionSlug !== actionSlug) throw new GameRuleError('IDEMPOTENCY_CONFLICT', 'That idempotency key belongs to another action.');
    return existing;
  }

  const amount = pointActions[actionSlug].cost;
  const username = user.twitchLogin || user.displayName;
  let record;
  try {
    record = await context.prisma.loyaltyTransaction.create({ data: { provider: context.loyaltyProvider.name, idempotencyKey, playerId: user.player.id, userId: user.id, broadcasterId: env.STREAMER_TWITCH_ID, amount, actionSlug, status: 'pending', requestJson: { username } } });
  } catch (error) {
    if (isDatabaseError(error, 'P2002')) {
      const replay = await context.prisma.loyaltyTransaction.findUniqueOrThrow({ where: { idempotencyKey } });
      if (replay.playerId !== user.player.id || replay.actionSlug !== actionSlug) throw new GameRuleError('IDEMPOTENCY_CONFLICT', 'That idempotency key belongs to another action.');
      return replay;
    }
    throw error;
  }

  let result;
  try {
    result = await runChargedAction(context.loyaltyProvider, { channelId: env.STREAMELEMENTS_CHANNEL_ID, username, amount, reason: `Neon Wreckers ${actionSlug}`, refundReason: `Refund ${actionSlug}`, idempotencyKey }, async () => actionSlug === 'safety_override' ? deploySalvage(context, user, 'override') : scanForWreck(context, user, true));
  } catch (error) {
    await context.prisma.loyaltyTransaction.update({ where: { id: record.id }, data: { status: 'failed', error: error instanceof Error ? error.message : String(error) } });
    throw error;
  }
  if (result.status === 'committed') return context.prisma.loyaltyTransaction.update({ where: { id: record.id }, data: { status: 'committed', externalReference: result.debitReference, responseJson: JSON.parse(JSON.stringify({ outcome: result.outcome })) } });
  if (result.status === 'refunded') return context.prisma.loyaltyTransaction.update({ where: { id: record.id }, data: { status: 'refunded', externalReference: result.debitReference, error: result.error instanceof Error ? result.error.message : String(result.error) } });
  return context.prisma.loyaltyTransaction.update({ where: { id: record.id }, data: { status: 'ambiguous', externalReference: result.debitReference, error: `${result.error instanceof Error ? result.error.message : String(result.error)}; refund failed: ${result.refundError instanceof Error ? result.refundError.message : String(result.refundError)}` } });
}
