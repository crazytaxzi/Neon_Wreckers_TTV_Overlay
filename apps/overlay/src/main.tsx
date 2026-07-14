import { type CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { requestApi } from '@neon-wreckers/browser-client';
import { applyTheme, defaultTheme } from '@neon-wreckers/ui/theme';
import { loadOverlayConfig, type OverlayConfig } from './config.js';
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

type StationAlert = { id?: string; severity?: string; title?: string; body?: string; createdAt?: string };

type HistoryRecord = { id?: string; category?: string; title?: string; body?: string; createdAt?: string };

type Station = {
  name?: string;
  level?: number;
  population?: number;
  power?: number;
  morale?: number;
  integrity?: number;
  threatLevel?: string | number;
  storageCapacity?: number;
  storageUsed?: number;
  resources?: Record<string, number>;
  alerts?: StationAlert[];
};

type Wreck = { id?: string; name?: string; risk?: string; integrity?: number; description?: string };

applyTheme(defaultTheme);

const API = '/api/v1';
const MAX_HEADLINES = 40;

function wsUrl(): string {
  const url = new URL(`${API}/ws`, window.location.origin);
  url.protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return url.toString();
}

function clamp(value: unknown, fallback = 0): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.max(0, Math.min(100, numeric)) : fallback;
}

function compactNumber(value: unknown): string {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) return '0';
  return Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(numeric);
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
    createdAt: Date.parse(entry?.createdAt || '') || Date.now(),
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
    createdAt: Date.parse(alert?.createdAt || '') || Date.now(),
    breaking: isBreaking(`${title} ${body}`, severity)
  };
}

function Metric({ label, value, tone, suffix = '%' }: { label: string; value: number; tone: Severity; suffix?: string }) {
  return (
    <div className="metric">
      <div className="metric-line"><span>{label}</span><strong>{Math.round(value)}{suffix}</strong></div>
      <div className="meter"><span className={`meter-fill tone-${tone}`} style={{ width: `${clamp(value)}%` }} /></div>
    </div>
  );
}

