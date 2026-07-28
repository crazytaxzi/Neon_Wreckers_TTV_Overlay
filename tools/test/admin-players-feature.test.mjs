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

const loadFilterPlayers = (source) => {
  const implementation = sourceSlice(
    source,
    "export function filterPlayers(",
    "export function shouldClearPlayerSelection(",
  )
    .replace("export function", "function")
    .replace("players: AdminPlayer[]", "players")
    .replace("query: string", "query");

  return Function(`${implementation}; return filterPlayers;`)();
};

const loadShouldClearPlayerSelection = (source) => {
  const implementation = sourceSlice(
    source,
    "export function shouldClearPlayerSelection(",
    "export async function postPlayerCommand(",
  )
    .replace("export function", "function")
    .replace("selected: AdminPlayer | null", "selected")
    .replace("players: AdminPlayer[]", "players");

  return Function(`${implementation}; return shouldClearPlayerSelection;`)();
};

const loadPostPlayerCommand = (source) => {
  const implementation = sourceSlice(
    source,
    "export async function postPlayerCommand(",
    "export function PlayersPage(",
  )
    .replace("export async function", "async function")
    .replace("path: string", "path")
    .replace("body: unknown", "body")
    .replace("success: string", "success")
    .replace("dependencies: PlayerCommandDependencies", "dependencies");

  return Function(`${implementation}; return postPlayerCommand;`)();
};

const players = [
  {
    id: "p1",
    displayName: "WRECKER_77",
    twitchLogin: "wrecker77",
    credits: 8450,
    xp: 12840,
    level: 47,
    reputation: 2890,
    bannedUntil: null,
    cooldowns: [
      {
        id: "cd1",
        actionKey: "salvage.scan",
        expiresAt: "2026-07-28T22:38:44Z",
      },
    ],
  },
  {
    id: "p2",
    displayName: "NOVA_9",
    twitchLogin: "nova9",
    credits: 5220,
    xp: 9400,
    level: 31,
    reputation: 1880,
    bannedUntil: null,
    cooldowns: [],
  },
];

