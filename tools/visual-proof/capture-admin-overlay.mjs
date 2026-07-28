import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const adminBase = process.env.NW_ADMIN_PREVIEW_URL ?? 'http://127.0.0.1:4174/admin/';
const overlayBase = process.env.NW_OVERLAY_PREVIEW_URL ?? 'http://127.0.0.1:4175/overlay/';
const outputRoot = process.env.NW_VISUAL_PROOF_DIR ?? 'proof';

const streamElementsConnection = {
  id: 'integration.streamelements.connection.wrecker-control',
  channelId: '65d80c9be87d123456789abc',
  provider: 'twitch',
  providerId: '14343136',
  username: 'crazytaxzi',
  displayName: 'WRECKER CONTROL',
  avatarUrl: null,
  authType: 'oauth2',
  scopes: ['channel:read', 'loyalty:read', 'loyalty:write'],
  expiresAt: '2026-08-21T22:14:00Z',
  isActive: true,
  pointsEnabled: true,
  lastVerifiedAt: '2026-07-21T22:14:00Z',
  lastError: null,
  updatedAt: '2026-07-21T22:14:00Z',
  matchesStreamer: true
};

const adminData = {
  '/api/v1/me': { id: 'admin-preview', displayName: 'WRECKER CONTROL', avatarUrl: null, roles: ['admin', 'streamer'] },
  '/api/v1/station': { name: 'NEON PRIME HUB', population: 1248, power: 78, integrity: 92 },
  '/api/v1/integrations/streamelements/health': {
    ok: true,
    detail: 'StreamElements API reachable',
    configured: true,
    oauthConfigured: true,
    oauthScopes: ['channel:read', 'loyalty:read', 'loyalty:write'],
    legacyAvailable: true,
    pointsKillSwitchEnabled: true,
    activeConnectionId: streamElementsConnection.id,
    identity: {
      channelId: streamElementsConnection.channelId,
      provider: streamElementsConnection.provider,
      providerId: streamElementsConnection.providerId,
      username: streamElementsConnection.username,
      displayName: streamElementsConnection.displayName,
      avatarUrl: streamElementsConnection.avatarUrl
    },
    connections: [streamElementsConnection, {
      ...streamElementsConnection,
      id: 'integration.streamelements.connection.station-alt',
      channelId: '65d80c9be87d987654321def',
      providerId: '987654321',
      username: 'station_alt',
      displayName: 'STATION ALT',
      authType: 'jwt',
      scopes: ['owner:*'],
      isActive: false,
      pointsEnabled: false,
      matchesStreamer: false
    }]
  },
  '/api/v1/admin/chat-commands': [
    { id: 'scan', trigger: '!scan', description: 'Scan for a new wreck.', enabled: true, requiresPlayer: true, action: { type: 'scan' }, updatedAt: null, source: 'default' },
    { id: 'salvage-cutters', trigger: '!salvage cutters', description: 'Deploy cutters against the active wreck.', enabled: true, requiresPlayer: true, action: { type: 'salvage', mode: 'cutters' }, updatedAt: '2026-07-21T20:00:00Z', source: 'configured' },
    { id: 'salvage-cargo', trigger: '!salvage cargo', description: 'Deploy cargo recovery against the active wreck.', enabled: true, requiresPlayer: true, action: { type: 'salvage', mode: 'cargo' }, updatedAt: null, source: 'default' },
    { id: 'rushscan', trigger: '!rushscan', description: 'Spend StreamElements points to rush a wreck scan.', enabled: true, requiresPlayer: true, action: { type: 'point_action', slug: 'rush_scan' }, updatedAt: null, source: 'default' },
    { id: 'override', trigger: '!override', description: 'Spend StreamElements points on a safety override salvage run.', enabled: false, requiresPlayer: true, action: { type: 'point_action', slug: 'safety_override' }, updatedAt: '2026-07-21T21:00:00Z', source: 'configured' }
  ],
  '/api/v1/admin/config': [
    { id: 'cfg-4', slug: 'station-zero-live', version: 14, lifecycle: 'published', createdAt: '2026-07-21T21:10:00Z' },
    { id: 'cfg-3', slug: 'salvage-balance', version: 8, lifecycle: 'draft', createdAt: '2026-07-21T19:05:00Z' }
  ],
  '/api/v1/admin/overview': {
    service: { uptimeSeconds: 182440, startedAt: '2026-07-19T18:00:00Z', node: 'neon-wreckers-prod', loadAverage: [0.42, 0.58, 0.63], cpuCount: 4, memory: { rss: 348127232, heapUsed: 128040960, heapTotal: 187695104 }, disk: { total: 85899345920, free: 53687091200, used: 32212254720 }, sockets: 43 },
    throughput: { lastMinute: { requests: 184, errors: 1, bytes: 2488800, averageLatencyMs: 42, requestsPerMinute: 184 }, lastHour: { requests: 8620, errors: 12, bytes: 115500000, averageLatencyMs: 48, requestsPerMinute: 143 }, lastDay: { requests: 121400, errors: 97, bytes: 1489000000, averageLatencyMs: 51, requestsPerMinute: 84 }, series: [{ minute: '21:10', requests: 161, errors: 0, bytes: 2200000, latencyMs: 39 }, { minute: '21:11', requests: 184, errors: 1, bytes: 2488800, latencyMs: 42 }] },
    database: { players: 2847, activeExpeditions: 18, activeEvents: 2, activeCooldowns: 146, pendingTransactions: 3 },
    queue: { eventDispatch: 2, loyaltySettlement: 1, notifications: 7 },
    timers: [
      { id: 'tm-1', name: 'Titan Interceptor expedition', playerName: 'WRECKER_77', resolvesAt: '2026-07-21T23:42:18Z' },
      { id: 'tm-2', name: 'Refinery Complex upgrade', playerName: 'NOVA_9', resolvesAt: '2026-07-22T01:08:44Z' }
    ],
    cloudSafeZone: { machine: 'e2-standard-4', eligibleRegions: ['us-west1', 'us-central1'], vmHoursPerMonth: '730', standardDiskGbMonth: 80, outboundGbMonth: 20, estimatedOverage: { vmUsdPerHour: 0.134, standardDiskUsdPerGbMonth: 0.04, premiumEgressUsdPerGbFrom: 0.12 }, disclaimer: 'Estimate only. Billing remains provider authoritative.' }
  },
  '/api/v1/admin/balance-telemetry': {
    windowDays: 30,
    expeditions: 148,
    averageCompletionMinutes: 54,
    creditsGenerated: 384250,
    fleetUtilization: 0.63,
    failureRate: 0.18,
    routes: { safe: 48, balanced: 67, bold: 33 },
    shipsByClass: [
      { classSlug: 'interceptor', ships: 42, averageMasteryXp: 1840 },
      { classSlug: 'salvager', ships: 37, averageMasteryXp: 2310 },
      { classSlug: 'hauler', ships: 29, averageMasteryXp: 1650 }
    ]
  },
  '/api/v1/admin/live-ops': {
    generatedAt: '2026-07-21T22:30:00Z',
    economy: {
      players: 2847,
      totalCredits: 18482500,
      averageCredits: 6492,
      averageLevel: 28.4,
      seasonalTokens: 91340,
      marketTransactions30d: 4821,
      marketCredits30d: 7264000,
      marketUnits30d: 11870
    },
    warnings: [
      { severity: 'info', code: 'LOW_MARKET_VELOCITY', message: 'Market velocity is below the thirty-day station target.' }
    ],
    schedule: [
      { id: 'cfg-5', slug: 'station-zero-weekend', version: 3, lifecycle: 'scheduled', scheduledAt: '2026-07-25T18:00:00Z', expiresAt: '2026-07-28T06:00:00Z' },
      { id: 'cfg-4', slug: 'station-zero-live', version: 14, lifecycle: 'active', scheduledAt: null, expiresAt: null }
    ],
    events: [
      { id: 'event-1', slug: 'reactor-instability', status: 'active', startsAt: '2026-07-21T22:20:00Z', endsAt: null }
    ],
    releaseEvidence: [
      { id: 'audit-1', action: 'config.activate', target: 'station-zero-live@14', requestId: 'preview-request-14', createdAt: '2026-07-21T21:10:00Z' }
    ]
  },
  '/api/v1/admin/expedition-creator': {
    items: [
      { slug: 'credits', name: 'Credits', rarity: 'common' },
      { slug: 'alloy-plating', name: 'Alloy Plating', rarity: 'uncommon' },
      { slug: 'quantum-relay', name: 'Quantum Relay', rarity: 'rare' }
    ],
    builtIn: [
      { slug: 'grid-relay-recovery', name: 'Grid Relay Recovery', description: 'Recover an intact relay from a volatile relic field.', risk: 'high', fuelCost: 24, minCrew: 3, lootPool: ['credits', 'alloy-plating', 'quantum-relay'], lootRolls: 3, durationMinutes: [45, 75] }
    ],
    versions: [
      { id: 'expedition-version-1', slug: 'expedition.grid-relay-recovery', version: 2, lifecycle: 'active', content: { slug: 'grid-relay-recovery', name: 'Grid Relay Recovery', description: 'Recover an intact relay from a volatile relic field.', risk: 'high', fuelCost: 24, minCrew: 3, lootPool: ['credits', 'alloy-plating', 'quantum-relay'], lootRolls: 3, durationMinutes: [45, 75] }, scheduledAt: null, expiresAt: null, createdAt: '2026-07-20T18:00:00Z' }
    ]
  },
  '/api/v1/admin/players': [
    { id: 'p1', displayName: 'WRECKER_77', twitchLogin: 'wrecker77', credits: 8450, xp: 12840, level: 47, reputation: 2890, bannedUntil: null, cooldowns: [{ id: 'cd1', actionKey: 'salvage.scan', expiresAt: '2026-07-21T22:38:44Z' }] },
    { id: 'p2', displayName: 'NOVA_9', twitchLogin: 'nova9', credits: 5220, xp: 9400, level: 31, reputation: 1880, bannedUntil: null, cooldowns: [] },
    { id: 'p3', displayName: 'RUSTEDLEGEND', twitchLogin: 'rustedlegend', credits: 13820, xp: 20110, level: 62, reputation: 4210, bannedUntil: null, cooldowns: [{ id: 'cd2', actionKey: 'expedition.launch', expiresAt: '2026-07-22T00:04:00Z' }] },
    { id: 'p4', displayName: 'VOIDCUTTER', twitchLogin: 'voidcutter', credits: 940, xp: 3100, level: 14, reputation: 620, bannedUntil: '2026-07-22T05:00:00Z', cooldowns: [] }
  ],
  '/api/v1/admin/transactions': [
    { id: 'tx1', amount: 1250, actionSlug: 'market.purchase', status: 'settled', createdAt: '2026-07-21T22:12:00Z', error: null, user: { displayName: 'WRECKER_77', twitchLogin: 'wrecker77' } },
    { id: 'tx2', amount: 500, actionSlug: 'salvage.boost', status: 'pending', createdAt: '2026-07-21T22:14:00Z', error: null, user: { displayName: 'NOVA_9', twitchLogin: 'nova9' } },
    { id: 'tx3', amount: 2400, actionSlug: 'auction.bid', status: 'failed', createdAt: '2026-07-21T22:15:00Z', error: 'Loyalty provider timeout', user: { displayName: 'VOIDCUTTER', twitchLogin: 'voidcutter' } }
  ]
};

