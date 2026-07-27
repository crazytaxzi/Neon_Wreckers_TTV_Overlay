from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    file_path = Path(path)
    source = file_path.read_text(encoding="utf-8")
    count = source.count(old)
    if count != 1:
        raise RuntimeError(f"Expected one match in {path}, found {count}")
    file_path.write_text(source.replace(old, new, 1), encoding="utf-8")


def replace_between(path: str, start: str, end: str, replacement: str) -> None:
    file_path = Path(path)
    source = file_path.read_text(encoding="utf-8")
    start_index = source.find(start)
    end_index = source.find(end, start_index)
    if start_index < 0 or end_index < 0:
        raise RuntimeError(f"Could not find replacement boundaries in {path}")
    file_path.write_text(source[:start_index] + replacement + source[end_index:], encoding="utf-8")


admin_page = r'''function ExpeditionCreatorPage({
  data,
  refresh,
  pushToast,
}: {
  data: ExpeditionCreatorData | null;
  refresh: () => Promise<void>;
  pushToast: PushToast;
}) {
  type ExpeditionVersion = NonNullable<ExpeditionCreatorData>["versions"][number];

  const [open, setOpen] = useState(false);
  const [slug, setSlug] = useState("outer-rim-recovery");
  const [name, setName] = useState("Outer Rim Recovery");
  const [description, setDescription] = useState("Recover valuable components from an unstable debris corridor beyond Station Zero.");
  const [risk, setRisk] = useState("moderate");
  const [fuelCost, setFuelCost] = useState(2);
  const [minCrew, setMinCrew] = useState(2);
  const [lootRolls, setLootRolls] = useState(3);
  const [durationMin, setDurationMin] = useState(25);
  const [durationMax, setDurationMax] = useState(45);
  const [lootPool, setLootPool] = useState<string[]>(["scrap", "alloys", "electronics"]);
  const [lifecycle, setLifecycle] = useState("draft");
  const [scheduledAt, setScheduledAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const openBlank = () => {
    setSlug("outer-rim-recovery");
    setName("Outer Rim Recovery");
    setDescription("Recover valuable components from an unstable debris corridor beyond Station Zero.");
    setRisk("moderate");
    setFuelCost(2);
    setMinCrew(2);
    setLootRolls(3);
    setDurationMin(25);
    setDurationMax(45);
    setLootPool(["scrap", "alloys", "electronics"]);
    setLifecycle("draft");
    setScheduledAt("");
    setExpiresAt("");
    setOpen(true);
  };

  const loadTemplate = (template: ExpeditionCreatorData["builtIn"][number]) => {
    setSlug(`${template.slug}-custom`);
    setName(`${template.name} Variant`);
    setDescription(template.description);
    setRisk(template.risk);
    setFuelCost(template.fuelCost);
    setMinCrew(template.minCrew);
    setLootRolls(template.lootRolls);
    setDurationMin(template.durationMinutes[0]);
    setDurationMax(template.durationMinutes[1]);
    setLootPool([...template.lootPool]);
    setLifecycle("draft");
    setScheduledAt("");
    setExpiresAt("");
    setOpen(true);
  };

  const loadVersion = (version: ExpeditionVersion) => {
    const content = version.content;
    const duration = Array.isArray(content.durationMinutes) ? content.durationMinutes : [];
    const rewards = Array.isArray(content.lootPool)
      ? content.lootPool.filter((item): item is string => typeof item === "string")
      : [];
    setSlug(String(content.slug ?? version.slug.replace(/^expedition\./, "")));
    setName(String(content.name ?? version.slug.replace(/^expedition\./, "")));
    setDescription(String(content.description ?? "Describe this expedition."));
    setRisk(String(content.risk ?? "moderate"));
    setFuelCost(Number(content.fuelCost ?? 2));
    setMinCrew(Number(content.minCrew ?? 2));
    setLootRolls(Number(content.lootRolls ?? 3));
    setDurationMin(Number(duration[0] ?? 25));
    setDurationMax(Number(duration[1] ?? 45));
    setLootPool(rewards.length ? rewards : ["scrap"]);
    setLifecycle("draft");
    setScheduledAt("");
    setExpiresAt("");
    setOpen(true);
  };

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await requestApi("/api/v1/admin/expedition-creator", {
        method: "POST",
        body: JSON.stringify({
          definition: { slug, name, description, risk, fuelCost, minCrew, lootRolls, durationMinutes: [durationMin, durationMax], lootPool },
          lifecycle,
          ...(scheduledAt ? { scheduledAt: new Date(scheduledAt).toISOString() } : {}),
          ...(expiresAt ? { expiresAt: new Date(expiresAt).toISOString() } : {}),
        }),
      });
      pushToast({ title: lifecycle === "active" ? "Expedition activated" : "Expedition version saved", message: `${name} is ${lifecycle}.`, tone: "success" });
      setOpen(false);
      await refresh();
    } catch (error) {
      pushToast({ title: "Expedition rejected", message: errorMessage(error), tone: "danger", duration: 8000 });
    }
  };

  const changeLifecycle = async (version: ExpeditionVersion, action: "activate" | "retire") => {
    const displayName = String(version.content.name ?? version.slug.replace("expedition.", ""));
    if (action === "retire" && !window.confirm(`Retire ${displayName}? Players will no longer be able to launch it.`)) return;
    try {
      await requestApi(`/api/v1/admin/expedition-creator/${encodeURIComponent(version.id)}/${action}`, { method: "POST" });
      pushToast({
        title: action === "activate" ? "Expedition activated" : "Expedition retired",
        message: `${displayName} v${version.version}`,
        tone: "success",
      });
      await refresh();
    } catch (error) {
      pushToast({ title: "Lifecycle change failed", message: errorMessage(error), tone: "danger" });
    }
  };

  const removeVersion = async (version: ExpeditionVersion) => {
    const displayName = String(version.content.name ?? version.slug.replace("expedition.", ""));
    if (!window.confirm(`Delete the unpublished ${displayName} v${version.version}? This cannot be undone.`)) return;
    try {
      await requestApi(`/api/v1/admin/expedition-creator/${encodeURIComponent(version.id)}`, { method: "DELETE" });
      pushToast({ title: "Expedition draft deleted", message: `${displayName} v${version.version}`, tone: "success" });
      await refresh();
    } catch (error) {
      pushToast({ title: "Delete failed", message: errorMessage(error), tone: "danger" });
    }
  };

  return (
    <div className="admin-stack">
      <SectionTitle
        eyebrow="SERVER-AUTHORITATIVE CONTENT"
        title="Expedition Creator"
        description="Design, revise, activate, schedule, retire, and safely remove unpublished expedition versions."
        icon="expedition"
        action={<Button onClick={openBlank}>Create expedition</Button>}
      />
      <ResponsiveGrid min="17rem">
        {(data?.builtIn ?? []).map((template) => (
          <Panel key={template.slug}>
            <Badge tone={template.risk === "extreme" ? "danger" : template.risk === "high" ? "warning" : "info"}>{template.risk}</Badge>
            <h3>{template.name}</h3>
            <p>{template.description}</p>
            <div className="admin-inline-record">
              <span>{template.fuelCost} fuel · {template.minCrew}+ crew</span>
              <small>{template.durationMinutes[0]}–{template.durationMinutes[1]} min · {template.lootRolls} rolls</small>
            </div>
            <Button size="sm" variant="ghost" onClick={() => loadTemplate(template)}>Use as template</Button>
          </Panel>
        ))}
      </ResponsiveGrid>
      <Panel>
        <SectionTitle eyebrow="AUTHORED VERSIONS" title="Release history" description="Only active versions appear in the player mission catalog. Published versions are retired instead of erased so launched flights keep an audit trail." icon="data" />
        <DataGrid
          rows={data?.versions ?? []}
          getRowKey={(row) => row.id}
          empty="No authored expeditions yet."
          columns={[
            { key: "name", header: "Expedition", render: (row) => <strong>{String(row.content.name ?? row.slug.replace("expedition.", ""))}</strong> },
            { key: "version", header: "Version", render: (row) => <span className="nw-numeric">v{row.version}</span> },
            { key: "lifecycle", header: "Lifecycle", render: (row) => <Badge tone={lifecycleTone(row.lifecycle)}>{row.lifecycle}</Badge> },
            { key: "schedule", header: "Schedule", render: (row) => row.scheduledAt ? new Date(row.scheduledAt).toLocaleString() : "Manual" },
            {
              key: "controls",
              header: "Controls",
              align: "right",
              render: (row) => (
                <div className="inline-actions">
                  {row.lifecycle !== "active" && row.lifecycle !== "archived" && (
                    <Button size="sm" onClick={() => void changeLifecycle(row, "activate")}>Activate</Button>
                  )}
                  {row.lifecycle === "active" && (
                    <Button size="sm" variant="warning" onClick={() => void changeLifecycle(row, "retire")}>Retire</Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => loadVersion(row)}>Create revision</Button>
                  {["draft", "scheduled"].includes(row.lifecycle) && (
                    <Button size="sm" variant="ghost" onClick={() => void removeVersion(row)}>Delete</Button>
                  )}
                </div>
              ),
            },
          ]}
        />
      </Panel>
      <Modal open={open} onClose={() => setOpen(false)} title="Create expedition" description="All fields are validated by the server before a version is stored." size="lg">
        <form onSubmit={save}>
          <div className="admin-stack">
            <ResponsiveGrid min="15rem">
              <Field label="Stable slug" hint="Lowercase letters, numbers, and hyphens"><Input value={slug} onChange={(event) => setSlug(event.target.value)} required /></Field>
              <Field label="Display name"><Input value={name} onChange={(event) => setName(event.target.value)} required /></Field>
            </ResponsiveGrid>
            <Field label="Mission briefing"><Textarea value={description} onChange={(event) => setDescription(event.target.value)} required /></Field>
            <ResponsiveGrid min="11rem">
              <Field label="Risk"><Select value={risk} onChange={(event) => setRisk(event.target.value)}><option value="low">Low</option><option value="moderate">Moderate</option><option value="high">High</option><option value="extreme">Extreme</option></Select></Field>
              <Field label="Fuel cost"><Input type="number" min={1} max={10} value={fuelCost} onChange={(event) => setFuelCost(Number(event.target.value))} /></Field>
              <Field label="Minimum crew"><Input type="number" min={1} max={5} value={minCrew} onChange={(event) => setMinCrew(Number(event.target.value))} /></Field>
              <Field label="Loot rolls"><Input type="number" min={1} max={8} value={lootRolls} onChange={(event) => setLootRolls(Number(event.target.value))} /></Field>
              <Field label="Minimum minutes"><Input type="number" min={1} max={1440} value={durationMin} onChange={(event) => setDurationMin(Number(event.target.value))} /></Field>
              <Field label="Maximum minutes"><Input type="number" min={1} max={1440} value={durationMax} onChange={(event) => setDurationMax(Number(event.target.value))} /></Field>
            </ResponsiveGrid>
            <ResponsiveGrid min="15rem">
              <Field label="Release state"><Select value={lifecycle} onChange={(event) => setLifecycle(event.target.value)}><option value="draft">Draft</option><option value="scheduled">Scheduled</option><option value="active">Activate now</option></Select></Field>
              <Field label="Activation time"><Input type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} disabled={lifecycle !== "scheduled"} /></Field>
              <Field label="Optional expiry"><Input type="datetime-local" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} /></Field>
            </ResponsiveGrid>
            <Notification title={lifecycle === "active" ? "Visible to players after save" : lifecycle === "scheduled" ? "Hidden until the activation time" : "Drafts remain hidden from players"} tone={lifecycle === "active" ? "success" : "info"}>
              {lifecycle === "active" ? "Saving activates this version immediately and retires the previous active version with the same slug." : lifecycle === "scheduled" ? "The worker will activate this version and retire the previous live version at the selected time." : "Use the Activate control in release history when this version is ready for the mission catalog."}
            </Notification>
            <Field label={`Loot pool · ${lootPool.length} selected`} hint="Choose up to 16 unique rewards">
              <ResponsiveGrid min="12rem">
                {(data?.items ?? []).map((item) => (
                  <label key={item.slug} className="admin-inline-record">
                    <span><input type="checkbox" checked={lootPool.includes(item.slug)} disabled={!lootPool.includes(item.slug) && lootPool.length >= 16} onChange={(event) => setLootPool((current) => event.target.checked ? [...current, item.slug] : current.filter((slug) => slug !== item.slug))} /> {item.name}</span>
                    <small>{item.rarity}</small>
                  </label>
                ))}
              </ResponsiveGrid>
            </Field>
            <Notification title="Launch preview" tone="info">{name || "Untitled expedition"} · {risk} risk · {fuelCost} fuel · {minCrew}+ crew · {durationMin}–{durationMax} minutes · {lootRolls} weighted rolls from {lootPool.length} items.</Notification>
            <Button variant="primary" disabled={!lootPool.length || (lifecycle === "scheduled" && !scheduledAt)}>{lifecycle === "active" ? "Validate and activate" : lifecycle === "scheduled" ? "Validate and schedule" : "Validate and save draft"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

'''

