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

test('every purchasable ship class has three licensed upgrade paths with responsive artwork', () => {
  const balance = JSON.parse(read('content/base/balance.json'));
  for (const ship of balance.ships.purchases) {
    const skins = balance.ships.skins.filter(skin => skin.classSlug === ship.slug);
    assert.equal(skins.length, 3, `${ship.name} should have exactly three licensed frames`);
    for (const skin of skins) {
      assert.ok(fs.existsSync(`apps/web/public/ships/skins/${skin.slug}.webp`), `${skin.name} full artwork is missing`);
      assert.ok(fs.existsSync(`apps/web/public/ships/skins/${skin.slug}-600w.webp`), `${skin.name} 600w artwork is missing`);
      assert.ok(fs.existsSync(`apps/web/public/ships/skins/${skin.slug}-360w.webp`), `${skin.name} 360w artwork is missing`);
    }
  }
});