const overlayStation = {
  name: 'NEON PRIME HUB', level: 4, population: 1248, power: 78, morale: 86, integrity: 92,
  threatLevel: 'ELEVATED', storageCapacity: 24000, storageUsed: 15240,
  resources: { scrap: 112600, credits: 8450 },
  alerts: [{ id: 'alert-1', severity: 'critical', title: 'Reactor breach detected', body: 'Containment crews responding. Salvage operations remain active.', createdAt: '2026-07-21T22:20:00Z' }]
};
const overlayHistory = [
  { id: 'h1', category: 'critical', title: 'High impact event', body: 'Reactor containment is unstable. Stay alert. Stay wrecking.', createdAt: '2026-07-21T22:20:00Z' },
  { id: 'h2', category: 'viewer', title: 'Raid incoming', body: 'The crew just got bigger. Viewer network linked.', createdAt: '2026-07-21T22:18:00Z' }
];
const viewerHistory = [{ id: 'viewer-raid', category: 'viewer', title: 'Raid incoming', body: 'The crew just got bigger. Viewer network linked.', createdAt: '2026-07-21T22:30:00Z' }];
const wreck = { id: 'dread-frigate-009', name: 'DREAD FRIGATE', risk: 'EXTREME', integrity: 23, description: 'Unknown capital-class hull. Defensive systems and reactor instability detected.' };
const overlayConfig = {
  status: { top: 34, left: 34, width: 520, scale: 1, visible: true },
  ticker: { top: 34, width: 1400, scale: 1, rotationSeconds: 20, visible: true },
  feedIndicator: true, scanlines: true, glass: true, breakingNews: true, previewBackground: true,
  visibility: { tickerHoldSeconds: 120, statusHoldSeconds: 120, fadeSeconds: 0.3, keepVisibleInPreview: true }
};

