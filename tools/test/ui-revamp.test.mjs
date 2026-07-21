import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = path => readFile(new URL(`../../${path}`, import.meta.url), 'utf8');

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
