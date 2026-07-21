import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const read = file => readFile(new URL(`../../${file}`, import.meta.url), 'utf8');
const repositoryRoot = new URL('../../', import.meta.url);

function filesBelow(relativeDirectory) {
  const root = new URL(`${relativeDirectory}/`, repositoryRoot);
  const walk = directory => readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const child = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(child) : child;
  });
  return walk(root).map(file => path.relative(root.pathname, file).replaceAll(path.sep, '/'));
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
  const [component, player] = await Promise.all([
    read('apps/web/src/components/GameArtwork.tsx'),
    read('apps/web/src/main.tsx')
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
  assert.match(player, /import \{ GameArtwork \}/);
  assert.match(player, /<GameArtwork/);
  assert.doesNotMatch(player, /<img[^>]+src=\{?`?\/?(?:station|wrecks|ships)\//);
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
