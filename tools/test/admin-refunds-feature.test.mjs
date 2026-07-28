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

const loadRefundEligibility = (source) => {
  const implementation = sourceSlice(
    source,
    "export function isRefundEligible(",
    "export async function refundLoyaltyTransaction(",
  )
    .replace("export function", "function")
    .replace("transaction: LoyaltyTransaction", "transaction")
    .replace("reason: string", "reason");

  return Function(`${implementation}; return isRefundEligible;`)();
};

const loadRefundCommand = (source) => {
  const implementation = sourceSlice(
    source,
    "export async function refundLoyaltyTransaction(",
    "export function RefundsPage(",
  )
    .replace("export async function", "async function")
    .replace("transaction: LoyaltyTransaction", "transaction")
    .replace("reason: string", "reason")
    .replace("dependencies: RefundDependencies", "dependencies");

  return Function(`${implementation}; return refundLoyaltyTransaction;`)();
};

const transaction = {
  id: "txn-123",
  amount: 250,
  actionSlug: "rush_scan",
  status: "committed",
  createdAt: "2026-07-28T16:00:00Z",
  error: null,
  user: { displayName: "NOVA_9", twitchLogin: "nova9" },
};

test("AdminApp imports and composes the focused Refunds feature", async () => {
  const [main, refunds] = await Promise.all([
    read("apps/admin/src/main.tsx"),
    read("apps/admin/src/features/refunds/refunds-page.tsx"),
  ]);

  assert.match(
    main,
    /import \{\s*RefundsPage,\s*type LoyaltyTransaction,\s*\} from "\.\/features\/refunds\/refunds-page\.js";/,
  );
  assert.doesNotMatch(main, /^function TransactionsPage\b/m);
  assert.match(
    main,
    /transactions:\s*\(\s*<RefundsPage\s+transactions=\{transactions\}\s+refresh=\{refresh\}\s+pushToast=\{pushToast\}\s*\/>\s*\)/,
  );

  assert.match(refunds, /export function RefundsPage\(\{/);
  assert.match(refunds, /transactions: LoyaltyTransaction\[\]/);
  assert.match(
    refunds,
    /import \{ errorMessage, requestApi \} from "@neon-wreckers\/browser-client";/,
  );
  assert.doesNotMatch(
    refunds,
    /\/api\/v1\/(?:me|station|admin\/(?:overview|players|config|live-ops|balance-telemetry|expedition-creator|chat-commands))\b/,
  );
  assert.doesNotMatch(
    refunds,
    /AppShell|CommandNavigation|const navigation|AccessDenied|ServerPage|TimersPage|PlayersPage|Promise\.all|useEffect/,
  );
});

test("Refunds presentation preserves the transaction shape, copy, tones, and controls", async () => {
  const refunds = await read("apps/admin/src/features/refunds/refunds-page.tsx");

  for (const field of [
    "id: string;",
    "amount: number;",
    "actionSlug: string;",
    "status: string;",
    "createdAt: string;",
    "error: string | null;",
    "user: { displayName: string; twitchLogin: string };",
  ]) {
    assert.ok(refunds.includes(field), `Missing transaction field: ${field}`);
  }

  for (const text of [
    "Operator-approved point refund",
    "FINANCIAL OPERATIONS",
    "Point Transactions & Refunds",
    "Refunds credit StreamElements first and update the local ledger only after confirmation.",
    "Required refund reason",
    "No point transactions.",
    "Player",
    "Command",
    "Points",
    "Status",
    "Created",
    "Control",
    "Refund",
  ]) {
    assert.ok(refunds.includes(text), `Missing Refunds contract: ${text}`);
  }

  assert.match(refunds, /<div className="admin-stack">/);
  assert.match(refunds, /rows=\{transactions\}/);
  assert.match(refunds, /getRowKey=\{\(row\) => row\.id\}/);
  assert.match(refunds, /render: \(row\) => <strong>\{row\.user\.displayName\}<\/strong>/);
  assert.match(refunds, /render: \(row\) => row\.actionSlug/);
  assert.match(refunds, /header: "Points",\s*align: "right",\s*render: \(row\) => row\.amount/);
  assert.match(
    refunds,
    /render: \(row\) => new Date\(row\.createdAt\)\.toLocaleString\(\)/,
  );
  assert.match(refunds, /row\.status === "committed"\s*\? "success"/);
  assert.match(refunds, /row\.status === "ambiguous"\s*\? "warning"\s*: "neutral"/);
  assert.match(refunds, /header: "Control",\s*align: "right"/);
  assert.match(refunds, /size="sm"\s+variant="warning"/);
  assert.match(refunds, /disabled=\{!isRefundEligible\(row, reason\)\}/);
});

test("Refund eligibility preserves the existing states and minimum reason length", async () => {
  const refunds = await read("apps/admin/src/features/refunds/refunds-page.tsx");
  const isRefundEligible = loadRefundEligibility(refunds);

  assert.equal(isRefundEligible({ ...transaction, status: "committed" }, "abc"), true);
  assert.equal(isRefundEligible({ ...transaction, status: "ambiguous" }, "abc"), true);
  for (const status of ["pending", "settled", "failed", "refunded"]) {
    assert.equal(isRefundEligible({ ...transaction, status }, "abc"), false);
  }
  assert.equal(isRefundEligible(transaction, "ab"), false);
  assert.equal(isRefundEligible(transaction, "abc"), true);
});

test("confirming a refund sends the exact POST and serialized JSON, then refreshes once", async () => {
  const refunds = await read("apps/admin/src/features/refunds/refunds-page.tsx");
  const refundLoyaltyTransaction = loadRefundCommand(refunds);
  const confirmations = [];
  const requests = [];
  const toasts = [];
  let refreshes = 0;

  await refundLoyaltyTransaction(
    transaction,
    "Operator-approved point refund",
    {
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
    },
  );

  assert.deepEqual(confirmations, ["Refund 250 points to NOVA_9?"]);
  assert.deepEqual(requests, [
    [
      "/api/v1/admin/transactions/txn-123/refund",
      {
        method: "POST",
        body: '{"reason":"Operator-approved point refund"}',
      },
    ],
  ]);
  assert.deepEqual(JSON.parse(requests[0][1].body), {
    reason: "Operator-approved point refund",
  });
  assert.deepEqual(toasts, [
    {
      title: "Points refunded",
      message: "250 points returned to NOVA_9.",
      tone: "success",
    },
  ]);
  assert.equal(refreshes, 1);
});

test("cancelling refund confirmation sends no request, toast, or refresh", async () => {
  const refunds = await read("apps/admin/src/features/refunds/refunds-page.tsx");
  const refundLoyaltyTransaction = loadRefundCommand(refunds);
  let requests = 0;
  let refreshes = 0;
  const toasts = [];

  await refundLoyaltyTransaction(transaction, "Operator-approved point refund", {
    confirm: (message) => {
      assert.equal(message, "Refund 250 points to NOVA_9?");
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

test("a failed refund emits only the existing danger toast and does not refresh", async () => {
  const refunds = await read("apps/admin/src/features/refunds/refunds-page.tsx");
  const refundLoyaltyTransaction = loadRefundCommand(refunds);
  let refreshes = 0;
  const toasts = [];

  await refundLoyaltyTransaction(transaction, "Operator-approved point refund", {
    confirm: () => true,
    request: async () => {
      throw new Error("refund exploded");
    },
    refresh: async () => {
      refreshes += 1;
    },
    pushToast: (toast) => toasts.push(toast),
    errorMessage: (error) => error.message,
  });

  assert.deepEqual(toasts, [
    {
      title: "Refund failed",
      message: "refund exploded",
      tone: "danger",
    },
  ]);
  assert.equal(
    toasts.some((toast) => toast.title === "Points refunded"),
    false,
  );
  assert.equal(refreshes, 0);
});

test("Refunds extraction preserves shell refresh, navigation, visual proof, browser client, and production refund semantics", async () => {
  const [main, capture, api, browserClient, streamElements] = await Promise.all([
    read("apps/admin/src/main.tsx"),
    read("tools/visual-proof/capture-admin-overlay.mjs"),
    read("apps/api/src/routes/admin.ts"),
    read("packages/browser-client/src/index.ts"),
    read("packages/integrations/src/streamelements.ts"),
  ]);

  assert.match(main, /const \[tab, setTab\] = useState\("operations"\)/);
  const navigation = sourceSlice(
    main,
    "const navigation: TabItem[] = [",
    "function Root()",
  );
  const playersIndex = navigation.indexOf(
    '{ id: "players", label: "Players", icon: "crew" }',
  );
  const refundsIndex = navigation.indexOf(
    '{ id: "transactions", label: "Refunds", icon: "credits" }',
  );
  const configIndex = navigation.indexOf(
    '{ id: "config", label: "Config", icon: "data" }',
  );
  assert.ok(playersIndex < refundsIndex && refundsIndex < configIndex);

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
  assert.match(capture, /\['transactions', 'Refunds'\]/);
  assert.match(
    capture,
    /`\$\{outputRoot\}\/admin\/desktop\/\$\{name\}\.png`/,
  );
  assert.match(fixture, /'\/api\/v1\/admin\/transactions': \[/);
  for (const status of ["settled", "pending", "failed"]) {
    assert.match(fixture, new RegExp(`status: '${status}'`));
  }

  assert.match(browserClient, /if \(init\.body != null && !headers\.has\('content-type'\)\)/);
  assert.match(browserClient, /headers\.set\('content-type', 'application\/json'\)/);
  assert.match(browserClient, /credentials: 'include'/);
  assert.match(browserClient, /schema \?\? z\.unknown\(\)/);

  const refundRoute = sourceSlice(
    api,
    "app.post('/api/v1/admin/transactions/:id/refund'",
    "app.post('/api/v1/admin/events/:slug/reset'",
  );
  assert.match(refundRoute, /await requireAdmin\(context\.prisma, request\)/);
  assert.match(refundRoute, /z\.object\(\{ reason: z\.string\(\)\.trim\(\)\.min\(3\)\.max\(300\) \}\)\.parse\(request\.body\)/);
  assert.match(refundRoute, /loyaltyTransaction\.findUniqueOrThrow\(\{ where: \{ id \}, include: \{ user: true \} \}\)/);
  assert.match(refundRoute, /!\['committed', 'ambiguous'\]\.includes\(transaction\.status\)/);
  assert.match(refundRoute, /NOT_REFUNDABLE/);
  assert.match(refundRoute, /await context\.loyaltyProvider\.connection\(\)/);
  assert.match(refundRoute, /STREAMELEMENTS_NOT_CONNECTED/);
  assert.match(refundRoute, /STREAMELEMENTS_ACCOUNT_MISMATCH/);
  assert.match(refundRoute, /channelId: connection\.channelId/);
  assert.match(refundRoute, /username/);
  assert.match(refundRoute, /amount: transaction\.amount/);
  assert.match(refundRoute, /reason: body\.reason/);
  assert.match(refundRoute, /idempotencyKey: `admin-refund:\$\{transaction\.id\}`/);
  assert.match(refundRoute, /priorReference: transaction\.externalReference \?\? undefined/);
  assert.ok(
    refundRoute.indexOf("context.loyaltyProvider.credit") <
      refundRoute.indexOf("context.prisma.$transaction"),
    "StreamElements credit must remain before local ledger and audit persistence",
  );
  assert.match(refundRoute, /status: 'refunded'/);
  assert.match(refundRoute, /adminRefundReference: credit\.externalReference/);
  assert.match(refundRoute, /action: 'loyalty\.refund'/);
  assert.match(refundRoute, /return \{ data: updated, requestId: request\.id \}/);

  const credit = sourceSlice(
    streamElements,
    "async credit(args:",
    "async health(): Promise<LoyaltyHealth>",
  );
  assert.match(credit, /'PUT'/);
  assert.match(credit, /Math\.abs\(args\.amount\)/);
  assert.match(credit, /reason: args\.reason/);
  assert.match(credit, /idempotencyKey: args\.idempotencyKey/);
  assert.match(credit, /priorReference: args\.priorReference/);
});