function App() {
  const [config, setConfig] = useState<OverlayConfig | null>(null);
  const [station, setStation] = useState<Station | null>(null);
  const [wreck, setWreck] = useState<Wreck | null>(null);
  const [headlines, setHeadlines] = useState<Headline[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [connected, setConnected] = useState(false);
  const [clock, setClock] = useState(new Date());
  const [transitionKey, setTransitionKey] = useState(0);
  const [tickerAwake, setTickerAwake] = useState(true);
  const [statusAwake, setStatusAwake] = useState(true);
  const previousStation = useRef<Station | null>(null);
  const previousWreck = useRef<Wreck | null>(null);
  const knownHistoryIds = useRef<Set<string>>(new Set());
  const snapshotLoaded = useRef(false);
  const websocket = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<number | undefined>(undefined);
  const reconnectAttempt = useRef(0);
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

  const refresh = useCallback(async () => {
    const results = await Promise.allSettled([
      requestApi<Station>(`${API}/station`, { cache: 'no-store' }),
      requestApi<HistoryRecord[]>(`${API}/history`, { cache: 'no-store' }),
      requestApi<Wreck>(`${API}/wrecks/current`, { cache: 'no-store' })
    ]);

    if (results[0].status === 'fulfilled') {
      const next = results[0].value;
      const previous = previousStation.current;
      setStation(next);
      previousStation.current = next;

      if (previous && snapshotLoaded.current) {
        const changes: string[] = [];
        if (Number(next.integrity) !== Number(previous.integrity)) changes.push(`integrity ${Math.round(Number(next.integrity ?? 0))}%`);
        if (Number(next.power) !== Number(previous.power)) changes.push(`power ${Math.round(Number(next.power ?? 0))}%`);
        if (Number(next.morale) !== Number(previous.morale)) changes.push(`morale ${Math.round(Number(next.morale ?? 0))}%`);
        if (Number(next.population) !== Number(previous.population)) changes.push(`crew ${Math.round(Number(next.population ?? 0))}`);
        if (changes.length) enqueue({
          id: `station-poll-${Date.now()}`,
          label: 'SYSTEM UPDATE',
          title: 'Station telemetry changed',
          body: changes.join(' • '),
          severity: classify(changes.join(' ')),
          createdAt: Date.now()
        });
      }
      enqueue((next.alerts ?? []).slice(0, 8).map(fromAlert));
    }

    if (results[1].status === 'fulfilled') {
      const entries = results[1].value.slice(0, 40);
      const unseen = entries.filter((entry) => !knownHistoryIds.current.has(String(entry?.id)));
      for (const entry of entries) knownHistoryIds.current.add(String(entry?.id));
      if (!snapshotLoaded.current) enqueue(entries.slice(0, 24).map(fromHistory));
      else if (unseen.length) enqueue(unseen.map(fromHistory));
    }

    if (results[2].status === 'fulfilled') {
      const next = results[2].value;
      const previous = previousWreck.current;
      setWreck(next);
      previousWreck.current = next;
      if (previous && snapshotLoaded.current && (next.id !== previous.id || Number(next.integrity) !== Number(previous.integrity))) {
        const title = next.id !== previous.id ? String(next.name || 'New wreck located') : `${next.name || 'Wreck'} integrity changed`;
        const body = next.id !== previous.id
          ? String(next.description || `Risk classification: ${next.risk || 'unknown'}`)
          : `Remaining hull integrity: ${Math.round(Number(next.integrity ?? 0))}%`;
        const severity = classify(`${title} ${body} ${next.risk || ''}`);
        enqueue({ id: `wreck-poll-${next.id || Date.now()}-${next.integrity}`, label: 'SALVAGE INTELLIGENCE', title, body, severity, createdAt: Date.now(), breaking: isBreaking(`${title} ${body}`, severity) });
      }
    }

    snapshotLoaded.current = true;
  }, [enqueue]);

  useEffect(() => {
    refresh().catch(() => undefined);
    const timer = window.setInterval(() => refresh().catch(() => undefined), 2_500);
    return () => window.clearInterval(timer);
  }, [refresh]);

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

  useEffect(() => {
    let disposed = false;
    const connect = () => {
      if (disposed) return;
      const ws = new WebSocket(wsUrl());
      websocket.current = ws;
      ws.onopen = () => { reconnectAttempt.current = 0; setConnected(true); };
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'history.added' && message.entry) enqueue(fromHistory(message.entry));
          if (message.type === 'station.updated' && message.station) {
            const next = message.station as Station;
            const previous = previousStation.current;
            setStation(next);
            previousStation.current = next;
            if (previous) {
              const changes: string[] = [];
              if (Math.abs(Number(next.integrity ?? 0) - Number(previous.integrity ?? 0)) >= 2) changes.push(`integrity ${Math.round(Number(next.integrity ?? 0))}%`);
              if (Math.abs(Number(next.power ?? 0) - Number(previous.power ?? 0)) >= 2) changes.push(`power ${Math.round(Number(next.power ?? 0))}%`);
              if (Math.abs(Number(next.morale ?? 0) - Number(previous.morale ?? 0)) >= 3) changes.push(`morale ${Math.round(Number(next.morale ?? 0))}%`);
              if (changes.length) enqueue({ id: `station-${Date.now()}`, label: 'SYSTEM UPDATE', title: 'Station telemetry changed', body: changes.join(' • '), severity: classify(changes.join(' ')), createdAt: Date.now() });
            }
            enqueue((next.alerts ?? []).slice(0, 5).map(fromAlert));
          }
          if (message.type === 'wreck.updated' && message.wreck) {
            setWreck(message.wreck);
            const title = String(message.wreck.name || 'New wreck located');
            const body = String(message.wreck.description || `Risk classification: ${message.wreck.risk || 'unknown'}`);
            const severity = classify(`${title} ${body}`);
            enqueue({ id: `wreck-${message.wreck.id || Date.now()}`, label: 'SALVAGE INTELLIGENCE', title, body, severity, createdAt: Date.now(), breaking: isBreaking(`${title} ${body}`, severity) });
          }
          if (message.type === 'presence.updated' && Number(message.count) > 1) enqueue({ id: `presence-${message.count}-${Math.floor(Date.now() / 30000)}`, label: 'VIEWER NETWORK', title: `${message.count} operators linked`, body: 'Twitch crew connections are active across the station network.', severity: 'viewer', createdAt: Date.now() });
        } catch {
          // A malformed packet must not take down a live stream overlay.
        }
      };
      ws.onerror = () => ws.close();
      ws.onclose = () => {
        setConnected(false);
        if (disposed) return;
        reconnectTimer.current = window.setTimeout(connect, Math.min(30_000, 1_500 * 2 ** reconnectAttempt.current++));
      };
    };
    connect();
    return () => {
      disposed = true;
      if (reconnectTimer.current) window.clearTimeout(reconnectTimer.current);
      websocket.current?.close();
    };
  }, [enqueue]);

  const current = headlines[activeIndex] ?? { id: 'online', label: 'STATION NEWS', title: 'Station Zero is online', body: 'Awaiting salvage operations and viewer activity.', severity: 'positive' as Severity, createdAt: Date.now() };
  const threatText = String(station?.threatLevel ?? 'LOW').toUpperCase();
  const threatTone: Severity = /critical|high|severe/.test(threatText.toLowerCase()) ? 'critical' : /medium|elevated|warning/.test(threatText.toLowerCase()) ? 'warning' : 'positive';
  const storagePercent = station?.storageCapacity ? (Number(station.storageUsed ?? 0) / Number(station.storageCapacity)) * 100 : 0;
  const scrap = station?.resources?.scrap ?? station?.resources?.salvage ?? 0;
  const credits = station?.resources?.credits ?? station?.resources?.credit ?? 0;
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

  const breaking = Boolean(config.breakingNews && current.breaking);
  const forceVisible = Boolean(config.previewBackground && config.visibility.keepVisibleInPreview);
  const showTicker = forceVisible || tickerAwake;
  const showStatus = forceVisible || statusAwake;
  return (
    <main className={`broadcast-canvas ${config.previewBackground ? 'preview-background' : ''} ${config.scanlines ? 'with-scanlines' : ''} ${config.glass ? 'with-glass' : ''}`} style={cssVars}>
      {config.status.visible && <section className={`status-panel ${showStatus ? 'overlay-awake' : 'overlay-idle'}`} aria-label="Station status">
        <div className="panel-topline"><div><span className="eyebrow">NEON WRECKERS</span><h1>{station?.name || 'STATION ZERO'}</h1></div><div className={`link-light ${connected ? 'online' : ''}`} /></div>
        <div className="status-meta"><span>LEVEL {station?.level ?? 1}</span><span>CREW {compactNumber(station?.population ?? 0)}</span><span className={`threat tone-${threatTone}`}>THREAT {threatText}</span></div>
        <div className="metrics">
          <Metric label="HULL INTEGRITY" value={clamp(station?.integrity, 100)} tone={clamp(station?.integrity, 100) < 35 ? 'critical' : clamp(station?.integrity, 100) < 65 ? 'warning' : 'positive'} />
          <Metric label="REACTOR POWER" value={clamp(station?.power, 100)} tone={clamp(station?.power, 100) < 30 ? 'critical' : clamp(station?.power, 100) < 60 ? 'warning' : 'viewer'} />
          <Metric label="CREW MORALE" value={clamp(station?.morale, 100)} tone={clamp(station?.morale, 100) < 35 ? 'warning' : 'positive'} />
          <Metric label="CARGO STORAGE" value={storagePercent} tone={storagePercent > 88 ? 'warning' : 'info'} />
        </div>
        <div className="resource-strip"><div><span>SCRAP</span><strong>{compactNumber(scrap)}</strong></div><div><span>CREDITS</span><strong>{compactNumber(credits)}</strong></div><div><span>ACTIVE WRECK</span><strong>{wreck?.name || 'NONE'}</strong></div></div>
      </section>}

      {config.ticker.visible && <section className={`headline-rail severity-${current.severity} ${breaking ? 'breaking' : ''} ${showTicker ? 'overlay-awake' : 'overlay-idle'}`} aria-live="polite">
        {breaking && <div className="breaking-ribbon">BREAKING</div>}
        <div className="rail-cap left-cap"><span className="rail-pulse" /><span>{current.label}</span></div>
        <div className="headline-window" key={`${current.id}-${transitionKey}`}><div className="headline-title">{current.title}</div><div className="headline-body">{current.body}</div></div>
        <div className="rail-cap right-cap"><span>{utc} UTC</span><span className="counter">{String(activeIndex + 1).padStart(2, '0')}/{String(Math.max(headlines.length, 1)).padStart(2, '0')}</span></div>
      </section>}

      {config.feedIndicator && <div className={`feed-indicator ${connected ? 'connected' : 'reconnecting'}`}><span /> {connected ? 'LIVE STATION FEED' : 'RECONNECTING TO STATION'}</div>}
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
