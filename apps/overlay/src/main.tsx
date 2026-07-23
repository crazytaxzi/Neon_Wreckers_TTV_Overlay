import { type CSSProperties, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider, defaultTheme } from '@neon-wreckers/ui';
import { DispatchRail, FeedIndicator, StationTelemetry, ViewerEventRegion, WreckTelemetry } from './components.js';
import { loadOverlayConfig, type OverlayConfig } from './config.js';
import { type Headline } from './headlines.js';
import { useAdaptiveOverlayNetwork } from './network.js';
import { useHeadlineQueue } from './use-headline-queue.js';
import { useOverlayHeadlines } from './use-overlay-headlines.js';
import { useOverlayVisibility } from './use-overlay-visibility.js';
import './overlay.css';

const onlineHeadline: Headline = {
  id: 'online',
  label: 'STATION NEWS',
  title: 'Station Zero is online',
  body: 'Awaiting salvage operations and viewer activity.',
  severity: 'positive',
  createdAt: 0
};

function useUtcClock() {
  const [clock, setClock] = useState(new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 1_000);
    return () => window.clearInterval(timer);
  }, []);
  return useMemo(() => clock.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' }), [clock]);
}

function overlayStyle(config: OverlayConfig): CSSProperties {
  return {
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
}

function App() {
  const [config, setConfig] = useState<OverlayConfig | null>(null);
  const network = useAdaptiveOverlayNetwork();
  const utc = useUtcClock();

  useEffect(() => { void loadOverlayConfig().then(setConfig); }, []);

  const forceVisible = Boolean(config?.previewBackground && config.visibility.keepVisibleInPreview);
  const visibility = useOverlayVisibility({
    tickerHoldSeconds: config?.visibility.tickerHoldSeconds ?? 9,
    statusHoldSeconds: config?.visibility.statusHoldSeconds ?? 16,
    forceVisible
  });
  const queue = useHeadlineQueue(config?.ticker.rotationSeconds ?? 8, visibility.wake);
  useOverlayHeadlines({
    station: network.station,
    wreck: network.wreck,
    history: network.history,
    presenceCount: network.presenceCount,
    enqueue: queue.enqueue
  });

  if (!config) return null;
  const current = queue.current ?? onlineHeadline;
  const connected = network.connectionState === 'live';
  const breaking = Boolean(config.breakingNews && current.breaking);

  return <main
    className={`broadcast-canvas ${config.previewBackground ? 'preview-background' : ''} ${config.scanlines ? 'with-scanlines' : ''} ${config.glass ? 'with-glass' : ''}`}
    style={overlayStyle(config)}
    data-connection-state={network.connectionState}
    data-last-snapshot-at={network.lastSnapshotAt ?? undefined}
    data-last-event-at={network.lastEventAt ?? undefined}
  >
    {config.status.visible && <StationTelemetry station={network.station} connected={connected} visible={visibility.statusAwake} />}
    {config.status.visible && <WreckTelemetry wreck={network.wreck} visible={visibility.statusAwake} />}
    <ViewerEventRegion headline={current} visible={visibility.tickerAwake} transitionKey={queue.transitionKey} />
    {config.ticker.visible && <DispatchRail headline={current} visible={visibility.tickerAwake} breaking={breaking} utc={utc} activeIndex={queue.activeIndex} count={queue.headlines.length} transitionKey={queue.transitionKey} />}
    {config.feedIndicator && <FeedIndicator state={network.connectionState} lastSnapshotAt={network.lastSnapshotAt} lastEventAt={network.lastEventAt} />}
  </main>;
}

createRoot(document.getElementById('root')!).render(<ThemeProvider theme={defaultTheme}><App /></ThemeProvider>);