test("AdminApp imports and composes the focused Players feature while retaining shell ownership", async () => {
  const [main, feature] = await Promise.all([
    read("apps/admin/src/main.tsx"),
    read("apps/admin/src/features/players/players-page.tsx"),
  ]);

  assert.match(
    main,
    /import \{\s*PlayersPage,\s*type AdminPlayer,\s*\} from "\.\/features\/players\/players-page\.js";/,
  );
  assert.doesNotMatch(main, /^function PlayersPage\b/m);
  assert.doesNotMatch(main, /^type AdminPlayer\b/m);
  assert.match(
    main,
    /const \[players, setPlayers\] = useState<AdminPlayer\[\]>\(\[\]\);/,
  );
  assert.match(
    main,
    /players:\s*\(\s*<PlayersPage players=\{players\} refresh=\{refresh\} pushToast=\{pushToast\} \/>\s*\)/,
  );

  assert.match(feature, /export function PlayersPage\(\{/);
  assert.match(feature, /players: AdminPlayer\[\];/);
  assert.match(
    feature,
    /import \{ errorMessage, requestApi \} from "@neon-wreckers\/browser-client";/,
  );
  assert.doesNotMatch(
    feature,
    /AppShell|CommandNavigation|const navigation|AccessDenied|setPlayers|Promise\.all|\/api\/v1\/(?:me|station|admin\/(?:overview|players"\)|transactions|config|live-ops|balance-telemetry|expedition-creator|chat-commands))/,
  );
});

test("Players presentation preserves the browser data shape, local defaults, copy, formatting, classes, and controls", async () => {
  const feature = await read("apps/admin/src/features/players/players-page.tsx");

  for (const field of [
    "id: string;",
    "displayName: string;",
    "twitchLogin: string;",
    "credits: number;",
    "xp: number;",
    "level: number;",
    "reputation: number;",
    "bannedUntil: string | null;",
    "actionKey: string;",
    "expiresAt: string;",
  ]) {
    assert.ok(feature.includes(field), `Missing player field: ${field}`);
  }

  assert.match(feature, /const \[query, setQuery\] = useState\(""\);/);
  assert.match(
    feature,
    /const \[selected, setSelected\] = useState<AdminPlayer \| null>\(null\);/,
  );
  assert.match(feature, /const \[credits, setCredits\] = useState\(0\);/);
  assert.match(feature, /const \[xp, setXp\] = useState\(0\);/);
  assert.match(
    feature,
    /const \[reputation, setReputation\] = useState\(0\);/,
  );
  assert.match(
    feature,
    /const \[reason, setReason\] = useState\("Operator correction"\);/,
  );

  for (const text of [
    "admin-stack",
    "PLAYER ADMINISTRATION",
    "Accounts, Balances & Cooldowns",
    "All changes require a reason and are written to the audit log.",
    "Find player",
    "Display name or Twitch login",
    "admin-player-layout",
    "admin-player-list",
    "admin-player-button",
    "is-selected",
    "Required audit reason",
    "Credit adjustment",
    "XP adjustment",
    "Reputation adjustment",
    "Apply adjustments",
    "ACTION TIMERS",
    "Active Cooldowns",
    "admin-cooldowns",
    "Reset",
    "Reset every player timer",
  ]) {
    assert.ok(feature.includes(text), `Missing Players contract: ${text}`);
  }

  assert.match(feature, /icon="crew"/);
  assert.match(feature, /<strong>\{player\.displayName\}<\/strong>/);
  assert.match(feature, /@\{player\.twitchLogin\} · L\{player\.level\}/);
  assert.match(feature, /player\.credits\.toLocaleString\(\)/);
  assert.match(feature, /\{player\.cooldowns\.length\} cooldowns/);
  assert.doesNotMatch(feature, /No players|No matching players|empty=/i);
  assert.match(feature, /title=\{`Manage \$\{selected\.displayName\}`\}/);
  assert.match(
    feature,
    /description="Adjust balances and persistent cooldowns with an audited reason\."/,
  );
  assert.match(feature, /size="lg"/);
  assert.match(
    feature,
    /label="Credits"[\s\S]*?icon="credits"[\s\S]*?tone="success"/,
  );
  assert.match(
    feature,
    /label="XP"[\s\S]*?icon="data"[\s\S]*?tone="info"/,
  );
  assert.match(
    feature,
    /label="Reputation"[\s\S]*?icon="museum"[\s\S]*?tone="purple"/,
  );
  assert.match(
    feature,
    /new Date\(cooldown\.expiresAt\)\.toLocaleString\(\)/,
  );
  assert.match(feature, /size="sm"\s+variant="ghost"/);
  assert.match(
    feature,
    /variant="warning"\s+fullWidth\s+disabled=\{!selected\.cooldowns\.length\}/,
  );
});

test("Players search remains client-side, case-insensitive, combined, and unnormalized", async () => {
  const feature = await read("apps/admin/src/features/players/players-page.tsx");
  const filterPlayers = loadFilterPlayers(feature);

  assert.deepEqual(filterPlayers(players, ""), players);
  assert.deepEqual(filterPlayers(players, "wrecker_77"), [players[0]]);
  assert.deepEqual(filterPlayers(players, "WrEcKeR77"), [players[0]]);
  assert.deepEqual(filterPlayers(players, "nova_9 nova9"), [players[1]]);
  assert.deepEqual(filterPlayers(players, " nova9 "), []);
  assert.deepEqual(filterPlayers(players, "missing"), []);

  assert.match(
    feature,
    /return players\.filter\(\(player\) =>\s*`\$\{player\.displayName\} \$\{player\.twitchLogin\}`\s*\.toLowerCase\(\)\s*\.includes\(query\.toLowerCase\(\)\),\s*\);/,
  );
  assert.doesNotMatch(feature, /debounce|trim\(|normalize\(|localeCompare|fuzzy/i);
  assert.doesNotMatch(feature, /requestApi[^\n]*\?q=|URLSearchParams/);
});

test("selection cleanup clears only a missing identifier and does not reconcile the selected object", async () => {
  const feature = await read("apps/admin/src/features/players/players-page.tsx");
  const shouldClearPlayerSelection = loadShouldClearPlayerSelection(feature);
  const staleSelected = { ...players[0], credits: 1 };
  const refreshedSameId = { ...players[0], credits: 999999 };

  assert.equal(shouldClearPlayerSelection(null, players), false);
  assert.equal(shouldClearPlayerSelection(staleSelected, [refreshedSameId]), false);
  assert.equal(shouldClearPlayerSelection(staleSelected, [players[1]]), true);

  const effect = sourceSlice(feature, "useEffect(() => {", "const visible =");
  assert.match(
    effect,
    /if \(shouldClearPlayerSelection\(selected, players\)\) setSelected\(null\);/,
  );
  assert.doesNotMatch(effect, /setSelected\([^n]|find\(|map\(/);
  assert.match(feature, /onClick=\{\(\) => setSelected\(player\)\}/);
  assert.match(feature, /onClose=\{\(\) => setSelected\(null\)\}/);
});

test("number inputs preserve exact browser Number conversion and serialization consequences", async () => {
  const feature = await read("apps/admin/src/features/players/players-page.tsx");

  assert.equal(
    (feature.match(/Number\(event\.target\.value\)/g) ?? []).length,
    3,
  );
  assert.equal(Number(""), 0);
  assert.equal(Number("-17"), -17);
  assert.equal(Number("1.5"), 1.5);
  assert.equal(Number("not-a-number"), Number.NaN);
  assert.equal(JSON.stringify({ credits: Number("not-a-number") }), '{"credits":null}');
  assert.doesNotMatch(feature, /parseInt|parseFloat|Math\.(?:round|floor|ceil|max|min)/);
});

test("player commands preserve exact POST serialization, success refresh, and failure behavior", async () => {
  const feature = await read("apps/admin/src/features/players/players-page.tsx");
  const postPlayerCommand = loadPostPlayerCommand(feature);

  const cases = [
    {
      path: "/api/v1/admin/players/p1/adjust",
      body: { credits: -50, xp: 25, reputation: 3, reason: "Operator correction" },
      serialized:
        '{"credits":-50,"xp":25,"reputation":3,"reason":"Operator correction"}',
      success: "Player balances updated",
    },
    {
      path: "/api/v1/admin/players/p1/cooldowns/reset",
      body: { actionKey: "salvage.scan", reason: "Operator correction" },
      serialized:
        '{"actionKey":"salvage.scan","reason":"Operator correction"}',
      success: "Cooldown reset",
    },
    {
      path: "/api/v1/admin/players/p1/cooldowns/reset",
      body: { reason: "Operator correction" },
      serialized: '{"reason":"Operator correction"}',
      success: "All cooldowns reset",
    },
  ];

  for (const command of cases) {
    const requests = [];
    const toasts = [];
    let refreshes = 0;
    await postPlayerCommand(command.path, command.body, command.success, {
      request: async (...args) => requests.push(args),
      refresh: async () => {
        refreshes += 1;
      },
      pushToast: (toast) => toasts.push(toast),
      errorMessage: (error) => String(error),
    });

    assert.deepEqual(requests, [
      [command.path, { method: "POST", body: command.serialized }],
    ]);
    assert.deepEqual(toasts, [
      { title: command.success, tone: "success" },
    ]);
    assert.equal(refreshes, 1);
  }

  const failureToasts = [];
  let failureRefreshes = 0;
  await postPlayerCommand(
    "/api/v1/admin/players/p1/adjust",
    { credits: 1, xp: 0, reputation: 0, reason: "Operator correction" },
    "Player balances updated",
    {
      request: async () => {
        throw new Error("command exploded");
      },
      refresh: async () => {
        failureRefreshes += 1;
      },
      pushToast: (toast) => failureToasts.push(toast),
      errorMessage: (error) => error.message,
    },
  );

  assert.deepEqual(failureToasts, [
    {
      title: "Admin command failed",
      message: "command exploded",
      tone: "danger",
    },
  ]);
  assert.equal(
    failureToasts.some((toast) => toast.title === "Player balances updated"),
    false,
  );
  assert.equal(failureRefreshes, 0);

  assert.match(
    feature,
    /`\/api\/v1\/admin\/players\/\$\{selected\.id\}\/adjust`,\s*\{ credits, xp, reputation, reason \},\s*"Player balances updated"/,
  );
  assert.match(
    feature,
    /`\/api\/v1\/admin\/players\/\$\{selected\.id\}\/cooldowns\/reset`,\s*\{ actionKey: cooldown\.actionKey, reason \},\s*"Cooldown reset"/,
  );
  assert.match(
    feature,
    /`\/api\/v1\/admin\/players\/\$\{selected\.id\}\/cooldowns\/reset`,\s*\{ reason \},\s*"All cooldowns reset"/,
  );
  assert.doesNotMatch(feature, /window\.confirm|ConfirmWindow|confirm\(/);

  const command = sourceSlice(
    feature,
    "export async function postPlayerCommand(",
    "export function PlayersPage(",
  );
  assert.doesNotMatch(
    command,
    /setSelected|setCredits|setXp|setReputation|setReason|close|loading|pending|disabled/i,
  );
});

test("Players extraction preserves shell refresh order, navigation, visual proof, browser client, and production API semantics", async () => {
  const [main, capture, api, browserClient] = await Promise.all([
    read("apps/admin/src/main.tsx"),
    read("tools/visual-proof/capture-admin-overlay.mjs"),
    read("apps/api/src/routes/admin.ts"),
    read("packages/browser-client/src/index.ts"),
  ]);

  assert.match(main, /const \[tab, setTab\] = useState\("operations"\)/);
  const navigation = sourceSlice(
    main,
    "const navigation: TabItem[] = [",
    "function Root()",
  );
  const timersIndex = navigation.indexOf(
    '{ id: "timers", label: "Timers", icon: "events" }',
  );
  const playersIndex = navigation.indexOf(
    '{ id: "players", label: "Players", icon: "crew" }',
  );
  const refundsIndex = navigation.indexOf(
    '{ id: "transactions", label: "Refunds", icon: "credits" }',
  );
  assert.ok(timersIndex < playersIndex && playersIndex < refundsIndex);

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
  assert.match(main, /setPlayers\(playersData\);/);

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
  assert.match(fixture, /'\/api\/v1\/admin\/players': \[/);
  for (const field of [
    "displayName:",
    "twitchLogin:",
    "credits:",
    "xp:",
    "level:",
    "reputation:",
    "bannedUntil:",
    "cooldowns:",
  ]) {
    assert.match(fixture, new RegExp(field));
  }
  assert.match(
    capture,
    /\['players', 'Players'\][^\n]*1920|adminViews[\s\S]*\['players', 'Players'\]/,
  );
  assert.match(
    capture,
    /\[\['operations', 'Operations'\][\s\S]*\['players', 'Players'\][\s\S]*1024/,
  );
  assert.match(
    capture,
    /\[\['operations', 'Operations'\][\s\S]*\['players', 'Players'\][\s\S]*390/,
  );
  assert.match(
    capture,
    /`\$\{outputRoot\}\/admin\/desktop\/\$\{name\}\.png`/,
  );
  assert.match(
    capture,
    /`\$\{outputRoot\}\/admin\/tablet\/\$\{name\}\.png`/,
  );
  assert.match(
    capture,
    /`\$\{outputRoot\}\/admin\/mobile\/\$\{name\}\.png`/,
  );

  assert.match(browserClient, /if \(init\.body != null && !headers\.has\('content-type'\)\)/);
  assert.match(browserClient, /headers\.set\('content-type', 'application\/json'\)/);
  assert.match(browserClient, /credentials: 'include'/);

  const listRoute = sourceSlice(
    api,
    "app.get('/api/v1/admin/players'",
    "app.post('/api/v1/admin/players/:id/adjust'",
  );
  assert.match(listRoute, /await requireAdmin\(context\.prisma, request\)/);
  assert.match(listRoute, /q: z\.string\(\)\.max\(100\)\.optional\(\)/);
  assert.match(listRoute, /displayName: \{ contains: query\.q, mode: 'insensitive' \}/);
  assert.match(listRoute, /twitchLogin: \{ contains: query\.q, mode: 'insensitive' \}/);
  assert.match(listRoute, /expiresAt: \{ gt: new Date\(\) \}/);
  assert.match(listRoute, /orderBy: \{ displayName: 'asc' \}/);
  assert.match(listRoute, /take: 100/);
  assert.match(listRoute, /users\.filter\(user => user\.player\)/);
  assert.match(listRoute, /id: user\.player!\.id, userId: user\.id/);

  const adjustRoute = sourceSlice(
    api,
    "app.post('/api/v1/admin/players/:id/adjust'",
    "app.post('/api/v1/admin/players/:id/cooldowns/reset'",
  );
  assert.match(adjustRoute, /await requireAdmin\(context\.prisma, request\)/);
  assert.match(adjustRoute, /credits: z\.number\(\)\.int\(\)\.min\(-10_000_000\)\.max\(10_000_000\)\.default\(0\)/);
  assert.match(adjustRoute, /xp: z\.number\(\)\.int\(\)\.min\(-10_000_000\)\.max\(10_000_000\)\.default\(0\)/);
  assert.match(adjustRoute, /reputation: z\.number\(\)\.int\(\)\.min\(-100_000\)\.max\(100_000\)\.default\(0\)/);
  assert.match(adjustRoute, /reason: z\.string\(\)\.trim\(\)\.min\(3\)\.max\(300\)/);
  assert.match(adjustRoute, /context\.prisma\.\$transaction/);
  assert.match(adjustRoute, /findUniqueOrThrow/);
  assert.match(adjustRoute, /Math\.max\(0, current\.credits \+ body\.credits\)/);
  assert.match(adjustRoute, /Math\.max\(0, current\.xp \+ body\.xp\)/);
  assert.match(adjustRoute, /Math\.max\(0, current\.reputation \+ body\.reputation\)/);
  assert.match(adjustRoute, /action: 'player\.adjust'/);
  assert.match(adjustRoute, /before: \{ credits: current\.credits, xp: current\.xp, reputation: current\.reputation \}/);
  assert.match(adjustRoute, /after: \{ \.\.\.body, credits: updated\.credits, xp: updated\.xp, reputation: updated\.reputation \}/);
  assert.match(adjustRoute, /requestId: request\.id/);

  const resetRoute = sourceSlice(
    api,
    "app.post('/api/v1/admin/players/:id/cooldowns/reset'",
    "app.get('/api/v1/admin/transactions'",
  );
  assert.match(resetRoute, /await requireAdmin\(context\.prisma, request\)/);
  assert.match(resetRoute, /actionKey: z\.string\(\)\.min\(1\)\.optional\(\)/);
  assert.match(resetRoute, /reason: z\.string\(\)\.trim\(\)\.min\(3\)\.max\(300\)/);
  assert.match(resetRoute, /deleteMany\(\{ where: \{ playerId, \.\.\.\(body\.actionKey \? \{ actionKey: body\.actionKey \} : \{\}\) \} \}\)/);
  assert.match(resetRoute, /action: 'cooldown\.reset'/);
  assert.match(resetRoute, /actionKey: body\.actionKey \?\? '\*'/);
  assert.match(resetRoute, /count: removed\.count/);
  assert.match(resetRoute, /reason: body\.reason/);
  assert.match(resetRoute, /return \{ data: \{ reset: removed\.count \}, requestId: request\.id \}/);
});
