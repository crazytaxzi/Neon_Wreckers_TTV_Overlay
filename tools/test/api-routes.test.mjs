import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const routeRoot = 'apps/api/src/routes';
const expectedRoutes = [
  'GET /api/v1/admin/config',
  'GET /api/v1/auth/twitch/callback',
  'GET /api/v1/auth/twitch/start',
  'GET /api/v1/crew',
  'GET /api/v1/expeditions',
  'GET /api/v1/history',
  'GET /api/v1/integrations/streamelements/balance',
  'GET /api/v1/integrations/streamelements/health',
  'GET /api/v1/inventory',
  'GET /api/v1/marketplace/listings',
  'GET /api/v1/me',
  'GET /api/v1/notifications',
  'GET /api/v1/quarters',
  'GET /api/v1/ships',
  'GET /api/v1/station',
  'GET /api/v1/wrecks/current',
  'GET /api/v1/ws',
  'GET /health',
  'GET /metrics',
  'GET /ready',
  'POST /api/v1/admin/actions/spawn-wreck',
  'POST /api/v1/admin/config',
  'POST /api/v1/auth/logout',
  'POST /api/v1/construction/contribute',
  'POST /api/v1/expeditions/:id/claim',
  'POST /api/v1/expeditions/:id/resolve-now',
  'POST /api/v1/expeditions/launch',
  'POST /api/v1/points/actions/:actionSlug',
  'POST /api/v1/salvage/deploy',
  'POST /api/v1/salvage/scan'
].sort();

function routeSourceFiles() {
  return fs.readdirSync(routeRoot)
    .filter(file => file.endsWith('.ts'))
    .map(file => path.join(routeRoot, file))
    .concat('apps/api/src/app.ts');
}

test('public API route inventory remains complete and duplicate-free', () => {
  const routes = [];
  const pattern = /app\.(get|post|put|patch|delete)\('([^']+)'/g;
  for (const file of routeSourceFiles()) {
    const source = fs.readFileSync(file, 'utf8');
    for (const match of source.matchAll(pattern)) routes.push(`${match[1].toUpperCase()} ${match[2]}`);
  }

  assert.equal(new Set(routes).size, routes.length, 'Duplicate route declarations were found.');
  assert.deepEqual(routes.sort(), expectedRoutes);
});
