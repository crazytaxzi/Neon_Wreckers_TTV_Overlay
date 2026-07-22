import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const write = (relative, content) => fs.writeFileSync(path.join(root, relative), content);

function replaceOnce(content, before, after, label) {
  if (!content.includes(before)) throw new Error(`Missing ${label}`);
  return content.replace(before, after);
}

function replaceExactCount(content, before, after, expected, label) {
  const count = content.split(before).length - 1;
  if (count !== expected) throw new Error(`${label}: expected ${expected} matches, found ${count}`);
  return content.split(before).join(after);
}

function appendOnce(content, marker, addition) {
  return content.includes(marker) ? content : `${content.trimEnd()}\n${addition.trim()}\n`;
}

// Decode the production Rustlight Tug artwork and responsive variants.
const rustlightBytes = Buffer.from(read('tools/image-first/rustlight-tug.webp.b64').trim(), 'base64');
for (const destination of [
  'apps/web/public/ships/base/rustlight-tug.webp',
  'apps/web/public/ships/base/rustlight-tug-600w.webp',
  'apps/web/public/ships/base/rustlight-tug-360w.webp'
]) {
  fs.mkdirSync(path.dirname(path.join(root, destination)), { recursive: true });
  fs.writeFileSync(path.join(root, destination), rustlightBytes);
}

// Use server-provided ship visualKey values, including the starter Rustlight Tug.
{
  const file = 'apps/web/src/pages/fleet.tsx';
  let content = read(file);
  const importLine = "import { formatCountdown, cooldownRemaining, toneForValue, riskTone, rarityTone, expeditionTone } from '../page-utils.js';\n";
  const helpers = `\nfunction shipArtworkSrc(ship: Ship): string | null {\n    if (ship.activeSkin) return \`/ships/skins/\${ship.activeSkin}.webp\`;\n    if (ship.visualKey?.startsWith('ship-')) return \`/ships/base/\${ship.visualKey.slice('ship-'.length)}.webp\`;\n    if ([\"salvage-skiff\", \"cargo-hauler\"].includes(ship.classSlug)) return \`/ships/base/\${ship.classSlug}.webp\`;\n    return null;\n}\n\nfunction FleetShipArtwork({ ship, className }: { ship: Ship; className?: string }) {\n    const src = shipArtworkSrc(ship);\n    return src\n        ? <GameArtwork className={className} src={src} alt={\`\${ship.name} ship\`} sizes=\"(max-width: 760px) 88vw, 28rem\" />\n        : <NWIcon name=\"expedition\" size={50} />;\n}\n`;
  content = replaceOnce(content, importLine, importLine + helpers, 'fleet artwork helper insertion');
  const oldConditional = `{ship.activeSkin ? <GameArtwork src={\`/ships/skins/\${ship.activeSkin}.webp\`} alt={\`\${ship.name} premium frame\`} sizes=\"(max-width: 760px) 88vw, 28rem\"/> : [\"salvage-skiff\", \"cargo-hauler\"].includes(ship.classSlug) ? <GameArtwork src={\`/ships/base/\${ship.classSlug}.webp\`} alt={\`\${ship.name} base frame\`} sizes=\"(max-width: 760px) 88vw, 28rem\"/> : <NWIcon name=\"expedition\" size={50}/>} `;
  const exactConditional = oldConditional.trimEnd();
  content = replaceExactCount(content, exactConditional, '{<FleetShipArtwork ship={ship} />}', 2, 'fleet artwork conditional replacement');
  content = replaceOnce(
    content,
    '{selected && <Panel tone="purple" depth="high" className="fleet-management-console"><SectionTitle eyebrow="SELECTED SHIP"',
    '{selected && <Panel tone="purple" depth="high" className="fleet-management-console"><div className="fleet-management-console__art"><FleetShipArtwork ship={selected} className="management-preview" /></div><SectionTitle eyebrow="SELECTED SHIP"',
    'selected ship artwork insertion'
  );
  write(file, content);
}

