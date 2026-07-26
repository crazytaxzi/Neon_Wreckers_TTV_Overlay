import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { createRoot } from "react-dom/client";
import { errorMessage, requestApi } from "@neon-wreckers/browser-client";
import {
  AppShell,
  Badge,
  Button,
  CommandHeader,
  CommandNavigation,
  ComponentShowcase,
  ConfirmWindow,
  DataGrid,
  Field,
  Input,
  LoadingScreen,
  Modal,
  Notification,
  NWIcon,
  Panel,
  ProfileChip,
  ResponsiveGrid,
  SectionTitle,
  Select,
  StatusDisplay,
  Textarea,
  ThemeProvider,
  ToastProvider,
  defaultTheme,
  type TabItem,
  useToast,
} from "@neon-wreckers/ui";
import "./admin.css";

type CurrentUser = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  roles: string[];
};

type StationSummary = {
  name: string;
  population: number;
  power: number;
  integrity: number;
};

type StreamElementsConnection = {
  id: string;
  channelId: string;
  provider: string;
  providerId: string | null;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  authType: "jwt" | "oauth2";
  scopes: string[];
  expiresAt: string | null;
  isActive: boolean;
  pointsEnabled: boolean;
  lastVerifiedAt: string | null;
  lastError: string | null;
  updatedAt: string;
  matchesStreamer: boolean;
};

