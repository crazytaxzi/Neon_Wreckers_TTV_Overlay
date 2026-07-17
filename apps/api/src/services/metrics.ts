export class RequestMetrics {
  readonly startedAt = new Date();
  private buckets = new Map<number, { requests: number; errors: number; bytes: number; latencyMs: number }>();

  record(statusCode: number, latencyMs: number, bytes: number) {
    const minute = Math.floor(Date.now() / 60_000);
    const bucket = this.buckets.get(minute) ?? { requests: 0, errors: 0, bytes: 0, latencyMs: 0 };
    bucket.requests += 1;
    bucket.errors += statusCode >= 500 ? 1 : 0;
    bucket.bytes += Math.max(0, bytes);
    bucket.latencyMs += Math.max(0, latencyMs);
    this.buckets.set(minute, bucket);
    for (const key of this.buckets.keys()) if (key < minute - 1440) this.buckets.delete(key);
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
}
