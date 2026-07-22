# Observability

The API exposes Prometheus text exposition at `/internal/metrics`. The production gateway does not publish this path, so operators should scrape it only from the internal container network or through an authenticated monitoring sidecar.

## Health semantics

- `/health` reports process liveness only. It does not contact PostgreSQL or Redis.
- `/ready` checks PostgreSQL and BullMQ/Redis separately, returns dependency status, and responds with HTTP 503 when either dependency is unavailable.

## Metric catalog

HTTP metrics use only method, normalized Fastify route templates, and status class. They never include player IDs, request IDs, raw URLs, wreck IDs, or error messages.

- `neon_wreckers_process_uptime_seconds`
- `neon_wreckers_http_active_requests`
- `neon_wreckers_http_requests_total`
- `neon_wreckers_http_request_errors_total`
- `neon_wreckers_http_request_duration_seconds`
- `neon_wreckers_websocket_connections`
- `neon_wreckers_websocket_connections_opened_total`
- `neon_wreckers_websocket_disconnects_total`
- `neon_wreckers_realtime_malformed_packets_total`
- `neon_wreckers_bullmq_waiting_jobs`
- `neon_wreckers_bullmq_active_jobs`
- `neon_wreckers_bullmq_delayed_jobs`
- `neon_wreckers_bullmq_failed_jobs`
- `neon_wreckers_database_query_failures_total`

Reserved bounded counters also exist for expedition lifecycle, duplicate-claim prevention, queue retries/failures, and Twitch or StreamElements request outcomes. Producers must use fixed metric names and must not add identity-bearing labels.

## Correlation

Every HTTP request receives a validated or generated `x-request-id`. Structured logs include `requestId`, normalized route, method, and dependency name where relevant. Raw credentials, player IDs, and arbitrary error text are not metric labels.

## Recommended alerts

- readiness failing for more than 2 minutes
- HTTP 5xx ratio above 5 percent for 5 minutes
- p95 request latency above 1 second for 10 minutes
- failed BullMQ jobs increasing for 5 minutes
- delayed queue depth continuously rising for 10 minutes
- malformed realtime packets above zero after a deployment
- repeated PostgreSQL readiness failures
- WebSocket disconnect rate sharply above the established baseline

External Twitch and StreamElements verification requires real configured services. Source-level instrumentation does not claim those integrations were exercised in production.
