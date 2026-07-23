import assert from 'node:assert/strict';
import test from 'node:test';
import { responsiveSourceSet, validateAssetManifest } from '../lib/asset-manifest.mjs';

const cssAsset = {
  key: 'wreck-test-cutter',
  type: 'svg-css',
  tags: ['wreck'],
  alt: 'Test cutter silhouette',
  source: { kind: 'css', token: 'wreck-test-cutter' }
};

const rasterAsset = {
  key: 'ship-test-tug',
  type: 'webp-raster',
  tags: ['ship'],
  alt: 'Test salvage tug',
  source: {
    kind: 'raster',
    path: '/assets/ships/test-tug.webp',
    variants: {
      '360w': '/assets/ships/test-tug-360w.webp',
      '600w': '/assets/ships/test-tug-600w.webp'
    }
  }
};

function manifest(...assets) {
  return { version: '3.0.0', assets };
}

test('accepts explicit CSS and responsive raster sources', () => {
  const result = validateAssetManifest(manifest(cssAsset, rasterAsset));
  assert.equal(result.byKey.get(cssAsset.key), cssAsset);
  assert.equal(result.byKey.get(rasterAsset.key), rasterAsset);
  assert.equal(responsiveSourceSet(rasterAsset), '/assets/ships/test-tug-360w.webp 360w, /assets/ships/test-tug-600w.webp 600w');
  assert.equal(responsiveSourceSet(cssAsset), undefined);
});

test('rejects duplicate asset keys', () => {
  assert.throws(() => validateAssetManifest(manifest(cssAsset, cssAsset)), /Duplicate asset key/);
});

test('rejects raster assets with missing required variants', () => {
  const missing = structuredClone(rasterAsset);
  delete missing.source.variants['600w'];
  assert.throws(() => validateAssetManifest(manifest(missing)), /missing required 600w variant/);
});

test('rejects invalid and traversing public paths', () => {
  const invalid = structuredClone(rasterAsset);
  invalid.source.path = '/../secret.webp';
  assert.throws(() => validateAssetManifest(manifest(invalid)), /normalized root-relative|traverse/);
});

test('rejects unsupported raster formats', () => {
  const unsupported = structuredClone(rasterAsset);
  unsupported.source.path = '/assets/ships/test-tug.gif';
  assert.throws(() => validateAssetManifest(manifest(unsupported)), /unsupported format/);
});

test('verifies declared raster files through the supplied file boundary', () => {
  const present = new Set([
    rasterAsset.source.path,
    ...Object.values(rasterAsset.source.variants)
  ]);
  assert.doesNotThrow(() => validateAssetManifest(manifest(rasterAsset), { fileExists: candidate => present.has(candidate) }));
  assert.throws(() => validateAssetManifest(manifest(rasterAsset), { fileExists: candidate => candidate !== rasterAsset.source.variants['600w'] }), /variant file does not exist/);
});
