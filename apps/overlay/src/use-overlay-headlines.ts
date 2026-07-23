import { useEffect, useRef } from 'react';
import type { CurrentWreck, HistoryRecord, StationSnapshot } from '@neon-wreckers/contracts';
import { BoundedIdCache } from './bounded-id-cache.js';
import { classifyHeadline, headlineFromAlert, headlineFromHistory, isBreakingHeadline, type Headline } from './headlines.js';

export function useOverlayHeadlines({
  station,
  wreck,
  history,
  presenceCount,
  enqueue
}: {
  station: StationSnapshot | null;
  wreck: CurrentWreck | null;
  history: HistoryRecord[];
  presenceCount: number;
  enqueue: (incoming: Headline | Headline[]) => void;
}) {
  const previousStation = useRef<StationSnapshot | null>(null);
  const previousWreck = useRef<CurrentWreck | null>(null);
  const knownHistoryIds = useRef(new BoundedIdCache({ maxEntries: 1024, ttlMs: 24 * 60 * 60_000 }));
  const snapshotLoaded = useRef(false);

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
      if (changes.length) enqueue({ id: `station-${Date.now()}`, label: 'SYSTEM UPDATE', title: 'Station telemetry changed', body: changes.join(' • '), severity: classifyHeadline(changes.join(' ')), createdAt: Date.now() });
    }
    enqueue((station.alerts ?? []).slice(0, 8).map(alert => headlineFromAlert(alert)));
  }, [station, enqueue]);

  useEffect(() => {
    const entries = history.slice(0, 40);
    const unseen = entries.filter(entry => knownHistoryIds.current.add(String(entry.id)));
    if (!snapshotLoaded.current) enqueue(entries.slice(0, 24).map(entry => headlineFromHistory(entry)));
    else if (unseen.length) enqueue(unseen.map(entry => headlineFromHistory(entry)));
  }, [history, enqueue]);

  useEffect(() => {
    if (!wreck) return;
    const previous = previousWreck.current;
    previousWreck.current = wreck;
    if (previous && snapshotLoaded.current && (wreck.id !== previous.id || Number(wreck.integrity) !== Number(previous.integrity))) {
      const title = wreck.id !== previous.id ? String(wreck.name || 'New wreck located') : `${wreck.name || 'Wreck'} integrity changed`;
      const body = wreck.id !== previous.id ? String(wreck.description || `Risk classification: ${wreck.risk || 'unknown'}`) : `Remaining hull integrity: ${Math.round(Number(wreck.integrity ?? 0))}%`;
      const severity = classifyHeadline(`${title} ${body} ${wreck.risk || ''}`);
      enqueue({ id: `wreck-${wreck.id || Date.now()}-${wreck.integrity}`, label: 'SALVAGE INTELLIGENCE', title, body, severity, createdAt: Date.now(), breaking: isBreakingHeadline(`${title} ${body}`, severity) });
    }
  }, [wreck, enqueue]);

  useEffect(() => {
    if (presenceCount > 1) enqueue({ id: `presence-${presenceCount}-${Math.floor(Date.now() / 30_000)}`, label: 'VIEWER NETWORK', title: `${presenceCount} operators linked`, body: 'Twitch crew connections are active across the station network.', severity: 'viewer', createdAt: Date.now() });
  }, [presenceCount, enqueue]);

  useEffect(() => {
    if (station && wreck) snapshotLoaded.current = true;
  }, [station, wreck]);
}
