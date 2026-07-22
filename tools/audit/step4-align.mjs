import { readFileSync, writeFileSync, rmSync } from 'node:fs';

const mainPath = 'apps/overlay/src/main.tsx';
let main = readFileSync(mainPath, 'utf8');
main = main.replace("\nconst API = '/api/v1';", '');
writeFileSync(mainPath, main);

const testPath = 'tools/test/ui-revamp.test.mjs';
let test = readFileSync(testPath, 'utf8');
const before = `test('overlay safety behavior remains present', async () => {
  const [source, css] = await Promise.all([
    read('apps/overlay/src/main.tsx'),
    read('apps/overlay/src/overlay.css')
  ]);

  assert.match(source, /realtimeEventSchema\\.safeParse/);
  assert.match(source, /contract validation failed/i);
  assert.match(source, /Promise\\.allSettled/);
  assert.match(source, /reconnectTimer/);
  assert.match(source, /currentWreckSchema/);
  assert.match(source, /wreck-schematic__art/);
  assert.match(source, /wreckArtworkSrc/);
  assert.match(css, /pointer-events:\\s*none/);
  assert.match(css, /background:\\s*transparent/);
});`;
const after = `test('overlay safety behavior remains present', async () => {
  const [source, network, css] = await Promise.all([
    read('apps/overlay/src/main.tsx'),
    read('apps/overlay/src/network.ts'),
    read('apps/overlay/src/overlay.css')
  ]);

  assert.match(source, /useAdaptiveOverlayNetwork/);
  assert.doesNotMatch(source, /new WebSocket|requestApi|2_500/);
  assert.match(network, /realtimeEventSchema\\.safeParse/);
  assert.match(network, /AbortController/);
  assert.match(network, /CONNECTED_RECONCILE_MS = 90_000/);
  assert.match(network, /DISCONNECTED_GRACE_MS = 5_000/);
  assert.match(network, /FALLBACK_POLL_MS = 10_000/);
  assert.match(network, /reconnectDelayMs/);
  assert.match(network, /controller\\.stop/);
  assert.match(source, /wreck-schematic__art/);
  assert.match(source, /wreckArtworkSrc/);
  assert.match(css, /pointer-events:\\s*none/);
  assert.match(css, /background:\\s*transparent/);
});`;
if (!test.includes(before)) throw new Error('Overlay safety test block did not match');
test = test.replace(before, after);
writeFileSync(testPath, test);

const cssPath = 'apps/overlay/src/overlay.css';
let css = readFileSync(cssPath, 'utf8');
css = css.replace(
  '.feed-indicator.connected span { background: var(--nw-color-green); box-shadow: 0 0 9px var(--nw-color-green); }',
  `.feed-indicator.live span { background: var(--nw-color-green); box-shadow: 0 0 9px var(--nw-color-green); }
.feed-indicator.stale span { background: var(--nw-color-orange); box-shadow: 0 0 9px var(--nw-color-orange); }
.feed-indicator.offline span { background: var(--nw-color-red); box-shadow: 0 0 9px var(--nw-color-red); }
.feed-indicator.connecting span,
.feed-indicator.reconnecting span { animation: feed-pulse 1.2s ease-in-out infinite alternate; }`
);
css = css.replace('@keyframes tactical-spin', '@keyframes feed-pulse { from { opacity: .35; } to { opacity: 1; } }\n@keyframes tactical-spin');
writeFileSync(cssPath, css);

rmSync('tools/audit/step4-align.mjs');
rmSync('.github/workflows/audit-step4-align.yml');
