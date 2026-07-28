import {
  DataGrid,
  LoadingScreen,
  Panel,
  ResponsiveGrid,
  SectionTitle,
  StatusDisplay,
} from "@neon-wreckers/ui";

export type AdminOverview = {
  service: {
    uptimeSeconds: number;
    startedAt: string;
    node: string;
    loadAverage: number[];
    cpuCount: number;
    memory: { rss: number; heapUsed: number; heapTotal: number };
    disk: { total: number; free: number; used: number } | null;
    sockets: number;
  };
  throughput: {
    lastMinute: MetricWindow;
    lastHour: MetricWindow;
    lastDay: MetricWindow;
    series: Array<{
      minute: string;
      requests: number;
      errors: number;
      bytes: number;
      latencyMs: number;
    }>;
  };
  database: {
    players: number;
    activeExpeditions: number;
    activeEvents: number;
    activeCooldowns: number;
    pendingTransactions: number;
  };
  queue: Record<string, number>;
  timers: Array<{
    id: string;
    name: string;
    playerName: string;
    resolvesAt: string;
  }>;
  cloudSafeZone: {
    machine: string;
    eligibleRegions: string[];
    vmHoursPerMonth: string;
    standardDiskGbMonth: number;
    outboundGbMonth: number;
    estimatedOverage: {
      vmUsdPerHour: number;
      standardDiskUsdPerGbMonth: number;
      premiumEgressUsdPerGbFrom: number;
    };
    disclaimer: string;
  };
};
export type BalanceTelemetry = {
  windowDays: number;
  expeditions: number;
  averageCompletionMinutes: number;
  creditsGenerated: number;
  fleetUtilization: number;
  failureRate: number;
  routes: Record<string, number>;
  shipsByClass: Array<{ classSlug: string; ships: number; averageMasteryXp: number }>;
};

export type MetricWindow = {
  requests: number;
  errors: number;
  bytes: number;
  averageLatencyMs: number;
  requestsPerMinute: number;
};

