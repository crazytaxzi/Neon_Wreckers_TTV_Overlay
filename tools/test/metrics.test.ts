import assert from 'node:assert/strict';
import test from 'node:test';
import { RequestMetrics } from '../../apps/api/src/services/metrics.js';

test('request metrics expose normalized bounded labels and histograms', () => {
  const metrics = new RequestMetrics();
  metrics.begin();
  metrics.record('GET', '/api/v1/station/:id', 200, 25, 128);
  const output = metrics.prometheus();
  assert.match(output, /neon_wreckers_http_active_requests 0/);
  assert.match(output, /method="GET",route="\/api\/v1\/station\/:id",status_class="2xx"/);
  assert.match(output, /neon_wreckers_http_request_duration_seconds_bucket/);
  assert.doesNotMatch(output, /player-|request-id|wreck-/i);
});

test('operational counters and queue gauges reject arbitrary cardinality', () => {
  const metrics = new RequestMetrics();
  metrics.increment('realtime_malformed_packets_total');
  metrics.setGauge('bullmq_waiting_jobs', 3);
  assert.throws(() => metrics.increment('player_123_actions_total'), /Unsupported metric counter/);
  const output = metrics.prometheus();
  assert.match(output, /neon_wreckers_realtime_malformed_packets_total 1/);
  assert.match(output, /neon_wreckers_bullmq_waiting_jobs 3/);
});
