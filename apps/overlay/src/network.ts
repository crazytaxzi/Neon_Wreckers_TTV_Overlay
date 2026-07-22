import { useEffect, useMemo, useState } from 'react';
import { requestApi } from '@neon-wreckers/browser-client';
import {
  currentWreckSchema,
  historyRecordSchema,
  realtimeEventSchema,
  stationSnapshotSchema,
  type CurrentWreck,
  type HistoryRecord,
  type RealtimeEvent,
  type StationSnapshot
} from '@neon-wreckers/contracts';

export type OverlayConnectionState = 'connecting' | 'live' | 'reconnecting' | 'stale' | 'offline';

export type OverlaySnapshot = {
  station: StationSnapshot;
  history: HistoryRecord[];
  wreck: CurrentWreck;
};

export const CONNECTED_RECONCILE_MS = 90_000;
export const DISCONNECTED_GRACE_MS = 5_000;
export const FALLBACK_POLL_MS = 10_000;
export const STALE_EVENT_MS = 45_000;
export const OFFLINE_SNAPSHOT_MS = 60_000;
export const STATUS_TICK_MS = 5_000;

export function reconnectDelayMs(attempt: number, random = Math.random): number {
  const base = Math.min(30_000, 1_500 * 2 ** Math.max(0, attempt));
  return Math.round(base * (0.75 + random() * 0.5));
}

export function deriveConnectionState(input: {
  socketOpen: boolean;
  reconnecting: boolean;
  now: number;
  lastEventAt: number | null;
  lastSnapshotAt: number | null;
}): OverlayConnectionState {
  if (input.socketOpen) {
    return input.lastEventAt != null && input.now - input.lastEventAt > STALE_EVENT_MS ? 'stale' : 'live';
  }
  if (input.lastSnapshotAt != null && input.now - input.lastSnapshotAt > OFFLINE_SNAPSHOT_MS) return 'offline';
  return input.reconnecting ? 'reconnecting' : 'connecting';
}

type TimerHandle = ReturnType<typeof setTimeout>;

