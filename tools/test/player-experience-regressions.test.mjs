import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const overlayMain = read('apps/overlay/src/main.tsx');
const overlayTransparency = read('apps/overlay/src/overlay-transparency.css');
const apiApp = read('apps/api/src/app.ts');
const quartersRoute = read('apps/api/src/routes/quarters.ts');
const webApp = read('apps/web/src/app.tsx');
const quartersPage = read('apps/web/src/pages/quarters.tsx');
const fleetPage = read('apps/web/src/pages/fleet.tsx');

test('OBS overlay explicitly removes the full-canvas raster layer', () => {
  assert.match(overlayMain, /import '\.\/overlay\.css';[\s\S]*import '\.\/overlay-transparency\.css';/);
  assert.match(overlayTransparency, /\.broadcast-canvas::before/);
  assert.match(overlayTransparency, /content: none !important/);
  assert.match(overlayTransparency, /background: none !important/);
});

test('Rustlight Tug resolves to responsive owned-ship artwork', () => {
  assert.match(fleetPage, /ship\.visualKey\?\.startsWith\('ship-'\)/);
  for (const file of [
    'apps/web/public/ships/base/rustlight-tug.webp',
    'apps/web/public/ships/base/rustlight-tug-600w.webp',
    'apps/web/public/ships/base/rustlight-tug-360w.webp'
  ]) {
    assert.ok(fs.existsSync(path.join(root, file)), `Missing Rustlight artwork: ${file}`);
    assert.ok(fs.statSync(path.join(root, file)).size > 4_000, `Rustlight artwork is unexpectedly small: ${file}`);
  }
});

test('quarters expose functional fixture actions through the API and player surface', () => {
  assert.match(apiApp, /registerQuartersRoutes/);
  assert.match(apiApp, /await registerQuartersRoutes\(app, context\)/);
  assert.match(quartersRoute, /post\('\/api\/v1\/quarters\/use'/);
  for (const fixture of ['bed', 'relic-shelf', 'espresso-rig']) {
    assert.ok(quartersRoute.includes(`quarters:${fixture}`), `Missing persistent cooldown for ${fixture}`);
    assert.ok(quartersPage.includes(`key: '${fixture}'`), `Missing player fixture definition for ${fixture}`);
  }
  assert.match(webApp, /from '\.\/pages\/quarters\.js'/);
  assert.match(webApp, /quarters: <QuartersPage \{\.\.\.pageProps\} \/>/);
  assert.match(quartersPage, /\/api\/v1\/quarters\/use/);
});
