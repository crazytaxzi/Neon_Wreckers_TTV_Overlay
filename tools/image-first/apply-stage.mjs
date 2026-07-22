import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const expectedSha256 = '919406b1f06313f6091ad613dde944e6f9bbc1c8a2a4fd22c1177a144d6b0831';
const scriptDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(scriptDir, '../..');
const chunkNames = readdirSync(scriptDir)
  .filter((name) => /^raster-pack\.part-\d+$/.test(name))
  .sort();

if (chunkNames.length !== 9) {
  throw new Error(`Expected 9 raster-pack chunks, found ${chunkNames.length}.`);
}

const base64 = chunkNames
  .map((name) => readFileSync(join(scriptDir, name), 'utf8').trim())
  .join('');
const archive = Buffer.from(base64, 'base64');
const actualSha256 = createHash('sha256').update(archive).digest('hex');

if (actualSha256 !== expectedSha256) {
  throw new Error(`Raster archive checksum mismatch: expected ${expectedSha256}, received ${actualSha256}.`);
}

const zipPath = join(scriptDir, '.raster-stage.zip');
writeFileSync(zipPath, archive);

try {
  const entries = execFileSync('unzip', ['-Z1', zipPath], { encoding: 'utf8' })
    .split(/\r?\n/)
    .filter(Boolean);

  for (const entry of entries) {
    const normalized = entry.replaceAll('\\', '/');
    if (normalized.startsWith('/') || normalized.split('/').includes('..')) {
      throw new Error(`Unsafe archive entry rejected: ${entry}`);
    }
  }

  execFileSync('unzip', ['-o', zipPath, '-d', root], { stdio: 'inherit' });
} finally {
  rmSync(zipPath, { force: true });
}

const requiredPaths = [
  'packages/ui/src/raster-system.css',
  'packages/ui/manifests/raster-assets.json',
  'packages/ui/assets/raster/core/panel-frame.webp',
  'packages/ui/assets/raster/mobile/mobile-nav.webp',
  'packages/ui/assets/raster/salvage/alert-red.webp',
  'packages/ui/assets/raster/broadcast/overlay-canvas-frame.webp',
  'packages/ui/assets/raster/generated/generated-logo.webp',
  'docs/UI_RASTER_COMPLETION_REPORT.md',
  'tools/test/ui-raster-system.test.mjs'
];

for (const path of requiredPaths) {
  if (!existsSync(join(root, ...path.split('/')))) {
    throw new Error(`Raster stage did not produce required file: ${path}`);
  }
}

const sharedIndex = readFileSync(join(root, 'packages/ui/src/index.ts'), 'utf8');
if (!sharedIndex.includes("import './raster-system.css';")) {
  throw new Error('Shared UI entrypoint does not import raster-system.css.');
}

console.log(`Installed verified shared raster UI archive ${actualSha256}.`);
