import { readFileSync, writeFileSync, rmSync } from 'node:fs';

const path = 'apps/overlay/src/main.tsx';
let source = readFileSync(path, 'utf8');

source = source.replace(
  "import { requestApi } from '@neon-wreckers/browser-client';\nimport { currentWreckSchema, historyRecordSchema, realtimeEventSchema, stationSnapshotSchema, type CurrentWreck, type HistoryRecord, type StationAlert, type StationSnapshot } from '@neon-wreckers/contracts';",
  "import { type CurrentWreck, type HistoryRecord, type StationAlert, type StationSnapshot } from '@neon-wreckers/contracts';"
);
source = source.replace(
  "import { loadOverlayConfig, type OverlayConfig } from './config.js';",
  "import { loadOverlayConfig, type OverlayConfig } from './config.js';\nimport { useAdaptiveOverlayNetwork } from './network.js';"
);
source = source.replace(/\nfunction wsUrl\(\): string \{[\s\S]*?\n\}\n\nfunction clamp/, '\nfunction clamp');

source = source.replace(
  "  const [config, setConfig] = useState<OverlayConfig | null>(null);\n  const [station, setStation] = useState<Station | null>(null);\n  const [wreck, setWreck] = useState<Wreck | null>(null);",
  "  const [config, setConfig] = useState<OverlayConfig | null>(null);\n  const { station, wreck, history, presenceCount, connectionState, lastSnapshotAt, lastEventAt } = useAdaptiveOverlayNetwork();"
);
source = source.replace("\n  const [connected, setConnected] = useState(false);", '');
source = source.replace("\n  const websocket = useRef<WebSocket | null>(null);\n  const reconnectTimer = useRef<number | undefined>(undefined);\n  const reconnectAttempt = useRef(0);", '');

const replacementEffects = `  useEffect(() => {
    if (!station) return;
    const previous = previousStation.current;
    previousStation.current = station;
    if (previous && snapshotLoaded.current) {
      const changes: string[] = [];
      if (Number(station.integrity) !== Number(previous.integrity)) changes.push(\`integrity \${Math.round(Number(station.integrity ?? 0))}%\`);
      if (Number(station.power) !== Number(previous.power)) changes.push(\`power \${Math.round(Number(station.power ?? 0))}%\`);
      if (Number(station.morale) !== Number(previous.morale)) changes.push(\`morale \${Math.round(Number(station.morale ?? 0))}%\`);
      if (Number(station.population) !== Number(previous.population)) changes.push(\`crew \${Math.round(Number(station.population ?? 0))}\`);
      if (changes.length) enqueue({ id: \`station-\${Date.now()}\`, label: 'SYSTEM UPDATE', title: 'Station telemetry changed', body: changes.join(' • '), severity: classify(changes.join(' ')), createdAt: Date.now() });
    }
    enqueue((station.alerts ?? []).slice(0, 8).map(fromAlert));
  }, [station, enqueue]);

  useEffect(() => {
    const entries = history.slice(0, 40);
    const unseen = entries.filter(entry => !knownHistoryIds.current.has(String(entry.id)));
    for (const entry of entries) knownHistoryIds.current.add(String(entry.id));
    if (!snapshotLoaded.current) enqueue(entries.slice(0, 24).map(fromHistory));
    else if (unseen.length) enqueue(unseen.map(fromHistory));
  }, [history, enqueue]);

  useEffect(() => {
    if (!wreck) return;
    const previous = previousWreck.current;
    previousWreck.current = wreck;
    if (previous && snapshotLoaded.current && (wreck.id !== previous.id || Number(wreck.integrity) !== Number(previous.integrity))) {
      const title = wreck.id !== previous.id ? String(wreck.name || 'New wreck located') : \`\${wreck.name || 'Wreck'} integrity changed\`;
      const body = wreck.id !== previous.id
        ? String(wreck.description || \`Risk classification: \${wreck.risk || 'unknown'}\`)
        : \`Remaining hull integrity: \${Math.round(Number(wreck.integrity ?? 0))}%\`;
      const severity = classify(\`\${title} \${body} \${wreck.risk || ''}\`);
      enqueue({ id: \`wreck-\${wreck.id || Date.now()}-\${wreck.integrity}\`, label: 'SALVAGE INTELLIGENCE', title, body, severity, createdAt: Date.now(), breaking: isBreaking(\`\${title} \${body}\`, severity) });
    }
  }, [wreck, enqueue]);

  useEffect(() => {
    if (presenceCount > 1) enqueue({ id: \`presence-\${presenceCount}-\${Math.floor(Date.now() / 30000)}\`, label: 'VIEWER NETWORK', title: \`\${presenceCount} operators linked\`, body: 'Twitch crew connections are active across the station network.', severity: 'viewer', createdAt: Date.now() });
  }, [presenceCount, enqueue]);

  useEffect(() => {
    if (station && wreck) snapshotLoaded.current = true;
  }, [station, wreck]);

`;

source = source.replace(
  /  const refresh = useCallback\([\s\S]*?\n  \}, \[refresh\]\);\n\n(?=  useEffect\(\(\) => \{\n    const timer = window\.setInterval\(\(\) => setClock)/,
  replacementEffects
);
source = source.replace(
  /  useEffect\(\(\) => \{\n    let disposed = false;[\s\S]*?\n  \}, \[enqueue\]\);\n\n(?=  const current)/,
  ''
);

source = source.replace(
  "  const breaking = Boolean(config.breakingNews && current.breaking);",
  "  const connected = connectionState === 'live';\n  const networkLabel = connectionState === 'live' ? 'LIVE STATION FEED' : connectionState === 'stale' ? 'STALE STATION FEED' : connectionState === 'offline' ? 'STATION FEED OFFLINE' : connectionState === 'connecting' ? 'CONNECTING TO STATION' : 'RECONNECTING TO STATION';\n  const networkTitle = `Last snapshot: ${lastSnapshotAt ? new Date(lastSnapshotAt).toISOString() : 'pending'} · Last event: ${lastEventAt ? new Date(lastEventAt).toISOString() : 'pending'}`;\n  const breaking = Boolean(config.breakingNews && current.breaking);"
);
source = source.replace(
  '<main className={`broadcast-canvas ${config.previewBackground ? \'preview-background\' : \'\'} ${config.scanlines ? \'with-scanlines\' : \'\'} ${config.glass ? \'with-glass\' : \'\'}`} style={cssVars}>',
  '<main className={`broadcast-canvas ${config.previewBackground ? \'preview-background\' : \'\'} ${config.scanlines ? \'with-scanlines\' : \'\'} ${config.glass ? \'with-glass\' : \'\'}`} style={cssVars} data-connection-state={connectionState} data-last-snapshot-at={lastSnapshotAt ?? undefined} data-last-event-at={lastEventAt ?? undefined}>'
);
source = source.replace(
  "{config.feedIndicator && <div className={`feed-indicator ${connected ? 'connected' : 'reconnecting'}`}><span /> {connected ? 'LIVE STATION FEED' : 'RECONNECTING TO STATION'}</div>}",
  "{config.feedIndicator && <div className={`feed-indicator ${connectionState}`} title={networkTitle}><span /> {networkLabel}</div>}"
);

if (source.includes('requestApi<') || source.includes('new WebSocket') || source.includes('2_500')) {
  throw new Error('Step 4 migration left legacy overlay networking in main.tsx');
}
if (!source.includes('useAdaptiveOverlayNetwork')) throw new Error('Adaptive network hook was not installed');
writeFileSync(path, source);
rmSync('tools/audit/step4-migrate.mjs');
rmSync('.github/workflows/audit-step4-migrate.yml');
