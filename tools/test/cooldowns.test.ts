import test from 'node:test';
import assert from 'node:assert/strict';
import type { Prisma } from '@prisma/client';
import { CooldownError, enforceDurableCooldown } from '../../apps/api/src/services/actions.js';

type CooldownRow = { playerId: string; actionKey: string; expiresAt: Date };
type SharedState = {
  rows: Map<string, CooldownRow>;
  locks: Map<string, Promise<void>>;
};

function createSharedState(): SharedState {
  return { rows: new Map(), locks: new Map() };
}

function createTransaction(state: SharedState): Prisma.TransactionClient {
  let releaseCurrentLock: (() => void) | undefined;
  const transaction = {
    async $queryRaw(_strings: TemplateStringsArray, key: string) {
      const prior = state.locks.get(key) ?? Promise.resolve();
      let release!: () => void;
      const current = new Promise<void>(resolve => { release = resolve; });
      state.locks.set(key, prior.then(() => current));
      await prior;
      releaseCurrentLock = () => {
        release();
        if (state.locks.get(key) === current) state.locks.delete(key);
      };
      return [{ locked: true }];
    },
    actionCooldown: {
      async findUnique({ where }: { where: { playerId_actionKey: { playerId: string; actionKey: string } } }) {
        const { playerId, actionKey } = where.playerId_actionKey;
        return state.rows.get(`${playerId}:${actionKey}`) ?? null;
      },
      async upsert({ create }: { create: CooldownRow }) {
        state.rows.set(`${create.playerId}:${create.actionKey}`, create);
        releaseCurrentLock?.();
        releaseCurrentLock = undefined;
        return create;
      }
    }
  };
  return transaction as unknown as Prisma.TransactionClient;
}

test('first action succeeds and immediate repeat returns retry metadata', async () => {
  const state = createSharedState();
  const transaction = createTransaction(state);
  const now = new Date('2026-07-22T12:00:00.000Z');

  const expiresAt = await enforceDurableCooldown(transaction, 'player-1', 'scan', 60, now);
  assert.equal(expiresAt.toISOString(), '2026-07-22T12:01:00.000Z');

  await assert.rejects(
    enforceDurableCooldown(transaction, 'player-1', 'scan', 60, new Date('2026-07-22T12:00:05.000Z')),
    error => error instanceof CooldownError
      && error.retryAfterSeconds === 55
      && error.retryAt === '2026-07-22T12:01:00.000Z'
  );
});

test('cooldown survives new transaction and application context semantics', async () => {
  const state = createSharedState();
  await enforceDurableCooldown(createTransaction(state), 'player-1', 'salvage:cutters', 30, new Date('2026-07-22T12:00:00.000Z'));

  await assert.rejects(
    enforceDurableCooldown(createTransaction(state), 'player-1', 'salvage:cutters', 30, new Date('2026-07-22T12:00:10.000Z')),
    error => error instanceof CooldownError
  );
});

test('two concurrent attempts for the same player and action cannot both succeed', async () => {
  const state = createSharedState();
  const now = new Date('2026-07-22T12:00:00.000Z');
  const results = await Promise.allSettled([
    enforceDurableCooldown(createTransaction(state), 'player-1', 'salvage:cargo', 30, now),
    enforceDurableCooldown(createTransaction(state), 'player-1', 'salvage:cargo', 30, now)
  ]);

  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
  assert.equal(results.filter(result => result.status === 'rejected' && result.reason instanceof CooldownError).length, 1);
});

test('expiry permits the next action and unrelated players do not block each other', async () => {
  const state = createSharedState();
  await Promise.all([
    enforceDurableCooldown(createTransaction(state), 'player-1', 'scan', 10, new Date('2026-07-22T12:00:00.000Z')),
    enforceDurableCooldown(createTransaction(state), 'player-2', 'scan', 10, new Date('2026-07-22T12:00:00.000Z'))
  ]);

  await assert.doesNotReject(
    enforceDurableCooldown(createTransaction(state), 'player-1', 'scan', 10, new Date('2026-07-22T12:00:10.000Z'))
  );
});
