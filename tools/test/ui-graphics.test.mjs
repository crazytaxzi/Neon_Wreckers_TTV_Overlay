import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = file => readFile(new URL(`../../${file}`, import.meta.url), 'utf8');

test('player admin and overlay load one synchronized graphics system', async () => {
  const [index, bundle, admin, overlay] = await Promise.all([
    read('packages/ui/src/index.ts'),
    read('packages/ui/src/bundle.css'),
    read('apps/admin/src/admin.css'),
    read('apps/overlay/src/overlay.css')
  ]);

  for (const layer of ['graphics.css', 'illustration.css', 'brand-art.css', 'accessibility-polish.css', 'showcase-graphics.css', 'viewer-event.css']) {
    assert.match(index, new RegExp(`import './${layer.replace('.', '\\.')}'`));
    assert.match(bundle, new RegExp(`@import './${layer.replace('.', '\\.')}'`));
  }

  assert.match(admin, /@import '\.\/admin-graphics\.css';/);
  assert.match(overlay, /@import '\.\/overlay-graphics\.css';/);
});

test('core game vocabulary uses native Neon Wreckers SVG glyphs', async () => {
  const icons = await read('packages/ui/src/icons.tsx');

  for (const glyph of [
    'WreckerSkull',
    'StationGlyph',
    'WreckGlyph',
    'SalvageGlyph',
    'CrateGlyph',
    'CrewGlyph',
    'MarketGlyph',
    'ConstructionGlyph',
    'BroadcastGlyph',
    'DangerGlyph'
  ]) {
    assert.match(icons, new RegExp(`const ${glyph} = forwardRef`));
  }

  for (const mapping of [
    'station: StationGlyph',
    'crew: CrewGlyph',
    'wreck: WreckGlyph',
    'danger: DangerGlyph',
    'trade: MarketGlyph',
    'inventory: CrateGlyph',
    'resources: CrateGlyph',
    'salvage: SalvageGlyph',
    'construction: ConstructionGlyph',
    'market: MarketGlyph',
    'wrecker: WreckerSkull'
  ]) {
    assert.ok(icons.includes(mapping), `Missing native glyph mapping: ${mapping}`);
  }
});

test('illustrated layers retain accessibility and low-effects fallbacks', async () => {
  const [illustration, brand, accessibility, admin, overlay, viewerEvent] = await Promise.all([
    read('packages/ui/src/illustration.css'),
    read('packages/ui/src/brand-art.css'),
    read('packages/ui/src/accessibility-polish.css'),
    read('apps/admin/src/admin-graphics.css'),
    read('apps/overlay/src/overlay-graphics.css'),
    read('packages/ui/src/viewer-event.css')
  ]);

  for (const css of [illustration, brand, admin, overlay, viewerEvent]) assert.match(css, /forced-colors: active/);
  for (const css of [illustration, admin, overlay, viewerEvent]) assert.match(css, /data-low-effects="true"/);
  assert.match(accessibility, /:focus-visible/);
  assert.match(accessibility, /@supports not selector\(:focus-visible\)/);
  assert.match(overlay, /pointer-events free|pointer-events/i);
  assert.match(viewerEvent, /prefers-reduced-motion: reduce/);
});

test('admin UI Library documents graphic language and rarity hardware', async () => {
  const [showcase, showcaseCss] = await Promise.all([
    read('packages/ui/src/showcase.tsx'),
    read('packages/ui/src/showcase-graphics.css')
  ]);

  assert.match(showcase, /id: 'graphics', label: 'Graphic Language'/);
  assert.match(showcase, /Neon Wreckers Graphic Language/);
  assert.match(showcase, /Inventory Frame Ladder/);
  assert.match(showcase, /graphicGlyphs\.map/);
  assert.match(showcaseCss, /\.nw-glyph-swatch/);
  assert.match(showcaseCss, /\.nw-rarity-demo/);
});

test('viewer event popups use real classified overlay history through focused components', async () => {
  const [overlaySource, componentsSource, headlinesSource, networkSource, viewerCss] = await Promise.all([
    read('apps/overlay/src/main.tsx'),
    read('apps/overlay/src/components.tsx'),
    read('apps/overlay/src/use-overlay-headlines.ts'),
    read('apps/overlay/src/network.ts'),
    read('packages/ui/src/viewer-event.css')
  ]);

  assert.match(overlaySource, /ViewerEventRegion/);
  assert.match(overlaySource, /useOverlayHeadlines/);
  assert.match(overlaySource, /useAdaptiveOverlayNetwork/);
  assert.match(componentsSource, /OverlayEventPopup/);
  assert.match(componentsSource, /headline\.severity !== 'viewer'/);
  assert.match(componentsSource, /className="viewer-event-region"/);
  assert.match(headlinesSource, /headlineFromHistory/);
  assert.match(networkSource, /event\.type === 'presence\.updated'/);
  assert.match(networkSource, /event\.type === 'history\.added'/);
  assert.match(viewerCss, /\.viewer-event-region/);
  assert.match(viewerCss, /pointer-events: none/);
});

test('visual proof responsibilities are separated without fake production APIs', async () => {
  const [playerProof, surfaceProof, captureDriver] = await Promise.all([
    read('.github/workflows/ui-visual-proof.yml'),
    read('.github/workflows/ui-admin-overlay-proof.yml'),
    read('tools/visual-proof/capture-admin-overlay.mjs')
  ]);

  assert.match(playerProof, /Build deterministic player preview/);
  assert.doesNotMatch(playerProof, /Inject deterministic admin and overlay preview data/);
  assert.match(surfaceProof, /Capture real built admin and overlay surfaces/);
  assert.match(surfaceProof, /tools\/visual-proof\/capture-admin-overlay\.mjs/);
  assert.match(surfaceProof, /admin-overlay-visual-proof/);
  assert.match(surfaceProof, /contents: read/);
  assert.doesNotMatch(surfaceProof, /contents: write/);

  assert.match(captureDriver, /page\.route/);
  assert.match(captureDriver, /JSON\.stringify\(\{ data:/);
  assert.match(captureDriver, /width:\s*3840,\s*height:\s*2160/);
  assert.match(captureDriver, /viewer-event-1080p/);
  assert.match(captureDriver, /Graphic Language/);
  assert.match(captureDriver, /nw-skip-link\{display:none!important\}/);
});