export function ServerPage({ overview, balanceTelemetry }: { overview: AdminOverview | null; balanceTelemetry: BalanceTelemetry | null }) {
  if (!overview) return <LoadingScreen label="Loading server telemetry" />;
  const memoryPercent = overview.service.memory.heapTotal
    ? (overview.service.memory.heapUsed / overview.service.memory.heapTotal) *
      100
    : 0;
  const diskPercent = overview.service.disk
    ? (overview.service.disk.used / overview.service.disk.total) * 100
    : 0;
  const free = overview.cloudSafeZone;
  return (
    <div className="admin-stack">
      <SectionTitle
        eyebrow="HOST OBSERVABILITY"
        title="Server Load & Throughput"
        description="In-process request telemetry resets when the API restarts. Host values describe the application container."
        icon="diagnostics"
      />
      <ResponsiveGrid min="12rem">
        <StatusDisplay
          label="Requests / minute"
          value={overview.throughput.lastMinute.requestsPerMinute}
          icon="network"
          tone="info"
        />
        <StatusDisplay
          label="Average latency"
          value={overview.throughput.lastHour.averageLatencyMs}
          unit=" ms"
          icon="diagnostics"
          tone={
            overview.throughput.lastHour.averageLatencyMs > 500
              ? "warning"
              : "success"
          }
        />
        <StatusDisplay
          label="Server errors / hour"
          value={overview.throughput.lastHour.errors}
          icon="danger"
          tone={overview.throughput.lastHour.errors ? "danger" : "success"}
        />
        <StatusDisplay
          label="Live sockets"
          value={overview.service.sockets}
          icon="network"
          tone="purple"
        />
        <StatusDisplay
          label="Players"
          value={overview.database.players}
          icon="crew"
          tone="info"
        />
        <StatusDisplay
          label="Queue backlog"
          value={(overview.queue.waiting ?? 0) + (overview.queue.delayed ?? 0)}
          icon="events"
          tone="warning"
        />
      </ResponsiveGrid>
      <ResponsiveGrid min="20rem">
        <Panel>
          <SectionTitle
            eyebrow="RESOURCE LOAD"
            title="Process & Disk"
            icon="terminal"
          />
          <div className="admin-meter">
            <span>Heap memory</span>
            <strong>
              {formatBytes(overview.service.memory.heapUsed)} /{" "}
              {formatBytes(overview.service.memory.heapTotal)} (
              {memoryPercent.toFixed(1)}%)
            </strong>
          </div>
          <div className="admin-meter">
            <span>Container disk</span>
            <strong>
              {overview.service.disk
                ? `${formatBytes(overview.service.disk.used)} / ${formatBytes(overview.service.disk.total)} (${diskPercent.toFixed(1)}%)`
                : "Unavailable"}
            </strong>
          </div>
          <div className="admin-meter">
            <span>Load average 1 / 5 / 15m</span>
            <strong>
              {overview.service.loadAverage
                .map((value) => value.toFixed(2))
                .join(" / ")}{" "}
              across {overview.service.cpuCount} visible CPUs
            </strong>
          </div>
          <div className="admin-meter">
            <span>API uptime</span>
            <strong>{formatDuration(overview.service.uptimeSeconds)}</strong>
          </div>
        </Panel>
        <Panel>
          <SectionTitle
            eyebrow="WORKLOAD"
            title="Database & Queue"
            icon="data"
          />
          <DataGrid
            rows={[
              ...Object.entries(overview.database),
              ...Object.entries(overview.queue),
            ].map(([key, value]) => ({ key, value }))}
            getRowKey={(row) => row.key}
            columns={[
              { key: "signal", header: "Signal", render: (row) => row.key },
              {
                key: "value",
                header: "Value",
                align: "right",
                render: (row) => (
                  <span className="nw-numeric">{row.value}</span>
                ),
              },
            ]}
          />
        </Panel>
      </ResponsiveGrid>
      {balanceTelemetry && (
        <Panel tone="purple">
          <SectionTitle
            eyebrow={`${balanceTelemetry.windowDays}-DAY GAMEPLAY WINDOW`}
            title="Fleet Balance Telemetry"
            description="Completion speed, generated expedition income, utilization, failure rates, route selection, and mastery by ship class."
            icon="diagnostics"
          />
          <ResponsiveGrid min="12rem">
            <StatusDisplay label="Expeditions" value={balanceTelemetry.expeditions} icon="expedition" tone="info" />
            <StatusDisplay label="Average duration" value={balanceTelemetry.averageCompletionMinutes} unit=" min" icon="events" tone="purple" />
            <StatusDisplay label="Credits generated" value={balanceTelemetry.creditsGenerated} icon="credits" tone="success" />
            <StatusDisplay label="Fleet utilization" value={Math.round(balanceTelemetry.fleetUtilization * 100)} unit="%" icon="expedition" tone="info" />
            <StatusDisplay label="Failure rate" value={Math.round(balanceTelemetry.failureRate * 100)} unit="%" icon="danger" tone={balanceTelemetry.failureRate > .35 ? "warning" : "success"} />
          </ResponsiveGrid>
          <DataGrid
            rows={balanceTelemetry.shipsByClass}
            getRowKey={row => row.classSlug}
            empty="No fleet records in this window."
            columns={[
              { key: "class", header: "Ship class", render: row => row.classSlug },
              { key: "ships", header: "Registered", align: "right", render: row => row.ships },
              { key: "mastery", header: "Average mastery XP", align: "right", render: row => row.averageMasteryXp },
            ]}
          />
        </Panel>
      )}
      <Panel tone="info">
        <SectionTitle
          eyebrow="GOOGLE CLOUD SAFE ZONE"
          title="Compute Engine Free Tier Guardrail"
          icon="credits"
        />
        <p>
          Configured reference: one non-preemptible{" "}
          <strong>{free.machine}</strong> for the month in{" "}
          {free.eligibleRegions.join(", ")}, {free.standardDiskGbMonth} GB-month
          standard persistent disk, and {free.outboundGbMonth} GB/month eligible
          outbound transfer.
        </p>
        <ResponsiveGrid min="14rem">
          <StatusDisplay
            label="VM overage estimate"
            value={`$${free.estimatedOverage.vmUsdPerHour.toFixed(2)}`}
            unit=" / hour"
            icon="credits"
            tone="warning"
          />
          <StatusDisplay
            label="Disk beyond 30 GB"
            value={`$${free.estimatedOverage.standardDiskUsdPerGbMonth.toFixed(2)}`}
            unit=" / GB-month"
            icon="storage"
            tone="warning"
          />
          <StatusDisplay
            label="Premium egress estimate"
            value={`$${free.estimatedOverage.premiumEgressUsdPerGbFrom.toFixed(2)}+`}
            unit=" / GB"
            icon="network"
            tone="warning"
          />
        </ResponsiveGrid>
        <p className="admin-fineprint">
          A full extra month at the displayed starting VM rate is roughly $
          {(free.estimatedOverage.vmUsdPerHour * 730).toLocaleString(
            undefined,
            { style: "currency", currency: "USD" },
          )}
          , before storage and network. {free.disclaimer}
        </p>
      </Panel>
    </div>
  );
}

export function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(
    units.length - 1,
    Math.floor(Math.log(bytes) / Math.log(1024)),
  );
  return `${(bytes / 1024 ** index).toFixed(index > 1 ? 1 : 0)} ${units[index]}`;
}
export function formatDuration(seconds: number) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${days}d ${hours}h ${minutes}m`;
}
