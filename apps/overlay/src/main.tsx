import { type CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { type CurrentWreck, type HistoryRecord, type StationAlert, type StationSnapshot } from '@neon-wreckers/contracts';
import { Badge, Meter, NWIcon, OverlayEventPopup, Panel, ThemeProvider, defaultTheme, type Tone } from '@neon-wreckers/ui';
import { loadOverlayConfig, type OverlayConfig } from './config.js';
import { useAdaptiveOverlayNetwork } from './network.js';
import './overlay.css';

type Severity = 'positive' | 'info' | 'viewer' | 'warning' | 'critical';

type Headline = {
  id: string;
  label: string;
  title: string;
  body: string;
  severity: Severity;
  createdAt: number;
  breaking?: boolean;
};

type Station = StationSnapshot;
type Wreck = CurrentWreck;

const API = '/api/v1';
const MAX_HEADLINES = 40;

function clamp(value: unknown, fallback = 0): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.max(0, Math.min(100, numeric)) : fallback;
}

function compactNumber(value: unknown): string {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) return '0';
  return Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(numeric);
}

function wreckArtworkSrc(wreck: Wreck | null): string | null {
  const visualKey = String(wreck?.visualKey ?? '').trim();
  if (!visualKey) return null;
  const slug = visualKey.startsWith('wreck-') ? visualKey.slice('wreck-'.length) : visualKey;
  return `/wrecks/${slug}.webp`;
}

function classify(input: string, explicit?: string): Severity {
  const text = `${explicit ?? ''} ${input}`.toLowerCase();
  if (/critical|breach|destroy|attack|failure|emergency|dead|lost|boss/.test(text)) return 'critical';
  if (/warning|threat|danger|unstable|damage|pirate|storm|low/.test(text)) return 'warning';
  if (/viewer|twitch|raid|follow|redeem|subscriber|cheer|joined/.test(text)) return 'viewer';
  if (/complete|success|recovered|upgrade|repair|found|milestone|online/.test(text)) return 'positive';
  return 'info';
}

function isBreaking(input: string, severity: Severity): boolean {
  return severity === 'critical' || /boss|attack|breach|emergency|reactor|pirate/.test(input.toLowerCase());
}

function fromHistory(entry: HistoryRecord): Headline {
  const title = String(entry?.title || 'Station dispatch');
  const body = String(entry?.body || 'New activity recorded aboard Station Zero.');
  const severity = classify(`${title} ${body}`, entry?.category);
  return {
    id: String(entry?.id || `${entry?.createdAt || Date.now()}-${title}-${body}`),
    label: String(entry?.category || 'STATION NEWS').replaceAll('_', ' ').toUpperCase(),
    title,
    body,
    severity,
    createdAt: Date.parse(String(entry?.createdAt ?? '')) || Date.now(),
    breaking: isBreaking(`${title} ${body}`, severity)
  };
}

function fromAlert(alert: StationAlert): Headline {
  const title = String(alert?.title || 'Station alert');
  const body = String(alert?.body || 'New station alert received.');
  const severity = classify(`${title} ${body}`, alert?.severity);
  return {
    id: String(alert?.id || `${alert?.createdAt || Date.now()}-${title}`),
    label: severity === 'critical' ? 'BREAKING ALERT' : 'STATION ALERT',
    title,
    body,
    severity,
    createdAt: Date.parse(String(alert?.createdAt ?? '')) || Date.now(),
    breaking: isBreaking(`${title} ${body}`, severity)
  };
}

function uiTone(tone: Severity): Tone {
  return tone === 'positive' ? 'success' : tone === 'viewer' ? 'purple' : tone === 'critical' ? 'danger' : tone;
}

function TelemetryMeter({ label, value, tone }: { label: string; value: number; tone: Severity }) {
  return <Meter label={label} value={Math.round(value)} tone={uiTone(tone)} />;
}