async function installAdminRoutes(page) {
  await page.route('**/api/v1/**', async route => {
    const path = new URL(route.request().url()).pathname;
    if (Object.prototype.hasOwnProperty.call(adminData, path)) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: adminData[path] }) });
      return;
    }
    await route.continue();
  });
}

async function installOverlayRoutes(page, viewerMode, transparentMode = false) {
  await page.addInitScript(() => {
    window.WebSocket = class PreviewSocket {
      constructor() { this.readyState = 1; setTimeout(() => this.onopen?.({}), 100); }
      close() { this.readyState = 3; this.onclose?.({}); }
      send() {}
    };
  });
  await page.route('**/*', async route => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/overlay/overlay-config.json') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ...overlayConfig, previewBackground: transparentMode ? false : overlayConfig.previewBackground }) });
      return;
    }
    if (path === '/api/v1/station') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: viewerMode ? { ...overlayStation, alerts: [] } : overlayStation }) });
      return;
    }
    if (path === '/api/v1/history') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: viewerMode ? viewerHistory : overlayHistory }) });
      return;
    }
    if (path === '/api/v1/wrecks/current') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: wreck }) });
      return;
    }
    await route.continue();
  });
}

const browser = await chromium.launch({ headless: true });

async function captureAdmin(label, viewport, output, graphics = false) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  await installAdminRoutes(page);
  await page.goto(adminBase, { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: '.nw-skip-link{display:none!important}' });
  await page.locator('button').filter({ hasText: label }).first().click();
  if (graphics) {
    await page.waitForTimeout(400);
    await page.locator('button').filter({ hasText: 'Graphic Language' }).first().click();
  }
  await page.waitForTimeout(900);
  await page.screenshot({ path: output });
  await context.close();
}

