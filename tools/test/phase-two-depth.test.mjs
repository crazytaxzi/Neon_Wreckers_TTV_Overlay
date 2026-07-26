import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(path, 'utf8');

test('ship mastery gates module slots and is awarded when expeditions are claimed', () => {
  const fleet = read('apps/api/src/routes/fleet.ts');
  const expeditions = read('apps/api/src/routes/expeditions.ts');
  assert.match(fleet, /MODULE_SLOTS_FULL/);
  assert.match(fleet, /Math\.min\(4, 1 \+ target\.masteryRank\)/);
  assert.match(expeditions, /masteryXp >= 350/);
  assert.match(expeditions, /masteryRank/);
});

test('crew fatigue, shore leave, assignments, and rotating specialists remain connected', () => {
  const fleet = read('apps/api/src/routes/fleet.ts');
  const expeditions = read('apps/api/src/routes/expeditions.ts');
  const worker = read('apps/worker/src/index.ts');
  assert.match(fleet, /rotatingCandidates/);
  assert.match(fleet, /shore-leave/);
  assert.match(fleet, /assignment: z\.enum/);
  assert.match(expeditions, /CREW_EXHAUSTED/);
  assert.match(expeditions, /fatigue: Math\.min\(100, Math\.max\(0,/);
  assert.match(worker, /fatigue: clamp\(member\.fatigue - 5, 0, 100\)/);
  assert.match(worker, /morale: clamp\(member\.morale \+ \(resolvedStatus === 'failed' \? -8 : 3\), 0, 100\)/);
});

test('expedition route tradeoffs and prototype research affect worker resolution', () => {
  const worker = read('apps/worker/src/index.ts');
  const balance = JSON.parse(read('content/base/balance.json'));
  const items = JSON.parse(read('content/base/items.json'));
  assert.match(worker, /routeSuccessBonus/);
  assert.match(worker, /routeLootBonus/);
  assert.ok(items.some(item => item.slug === 'prototype-blueprint'));
  assert.ok(balance.ships.upgrades.some(upgrade => upgrade.blueprints > 0));
});