type StreamElementsStatus = {
  ok: boolean;
  detail: string;
  configured: boolean;
  oauthConfigured: boolean;
  oauthScopes: string[];
  legacyAvailable: boolean;
  pointsKillSwitchEnabled: boolean;
  activeConnectionId: string | null;
  connections: StreamElementsConnection[];
  identity?: {
    channelId: string;
    provider: string;
    providerId: string | null;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
};

type ChatCommandAction =
  | { type: "scan" }
  | { type: "salvage"; mode: "cutters" | "cargo" }
  | { type: "point_action"; slug: "rush_scan" | "safety_override" };

type ChatCommand = {
  id: string;
  trigger: string;
  description: string;
  enabled: boolean;
  requiresPlayer: boolean;
  action: ChatCommandAction;
  updatedAt: string | null;
  source: "default" | "configured";
};

type ConfigVersion = {
  id: string;
  slug: string;
  version: number;
  lifecycle: string;
  createdAt: string;
};

type LiveOpsDashboard = {
  generatedAt: string;
  economy: { players: number; totalCredits: number; averageCredits: number; averageLevel: number; seasonalTokens: number; marketTransactions30d: number; marketCredits30d: number; marketUnits30d: number };
  warnings: Array<{ severity: string; code: string; message: string }>;
  schedule: Array<{ id: string; slug: string; version: number; lifecycle: string; scheduledAt: string | null; expiresAt: string | null }>;
  events: Array<{ id: string; slug: string; status: string; startsAt: string; endsAt: string | null }>;
  releaseEvidence: Array<{ id: string; action: string; target: string; requestId: string | null; createdAt: string }>;
};

type AdminOverview = {
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
type BalanceTelemetry = {
  windowDays: number;
  expeditions: number;
  averageCompletionMinutes: number;
  creditsGenerated: number;
  fleetUtilization: number;
  failureRate: number;
  routes: Record<string, number>;
  shipsByClass: Array<{ classSlug: string; ships: number; averageMasteryXp: number }>;
};

type MetricWindow = {
  requests: number;
  errors: number;
  bytes: number;
  averageLatencyMs: number;
  requestsPerMinute: number;
};

type AdminPlayer = {
  id: string;
  displayName: string;
  twitchLogin: string;
  credits: number;
  xp: number;
  level: number;
  reputation: number;
  bannedUntil: string | null;
  cooldowns: Array<{ id: string; actionKey: string; expiresAt: string }>;
};

type LoyaltyTransaction = {
  id: string;
  amount: number;
  actionSlug: string;
  status: string;
  createdAt: string;
  error: string | null;
  user: { displayName: string; twitchLogin: string };
};

type PushToast = ReturnType<typeof useToast>["pushToast"];

const navigation: TabItem[] = [
  { id: "operations", label: "Operations", icon: "station" },
  { id: "integrations", label: "Integrations", icon: "network" },
  { id: "commands", label: "Commands", icon: "terminal" },
  { id: "server", label: "Server", icon: "diagnostics" },
  { id: "timers", label: "Timers", icon: "events" },
  { id: "players", label: "Players", icon: "crew" },
  { id: "transactions", label: "Refunds", icon: "credits" },
  { id: "config", label: "Config", icon: "data" },
  { id: "interface", label: "UI Library", icon: "diagnostics" },
];

function Root() {
  return (
    <ThemeProvider theme={defaultTheme}>
      <ToastProvider>
        <AdminApp />
      </ToastProvider>
    </ThemeProvider>
  );
}

function AdminApp() {
  const [tab, setTab] = useState("operations");
  const [me, setMe] = useState<CurrentUser | null>();
  const [config, setConfig] = useState<ConfigVersion[]>([]);
  const [streamElements, setStreamElements] =
    useState<StreamElementsStatus | null>(null);
  const [commands, setCommands] = useState<ChatCommand[]>([]);
  const [station, setStation] = useState<StationSummary | null>(null);
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [balanceTelemetry, setBalanceTelemetry] = useState<BalanceTelemetry | null>(null);
  const [liveOps, setLiveOps] = useState<LiveOpsDashboard | null>(null);
  const [players, setPlayers] = useState<AdminPlayer[]>([]);
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [confirmSpawn, setConfirmSpawn] = useState(false);
  const { pushToast } = useToast();

  const refresh = useCallback(async () => {
    const [
      stationData,
      streamElementsData,
      commandData,
      configData,
      overviewData,
      playersData,
      transactionsData,
      balanceTelemetryData,
      liveOpsData,
    ] = await Promise.all([
      requestApi<StationSummary>("/api/v1/station"),
      requestApi<StreamElementsStatus>(
        "/api/v1/integrations/streamelements/health",
      ),
      requestApi<ChatCommand[]>("/api/v1/admin/chat-commands"),
      requestApi<ConfigVersion[]>("/api/v1/admin/config"),
      requestApi<AdminOverview>("/api/v1/admin/overview"),
      requestApi<AdminPlayer[]>("/api/v1/admin/players"),
      requestApi<LoyaltyTransaction[]>("/api/v1/admin/transactions"),
      requestApi<BalanceTelemetry>("/api/v1/admin/balance-telemetry"),
      requestApi<LiveOpsDashboard>("/api/v1/admin/live-ops"),
    ]);
    setStation(stationData);
    setStreamElements(streamElementsData);
    setCommands(commandData);
    setConfig(configData);
    setOverview(overviewData);
    setPlayers(playersData);
    setTransactions(transactionsData);
    setBalanceTelemetry(balanceTelemetryData);
    setLiveOps(liveOpsData);
  }, []);

  useEffect(() => {
    void requestApi<CurrentUser>("/api/v1/me")
      .then((user) => {
        setMe(user);
        return refresh();
      })
      .catch((error) => {
        setMe(null);
        pushToast({
          title: "Admin session unavailable",
          message:
            errorMessage(error) || "Sign in through the main game first.",
          tone: "danger",
          duration: 8000,
        });
      });
  }, [pushToast, refresh]);

  const publish = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const contentJson = JSON.parse(String(form.get("json") || "{}"));
      await requestApi("/api/v1/admin/config", {
        method: "POST",
        body: JSON.stringify({
          slug: String(form.get("slug")),
          lifecycle: String(form.get("lifecycle")),
          contentJson,
        }),
      });
      pushToast({
        title: "Config version saved",
        message: "The version was validated and added to the audit trail.",
        tone: "success",
      });
      await refresh();
    } catch (error) {
      pushToast({
        title: "Config rejected",
        message: errorMessage(error),
        tone: "danger",
      });
    }
  };

  const spawn = async () => {
    setConfirmSpawn(false);
    try {
      await requestApi("/api/v1/admin/actions/spawn-wreck", { method: "POST" });
      pushToast({ title: "Fresh wreck spawned", tone: "success" });
      await refresh();
    } catch (error) {
      pushToast({
        title: "Spawn failed",
        message: errorMessage(error),
        tone: "danger",
      });
    }
  };

  const triggerEvent = async (slug: string) => {
    try {
      await requestApi(`/api/v1/admin/events/${slug}/trigger`, {
        method: "POST",
      });
      pushToast({
        title: "Live event activated",
        message: slug,
        tone: "success",
      });
      await refresh();
    } catch (error) {
      pushToast({
        title: "Event rejected",
        message: errorMessage(error),
        tone: "danger",
      });
    }
  };

  const resetEvent = async (slug: string) => {
    try {
      await requestApi(`/api/v1/admin/events/${slug}/reset`, {
        method: "POST",
        body: JSON.stringify({
          stopActive: true,
          reason: "Manual operator reset",
        }),
      });
      pushToast({ title: "Event timer reset", message: slug, tone: "success" });
      await refresh();
    } catch (error) {
      pushToast({
        title: "Reset failed",
        message: errorMessage(error),
        tone: "danger",
      });
    }
  };

  const subscribeTwitch = async () => {
    try {
      const results = await requestApi<
        Array<{ type: string; ok: boolean; error?: string }>
      >("/api/v1/integrations/twitch/subscribe", { method: "POST" });
      const failures = results.filter((result) => !result.ok);
      pushToast({
        title: failures.length
          ? "Twitch subscriptions need attention"
          : "Twitch EventSub connected",
        message: failures
          .map((result) => `${result.type}: ${result.error}`)
          .join(" · "),
        tone: failures.length ? "warning" : "success",
        duration: 8000,
      });
    } catch (error) {
      pushToast({
        title: "Twitch setup failed",
        message: errorMessage(error),
        tone: "danger",
      });
    }
  };

  const signOut = async () => {
    await requestApi("/api/v1/auth/logout", { method: "POST" });
    window.location.href = "/";
  };

  if (me === undefined)
    return (
      <LoadingScreen
        label="Opening Streamer Control Center"
        detail="Verifying operator permissions and station telemetry."
      />
    );
  if (!me)
    return (
      <AccessDenied reason="Sign in through the main Neon Wreckers interface, then reopen the Streamer Control Center." />
    );
  if (!me.roles.some((role) => role === "admin" || role === "streamer")) {
    return (
      <AccessDenied reason="This interface requires the streamer or administrator role." />
    );
  }

  const pages: Record<string, ReactNode> = {
    operations: (
      <OperationsPage
        station={station}
        streamElements={streamElements}
        onSpawn={() => setConfirmSpawn(true)}
        onRefresh={() => void refresh()}
        onTrigger={(slug) => void triggerEvent(slug)}
        onReset={(slug) => void resetEvent(slug)}
        onSubscribeTwitch={() => void subscribeTwitch()}
      />
    ),
    integrations: (
      <IntegrationsPage
        status={streamElements}
        refresh={refresh}
        pushToast={pushToast}
      />
    ),
    commands: (
      <CommandsPage
        commands={commands}
        refresh={refresh}
        pushToast={pushToast}
      />
    ),
    server: <ServerPage overview={overview} balanceTelemetry={balanceTelemetry} />,
    timers: (
      <TimersPage overview={overview} refresh={refresh} pushToast={pushToast} />
    ),
    players: (
      <PlayersPage players={players} refresh={refresh} pushToast={pushToast} />
    ),
    transactions: (
      <TransactionsPage
        transactions={transactions}
        refresh={refresh}
        pushToast={pushToast}
      />
    ),
    config: <ConfigPage config={config} liveOps={liveOps} publish={publish} refresh={refresh} pushToast={pushToast} />,
    interface: <ComponentShowcase />,
  };

  return (
    <AppShell
      className="admin-shell"
      header={
        <CommandHeader
          brand="NEON WRECKERS // ADMIN"
          title="Streamer Control Center"
          subtitle="Operations, integrations, commands, and diagnostics"
          status={
            <Badge tone="warning" icon="settings">
              AUTHORIZED
            </Badge>
          }
          actions={
            <div className="inline-actions">
              <Button
                size="sm"
                variant="ghost"
                icon={<NWIcon name="diagnostics" size={15} />}
                onClick={() => void refresh()}
              >
                Resync
              </Button>
              <Button size="sm" variant="ghost" onClick={() => void signOut()}>
                Sign out
              </Button>
            </div>
          }
          profile={
            <ProfileChip
              name={me.displayName}
              detail="Command operator"
              avatarUrl={me.avatarUrl || undefined}
            />
          }
        />
      }
      navigation={
        <CommandNavigation
          items={navigation}
          value={tab}
          onChange={setTab}
          ariaLabel="Admin navigation"
        />
      }
    >
      <div className="admin-page" key={tab}>
        {pages[tab]}
      </div>
      <ConfirmWindow
        open={confirmSpawn}
        onClose={() => setConfirmSpawn(false)}
        onConfirm={() => void spawn()}
        title="Spawn a fresh wreck?"
        confirmLabel="Spawn wreck"
        tone="warning"
      >
        <p>
          This invokes the existing administrative spawn action and may replace
          the current salvage target.
        </p>
      </ConfirmWindow>
    </AppShell>
  );
}

