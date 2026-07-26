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
const communityPage = read('apps/web/src/pages/community.tsx');
const playerHeader = read('apps/web/src/components/PlayerHeader.tsx');
const playerStyles = read('apps/web/src/styles.css');
const gameArtwork = read('apps/web/src/components/GameArtwork.tsx');
const uiIndex = read('packages/ui/src/index.ts');
const uiStyles = read('packages/ui/src/styles.css');
const controlContrast = read('packages/ui/src/control-contrast.css');

test('OBS overlay explicitly removes the full-canvas raster layer', () => {
  assert.match(overlayMain, /import '\.\/overlay\.css';[\s\S]*import '\.\/overlay-transparency\.css';/);
  assert.match(overlayTransparency, /\.broadcast-canvas::before/);
  assert.match(overlayTransparency, /content: none !important/);
  assert.match(overlayTransparency, /background: none !important/);
});

test('Rustlight Tug uses the final generated ship portrait as its primary artwork', () => {
  assert.match(fleetPage, /ship\.visualKey\?\.startsWith\(["']ship-["']\)/);
  assert.match(gameArtwork, /function primaryArtwork/);
  assert.match(gameArtwork, /rustlight-tug\.webp'[\s\S]*rustlight-tug\.svg/);

  const artwork = 'apps/web/public/ships/base/rustlight-tug.svg';
  const source = read(artwork);
  assert.ok(fs.existsSync(path.join(root, artwork)), `Missing Rustlight artwork: ${artwork}`);
  assert.match(source, /<title id="title">Rustlight Tug<\/title>/);
  assert.doesNotMatch(source, /RUSTLIGHT INDUSTRIAL FRAME/);

  const embedded = source.match(/data:image\/webp;base64,([^"\s]+)/)?.[1];
  assert.ok(embedded, 'Rustlight portrait does not contain the generated WebP image.');
  const decoded = Buffer.from(embedded, 'base64');
  assert.ok(decoded.length > 8_000, 'Embedded Rustlight portrait is unexpectedly small.');
  assert.equal(decoded.subarray(0, 4).toString('ascii'), 'RIFF');
  assert.equal(decoded.subarray(8, 12).toString('ascii'), 'WEBP');
});

test('quarters expose functional fixture actions through the API and player surface', () => {
  assert.match(apiApp, /registerQuartersRoutes/);
  assert.match(apiApp, /await registerQuartersRoutes\(app, context\)/);
  assert.match(quartersRoute, /post\('\/api\/v1\/quarters\/use'/);
  for (const fixture of ['bed', 'relic-shelf', 'espresso-rig']) {
    assert.ok(quartersRoute.includes(`quarters:${fixture}`), `Missing persistent cooldown for ${fixture}`);
    assert.match(
      quartersPage,
      new RegExp(`key: ["']${fixture}["']`),
      `Missing player fixture definition for ${fixture}`,
    );
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

test('crew star ratings cannot pass a negative count to String.repeat', () => {
  assert.match(
    fleetPage,
    /Math\.min\(\s*5,\s*Math\.max\(\s*0,\s*Math\.trunc\(/,
  );
  assert.match(fleetPage, /formatCrewStars\(member\.jobStars\)/);
  assert.match(fleetPage, /formatCrewStars\(member\.talentStars\)/);
  assert.doesNotMatch(fleetPage, /'☆'\.repeat\(5 - value\)/);
});

test('Sell From Hold supports multi-item station sales and player auctions', () => {
  assert.match(communityPage, /title="Sell From Hold"/);
  assert.match(communityPage, />\s*Sell to Station\s*</);
  assert.match(communityPage, />\s*Create Auction\s*</);
  assert.match(
    communityPage,
    /"\/api\/v1\/marketplace\/sell"[\s\S]*\{ itemSlug: sellItem, quantity: sellQuantity \}/,
  );
});

test('tall modal bodies remain scrollable within the visible viewport', () => {
  assert.match(
    uiStyles,
    /\.nw-modal\s*\{[\s\S]*grid-template-rows: auto minmax\(0, 1fr\) auto/,
  );
  assert.match(
    uiStyles,
    /\.nw-modal__body\s*\{[\s\S]*min-height: 0;[\s\S]*overflow-y: auto/,
  );
  assert.match(uiStyles, /max-height: min\(calc\(100dvh - 2rem\), 50rem\)/);
});

test('tablet and mobile headers keep actions, resync, and profile reachable', () => {
  assert.match(playerHeader, /className="player-header-action"/);
  assert.match(playerHeader, /className="player-header-resync"/);
  assert.match(
    playerStyles,
    /@media \(min-width: 761px\) and \(max-width: 1100px\)[\s\S]*\.player-profile-button \{ display: block/,
  );
  assert.match(
    playerStyles,
    /@media \(max-width: 760px\)[\s\S]*\.player-header-tools > \.nw-tooltip,[\s\S]*\.player-profile-button \{ display: block/,
  );
});
