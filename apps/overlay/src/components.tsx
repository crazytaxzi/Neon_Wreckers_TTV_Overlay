import type { CurrentWreck, StationSnapshot } from '@neon-wreckers/contracts';
import { Badge, Meter, NWIcon, OverlayEventPopup, Panel, type Tone } from '@neon-wreckers/ui';
import { classifyHeadline, type Headline, type Severity } from './headlines.js';

export function uiTone(tone: Severity): Tone {
  return tone === 'positive' ? 'success' : tone === 'viewer' ? 'purple' : tone === 'critical' ? 'danger' : tone;
}

export function clamp(value: unknown, fallback = 0): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.max(0, Math.min(100, numeric)) : fallback;
}

export function compactNumber(value: unknown): string {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) return '0';
  return Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(numeric);
}

function TelemetryMeter({ label, value, tone }: { label: string; value: number; tone: Severity }) {
  return <Meter label={label} value={Math.round(value)} tone={uiTone(tone)} />;
}

export function StationTelemetry({ station, connected, visible }: { station: StationSnapshot | null; connected: boolean; visible: boolean }) {
  const threatText = String(station?.threatLevel ?? 'LOW').toUpperCase();
  const threatTone: Severity = /critical|high|severe/.test(threatText.toLowerCase()) ? 'critical' : /medium|elevated|warning/.test(threatText.toLowerCase()) ? 'warning' : 'positive';
  const storagePercent = station?.storageCapacity ? (Number(station.storageUsed ?? 0) / Number(station.storageCapacity)) * 100 : 0;
  const scrap = station?.resources?.scrap ?? station?.resources?.salvage ?? 0;
  const credits = station?.resources?.credits ?? station?.resources?.credit ?? 0;
  return <Panel depth="medium" tone="success" className={`telemetry-panel station-panel ${visible ? 'overlay-awake' : 'overlay-idle'}`} aria-label="Station telemetry">
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
  </Panel>;
}

function wreckArtworkSrc(wreck: CurrentWreck | null): string | null {
  const visualKey = String(wreck?.visualKey ?? '').trim();
  if (!visualKey) return null;
  const slug = visualKey.startsWith('wreck-') ? visualKey.slice('wreck-'.length) : visualKey;
  return `/wrecks/${slug}.webp`;
}

export function WreckTelemetry({ wreck, visible }: { wreck: CurrentWreck | null; visible: boolean }) {
  const tone = classifyHeadline(String(wreck?.risk ?? ''));
  const artwork = wreckArtworkSrc(wreck);
  return <Panel depth="medium" tone={uiTone(tone)} className={`telemetry-panel wreck-telemetry ${visible ? 'overlay-awake' : 'overlay-idle'}`} aria-label="Active wreck telemetry">
    <header className="telemetry-header"><div className="telemetry-ident"><span className="telemetry-icon wreck-icon"><NWIcon name="wreck" size={22} /></span><div><span className="nw-eyebrow">SALVAGE TARGET</span><h2>{wreck?.name || 'SCANNING FIELD'}</h2></div></div><Badge tone={uiTone(tone)}>{wreck?.risk || 'UNKNOWN'}</Badge></header>
    <div className="wreck-schematic" aria-hidden="true"><div className="scan-grid" /><span className="scan-ring scan-ring-outer" /><span className="scan-ring scan-ring-inner" />{artwork ? <img className="wreck-schematic__art" src={artwork} srcSet={`${artwork.replace('.webp', '-360w.webp')} 360w, ${artwork.replace('.webp', '-600w.webp')} 600w, ${artwork} 1200w`} sizes="(max-width: 1280px) 18rem, 24rem" alt="" loading="eager" decoding="async" /> : <NWIcon name="wreck" size={48} />}</div>
    <p>{wreck?.description || 'Awaiting server telemetry from the local debris field.'}</p>
    <TelemetryMeter label="REMAINING HULL" value={clamp(wreck?.integrity)} tone={clamp(wreck?.integrity) <= 25 ? 'critical' : clamp(wreck?.integrity) <= 50 ? 'warning' : 'positive'} />
    <footer className="wreck-footer"><span>OBJECT ID</span><strong className="nw-numeric">{wreck?.id ? wreck.id.slice(0, 12).toUpperCase() : 'NO CONTACT'}</strong></footer>
  </Panel>;
}

export function ViewerEventRegion({ headline, visible, transitionKey }: { headline: Headline; visible: boolean; transitionKey: number }) {
  if (headline.severity !== 'viewer' || !visible) return null;
  return <div className="viewer-event-region" key={`viewer-${headline.id}-${transitionKey}`}><OverlayEventPopup label={headline.label} title={headline.title} tone="purple" icon="broadcast">{headline.body}</OverlayEventPopup></div>;
}

export function DispatchRail({ headline, visible, breaking, utc, activeIndex, count, transitionKey }: { headline: Headline; visible: boolean; breaking: boolean; utc: string; activeIndex: number; count: number; transitionKey: number }) {
  return <section className={`dispatch-rail nw-tone--${uiTone(headline.severity)} ${breaking ? 'breaking' : ''} ${visible ? 'overlay-awake' : 'overlay-idle'}`} aria-live="polite">
    {breaking && <div className="breaking-ribbon">BREAKING</div>}
    <div className="rail-cap left-cap"><NWIcon name={breaking ? 'warning' : 'broadcast'} size={18} /><div><span className="nw-eyebrow">ACTIVITY DISPATCH</span><strong>{headline.label}</strong></div></div>
    <div className="headline-window" key={`${headline.id}-${transitionKey}`}><div className="headline-title">{headline.title}</div><div className="headline-body">{headline.body}</div></div>
    <div className="rail-cap right-cap"><span>{utc} UTC</span><span className="counter">{String(activeIndex + 1).padStart(2, '0')}/{String(Math.max(count, 1)).padStart(2, '0')}</span></div>
  </section>;
}

export function FeedIndicator({ state, lastSnapshotAt, lastEventAt }: { state: string; lastSnapshotAt: number | null; lastEventAt: number | null }) {
  const label = state === 'live' ? 'LIVE STATION FEED' : state === 'stale' ? 'STALE STATION FEED' : state === 'offline' ? 'STATION FEED OFFLINE' : state === 'connecting' ? 'CONNECTING TO STATION' : 'RECONNECTING TO STATION';
  const title = `Last snapshot: ${lastSnapshotAt ? new Date(lastSnapshotAt).toISOString() : 'pending'} · Last event: ${lastEventAt ? new Date(lastEventAt).toISOString() : 'pending'}`;
  return <div className={`feed-indicator ${state}`} title={title}><span /> {label}</div>;
}
