import assert from 'node:assert/strict';
import test from 'node:test';
import {
  apiSuccessEnvelopeSchema,
  currentWreckSchema,
  historyRecordSchema,
  realtimeEventSchema,
  stationSnapshotSchema
} from '../../packages/contracts/src/index.ts';

const station = {
  id: 'station-1', slug: 'station-zero', name: 'Station Zero', level: 2,
  population: 42, power: 80, morale: 75, integrity: 90,
  storageCapacity: 500, storageUsed: 120, threatLevel: 'low', activeSeason: null,
  resources: { scrap: 12 }, modules: [], alerts: [], activeModifiers: [],
  museum: { collection: [], donatedToday: 0, dailyCapacity: 0 }
};

const salvageMode = {
  successChance: 0.8,
  scrapRange: [2, 5],
  electronicsChance: 0.1,
  fuelChance: 0.05,
  relicChance: 0.01,
  wreckLootRolls: 1,
  wreckLootChancePerRoll: 0.25,
  wreckLootPool: []
};

const wreck = {
  id: 'wreck-1', archetype: 'glass-horizon', name: 'Glass Horizon', risk: 'moderate', integrity: 63,
  description: 'A fractured freighter.', depleted: false, visualKey: 'wreck-glass-horizon',
  remainingLootBudget: 8, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  salvageProfile: { cutters: salvageMode, cargo: salvageMode }
};

const history = {
  id: 'history-1', category: 'salvage', title: 'Wreck located',
  body: 'Scanners found a salvage target.', actorDisplayName: null, details: {},
  createdAt: new Date().toISOString()
};

test('API success envelopes validate their payload schema', () => {
  const parsed = apiSuccessEnvelopeSchema(stationSnapshotSchema).parse({ data: station, requestId: 'req-1' });
  assert.equal(parsed.data.slug, 'station-zero');
});

test('realtime events are a discriminated union', () => {
  assert.equal(realtimeEventSchema.parse({ type: 'station.updated', station }).type, 'station.updated');
  assert.equal(realtimeEventSchema.parse({ type: 'wreck.updated', wreck }).type, 'wreck.updated');
  assert.equal(realtimeEventSchema.parse({ type: 'history.added', entry: history }).type, 'history.added');
  assert.equal(realtimeEventSchema.parse({ type: 'presence.updated', count: 3 }).type, 'presence.updated');
});

test('malformed API and realtime payloads are rejected', () => {
  assert.equal(apiSuccessEnvelopeSchema(currentWreckSchema).safeParse({ data: { id: 'wreck-1' } }).success, false);
  assert.equal(realtimeEventSchema.safeParse({ type: 'presence.updated', count: -1 }).success, false);
  assert.equal(realtimeEventSchema.safeParse({ type: 'station.updated', station: { name: 'unchecked' } }).success, false);
  assert.equal(historyRecordSchema.safeParse({ id: 'x', title: 'missing fields' }).success, false);
  assert.equal(realtimeEventSchema.safeParse({ type: 'unknown.event' }).success, false);
});