import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

test('every wreck archetype points at its own artwork', async () => {
  const wrecks = JSON.parse(await readFile('content/base/wrecks.json', 'utf8'));
  for (const wreck of wrecks) {
    assert.equal(wreck.visualKey, `wreck-${wreck.slug}`, `${wreck.slug} artwork must not alias another target`);
  }
});

test('the current wreck supports unauthenticated overlay reconciliation', async () => {
  const route = await readFile('apps/api/src/routes/station.ts', 'utf8');
  const currentWreckRoute = route.slice(
    route.indexOf("app.get('/api/v1/wrecks/current'"),
    route.indexOf("app.get('/api/v1/inventory'")
  );
  assert.match(currentWreckRoute, /getUserFromRequest/);
  assert.doesNotMatch(currentWreckRoute, /requireUser/);
  assert.match(currentWreckRoute, /if \(!user\?\.player\)/);
});
