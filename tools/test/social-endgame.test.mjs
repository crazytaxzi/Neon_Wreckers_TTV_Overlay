import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync('apps/api/src/routes/endgame.ts', 'utf8');
const schema = fs.readFileSync('infrastructure/database/prisma/schema.prisma', 'utf8');
const player = fs.readFileSync('apps/web/src/pages/station.tsx', 'utf8');

test('phase three social endgame is durable and server-authoritative', () => {
  assert.match(schema, /seasonalTokens\s+Int\s+@default\(0\)/);
  assert.match(schema, /cosmetics\s+String\[\]\s+@default\(\[\]\)/);
  assert.match(source, /acquireTransactionLock\(transaction, `community-vote:/);
  assert.match(source, /acquireTransactionLock\(transaction, `player:\$\{user\.player\.id\}:seasonal-store`\)/);
  assert.match(source, /category: 'quarters-rating'/);
  assert.match(source, /prestigeTiers/);
});

test('phase three systems are visible and actionable in the player UI', () => {
  assert.match(player, /STATION PRESTIGE/);
  assert.match(player, /\/api\/v1\/endgame\/vote/);
  assert.match(player, /\/api\/v1\/endgame\/store\/\$\{item\.slug\}\/purchase/);
});