// Render the real current wreck artwork in OBS using the existing API visualKey.
{
  const file = 'apps/overlay/src/main.tsx';
  let content = read(file);
  content = replaceOnce(
    content,
    'type Wreck = { id?: string; name?: string; risk?: string; integrity?: number; description?: string };',
    'type Wreck = { id?: string; name?: string; risk?: string; integrity?: number; description?: string; visualKey?: string };',
    'overlay Wreck visualKey type'
  );
  const compactFunction = `function compactNumber(value: unknown): string {\n  const numeric = Number(value ?? 0);\n  if (!Number.isFinite(numeric)) return '0';\n  return Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(numeric);\n}\n`;
  const wreckHelper = `\nfunction wreckArtworkSrc(wreck: Wreck | null): string | null {\n  const visualKey = String(wreck?.visualKey ?? '').trim();\n  if (!visualKey) return null;\n  const slug = visualKey.startsWith('wreck-') ? visualKey.slice('wreck-'.length) : visualKey;\n  return \`/wrecks/\${slug}.webp\`;\n}\n`;
  content = replaceOnce(content, compactFunction, compactFunction + wreckHelper, 'overlay wreck artwork helper');
  content = replaceOnce(
    content,
    "  const credits = station?.resources?.credits ?? station?.resources?.credit ?? 0;\n  const utc = useMemo(() => clock.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' }), [clock]);",
    "  const credits = station?.resources?.credits ?? station?.resources?.credit ?? 0;\n  const wreckArtwork = wreckArtworkSrc(wreck);\n  const utc = useMemo(() => clock.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' }), [clock]);",
    'overlay wreck artwork state'
  );
  content = replaceOnce(
    content,
    '<div className="wreck-schematic" aria-hidden="true"><div className="scan-grid" /><span className="scan-ring scan-ring-outer" /><span className="scan-ring scan-ring-inner" /><NWIcon name="wreck" size={48} /></div>',
    '<div className="wreck-schematic" aria-hidden="true"><div className="scan-grid" /><span className="scan-ring scan-ring-outer" /><span className="scan-ring scan-ring-inner" />{wreckArtwork ? <img className="wreck-schematic__art" src={wreckArtwork} srcSet={`${wreckArtwork.replace(\'.webp\', \'-360w.webp\')} 360w, ${wreckArtwork.replace(\'.webp\', \'-600w.webp\')} 600w, ${wreckArtwork} 1200w`} sizes="(max-width: 1280px) 18rem, 24rem" alt="" loading="eager" decoding="async" /> : <NWIcon name="wreck" size={48} />}</div>',
    'overlay wreck artwork render'
  );
  write(file, content);
}

// Add image-first ship and wreck presentation styles.
{
  const file = 'apps/web/src/player-graphics.css';
  let content = read(file);
  content = appendOnce(content, '/* Image-first owned ship presentation */', `
/* Image-first owned ship presentation */
.player-shell .fleet-management-console__art {
  position: relative;
  min-height: clamp(12rem, 32vw, 22rem);
  margin: -1rem -1rem 1rem;
  overflow: hidden;
  border-block-end: 1px solid rgba(var(--nw-color-green-rgb), 0.38);
  background: var(--nw-color-void);
  clip-path: polygon(0.8rem 0, 100% 0, 100% calc(100% - 0.8rem), calc(100% - 0.8rem) 100%, 0 100%, 0 0.8rem);
}

.player-shell .fleet-management-console__art::after {
  position: absolute;
  inset: 0;
  content: "";
  pointer-events: none;
  background:
    linear-gradient(180deg, transparent 55%, rgba(var(--nw-color-void-rgb), 0.86)),
    linear-gradient(90deg, rgba(var(--nw-color-green-rgb), 0.08), transparent 26%, transparent 74%, rgba(var(--nw-color-purple-rgb), 0.08));
}

.player-shell .fleet-management-console__art > img {
  width: 100%;
  height: 100%;
  min-height: inherit;
  object-fit: cover;
  object-position: center;
  filter: saturate(1.08) contrast(1.04);
}

.player-shell .ship-card__schematic > img {
  filter: saturate(1.06) brightness(0.88) contrast(1.04);
}

@media (max-width: 760px) {
  .player-shell .fleet-management-console__art { min-height: 12rem; }
}`);
  write(file, content);
}

