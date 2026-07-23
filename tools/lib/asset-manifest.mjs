import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const KEY_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PUBLIC_PATH_PATTERN = /^\/(?!\/)(?:[a-zA-Z0-9._-]+\/)*[a-zA-Z0-9._-]+$/;
const SUPPORTED_RASTER_FORMATS = new Set(['.avif', '.png', '.webp']);
const RESPONSIVE_WIDTH_PATTERN = /^[1-9][0-9]*w$/;

function assertPublicAssetPath(value, label) {
  assert.equal(typeof value, 'string', `${label} must be a string.`);
  assert.match(value, PUBLIC_PATH_PATTERN, `${label} must be a normalized root-relative public path.`);
  assert.ok(!value.includes('..'), `${label} must not traverse directories.`);
  const extension = path.posix.extname(value).toLowerCase();
  assert.ok(SUPPORTED_RASTER_FORMATS.has(extension), `${label} uses unsupported format ${extension || '(none)'}.`);
}

function validateCssSource(source, key) {
  assert.deepEqual(Object.keys(source).sort(), ['kind', 'token'], `CSS asset ${key} has unsupported source fields.`);
  assert.equal(source.kind, 'css', `CSS asset ${key} must declare source.kind=css.`);
  assert.match(source.token, KEY_PATTERN, `CSS asset ${key} has invalid token ${source.token}.`);
}

function validateRasterSource(source, key, requiredWidths) {
  assert.equal(source.kind, 'raster', `Raster asset ${key} must declare source.kind=raster.`);
  assertPublicAssetPath(source.path, `Asset ${key} source.path`);
  assert.ok(source.variants && typeof source.variants === 'object' && !Array.isArray(source.variants), `Raster asset ${key} must declare a variants object.`);

  const variantPaths = new Set([source.path]);
  for (const [width, variantPath] of Object.entries(source.variants)) {
    assert.match(width, RESPONSIVE_WIDTH_PATTERN, `Asset ${key} has invalid responsive width ${width}.`);
    assertPublicAssetPath(variantPath, `Asset ${key} variant ${width}`);
    assert.ok(!variantPaths.has(variantPath), `Asset ${key} repeats responsive path ${variantPath}.`);
    variantPaths.add(variantPath);
  }
  for (const width of requiredWidths) {
    assert.ok(source.variants[width], `Raster asset ${key} is missing required ${width} variant.`);
  }
}

export function validateAssetManifest(manifest, options = {}) {
  const { requiredRasterWidths = ['360w', '600w'], fileExists } = options;
  assert.ok(manifest && typeof manifest === 'object' && !Array.isArray(manifest), 'Asset manifest must be an object.');
  assert.equal(typeof manifest.version, 'string', 'Asset manifest version is required.');
  assert.ok(Array.isArray(manifest.assets), 'Asset manifest must contain an assets array.');

  const byKey = new Map();
  for (const asset of manifest.assets) {
    assert.ok(asset && typeof asset === 'object' && !Array.isArray(asset), 'Asset records must be objects.');
    assert.match(asset.key, KEY_PATTERN, `Invalid asset key: ${asset.key}`);
    assert.ok(!byKey.has(asset.key), `Duplicate asset key: ${asset.key}`);
    assert.ok(asset.alt?.trim(), `Asset ${asset.key} is missing alt text.`);
    assert.ok(Array.isArray(asset.tags), `Asset ${asset.key} must declare tags.`);
    assert.ok(asset.source && typeof asset.source === 'object' && !Array.isArray(asset.source), `Asset ${asset.key} must declare source metadata.`);

    if (asset.source.kind === 'css') {
      assert.equal(asset.type, 'svg-css', `CSS asset ${asset.key} must use type svg-css.`);
      validateCssSource(asset.source, asset.key);
    } else if (asset.source.kind === 'raster') {
      assert.equal(asset.type, 'webp-raster', `Raster asset ${asset.key} must use type webp-raster.`);
      validateRasterSource(asset.source, asset.key, requiredRasterWidths);
      if (fileExists) {
        assert.ok(fileExists(asset.source.path), `Asset ${asset.key} source file does not exist: ${asset.source.path}`);
        for (const variantPath of Object.values(asset.source.variants)) {
          assert.ok(fileExists(variantPath), `Asset ${asset.key} variant file does not exist: ${variantPath}`);
        }
      }
    } else {
      assert.fail(`Asset ${asset.key} has unsupported source kind ${asset.source.kind}.`);
    }
    byKey.set(asset.key, asset);
  }

  return { manifest, byKey };
}

export function loadAndValidateAssetManifest(manifestPath, options = {}) {
  const absoluteManifestPath = path.resolve(manifestPath);
  const manifest = JSON.parse(fs.readFileSync(absoluteManifestPath, 'utf8'));
  const publicRoots = (options.publicRoots ?? []).map(root => path.resolve(root));
  const fileExists = publicRoots.length === 0 ? undefined : publicPath => {
    const relative = publicPath.replace(/^\//, '');
    return publicRoots.some(root => fs.existsSync(path.join(root, relative)));
  };
  return validateAssetManifest(manifest, { ...options, fileExists });
}

export function responsiveSourceSet(asset) {
  if (!asset || asset.source?.kind !== 'raster') return undefined;
  return Object.entries(asset.source.variants)
    .sort(([left], [right]) => Number.parseInt(left, 10) - Number.parseInt(right, 10))
    .map(([width, source]) => `${source} ${width}`)
    .join(', ');
}