function App() {
  const [config, setConfig] = useState<OverlayConfig | null>(null);
  const { station, wreck, history, presenceCount, connectionState, lastSnapshotAt, lastEventAt } = useAdaptiveOverlayNetwork();
  const [headlines, setHeadlines] = useState<Headline[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [clock, setClock] = useState(new Date());
  const [transitionKey, setTransitionKey] = useState(0);
  const [tickerAwake, setTickerAwake] = useState(true);
  const [statusAwake, setStatusAwake] = useState(true);
  const previousStation = useRef<Station | null>(null);
  const previousWreck = useRef<Wreck | null>(null);
  const knownHistoryIds = useRef<Set<string>>(new Set());
  const snapshotLoaded = useRef(false);
  const tickerSleepTimer = useRef<number | undefined>(undefined);
  const statusSleepTimer = useRef<number | undefined>(undefined);
  const knownHeadlineIds = useRef(new Set<string>());

  useEffect(() => { loadOverlayConfig().then(setConfig); }, []);

  const wakeOverlay = useCallback(() => {
    setTickerAwake(true);
    setStatusAwake(true);
    if (tickerSleepTimer.current) window.clearTimeout(tickerSleepTimer.current);
    if (statusSleepTimer.current) window.clearTimeout(statusSleepTimer.current);
    const tickerHold = Math.max(2, config?.visibility?.tickerHoldSeconds ?? 9) * 1000;
    const statusHold = Math.max(2, config?.visibility?.statusHoldSeconds ?? 16) * 1000;
    tickerSleepTimer.current = window.setTimeout(() => setTickerAwake(false), tickerHold);
    statusSleepTimer.current = window.setTimeout(() => setStatusAwake(false), statusHold);
  }, [config]);

  useEffect(() => {
    if (!config) return;
    wakeOverlay();
    return () => {
      if (tickerSleepTimer.current) window.clearTimeout(tickerSleepTimer.current);
      if (statusSleepTimer.current) window.clearTimeout(statusSleepTimer.current);
    };
  }, [config, wakeOverlay]);

  const enqueue = useCallback((incoming: Headline | Headline[]) => {
    const list = Array.isArray(incoming) ? incoming : [incoming];
    const fresh = list.filter((entry) => {
      if (knownHeadlineIds.current.has(entry.id)) return false;
      knownHeadlineIds.current.add(entry.id);
      return true;
    });
    if (!fresh.length) return;
    setHeadlines((current) => {
      const ids = new Set<string>();
      return [...fresh, ...current]
        .sort((a, b) => Number(Boolean(b.breaking)) - Number(Boolean(a.breaking)) || b.createdAt - a.createdAt)
        .filter((entry) => !ids.has(entry.id) && Boolean(ids.add(entry.id)))
        .slice(0, MAX_HEADLINES);
    });
    setActiveIndex(0);
    setTransitionKey((key) => key + 1);
    wakeOverlay();
  }, [wakeOverlay]);

  useEffect(() => {
    if (!station) return;
    const previous = previousStation.current;
    previousStation.current = station;
    if (previous && snapshotLoaded.current) {
      const changes: string[] = [];
      if (Number(station.integrity) !== Number(previous.integrity)) changes.push(`integrity ${Math.round(Number(station.integrity ?? 0))}%`);
      if (Number(station.power) !== Number(previous.power)) changes.push(`power ${Math.round(Number(station.power ?? 0))}%`);
      if (Number(station.morale) !== Number(previous.morale)) changes.push(`morale ${Math.round(Number(station.morale ?? 0))}%`);
      if (Number(station.population) !== Number(previous.population)) changes.push(`crew ${Math.round(Number(station.population ?? 0))}`);
      if (changes.length) enqueue({ id: `station-${Date.now()}`, label: 'SYSTEM UPDATE', title: 'Station telemetry changed', body: changes.join(' • '), severity: classify(changes.join(' ')), createdAt: Date.now() });
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
      const title = wreck.id !== previous.id ? String(wreck.name || 'New wreck located') : `${wreck.name || 'Wreck'} integrity changed`;
      const body = wreck.id !== previous.id
        ? String(wreck.description || `Risk classification: ${wreck.risk || 'unknown'}`)
        : `Remaining hull integrity: ${Math.round(Number(wreck.integrity ?? 0))}%`;
      const severity = classify(`${title} ${body} ${wreck.risk || ''}`);
      enqueue({ id: `wreck-${wreck.id || Date.now()}-${wreck.integrity}`, label: 'SALVAGE INTELLIGENCE', title, body, severity, createdAt: Date.now(), breaking: isBreaking(`${title} ${body}`, severity) });
    }
  }, [wreck, enqueue]);

  useEffect(() => {
    if (presenceCount > 1) enqueue({ id: `presence-${presenceCount}-${Math.floor(Date.now() / 30000)}`, label: 'VIEWER NETWORK', title: `${presenceCount} operators linked`, body: 'Twitch crew connections are active across the station network.', severity: 'viewer', createdAt: Date.now() });
  }, [presenceCount, enqueue]);

  useEffect(() => {
    if (station && wreck) snapshotLoaded.current = true;
  }, [station, wreck]);

  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 1_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!config || headlines.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % headlines.length);
      setTransitionKey((key) => key + 1);
    }, Math.max(3, config.ticker.rotationSeconds) * 1000);
    return () => window.clearInterval(timer);
  }, [config, headlines.length]);

  const current = headlines[activeIndex] ?? { id: 'online', label: 'STATION NEWS', title: 'Station Zero is online', body: 'Awaiting salvage operations and viewer activity.', severity: 'positive' as Severity, createdAt: Date.now() };
  const threatText = String(station?.threatLevel ?? 'LOW').toUpperCase();
  const threatTone: Severity = /critical|high|severe/.test(threatText.toLowerCase()) ? 'critical' : /medium|elevated|warning/.test(threatText.toLowerCase()) ? 'warning' : 'positive';
  const storagePercent = station?.storageCapacity ? (Number(station.storageUsed ?? 0) / Number(station.storageCapacity)) * 100 : 0;
  const scrap = station?.resources?.scrap ?? station?.resources?.salvage ?? 0;
  const credits = station?.resources?.credits ?? station?.resources?.credit ?? 0;
  const wreckArtwork = wreckArtworkSrc(wreck);
  const utc = useMemo(() => clock.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' }), [clock]);

  if (!config) return null;

  const cssVars = {
    '--positive': config.theme.positive,
    '--info': config.theme.info,
    '--viewer': config.theme.viewer,
    '--warning': config.theme.warning,
    '--critical': config.theme.critical,
    '--panel': config.theme.panel,
    '--panel-alt': config.theme.panelAlt,
    '--text': config.theme.text,
    '--muted': config.theme.muted,
    '--status-top': `${config.status.top}px`,
    '--status-left': `${config.status.left}px`,
    '--status-width': `${config.status.width}px`,
    '--status-scale': String(config.status.scale),
    '--ticker-top': `${config.ticker.top}px`,
    '--ticker-width': `${config.ticker.width}px`,
    '--ticker-scale': String(config.ticker.scale),
    '--fade-seconds': `${Math.max(0.2, config.visibility.fadeSeconds)}s`
  } as CSSProperties;

  const connected = connectionState === 'live';
  const networkLabel = connectionState === 'live' ? 'LIVE STATION FEED' : connectionState === 'stale' ? 'STALE STATION FEED' : connectionState === 'offline' ? 'STATION FEED OFFLINE' : connectionState === 'connecting' ? 'CONNECTING TO STATION' : 'RECONNECTING TO STATION';
  const networkTitle = `Last snapshot: ${lastSnapshotAt ? new Date(lastSnapshotAt).toISOString() : 'pending'} · Last event: ${lastEventAt ? new Date(lastEventAt).toISOString() : 'pending'}`;
  const breaking = Boolean(config.breakingNews && current.breaking);
  const forceVisible = Boolean(config.previewBackground && config.visibility.keepVisibleInPreview);
  const showTicker = forceVisible || tickerAwake;
  const showStatus = forceVisible || statusAwake;
  return (
    <main className={`broadcast-canvas ${config.previewBackground ? 'preview-background' : ''} ${config.scanlines ? 'with-scanlines' : ''} ${config.glass ? 'with-glass' : ''}`} style={cssVars} data-connection-state={connectionState} data-last-snapshot-at={lastSnapshotAt ?? undefined} data-last-event-at={lastEventAt ?? undefined}>
      {config.status.visible && <Panel depth="medium" tone="success" className={`telemetry-panel station-panel ${showStatus ? 'overlay-awake' : 'overlay-idle'}`} aria-label="Station telemetry">
        <header className="telemetry-header"><div className="telemetry-ident"><span className="telemetry-icon"><NWIcon name="station" size={22} /></span><div><span className="nw-eyebrow">ORBITAL COMMAND</span><h1>{station?.name || 'STATION ZERO'}</h1></div></div><Badge tone={connected ? 'success' : 'warning'} icon="network">{connected ? 'LIVE LINK' : 'LINK LOST'}</Badge></header>
        <div className="telemetry-meta"><span>ZERO-01</span><span>LEVEL {station?.level ?? 1}</span><span>CREW {compactNumber(station?.population ?? 0)}</span><Badge tone={uiTone(threatTone)}>THREAT {threatText}</Badge></div>
        <div className="telemetry-grid station-grid" aria-hidden="true" />
        <div className="telemetry-meters">
          <TelemetryMeter label="HULL INTEGRITY" value={clamp(station?.integrity, 100)} tone={clamp(station?.integrity, 100) < 35 ? 'critical' : clamp(station?.integrity, 100) < 65 ? 'warning' : 'positive'} />
          <TelemetryMeter label="REACTOR POWER" value={clamp(station?.power, 100)} tone={clamp(station?.power, 100) < 30 ? 'critical' : clamp(station?.power, 100) < 60 ? 'warning' : 'viewer'} />
          <TelemetryMeter label="CREW MORALE" value={clamp(station?.morale, 100)} tone={clamp(station?.morale, 100) < 35 ? 'warning' : 'positive'} />
          <TelemetryMeter label="CARGO STORAGE" value={storagePercent} tone={storagePercent > 88 ? 'warning' : 'info'} />
        </div>
        <footer className="resource-strip"><div><span>SCRAP</span><strong className="nw-numeric">{compactNumber(scrap)}</strong></div><div><span>CREDITS</span><strong className="nw-numeric">{compactNumber(credits)}</strong></div><div><span>GRID</span><strong>{connected ? 'SYNCED' : 'OFFLINE'}</strong></div></footer>
      </Panel>}

      {config.status.visible && <Panel depth="medium" tone={uiTone(classify(String(wreck?.risk ?? '')))} className={`telemetry-panel wreck-telemetry ${showStatus ? 'overlay-awake' : 'overlay-idle'}`} aria-label="Active wreck telemetry">
        <header className="telemetry-header"><div className="telemetry-ident"><span className="telemetry-icon wreck-icon"><NWIcon name="wreck" size={22} /></span><div><span className="nw-eyebrow">SALVAGE TARGET</span><h2>{wreck?.name || 'SCANNING FIELD'}</h2></div></div><Badge tone={uiTone(classify(String(wreck?.risk ?? '')))}>{wreck?.risk || 'UNKNOWN'}</Badge></header>
        <div className="wreck-schematic" aria-hidden="true"><div className="scan-grid" /><span className="scan-ring scan-ring-outer" /><span className="scan-ring scan-ring-inner" />{wreckArtwork ? <img className="wreck-schematic__art" src={wreckArtwork} srcSet={`${wreckArtwork.replace('.webp', '-360w.webp')} 360w, ${wreckArtwork.replace('.webp', '-600w.webp')} 600w, ${wreckArtwork} 1200w`} sizes="(max-width: 1280px) 18rem, 24rem" alt="" loading="eager" decoding="async" /> : <NWIcon name="wreck" size={48} />}</div>
        <p>{wreck?.description || 'Awaiting server telemetry from the local debris field.'}</p>
        <TelemetryMeter label="REMAINING HULL" value={clamp(wreck?.integrity)} tone={clamp(wreck?.integrity) <= 25 ? 'critical' : clamp(wreck?.integrity) <= 50 ? 'warning' : 'positive'} />
        <footer className="wreck-footer"><span>OBJECT ID</span><strong className="nw-numeric">{wreck?.id ? wreck.id.slice(0, 12).toUpperCase() : 'NO CONTACT'}</strong></footer>
      </Panel>}

      {current.severity === 'viewer' && showTicker && <div className="viewer-event-region" key={`viewer-${current.id}-${transitionKey}`}>
        <OverlayEventPopup label={current.label} title={current.title} tone="purple" icon="broadcast">{current.body}</OverlayEventPopup>
      </div>}

      {config.ticker.visible && <section className={`dispatch-rail nw-tone--${uiTone(current.severity)} ${breaking ? 'breaking' : ''} ${showTicker ? 'overlay-awake' : 'overlay-idle'}`} aria-live="polite">
        {breaking && <div className="breaking-ribbon">BREAKING</div>}
        <div className="rail-cap left-cap"><NWIcon name={breaking ? 'warning' : 'broadcast'} size={18} /><div><span className="nw-eyebrow">ACTIVITY DISPATCH</span><strong>{current.label}</strong></div></div>
        <div className="headline-window" key={`${current.id}-${transitionKey}`}><div className="headline-title">{current.title}</div><div className="headline-body">{current.body}</div></div>
        <div className="rail-cap right-cap"><span>{utc} UTC</span><span className="counter">{String(activeIndex + 1).padStart(2, '0')}/{String(Math.max(headlines.length, 1)).padStart(2, '0')}</span></div>
      </section>}

      {config.feedIndicator && <div className={`feed-indicator ${connectionState}`} title={networkTitle}><span /> {networkLabel}</div>}
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<ThemeProvider theme={defaultTheme}><App /></ThemeProvider>);
