import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (file) =>
  readFile(new URL(`../../${file}`, import.meta.url), "utf8");

const sourceSlice = (source, startMarker, endMarker) => {
  const start = source.indexOf(startMarker);
  assert.notEqual(start, -1, `Missing source marker: ${startMarker}`);
  const end = source.indexOf(endMarker, start);
  assert.notEqual(end, -1, `Missing source marker: ${endMarker}`);
  return source.slice(start, end);
};

const loadForceResolve = (source) => {
  const implementation = sourceSlice(
    source,
    "export async function forceResolveExpedition(",
    "export function TimersPage(",
  )
    .replace("export async function", "async function")
    .replace("id: string", "id")
    .replace("dependencies: ForceResolveDependencies", "dependencies");

  return Function(`${implementation}; return forceResolveExpedition;`)();
};

test("AdminApp imports and composes the focused Timers feature", async () => {
  const [main, timers] = await Promise.all([
    read("apps/admin/src/main.tsx"),
    read("apps/admin/src/features/timers/timers-page.tsx"),
  ]);

  assert.match(
    main,
    /import \{ TimersPage \} from "\.\/features\/timers\/timers-page\.js";/,
  );
  assert.doesNotMatch(main, /^function TimersPage\b/m);
  assert.match(
    main,
    /timers:\s*\(\s*<TimersPage\s+timers=\{overview\?\.timers \?\? \[\]\}\s+refresh=\{refresh\}\s+pushToast=\{pushToast\}\s*\/>\s*\)/,
  );

  assert.match(timers, /export function TimersPage\(\{/);
  assert.match(timers, /timers: TimerRecord\[\]/);
  assert.doesNotMatch(
    timers,
    /\/api\/v1\/(?:me|admin\/overview|station|admin\/players|admin\/transactions|admin\/config|admin\/live-ops|admin\/balance-telemetry|admin\/expedition-creator|admin\/chat-commands)/,
  );
  assert.doesNotMatch(
    timers,
    /AppShell|CommandNavigation|navigation|AccessDenied|ServerPage|requireAdmin|requireUser/,
  );
});

test("Timers presentation preserves the active record shape and copy", async () => {
  const timers = await read("apps/admin/src/features/timers/timers-page.tsx");

  for (const field of ["id", "name", "playerName", "resolvesAt"]) {
    assert.match(timers, new RegExp(`\\b${field}: string;`));
  }

  for (const text of [
    "SCHEDULE CONTROL",
    "Active Expedition Timers",
    "Force an overdue or stuck expedition into its server-calculated resolved state. Players must still claim their rewards.",
    "No active expedition timers.",
    "Player",
    "Mission",
    "Scheduled return",
    "Control",
    "Resolve now",
    "Other command timers",
    "Player crafting, salvage, scan, station-maintenance, and career timers",
    "are listed and reset from the Players workspace. Live-event timers are",
    "stopped and reset from Operations.",
  ]) {
    assert.ok(timers.includes(text), `Missing Timers presentation contract: ${text}`);
  }

  assert.match(timers, /rows=\{timers\}/);
  assert.match(timers, /render: \(row\) => <strong>\{row\.playerName\}<\/strong>/);
  assert.match(timers, /render: \(row\) => row\.name/);
  assert.match(
    timers,
    /render: \(row\) => new Date\(row\.resolvesAt\)\.toLocaleString\(\)/,
  );
  assert.match(timers, /header: "Control",\s*align: "right"/);
  assert.match(timers, /size="sm"\s+variant="warning"/);
});

test("confirming force resolution sends the exact bodyless POST and refreshes once", async () => {
  const timers = await read("apps/admin/src/features/timers/timers-page.tsx");
  const forceResolveExpedition = loadForceResolve(timers);
  const confirmations = [];
  const requests = [];
  const toasts = [];
  let refreshes = 0;

  await forceResolveExpedition("timer-123", {
    confirm: (message) => {
      confirmations.push(message);
      return true;
    },
    request: async (...args) => {
      requests.push(args);
    },
    refresh: async () => {
      refreshes += 1;
    },
    pushToast: (toast) => toasts.push(toast),
    errorMessage: (error) => String(error),
  });

  assert.deepEqual(confirmations, ["Resolve this expedition immediately?"]);
  assert.deepEqual(requests, [
    ["/api/v1/expeditions/timer-123/resolve-now", { method: "POST" }],
  ]);
  assert.equal("body" in requests[0][1], false);
  assert.deepEqual(toasts, [
    { title: "Expedition timer resolved", tone: "success" },
  ]);
  assert.equal(refreshes, 1);
});

test("cancelling confirmation sends no request, toast, or refresh", async () => {
  const timers = await read("apps/admin/src/features/timers/timers-page.tsx");
  const forceResolveExpedition = loadForceResolve(timers);
  let requests = 0;
  let refreshes = 0;
  const toasts = [];

  await forceResolveExpedition("timer-cancel", {
    confirm: (message) => {
      assert.equal(message, "Resolve this expedition immediately?");
      return false;
    },
    request: async () => {
      requests += 1;
    },
    refresh: async () => {
      refreshes += 1;
    },
    pushToast: (toast) => toasts.push(toast),
    errorMessage: (error) => String(error),
  });

  assert.equal(requests, 0);
  assert.equal(refreshes, 0);
  assert.deepEqual(toasts, []);
});

test("failed force resolution emits only the existing danger toast", async () => {
  const timers = await read("apps/admin/src/features/timers/timers-page.tsx");
  const forceResolveExpedition = loadForceResolve(timers);
  let refreshes = 0;
  const toasts = [];

  await forceResolveExpedition("timer-fail", {
    confirm: () => true,
    request: async () => {
      throw new Error("resolution exploded");
    },
    refresh: async () => {
      refreshes += 1;
    },
    pushToast: (toast) => toasts.push(toast),
    errorMessage: (error) => error.message,
  });

  assert.deepEqual(toasts, [
    {
      title: "Timer command failed",
      message: "resolution exploded",
      tone: "danger",
    },
  ]);
  assert.equal(
    toasts.some((toast) => toast.title === "Expedition timer resolved"),
    false,
  );
  assert.equal(refreshes, 0);
});

test("Timers extraction preserves shell refresh, navigation, visual proof, and API authorization", async () => {
  const [main, capture, api] = await Promise.all([
    read("apps/admin/src/main.tsx"),
    read("tools/visual-proof/capture-admin-overlay.mjs"),
    read("apps/api/src/routes/expeditions.ts"),
  ]);

  assert.match(main, /const \[tab, setTab\] = useState\("operations"\)/);
  const navigation = sourceSlice(
    main,
    "const navigation: TabItem[] = [",
    "function Root()",
  );
  const serverIndex = navigation.indexOf(
    '{ id: "server", label: "Server", icon: "diagnostics" }',
  );
  const timersIndex = navigation.indexOf(
    '{ id: "timers", label: "Timers", icon: "events" }',
  );
  const playersIndex = navigation.indexOf(
    '{ id: "players", label: "Players", icon: "crew" }',
  );
  assert.ok(serverIndex < timersIndex && timersIndex < playersIndex);

  const refresh = sourceSlice(
    main,
    "const refresh = useCallback",
    "setStation(stationData);",
  );
  const requestedEndpoints = [
    ...refresh.matchAll(/"(\/api\/v1\/[^"]+)"/g),
  ].map((match) => match[1]);
  assert.deepEqual(requestedEndpoints, [
    "/api/v1/station",
    "/api/v1/integrations/streamelements/health",
    "/api/v1/admin/chat-commands",
    "/api/v1/admin/config",
    "/api/v1/admin/overview",
    "/api/v1/admin/players",
    "/api/v1/admin/transactions",
    "/api/v1/admin/balance-telemetry",
    "/api/v1/admin/live-ops",
    "/api/v1/admin/expedition-creator",
  ]);
  assert.match(refresh, /await Promise\.all\(\[/);

  const fixture = sourceSlice(
    capture,
    "const adminData = {",
    "const overlayStation = {",
  );
  const fixtureEndpoints = new Set(
    [...fixture.matchAll(/^\s*'(\/api\/v1\/[^']+)':/gm)].map(
      (match) => match[1],
    ),
  );
  for (const endpoint of requestedEndpoints) {
    assert.ok(
      fixtureEndpoints.has(endpoint),
      `${endpoint} must remain explicitly covered by authenticated visual proof`,
    );
  }
  assert.match(
    capture,
    /\['timers', 'Timers'\]/,
  );
  assert.match(
    capture,
    /`\$\{outputRoot\}\/admin\/desktop\/\$\{name\}\.png`/,
  );
  assert.match(fixture, /timers:\s*\[/);
  assert.match(fixture, /playerName:/);
  assert.match(fixture, /resolvesAt:/);

  const resolveRoute = sourceSlice(
    api,
    "app.post('/api/v1/expeditions/:id/resolve-now'",
    "app.post('/api/v1/expeditions/:id/claim'",
  );
  assert.match(resolveRoute, /await requireAdmin\(context\.prisma, request\)/);
  assert.match(
    resolveRoute,
    /const id = String\(\(request\.params as \{ id: string \}\)\.id\)/,
  );
  assert.doesNotMatch(resolveRoute, /request\.body/);
});
