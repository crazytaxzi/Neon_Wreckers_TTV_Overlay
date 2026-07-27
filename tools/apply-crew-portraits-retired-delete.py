from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    file_path = Path(path)
    source = file_path.read_text(encoding="utf-8")
    if old not in source:
        raise RuntimeError(f"Expected source block not found in {path}: {old[:120]!r}")
    file_path.write_text(source.replace(old, new, 1), encoding="utf-8")


def write(path: str, content: str) -> None:
    file_path = Path(path)
    file_path.parent.mkdir(parents=True, exist_ok=True)
    file_path.write_text(content, encoding="utf-8")


# Retired expedition versions can be permanently deleted after they leave active service.
replace_once(
    "apps/admin/src/main.tsx",
    'if (!window.confirm(`Delete the unpublished ${displayName} v${version.version}? This cannot be undone.`)) return;',
    'if (!window.confirm(`Permanently delete ${displayName} v${version.version}? Active missions keep their saved rules, but this authored version cannot be restored.`)) return;'
)
replace_once(
    "apps/admin/src/main.tsx",
    'pushToast({ title: "Expedition draft deleted", message: `${displayName} v${version.version}`, tone: "success" });',
    'pushToast({ title: "Expedition version deleted", message: `${displayName} v${version.version}`, tone: "success" });'
)
replace_once(
    "apps/admin/src/main.tsx",
    'description="Only active versions appear in the player mission catalog. Published versions are retired instead of erased so launched flights keep an audit trail."',
    'description="Only active versions appear in the player mission catalog. Active versions must be retired before permanent deletion, while launched flights retain immutable rule snapshots."'
)
replace_once(
    "apps/admin/src/main.tsx",
    '{["draft", "scheduled"].includes(row.lifecycle) && (',
    '{["draft", "scheduled", "retired"].includes(row.lifecycle) && ('
)
replace_once(
    "apps/api/src/routes/admin.ts",
    "if (!['draft', 'scheduled'].includes(candidate.lifecycle)) throw new GameRuleError('EXPEDITION_VERSION_PUBLISHED', 'Published expedition versions must be retired instead of deleted.');",
    "if (!['draft', 'scheduled', 'retired'].includes(candidate.lifecycle)) throw new GameRuleError('EXPEDITION_VERSION_ACTIVE', 'Active expedition versions must be retired before deletion.');"
)

# Persist one build-time portrait key per crew member.
replace_once(
    "infrastructure/database/prisma/schema.prisma",
    "  injuredUntil DateTime?\n  traits       String[]  @default([])",
    "  injuredUntil DateTime?\n  portraitKey  String?\n  traits       String[]  @default([])"
)
write(
    "infrastructure/database/prisma/migrations/20260727041000_add_crew_portraits/migration.sql",
    'ALTER TABLE "CrewMember" ADD COLUMN "portraitKey" TEXT;\n'
)
replace_once(
    "packages/contracts/src/index.ts",
    "  injuredUntil: serializedDateTimeSchema.nullable(),\n  traits: z.array(z.string())",
    "  injuredUntil: serializedDateTimeSchema.nullable(),\n  portraitKey: z.string().nullable(),\n  traits: z.array(z.string())"
)
replace_once(
    "apps/web/src/model.ts",
    "  injuredUntil: string | null;\n  traits: string[];",
    "  injuredUntil: string | null;\n  portraitKey: string | null;\n  traits: string[];"
)

# Player-owned portrait selection endpoint. Keys are filenames without .png.
replace_once(
    "apps/api/src/routes/fleet.ts",
    "  app.post('/api/v1/crew/:id/shore-leave', async request => {",
    """  app.post('/api/v1/crew/:id/portrait', async request => {
    const user = await requireUser(context.prisma, request);
    const { id } = idSchema.parse(request.params);
    const { portraitKey } = z.object({
      portraitKey: z.string().trim().regex(/^[a-z0-9][a-z0-9-]{0,63}$/, 'Portrait filenames must use lowercase letters, numbers, and hyphens.').nullable()
    }).parse(request.body);
    const member = await context.prisma.crewMember.findFirst({ where: { id, playerId: user.player.id } });
    if (!member) throw new GameRuleError('CREW_NOT_FOUND', 'Crew member not found.');
    const crew = await context.prisma.crewMember.update({ where: { id }, data: { portraitKey } });
    return { data: crew, requestId: request.id };
  });

  app.post('/api/v1/crew/:id/shore-leave', async request => {"""
)

