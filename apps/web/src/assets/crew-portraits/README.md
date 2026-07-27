# Crew portrait assets

Place player-selectable crew portraits in this folder as PNG files.

Rules:

- Use `.png` files only.
- Use lowercase letters, numbers, and hyphens in filenames.
- Do not use spaces or underscores.
- Keep the filename, excluding `.png`, to 64 characters or fewer.
- Square images are recommended. `512x512` is a good source size.
- Transparent backgrounds are supported.

Examples:

- `salvage-pilot-01.png`
- `station-medic.png`
- `xeno-scout.png`

The game discovers these files automatically during the web build. Add or remove PNGs, then rebuild and deploy the web application. Existing crew members whose selected file was removed fall back to their initials until another portrait is selected.
