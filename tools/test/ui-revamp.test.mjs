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
  const [index, theme] = await Promise.all([read('packages/ui/src/index.ts'), read('packages/ui/src/theme.ts')]);
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
  for (const component of ['ResourceStrip','ActionTile','EntityCard','InventorySlot','InventoryGrid','DispatchBanner','EmptyState','LoadingState','OverlayTelemetryPanel','OverlayEventPopup']) assert.match(source, new RegExp(`export function ${component}`));
});

test('player artwork uses responsive project assets instead of concept screenshots', async () => {
  const [component, entry, stationPages, fleetPages] = await Promise.all([read('apps/web/src/components/GameArtwork.tsx'), read('apps/web/src/main.tsx'), read('apps/web/src/pages/station.tsx'), read('apps/web/src/pages/fleet.tsx')]);
  const assets = [...filesBelow('apps/web/public/station'), ...filesBelow('apps/web/public/wrecks'), ...filesBelow('apps/web/public/ships')].filter(file => file.endsWith('.webp'));
  const originals = assets.filter(file => !/-\d+w\.webp$/.test(file));
  const mobile = assets.filter(file => file.endsWith('-360w.webp'));
  const tablet = assets.filter(file => file.endsWith('-600w.webp'));
  assert.equal(originals.length, 31, 'Expected the 31 canonical project artwork sources.');
  assert.equal(mobile.length, 31, 'Every canonical artwork source needs a 360px mobile variant.');
  assert.equal(tablet.length, 31, 'Every canonical artwork source needs a 600px tablet variant.');
  assert.match(component, /srcSet=/);
  assert.match(component, /width=\{1200\}/);
  assert.match(component, /height=\{675\}/);
  assert.match(component, /loading=\{eager \? 'eager' : 'lazy'\}/);
  assert.match(component, /decoding="async"/);
  assert.match(entry, /import \{ Root \} from '\.\/app\.js';/);
  const artworkPages = `${stationPages}\n${fleetPages}`;
  assert.match(artworkPages, /import \{ GameArtwork \}/);
  assert.match(artworkPages, /<GameArtwork/);
  assert.ok(originals.includes('base/rustlight-tug.webp'));
  assert.match(fleetPages, /ship.visualKey/);
  assert.doesNotMatch(artworkPages, /<img[^>]+src=\{?`?\/?(?:station|wrecks|ships)\//);
});

test('overlay safety behavior remains present after decomposition', async () => {
  const [entry, components, assetManifest, network, css] = await Promise.all([read('apps/overlay/src/main.tsx'), read('apps/overlay/src/components.tsx'), read('apps/overlay/src/asset-manifest.ts'), read('apps/overlay/src/network.ts'), read('apps/overlay/src/overlay.css')]);
  assert.ok(entry.split('\n').length <= 120, 'Overlay entry should remain a small composition root.');
  assert.match(entry, /useAdaptiveOverlayNetwork/);
  assert.match(entry, /useOverlayHeadlines/);
  assert.match(entry, /StationTelemetry/);
  assert.match(entry, /DispatchRail/);
  assert.doesNotMatch(entry, /new WebSocket|requestApi|2_500/);
  assert.match(network, /realtimeEventSchema\.safeParse/);
  assert.match(network, /AbortController/);
  assert.match(network, /CONNECTED_RECONCILE_MS = 90_000/);
  assert.match(network, /DISCONNECTED_GRACE_MS = 5_000/);
  assert.match(network, /FALLBACK_POLL_MS = 10_000/);
  assert.match(network, /reconnectDelayMs/);
  assert.match(network, /controller\.stop/);
  assert.match(components, /wreck-schematic__art/);
  assert.match(components, /resolveRasterAsset/);
  assert.match(assetManifest, /manifest\.assets/);
  assert.match(assetManifest, /asset\.source\.kind !== 'raster'/);
  assert.doesNotMatch(components, /replace\('\.webp', '-(?:360|600)w\.webp'\)/);
  for (const component of ['StationTelemetry', 'WreckTelemetry', 'ViewerEventRegion', 'DispatchRail', 'FeedIndicator']) assert.match(components, new RegExp(`export function ${component}`));
  assert.match(css, /pointer-events:\s*none/);
  assert.match(css, /background:\s*transparent/);
});

test('player entry is split into behavior-preserving feature modules', async () => {
  const [entry, app, data, model, utilities, station, logistics, fleet, community] = await Promise.all([read('apps/web/src/main.tsx'),read('apps/web/src/app.tsx'),read('apps/web/src/game-data.ts'),read('apps/web/src/model.ts'),read('apps/web/src/page-utils.tsx'),read('apps/web/src/pages/station.tsx'),read('apps/web/src/pages/logistics.tsx'),read('apps/web/src/pages/fleet.tsx'),read('apps/web/src/pages/community.tsx')]);
  assert.ok(entry.split('\n').length <= 8);
  assert.match(entry, /<Root \/>/);
  assert.match(app, /import \{ useGameData \} from '\.\/game-data\.js';/);
  assert.match(app, /VITE_VISUAL_PREVIEW === '1' \? useVisualGameData : useGameData/);
  assert.match(app, /const game = useRuntimeGameData\(\)/);
  assert.doesNotMatch(app, /requestApi|new WebSocket|setInterval/);
  assert.match(data, /refreshInFlight/);
  assert.match(data, /Promise\.allSettled/);
  assert.match(data, /new WebSocket/);
  assert.match(data, /setInterval/);
  assert.match(data, /\/api\/v1\/station/);
  assert.match(data, /\/api\/v1\/player\/ws/);
  assert.match(model, /export type GameData/);
  assert.match(utilities, /export function cooldownRemaining/);
  for (const pageModule of [station, logistics, fleet, community]) assert.match(pageModule, /export function/);
});

test('player HTML entry points declare real device viewports', async () => {
  const [web, admin] = await Promise.all([read('apps/web/index.html'), read('apps/admin/index.html')]);
  for (const html of [web, admin]) {
    assert.match(html, /<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"/);
    assert.match(html, /<meta name="theme-color" content="#020406"/);
  }
});

test('concept-faithful player surfaces are implemented in live React pages', async () => {
  const [app, station, market, logistics, fleet, css] = await Promise.all([read('apps/web/src/app.tsx'),read('apps/web/src/pages/station.tsx'),read('apps/web/src/pages/community.tsx'),read('apps/web/src/pages/logistics.tsx'),read('apps/web/src/pages/fleet.tsx'),read('apps/web/src/styles.css')]);
  assert.match(app, /className="player-shell"/);
  assert.match(station, /command-center-grid/);
  assert.match(station, /salvage-console-grid/);
  assert.match(market, /market-console/);
  assert.match(market, /market-featured/);
  assert.match(logistics, /cargo-console/);
  assert.match(logistics, /fabrication-console/);
  assert.match(fleet, /fleet-console/);
  assert.match(fleet, /crew-console/);
  assert.match(fleet, /expedition-console/);
  for (const selector of ['.market-console__tabs','.market-featured','.cargo-slot-grid','.fabrication-card','.fleet-console__masthead','.crew-console__masthead','.expedition-console__masthead']) assert.ok(css.includes(selector), `Missing concept selector ${selector}`);
});

test('visual proof fixture is build-gated and cannot replace production data accidentally', async () => {
  const [app, fixture] = await Promise.all([read('apps/web/src/app.tsx'), read('apps/web/src/visual-preview.ts')]);
  assert.match(app, /VITE_VISUAL_PREVIEW === '1'/);
  assert.match(app, /useVisualGameData/);
  assert.match(app, /useGameData/);
  assert.match(fixture, /const previewGame: GameData/);
  assert.match(fixture, /action: async \(\) => undefined/);
  assert.match(fixture, /refresh: async \(\) => undefined/);
});