# Build-time asset discovery. Any valid PNG added to the folder appears after rebuild.
write(
    "apps/web/src/crew-portraits.ts",
    """export type CrewPortrait = {
  key: string;
  label: string;
  url: string;
};

const portraitModules = import.meta.glob("./assets/crew-portraits/*.png", {
  eager: true,
  import: "default",
  query: "?url",
}) as Record<string, string>;

const validPortraitKey = /^[a-z0-9][a-z0-9-]{0,63}$/;

function labelFor(key: string): string {
  return key
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export const crewPortraits: CrewPortrait[] = Object.entries(portraitModules)
  .map(([path, url]) => {
    const filename = path.split("/").pop() ?? "";
    const key = filename.replace(/\\.png$/i, "");
    return { key, label: labelFor(key), url };
  })
  .filter((portrait) => validPortraitKey.test(portrait.key))
  .sort((left, right) => left.label.localeCompare(right.label));

const portraitUrls = new Map(crewPortraits.map((portrait) => [portrait.key, portrait.url]));

export function crewPortraitUrl(key: string | null | undefined): string | null {
  return key ? portraitUrls.get(key) ?? null : null;
}
"""
)
write(
    "apps/web/src/assets/crew-portraits/README.md",
    """# Crew portrait assets

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
"""
)

# Wire the portrait library and picker into the crew console.
replace_once(
    "apps/web/src/pages/fleet.tsx",
    'import { GameArtwork } from "../components/GameArtwork.js";',
    'import { GameArtwork } from "../components/GameArtwork.js";\nimport { crewPortraits, crewPortraitUrl } from "../crew-portraits.js";'
)
replace_once(
    "apps/web/src/pages/fleet.tsx",
    "  const [retiringCrew, setRetiringCrew] = useState<(typeof crew)[number] | null>(null);\n  const [now, setNow] = useState(Date.now());",
    """  const [retiringCrew, setRetiringCrew] = useState<(typeof crew)[number] | null>(null);
  const [portraitCrew, setPortraitCrew] = useState<(typeof crew)[number] | null>(null);
  const [now, setNow] = useState(Date.now());
  const choosePortrait = (portraitKey: string | null) => {
    if (!portraitCrew) return;
    void action(`/api/v1/crew/${portraitCrew.id}/portrait`, { portraitKey }, portraitKey ? "Crew portrait updated" : "Crew portrait cleared");
    setPortraitCrew(null);
  };"""
)
replace_once(
    "apps/web/src/pages/fleet.tsx",
    """          const cost = member.level * 250;
          const jobBenefit =""",
    """          const cost = member.level * 250;
          const portraitUrl = crewPortraitUrl(member.portraitKey);
          const jobBenefit ="""
)
replace_once(
    "apps/web/src/pages/fleet.tsx",
    """                <div className="crew-ident">
                  {member.name.slice(0, 2).toUpperCase()}
                </div>""",
    """                <div className={`crew-ident ${portraitUrl ? "crew-ident--portrait" : ""}`}>
                  {portraitUrl ? (
                    <img src={portraitUrl} alt={`${member.name} crew portrait`} />
                  ) : (
                    member.name.slice(0, 2).toUpperCase()
                  )}
                </div>"""
)
replace_once(
    "apps/web/src/pages/fleet.tsx",
    """                <Button size="sm" variant="ghost" onClick={() => setRetiringCrew(member)}>
                  Retire
                </Button>""",
    """                <Button size="sm" variant="ghost" onClick={() => setPortraitCrew(member)}>
                  Portrait
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setRetiringCrew(member)}>
                  Retire
                </Button>"""
)
replace_once(
    "apps/web/src/pages/fleet.tsx",
    """      </Modal>
      <ConfirmWindow
        open={Boolean(retiringCrew)}""",
    """      </Modal>
      <Modal
        open={Boolean(portraitCrew)}
        onClose={() => setPortraitCrew(null)}
        title={`Choose portrait for ${portraitCrew?.name ?? "crew member"}`}
        description="Portraits are PNG assets packaged with the game. Selecting one changes only this crew member."
        size="lg"
      >
        <div className="crew-portrait-picker">
          <button
            type="button"
            className={`crew-portrait-option ${portraitCrew?.portraitKey ? "" : "is-selected"}`}
            aria-pressed={!portraitCrew?.portraitKey}
            onClick={() => choosePortrait(null)}
          >
            <span className="crew-portrait-option__initials">
              {portraitCrew?.name.slice(0, 2).toUpperCase() ?? "--"}
            </span>
            <strong>Default initials</strong>
          </button>
          {crewPortraits.map((portrait) => (
            <button
              key={portrait.key}
              type="button"
              className={`crew-portrait-option ${portraitCrew?.portraitKey === portrait.key ? "is-selected" : ""}`}
              aria-pressed={portraitCrew?.portraitKey === portrait.key}
              onClick={() => choosePortrait(portrait.key)}
            >
              <img src={portrait.url} alt={`${portrait.label} portrait option`} />
              <strong>{portrait.label}</strong>
            </button>
          ))}
        </div>
        {!crewPortraits.length && (
          <Notification title="No crew portraits installed" tone="info">
            Add PNG files to apps/web/src/assets/crew-portraits, then rebuild and deploy the web app.
          </Notification>
        )}
      </Modal>
      <ConfirmWindow
        open={Boolean(retiringCrew)}"""
)

