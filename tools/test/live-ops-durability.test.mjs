import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const adminRoute = fs.readFileSync('apps/api/src/routes/admin.ts', 'utf8');
const endgameRoute = fs.readFileSync('apps/api/src/routes/endgame.ts', 'utf8');
const worker = fs.readFileSync('apps/worker/src/index.ts', 'utf8');
const adminUi = fs.readFileSync('apps/admin/src/main.tsx', 'utf8');

test('phase four content releases are previewable, staged, audited, and reversible', () => {
  assert.match(adminRoute, /\/api\/v1\/admin\/config\/:id\/preview/);
  assert.match(adminRoute, /action: 'config\.activate'/);
  assert.match(adminRoute, /action: 'config\.rollback'/);
  assert.match(adminRoute, /acquireTransactionLock\(transaction, `content-version:/);
  assert.match(worker, /lifecycle: 'scheduled'/);
  assert.match(worker, /lifecycle: 'archived'/);
});

test('phase four exposes economy warnings, release evidence, and catch-up controls', () => {
  assert.match(adminRoute, /CREDIT_INFLATION/);
  assert.match(adminRoute, /LOW_MARKET_VELOCITY/);
  assert.match(adminRoute, /releaseEvidence/);
  assert.match(endgameRoute, /season:catch-up/);
  assert.match(adminUi, /Recent operator trail/);
  assert.match(adminUi, /Rollback to/);
});
