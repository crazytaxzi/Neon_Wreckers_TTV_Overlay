import assert from 'node:assert/strict';
import test from 'node:test';
import { RealtimeHub, PlayerRealtimeHub } from '../../apps/api/src/lib/realtime.js';
import { RequestMetrics } from '../../apps/api/src/services/metrics.js';

class FakeSocket {
  readonly OPEN = 1;
  readyState = this.OPEN;
  sent: string[] = [];
  private listeners = new Map<'close' | 'error', () => void>();

  send(payload: string) { this.sent.push(payload); }
  on(event: 'close' | 'error', listener: () => void) { this.listeners.set(event, listener); }
  emit(event: 'close' | 'error') { this.listeners.get(event)?.(); }
}

test('Prometheus output uses normalized route labels and bounded dimensions', () => {
  const metrics = new RequestMetrics();
  metrics.begin();
  metrics.record('GET', '/api/v1/expeditions/:id', 200, 125, 512);
  const output = metrics.prometheus();

  assert.match(output, /neon_wreckers_http_requests_total\{method="GET",route="\/api\/v1\/expeditions\/:id",status_class="2xx"\} 1/);
  assert.match(output, /neon_wreckers_http_request_duration_seconds_bucket/);
  assert.doesNotMatch(output, /playerId|requestId|wreckId|actual-expedition-id/);
});

test('active requests are decremented after completion', () => {
  const metrics = new RequestMetrics();
  metrics.begin();
  assert.match(metrics.prometheus(), /neon_wreckers_http_active_requests 1/);
  metrics.record('POST', '/api/v1/salvage', 503, 20, 0);
  assert.match(metrics.prometheus(), /neon_wreckers_http_active_requests 0/);
  assert.match(metrics.prometheus(), /neon_wreckers_http_request_errors_total\{[^}]+\} 1/);
});

test('realtime hubs count connections, disconnects, and malformed packets without identity labels', () => {
  const metrics = new RequestMetrics();
  const publicHub = new RealtimeHub(metrics);
  const playerHub = new PlayerRealtimeHub(metrics);
  const publicSocket = new FakeSocket();
  const playerSocket = new FakeSocket();

  publicHub.add(publicSocket);
  playerHub.add('private-player-id', playerSocket);
  assert.equal(publicHub.connectionCount, 1);
  assert.equal(playerHub.connectionCount, 1);

  assert.equal(publicHub.broadcast({ type: 'invalid.event', playerId: 'private-player-id' }), false);
  publicHub.remove(publicSocket);
  playerHub.remove('private-player-id', playerSocket);

  const output = metrics.prometheus();
  assert.match(output, /neon_wreckers_websocket_connections_opened_total 2/);
  assert.match(output, /neon_wreckers_websocket_disconnects_total 2/);
  assert.match(output, /neon_wreckers_realtime_malformed_packets_total 1/);
  assert.doesNotMatch(output, /private-player-id/);
});

test('queue gauges and counters reject arbitrary metric names', () => {
  const metrics = new RequestMetrics();
  metrics.setGauge('bullmq_waiting_jobs', 7);
  metrics.increment('bullmq_jobs_failed_total', 2);
  assert.match(metrics.prometheus(), /neon_wreckers_bullmq_waiting_jobs 7/);
  assert.match(metrics.prometheus(), /neon_wreckers_bullmq_jobs_failed_total 2/);
  assert.throws(() => metrics.increment('player_private_metric'), /Unsupported metric counter/);
});