# Portrait presentation styles, including mobile-safe wrapping.
replace_once(
    "apps/web/src/styles.css",
    ".player-shell .crew-console .crew-ident { width: 4.5rem; height: 4.5rem; color: var(--nw-color-green); border: 1px solid rgba(var(--nw-color-green-rgb), 0.42); background: radial-gradient(circle, rgba(var(--nw-color-green-rgb), 0.18), transparent 68%); clip-path: polygon(0.65rem 0, 100% 0, 100% calc(100% - 0.65rem), calc(100% - 0.65rem) 100%, 0 100%, 0 0.65rem); }",
    """.player-shell .crew-console .crew-ident { width: 4.5rem; height: 4.5rem; overflow: hidden; color: var(--nw-color-green); border: 1px solid rgba(var(--nw-color-green-rgb), 0.42); background: radial-gradient(circle, rgba(var(--nw-color-green-rgb), 0.18), transparent 68%); clip-path: polygon(0.65rem 0, 100% 0, 100% calc(100% - 0.65rem), calc(100% - 0.65rem) 100%, 0 100%, 0 0.65rem); }
.player-shell .crew-console .crew-ident--portrait { padding: 0; background: rgba(var(--nw-color-void-rgb), 0.8); }
.player-shell .crew-console .crew-ident img { display: block; width: 100%; height: 100%; object-fit: cover; }
.player-shell .crew-portrait-picker { display: grid; grid-template-columns: repeat(auto-fill, minmax(7.5rem, 1fr)); gap: 0.65rem; margin-block-end: 0.8rem; }
.player-shell .crew-portrait-option { display: grid; min-width: 0; padding: 0.55rem; gap: 0.45rem; justify-items: center; border: 1px solid var(--nw-color-line-strong); color: var(--nw-color-text-muted); background: rgba(var(--nw-color-void-rgb), 0.55); cursor: pointer; clip-path: polygon(0.5rem 0, 100% 0, 100% calc(100% - 0.5rem), calc(100% - 0.5rem) 100%, 0 100%, 0 0.5rem); }
.player-shell .crew-portrait-option:hover,
.player-shell .crew-portrait-option:focus-visible { color: var(--nw-color-text); border-color: rgba(var(--nw-color-purple-rgb), 0.58); background: rgba(var(--nw-color-purple-rgb), 0.08); }
.player-shell .crew-portrait-option.is-selected { color: var(--nw-color-green); border-color: var(--nw-color-green); box-shadow: inset 0 0 0 1px rgba(var(--nw-color-green-rgb), 0.25); }
.player-shell .crew-portrait-option img,
.player-shell .crew-portrait-option__initials { display: grid; width: 100%; aspect-ratio: 1; place-items: center; object-fit: cover; border: 1px solid rgba(var(--nw-color-green-rgb), 0.32); background: radial-gradient(circle, rgba(var(--nw-color-green-rgb), 0.15), rgba(var(--nw-color-void-rgb), 0.82)); }
.player-shell .crew-portrait-option__initials { color: var(--nw-color-green); font-family: var(--nw-font-display); font-size: 1.4rem; font-weight: 900; }
.player-shell .crew-portrait-option strong { max-width: 100%; overflow: hidden; font-size: 0.7rem; letter-spacing: 0.04em; text-align: center; text-overflow: ellipsis; text-transform: uppercase; white-space: nowrap; }"""
)

# Public route inventory remains explicit and duplicate-free.
replace_once(
    "tools/test/api-routes.test.mjs",
    "  'POST /api/v1/crew/:id/assignment',\n  'POST /api/v1/crew/:id/shore-leave',",
    "  'POST /api/v1/crew/:id/assignment',\n  'POST /api/v1/crew/:id/portrait',\n  'POST /api/v1/crew/:id/shore-leave',"
)

print("Crew portraits and retired expedition deletion patch applied.")