replace_between(
    "apps/admin/src/main.tsx",
    "function ExpeditionCreatorPage({",
    "function ConfigPage({",
    admin_page,
)

admin_routes_anchor = r'''  app.get('/api/v1/admin/live-ops', async request => {'''
admin_routes = r'''  app.post('/api/v1/admin/expedition-creator/:id/activate', async request => {
    const user = await requireAdmin(context.prisma, request);
    const id = z.string().min(1).parse((request.params as { id: string }).id);
    const activated = await context.prisma.$transaction(async transaction => {
      const candidate = await transaction.contentVersion.findUnique({ where: { id } });
      if (!candidate || !candidate.slug.startsWith('expedition.')) throw new GameRuleError('EXPEDITION_VERSION_NOT_FOUND', 'Expedition version not found.');
      await acquireTransactionLock(transaction, `content-version:${candidate.slug}`);
      await transaction.contentVersion.updateMany({ where: { slug: candidate.slug, lifecycle: 'active', id: { not: id } }, data: { lifecycle: 'retired' } });
      const version = await transaction.contentVersion.update({ where: { id }, data: { lifecycle: 'active', publishedAt: new Date(), scheduledAt: null } });
      await transaction.auditLog.create({ data: { actorId: user.id, action: 'expedition.activate', target: `${candidate.slug}@${candidate.version}`, before: { lifecycle: candidate.lifecycle }, after: { lifecycle: 'active' }, requestId: request.id } });
      return version;
    });
    return { data: activated, requestId: request.id };
  });

  app.post('/api/v1/admin/expedition-creator/:id/retire', async request => {
    const user = await requireAdmin(context.prisma, request);
    const id = z.string().min(1).parse((request.params as { id: string }).id);
    const retired = await context.prisma.$transaction(async transaction => {
      const candidate = await transaction.contentVersion.findUnique({ where: { id } });
      if (!candidate || !candidate.slug.startsWith('expedition.')) throw new GameRuleError('EXPEDITION_VERSION_NOT_FOUND', 'Expedition version not found.');
      if (candidate.lifecycle !== 'active') throw new GameRuleError('EXPEDITION_VERSION_NOT_ACTIVE', 'Only an active expedition version can be retired.');
      await acquireTransactionLock(transaction, `content-version:${candidate.slug}`);
      const version = await transaction.contentVersion.update({ where: { id }, data: { lifecycle: 'retired', scheduledAt: null } });
      await transaction.auditLog.create({ data: { actorId: user.id, action: 'expedition.retire', target: `${candidate.slug}@${candidate.version}`, before: { lifecycle: candidate.lifecycle }, after: { lifecycle: 'retired' }, requestId: request.id } });
      return version;
    });
    return { data: retired, requestId: request.id };
  });

  app.delete('/api/v1/admin/expedition-creator/:id', async request => {
    const user = await requireAdmin(context.prisma, request);
    const id = z.string().min(1).parse((request.params as { id: string }).id);
    const deleted = await context.prisma.$transaction(async transaction => {
      const candidate = await transaction.contentVersion.findUnique({ where: { id } });
      if (!candidate || !candidate.slug.startsWith('expedition.')) throw new GameRuleError('EXPEDITION_VERSION_NOT_FOUND', 'Expedition version not found.');
      if (!['draft', 'scheduled'].includes(candidate.lifecycle)) throw new GameRuleError('EXPEDITION_VERSION_PUBLISHED', 'Published expedition versions must be retired instead of deleted.');
      await acquireTransactionLock(transaction, `content-version:${candidate.slug}`);
      await transaction.auditLog.create({ data: { actorId: user.id, action: 'expedition.delete', target: `${candidate.slug}@${candidate.version}`, before: { lifecycle: candidate.lifecycle, content: candidate.contentJson }, requestId: request.id } });
      await transaction.contentVersion.delete({ where: { id } });
      return { id, slug: candidate.slug, version: candidate.version };
    });
    return { data: deleted, requestId: request.id };
  });

'''
replace_once(
    "apps/api/src/routes/admin.ts",
    admin_routes_anchor,
    admin_routes + admin_routes_anchor,
)