function AccessDenied({ reason }: { reason: string }) {
  return (
    <main className="admin-access">
      <Panel depth="high" tone="danger">
        <SectionTitle
          eyebrow="ACCESS CONTROL"
          title="Admin session unavailable"
          icon="danger"
        />
        <Notification title="Command access denied" tone="danger">
          {reason}
        </Notification>
        <Button
          variant="primary"
          onClick={() => {
            window.location.href = "/";
          }}
        >
          Open main interface
        </Button>
      </Panel>
    </main>
  );
}

function OperationsPage({
  station,
  streamElements,
  onSpawn,
  onRefresh,
  onTrigger,
  onReset,
  onSubscribeTwitch,
}: {
  station: StationSummary | null;
  streamElements: StreamElementsStatus | null;
  onSpawn: () => void;
  onRefresh: () => void;
  onTrigger: (slug: string) => void;
  onReset: (slug: string) => void;
  onSubscribeTwitch: () => void;
}) {
  const integrationTone = streamElements?.ok ? "success" : "warning";
  return (
    <div className="admin-stack">
      <SectionTitle
        eyebrow="LIVE OPERATIONS"
        title="Station Command"
        description="Administrative controls use the authoritative API."
        icon="station"
        action={
          <Button
            variant="ghost"
            icon={<NWIcon name="diagnostics" size={15} />}
            onClick={onRefresh}
          >
            Refresh telemetry
          </Button>
        }
      />
      <ResponsiveGrid min="13rem">
        <StatusDisplay
          label="Population"
          value={station?.population ?? 0}
          icon="population"
          tone="success"
        />
        <StatusDisplay
          label="Power"
          value={station?.power ?? 0}
          unit="%"
          icon="power"
          tone="purple"
        />
        <StatusDisplay
          label="Integrity"
          value={station?.integrity ?? 0}
          unit="%"
          icon="integrity"
          tone={(station?.integrity ?? 0) < 50 ? "warning" : "success"}
        />
        <StatusDisplay
          label="StreamElements"
          value={integrationTone === "success" ? "VERIFIED" : "CHECK"}
          icon="streamelements"
          tone={integrationTone}
        />
      </ResponsiveGrid>
      <Panel tone="purple">
        <SectionTitle
          eyebrow="LIVE EVENTS"
          title="Event Triggers"
          description="Event cooldowns and effects are enforced by the authoritative API."
          icon="events"
        />
        <div className="admin-command-grid">
          {["reactor-instability", "black-market-visit", "ghost-ship"].map(
            (slug) => (
              <CardCommand
                key={slug}
                slug={slug}
                onTrigger={onTrigger}
                onReset={onReset}
              />
            ),
          )}
        </div>
      </Panel>
      <Panel tone="info">
        <SectionTitle
          eyebrow="TWITCH EVENTSUB"
          title="Viewer Event Connection"
          description="Creates signed webhook subscriptions for chat, follows, subscriptions, cheers, and raids. Those events are broadcast to the overlay activity feed."
          icon="twitch"
        />
        <Button onClick={onSubscribeTwitch}>
          Connect EventSub subscriptions
        </Button>
      </Panel>
      <ResponsiveGrid min="20rem">
        <Panel tone="warning">
          <SectionTitle
            eyebrow="WRECK CONTROL"
            title="Spawn salvage target"
            icon="wreck"
          />
          <p>
            Creates a fresh wreck through the existing administrative action.
            The server remains authoritative.
          </p>
          <Button
            variant="warning"
            icon={<NWIcon name="wreck" size={16} />}
            onClick={onSpawn}
          >
            Spawn fresh wreck
          </Button>
        </Panel>
        <Panel tone={integrationTone}>
          <SectionTitle
            eyebrow="INTEGRATION HEALTH"
            title="StreamElements Link"
            icon="streamelements"
          />
          <p>{streamElements?.detail ?? "No health payload returned."}</p>
          <strong>
            {streamElements?.identity?.displayName ?? "No selected account"}
          </strong>
        </Panel>
      </ResponsiveGrid>
    </div>
  );
}

