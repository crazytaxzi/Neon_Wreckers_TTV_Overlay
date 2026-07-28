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
import {
  PlayersPage,
  type AdminPlayer,
} from "./features/players/players-page.js";
import {
  RefundsPage,
  type LoyaltyTransaction,
} from "./features/refunds/refunds-page.js";
import {
  ServerPage,
  type AdminOverview,
  type BalanceTelemetry,
} from "./features/server/server-page.js";
import { TimersPage } from "./features/timers/timers-page.js";

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

type ExpeditionCreatorData = {
  items: Array<{ slug: string; name: string; rarity: string }>;
  builtIn: Array<{ slug: string; name: string; description: string; risk: string; fuelCost: number; minCrew: number; lootPool: string[]; lootRolls: number; durationMinutes: [number, number] }>;
  versions: Array<{ id: string; slug: string; version: number; lifecycle: string; content: Record<string, unknown>; scheduledAt: string | null; expiresAt: string | null; createdAt: string }>;
};

type PushToast = ReturnType<typeof useToast>["pushToast"];

const navigation: TabItem[] = [
  { id: "operations", label: "Operations", icon: "station" },
  { id: "expeditions", label: "Expedition Creator", icon: "expedition" },
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
  const [expeditionCreator, setExpeditionCreator] = useState<ExpeditionCreatorData | null>(null);
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
      expeditionCreatorData,
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
      requestApi<ExpeditionCreatorData>("/api/v1/admin/expedition-creator"),
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
    setExpeditionCreator(expeditionCreatorData);
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
    expeditions: <ExpeditionCreatorPage data={expeditionCreator} refresh={refresh} pushToast={pushToast} />,
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
      <TimersPage
        timers={overview?.timers ?? []}
        refresh={refresh}
        pushToast={pushToast}
      />
    ),
    players: (
      <PlayersPage players={players} refresh={refresh} pushToast={pushToast} />
    ),
    transactions: (
      <RefundsPage
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

function ExpeditionCreatorPage({
  data,
  refresh,
  pushToast,
}: {
  data: ExpeditionCreatorData | null;
  refresh: () => Promise<void>;
  pushToast: PushToast;
}) {
  type ExpeditionVersion = NonNullable<ExpeditionCreatorData>["versions"][number];

  const [open, setOpen] = useState(false);
  const [slug, setSlug] = useState("outer-rim-recovery");
  const [name, setName] = useState("Outer Rim Recovery");
  const [description, setDescription] = useState("Recover valuable components from an unstable debris corridor beyond Station Zero.");
  const [risk, setRisk] = useState("moderate");
  const [fuelCost, setFuelCost] = useState(2);
  const [minCrew, setMinCrew] = useState(2);
  const [lootRolls, setLootRolls] = useState(3);
  const [durationMin, setDurationMin] = useState(25);
  const [durationMax, setDurationMax] = useState(45);
  const [lootPool, setLootPool] = useState<string[]>(["scrap", "alloys", "electronics"]);
  const [lifecycle, setLifecycle] = useState("draft");
  const [scheduledAt, setScheduledAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const openBlank = () => {
    setSlug("outer-rim-recovery");
    setName("Outer Rim Recovery");
    setDescription("Recover valuable components from an unstable debris corridor beyond Station Zero.");
    setRisk("moderate");
    setFuelCost(2);
    setMinCrew(2);
    setLootRolls(3);
    setDurationMin(25);
    setDurationMax(45);
    setLootPool(["scrap", "alloys", "electronics"]);
    setLifecycle("draft");
    setScheduledAt("");
    setExpiresAt("");
    setOpen(true);
  };

  const loadTemplate = (template: ExpeditionCreatorData["builtIn"][number]) => {
    setSlug(`${template.slug}-custom`);
    setName(`${template.name} Variant`);
    setDescription(template.description);
    setRisk(template.risk);
    setFuelCost(template.fuelCost);
    setMinCrew(template.minCrew);
    setLootRolls(template.lootRolls);
    setDurationMin(template.durationMinutes[0]);
    setDurationMax(template.durationMinutes[1]);
    setLootPool([...template.lootPool]);
    setLifecycle("draft");
    setScheduledAt("");
    setExpiresAt("");
    setOpen(true);
  };

  const loadVersion = (version: ExpeditionVersion) => {
    const content = version.content;
    const duration = Array.isArray(content.durationMinutes) ? content.durationMinutes : [];
    const rewards = Array.isArray(content.lootPool)
      ? content.lootPool.filter((item): item is string => typeof item === "string")
      : [];
    setSlug(String(content.slug ?? version.slug.replace(/^expedition\./, "")));
    setName(String(content.name ?? version.slug.replace(/^expedition\./, "")));
    setDescription(String(content.description ?? "Describe this expedition."));
    setRisk(String(content.risk ?? "moderate"));
    setFuelCost(Number(content.fuelCost ?? 2));
    setMinCrew(Number(content.minCrew ?? 2));
    setLootRolls(Number(content.lootRolls ?? 3));
    setDurationMin(Number(duration[0] ?? 25));
    setDurationMax(Number(duration[1] ?? 45));
    setLootPool(rewards.length ? rewards : ["scrap"]);
    setLifecycle("draft");
    setScheduledAt("");
    setExpiresAt("");
    setOpen(true);
  };

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await requestApi("/api/v1/admin/expedition-creator", {
        method: "POST",
        body: JSON.stringify({
          definition: { slug, name, description, risk, fuelCost, minCrew, lootRolls, durationMinutes: [durationMin, durationMax], lootPool },
          lifecycle,
          ...(scheduledAt ? { scheduledAt: new Date(scheduledAt).toISOString() } : {}),
          ...(expiresAt ? { expiresAt: new Date(expiresAt).toISOString() } : {}),
        }),
      });
      pushToast({ title: lifecycle === "active" ? "Expedition activated" : "Expedition version saved", message: `${name} is ${lifecycle}.`, tone: "success" });
      setOpen(false);
      await refresh();
    } catch (error) {
      pushToast({ title: "Expedition rejected", message: errorMessage(error), tone: "danger", duration: 8000 });
    }
  };

  const changeLifecycle = async (version: ExpeditionVersion, action: "activate" | "retire") => {
    const displayName = String(version.content.name ?? version.slug.replace("expedition.", ""));
    if (action === "retire" && !window.confirm(`Retire ${displayName}? Players will no longer be able to launch it.`)) return;
    try {
      await requestApi(`/api/v1/admin/expedition-creator/${encodeURIComponent(version.id)}/${action}`, { method: "POST" });
      pushToast({
        title: action === "activate" ? "Expedition activated" : "Expedition retired",
        message: `${displayName} v${version.version}`,
        tone: "success",
      });
      await refresh();
    } catch (error) {
      pushToast({ title: "Lifecycle change failed", message: errorMessage(error), tone: "danger" });
    }
  };

  const removeVersion = async (version: ExpeditionVersion) => {
    const displayName = String(version.content.name ?? version.slug.replace("expedition.", ""));
    if (!window.confirm(`Permanently delete ${displayName} v${version.version}? Active missions keep their saved rules, but this authored version cannot be restored.`)) return;
    try {
      await requestApi(`/api/v1/admin/expedition-creator/${encodeURIComponent(version.id)}`, { method: "DELETE" });
      pushToast({ title: "Expedition version deleted", message: `${displayName} v${version.version}`, tone: "success" });
      await refresh();
    } catch (error) {
      pushToast({ title: "Delete failed", message: errorMessage(error), tone: "danger" });
    }
  };

  return (
    <div className="admin-stack">
      <SectionTitle
        eyebrow="SERVER-AUTHORITATIVE CONTENT"
        title="Expedition Creator"
        description="Design, revise, activate, schedule, retire, and safely remove unpublished expedition versions."
        icon="expedition"
        action={<Button onClick={openBlank}>Create expedition</Button>}
      />
      <ResponsiveGrid min="17rem">
        {(data?.builtIn ?? []).map((template) => (
          <Panel key={template.slug}>
            <Badge tone={template.risk === "extreme" ? "danger" : template.risk === "high" ? "warning" : "info"}>{template.risk}</Badge>
            <h3>{template.name}</h3>
            <p>{template.description}</p>
            <div className="admin-inline-record">
              <span>{template.fuelCost} fuel · {template.minCrew}+ crew</span>
              <small>{template.durationMinutes[0]}–{template.durationMinutes[1]} min · {template.lootRolls} rolls</small>
            </div>
            <Button size="sm" variant="ghost" onClick={() => loadTemplate(template)}>Use as template</Button>
          </Panel>
        ))}
      </ResponsiveGrid>
      <Panel>
        <SectionTitle eyebrow="AUTHORED VERSIONS" title="Release history" description="Only active versions appear in the player mission catalog. Active versions must be retired before permanent deletion, while launched flights retain immutable rule snapshots." icon="data" />
        <DataGrid
          rows={data?.versions ?? []}
          getRowKey={(row) => row.id}
          empty="No authored expeditions yet."
          columns={[
            { key: "name", header: "Expedition", render: (row) => <strong>{String(row.content.name ?? row.slug.replace("expedition.", ""))}</strong> },
            { key: "version", header: "Version", render: (row) => <span className="nw-numeric">v{row.version}</span> },
            { key: "lifecycle", header: "Lifecycle", render: (row) => <Badge tone={lifecycleTone(row.lifecycle)}>{row.lifecycle}</Badge> },
            { key: "schedule", header: "Schedule", render: (row) => row.scheduledAt ? new Date(row.scheduledAt).toLocaleString() : "Manual" },
            {
              key: "controls",
              header: "Controls",
              align: "right",
              render: (row) => (
                <div className="inline-actions">
                  {row.lifecycle !== "active" && row.lifecycle !== "archived" && (
                    <Button size="sm" onClick={() => void changeLifecycle(row, "activate")}>Activate</Button>
                  )}
                  {row.lifecycle === "active" && (
                    <Button size="sm" variant="warning" onClick={() => void changeLifecycle(row, "retire")}>Retire</Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => loadVersion(row)}>Create revision</Button>
                  {["draft", "scheduled", "retired"].includes(row.lifecycle) && (
                    <Button size="sm" variant="ghost" onClick={() => void removeVersion(row)}>Delete</Button>
                  )}
                </div>
              ),
            },
          ]}
        />
      </Panel>
      <Modal open={open} onClose={() => setOpen(false)} title="Create expedition" description="All fields are validated by the server before a version is stored." size="lg">
        <form onSubmit={save}>
          <div className="admin-stack">
            <ResponsiveGrid min="15rem">
              <Field label="Stable slug" hint="Lowercase letters, numbers, and hyphens"><Input value={slug} onChange={(event) => setSlug(event.target.value)} required /></Field>
              <Field label="Display name"><Input value={name} onChange={(event) => setName(event.target.value)} required /></Field>
            </ResponsiveGrid>
            <Field label="Mission briefing"><Textarea value={description} onChange={(event) => setDescription(event.target.value)} required /></Field>
            <ResponsiveGrid min="11rem">
              <Field label="Risk"><Select value={risk} onChange={(event) => setRisk(event.target.value)}><option value="low">Low</option><option value="moderate">Moderate</option><option value="high">High</option><option value="extreme">Extreme</option></Select></Field>
              <Field label="Fuel cost"><Input type="number" min={1} max={10} value={fuelCost} onChange={(event) => setFuelCost(Number(event.target.value))} /></Field>
              <Field label="Minimum crew"><Input type="number" min={1} max={5} value={minCrew} onChange={(event) => setMinCrew(Number(event.target.value))} /></Field>
              <Field label="Loot rolls"><Input type="number" min={1} max={8} value={lootRolls} onChange={(event) => setLootRolls(Number(event.target.value))} /></Field>
              <Field label="Minimum minutes"><Input type="number" min={1} max={1440} value={durationMin} onChange={(event) => setDurationMin(Number(event.target.value))} /></Field>
              <Field label="Maximum minutes"><Input type="number" min={1} max={1440} value={durationMax} onChange={(event) => setDurationMax(Number(event.target.value))} /></Field>
            </ResponsiveGrid>
            <ResponsiveGrid min="15rem">
              <Field label="Release state"><Select value={lifecycle} onChange={(event) => setLifecycle(event.target.value)}><option value="draft">Draft</option><option value="scheduled">Scheduled</option><option value="active">Activate now</option></Select></Field>
              <Field label="Activation time"><Input type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} disabled={lifecycle !== "scheduled"} /></Field>
              <Field label="Optional expiry"><Input type="datetime-local" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} /></Field>
            </ResponsiveGrid>
            <Notification title={lifecycle === "active" ? "Visible to players after save" : lifecycle === "scheduled" ? "Hidden until the activation time" : "Drafts remain hidden from players"} tone={lifecycle === "active" ? "success" : "info"}>
              {lifecycle === "active" ? "Saving activates this version immediately and retires the previous active version with the same slug." : lifecycle === "scheduled" ? "The worker will activate this version and retire the previous live version at the selected time." : "Use the Activate control in release history when this version is ready for the mission catalog."}
            </Notification>
            <Field label={`Loot pool · ${lootPool.length} selected`} hint="Choose up to 16 unique rewards">
              <ResponsiveGrid min="12rem">
                {(data?.items ?? []).map((item) => (
                  <label key={item.slug} className="admin-inline-record">
                    <span><input type="checkbox" checked={lootPool.includes(item.slug)} disabled={!lootPool.includes(item.slug) && lootPool.length >= 16} onChange={(event) => setLootPool((current) => event.target.checked ? [...current, item.slug] : current.filter((slug) => slug !== item.slug))} /> {item.name}</span>
                    <small>{item.rarity}</small>
                  </label>
                ))}
              </ResponsiveGrid>
            </Field>
            <Notification title="Launch preview" tone="info">{name || "Untitled expedition"} · {risk} risk · {fuelCost} fuel · {minCrew}+ crew · {durationMin}–{durationMax} minutes · {lootRolls} weighted rolls from {lootPool.length} items.</Notification>
            <Button variant="primary" disabled={!lootPool.length || (lifecycle === "scheduled" && !scheduledAt)}>{lifecycle === "active" ? "Validate and activate" : lifecycle === "scheduled" ? "Validate and schedule" : "Validate and save draft"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
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