old_definition_loader = r'''export async function activeExpeditionDefinitions(prisma: Pick<PrismaClient, 'contentVersion'>) {
  const authored = await prisma.contentVersion.findMany({
    where: { slug: { startsWith: 'expedition.' }, lifecycle: 'active' },
    orderBy: { version: 'desc' }
  });
  const definitions = new Map<string, ExpeditionDefinition>();
  for (const definition of Object.values(expeditionDefinitions)) definitions.set(definition.slug, definition);
  for (const version of authored) {
    const parsed = authoredExpeditionSchema.safeParse(version.contentJson);
    if (parsed.success && version.slug === `expedition.${parsed.data.slug}`) definitions.set(parsed.data.slug, parsed.data);
  }
  return Object.fromEntries(definitions) as Record<string, ExpeditionDefinition>;
}'''
new_definition_loader = r'''export async function activeExpeditionDefinitions(prisma: Pick<PrismaClient, 'contentVersion'>) {
  const authored = await prisma.contentVersion.findMany({
    where: {
      slug: { startsWith: 'expedition.' },
      lifecycle: 'active',
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
    },
    orderBy: { version: 'desc' }
  });
  const definitions = new Map<string, ExpeditionDefinition>();
  const authoredSlugs = new Set<string>();
  for (const definition of Object.values(expeditionDefinitions)) definitions.set(definition.slug, definition);
  for (const version of authored) {
    const parsed = authoredExpeditionSchema.safeParse(version.contentJson);
    if (parsed.success && version.slug === `expedition.${parsed.data.slug}` && !authoredSlugs.has(parsed.data.slug)) {
      definitions.set(parsed.data.slug, parsed.data);
      authoredSlugs.add(parsed.data.slug);
    }
  }
  return Object.fromEntries(definitions) as Record<string, ExpeditionDefinition>;
}'''
replace_once(
    "apps/api/src/services/expedition-definitions.ts",
    old_definition_loader,
    new_definition_loader,
)

