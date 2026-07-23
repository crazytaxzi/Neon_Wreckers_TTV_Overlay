import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { loadAndValidateAssetManifest } from './lib/asset-manifest.mjs';

const contentRoot = path.resolve('content/base');
const requiredFiles = ['items.json', 'wrecks.json', 'modules.json', 'station.json', 'events.json', 'seasons.json', 'balance.json', 'themes.json'];
const documents = Object.fromEntries(requiredFiles.map(file => {
  const target = path.join(contentRoot, file);
  assert.ok(fs.existsSync(target), `Missing content file: ${file}`);
  return [file, JSON.parse(fs.readFileSync(target, 'utf8'))];
}));

const { manifest: assets, byKey: assetByKey } = loadAndValidateAssetManifest('assets/manifest.json', {
  publicRoots: ['apps/web/public', 'apps/admin/public', 'apps/overlay/public']
});
const visualKeys = new Set(assetByKey.keys());

function assertUniqueSlugs(collection, label) {
  const slugs = new Set();
  for (const record of collection) {
    assert.match(record.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/, `Invalid ${label} slug: ${record.slug}`);
    assert.ok(!slugs.has(record.slug), `Duplicate ${label} slug: ${record.slug}`);
    slugs.add(record.slug);
  }
  return slugs;
}

function assertIntegerRange(value, label) {
  assert.ok(Array.isArray(value) && value.length === 2, `${label} must contain two values.`);
  assert.ok(value.every(entry => Number.isInteger(entry) && entry >= 0), `${label} must contain nonnegative integers.`);
  assert.ok(value[1] >= value[0], `${label} maximum must be greater than or equal to its minimum.`);
}

const items = documents['items.json'];
const wrecks = documents['wrecks.json'];
const modules = documents['modules.json'];
const station = documents['station.json'];
const events = documents['events.json'];
const seasons = documents['seasons.json'];
const balance = documents['balance.json'];
const themes = documents['themes.json'];

const itemSlugs = assertUniqueSlugs(items, 'item');
const resourceSlugs = new Set([...itemSlugs, 'researchData', 'exoticMaterials']);
const wreckSlugs = assertUniqueSlugs(wrecks, 'wreck');
const moduleSlugs = assertUniqueSlugs(modules, 'module');
assertUniqueSlugs(events, 'event');
assertUniqueSlugs(seasons, 'season');

const referencedVisualKeys = new Set(['ship-rustlight-tug']);
for (const record of [...items, ...wrecks, ...modules]) {
  assert.ok(visualKeys.has(record.visualKey), `Missing asset manifest entry for ${record.slug}:${record.visualKey}`);
  assert.equal(record.lifecycle, 'active', `${record.slug} has unsupported base lifecycle ${record.lifecycle}`);
  referencedVisualKeys.add(record.visualKey);
}
for (const assetKey of visualKeys) {
  assert.ok(referencedVisualKeys.has(assetKey), `Unused asset manifest entry: ${assetKey}`);
}

for (const item of items) {
  assert.ok(Number.isInteger(item.stackLimit) && item.stackLimit > 0, `Item ${item.slug} has an invalid stack limit.`);
}
for (const module of modules) {
  assert.ok(module.construction?.baseProgressUnits > 0, `Module ${module.slug} is missing construction units.`);
  for (const prerequisite of module.prerequisites ?? []) {
    assert.ok(moduleSlugs.has(prerequisite), `Module ${module.slug} references unknown prerequisite ${prerequisite}.`);
  }
  for (const resource of Object.keys(module.construction.resources ?? {})) {
    assert.ok(resourceSlugs.has(resource), `Module ${module.slug} references unknown resource ${resource}.`);
  }
}
for (const wreck of wrecks) {
  assert.ok(['low', 'moderate', 'high', 'extreme'].includes(wreck.risk), `Invalid wreck risk: ${wreck.slug}`);
  assertIntegerRange(wreck.integrityRange, `Wreck ${wreck.slug} integrity range`);
  assertIntegerRange(wreck.lootBudgetRange, `Wreck ${wreck.slug} loot budget range`);
}

