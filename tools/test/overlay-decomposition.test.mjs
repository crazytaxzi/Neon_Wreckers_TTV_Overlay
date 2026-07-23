import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const read = path => fs.readFileSync(path, 'utf8');

test('overlay decomposition modules retain bounded cleanup-oriented primitives', () => {
  const cache = read('apps/overlay/src/bounded-id-cache.ts');
  const queue = read('apps/overlay/src/use-headline-queue.ts');
  const visibility = read('apps/overlay/src/use-overlay-visibility.ts');
  const headlines = read('apps/overlay/src/headlines.ts');

  assert.match(cache, /maxEntries/);
  assert.match(cache, /ttlMs/);
  assert.match(queue, /BoundedIdCache/);
  assert.match(queue, /clearInterval/);
  assert.match(visibility, /clearTimeout/);
  assert.match(visibility, /return clearTimers/);
  assert.match(headlines, /HistoryRecord/);
  assert.match(headlines, /StationAlert/);
  assert.doesNotMatch(headlines, /\bany\b/);
});