worker_anchor = r'''async function tickLiveOperations() {'''
worker_helper = r'''async function activateScheduledContent(now: Date) {
  const due = await prisma.contentVersion.findMany({
    where: {
      lifecycle: 'scheduled',
      scheduledAt: { lte: now },
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }]
    },
    orderBy: [{ slug: 'asc' }, { version: 'asc' }]
  });
  const newestBySlug = new Map<string, (typeof due)[number]>();
  for (const version of due) newestBySlug.set(version.slug, version);
  for (const candidate of newestBySlug.values()) {
    await prisma.$transaction(async transaction => {
      await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`content-version:${candidate.slug}`}))`;
      const current = await transaction.contentVersion.findUnique({ where: { id: candidate.id } });
      if (!current || current.lifecycle !== 'scheduled' || !current.scheduledAt || current.scheduledAt > now) return;
      if (current.expiresAt && current.expiresAt <= now) {
        await transaction.contentVersion.update({ where: { id: current.id }, data: { lifecycle: 'archived' } });
        return;
      }
      await transaction.contentVersion.updateMany({
        where: { slug: current.slug, lifecycle: 'active', id: { not: current.id } },
        data: { lifecycle: 'retired' }
      });
      await transaction.contentVersion.updateMany({
        where: { slug: current.slug, lifecycle: 'scheduled', id: { not: current.id }, scheduledAt: { lte: now } },
        data: { lifecycle: 'retired' }
      });
      await transaction.contentVersion.update({
        where: { id: current.id },
        data: { lifecycle: 'active', publishedAt: now, scheduledAt: null }
      });
    });
  }
}

'''
replace_once(
    "apps/worker/src/index.ts",
    worker_anchor,
    worker_helper + worker_anchor,
)
replace_once(
    "apps/worker/src/index.ts",
    "  await prisma.contentVersion.updateMany({ where: { lifecycle: 'scheduled', scheduledAt: { lte: now }, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }, data: { lifecycle: 'active', publishedAt: now } });",
    "  await activateScheduledContent(now);",
)

