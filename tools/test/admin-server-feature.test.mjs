import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (file) =>
  readFile(new URL(`../../${file}`, import.meta.url), "utf8");

const helper = (source, name) => {
  const match = source.match(
    new RegExp(
      `export function ${name}\\([^)]*\\) \\{[\\s\\S]*?\\n\\}`,
    ),
  );
  assert.ok(match, `${name} must remain in the Server feature module`);
  const javascript = match[0]
    .replace("export ", "")
    .replaceAll(": number", "");
  return Function(`${javascript}; return ${name};`)();
};

test("admin Server diagnostics stay isolated and shell-owned", async () => {
  const [main, server] = await Promise.all([
    read("apps/admin/src/main.tsx"),
    read("apps/admin/src/features/server/server-page.tsx"),
  ]);

  assert.match(
    main,
    /from "\.\/features\/server\/server-page\.js";/,
  );
  assert.doesNotMatch(
    main,
    /^(?:function (?:ServerPage|formatBytes|formatDuration)|type (?:AdminOverview|BalanceTelemetry|MetricWindow))\b/m,
  );
  assert.match(
    main,
    /server: <ServerPage overview=\{overview\} balanceTelemetry=\{balanceTelemetry\} \/>/,
  );
  assert.match(main, /requestApi<AdminOverview>\("\/api\/v1\/admin\/overview"\)/);
  assert.match(
    main,
    /requestApi<BalanceTelemetry>\("\/api\/v1\/admin\/balance-telemetry"\)/,
  );

  assert.match(server, /export function ServerPage\(\{ overview, balanceTelemetry \}/);
  assert.match(server, /overview: AdminOverview \| null/);
  assert.match(server, /balanceTelemetry: BalanceTelemetry \| null/);
  assert.doesNotMatch(server, /requestApi|@neon-wreckers\/browser-client/);
});

test("admin Server diagnostics retain loading and telemetry presentation", async () => {
  const server = await read("apps/admin/src/features/server/server-page.tsx");

  for (const text of [
    "Loading server telemetry",
    "Requests / minute",
    "Average latency",
    "Server errors / hour",
    "Live sockets",
    "Players",
    "Queue backlog",
    "Heap memory",
    "Container disk",
    "Unavailable",
    "Load average 1 / 5 / 15m",
    "API uptime",
    "Database & Queue",
    "Fleet Balance Telemetry",
    "Compute Engine Free Tier Guardrail",
  ]) {
    assert.ok(server.includes(text), `Missing Server telemetry contract: ${text}`);
  }

  assert.match(server, /if \(!overview\) return <LoadingScreen label="Loading server telemetry" \/>/);
  assert.match(server, /\{balanceTelemetry && \(/);
  assert.match(server, /Math\.round\(balanceTelemetry\.fleetUtilization \* 100\)/);
  assert.match(server, /Math\.round\(balanceTelemetry\.failureRate \* 100\)/);
  assert.match(server, /balanceTelemetry\.failureRate > \.35/);
  assert.match(server, /\.toFixed\(2\)/);
  assert.match(server, /currency: "USD"/);
});

test("admin Server byte and duration formatting remain unchanged", async () => {
  const server = await read("apps/admin/src/features/server/server-page.tsx");
  const formatBytes = helper(server, "formatBytes");
  const formatDuration = helper(server, "formatDuration");

  assert.equal(formatBytes(Number.NaN), "0 B");
  assert.equal(formatBytes(0), "0 B");
  assert.equal(formatBytes(1023), "1023 B");
  assert.equal(formatBytes(1024), "1 KB");
  assert.equal(formatBytes(1024 ** 2), "1.0 MB");
  assert.equal(formatBytes(1.5 * 1024 ** 3), "1.5 GB");

  assert.equal(formatDuration(0), "0d 0h 0m");
  assert.equal(formatDuration(90061), "1d 1h 1m");
});
