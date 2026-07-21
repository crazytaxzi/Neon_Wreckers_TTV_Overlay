import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const read = file => readFile(new URL(`../../${file}`, import.meta.url), 'utf8');
const repositoryRoot = fileURLToPath(new URL('../../', import.meta.url));

function filesBelow(relativeDirectory) {
  const root = path.join(repositoryRoot, relativeDirectory);
  const walk = directory => readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const child = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(child) : child;
  });
  return walk(root).map(file => path.relative(root, file).replaceAll(path.sep, '/'));
}

test('shared UI loads the canonical revamp stylesheet and stream theme', async () => {
  const [index, theme] = await Promise.all([
    read('packages/ui/src/index.ts'),
    read('packages/ui/src/theme.ts')
  ]);

  assert.match(index, /import '\.\/revamp\.css';/);
  assert.match(theme, /export const streamTheme/);
  assert.match(theme, /export const defaultTheme = streamTheme/);
  assert.match(theme, /highContrastTheme/);
});

test('player navigation exposes exactly five primary mobile destinations', async () => {
  const source = await read('packages/ui/src/components.tsx');
  const labels = [...source.matchAll(/mobileButton\([^,]+, '([^']+)'/g)].map(match => match[1]);

  assert.deepEqual(labels, ['Home', 'Salvage', 'Station', 'Market', 'Profile']);
  assert.match(source, /playerStationGroup/);
  assert.match(source, /playerProfileGroup/);
  assert.match(source, /nw-mobile-nav-sheet/);
});

test('responsive and effects contracts include safe areas and low-effects fallbacks', async () => {
  const css = await read('packages/ui/src/revamp.css');

  assert.match(css, /env\(safe-area-inset-bottom\)/);
  assert.match(css, /data-low-effects="true"/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /prefers-reduced-data: reduce/);
  assert.match(css, /forced-colors: active/);
  assert.match(css, /max-height: 520px/);
  assert.match(css, /grid-template-columns: repeat\(5/);
});

test('shared component contract includes player, admin, and overlay primitives', async () => {
  const source = await read('packages/ui/src/components.tsx');
  for (const component of [
    'ResourceStrip',
    'ActionTile',
    'EntityCard',
    'InventorySlot',
    'InventoryGrid',
    'DispatchBanner',
    'EmptyState',
    'LoadingState',
    'OverlayTelemetryPanel',
    'OverlayEventPopup'
  ]) {
    assert.match(source, new RegExp(`export function ${component}`));
  }
});

test('player artwork uses responsive project assets instead of concept screenshots', async () => {
  const [component, entry, stationPages, fleetPages] = await Promise.all([
    read('apps/web/src/components/GameArtwork.tsx'),
    read('apps/web/src/main.tsx'),
    read('apps/web/src/pages/station.tsx'),
    read('apps/web/src/pages/fleet.tsx')
  ]);
  const assets = [
    ...filesBelow('apps/web/public/station'),
    ...filesBelow('apps/web/public/wrecks'),
    ...filesBelow('apps/web/public/ships')
  ].filter(file => file.endsWith('.webp'));
  const originals = assets.filter(file => !/-\d+w\.webp$/.test(file));
  const mobile = assets.filter(file => file.endsWith('-360w.webp'));
  const tablet = assets.filter(file => file.endsWith('-600w.webp'));

  assert.equal(originals.length, 30, 'Expected the 30 canonical project artwork sources.');
  assert.equal(mobile.length, 30, 'Every canonical artwork source needs a 360px mobile variant.');
  assert.equal(tablet.length, 30, 'Every canonical artwork source needs a 600px tablet variant.');
  assert.match(component, /srcSet=/);
  assert.match(component, /width=\{1200\}/);
  assert.match(component, /height=\{675\}/);
  assert.match(component, /loading=\{eager \? 'eager' : 'lazy'\}/);
  assert.match(component, /decoding="async"/);
  assert.match(entry, /import \{ Root \} from '.\/app\.js';/);
  const artworkPages = `${stationPages}\n${fleetPages}`;
  assert.match(artworkPages, /import \{ GameArtwork \}/);
  assert.match(artworkPages, /<GameArtwork/);
  assert.doesNotMatch(artworkPages, /<img[^>]+src=\{?`?\/?(?:station|wrecks|ships)\//);
});

test('overlay safety behavior remains present', async () => {
  const [source, css] = await Promise.all([
    read('apps/overlay/src/main.tsx'),
    read('apps/overlay/src/overlay.css')
  ]);

  assert.match(source, /malformed packet must not take down a live stream overlay/i);
  assert.match(source, /Promise\.allSettled/);
  assert.match(source, /reconnectTimer/);
  assert.match(css, /pointer-events:\s*none/);
  assert.match(css, /background:\s*transparent/);
});


test('player entry is split into behavior-preserving feature modules', async () => {
  const [entry, app, data, model, utilities, station, logistics, fleet, community] = await Promise.all([
    read('apps/web/src/main.tsx'),
    read('apps/web/src/app.tsx'),
    read('apps/web/src/game-data.ts'),
    read('apps/web/src/model.ts'),
    read('apps/web/src/page-utils.tsx'),
    read('apps/web/src/pages/station.tsx'),
    read('apps/web/src/pages/logistics.tsx'),
    read('apps/web/src/pages/fleet.tsx'),
    read('apps/web/src/pages/community.tsx')
  ]);

  assert.ok(entry.split('\n').length <= 8, 'The browser entry should stay a minimal bootstrap file.');
  assert.match(entry, /<Root \/>/);
  assert.match(app, /useGameData\(\)/);
  assert.doesNotMatch(app, /requestApi|new WebSocket|setInterval/);
  assert.match(data, /refreshInFlight/);
  assert.match(data, /Promise\.allSettled/);
  assert.match(data, /new WebSocket/);
  assert.match(data, /setInterval/);
  assert.match(data, /\/api\/v1\/station/);
  assert.match(data, /\/api\/v1\/player\/ws/);
  assert.match(model, /export type GameData/);
  assert.match(utilities, /export function cooldownRemaining/);
  for (const pageModule of [station, logistics, fleet, community]) {
    assert.match(pageModule, /export function/);
  }
});
