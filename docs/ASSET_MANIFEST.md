# Asset Manifest

`assets/manifest.json` is the canonical registry for every content-facing visual key.

Each record declares exactly one source owner:

- `source.kind: "css"` with a stable design token for visuals rendered by the shared icon and CSS system.
- `source.kind: "raster"` with an explicit root-relative `path` and responsive `variants` such as `360w` and `600w`.

Runtime code must never derive responsive filenames. Raster consumers use the declared source and variants. CSS-owned records render through the icon/CSS fallback and make no image request.

The current catalog is CSS-owned. This reflects the files actually committed to the repository and prevents the overlay from requesting nonexistent wreck or ship raster variants. Future raster adoption must be explicit rather than inferred from a visual key.

`pnpm test:content` validates duplicate keys, normalized paths, supported formats, required variants, path uniqueness, referenced visual keys, orphaned records, and declared file existence across browser public roots.

Adding a raster asset requires committing the source and every required responsive variant under a browser public root, then declaring all paths in the manifest. Variant generation is intentionally not automatic because this repository does not currently own a deterministic image-optimization pipeline.