type SocketLike = {
  readyState: number;
  OPEN: number;
  close(): void;
  onopen: ((event: Event) => void) | null;
  onclose: ((event: CloseEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onmessage: ((event: MessageEvent<unknown>) => void) | null;
};

export type OverlayNetworkDependencies = {
  fetchSnapshot(signal: AbortSignal): Promise<OverlaySnapshot>;
  createSocket(): SocketLike;
  now(): number;
  random(): number;
  setTimer(callback: () => void, delay: number): TimerHandle;
  clearTimer(handle: TimerHandle): void;
};

export type OverlayNetworkObserver = {
  onSnapshot(snapshot: OverlaySnapshot): void;
  onEvent(event: RealtimeEvent): void;
  onState(state: OverlayConnectionState): void;
  onTimestamps(timestamps: { lastSnapshotAt: number | null; lastEventAt: number | null }): void;
  onMalformed(error: unknown): void;
};

export class OverlayNetworkController {
  private socket: SocketLike | null = null;
  private abortController: AbortController | null = null;
  private reconcilePromise: Promise<void> | null = null;
  private reconnectTimer: TimerHandle | null = null;
  private pollingTimer: TimerHandle | null = null;
  private graceTimer: TimerHandle | null = null;
  private statusTimer: TimerHandle | null = null;
  private stopped = true;
  private reconnectAttempt = 0;
  private socketOpen = false;
  private reconnecting = false;
  private hasOpened = false;
  private lastSnapshotAt: number | null = null;
  private lastEventAt: number | null = null;

  constructor(
    private readonly dependencies: OverlayNetworkDependencies,
    private readonly observer: OverlayNetworkObserver
  ) {}

  start() {
    if (!this.stopped) return;
    this.stopped = false;
    this.publishState();
    void this.reconcile();
    this.connect();
    this.scheduleStatusTick();
  }

  stop() {
    this.stopped = true;
    this.abortController?.abort();
    this.abortController = null;
    this.reconcilePromise = null;
    this.clearTimers();
    const socket = this.socket;
    this.socket = null;
    socket?.close();
  }

  reconcile(): Promise<void> {
    if (this.reconcilePromise) return this.reconcilePromise;
    const controller = new AbortController();
    this.abortController = controller;
    const pending = this.dependencies.fetchSnapshot(controller.signal)
      .then(snapshot => {
        if (this.stopped || controller.signal.aborted) return;
        this.lastSnapshotAt = this.dependencies.now();
        this.observer.onSnapshot(snapshot);
        this.publishTimestamps();
        this.publishState();
      })
      .catch(error => {
        if (!controller.signal.aborted) this.observer.onMalformed(error);
      })
      .finally(() => {
        if (this.abortController === controller) this.abortController = null;
        if (this.reconcilePromise === pending) this.reconcilePromise = null;
      });
    this.reconcilePromise = pending;
    return pending;
  }

  private connect() {
    if (this.stopped) return;
    this.reconnecting = this.hasOpened || this.reconnectAttempt > 0;
    this.publishState();
    const socket = this.dependencies.createSocket();
    this.socket = socket;
    socket.onopen = () => {
      if (this.stopped || socket !== this.socket) return;
      const recovered = this.hasOpened || this.reconnectAttempt > 0;
      this.hasOpened = true;
      this.socketOpen = true;
      this.reconnecting = false;
      this.reconnectAttempt = 0;
      this.lastEventAt = this.dependencies.now();
      this.clearDisconnectedTimers();
      this.publishTimestamps();
      this.publishState();
      if (recovered) void this.reconcile();
      this.scheduleConnectedReconcile();
    };
    socket.onmessage = event => {
      if (this.stopped || socket !== this.socket) return;
      try {
        const decoded: unknown = JSON.parse(String(event.data));
        const parsed = realtimeEventSchema.safeParse(decoded);
        if (!parsed.success) {
          this.observer.onMalformed(parsed.error);
          return;
        }
        this.lastEventAt = this.dependencies.now();
        this.observer.onEvent(parsed.data);
        this.publishTimestamps();
        this.publishState();
      } catch (error) {
        this.observer.onMalformed(error);
      }
    };
    socket.onerror = () => socket.close();
    socket.onclose = () => {
      if (this.stopped || socket !== this.socket) return;
      this.socketOpen = false;
      this.reconnecting = true;
      this.clearConnectedTimer();
      this.publishState();
      this.scheduleFallbackPolling();
      const attempt = this.reconnectAttempt++;
      this.reconnectTimer = this.dependencies.setTimer(() => this.connect(), reconnectDelayMs(attempt, this.dependencies.random));
    };
  }

  private scheduleConnectedReconcile() {
    this.clearConnectedTimer();
    this.pollingTimer = this.dependencies.setTimer(() => {
      void this.reconcile().finally(() => {
        if (!this.stopped && this.socketOpen) this.scheduleConnectedReconcile();
      });
    }, CONNECTED_RECONCILE_MS);
  }

  private scheduleFallbackPolling() {
    if (this.graceTimer || this.pollingTimer) return;
    this.graceTimer = this.dependencies.setTimer(() => {
      this.graceTimer = null;
      const poll = () => {
        if (this.stopped || this.socketOpen) return;
        void this.reconcile().finally(() => {
          if (!this.stopped && !this.socketOpen) this.pollingTimer = this.dependencies.setTimer(poll, FALLBACK_POLL_MS);
        });
      };
      poll();
    }, DISCONNECTED_GRACE_MS);
  }

  private scheduleStatusTick() {
    this.statusTimer = this.dependencies.setTimer(() => {
      this.publishState();
      if (!this.stopped) this.scheduleStatusTick();
    }, STATUS_TICK_MS);
  }

  private publishState() {
    this.observer.onState(deriveConnectionState({
      socketOpen: this.socketOpen,
      reconnecting: this.reconnecting,
      now: this.dependencies.now(),
      lastEventAt: this.lastEventAt,
      lastSnapshotAt: this.lastSnapshotAt
    }));
  }

  private publishTimestamps() {
    this.observer.onTimestamps({ lastSnapshotAt: this.lastSnapshotAt, lastEventAt: this.lastEventAt });
  }

  private clearConnectedTimer() {
    if (this.pollingTimer) this.dependencies.clearTimer(this.pollingTimer);
    this.pollingTimer = null;
  }

  private clearDisconnectedTimers() {
    if (this.graceTimer) this.dependencies.clearTimer(this.graceTimer);
    if (this.reconnectTimer) this.dependencies.clearTimer(this.reconnectTimer);
    if (this.pollingTimer) this.dependencies.clearTimer(this.pollingTimer);
    this.graceTimer = null;
    this.reconnectTimer = null;
    this.pollingTimer = null;
  }

  private clearTimers() {
    for (const timer of [this.reconnectTimer, this.pollingTimer, this.graceTimer, this.statusTimer]) {
      if (timer) this.dependencies.clearTimer(timer);
    }
    this.reconnectTimer = null;
    this.pollingTimer = null;
    this.graceTimer = null;
    this.statusTimer = null;
  }
}

function websocketUrl(): string {
  const url = new URL('/api/v1/ws', window.location.origin);
  url.protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return url.toString();
}

async function fetchOverlaySnapshot(signal: AbortSignal): Promise<OverlaySnapshot> {
  const [station, history, wreck] = await Promise.all([
    requestApi<StationSnapshot>('/api/v1/station', { cache: 'no-store', signal }, stationSnapshotSchema),
    requestApi<HistoryRecord[]>('/api/v1/history', { cache: 'no-store', signal }, historyRecordSchema.array()),
    requestApi<CurrentWreck>('/api/v1/wrecks/current', { cache: 'no-store', signal }, currentWreckSchema)
  ]);
  return { station, history, wreck };
}

export function useAdaptiveOverlayNetwork() {
  const [station, setStation] = useState<StationSnapshot | null>(null);
  const [wreck, setWreck] = useState<CurrentWreck | null>(null);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [presenceCount, setPresenceCount] = useState(0);
  const [connectionState, setConnectionState] = useState<OverlayConnectionState>('connecting');
  const [timestamps, setTimestamps] = useState<{ lastSnapshotAt: number | null; lastEventAt: number | null }>({ lastSnapshotAt: null, lastEventAt: null });

  const dependencies = useMemo<OverlayNetworkDependencies>(() => ({
    fetchSnapshot: fetchOverlaySnapshot,
    createSocket: () => new WebSocket(websocketUrl()),
    now: () => Date.now(),
    random: () => Math.random(),
    setTimer: (callback, delay) => window.setTimeout(callback, delay),
    clearTimer: handle => window.clearTimeout(handle as number)
  }), []);

  useEffect(() => {
    const controller = new OverlayNetworkController(dependencies, {
      onSnapshot: snapshot => {
        setStation(snapshot.station);
        setHistory(snapshot.history);
        setWreck(snapshot.wreck);
      },
      onEvent: event => {
        if (event.type === 'station.updated') setStation(event.station);
        if (event.type === 'wreck.updated') setWreck(event.wreck);
        if (event.type === 'history.added') setHistory(current => [event.entry, ...current.filter(entry => entry.id !== event.entry.id)].slice(0, 50));
        if (event.type === 'presence.updated') setPresenceCount(event.count);
      },
      onState: setConnectionState,
      onTimestamps: setTimestamps,
      onMalformed: error => console.warn('Overlay network reconciliation failed', { error })
    });
    controller.start();
    return () => controller.stop();
  }, [dependencies]);

  return { station, wreck, history, presenceCount, connectionState, ...timestamps };
}
