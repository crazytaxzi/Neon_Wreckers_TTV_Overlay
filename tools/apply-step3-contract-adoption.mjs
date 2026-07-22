import { readFileSync, writeFileSync } from 'node:fs';

function edit(path, transform) {
  const before = readFileSync(path, 'utf8');
  const after = transform(before);
  if (after === before) throw new Error(`No changes produced for ${path}`);
  writeFileSync(path, after);
}

function replaceOnce(source, search, replacement, label) {
  if (!source.includes(search)) throw new Error(`Missing ${label}`);
  return source.replace(search, replacement);
}

edit('apps/overlay/src/main.tsx', source => {
  source = replaceOnce(
    source,
    "import { requestApi } from '@neon-wreckers/browser-client';\n",
    "import { requestApi } from '@neon-wreckers/browser-client';\nimport { currentWreckSchema, historyRecordSchema, realtimeEventSchema, stationSnapshotSchema, type CurrentWreck, type HistoryRecord, type StationAlert, type StationSnapshot } from '@neon-wreckers/contracts';\n",
    'overlay contracts import'
  );
  source = source.replace(/type StationAlert =[^\n]+\n\ntype HistoryRecord =[^\n]+\n\ntype Station = \{[\s\S]*?\n\};\n\ntype Wreck =[^\n]+\n/, "type Station = StationSnapshot;\ntype Wreck = CurrentWreck;\n");
  source = source.replace("createdAt: Date.parse(entry?.createdAt || '') || Date.now(),", "createdAt: Date.parse(String(entry?.createdAt ?? '')) || Date.now(),");
  source = source.replace("createdAt: Date.parse(alert?.createdAt || '') || Date.now(),", "createdAt: Date.parse(String(alert?.createdAt ?? '')) || Date.now(),");
  source = replaceOnce(source, "requestApi<Station>(`${API}/station`, { cache: 'no-store' })", "requestApi<Station>(`${API}/station`, { cache: 'no-store' }, stationSnapshotSchema)", 'overlay station request');
  source = replaceOnce(source, "requestApi<HistoryRecord[]>(`${API}/history`, { cache: 'no-store' })", "requestApi<HistoryRecord[]>(`${API}/history`, { cache: 'no-store' }, historyRecordSchema.array())", 'overlay history request');
  source = replaceOnce(source, "requestApi<Wreck>(`${API}/wrecks/current`, { cache: 'no-store' })", "requestApi<Wreck>(`${API}/wrecks/current`, { cache: 'no-store' }, currentWreckSchema)", 'overlay wreck request');
  source = replaceOnce(
    source,
    "          const message = JSON.parse(event.data);",
    "          const decoded: unknown = JSON.parse(String(event.data));\n          const parsed = realtimeEventSchema.safeParse(decoded);\n          if (!parsed.success) {\n            console.warn('Overlay realtime contract validation failed', { issues: parsed.error.issues });\n            return;\n          }\n          const message = parsed.data;",
    'overlay websocket parse'
  );
  source = source.replace("            const next = message.station as Station;", "            const next = message.station;");
  source = replaceOnce(
    source,
    "        } catch {\n          // A malformed packet must not take down a live stream overlay.\n        }",
    "        } catch (error) {\n          console.warn('Overlay realtime packet could not be decoded', { error });\n        }",
    'overlay malformed packet handler'
  );
  return source;
});

