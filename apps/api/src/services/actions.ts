import type { Prisma } from '@prisma/client';
import { GameRuleError } from '@neon-wreckers/game-engine';
import { acquireTransactionLock } from '../lib/database.js';

export class CooldownError extends GameRuleError {
  readonly retryAfterSeconds: number;
  readonly retryAt: string;

  constructor(expiresAt: Date, now: Date) {
    const retryAfterSeconds = Math.max(1, Math.ceil((expiresAt.getTime() - now.getTime()) / 1000));
    super('COOLDOWN', `Action cooling down for ${retryAfterSeconds} seconds.`);
    this.name = 'CooldownError';
    this.retryAfterSeconds = retryAfterSeconds;
    this.retryAt = expiresAt.toISOString();
  }
}

export async function enforceDurableCooldown(
  transaction: Prisma.TransactionClient,
  playerId: string,
  actionKey: string,
  seconds: number,
  now = new Date()
) {
  await acquireTransactionLock(transaction, `cooldown:${playerId}:${actionKey}`);
  const current = await transaction.actionCooldown.findUnique({
    where: { playerId_actionKey: { playerId, actionKey } }
  });
  if (current && current.expiresAt > now) {
    throw new CooldownError(current.expiresAt, now);
  }
  const expiresAt = new Date(now.getTime() + seconds * 1000);
  await transaction.actionCooldown.upsert({
    where: { playerId_actionKey: { playerId, actionKey } },
    create: { playerId, actionKey, expiresAt },
    update: { expiresAt }
  });
  return expiresAt;
}

export function levelForXp(xp: number, thresholds: readonly number[]) {
  let level = 1;
  for (let index = 0; index < thresholds.length; index += 1) {
    if (xp >= thresholds[index]) level = index + 1;
  }
  return level;
}
