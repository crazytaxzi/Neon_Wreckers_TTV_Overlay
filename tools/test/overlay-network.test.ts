import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CONNECTED_RECONCILE_MS,
  DISCONNECTED_GRACE_MS,
  FALLBACK_POLL_MS,
  OverlayNetworkController,
  deriveConnectionState,
  reconnectDelayMs,
  type OverlayNetworkDependencies,
  type OverlayNetworkObserver,
  type OverlaySnapshot
} from '../../apps/overlay/src/network.ts';

class FakeClock {
  now = 1_000;
  private nextId = 1;
  private timers = new Map<number, { at: number; callback: () => void }>();

  setTimer = (callback: () => void, delay: number) => {
    const id = this.nextId++;
    this.timers.set(id, { at: this.now + delay, callback });
    return id as ReturnType<typeof setTimeout>;
  };

  clearTimer = (handle: ReturnType<typeof setTimeout>) => {
    this.timers.delete(handle as unknown as number);
  };

  async advance(ms: number) {
    const target = this.now + ms;
    while (true) {
      const next = [...this.timers.entries()].sort((a, b) => a[1].at - b[1].at)[0];
      if (!next || next[1].at > target) break;
      this.now = next[1].at;
      this.timers.delete(next[0]);
      next[1].callback();
      await Promise.resolve();
      await Promise.resolve();
    }
    this.now = target;
    await Promise.resolve();
  }

  get pending() {
    return this.timers.size;
  }
}

class FakeSocket {
  readyState = 0;
  OPEN = 1;
  closed = false;
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onmessage: ((event: { data: unknown }) => void) | null = null;

  open() {
    this.readyState = this.OPEN;
    this.onopen?.();
  }

  message(payload: unknown) {
    this.onmessage?.({ data: JSON.stringify(payload) });
  }

  disconnect() {
    this.readyState = 3;
    this.onclose?.();
  }

  close() {
    this.closed = true;
    this.readyState = 3;
  }
}

const snapshot: OverlaySnapshot = {
  station: {
    id: 'station-1', slug: 'station-zero', name: 'Station Zero', level: 1,
    population: 1, power: 100, morale: 100, integrity: 100,
    storageCapacity: 100, storageUsed: 0, threatLevel: 'low', activeSeason: null,
    resources: {}, museum: { collection: [], donatedToday: 0, dailyCapacity: 0 },
    modules: [], alerts: [], activeModifiers: []
  },
  history: [],
  wreck: {
    id: 'wreck-1', archetype: 'test', name: 'Test Wreck', description: 'Test', risk: 'low',
    integrity: 100, depleted: false, visualKey: 'wreck-test', remainingLootBudget: 1,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    salvageProfile: {
      cutters: { successChance: 1, scrapRange: [1, 1], electronicsChance: 0, fuelChance: 0, relicChance: 0, wreckLootRolls: 0, wreckLootChancePerRoll: 0, wreckLootPool: [] },
      cargo: { successChance: 1, scrapRange: [1, 1], electronicsChance: 0, fuelChance: 0, relicChance: 0, wreckLootRolls: 0, wreckLootChancePerRoll: 0, wreckLootPool: [] }
    }
  }
};

function harness() {
  const clock = new FakeClock();
  const sockets: FakeSocket[] = [];
  let fetches = 0;
  let activeFetches = 0;
  let maxActiveFetches = 0;
  const states: string[] = [];
  const events: unknown[] = [];
  const dependencies: OverlayNetworkDependencies = {
    fetchSnapshot: async () => {
      fetches += 1;
      activeFetches += 1;
      maxActiveFetches = Math.max(maxActiveFetches, activeFetches);
      await Promise.resolve();
      activeFetches -= 1;
      return snapshot;
    },
    createSocket: () => {
      const socket = new FakeSocket();
      sockets.push(socket);
      return socket;
    },
    now: () => clock.now,
    random: () => 0.5,
    setTimer: clock.setTimer,
    clearTimer: clock.clearTimer
  };
  const observer: OverlayNetworkObserver = {
    onSnapshot: () => undefined,
    onEvent: event => events.push(event),
    onState: state => states.push(state),
    onTimestamps: () => undefined,
    onMalformed: error => { throw error; }
  };
  const controller = new OverlayNetworkController(dependencies, observer);
  return { clock, sockets, controller, states, events, get fetches() { return fetches; }, get maxActiveFetches() { return maxActiveFetches; } };
}

test('reconnect delay uses bounded exponential backoff with jitter', () => {
  assert.equal(reconnectDelayMs(0, () => 0), 1125);
  assert.equal(reconnectDelayMs(0, () => 1), 1875);
  assert.equal(reconnectDelayMs(20, () => 0.5), 30000);
});

test('connection states distinguish live, stale, reconnecting, and offline', () => {
  assert.equal(deriveConnectionState({ socketOpen: true, reconnecting: false, now: 10, lastEventAt: 10, lastSnapshotAt: 10 }), 'live');
  assert.equal(deriveConnectionState({ socketOpen: true, reconnecting: false, now: 50_001, lastEventAt: 1, lastSnapshotAt: 1 }), 'stale');
  assert.equal(deriveConnectionState({ socketOpen: false, reconnecting: true, now: 10, lastEventAt: null, lastSnapshotAt: 1 }), 'reconnecting');
  assert.equal(deriveConnectionState({ socketOpen: false, reconnecting: true, now: 70_001, lastEventAt: null, lastSnapshotAt: 1 }), 'offline');
});

test('healthy socket performs one initial snapshot and slow reconciliation only', async () => {
  const h = harness();
  h.controller.start();
  await h.clock.advance(0);
  assert.equal(h.fetches, 1);
  h.sockets[0].open();
  await h.clock.advance(CONNECTED_RECONCILE_MS - 1);
  assert.equal(h.fetches, 1);
  await h.clock.advance(1);
  assert.equal(h.fetches, 2);
  assert.equal(h.maxActiveFetches, 1);
  h.controller.stop();
});

test('disconnect waits for grace, polls faster, and reconciles immediately after reconnect', async () => {
  const h = harness();
  h.controller.start();
  await h.clock.advance(0);
  h.sockets[0].open();
  h.sockets[0].disconnect();
  await h.clock.advance(DISCONNECTED_GRACE_MS - 1);
  assert.equal(h.fetches, 1);
  await h.clock.advance(1);
  assert.equal(h.fetches, 2);
  await h.clock.advance(FALLBACK_POLL_MS);
  assert.equal(h.fetches, 3);
  await h.clock.advance(reconnectDelayMs(0, () => 0.5));
  assert.equal(h.sockets.length, 2);
  h.sockets[1].open();
  await h.clock.advance(0);
  assert.equal(h.fetches, 4);
  assert.ok(h.states.includes('reconnecting'));
  assert.ok(h.states.includes('live'));
  h.controller.stop();
});

test('validated realtime events are delivered and cleanup closes sockets and timers', async () => {
  const h = harness();
  h.controller.start();
  await h.clock.advance(0);
  h.sockets[0].open();
  h.sockets[0].message({ type: 'presence.updated', count: 3 });
  assert.equal((h.events[0] as { type: string }).type, 'presence.updated');
  h.controller.stop();
  assert.equal(h.sockets[0].closed, true);
  assert.equal(h.clock.pending, 0);
});
