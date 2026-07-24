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
const gameArtwork = read('apps/web/src/components/GameArtwork.tsx');
const uiIndex = read('packages/ui/src/index.ts');
const controlContrast = read('packages/ui/src/control-contrast.css');

test('OBS overlay explicitly removes the full-canvas raster layer', () => {
  assert.match(overlayMain, /import '\.\/overlay\.css';[\s\S]*import '\.\/overlay-transparency\.css';/);
  assert.match(overlayTransparency, /\.broadcast-canvas::before/);
  assert.match(overlayTransparency, /content: none !important/);
  assert.match(overlayTransparency, /background: none !important/);
});

test('Rustlight Tug resolves to owned-ship artwork', () => {
  assert.match(fleetPage, /ship\.visualKey\?\.startsWith\('ship-'\)/);
  assert.match(gameArtwork, /rustlight-tug\.webp/);
  assert.match(gameArtwork, /rustlight-tug\.svg/);
  const artwork = 'apps/web/public/ships/base/rustlight-tug.svg';
  assert.ok(fs.existsSync(path.join(root, artwork)), `Missing Rustlight artwork: ${artwork}`);
  assert.ok(fs.statSync(path.join(root, artwork)).size > 4_000, 'Rustlight artwork is unexpectedly small.');
  assert.match(read(artwork), /<title id="title">Rustlight Tug<\/title>/);
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

test('raster-skinned controls retain readable foreground contrast', () => {
  assert.match(uiIndex, /import '\.\/raster-system\.css';[\s\S]*import '\.\/control-contrast\.css';/);
  assert.match(controlContrast, /\.nw-button--primary[\s\S]*color: #f2ffe9 !important/);
  assert.match(controlContrast, /\.nw-button:disabled[\s\S]*opacity: 0\.72 !important/);
  assert.match(controlContrast, /outline: 2px solid var\(--nw-color-cyan\) !important/);
});