assert.match(station.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Initial station slug is invalid.');
assert.ok(station.storageUsed <= station.storageCapacity, 'Initial station storage exceeds capacity.');
for (const resource of Object.keys(station.resources ?? {})) {
  assert.ok(resourceSlugs.has(resource), `Initial station references unknown resource ${resource}.`);
}
const stationModuleSlugs = new Set();
for (const module of station.modules ?? []) {
  assert.ok(moduleSlugs.has(module.slug), `Initial station references unknown module ${module.slug}.`);
  assert.ok(!stationModuleSlugs.has(module.slug), `Initial station duplicates module ${module.slug}.`);
  stationModuleSlugs.add(module.slug);
  assert.ok(['locked', 'building', 'active', 'damaged', 'disabled', 'upgrading', 'seasonal'].includes(module.state), `Initial station module ${module.slug} has invalid state.`);
  assert.ok(Number.isInteger(module.progress) && module.progress >= 0 && module.progress <= 100, `Initial station module ${module.slug} has invalid progress.`);
  assert.ok(Number.isInteger(module.integrity) && module.integrity >= 0 && module.integrity <= 100, `Initial station module ${module.slug} has invalid integrity.`);
}

for (const season of seasons) {
  assert.ok(Date.parse(season.startsAt) < Date.parse(season.endsAt), `Season ${season.slug} has an invalid date range.`);
  assert.ok(themes[season.theme], `Season ${season.slug} references unknown theme ${season.theme}.`);
}
for (const [slug, action] of Object.entries(balance.pointActions ?? {})) {
  assert.ok(action.cost > 0, `Point action ${slug} must have a positive cost.`);
}
for (const [name, seconds] of Object.entries({
  salvage: balance.salvageCooldownSeconds,
  cargo: balance.cargoCooldownSeconds,
  override: balance.overrideCooldownSeconds
})) {
  assert.ok(Number.isInteger(seconds) && seconds >= 0, `${name} cooldown must be a nonnegative integer.`);
}
for (const [name, value] of Object.entries(balance.construction ?? {})) {
  assert.ok(Number.isInteger(value) && value >= 0, `Construction rule ${name} must be a nonnegative integer.`);
}
assert.ok(balance.construction?.scrapUnitsPerProgress > 0, 'Construction scrapUnitsPerProgress must be positive.');
assertUniqueSlugs(balance.expeditions ?? [], 'expedition');
for (const expedition of balance.expeditions ?? []) {
  assert.ok(['low', 'moderate', 'high', 'extreme'].includes(expedition.risk), `Invalid expedition risk: ${expedition.slug}`);
  assert.ok(Number.isInteger(expedition.fuelCost) && expedition.fuelCost >= 0, `Invalid expedition fuel cost: ${expedition.slug}`);
  assert.ok(Number.isInteger(expedition.minCrew) && expedition.minCrew >= 0, `Invalid expedition crew requirement: ${expedition.slug}`);
  assert.ok(expedition.durationMinutes[0] > 0 && expedition.durationMinutes[1] >= expedition.durationMinutes[0], `Invalid expedition duration: ${expedition.slug}`);
}
for (const event of events) {
  for (const action of event.actions ?? []) {
    if (action.type === 'spawnWreck' && action.params?.archetype) {
      assert.ok(wreckSlugs.has(action.params.archetype), `Event ${event.slug} references unknown wreck ${action.params.archetype}.`);
    }
  }
}

console.log(`Validated ${items.length} items, ${wrecks.length} wrecks, ${modules.length} modules, 1 initial station, ${events.length} events, ${seasons.length} seasons, ${Object.keys(themes).length} themes, and ${assets.assets.length} asset records.`);
