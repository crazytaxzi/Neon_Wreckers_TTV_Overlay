import manifest from '../../../assets/manifest.json';

type CssSource = { kind: 'css'; token: string };
type RasterSource = { kind: 'raster'; path: string; variants: Record<string, string> };
type AssetRecord = { key: string; source: CssSource | RasterSource };

const assets = new Map((manifest.assets as unknown as AssetRecord[]).map(asset => [asset.key, asset]));

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
