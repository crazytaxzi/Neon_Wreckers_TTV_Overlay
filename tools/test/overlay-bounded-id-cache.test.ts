import assert from 'node:assert/strict';
import test from 'node:test';
import { BoundedIdCache } from '../../apps/overlay/src/bounded-id-cache.js';

test('bounded ID cache rejects duplicates without growing', () => {
  const cache = new BoundedIdCache({ maxEntries: 3, ttlMs: 1_000, now: () => 100 });

  assert.equal(cache.add('alpha'), true);
  assert.equal(cache.add('alpha'), false);
  assert.equal(cache.size, 1);
});

test('bounded ID cache evicts the oldest entry at capacity', () => {
  let now = 0;
  const cache = new BoundedIdCache({ maxEntries: 2, ttlMs: 10_000, now: () => now });

  cache.add('alpha');
  now += 1;
  cache.add('beta');
  now += 1;
  cache.add('gamma');

  assert.equal(cache.has('alpha'), false);
  assert.equal(cache.has('beta'), true);
  assert.equal(cache.has('gamma'), true);
  assert.equal(cache.size, 2);
});

test('bounded ID cache expires entries after the configured TTL', () => {
  let now = 1_000;
  const cache = new BoundedIdCache({ maxEntries: 4, ttlMs: 500, now: () => now });

  cache.add('alpha');
  now = 1_501;

  assert.equal(cache.has('alpha'), false);
  assert.equal(cache.size, 0);
  assert.equal(cache.add('alpha'), true);
});
