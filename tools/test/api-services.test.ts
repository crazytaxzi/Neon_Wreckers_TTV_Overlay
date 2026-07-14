import test from 'node:test';
import assert from 'node:assert/strict';
import type { LoyaltyProvider } from '../../packages/integrations/src/streamelements.js';
import { parseRedisConnection } from '../../packages/integrations/src/redis.js';
import { errorMessage, requestApi } from '../../packages/browser-client/src/index.js';
import { runChargedAction } from '../../apps/api/src/services/loyalty.js';

function loyaltyProvider(overrides: Partial<LoyaltyProvider> = {}): LoyaltyProvider {
  return {
    name: 'streamelements',
    async getBalance() { return { balance: 1000, currencyName: 'points' }; },
    async debit() { return { externalReference: 'debit-1' }; },
    async credit() { return { externalReference: 'credit-1' }; },
    async health() { return { ok: true, detail: 'ready' }; },
    ...overrides
  };
}

test('Redis connection parsing handles credentials, TLS, and database selection', () => {
  const connection = parseRedisConnection('rediss://worker:p%40ss@redis.example:6380/2');
  assert.equal(connection.host, 'redis.example');
  assert.equal(connection.port, 6380);
  assert.equal(connection.username, 'worker');
  assert.equal(connection.password, 'p@ss');
  assert.equal(connection.db, 2);
  assert.deepEqual(connection.tls, {});
  assert.throws(() => parseRedisConnection('https://redis.example'), /redis:\/\/ or rediss:\/\//);
});

test('browser API helper unwraps data and preserves structured errors', async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => new Response(JSON.stringify({ data: { ok: true } }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });
    assert.deepEqual(await requestApi<{ ok: boolean }>('/api/test'), { ok: true });

    globalThis.fetch = async () => new Response(JSON.stringify({ error: { message: 'denied' } }), {
      status: 403,
      headers: { 'content-type': 'application/json' }
    });
    await assert.rejects(() => requestApi('/api/test'), /denied/);
    assert.equal(errorMessage(new Error('broken')), 'broken');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('failed debit never invokes the refund credit', async () => {
  let credits = 0;
  const provider = loyaltyProvider({
    async debit() { throw new Error('debit rejected'); },
    async credit() { credits += 1; return { externalReference: 'credit' }; }
  });

  await assert.rejects(
    () => runChargedAction(provider, {
      channelId: 'channel', username: 'viewer', amount: 75,
      reason: 'Rush scan', refundReason: 'Refund rush scan', idempotencyKey: 'one'
    }, async () => ({ ok: true })),
    /debit rejected/
  );
  assert.equal(credits, 0);
});

test('post-debit action failures are refunded or marked ambiguous', async () => {
  let credits = 0;
  const refunded = await runChargedAction(loyaltyProvider({
    async credit() { credits += 1; return { externalReference: 'credit' }; }
  }), {
    channelId: 'channel', username: 'viewer', amount: 75,
    reason: 'Rush scan', refundReason: 'Refund rush scan', idempotencyKey: 'two'
  }, async () => { throw new Error('action failed'); });
  assert.equal(refunded.status, 'refunded');
  assert.equal(credits, 1);

  const ambiguous = await runChargedAction(loyaltyProvider({
    async credit() { throw new Error('refund failed'); }
  }), {
    channelId: 'channel', username: 'viewer', amount: 75,
    reason: 'Rush scan', refundReason: 'Refund rush scan', idempotencyKey: 'three'
  }, async () => { throw new Error('action failed'); });
  assert.equal(ambiguous.status, 'ambiguous');
});