edit('apps/web/src/game-data.ts', source => {
  source = replaceOnce(
    source,
    "import { errorMessage, requestApi } from '@neon-wreckers/browser-client';\n",
    "import { errorMessage, requestApi } from '@neon-wreckers/browser-client';\nimport { authenticatedUserSummarySchema, crewMemberSchema, currentWreckSchema, expeditionSchema, historyRecordSchema, inventoryItemSchema, realtimeEventSchema, shipSchema, stationSnapshotSchema, type RealtimeEvent } from '@neon-wreckers/contracts';\n",
    'web contracts import'
  );
  source = source.replace(/type RealtimeMessage =[\s\S]*?function actionResultMessage/, `function parseRealtimeMessage(value: unknown): RealtimeEvent | null {\n  if (typeof value !== 'string') return null;\n  try {\n    const decoded: unknown = JSON.parse(value);\n    const parsed = realtimeEventSchema.safeParse(decoded);\n    if (!parsed.success) console.warn('Player realtime contract validation failed', { issues: parsed.error.issues });\n    return parsed.success ? parsed.data : null;\n  } catch (error) {\n    console.warn('Player realtime packet could not be decoded', { error });\n    return null;\n  }\n}\nfunction actionResultMessage`);
  const replacements = [
    ["requestApi<CurrentUser>('/api/v1/me')", "requestApi<CurrentUser>('/api/v1/me', {}, authenticatedUserSummarySchema)"],
    ["requestApi<Station>('/api/v1/station')", "requestApi<Station>('/api/v1/station', {}, stationSnapshotSchema)"],
    ["requestApi<Wreck>('/api/v1/wrecks/current')", "requestApi<Wreck>('/api/v1/wrecks/current', {}, currentWreckSchema)"],
    ["requestApi<InventoryItem[]>('/api/v1/inventory')", "requestApi<InventoryItem[]>('/api/v1/inventory', {}, inventoryItemSchema.array())"],
    ["requestApi<Ship[]>('/api/v1/ships')", "requestApi<Ship[]>('/api/v1/ships', {}, shipSchema.array())"],
    ["requestApi<CrewMember[]>('/api/v1/crew')", "requestApi<CrewMember[]>('/api/v1/crew', {}, crewMemberSchema.array())"],
    ["requestApi<HistoryEntry[]>('/api/v1/history')", "requestApi<HistoryEntry[]>('/api/v1/history', {}, historyRecordSchema.array())"],
    ["requestApi<Expedition[]>('/api/v1/expeditions')", "requestApi<Expedition[]>('/api/v1/expeditions', {}, expeditionSchema.array())"]
  ];
  for (const [search, replacement] of replacements) source = replaceOnce(source, search, replacement, `web request ${search}`);
  source = replaceOnce(
    source,
    "      try {\n        const message = JSON.parse(String(event.data)) as { type?: string };\n        if (message.type && message.type !== 'player.connected') void refresh();\n      } catch { /* Ignore malformed personal packets. */ }",
    "      const message = parseRealtimeMessage(String(event.data));\n      if (message && message.type !== 'player.connected') void refresh();",
    'personal realtime parser'
  );
  return source;
});

edit('apps/api/src/routes/station.ts', source => {
  source = replaceOnce(
    source,
    "import { GameRuleError, salvageWreckProfile } from '@neon-wreckers/game-engine';\n",
    "import { GameRuleError, salvageWreckProfile } from '@neon-wreckers/game-engine';\nimport { crewMemberSchema, historyRecordSchema, inventoryItemSchema, shipSchema, stationSnapshotSchema } from '@neon-wreckers/contracts';\n",
    'station route contracts import'
  );
  source = replaceOnce(source, "app.get('/api/v1/station', async request => ({ data: await stationDto(context.prisma), requestId: request.id }));", "app.get('/api/v1/station', async request => ({ data: stationSnapshotSchema.parse(await stationDto(context.prisma)), requestId: request.id }));", 'station route validation');
  source = replaceOnce(source, "return { data: inventory, requestId: request.id };", "return { data: inventoryItemSchema.array().parse(inventory), requestId: request.id };", 'inventory route validation');
  source = replaceOnce(source, "return { data: await context.prisma.ship.findMany({ where: { playerId: user.player.id } }), requestId: request.id };", "return { data: shipSchema.array().parse(await context.prisma.ship.findMany({ where: { playerId: user.player.id } })), requestId: request.id };", 'ship route validation');
  source = replaceOnce(source, "return { data: await context.prisma.crewMember.findMany({ where: { playerId: user.player.id } }), requestId: request.id };", "return { data: crewMemberSchema.array().parse(await context.prisma.crewMember.findMany({ where: { playerId: user.player.id } })), requestId: request.id };", 'crew route validation');
  source = replaceOnce(source, "return { data: await context.prisma.historyEntry.findMany({ orderBy: { createdAt: 'desc' }, take: query.limit }), requestId: request.id };", "return { data: historyRecordSchema.array().parse(await context.prisma.historyEntry.findMany({ orderBy: { createdAt: 'desc' }, take: query.limit })), requestId: request.id };", 'history route validation');
  return source;
});
