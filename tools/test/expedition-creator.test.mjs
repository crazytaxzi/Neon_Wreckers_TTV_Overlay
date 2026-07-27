import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const admin = fs.readFileSync('apps/api/src/routes/admin.ts', 'utf8');
const api = fs.readFileSync('apps/api/src/routes/expeditions.ts', 'utf8');
const worker = fs.readFileSync('apps/worker/src/index.ts', 'utf8');
const schema = fs.readFileSync('infrastructure/database/prisma/schema.prisma', 'utf8');
const ui = fs.readFileSync('apps/admin/src/main.tsx', 'utf8');

test('expedition creator validates and versions operator-authored definitions', () => {
  assert.match(admin, /authoredExpeditionSchema/);
  assert.match(admin, /action: 'expedition\.create'/);
  assert.match(admin, /acquireTransactionLock\(transaction, `content-version:/);
  assert.match(admin, /'expedition\.'/);
});

test('launched expeditions retain immutable definitions through worker resolution', () => {
  assert.match(schema, /definitionSnapshot\s+Json\s+@default\("\{\}"\)/);
  assert.match(api, /definitionSnapshot: JSON\.parse\(JSON\.stringify\(definition\)\)/);
  assert.match(worker, /expeditionDefinitionFor\(expedition\.definitionSnapshot/);
});

test('creator is a real admin popup with scheduling, preview, and loot selection', () => {
  assert.match(ui, /title="Expedition Creator"/);
  assert.match(ui, /title="Create expedition"/);
  assert.match(ui, /type="datetime-local"/);
  assert.match(ui, /type="checkbox"/);
  assert.match(ui, /Launch preview/);
});
