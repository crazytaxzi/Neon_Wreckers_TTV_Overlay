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

test("authenticated admin visual proof explicitly fixtures the ten-resource refresh", async () => {
  const [main, capture] = await Promise.all([
    read("apps/admin/src/main.tsx"),
    read("tools/visual-proof/capture-admin-overlay.mjs"),
  ]);

  const refresh = sourceSlice(
    main,
    "const refresh = useCallback",
    "setStation(stationData);",
  );
  const requestedEndpoints = [
    ...refresh.matchAll(/"(\/api\/v1\/[^"]+)"/g),
  ].map((match) => match[1]);

  assert.equal(requestedEndpoints.length, 10);
  assert.equal(new Set(requestedEndpoints).size, 10);

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
      `${endpoint} must have an explicit authenticated visual-proof fixture response`,
    );
  }

  for (const endpoint of [
    "/api/v1/admin/balance-telemetry",
    "/api/v1/admin/live-ops",
    "/api/v1/admin/expedition-creator",
  ]) {
    assert.ok(fixtureEndpoints.has(endpoint), `Missing repaired fixture: ${endpoint}`);
  }
});

test("admin visual-proof interception remains isolated from production runtime", async () => {
  const capture = await read("tools/visual-proof/capture-admin-overlay.mjs");
  const adminRoutes = sourceSlice(
    capture,
    "async function installAdminRoutes(page)",
    "async function installOverlayRoutes(page",
  );
  const captureAdmin = sourceSlice(
    capture,
    "async function captureAdmin(label",
    "await mkdir(`${outputRoot}/admin/desktop`",
  );

  assert.match(adminRoutes, /page\.route\('\*\*\/api\/v1\/\*\*'/);
  assert.match(
    adminRoutes,
    /Object\.prototype\.hasOwnProperty\.call\(adminData, path\)/,
  );
  assert.match(adminRoutes, /route\.fulfill\(/);
  assert.match(adminRoutes, /JSON\.stringify\(\{ data: adminData\[path\] \}\)/);
  assert.match(adminRoutes, /await route\.continue\(\);/);
  assert.ok(
    captureAdmin.indexOf("await installAdminRoutes(page);") <
      captureAdmin.indexOf("await page.goto(adminBase"),
    "Fixture interception must be installed before the production-built admin surface loads",
  );
});
