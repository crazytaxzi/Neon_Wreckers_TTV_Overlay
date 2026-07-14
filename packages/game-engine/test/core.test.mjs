import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyInventoryStacks,
  contributeConstruction,
  discoverWreck,
  enforceCooldown,
  GameRuleError,
  launchExpedition,
  resolveExpedition,
  salvageWreck
} from '../src/core.mjs';
import {
  constructionProgressRules,
  expeditionDefinitions,
  initialStation,
  itemsBySlug,
  wreckArchetypes
} from '@neon-wreckers/content';

function stationCopy() {
  return structuredClone(initialStation);
}

test('salvage is deterministic for the same server seed', () => {
  const station = stationCopy();
  const wreck = discoverWreck({ station, playerId: 'p1', archetypes: wreckArchetypes, seed: 'scan-1' });
  const player = { id: 'p1', career: 'salvager' };
  const first = salvageWreck({ wreck, player, items: itemsBySlug, seed: 'salvage-1', mode: 'cutters', now: '2026-07-11T00:00:00.000Z' });
  const second = salvageWreck({ wreck, player, items: itemsBySlug, seed: 'salvage-1', mode: 'cutters', now: '2026-07-11T00:00:00.000Z' });
  assert.deepEqual(first, second);
  assert.ok(first.wreck.integrity < wreck.integrity);
});

test('construction completes modules and records history and a plaque', () => {
  const station = stationCopy();
  station.modules.find(module => module.slug === 'habitat-ring').progress = 98;
  const result = contributeConstruction({
    station,
    contribution: { scrap: 20 },
    progressRules: constructionProgressRules,
    actorDisplayName: 'Senti',
    now: '2026-07-11T00:00:00.000Z'
  });
  const module = result.station.modules.find(candidate => candidate.slug === 'habitat-ring');
  assert.equal(result.completed, true);
  assert.equal(module.state, 'active');
  assert.equal(result.station.population, 327);
  assert.equal(module.plaques.length, 1);
});

test('inventory stacks merge by item slug', () => {
  const merged = applyInventoryStacks(
    [{ itemSlug: 'scrap', name: 'Hull Scrap', quantity: 2, rarity: 'common', visualKey: 'item-hull-scrap' }],
    [{ itemSlug: 'scrap', name: 'Hull Scrap', quantity: 3, rarity: 'common', visualKey: 'item-hull-scrap' }]
  );
  assert.equal(merged[0].quantity, 5);
});

test('cooldowns reject repeated actions until the configured time passes', () => {
  const cooldowns = new Map();
  enforceCooldown({ key: 'scan:p1', cooldowns, seconds: 15, nowMs: 1_000 });
  assert.throws(
    () => enforceCooldown({ key: 'scan:p1', cooldowns, seconds: 15, nowMs: 5_000 }),
    error => error instanceof GameRuleError && error.code === 'COOLDOWN'
  );
  assert.doesNotThrow(() => enforceCooldown({ key: 'scan:p1', cooldowns, seconds: 15, nowMs: 16_000 }));
});

test('expeditions consume fuel and resolve deterministically after their timer', () => {
  const launched = launchExpedition({
    player: { id: 'p1' },
    ship: { id: 'ship-1', name: 'Rustlight Tug', condition: 100, fuel: 4 },
    crew: [{ id: 'c1' }, { id: 'c2' }],
    expeditionDefinition: expeditionDefinitions['glass-belt-run'],
    seed: 'launch-1',
    now: '2026-07-11T00:00:00.000Z'
  });
  assert.equal(launched.ship.fuel, 3);
  assert.throws(
    () => resolveExpedition({ expedition: launched, items: itemsBySlug, seed: 'resolve-1', now: '2026-07-11T00:05:00.000Z' }),
    error => error instanceof GameRuleError && error.code === 'EXPEDITION_NOT_READY'
  );
  const first = resolveExpedition({ expedition: launched, items: itemsBySlug, seed: 'resolve-1', now: '2026-07-12T00:00:00.000Z' });
  const second = resolveExpedition({ expedition: launched, items: itemsBySlug, seed: 'resolve-1', now: '2026-07-12T00:00:00.000Z' });
  assert.deepEqual(first, second);
  assert.ok(['resolved', 'failed'].includes(first.status));
});
