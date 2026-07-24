import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const routeRoot = 'apps/api/src/routes';
const expectedRoutes = [
  'GET /api/v1/admin/config',
  'GET /api/v1/admin/overview',
  'GET /api/v1/admin/players',
  'GET /api/v1/admin/transactions',
  'GET /api/v1/auction/listings',
  'GET /api/v1/auth/twitch/callback',
  'GET /api/v1/auth/twitch/start',
  'GET /api/v1/cooldowns',
  'GET /api/v1/crafting/recipes',
  'GET /api/v1/crew',
  'GET /api/v1/expeditions',
  'GET /api/v1/expeditions/definitions',
  'GET /api/v1/history',
  'GET /api/v1/integrations/streamelements/balance',
  'GET /api/v1/integrations/streamelements/health',
  'GET /api/v1/integrations/twitch/health',
  'GET /api/v1/inventory',
  'GET /api/v1/items/catalog',
  'GET /api/v1/marketplace/listings',
  'GET /api/v1/me',
  'GET /api/v1/notifications',
  'GET /api/v1/player/ws',
  'GET /api/v1/quarters',
  'GET /api/v1/ships',
  'GET /api/v1/station',
  'GET /api/v1/wrecks/current',
  'GET /api/v1/ws',
  'GET /health',
  'GET /internal/metrics',
  'GET /ready',
  'POST /api/v1/admin/actions/spawn-wreck',
  'POST /api/v1/admin/config',
  'POST /api/v1/admin/events/:slug/reset',
  'POST /api/v1/admin/events/:slug/trigger',
  'POST /api/v1/admin/players/:id/adjust',
  'POST /api/v1/admin/players/:id/cooldowns/reset',
  'POST /api/v1/admin/transactions/:id/refund',
  'POST /api/v1/auction/:id/buy',
  'POST /api/v1/auction/:id/cancel',
  'POST /api/v1/auction/list',
  'POST /api/v1/auth/logout',
  'POST /api/v1/construction/contribute',
  'POST /api/v1/construction/start',
  'POST /api/v1/crafting/craft',
  'POST /api/v1/crew/:id/train',
  'POST /api/v1/crew/recruit',
  'POST /api/v1/expeditions/:id/claim',
  'POST /api/v1/expeditions/:id/resolve-now',
  'POST /api/v1/expeditions/launch',
  'POST /api/v1/integrations/twitch/eventsub',
  'POST /api/v1/integrations/twitch/subscribe',
  'POST /api/v1/marketplace/buy',
  'POST /api/v1/marketplace/sell',
  'POST /api/v1/museum/donate',
  'POST /api/v1/notifications/:id/read',
  'POST /api/v1/notifications/read-all',
  'POST /api/v1/player/career',
  'POST /api/v1/points/actions/:actionSlug',
  'POST /api/v1/quarters',
  'POST /api/v1/quarters/use',
  'POST /api/v1/salvage/deploy',
  'POST /api/v1/salvage/scan',
  'POST /api/v1/ships/:id/refuel',
  'POST /api/v1/ships/:id/rename',
  'POST /api/v1/ships/:id/repair',
  'POST /api/v1/ships/:id/skin',
  'POST /api/v1/ships/:id/upgrade',
  'POST /api/v1/ships/purchase',
  'POST /api/v1/station/maintain',
  'POST /api/v1/station/refine'
].sort();

function routeSourceFiles() {
  return fs.readdirSync(routeRoot)
    .filter(file => file.endsWith('.ts'))
    .map(file => path.join(routeRoot, file))
    .concat('apps/api/src/app.ts');
}

test('public API route inventory remains complete and duplicate-free', () => {
  const routes = [];
  const pattern = /\w+\.(get|post|put|patch|delete)\('([^']+)'/g;
  for (const file of routeSourceFiles()) {
    const source = fs.readFileSync(file, 'utf8');
    for (const match of source.matchAll(pattern)) routes.push(`${match[1].toUpperCase()} ${match[2]}`);
  }

  assert.equal(new Set(routes).size, routes.length, 'Duplicate route declarations were found.');
  assert.deepEqual(routes.sort(), expectedRoutes);
});
