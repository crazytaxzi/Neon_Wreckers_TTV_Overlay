import manifestJson from '../../../assets/manifest.json?raw';

type CssSource = { kind: 'css'; token: string };
type RasterSource = { kind: 'raster'; path: string; variants: Record<string, string> };
type AssetRecord = { key: string; source: CssSource | RasterSource };
type AssetManifest = { assets: AssetRecord[] };

const manifest = JSON.parse(manifestJson) as AssetManifest;
const assets = new Map(manifest.assets.map(asset => [asset.key, asset]));

export function resolveRasterAsset(key: string | null | undefined): { src: string; srcSet: string } | null {
  if (!key) return null;
  const asset = assets.get(key);
  if (!asset || asset.source.kind !== 'raster') return null;
  const srcSet = Object.entries(asset.source.variants)
    .sort(([left], [right]) => Number.parseInt(left, 10) - Number.parseInt(right, 10))
    .map(([width, source]) => `${source} ${width}`)
    .join(', ');
  return { src: asset.source.path, srcSet };
}