function IntegrationsPage({
  status,
  refresh,
  pushToast,
}: {
  status: StreamElementsStatus | null;
  refresh: () => Promise<void>;
  pushToast: PushToast;
}) {
  const post = async (
    path: string,
    body: unknown | undefined,
    success: string,
  ) => {
    try {
      await requestApi(path, {
        method: "POST",
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      pushToast({ title: success, tone: "success" });
      await refresh();
    } catch (error) {
      pushToast({
        title: "StreamElements command failed",
        message: errorMessage(error),
        tone: "danger",
        duration: 8000,
      });
    }
  };
  const remove = async (connection: StreamElementsConnection) => {
    if (
      !window.confirm(
        `Remove the saved StreamElements connection for ${connection.displayName}?`,
      )
    )
      return;
    try {
      await requestApi(
        `/api/v1/integrations/streamelements/connections/${encodeURIComponent(connection.id)}`,
        { method: "DELETE" },
      );
      pushToast({ title: "StreamElements account removed", tone: "success" });
      await refresh();
    } catch (error) {
      pushToast({
        title: "Remove failed",
        message: errorMessage(error),
        tone: "danger",
      });
    }
  };
  const active =
    status?.connections.find((connection) => connection.isActive) ?? null;

  return (
    <div className="admin-stack">
      <SectionTitle
        eyebrow="ACCOUNT ROUTING"
        title="StreamElements Control Center"
        description="Verify the actual channel behind each token, save multiple authorized accounts, and select the one Neon Wreckers charges."
        icon="streamelements"
      />
      <ResponsiveGrid min="14rem">
        <StatusDisplay
          label="API verification"
          value={status?.ok ? "PASS" : "FAIL"}
          icon="diagnostics"
          tone={status?.ok ? "success" : "danger"}
        />
        <StatusDisplay
          label="Selected account"
          value={active?.displayName ?? "NONE"}
          icon="profile"
          tone={active ? "info" : "warning"}
        />
        <StatusDisplay
          label="OAuth application"
          value={status?.oauthConfigured ? "READY" : "NOT SET"}
          icon="network"
          tone={status?.oauthConfigured ? "success" : "warning"}
        />
        <StatusDisplay
          label="Point actions"
          value={
            active?.pointsEnabled && status?.pointsKillSwitchEnabled
              ? "ENABLED"
              : "OFF"
          }
          icon="credits"
          tone={
            active?.pointsEnabled && status?.pointsKillSwitchEnabled
              ? "success"
              : "warning"
          }
        />
      </ResponsiveGrid>

      {!status?.pointsKillSwitchEnabled && (
        <Notification
          title="Server point-action kill switch is off"
          tone="warning"
        >
          The account can still be verified and selected, but paid chat commands
          remain disabled until FEATURE_POINTS_ACTIONS=true is deployed.
        </Notification>
      )}
      {active && !active.matchesStreamer && (
        <Notification
          title="Selected account does not match the configured Twitch streamer"
          tone="danger"
        >
          The StreamElements provider ID is {active.providerId ?? "unknown"},
          while Neon Wreckers is configured for a different Twitch broadcaster.
          Select the correct account before enabling point actions.
        </Notification>
      )}

      <Panel tone={status?.ok ? "success" : "warning"}>
        <SectionTitle
          eyebrow="ACTIVE CONNECTION"
          title={active?.displayName ?? "No StreamElements account selected"}
          description={status?.detail}
          icon="streamelements"
        />
        {active ? (
          <div className="admin-integration-profile">
            {active.avatarUrl ? (
              <img src={active.avatarUrl} alt="" />
            ) : (
              <div className="admin-avatar-placeholder">
                <NWIcon name="profile" size={28} />
              </div>
            )}
            <div>
              <strong>{active.displayName}</strong>
              <span>
                @{active.username} · {active.provider}
              </span>
              <small>
                Channel {active.channelId} · {active.authType.toUpperCase()} ·
                verified{" "}
                {active.lastVerifiedAt
                  ? new Date(active.lastVerifiedAt).toLocaleString()
                  : "never"}
              </small>
            </div>
          </div>
        ) : (
          <p>
            Connect through OAuth or verify the existing server token below.
          </p>
        )}
        <div className="admin-mobile-actions">
          {status?.oauthConfigured && (
            <Button
              onClick={() => {
                window.location.href =
                  "/api/v1/auth/streamelements/start?returnTo=/admin/";
              }}
            >
              Connect another account
            </Button>
          )}
          {status?.legacyAvailable && (
            <Button
              variant="ghost"
              onClick={() =>
                void post(
                  "/api/v1/integrations/streamelements/import-legacy",
                  undefined,
                  "Server token verified and saved",
                )
              }
            >
              Verify current server token
            </Button>
          )}
          {active && (
            <Button
              variant="ghost"
              onClick={() =>
                void post(
                  `/api/v1/integrations/streamelements/connections/${encodeURIComponent(active.id)}/verify`,
                  undefined,
                  "Selected account verified",
                )
              }
            >
              Verify selected account
            </Button>
          )}
          {active && (
            <Button
              variant={active.pointsEnabled ? "warning" : "primary"}
              onClick={() =>
                void post(
                  `/api/v1/integrations/streamelements/connections/${encodeURIComponent(active.id)}/settings`,
                  { pointsEnabled: !active.pointsEnabled },
                  active.pointsEnabled
                    ? "Point actions disabled"
                    : "Point actions enabled",
                )
              }
            >
              {active.pointsEnabled
                ? "Disable point actions"
                : "Enable point actions"}
            </Button>
          )}
        </div>
      </Panel>

      <Panel>
        <SectionTitle
          eyebrow="SAVED ACCOUNTS"
          title="Choose the charged channel"
          description="OAuth authorizes the currently selected StreamElements channel. Connect another account after switching channels in StreamElements, then choose it here."
          icon="network"
        />
        <div className="admin-connection-list">
          {(status?.connections ?? []).map((connection) => (
            <div
              key={connection.id}
              className={connection.isActive ? "is-active" : ""}
            >
              <div>
                <strong>{connection.displayName}</strong>
                <span>
                  @{connection.username} · {connection.provider} ·{" "}
                  {connection.channelId}
                </span>
                <small>
                  {connection.lastError ||
                    `Scopes: ${connection.scopes.join(", ") || "owner token"}`}
                </small>
              </div>
              <div className="admin-mobile-actions">
                {!connection.isActive && (
                  <Button
                    size="sm"
                    onClick={() =>
                      void post(
                        `/api/v1/integrations/streamelements/connections/${encodeURIComponent(connection.id)}/select`,
                        undefined,
                        `${connection.displayName} selected`,
                      )
                    }
                  >
                    Use this account
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    void post(
                      `/api/v1/integrations/streamelements/connections/${encodeURIComponent(connection.id)}/verify`,
                      undefined,
                      `${connection.displayName} verified`,
                    )
                  }
                >
                  Verify
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => void remove(connection)}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
          {!status?.connections.length && <p>No saved accounts yet.</p>}
        </div>
      </Panel>

      {!status?.oauthConfigured && (
        <Notification
          title="OAuth account picker needs a StreamElements application"
          tone="info"
        >
          Add STREAMELEMENTS_CLIENT_ID, STREAMELEMENTS_CLIENT_SECRET, and
          STREAMELEMENTS_REDIRECT_URI to the server. The existing JWT
          verification path remains available in the meantime.
        </Notification>
      )}
    </div>
  );
}

function CommandsPage({
  commands,
  refresh,
  pushToast,
}: {
  commands: ChatCommand[];
  refresh: () => Promise<void>;
  pushToast: PushToast;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ChatCommand | null>(null);

  useEffect(() => {
    if (!selectedId) return;
    const selected = commands.find((command) => command.id === selectedId);
    if (selected) setDraft(selected);
    else {
      setSelectedId(null);
      setDraft(null);
    }
  }, [commands, selectedId]);

  const newCommand = () => {
    setSelectedId(null);
    setDraft({
      id: "",
      trigger: "!command",
      description: "Describe what this command does.",
      enabled: true,
      requiresPlayer: true,
      action: { type: "scan" },
      updatedAt: null,
      source: "configured",
    });
  };

  const save = async () => {
    if (!draft) return;
    try {
      const path = selectedId
        ? `/api/v1/admin/chat-commands/${encodeURIComponent(selectedId)}`
        : "/api/v1/admin/chat-commands";
      await requestApi(path, {
        method: selectedId ? "PUT" : "POST",
        body: JSON.stringify({
          trigger: draft.trigger,
          description: draft.description,
          enabled: draft.enabled,
          requiresPlayer: true,
          action: draft.action,
        }),
      });
      pushToast({
        title: "Chat command saved",
        message: draft.trigger,
        tone: "success",
      });
      await refresh();
    } catch (error) {
      pushToast({
        title: "Command rejected",
        message: errorMessage(error),
        tone: "danger",
      });
    }
  };

  const retire = async () => {
    if (!selectedId || !draft || !window.confirm(`Retire ${draft.trigger}?`))
      return;
    try {
      await requestApi(
        `/api/v1/admin/chat-commands/${encodeURIComponent(selectedId)}`,
        { method: "DELETE" },
      );
      pushToast({ title: "Chat command retired", tone: "success" });
      setSelectedId(null);
      await refresh();
    } catch (error) {
      pushToast({
        title: "Retire failed",
        message: errorMessage(error),
        tone: "danger",
      });
    }
  };

  const actionKey =
    draft?.action.type === "scan"
      ? "scan"
      : draft?.action.type === "salvage"
        ? `salvage:${draft.action.mode}`
        : `point:${draft?.action.slug}`;

  const setAction = (value: string) => {
    if (!draft) return;
    if (value === "scan") setDraft({ ...draft, action: { type: "scan" } });
    if (value === "salvage:cutters")
      setDraft({ ...draft, action: { type: "salvage", mode: "cutters" } });
    if (value === "salvage:cargo")
      setDraft({ ...draft, action: { type: "salvage", mode: "cargo" } });
    if (value === "point:rush_scan")
      setDraft({
        ...draft,
        action: { type: "point_action", slug: "rush_scan" },
      });
    if (value === "point:safety_override")
      setDraft({
        ...draft,
        action: { type: "point_action", slug: "safety_override" },
      });
  };

  return (
    <div className="admin-stack">
      <SectionTitle
        eyebrow="CHAT AUTOMATION"
        title="Command Editor"
        description="Commands map to a safe server-side action allowlist. They cannot execute arbitrary code."
        icon="terminal"
        action={<Button onClick={newCommand}>New command</Button>}
      />
      <div className="admin-player-layout">
        <Panel>
          <div className="admin-player-list">
            {commands.map((command) => (
              <button
                key={command.id}
                className={`admin-player-button ${selectedId === command.id ? "is-selected" : ""}`}
                onClick={() => {
                  setSelectedId(command.id);
                  setDraft(command);
                }}
              >
                <strong>{command.trigger}</strong>
                <span>{command.description}</span>
                <small>
                  {command.enabled ? "Enabled" : "Disabled"} · {command.source}
                </small>
              </button>
            ))}
          </div>
        </Panel>
        <Modal
          open={Boolean(draft)}
          onClose={() => { setDraft(null); setSelectedId(null); }}
          title={draft ? `${selectedId ? "Edit" : "Create"} ${draft.trigger}` : "Command editor"}
          description="Configure the trigger and its allowlisted server action."
          size="lg"
        >
          {draft && (
            <div className="admin-stack">
              <SectionTitle
                eyebrow={selectedId ? "EDIT COMMAND" : "NEW COMMAND"}
                title={draft.trigger}
                icon="terminal"
              />
              <Field
                label="Chat trigger"
                hint="Starts with ! and matches the full normalized chat message"
              >
                <Input
                  value={draft.trigger}
                  onChange={(event) =>
                    setDraft({ ...draft, trigger: event.target.value })
                  }
                />
              </Field>
              <Field label="Description">
                <Input
                  value={draft.description}
                  onChange={(event) =>
                    setDraft({ ...draft, description: event.target.value })
                  }
                />
              </Field>
              <Field label="Server action">
                <Select
                  value={actionKey}
                  onChange={(event) => setAction(event.target.value)}
                >
                  <option value="scan">Scan for wreck</option>
                  <option value="salvage:cutters">Deploy cutters</option>
                  <option value="salvage:cargo">Deploy cargo recovery</option>
                  <option value="point:rush_scan">
                    Spend points: rush scan
                  </option>
                  <option value="point:safety_override">
                    Spend points: safety override
                  </option>
                </Select>
              </Field>
              <label className="admin-check">
                <input
                  type="checkbox"
                  checked={draft.enabled}
                  onChange={(event) =>
                    setDraft({ ...draft, enabled: event.target.checked })
                  }
                />{" "}
                Command enabled
              </label>
              <Notification title="Linked viewer account required" tone="info">
                All current command actions modify persistent player state, so
                the chatter must have signed into Neon Wreckers.
              </Notification>
              <Notification title="Execution boundary" tone="info">
                The action is selected from a validated server allowlist.
                Point-funded actions still require a verified StreamElements
                account, the per-account toggle, and the server kill switch.
              </Notification>
              <div className="admin-mobile-actions">
                <Button onClick={() => void save()}>Save command</Button>
                {selectedId && (
                  <Button variant="warning" onClick={() => void retire()}>
                    Retire command
                  </Button>
                )}
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}

function CardCommand({
  slug,
  onTrigger,
  onReset,
}: {
  slug: string;
  onTrigger: (slug: string) => void;
  onReset: (slug: string) => void;
}) {
  return (
    <Panel>
      <strong>{slug.replaceAll("-", " ")}</strong>
      <p>
        Trigger the command or stop its active run and clear its server cooldown
        history.
      </p>
      <div className="admin-mobile-actions">
        <Button size="sm" onClick={() => onTrigger(slug)}>
          Trigger
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onReset(slug)}>
          Stop & reset
        </Button>
      </div>
    </Panel>
  );
}

function ServerPage({ overview, balanceTelemetry }: { overview: AdminOverview | null; balanceTelemetry: BalanceTelemetry | null }) {
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

function TimersPage({
  overview,
  refresh,
  pushToast,
}: {
  overview: AdminOverview | null;
  refresh: () => Promise<void>;
  pushToast: PushToast;
}) {
  const resolveNow = async (id: string) => {
    if (!window.confirm("Resolve this expedition immediately?")) return;
    try {
      await requestApi(`/api/v1/expeditions/${id}/resolve-now`, {
        method: "POST",
      });
      pushToast({ title: "Expedition timer resolved", tone: "success" });
      await refresh();
    } catch (error) {
      pushToast({
        title: "Timer command failed",
        message: errorMessage(error),
        tone: "danger",
      });
    }
  };
  return (
    <div className="admin-stack">
      <SectionTitle
        eyebrow="SCHEDULE CONTROL"
        title="Active Expedition Timers"
        description="Force an overdue or stuck expedition into its server-calculated resolved state. Players must still claim their rewards."
        icon="events"
      />
      <Panel>
        <DataGrid
          rows={overview?.timers ?? []}
          getRowKey={(row) => row.id}
          empty="No active expedition timers."
          columns={[
            {
              key: "player",
              header: "Player",
              render: (row) => <strong>{row.playerName}</strong>,
            },
            { key: "mission", header: "Mission", render: (row) => row.name },
            {
              key: "return",
              header: "Scheduled return",
              render: (row) => new Date(row.resolvesAt).toLocaleString(),
            },
            {
              key: "control",
              header: "Control",
              align: "right",
              render: (row) => (
                <Button
                  size="sm"
                  variant="warning"
                  onClick={() => void resolveNow(row.id)}
                >
                  Resolve now
                </Button>
              ),
            },
          ]}
        />
      </Panel>
      <Notification title="Other command timers" tone="info">
        Player crafting, salvage, scan, station-maintenance, and career timers
        are listed and reset from the Players workspace. Live-event timers are
        stopped and reset from Operations.
      </Notification>
    </div>
  );
}

function PlayersPage({
  players,
  refresh,
  pushToast,
}: {
  players: AdminPlayer[];
  refresh: () => Promise<void>;
  pushToast: PushToast;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<AdminPlayer | null>(null);
  const [credits, setCredits] = useState(0);
  const [xp, setXp] = useState(0);
  const [reputation, setReputation] = useState(0);
  const [reason, setReason] = useState("Operator correction");
  useEffect(() => {
    if (selected && !players.some((player) => player.id === selected.id)) setSelected(null);
  }, [players, selected]);
  const visible = players.filter((player) =>
    `${player.displayName} ${player.twitchLogin}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const post = async (path: string, body: unknown, success: string) => {
    try {
      await requestApi(path, { method: "POST", body: JSON.stringify(body) });
      pushToast({ title: success, tone: "success" });
      await refresh();
    } catch (error) {
      pushToast({
        title: "Admin command failed",
        message: errorMessage(error),
        tone: "danger",
      });
    }
  };
  return (
    <div className="admin-stack">
      <SectionTitle
        eyebrow="PLAYER ADMINISTRATION"
        title="Accounts, Balances & Cooldowns"
        description="All changes require a reason and are written to the audit log."
        icon="crew"
      />
      <Field label="Find player">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Display name or Twitch login"
        />
      </Field>
      <div className="admin-player-layout">
        <Panel>
          <div className="admin-player-list">
            {visible.map((player) => (
              <button
                key={player.id}
                className={`admin-player-button ${selected?.id === player.id ? "is-selected" : ""}`}
                onClick={() => setSelected(player)}
              >
                <strong>{player.displayName}</strong>
                <span>
                  @{player.twitchLogin} · L{player.level}
                </span>
                <small>
                  {player.credits.toLocaleString()} cr ·{" "}
                  {player.cooldowns.length} cooldowns
                </small>
              </button>
            ))}
          </div>
        </Panel>
        {selected && (
          <Modal open onClose={() => setSelected(null)} title={`Manage ${selected.displayName}`} description="Adjust balances and persistent cooldowns with an audited reason." size="lg">
            <ResponsiveGrid min="9rem">
              <StatusDisplay
                compact
                label="Credits"
                value={selected.credits}
                icon="credits"
                tone="success"
              />
              <StatusDisplay
                compact
                label="XP"
                value={selected.xp}
                icon="data"
                tone="info"
              />
              <StatusDisplay
                compact
                label="Reputation"
                value={selected.reputation}
                icon="museum"
                tone="purple"
              />
            </ResponsiveGrid>
            <Field label="Required audit reason">
              <Input
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              />
            </Field>
            <ResponsiveGrid min="9rem">
              <Field label="Credit adjustment">
                <Input
                  type="number"
                  value={credits}
                  onChange={(event) => setCredits(Number(event.target.value))}
                />
              </Field>
              <Field label="XP adjustment">
                <Input
                  type="number"
                  value={xp}
                  onChange={(event) => setXp(Number(event.target.value))}
                />
              </Field>
              <Field label="Reputation adjustment">
                <Input
                  type="number"
                  value={reputation}
                  onChange={(event) =>
                    setReputation(Number(event.target.value))
                  }
                />
              </Field>
            </ResponsiveGrid>
            <Button
              fullWidth
              onClick={() =>
                void post(
                  `/api/v1/admin/players/${selected.id}/adjust`,
                  { credits, xp, reputation, reason },
                  "Player balances updated",
                )
              }
            >
              Apply adjustments
            </Button>
            <SectionTitle
              eyebrow="ACTION TIMERS"
              title="Active Cooldowns"
              icon="events"
            />
            <div className="admin-cooldowns">
              {selected.cooldowns.map((cooldown) => (
                <div key={cooldown.id}>
                  <span>{cooldown.actionKey}</span>
                  <strong>
                    {new Date(cooldown.expiresAt).toLocaleString()}
                  </strong>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      void post(
                        `/api/v1/admin/players/${selected.id}/cooldowns/reset`,
                        { actionKey: cooldown.actionKey, reason },
                        "Cooldown reset",
                      )
                    }
                  >
                    Reset
                  </Button>
                </div>
              ))}
            </div>
            <Button
              variant="warning"
              fullWidth
              disabled={!selected.cooldowns.length}
              onClick={() =>
                void post(
                  `/api/v1/admin/players/${selected.id}/cooldowns/reset`,
                  { reason },
                  "All cooldowns reset",
                )
              }
            >
              Reset every player timer
            </Button>
          </Modal>
        )}
      </div>
    </div>
  );
}

function TransactionsPage({
  transactions,
  refresh,
  pushToast,
}: {
  transactions: LoyaltyTransaction[];
  refresh: () => Promise<void>;
  pushToast: PushToast;
}) {
  const [reason, setReason] = useState("Operator-approved point refund");
  const refund = async (transaction: LoyaltyTransaction) => {
    if (
      !window.confirm(
        `Refund ${transaction.amount} points to ${transaction.user.displayName}?`,
      )
    )
      return;
    try {
      await requestApi(`/api/v1/admin/transactions/${transaction.id}/refund`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      });
      pushToast({
        title: "Points refunded",
        message: `${transaction.amount} points returned to ${transaction.user.displayName}.`,
        tone: "success",
      });
      await refresh();
    } catch (error) {
      pushToast({
        title: "Refund failed",
        message: errorMessage(error),
        tone: "danger",
      });
    }
  };
  return (
    <div className="admin-stack">
      <SectionTitle
        eyebrow="FINANCIAL OPERATIONS"
        title="Point Transactions & Refunds"
        description="Refunds credit StreamElements first and update the local ledger only after confirmation."
        icon="credits"
      />
      <Field label="Required refund reason">
        <Input
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />
      </Field>
      <Panel>
        <DataGrid
          rows={transactions}
          getRowKey={(row) => row.id}
          empty="No point transactions."
          columns={[
            {
              key: "player",
              header: "Player",
              render: (row) => <strong>{row.user.displayName}</strong>,
            },
            {
              key: "action",
              header: "Command",
              render: (row) => row.actionSlug,
            },
            {
              key: "amount",
              header: "Points",
              align: "right",
              render: (row) => row.amount,
            },
            {
              key: "status",
              header: "Status",
              render: (row) => (
                <Badge
                  tone={
                    row.status === "committed"
                      ? "success"
                      : row.status === "ambiguous"
                        ? "warning"
                        : "neutral"
                  }
                >
                  {row.status}
                </Badge>
              ),
            },
            {
              key: "time",
              header: "Created",
              render: (row) => new Date(row.createdAt).toLocaleString(),
            },
            {
              key: "refund",
              header: "Control",
              align: "right",
              render: (row) => (
                <Button
                  size="sm"
                  variant="warning"
                  disabled={
                    !["committed", "ambiguous"].includes(row.status) ||
                    reason.length < 3
                  }
                  onClick={() => void refund(row)}
                >
                  Refund
                </Button>
              ),
            },
          ]}
        />
      </Panel>
    </div>
  );
}

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(
    units.length - 1,
    Math.floor(Math.log(bytes) / Math.log(1024)),
  );
  return `${(bytes / 1024 ** index).toFixed(index > 1 ? 1 : 0)} ${units[index]}`;
}
function formatDuration(seconds: number) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${days}d ${hours}h ${minutes}m`;
}

function ConfigPage({
  config,
  liveOps,
  publish,
  refresh,
  pushToast,
}: {
  config: ConfigVersion[];
  liveOps: LiveOpsDashboard | null;
  publish: (event: FormEvent<HTMLFormElement>) => void;
  refresh: () => Promise<void>;
  pushToast: PushToast;
}) {
  const [editorOpen, setEditorOpen] = useState(false);
  const changeLifecycle = async (version: ConfigVersion, mode: "activate" | "rollback") => {
    const reason = mode === "rollback" ? "Operator rollback from live-ops console" : null;
    try {
      await requestApi(`/api/v1/admin/config/${version.id}/${mode}`, { method: "POST", ...(reason ? { body: JSON.stringify({ reason }) } : {}) });
      pushToast({ title: mode === "activate" ? "Configuration activated" : "Rollback release created", message: `${version.slug} v${version.version}`, tone: "success" });
      await refresh();
    } catch (error) {
      pushToast({ title: "Lifecycle change rejected", message: errorMessage(error), tone: "danger" });
    }
  };
  return (
    <div className="admin-stack">
      <SectionTitle
        eyebrow="VERSIONED CONTENT"
        title="Configuration Registry"
        description="Create audited drafts and inspect recent content versions."
        icon="data"
        action={<Button onClick={() => setEditorOpen(true)}>New configuration draft</Button>}
      />
      <Modal open={editorOpen} onClose={() => setEditorOpen(false)} title="New configuration draft" description="Create a validated, versioned configuration record." size="lg">
        <form onSubmit={publish}>
          <div className="admin-stack">
            <Field
              label="Configuration slug"
              hint="Stable identifier for the versioned config record"
              required
            >
              <Input name="slug" defaultValue="balance.patch" required />
            </Field>
            <Field label="Lifecycle" required>
              <Select name="lifecycle" defaultValue="draft">
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="active">Active</option>
                <option value="retired">Retired</option>
                <option value="archived">Archived</option>
              </Select>
            </Field>
            <Field
              label="JSON payload"
              hint="Validated by the existing admin endpoint"
              required
            >
              <Textarea
                className="admin-json"
                name="json"
                defaultValue={
                  '{\n  "note": "Describe the intended content change here"\n}'
                }
                spellCheck={false}
              />
            </Field>
            <Button variant="primary" icon={<NWIcon name="data" size={16} />}>
              Validate and save draft
            </Button>
          </div>
        </form>
      </Modal>
        {liveOps && (
          <>
            <ResponsiveGrid min="13rem">
              <StatusDisplay label="Player Credits" value={liveOps.economy.totalCredits} icon="credits" tone="info" />
              <StatusDisplay label="Average Wallet" value={liveOps.economy.averageCredits} icon="trade" tone="purple" />
              <StatusDisplay label="Season Tokens" value={liveOps.economy.seasonalTokens} icon="events" tone="success" />
              <StatusDisplay label="30d Market Trades" value={liveOps.economy.marketTransactions30d} icon="market" tone="info" />
            </ResponsiveGrid>
            {liveOps.warnings.map((warning) => (
              <Notification key={warning.code} title={warning.code.replaceAll("_", " ")} tone={warning.severity === "danger" ? "danger" : "warning"}>
                {warning.message}
              </Notification>
            ))}
            <Panel>
              <SectionTitle eyebrow="RELEASE EVIDENCE" title="Recent operator trail" description={`Generated ${new Date(liveOps.generatedAt).toLocaleString()}`} icon="diagnostics" />
              <div className="admin-stack">
                {liveOps.releaseEvidence.slice(0, 8).map((entry) => (
                  <div key={entry.id} className="admin-inline-record">
                    <strong>{entry.action}</strong>
                    <span>{entry.target}</span>
                    <small>{entry.requestId ?? "No request ID"} · {new Date(entry.createdAt).toLocaleString()}</small>
                  </div>
                ))}
              </div>
            </Panel>
          </>
        )}
        <Panel>
          <DataGrid
            rows={config}
            getRowKey={(row) => row.id}
            empty="No configuration versions found."
            columns={[
              {
                key: "slug",
                header: "Slug",
                render: (row) => <strong>{row.slug}</strong>,
              },
              {
                key: "version",
                header: "Version",
                render: (row) => (
                  <span className="nw-numeric">{row.version}</span>
                ),
              },
              {
                key: "lifecycle",
                header: "Lifecycle",
                render: (row) => (
                  <Badge tone={lifecycleTone(row.lifecycle)}>
                    {row.lifecycle}
                  </Badge>
                ),
              },
              {
                key: "created",
                header: "Created",
                render: (row) => new Date(row.createdAt).toLocaleString(),
              },
              {
                key: "controls",
                header: "Release controls",
                align: "right",
                render: (row) => (
                  <div className="inline-actions">
                    <Button size="sm" variant="ghost" disabled={row.lifecycle === "active"} onClick={() => void changeLifecycle(row, "activate")}>Activate</Button>
                    <Button size="sm" variant="warning" onClick={() => void changeLifecycle(row, "rollback")}>Rollback to</Button>
                  </div>
                ),
              },
            ]}
          />
        </Panel>
    </div>
  );
}

function lifecycleTone(lifecycle: string) {
  if (lifecycle === "active") return "success" as const;
  if (lifecycle === "scheduled") return "info" as const;
  if (lifecycle === "retired" || lifecycle === "archived")
    return "neutral" as const;
  return "warning" as const;
}

createRoot(document.getElementById("root")!).render(<Root />);
