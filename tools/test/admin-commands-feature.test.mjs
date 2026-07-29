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

const loadCreateCommandDraft = (source) => {
  const implementation = sourceSlice(
    source,
    "export function createCommandDraft()",
    "export function findSelectedCommand(",
  )
    .replace("export function", "function")
    .replace(": ChatCommand", "");
  return Function(`${implementation}; return createCommandDraft;`)();
};

const loadFindSelectedCommand = (source) => {
  const implementation = sourceSlice(
    source,
    "export function findSelectedCommand(",
    "export function commandActionKey(",
  )
    .replace("export function", "function")
    .replace("commands: ChatCommand[]", "commands")
    .replace("selectedId: string", "selectedId");
  return Function(`${implementation}; return findSelectedCommand;`)();
};

const loadCommandActionKey = (source) => {
  const implementation = sourceSlice(
    source,
    "export function commandActionKey(",
    "export function commandActionForValue(",
  )
    .replace("export function", "function")
    .replace("draft: ChatCommand | null", "draft");
  return Function(`${implementation}; return commandActionKey;`)();
};

const loadCommandActionForValue = (source) => {
  const implementation = sourceSlice(
    source,
    "export function commandActionForValue(",
    "export async function saveAdminChatCommand(",
  )
    .replace("export function", "function")
    .replace("value: string", "value")
    .replace("): ChatCommandAction | null", ")");
  return Function(`${implementation}; return commandActionForValue;`)();
};

const loadSaveAdminChatCommand = (source) => {
  const implementation = sourceSlice(
    source,
    "export async function saveAdminChatCommand(",
    "export async function retireAdminChatCommand(",
  )
    .replace("export async function", "async function")
    .replace("draft: ChatCommand | null", "draft")
    .replace("selectedId: string | null", "selectedId")
    .replace("dependencies: SaveCommandDependencies", "dependencies");
  return Function(`${implementation}; return saveAdminChatCommand;`)();
};

const loadRetireAdminChatCommand = (source) => {
  const implementation = sourceSlice(
    source,
    "export async function retireAdminChatCommand(",
    "export function CommandsPage(",
  )
    .replace("export async function", "async function")
    .replace("selectedId: string | null", "selectedId")
    .replace("draft: ChatCommand | null", "draft")
    .replace("dependencies: RetireCommandDependencies", "dependencies");
  return Function(`${implementation}; return retireAdminChatCommand;`)();
};

const commands = [
  {
    id: "scan",
    trigger: "!scan",
    description: "Scan for a new wreck.",
    enabled: true,
    requiresPlayer: true,
    action: { type: "scan" },
    updatedAt: null,
    source: "default",
  },
  {
    id: "salvage-cutters",
    trigger: "!salvage cutters",
    description: "Deploy cutters against the active wreck.",
    enabled: false,
    requiresPlayer: true,
    action: { type: "salvage", mode: "cutters" },
    updatedAt: "2026-07-28T20:00:00Z",
    source: "configured",
  },
];