route_test_path = Path("tools/test/api-routes.test.mjs")
route_test = route_test_path.read_text(encoding="utf-8")
route_test = route_test.replace(
    "  'DELETE /api/v1/admin/chat-commands/:id',",
    "  'DELETE /api/v1/admin/chat-commands/:id',\n  'DELETE /api/v1/admin/expedition-creator/:id',",
    1,
)
route_test = route_test.replace(
    "  'POST /api/v1/admin/expedition-creator',",
    "  'POST /api/v1/admin/expedition-creator',\n  'POST /api/v1/admin/expedition-creator/:id/activate',\n  'POST /api/v1/admin/expedition-creator/:id/retire',",
    1,
)
route_test_path.write_text(route_test, encoding="utf-8")

Path("tools/test/expedition-definitions.test.ts").write_text(r'''import test from 'node:test';
import assert from 'node:assert/strict';
import { expeditionDefinitions } from '@neon-wreckers/content';
import { activeExpeditionDefinitions } from '../../apps/api/src/services/expedition-definitions.js';

const base = Object.values(expeditionDefinitions)[0];

test('newest valid active authored expedition version wins', async () => {
  const older = { ...base, slug: 'handmade-test', name: 'Older Handmade Mission' };
  const newer = { ...older, name: 'Newest Handmade Mission' };
  const prisma = {
    contentVersion: {
      findMany: async () => [
        { slug: 'expedition.handmade-test', version: 2, contentJson: newer },
        { slug: 'expedition.handmade-test', version: 1, contentJson: older }
      ]
    }
  } as unknown as Parameters<typeof activeExpeditionDefinitions>[0];

  const definitions = await activeExpeditionDefinitions(prisma);
  assert.equal(definitions['handmade-test'].name, 'Newest Handmade Mission');
});

test('an invalid newest authored version falls back to the next valid active version', async () => {
  const valid = { ...base, slug: 'fallback-test', name: 'Valid Fallback Mission' };
  const prisma = {
    contentVersion: {
      findMany: async () => [
        { slug: 'expedition.fallback-test', version: 3, contentJson: { slug: 'fallback-test' } },
        { slug: 'expedition.fallback-test', version: 2, contentJson: valid }
      ]
    }
  } as unknown as Parameters<typeof activeExpeditionDefinitions>[0];

  const definitions = await activeExpeditionDefinitions(prisma);
  assert.equal(definitions['fallback-test'].name, 'Valid Fallback Mission');
});
''', encoding="utf-8")

print("Expedition lifecycle fix applied.")
