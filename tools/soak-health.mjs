const baseUrl = process.env.SOAK_BASE_URL;
const durationSeconds = Math.max(10, Math.min(86_400, Number(process.env.SOAK_DURATION_SECONDS ?? 60)));
const intervalMs = Math.max(250, Math.min(10_000, Number(process.env.SOAK_INTERVAL_MS ?? 1_000)));

if (!baseUrl || !/^https?:\/\//.test(baseUrl)) {
  throw new Error('SOAK_BASE_URL must be an absolute HTTP(S) URL.');
}

const startedAt = Date.now();
let requests = 0;
let failures = 0;
let maxLatencyMs = 0;

while (Date.now() - startedAt < durationSeconds * 1_000) {
  for (const path of ['/health', '/ready']) {
    const requestStarted = performance.now();
    try {
      const response = await fetch(new URL(path, baseUrl), { signal: AbortSignal.timeout(10_000) });
      if (!response.ok) failures += 1;
      await response.arrayBuffer();
    } catch {
      failures += 1;
    }
    requests += 1;
    maxLatencyMs = Math.max(maxLatencyMs, performance.now() - requestStarted);
  }
  await new Promise(resolve => setTimeout(resolve, intervalMs));
}

const result = { durationSeconds, requests, failures, maxLatencyMs: Math.round(maxLatencyMs) };
process.stdout.write(`${JSON.stringify(result)}\n`);
if (failures) process.exitCode = 1;