{
  const file = 'apps/overlay/src/overlay.css';
  let content = read(file);
  content = appendOnce(content, '/* Real current-wreck artwork from the server-provided visualKey. */', `
/* Real current-wreck artwork from the server-provided visualKey. */
.wreck-schematic__art {
  position: absolute;
  z-index: 1;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  opacity: 0.92;
  filter: saturate(1.08) contrast(1.08) brightness(0.82);
}

.wreck-schematic .scan-grid { z-index: 2; mix-blend-mode: screen; }
.wreck-schematic .scan-ring { z-index: 3; }
.wreck-schematic > svg { position: relative; z-index: 2; }

.wreck-schematic:has(.wreck-schematic__art)::before {
  position: absolute;
  z-index: 2;
  inset: 0;
  content: "";
  pointer-events: none;
  background:
    linear-gradient(180deg, rgba(var(--nw-color-void-rgb), 0.08), transparent 52%, rgba(var(--nw-color-void-rgb), 0.72)),
    radial-gradient(circle at center, transparent 28%, rgba(var(--nw-color-void-rgb), 0.32) 100%);
}

@media (min-height: 800px) {
  .wreck-schematic { height: clamp(7rem, 12vh, 10rem); }
}`);
  write(file, content);
}

// Keep asset contracts and documentation truthful.
{
  const file = 'assets/manifest.json';
  let content = read(file);
  content = replaceOnce(content, '"key": "ship-rustlight-tug",\n      "type": "svg-css"', '"key": "ship-rustlight-tug",\n      "type": "webp-raster"', 'Rustlight manifest type');
  write(file, content);
}

{
  const file = 'docs/UI_ASSET_AUDIT.md';
  let content = read(file);
  content = content
    .replace('All 30 canonical sources', 'All 31 canonical sources')
    .replace('| Base ships | 2 | 150,928 bytes |', '| Base ships | 3 | 162,928 bytes |')
    .replace('| **Total** | **30** | **3,148,872 bytes (3.00 MiB)** |', '| **Total** | **31** | **3,160,872 bytes (3.01 MiB)** |')
    .replace('| 1200px canonical sources | 3,148,872 bytes (3.00 MiB) |', '| 1200px canonical sources | 3,160,872 bytes (3.01 MiB) |')
    .replace('| 600px variants | 610,102 bytes (595.8 KiB) | 80.6% smaller |', '| 600px variants | 622,102 bytes (607.5 KiB) | 80.3% smaller |')
    .replace('| 360px variants | 246,412 bytes (240.6 KiB) | 92.2% smaller |', '| 360px variants | 258,412 bytes (252.4 KiB) | 91.8% smaller |')
    .replace('| Cargo Hauler Leviathan | 139,806 bytes | 27,662 bytes | 10,786 bytes |', '| Cargo Hauler Leviathan | 139,806 bytes | 27,662 bytes | 10,786 bytes |\n| Rustlight Tug | 12,000 bytes | 12,000 bytes | 12,000 bytes |')
    .replace('- 30 canonical project sources exist', '- 31 canonical project sources exist')
    .replace('- 30 mobile variants exist', '- 31 mobile variants exist')
    .replace('- 30 tablet variants exist', '- 31 tablet variants exist');
  write(file, content);
}

{
  const file = 'tools/test/ui-revamp.test.mjs';
  let content = read(file);
  content = content
    .replace("assert.equal(originals.length, 30, 'Expected the 30 canonical project artwork sources.');", "assert.equal(originals.length, 31, 'Expected the 31 canonical project artwork sources.');")
    .replace("assert.equal(mobile.length, 30, 'Every canonical artwork source needs a 360px mobile variant.');", "assert.equal(mobile.length, 31, 'Every canonical artwork source needs a 360px mobile variant.');")
    .replace("assert.equal(tablet.length, 30, 'Every canonical artwork source needs a 600px tablet variant.');", "assert.equal(tablet.length, 31, 'Every canonical artwork source needs a 600px tablet variant.');")
    .replace("assert.match(artworkPages, /<GameArtwork/);", "assert.match(artworkPages, /<GameArtwork/);\n  assert.ok(originals.includes('base/rustlight-tug.webp'), 'The starter Rustlight Tug needs dedicated raster artwork.');\n  assert.match(fleetPages, /ship\.visualKey/);")
    .replace("assert.match(source, /reconnectTimer/);", "assert.match(source, /reconnectTimer/);\n  assert.match(source, /visualKey\\?: string/);\n  assert.match(source, /wreck-schematic__art/);\n  assert.match(source, /wreckArtworkSrc/);");
  write(file, content);
}

console.log('Image-first starter artwork and overlay wreck artwork applied.');