await mkdir(`${outputRoot}/admin/desktop`, { recursive: true });
await mkdir(`${outputRoot}/admin/tablet`, { recursive: true });
await mkdir(`${outputRoot}/admin/mobile`, { recursive: true });
await mkdir(`${outputRoot}/overlay`, { recursive: true });

const adminViews = [
  ['operations', 'Operations'], ['integrations', 'Integrations'], ['commands', 'Commands'], ['server', 'Server'], ['timers', 'Timers'], ['players', 'Players'],
  ['transactions', 'Refunds'], ['config', 'Config'], ['interface', 'UI Library']
];
for (const [name, label] of adminViews) await captureAdmin(label, { width: 1920, height: 1080 }, `${outputRoot}/admin/desktop/${name}.png`);
await captureAdmin('UI Library', { width: 1920, height: 1080 }, `${outputRoot}/admin/desktop/graphics.png`, true);
for (const [name, label] of [['operations', 'Operations'], ['integrations', 'Integrations'], ['commands', 'Commands'], ['players', 'Players'], ['config', 'Config']]) await captureAdmin(label, { width: 1024, height: 768 }, `${outputRoot}/admin/tablet/${name}.png`);
await captureAdmin('UI Library', { width: 1024, height: 768 }, `${outputRoot}/admin/tablet/graphics.png`, true);
for (const [name, label] of [['operations', 'Operations'], ['integrations', 'Integrations'], ['commands', 'Commands'], ['players', 'Players']]) await captureAdmin(label, { width: 390, height: 844 }, `${outputRoot}/admin/mobile/${name}.png`);

async function captureOverlay(name, viewport, viewerMode = false, transparentMode = false) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  await installOverlayRoutes(page, viewerMode, transparentMode);
  const previewQuery = transparentMode ? '' : '?preview=1';
  const eventQuery = viewerMode ? `${previewQuery ? '&' : '?'}event=viewer` : '';
  await page.goto(`${overlayBase}${previewQuery}${eventQuery}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1300);
  await page.screenshot({ path: `${outputRoot}/overlay/${name}.png`, omitBackground: transparentMode });
  await context.close();
}

await captureOverlay('720p', { width: 1280, height: 720 });
await captureOverlay('1080p', { width: 1920, height: 1080 });
await captureOverlay('1440p', { width: 2560, height: 1440 });
await captureOverlay('4k', { width: 3840, height: 2160 });
await captureOverlay('viewer-event-1080p', { width: 1920, height: 1080 }, true);
await captureOverlay('transparent-1080p', { width: 1920, height: 1080 }, false, true);

await browser.close();
