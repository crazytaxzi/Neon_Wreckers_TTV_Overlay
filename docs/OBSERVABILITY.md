# Observability

The API exposes Prometheus text exposition at `/internal/metrics`. The production gateway does not publish this path, so operators should scrape it only from the internal container network or through an authenticated monitoring sidecar.

## Health semantics

- `/health` reports process liveness only. It does not contact PostgreSQL or Redis.
- `/ready` checks PostgreSQL and BullMQ/Redis separately, returns dependency status, and responds with HTTP 503 when either dependency is unavailable.

## Metric catalog

HTTP metrics use only method, normalized Fastify route templates, and status class. They never include player IDs, request IDs, raw URLs, wreck IDs, expedition IDs, arbitrary error text, or integration response bodies.

- `neon_wreckers_process_uptime_seconds`
- `neon_wreckers_http_active_requests`
- `neon_wreckers_http_requests_total{method,route,status_class}`
- `neon_wreckers_http_request_errors_total{method,route,status_class}`
- `neon_wreckers_http_request_duration_seconds{method,route,status_class}`
- `neon_wreckers_websocket_connections`
- `neon_wreckers_websocket_connections_opened_total`
- `neon_wreckers_websocket_disconnects_total`
- `neon_wreckers_realtime_malformed_packets_total`
- `neon_wreckers_bullmq_waiting_jobs`
- `neon_wreckers_bullmq_active_jobs`
- `neon_wreckers_bullmq_delayed_jobs`
- `neon_wreckers_bullmq_failed_jobs`
- `neon_wreckers_bullmq_jobs_retried_total`
- `neon_wreckers_bullmq_jobs_failed_total`
- `neon_wreckers_database_query_failures_total`
- `neon_wreckers_integration_requests_total`
- `neon_wreckers_integration_errors_total`
- `neon_wreckers_expedition_launches_total`
- `neon_wreckers_expedition_resolutions_total`
- `neon_wreckers_expedition_claims_total`
- `neon_wreckers_expedition_duplicate_claims_prevented_total`

Counters without labels are deliberately coarse. The fixed metric-name allowlist prevents accidental high-cardinality series while still exposing operational trends and gameplay invariants.

## Correlation

Every HTTP request receives a validated or generated `x-request-id`. Structured logs include `requestId`, normalized route, method, and dependency name where relevant. Worker logs may include a BullMQ job ID for correlation, but job IDs and user identities never become metric labels.

## Recommended dashboards

1. Request rate, 5xx rate, p50/p95/p99 latency, and active requests by normalized route.
2. WebSocket connection count, connection churn, and malformed realtime packets.
3. BullMQ waiting, active, delayed, and failed depth plus retry and failure rates.
4. PostgreSQL readiness and query-failure trend.
5. Twitch and StreamElements request/error ratios once those integrations are configured.
6. Expedition launch, resolution, claim, and duplicate-claim-prevention rates.

## Recommended alerts

- readiness failing for more than 2 minutes
- HTTP 5xx ratio above 5 percent for 5 minutes
- p95 request latency above 1 second for 10 minutes
- failed BullMQ jobs increasing for 5 minutes
- delayed or waiting queue depth continuously rising for 10 minutes
- malformed realtime packets above zero after a deployment
- repeated PostgreSQL readiness failures
- WebSocket disconnect rate sharply above the established baseline
- integration error ratio above 10 percent for 10 minutes
- expedition resolutions without claims beyond an operator-defined gameplay window

Thresholds are starting recommendations and must be tuned against production traffic. External Twitch and StreamElements verification requires real configured services. Source-level instrumentation does not claim those integrations were exercised in production.