test("AdminApp imports and composes the focused Commands feature while retaining shell ownership", async () => {
  const [main, feature] = await Promise.all([
    read("apps/admin/src/main.tsx"),
    read("apps/admin/src/features/commands/commands-page.tsx"),
  ]);

  assert.match(
    main,
    /import \{\s*CommandsPage,\s*type ChatCommand,\s*\} from "\.\/features\/commands\/commands-page\.js";/,
  );
  assert.doesNotMatch(main, /^function CommandsPage\b/m);
  assert.doesNotMatch(main, /^type ChatCommandAction\b/m);
  assert.doesNotMatch(main, /^type ChatCommand\b/m);
  assert.match(
    main,
    /const \[commands, setCommands\] = useState<ChatCommand\[\]>\(\[\]\);/,
  );
  assert.match(
    main,
    /commands:\s*\(\s*<CommandsPage\s+commands=\{commands\}\s+refresh=\{refresh\}\s+pushToast=\{pushToast\}\s*\/>\s*\)/,
  );

  assert.match(feature, /export function CommandsPage\(\{/);
  assert.match(feature, /commands: ChatCommand\[\];/);
  assert.match(
    feature,
    /import \{ errorMessage, requestApi \} from "@neon-wreckers\/browser-client";/,
  );
  assert.doesNotMatch(
    feature,
    /AppShell|CommandNavigation|const navigation|AccessDenied|LoadingScreen|setCommands|Promise\.all|\/api\/v1\/(?:me|station|integrations\/streamelements\/health|admin\/(?:config|overview|players|transactions|balance-telemetry|live-ops|expedition-creator))/,
  );
});

test("AdminApp preserves Commands navigation, default tab, shell loading, and exact ten-resource refresh order", async () => {
  const main = await read("apps/admin/src/main.tsx");
  assert.match(
    main,
    /\{ id: "commands", label: "Commands", icon: "terminal" \}/,
  );
  assert.ok(
    main.indexOf('{ id: "integrations", label: "Integrations", icon: "network" }') <
      main.indexOf('{ id: "commands", label: "Commands", icon: "terminal" }'),
  );
  assert.ok(
    main.indexOf('{ id: "commands", label: "Commands", icon: "terminal" }') <
      main.indexOf('{ id: "server", label: "Server", icon: "diagnostics" }'),
  );
  assert.match(main, /const \[tab, setTab\] = useState\("operations"\);/);

  const refresh = sourceSlice(
    main,
    "const refresh = useCallback",
    "setStation(stationData);",
  );
  const endpoints = [...refresh.matchAll(/"(\/api\/v1\/[^\"]+)"/g)].map(
    (match) => match[1],
  );
  assert.deepEqual(endpoints, [
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
  assert.equal((refresh.match(/Promise\.all/g) ?? []).length, 1);
  assert.match(
    refresh,
    /requestApi<ChatCommand\[\]>\("\/api\/v1\/admin\/chat-commands"\)/,
  );
  assert.match(
    main,
    /setStation\(stationData\);\s*setStreamElements\(streamElementsData\);\s*setCommands\(commandData\);\s*setConfig\(configData\);/,
  );
});

test("authenticated visual proof retains all ten fixtures and Commands desktop, tablet, and mobile captures", async () => {
  const [main, capture] = await Promise.all([
    read("apps/admin/src/main.tsx"),
    read("tools/visual-proof/capture-admin-overlay.mjs"),
  ]);
  const refresh = sourceSlice(
    main,
    "const refresh = useCallback",
    "setStation(stationData);",
  );
  const endpoints = [...refresh.matchAll(/"(\/api\/v1\/[^\"]+)"/g)].map(
    (match) => match[1],
  );
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
  assert.equal(endpoints.length, 10);
  for (const endpoint of endpoints) assert.ok(fixtureEndpoints.has(endpoint));

  const commandFixture = sourceSlice(
    fixture,
    "'/api/v1/admin/chat-commands': [",
    "'/api/v1/admin/config': [",
  );
  for (const field of [
    "id:",
    "trigger:",
    "description:",
    "enabled:",
    "requiresPlayer:",
    "action:",
    "updatedAt:",
    "source:",
  ]) {
    assert.ok(commandFixture.includes(field), `Missing fixture field: ${field}`);
  }
  assert.match(commandFixture, /action: \{ type: 'scan' \}/);
  assert.match(
    commandFixture,
    /action: \{ type: 'salvage', mode: 'cutters' \}/,
  );
  assert.match(
    commandFixture,
    /action: \{ type: 'point_action', slug: 'rush_scan' \}/,
  );
  assert.match(commandFixture, /enabled: false/);

  assert.match(
    capture,
    /\['commands', 'Commands'\][\s\S]*?admin\/desktop\/\$\{name\}\.png/,
  );
  assert.match(
    capture,
    /\['commands', 'Commands'\][\s\S]*?admin\/tablet\/\$\{name\}\.png/,
  );
  assert.match(
    capture,
    /\['commands', 'Commands'\][\s\S]*?admin\/mobile\/\$\{name\}\.png/,
  );
  assert.match(capture, /width: 1920, height: 1080/);
  assert.match(capture, /width: 1024, height: 768/);
  assert.match(capture, /width: 390, height: 844/);
});

test("Commands presentation models and every current local default remain unchanged", async () => {
  const feature = await read("apps/admin/src/features/commands/commands-page.tsx");
  const createCommandDraft = loadCreateCommandDraft(feature);

  for (const field of [
    'type: "scan"',
    'type: "salvage"; mode: "cutters" | "cargo"',
    'type: "point_action"; slug: "rush_scan" | "safety_override"',
    "id: string;",
    "trigger: string;",
    "description: string;",
    "enabled: boolean;",
    "requiresPlayer: boolean;",
    "action: ChatCommandAction;",
    "updatedAt: string | null;",
    'source: "default" | "configured";',
  ]) {
    assert.ok(feature.includes(field), `Missing command model field: ${field}`);
  }

  assert.deepEqual(createCommandDraft(), {
    id: "",
    trigger: "!command",
    description: "Describe what this command does.",
    enabled: true,
    requiresPlayer: true,
    action: { type: "scan" },
    updatedAt: null,
    source: "configured",
  });
  assert.match(
    feature,
    /const \[selectedId, setSelectedId\] = useState<string \| null>\(null\);/,
  );
  assert.match(
    feature,
    /const \[draft, setDraft\] = useState<ChatCommand \| null>\(null\);/,
  );
  const newCommand = sourceSlice(feature, "const newCommand =", "const save =");
  assert.ok(
    newCommand.indexOf("setSelectedId(null);") <
      newCommand.indexOf("setDraft(createCommandDraft());"),
  );
});

test("Commands list rendering stays untransformed, ordered by incoming records, and empty without added copy", async () => {
  const feature = await read("apps/admin/src/features/commands/commands-page.tsx");
  assert.match(feature, /\{commands\.map\(\(command\) => \(/);
  assert.doesNotMatch(
    feature,
    /commands\.(?:filter|sort|toSorted|reduce|groupBy)|debounce|URLSearchParams|search|query|pagination|alias/i,
  );
  assert.match(feature, /key=\{command\.id\}/);
  assert.match(
    feature,
    /className=\{`admin-player-button \$\{selectedId === command\.id \? "is-selected" : ""\}`\}/,
  );
  assert.match(feature, /<strong>\{command\.trigger\}<\/strong>/);
  assert.match(feature, /<span>\{command\.description\}<\/span>/);
  assert.match(
    feature,
    /\{command\.enabled \? "Enabled" : "Disabled"\} · \{command\.source\}/,
  );
  assert.doesNotMatch(feature, /No commands|No matching commands|empty=/i);
  assert.match(
    feature,
    /<div className="admin-player-list">\s*\{commands\.map/,
  );
});

test("selection, refresh synchronization, modal close, and stale-draft contracts remain unchanged", async () => {
  const feature = await read("apps/admin/src/features/commands/commands-page.tsx");
  const findSelectedCommand = loadFindSelectedCommand(feature);
  assert.equal(findSelectedCommand(commands, "scan"), commands[0]);
  assert.equal(findSelectedCommand(commands, "missing"), undefined);

  const effect = sourceSlice(feature, "useEffect(() => {", "const newCommand =");
  assert.match(effect, /if \(!selectedId\) return;/);
  assert.match(
    effect,
    /const selected = findSelectedCommand\(commands, selectedId\);/,
  );
  assert.match(effect, /if \(selected\) setDraft\(selected\);/);
  assert.ok(
    effect.indexOf("setSelectedId(null);") < effect.indexOf("setDraft(null);"),
  );

  const selection = sourceSlice(
    feature,
    "onClick={() => {\n                  setSelectedId(command.id);",
    ">\n                <strong>{command.trigger}</strong>",
  );
  assert.ok(
    selection.indexOf("setSelectedId(command.id);") <
      selection.indexOf("setDraft(command);"),
  );

  const modal = sourceSlice(feature, "<Modal", "{draft && (");
  assert.match(modal, /open=\{Boolean\(draft\)\}/);
  assert.ok(
    modal.indexOf("setDraft(null);") < modal.indexOf("setSelectedId(null);"),
  );
  assert.match(
    modal,
    /`\$\{selectedId \? "Edit" : "Create"\} \$\{draft\.trigger\}`/,
  );
  assert.match(modal, /: "Command editor"/);
  assert.match(
    modal,
    /description="Configure the trigger and its allowlisted server action\."/,
  );
  assert.match(modal, /size="lg"/);

  const save = sourceSlice(
    feature,
    "export async function saveAdminChatCommand(",
    "export async function retireAdminChatCommand(",
  );
  assert.doesNotMatch(save, /setDraft|setSelected|clearSelected|optimistic|loading/);
  const retire = sourceSlice(
    feature,
    "export async function retireAdminChatCommand(",
    "export function CommandsPage(",
  );
  assert.match(retire, /dependencies\.clearSelected\(\);\s*await dependencies\.refresh\(\);/);
  assert.doesNotMatch(retire, /setDraft|clearDraft|close|reset/i);
});

test("action presentation keys and exact browser conversion remain unchanged", async () => {
  const feature = await read("apps/admin/src/features/commands/commands-page.tsx");
  const commandActionKey = loadCommandActionKey(feature);
  const commandActionForValue = loadCommandActionForValue(feature);

  assert.equal(commandActionKey({ action: { type: "scan" } }), "scan");
  assert.equal(
    commandActionKey({ action: { type: "salvage", mode: "cutters" } }),
    "salvage:cutters",
  );
  assert.equal(
    commandActionKey({ action: { type: "salvage", mode: "cargo" } }),
    "salvage:cargo",
  );
  assert.equal(
    commandActionKey({ action: { type: "point_action", slug: "rush_scan" } }),
    "point:rush_scan",
  );
  assert.equal(
    commandActionKey({
      action: { type: "point_action", slug: "safety_override" },
    }),
    "point:safety_override",
  );
  assert.equal(commandActionKey(null), "point:undefined");

  assert.deepEqual(commandActionForValue("scan"), { type: "scan" });
  assert.deepEqual(commandActionForValue("salvage:cutters"), {
    type: "salvage",
    mode: "cutters",
  });
  assert.deepEqual(commandActionForValue("salvage:cargo"), {
    type: "salvage",
    mode: "cargo",
  });
  assert.deepEqual(commandActionForValue("point:rush_scan"), {
    type: "point_action",
    slug: "rush_scan",
  });
  assert.deepEqual(commandActionForValue("point:safety_override"), {
    type: "point_action",
    slug: "safety_override",
  });
  assert.equal(commandActionForValue("unknown"), null);

  assert.match(feature, /if \(!draft\) return;\s*const action = commandActionForValue\(value\);\s*if \(action\) setDraft\(\{ \.\.\.draft, action \}\);/);
  for (const option of [
    '<option value="scan">Scan for wreck</option>',
    '<option value="salvage:cutters">Deploy cutters</option>',
    '<option value="salvage:cargo">Deploy cargo recovery</option>',
    '<option value="point:rush_scan">',
    '<option value="point:safety_override">',
    "Spend points: rush scan",
    "Spend points: safety override",
  ]) {
    assert.ok(feature.includes(option), `Missing action option: ${option}`);
  }
});

test("Commands rendering copy, fields, values, controls, classes, icons, tones, and conversions remain unchanged", async () => {
  const feature = await read("apps/admin/src/features/commands/commands-page.tsx");
  for (const text of [
    "admin-stack",
    "CHAT AUTOMATION",
    "Command Editor",
    "Commands map to a safe server-side action allowlist. They cannot execute arbitrary code.",
    "New command",
    "admin-player-layout",
    "admin-player-list",
    "admin-player-button",
    "is-selected",
    "EDIT COMMAND",
    "NEW COMMAND",
    "Chat trigger",
    "Starts with ! and matches the full normalized chat message",
    "Description",
    "Server action",
    "admin-check",
    "Command enabled",
    "Linked viewer account required",
    "All current command actions modify persistent player state, so",
    "the chatter must have signed into Neon Wreckers.",
    "Execution boundary",
    "The action is selected from a validated server allowlist.",
    "Point-funded actions still require a verified StreamElements",
    "account, the per-account toggle, and the server kill switch.",
    "admin-mobile-actions",
    "Save command",
    "Retire command",
  ]) {
    assert.ok(feature.includes(text), `Missing Commands contract: ${text}`);
  }
  assert.match(feature, /icon="terminal"/);
  assert.equal((feature.match(/tone="info"/g) ?? []).length, 2);
  assert.match(feature, /variant="warning"/);
  assert.match(feature, /value=\{draft\.trigger\}/);
  assert.match(feature, /trigger: event\.target\.value/);
  assert.match(feature, /value=\{draft\.description\}/);
  assert.match(feature, /description: event\.target\.value/);
  assert.match(feature, /checked=\{draft\.enabled\}/);
  assert.match(feature, /enabled: event\.target\.checked/);
  assert.doesNotMatch(
    feature,
    /\.trim\(\)|\.toLowerCase\(\)|replace\(\/\\s|parseInt|parseFloat|disabled=\{|isSaving|isRetiring|pending|loading/i,
  );
});

test("save preserves exact create and update methods, routes, serialization, success refresh, and failure behavior", async () => {
  const feature = await read("apps/admin/src/features/commands/commands-page.tsx");
  const saveAdminChatCommand = loadSaveAdminChatCommand(feature);
  const draft = {
    ...commands[1],
    trigger: "!SALVAGE   cutters",
    description: "  Browser sends this untouched.  ",
  };

  for (const selectedId of [null, "salvage/cutters beta"]) {
    const requests = [];
    const toasts = [];
    const events = [];
    await saveAdminChatCommand(draft, selectedId, {
      request: async (...args) => {
        events.push("request");
        requests.push(args);
      },
      refresh: async () => {
        events.push("refresh");
      },
      pushToast: (toast) => {
        events.push("toast");
        toasts.push(toast);
      },
      errorMessage: (error) => String(error),
    });

    assert.deepEqual(requests, [
      [
        selectedId
          ? "/api/v1/admin/chat-commands/salvage%2Fcutters%20beta"
          : "/api/v1/admin/chat-commands",
        {
          method: selectedId ? "PUT" : "POST",
          body: '{"trigger":"!SALVAGE   cutters","description":"  Browser sends this untouched.  ","enabled":false,"requiresPlayer":true,"action":{"type":"salvage","mode":"cutters"}}',
        },
      ],
    ]);
    assert.deepEqual(toasts, [
      {
        title: "Chat command saved",
        message: "!SALVAGE   cutters",
        tone: "success",
      },
    ]);
    assert.deepEqual(events, ["request", "toast", "refresh"]);
  }

  const failureToasts = [];
  let failureRefreshes = 0;
  await saveAdminChatCommand(draft, "salvage-cutters", {
    request: async () => {
      throw new Error("save exploded");
    },
    refresh: async () => {
      failureRefreshes += 1;
    },
    pushToast: (toast) => failureToasts.push(toast),
    errorMessage: (error) => error.message,
  });
  assert.deepEqual(failureToasts, [
    { title: "Command rejected", message: "save exploded", tone: "danger" },
  ]);
  assert.equal(failureRefreshes, 0);

  let noDraftRequests = 0;
  await saveAdminChatCommand(null, null, {
    request: async () => {
      noDraftRequests += 1;
    },
    refresh: async () => {},
    pushToast: () => {},
    errorMessage: String,
  });
  assert.equal(noDraftRequests, 0);
});

test("retirement preserves exact confirmation, bodyless DELETE, state sequence, cancellation, and failure behavior", async () => {
  const feature = await read("apps/admin/src/features/commands/commands-page.tsx");
  const retireAdminChatCommand = loadRetireAdminChatCommand(feature);
  const draft = commands[1];
  const events = [];
  const requests = [];
  const toasts = [];

  await retireAdminChatCommand("salvage/cutters beta", draft, {
    confirm: (copy) => {
      events.push(["confirm", copy]);
      return true;
    },
    request: async (...args) => {
      events.push("request");
      requests.push(args);
    },
    pushToast: (toast) => {
      events.push("toast");
      toasts.push(toast);
    },
    clearSelected: () => events.push("clearSelected"),
    refresh: async () => events.push("refresh"),
    errorMessage: (error) => String(error),
  });

  assert.deepEqual(requests, [
    [
      "/api/v1/admin/chat-commands/salvage%2Fcutters%20beta",
      { method: "DELETE" },
    ],
  ]);
  assert.deepEqual(toasts, [
    { title: "Chat command retired", tone: "success" },
  ]);
  assert.deepEqual(events, [
    ["confirm", "Retire !salvage cutters?"],
    "request",
    "toast",
    "clearSelected",
    "refresh",
  ]);

  const cancelled = [];
  await retireAdminChatCommand("salvage-cutters", draft, {
    confirm: (copy) => {
      cancelled.push(["confirm", copy]);
      return false;
    },
    request: async () => cancelled.push("request"),
    pushToast: () => cancelled.push("toast"),
    clearSelected: () => cancelled.push("clearSelected"),
    refresh: async () => cancelled.push("refresh"),
    errorMessage: String,
  });
  assert.deepEqual(cancelled, [["confirm", "Retire !salvage cutters?"]]);

  for (const [selectedId, candidate] of [
    [null, draft],
    ["salvage-cutters", null],
  ]) {
    let confirms = 0;
    await retireAdminChatCommand(selectedId, candidate, {
      confirm: () => {
        confirms += 1;
        return true;
      },
      request: async () => assert.fail("missing state must not request"),
      pushToast: () => assert.fail("missing state must not toast"),
      clearSelected: () => assert.fail("missing state must not clear"),
      refresh: async () => assert.fail("missing state must not refresh"),
      errorMessage: String,
    });
    assert.equal(confirms, 0);
  }

  const failed = [];
  await retireAdminChatCommand("salvage-cutters", draft, {
    confirm: () => true,
    request: async () => {
      failed.push("request");
      throw new Error("retire exploded");
    },
    pushToast: (toast) => failed.push(toast),
    clearSelected: () => failed.push("clearSelected"),
    refresh: async () => failed.push("refresh"),
    errorMessage: (error) => error.message,
  });
  assert.deepEqual(failed, [
    "request",
    { title: "Retire failed", message: "retire exploded", tone: "danger" },
  ]);
});

test("production command routes retain authorization, validation, methods, response shapes, and browser authority boundary", async () => {
  const [routes, auth, browserClient] = await Promise.all([
    read("apps/api/src/routes/chat-commands.ts"),
    read("apps/api/src/services/auth.ts"),
    read("packages/browser-client/src/index.ts"),
  ]);

  assert.match(routes, /z\.object\(\{ type: z\.literal\('scan'\) \}\)/);
  assert.match(
    routes,
    /z\.object\(\{ type: z\.literal\('salvage'\), mode: z\.enum\(\['cutters', 'cargo'\]\) \}\)/,
  );
  assert.match(
    routes,
    /z\.object\(\{ type: z\.literal\('point_action'\), slug: z\.enum\(\['rush_scan', 'safety_override'\]\) \}\)/,
  );
  assert.match(
    routes,
    /trigger: z\.string\(\)\.trim\(\)\.min\(2\)\.max\(80\)\.regex\(\/\^!\[a-z0-9\]\[a-z0-9 _-\]\*\$\/i\)/,
  );
  assert.match(
    routes,
    /description: z\.string\(\)\.trim\(\)\.min\(3\)\.max\(240\)/,
  );
  assert.match(routes, /enabled: z\.boolean\(\)\.default\(true\)/);
  assert.match(routes, /requiresPlayer: z\.boolean\(\)\.default\(true\)/);
  assert.match(routes, /action: actionSchema/);

  for (const route of [
    "app.get('/api/v1/admin/chat-commands'",
    "app.post('/api/v1/admin/chat-commands'",
    "app.put('/api/v1/admin/chat-commands/:id'",
    "app.delete('/api/v1/admin/chat-commands/:id'",
  ]) {
    assert.ok(routes.includes(route), `Missing command route: ${route}`);
  }
  assert.equal((routes.match(/requireAdmin\(context\.prisma, request\)/g) ?? []).length, 4);
  assert.equal((routes.match(/commandBody\.parse\(request\.body\)/g) ?? []).length, 2);
  assert.equal((routes.match(/z\.string\(\)\.min\(1\)\.max\(120\)/g) ?? []).length, 2);
  assert.match(
    routes,
    /return \{ data: await loadChatCommands\(context\.prisma\), requestId: request\.id \};/,
  );
  assert.match(
    routes,
    /saveChatCommand\(context\.prisma, admin\.id, \{ id: '', \.\.\.body \}, request\.id\)/,
  );
  assert.match(
    routes,
    /saveChatCommand\(context\.prisma, admin\.id, \{ id, \.\.\.body \}, request\.id\)/,
  );
  assert.match(routes, /return \{ data: \{ retired: true \}, requestId: request\.id \};/);

  assert.match(auth, /if \(!user \|\| !user\.player\) throw new HttpError\(401, 'Sign in required\.'/);
  assert.match(auth, /if \(user\.player\.bannedUntil && user\.player\.bannedUntil > new Date\(\)\)/);
  assert.match(
    auth,
    /!user\.roles\.includes\('admin'\) && !user\.roles\.includes\('streamer'\)/,
  );
  assert.match(auth, /Streamer\/admin access required\./);

  assert.match(browserClient, /credentials: 'include'/);
  assert.match(browserClient, /headers\.set\('content-type', 'application\/json'\)/);
  assert.match(browserClient, /apiErrorEnvelopeSchema\.safeParse\(payload\)/);
  assert.match(browserClient, /apiSuccessEnvelopeSchema\(schema \?\? z\.unknown\(\)\)/);
});

test("production command persistence, normalization, conflicts, audit, ordering, and retirement semantics remain unchanged", async () => {
  const service = await read("apps/api/src/services/chat-commands.ts");
  assert.match(service, /const commandPrefix = 'chat-command\.';/);
  assert.match(
    service,
    /return value\.trim\(\)\.toLowerCase\(\)\.replace\(\/\\s\+\/g, ' '\);/,
  );
  assert.match(service, /if \(version\.lifecycle === 'retired'\) return null;/);
  assert.match(service, /enabled: raw\.enabled !== false/);
  assert.match(service, /requiresPlayer: true/);
  assert.match(
    service,
    /orderBy: \[\{ slug: 'asc' \}, \{ version: 'desc' \}\]/,
  );
  assert.match(
    service,
    /return \[\.\.\.merged\.values\(\)\]\.sort\(\(left, right\) => left\.trigger\.localeCompare\(right\.trigger\)\);/,
  );
  assert.match(
    service,
    /find\(command => command\.enabled && command\.trigger === normalized\) \?\? null/,
  );
  assert.match(
    service,
    /const id = command\.id \|\| command\.trigger\.slice\(1\)\.replace\(\/\[\^a-z0-9\]\+\/g, '-'\)\.replace\(\/\^-\|-\$\/g, ''\);/,
  );
  assert.match(service, /Command trigger must include a usable name\./);
  assert.match(
    service,
    /const normalized = \{ \.\.\.command, id, trigger: normalizeTrigger\(command\.trigger\), requiresPlayer: true \};/,
  );
  assert.match(
    service,
    /existing\.trigger === normalized\.trigger && existing\.id !== id/,
  );
  assert.match(service, /The trigger \$\{normalized\.trigger\} is already assigned to \$\{duplicate\.trigger\}\./);
  assert.equal((service.match(/acquireTransactionLock/g) ?? []).length, 3);
  assert.match(service, /lifecycle: 'active'/);
  assert.match(service, /validation: \{ allowlist: true \}/);
  assert.match(service, /publishedAt: new Date\(\)/);
  assert.match(service, /action: 'chat-command\.save'/);
  assert.match(service, /action: 'chat-command\.retire'/);
  assert.match(service, /lifecycle: 'retired'/);
  assert.match(service, /contentJson: latest\?\.contentJson \?\? \{\}/);
  assert.match(service, /after: \{ retired: true \}/);
});

test("Twitch execution and StreamElements point gates remain server authoritative and unchanged", async () => {
  const [eventsub, points] = await Promise.all([
    read("apps/api/src/routes/eventsub.ts"),
    read("apps/api/src/services/points.ts"),
  ]);
  assert.match(
    eventsub,
    /const command = await findChatCommand\(context\.prisma, String\(message\?\.text \?\? ''\)\);/,
  );
  assert.match(eventsub, /if \(!command\) return;/);
  assert.match(eventsub, /if \(!user\?\.player && command\.requiresPlayer\) return;/);
  assert.match(eventsub, /if \(!user\?\.player\) return;/);
  assert.match(
    eventsub,
    /if \(command\.action\.type === 'scan'\) return scanForWreck\(context, actor\);/,
  );
  assert.match(
    eventsub,
    /if \(command\.action\.type === 'salvage'\) return deploySalvage\(context, actor, command\.action\.mode\);/,
  );
  assert.match(
    eventsub,
    /return executePointAction\(context, actor, command\.action\.slug, `twitch:\$\{messageId\}`\);/,
  );
  assert.match(eventsub, /eventType === 'channel\.chat\.message'/);
  assert.match(eventsub, /chat command rejected/);

  assert.match(points, /FEATURE_POINTS_ACTIONS !== 'true'/);
  assert.match(points, /No verified StreamElements account is selected\./);
  assert.match(points, /if \(!connection\.pointsEnabled\)/);
  assert.match(points, /const amount = pointActions\[actionSlug\]\.cost;/);
  assert.match(points, /idempotencyKey/);
  assert.match(points, /runChargedAction/);
  assert.match(points, /status: 'failed'/);
  assert.match(points, /status: 'committed'/);
  assert.match(points, /status: 'refunded'/);
  assert.match(points, /status: 'ambiguous'/);
});
