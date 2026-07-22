type RequestSeries = { requests: number; errors: number; bytes: number; latencyMs: number };
type RouteSeries = { count: number; errors: number; durationSeconds: number; buckets: number[] };

const latencyBuckets = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10] as const;
const allowedCounterNames = new Set([
  'websocket_connections_opened_total',
  'websocket_disconnects_total',
  'realtime_malformed_packets_total',
  'expedition_launches_total',
  'expedition_resolutions_total',
  'expedition_claims_total',
  'expedition_duplicate_claims_prevented_total',
  'database_query_failures_total',
  'integration_requests_total',
  'integration_errors_total',
  'bullmq_jobs_retried_total',
  'bullmq_jobs_failed_total'
]);

function escapeLabel(value: string) {
  return value.replaceAll('\\', '\\\\').replaceAll('"', '\\"').replaceAll('\n', '\\n');
}

function routeKey(method: string, route: string, statusClass: string) {
  return `${method}\u0000${route}\u0000${statusClass}`;
}

export class RequestMetrics {
  readonly startedAt = new Date();
  private activeRequests = 0;
  private buckets = new Map<number, RequestSeries>();
  private routes = new Map<string, RouteSeries>();
  private counters = new Map<string, number>();
  private gauges = new Map<string, number>();

  begin() { this.activeRequests += 1; }

  increment(name: string, amount = 1) {
    if (!allowedCounterNames.has(name)) throw new Error(`Unsupported metric counter: ${name}`);
    this.counters.set(name, (this.counters.get(name) ?? 0) + Math.max(0, amount));
  }

  setGauge(name: 'websocket_connections' | 'bullmq_waiting_jobs' | 'bullmq_active_jobs' | 'bullmq_delayed_jobs' | 'bullmq_failed_jobs', value: number) {
    this.gauges.set(name, Math.max(0, value));
  }

  record(method: string, route: string, statusCode: number, latencyMs: number, bytes: number) {
    this.activeRequests = Math.max(0, this.activeRequests - 1);
    const minute = Math.floor(Date.now() / 60_000);
    const bucket = this.buckets.get(minute) ?? { requests: 0, errors: 0, bytes: 0, latencyMs: 0 };
    bucket.requests += 1;
    bucket.errors += statusCode >= 500 ? 1 : 0;
    bucket.bytes += Math.max(0, bytes);
    bucket.latencyMs += Math.max(0, latencyMs);
    this.buckets.set(minute, bucket);
    for (const key of this.buckets.keys()) if (key < minute - 1440) this.buckets.delete(key);

    const durationSeconds = Math.max(0, latencyMs) / 1000;
    const statusClass = `${Math.floor(statusCode / 100)}xx`;
    const key = routeKey(method, route, statusClass);
    const series = this.routes.get(key) ?? { count: 0, errors: 0, durationSeconds: 0, buckets: latencyBuckets.map(() => 0) };
    series.count += 1;
    series.errors += statusCode >= 500 ? 1 : 0;
    series.durationSeconds += durationSeconds;
    latencyBuckets.forEach((upperBound, index) => { if (durationSeconds <= upperBound) series.buckets[index] += 1; });
    this.routes.set(key, series);
  }

  snapshot() {
    const minute = Math.floor(Date.now() / 60_000);
    const sum = (minutes: number) => {
      const values = [...this.buckets].filter(([key]) => key > minute - minutes).map(([, value]) => value);
      const requests = values.reduce((total, value) => total + value.requests, 0);
      return { requests, errors: values.reduce((total, value) => total + value.errors, 0), bytes: values.reduce((total, value) => total + value.bytes, 0), averageLatencyMs: requests ? Math.round(values.reduce((total, value) => total + value.latencyMs, 0) / requests) : 0, requestsPerMinute: Number((requests / minutes).toFixed(2)) };
    };
    return { lastMinute: sum(1), lastHour: sum(60), lastDay: sum(1440), series: [...this.buckets].filter(([key]) => key > minute - 60).map(([key, value]) => ({ minute: new Date(key * 60_000).toISOString(), ...value })).sort((a, b) => a.minute.localeCompare(b.minute)) };
  }

  prometheus() {
    const lines = [
      '# HELP neon_wreckers_process_uptime_seconds Process uptime in seconds.',
      '# TYPE neon_wreckers_process_uptime_seconds gauge',
      `neon_wreckers_process_uptime_seconds ${Math.max(0, (Date.now() - this.startedAt.getTime()) / 1000)}`,
      '# HELP neon_wreckers_http_active_requests Active HTTP requests.',
      '# TYPE neon_wreckers_http_active_requests gauge',
      `neon_wreckers_http_active_requests ${this.activeRequests}`,
      '# HELP neon_wreckers_http_requests_total Completed HTTP requests.',
      '# TYPE neon_wreckers_http_requests_total counter',
      '# HELP neon_wreckers_http_request_errors_total Completed HTTP requests with 5xx status.',
      '# TYPE neon_wreckers_http_request_errors_total counter',
      '# HELP neon_wreckers_http_request_duration_seconds HTTP request duration.',
      '# TYPE neon_wreckers_http_request_duration_seconds histogram'
    ];
    for (const [key, series] of [...this.routes].sort(([left], [right]) => left.localeCompare(right))) {
      const [method, route, statusClass] = key.split('\u0000');
      const labels = `method="${escapeLabel(method)}",route="${escapeLabel(route)}",status_class="${statusClass}"`;
      lines.push(`neon_wreckers_http_requests_total{${labels}} ${series.count}`);
      lines.push(`neon_wreckers_http_request_errors_total{${labels}} ${series.errors}`);
      latencyBuckets.forEach((upperBound, index) => lines.push(`neon_wreckers_http_request_duration_seconds_bucket{${labels},le="${upperBound}"} ${series.buckets[index]}`));
      lines.push(`neon_wreckers_http_request_duration_seconds_bucket{${labels},le="+Inf"} ${series.count}`);
      lines.push(`neon_wreckers_http_request_duration_seconds_sum{${labels}} ${series.durationSeconds}`);
      lines.push(`neon_wreckers_http_request_duration_seconds_count{${labels}} ${series.count}`);
    }
    for (const [name, value] of [...this.counters].sort()) {
      lines.push(`# TYPE neon_wreckers_${name} counter`, `neon_wreckers_${name} ${value}`);
    }
    for (const [name, value] of [...this.gauges].sort()) {
      lines.push(`# TYPE neon_wreckers_${name} gauge`, `neon_wreckers_${name} ${value}`);
    }
    return `${lines.join('\n')}\n`;
  }
}
