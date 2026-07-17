import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { errorMessage, requestApi } from '@neon-wreckers/browser-client';
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
  Notification,
  NWIcon,
  Panel,
  ProfileChip,
  ResponsiveGrid,
  SectionTitle,
  Select,
  StatusDisplay,
  Tabs,
  Textarea,
  ThemeProvider,
  ToastProvider,
  defaultTheme,
  type TabItem,
  useToast
} from '@neon-wreckers/ui';
import './admin.css';

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

type LoyaltyHealth = {
  ok: boolean;
  detail: string;
};

type ConfigVersion = {
  id: string;
  slug: string;
  version: number;
  lifecycle: string;
  createdAt: string;
};
type AdminOverview = { service: { uptimeSeconds: number; startedAt: string; node: string; loadAverage: number[]; cpuCount: number; memory: { rss: number; heapUsed: number; heapTotal: number }; disk: { total: number; free: number; used: number } | null; sockets: number }; throughput: { lastMinute: MetricWindow; lastHour: MetricWindow; lastDay: MetricWindow; series: Array<{ minute: string; requests: number; errors: number; bytes: number; latencyMs: number }> }; database: { players: number; activeExpeditions: number; activeEvents: number; activeCooldowns: number; pendingTransactions: number }; queue: Record<string, number>; timers: Array<{ id: string; name: string; playerName: string; resolvesAt: string }>; cloudSafeZone: { machine: string; eligibleRegions: string[]; vmHoursPerMonth: string; standardDiskGbMonth: number; outboundGbMonth: number; estimatedOverage: { vmUsdPerHour: number; standardDiskUsdPerGbMonth: number; premiumEgressUsdPerGbFrom: number }; disclaimer: string } };
type MetricWindow = { requests: number; errors: number; bytes: number; averageLatencyMs: number; requestsPerMinute: number };
type AdminPlayer = { id: string; displayName: string; twitchLogin: string; credits: number; xp: number; level: number; reputation: number; bannedUntil: string | null; cooldowns: Array<{ id: string; actionKey: string; expiresAt: string }> };
type LoyaltyTransaction = { id: string; amount: number; actionSlug: string; status: string; createdAt: string; error: string | null; user: { displayName: string; twitchLogin: string } };
type PushToast = ReturnType<typeof useToast>['pushToast'];

const navigation: TabItem[] = [
  { id: 'operations', label: 'Operations', icon: 'station' },
  { id: 'server', label: 'Server', icon: 'diagnostics' },
  { id: 'timers', label: 'Timers', icon: 'events' },
  { id: 'players', label: 'Players', icon: 'crew' },
  { id: 'transactions', label: 'Refunds', icon: 'credits' },
  { id: 'config', label: 'Config', icon: 'data' },
  { id: 'interface', label: 'UI Library', icon: 'diagnostics' }
];

function Root() {
  return <ThemeProvider theme={defaultTheme}><ToastProvider><AdminApp /></ToastProvider></ThemeProvider>;
}

function AdminApp() {
  const [tab, setTab] = useState('operations');
  const [me, setMe] = useState<CurrentUser | null>();
  const [config, setConfig] = useState<ConfigVersion[]>([]);
  const [health, setHealth] = useState<LoyaltyHealth | null>(null);
  const [station, setStation] = useState<StationSummary | null>(null);
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [players, setPlayers] = useState<AdminPlayer[]>([]);
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [confirmSpawn, setConfirmSpawn] = useState(false);
  const { pushToast } = useToast();

  const refresh = useCallback(async () => {
    const [stationData, healthData, configData, overviewData, playersData, transactionsData] = await Promise.all([
      requestApi<StationSummary>('/api/v1/station'),
      requestApi<LoyaltyHealth>('/api/v1/integrations/streamelements/health'),
      requestApi<ConfigVersion[]>('/api/v1/admin/config'),
      requestApi<AdminOverview>('/api/v1/admin/overview'),
      requestApi<AdminPlayer[]>('/api/v1/admin/players'),
      requestApi<LoyaltyTransaction[]>('/api/v1/admin/transactions')
    ]);
    setStation(stationData);
    setHealth(healthData);
    setConfig(configData);
    setOverview(overviewData); setPlayers(playersData); setTransactions(transactionsData);
  }, []);

  useEffect(() => {
    void requestApi<CurrentUser>('/api/v1/me').then(user => {
      setMe(user);
      return refresh();
    }).catch(error => {
      setMe(null);
      pushToast({ title: 'Admin session unavailable', message: errorMessage(error) || 'Sign in through the main game first.', tone: 'danger', duration: 8000 });
    });
  }, [pushToast, refresh]);

  const publish = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const contentJson = JSON.parse(String(form.get('json') || '{}'));
      await requestApi('/api/v1/admin/config', {
        method: 'POST',
        body: JSON.stringify({
          slug: String(form.get('slug')),
          lifecycle: String(form.get('lifecycle')),
          contentJson
        })
      });
      pushToast({ title: 'Config version saved', message: 'The version was validated and added to the audit trail.', tone: 'success' });
      await refresh();
    } catch (error) {
      pushToast({ title: 'Config rejected', message: errorMessage(error), tone: 'danger' });
    }
  };

  const spawn = async () => {
    setConfirmSpawn(false);
    try {
      await requestApi('/api/v1/admin/actions/spawn-wreck', { method: 'POST' });
      pushToast({ title: 'Fresh wreck spawned', tone: 'success' });
      await refresh();
    } catch (error) {
      pushToast({ title: 'Spawn failed', message: errorMessage(error), tone: 'danger' });
    }
  };
  const triggerEvent = async (slug: string) => {
    try {
      await requestApi(`/api/v1/admin/events/${slug}/trigger`, { method: 'POST' });
      pushToast({ title: 'Live event activated', message: slug, tone: 'success' });
      await refresh();
    } catch (error) {
      pushToast({ title: 'Event rejected', message: errorMessage(error), tone: 'danger' });
    }
  };
  const resetEvent = async (slug: string) => { try { await requestApi(`/api/v1/admin/events/${slug}/reset`, { method: 'POST', body: JSON.stringify({ stopActive: true, reason: 'Manual operator reset' }) }); pushToast({ title: 'Event timer reset', message: slug, tone: 'success' }); await refresh(); } catch (error) { pushToast({ title: 'Reset failed', message: errorMessage(error), tone: 'danger' }); } };
  const subscribeTwitch = async () => {
    try {
      const results = await requestApi<Array<{ type: string; ok: boolean; error?: string }>>('/api/v1/integrations/twitch/subscribe', { method: 'POST' });
      const failures = results.filter(result => !result.ok);
      pushToast({ title: failures.length ? 'Twitch subscriptions need attention' : 'Twitch EventSub connected', message: failures.map(result => `${result.type}: ${result.error}`).join(' · '), tone: failures.length ? 'warning' : 'success', duration: 8000 });
    } catch (error) {
      pushToast({ title: 'Twitch setup failed', message: errorMessage(error), tone: 'danger' });
    }
  };
  const signOut = async () => {
    await requestApi('/api/v1/auth/logout', { method: 'POST' });
    window.location.href = '/';
  };

  if (me === undefined) return <LoadingScreen label="Opening Streamer Control Center" detail="Verifying operator permissions and station telemetry." />;
  if (!me) return <AccessDenied reason="Sign in through the main Neon Wreckers interface, then reopen the Streamer Control Center." />;
  if (!me.roles.some(role => role === 'admin' || role === 'streamer')) {
    return <AccessDenied reason="This interface requires the streamer or administrator role." />;
  }

  const pages: Record<string, ReactNode> = {
    operations: <OperationsPage station={station} health={health} onSpawn={() => setConfirmSpawn(true)} onRefresh={() => void refresh()} onTrigger={slug => void triggerEvent(slug)} onReset={slug => void resetEvent(slug)} onSubscribeTwitch={() => void subscribeTwitch()} />,
    server: <ServerPage overview={overview} />,
    timers: <TimersPage overview={overview} refresh={refresh} pushToast={pushToast} />,
    players: <PlayersPage players={players} refresh={refresh} pushToast={pushToast} />,
    transactions: <TransactionsPage transactions={transactions} refresh={refresh} pushToast={pushToast} />,
    config: <ConfigPage config={config} publish={publish} />,
    interface: <ComponentShowcase />
  };

  return (
    <AppShell
      className="admin-shell"
      header={<CommandHeader
        brand="NEON WRECKERS // ADMIN"
        title="Streamer Control Center"
        subtitle="Operations, versioned content, and interface diagnostics"
        status={<Badge tone="warning" icon="settings">AUTHORIZED</Badge>}
        actions={<div className="inline-actions"><Button size="sm" variant="ghost" icon={<NWIcon name="diagnostics" size={15} />} onClick={() => void refresh()}>Resync</Button><Button size="sm" variant="ghost" onClick={() => void signOut()}>Sign out</Button></div>}
        profile={<ProfileChip name={me.displayName} detail="Command operator" avatarUrl={me.avatarUrl || undefined} />}
      />}
      navigation={<CommandNavigation items={navigation} value={tab} onChange={setTab} ariaLabel="Admin navigation" />}
    >
      <div className="admin-page" key={tab}>{pages[tab]}</div>
      <ConfirmWindow open={confirmSpawn} onClose={() => setConfirmSpawn(false)} onConfirm={() => void spawn()} title="Spawn a fresh wreck?" confirmLabel="Spawn wreck" tone="warning"><p>This invokes the existing administrative spawn action and may replace the current salvage target.</p></ConfirmWindow>
    </AppShell>
  );
}

function AccessDenied({ reason }: { reason: string }) {
  return (
    <main className="admin-access">
      <Panel depth="high" tone="danger">
        <SectionTitle eyebrow="ACCESS CONTROL" title="Admin session unavailable" icon="danger" />
        <Notification title="Command access denied" tone="danger">{reason}</Notification>
        <Button variant="primary" onClick={() => { window.location.href = '/'; }}>Open main interface</Button>
      </Panel>
    </main>
  );
}

function OperationsPage({ station, health, onSpawn, onRefresh, onTrigger, onReset, onSubscribeTwitch }: { station: StationSummary | null; health: LoyaltyHealth | null; onSpawn: () => void; onRefresh: () => void; onTrigger: (slug: string) => void; onReset: (slug: string) => void; onSubscribeTwitch: () => void }) {
  const integrationTone = health?.ok ? 'success' : 'warning';
  return (
    <div className="admin-stack">
      <SectionTitle eyebrow="LIVE OPERATIONS" title="Station Command" description="Administrative controls use the existing API surface without client-side game logic." icon="station" action={<Button variant="ghost" icon={<NWIcon name="diagnostics" size={15} />} onClick={onRefresh}>Refresh telemetry</Button>} />
      <ResponsiveGrid min="13rem">
        <StatusDisplay label="Population" value={station?.population ?? 0} icon="population" tone="success" />
        <StatusDisplay label="Power" value={station?.power ?? 0} unit="%" icon="power" tone="purple" />
        <StatusDisplay label="Integrity" value={station?.integrity ?? 0} unit="%" icon="integrity" tone={(station?.integrity ?? 0) < 50 ? 'warning' : 'success'} />
        <StatusDisplay label="StreamElements" value={integrationTone === 'success' ? 'ONLINE' : 'CHECK'} icon="streamelements" tone={integrationTone} />
      </ResponsiveGrid>
      <Panel tone="purple">
        <SectionTitle eyebrow="LIVE EVENTS" title="Event Triggers" description="Event cooldowns and effects are enforced by the authoritative API." icon="events" />
        <div className="admin-command-grid">{['reactor-instability', 'black-market-visit', 'ghost-ship'].map(slug => <CardCommand key={slug} slug={slug} onTrigger={onTrigger} onReset={onReset} />)}</div>
      </Panel>
      <Panel tone="info"><SectionTitle eyebrow="TWITCH EVENTSUB" title="Viewer Event Connection" description="Creates the signed webhook subscriptions for chat, follows, subscriptions, cheers, and raids." icon="twitch" /><Button onClick={onSubscribeTwitch}>Connect EventSub subscriptions</Button></Panel>
      <ResponsiveGrid min="20rem">
        <Panel tone="warning">
          <SectionTitle eyebrow="WRECK CONTROL" title="Spawn salvage target" icon="wreck" />
          <p>Creates a fresh wreck through the existing administrative action. The server remains authoritative.</p>
          <Button variant="warning" icon={<NWIcon name="wreck" size={16} />} onClick={onSpawn}>Spawn fresh wreck</Button>
        </Panel>
        <Panel tone={integrationTone}>
          <SectionTitle eyebrow="INTEGRATION HEALTH" title="StreamElements Link" icon="streamelements" />
          <IntegrationHealth health={health} />
        </Panel>
      </ResponsiveGrid>
    </div>
  );
}

function IntegrationHealth({ health }: { health: LoyaltyHealth | null }) {
  const rows = useMemo(() => Object.entries(health ?? {}).map(([key, value]) => ({ key, value: typeof value === 'object' ? JSON.stringify(value) : String(value) })), [health]);
  return <DataGrid rows={rows} getRowKey={row => row.key} empty="No health payload returned." columns={[{ key: 'key', header: 'Signal', render: row => <span className="admin-key">{row.key}</span> },{ key: 'value', header: 'Value', render: row => <span className="nw-numeric">{row.value}</span> }]} />;
}

function CardCommand({ slug, onTrigger, onReset }: { slug: string; onTrigger: (slug: string) => void; onReset: (slug: string) => void }) {
  return <Panel><strong>{slug.replaceAll('-', ' ')}</strong><p>Trigger the command or stop its active run and clear its server cooldown history.</p><div className="admin-mobile-actions"><Button size="sm" onClick={() => onTrigger(slug)}>Trigger</Button><Button size="sm" variant="ghost" onClick={() => onReset(slug)}>Stop & reset</Button></div></Panel>;
}

function ServerPage({ overview }: { overview: AdminOverview | null }) {
  if (!overview) return <LoadingScreen label="Loading server telemetry" />;
  const memoryPercent = overview.service.memory.heapTotal ? overview.service.memory.heapUsed / overview.service.memory.heapTotal * 100 : 0;
  const diskPercent = overview.service.disk ? overview.service.disk.used / overview.service.disk.total * 100 : 0;
  const free = overview.cloudSafeZone;
  return <div className="admin-stack"><SectionTitle eyebrow="HOST OBSERVABILITY" title="Server Load & Throughput" description="In-process request telemetry resets when the API restarts. Host values describe the application container." icon="diagnostics" /><ResponsiveGrid min="12rem"><StatusDisplay label="Requests / minute" value={overview.throughput.lastMinute.requestsPerMinute} icon="network" tone="info" /><StatusDisplay label="Average latency" value={overview.throughput.lastHour.averageLatencyMs} unit=" ms" icon="diagnostics" tone={overview.throughput.lastHour.averageLatencyMs > 500 ? 'warning' : 'success'} /><StatusDisplay label="Server errors / hour" value={overview.throughput.lastHour.errors} icon="danger" tone={overview.throughput.lastHour.errors ? 'danger' : 'success'} /><StatusDisplay label="Live sockets" value={overview.service.sockets} icon="network" tone="purple" /><StatusDisplay label="Players" value={overview.database.players} icon="crew" tone="info" /><StatusDisplay label="Queue backlog" value={(overview.queue.waiting ?? 0) + (overview.queue.delayed ?? 0)} icon="events" tone="warning" /></ResponsiveGrid><ResponsiveGrid min="20rem"><Panel><SectionTitle eyebrow="RESOURCE LOAD" title="Process & Disk" icon="terminal" /><div className="admin-meter"><span>Heap memory</span><strong>{formatBytes(overview.service.memory.heapUsed)} / {formatBytes(overview.service.memory.heapTotal)} ({memoryPercent.toFixed(1)}%)</strong></div><div className="admin-meter"><span>Container disk</span><strong>{overview.service.disk ? `${formatBytes(overview.service.disk.used)} / ${formatBytes(overview.service.disk.total)} (${diskPercent.toFixed(1)}%)` : 'Unavailable'}</strong></div><div className="admin-meter"><span>Load average 1 / 5 / 15m</span><strong>{overview.service.loadAverage.map(value => value.toFixed(2)).join(' / ')} across {overview.service.cpuCount} visible CPUs</strong></div><div className="admin-meter"><span>API uptime</span><strong>{formatDuration(overview.service.uptimeSeconds)}</strong></div></Panel><Panel><SectionTitle eyebrow="WORKLOAD" title="Database & Queue" icon="data" /><DataGrid rows={[...Object.entries(overview.database), ...Object.entries(overview.queue)].map(([key, value]) => ({ key, value }))} getRowKey={row => row.key} columns={[{ key: 'signal', header: 'Signal', render: row => row.key }, { key: 'value', header: 'Value', align: 'right', render: row => <span className="nw-numeric">{row.value}</span> }]} /></Panel></ResponsiveGrid><Panel tone="info"><SectionTitle eyebrow="GOOGLE CLOUD SAFE ZONE" title="Compute Engine Free Tier Guardrail" icon="credits" /><p>Configured reference: one non-preemptible <strong>{free.machine}</strong> for the month in {free.eligibleRegions.join(', ')}, {free.standardDiskGbMonth} GB-month standard persistent disk, and {free.outboundGbMonth} GB/month eligible outbound transfer.</p><ResponsiveGrid min="14rem"><StatusDisplay label="VM overage estimate" value={`$${free.estimatedOverage.vmUsdPerHour.toFixed(2)}`} unit=" / hour" icon="credits" tone="warning" /><StatusDisplay label="Disk beyond 30 GB" value={`$${free.estimatedOverage.standardDiskUsdPerGbMonth.toFixed(2)}`} unit=" / GB-month" icon="storage" tone="warning" /><StatusDisplay label="Premium egress estimate" value={`$${free.estimatedOverage.premiumEgressUsdPerGbFrom.toFixed(2)}+`} unit=" / GB" icon="network" tone="warning" /></ResponsiveGrid><p className="admin-fineprint">A full extra month at the displayed starting VM rate is roughly ${(free.estimatedOverage.vmUsdPerHour * 730).toLocaleString(undefined, { style: 'currency', currency: 'USD' })}, before storage and network. {free.disclaimer}</p></Panel></div>;
}

function TimersPage({ overview, refresh, pushToast }: { overview: AdminOverview | null; refresh: () => Promise<void>; pushToast: PushToast }) {
  const resolveNow = async (id: string) => { if (!window.confirm('Resolve this expedition immediately?')) return; try { await requestApi(`/api/v1/expeditions/${id}/resolve-now`, { method: 'POST' }); pushToast({ title: 'Expedition timer resolved', tone: 'success' }); await refresh(); } catch (error) { pushToast({ title: 'Timer command failed', message: errorMessage(error), tone: 'danger' }); } };
  return <div className="admin-stack"><SectionTitle eyebrow="SCHEDULE CONTROL" title="Active Expedition Timers" description="Force an overdue or stuck expedition into its server-calculated resolved state. Players must still claim their rewards." icon="events" /><Panel><DataGrid rows={overview?.timers ?? []} getRowKey={row => row.id} empty="No active expedition timers." columns={[{ key: 'player', header: 'Player', render: row => <strong>{row.playerName}</strong> }, { key: 'mission', header: 'Mission', render: row => row.name }, { key: 'return', header: 'Scheduled return', render: row => new Date(row.resolvesAt).toLocaleString() }, { key: 'control', header: 'Control', align: 'right', render: row => <Button size="sm" variant="warning" onClick={() => void resolveNow(row.id)}>Resolve now</Button> }]} /></Panel><Notification title="Other command timers" tone="info">Player crafting, salvage, scan, station-maintenance, and career timers are listed and reset from the Players workspace. Live-event timers are stopped and reset from Operations.</Notification></div>;
}

function PlayersPage({ players, refresh, pushToast }: { players: AdminPlayer[]; refresh: () => Promise<void>; pushToast: PushToast }) {
  const [query, setQuery] = useState(''); const [selected, setSelected] = useState<AdminPlayer | null>(players[0] ?? null); const [credits, setCredits] = useState(0); const [xp, setXp] = useState(0); const [reputation, setReputation] = useState(0); const [reason, setReason] = useState('Operator correction');
  useEffect(() => { if (!selected && players[0]) setSelected(players[0]); }, [players, selected]);
  const visible = players.filter(player => `${player.displayName} ${player.twitchLogin}`.toLowerCase().includes(query.toLowerCase()));
  const post = async (path: string, body: unknown, success: string) => { try { await requestApi(path, { method: 'POST', body: JSON.stringify(body) }); pushToast({ title: success, tone: 'success' }); await refresh(); } catch (error) { pushToast({ title: 'Admin command failed', message: errorMessage(error), tone: 'danger' }); } };
  return <div className="admin-stack"><SectionTitle eyebrow="PLAYER ADMINISTRATION" title="Accounts, Balances & Cooldowns" description="All changes require a reason and are written to the audit log." icon="crew" /><Field label="Find player"><Input value={query} onChange={event => setQuery(event.target.value)} placeholder="Display name or Twitch login" /></Field><div className="admin-player-layout"><Panel><div className="admin-player-list">{visible.map(player => <button key={player.id} className={`admin-player-button ${selected?.id === player.id ? 'is-selected' : ''}`} onClick={() => setSelected(player)}><strong>{player.displayName}</strong><span>@{player.twitchLogin} · L{player.level}</span><small>{player.credits.toLocaleString()} cr · {player.cooldowns.length} cooldowns</small></button>)}</div></Panel>{selected && <Panel><SectionTitle eyebrow="SELECTED PLAYER" title={selected.displayName} icon="crew" /><ResponsiveGrid min="9rem"><StatusDisplay compact label="Credits" value={selected.credits} icon="credits" tone="success" /><StatusDisplay compact label="XP" value={selected.xp} icon="data" tone="info" /><StatusDisplay compact label="Reputation" value={selected.reputation} icon="museum" tone="purple" /></ResponsiveGrid><Field label="Required audit reason"><Input value={reason} onChange={event => setReason(event.target.value)} /></Field><ResponsiveGrid min="9rem"><Field label="Credit adjustment"><Input type="number" value={credits} onChange={event => setCredits(Number(event.target.value))} /></Field><Field label="XP adjustment"><Input type="number" value={xp} onChange={event => setXp(Number(event.target.value))} /></Field><Field label="Reputation adjustment"><Input type="number" value={reputation} onChange={event => setReputation(Number(event.target.value))} /></Field></ResponsiveGrid><Button fullWidth onClick={() => void post(`/api/v1/admin/players/${selected.id}/adjust`, { credits, xp, reputation, reason }, 'Player balances updated')}>Apply adjustments</Button><SectionTitle eyebrow="ACTION TIMERS" title="Active Cooldowns" icon="events" /><div className="admin-cooldowns">{selected.cooldowns.map(cooldown => <div key={cooldown.id}><span>{cooldown.actionKey}</span><strong>{new Date(cooldown.expiresAt).toLocaleString()}</strong><Button size="sm" variant="ghost" onClick={() => void post(`/api/v1/admin/players/${selected.id}/cooldowns/reset`, { actionKey: cooldown.actionKey, reason }, 'Cooldown reset')}>Reset</Button></div>)}</div><Button variant="warning" fullWidth disabled={!selected.cooldowns.length} onClick={() => void post(`/api/v1/admin/players/${selected.id}/cooldowns/reset`, { reason }, 'All cooldowns reset')}>Reset every player timer</Button></Panel>}</div></div>;
}

function TransactionsPage({ transactions, refresh, pushToast }: { transactions: LoyaltyTransaction[]; refresh: () => Promise<void>; pushToast: PushToast }) {
  const [reason, setReason] = useState('Operator-approved point refund');
  const refund = async (transaction: LoyaltyTransaction) => { if (!window.confirm(`Refund ${transaction.amount} points to ${transaction.user.displayName}?`)) return; try { await requestApi(`/api/v1/admin/transactions/${transaction.id}/refund`, { method: 'POST', body: JSON.stringify({ reason }) }); pushToast({ title: 'Points refunded', message: `${transaction.amount} points returned to ${transaction.user.displayName}.`, tone: 'success' }); await refresh(); } catch (error) { pushToast({ title: 'Refund failed', message: errorMessage(error), tone: 'danger' }); } };
  return <div className="admin-stack"><SectionTitle eyebrow="FINANCIAL OPERATIONS" title="Point Transactions & Refunds" description="Refunds credit StreamElements first and update the local ledger only after confirmation." icon="credits" /><Field label="Required refund reason"><Input value={reason} onChange={event => setReason(event.target.value)} /></Field><Panel><DataGrid rows={transactions} getRowKey={row => row.id} empty="No point transactions." columns={[{ key: 'player', header: 'Player', render: row => <strong>{row.user.displayName}</strong> }, { key: 'action', header: 'Command', render: row => row.actionSlug }, { key: 'amount', header: 'Points', align: 'right', render: row => row.amount }, { key: 'status', header: 'Status', render: row => <Badge tone={row.status === 'committed' ? 'success' : row.status === 'ambiguous' ? 'warning' : 'neutral'}>{row.status}</Badge> }, { key: 'time', header: 'Created', render: row => new Date(row.createdAt).toLocaleString() }, { key: 'refund', header: 'Control', align: 'right', render: row => <Button size="sm" variant="warning" disabled={!['committed', 'ambiguous'].includes(row.status) || reason.length < 3} onClick={() => void refund(row)}>Refund</Button> }]} /></Panel></div>;
}

function formatBytes(bytes: number) { if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'; const units = ['B', 'KB', 'MB', 'GB', 'TB']; const index = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024))); return `${(bytes / 1024 ** index).toFixed(index > 1 ? 1 : 0)} ${units[index]}`; }
function formatDuration(seconds: number) { const days = Math.floor(seconds / 86400); const hours = Math.floor(seconds % 86400 / 3600); const minutes = Math.floor(seconds % 3600 / 60); return `${days}d ${hours}h ${minutes}m`; }

function ConfigPage({ config, publish }: { config: ConfigVersion[]; publish: (event: FormEvent<HTMLFormElement>) => void }) {
  const [mode, setMode] = useState('editor');
  return (
    <div className="admin-stack">
      <SectionTitle eyebrow="VERSIONED CONTENT" title="Configuration Registry" description="Create audited drafts and inspect recent content versions." icon="data" />
      <Tabs value={mode} onChange={setMode} items={[{ id: 'editor', label: 'Draft editor', icon: 'terminal' },{ id: 'history', label: 'Version history', icon: 'archive' }]} />
      {mode === 'editor' ? <form onSubmit={publish}><Panel depth="medium"><Field label="Configuration slug" hint="Stable identifier for the versioned config record" required><Input name="slug" defaultValue="balance.patch" required /></Field><Field label="Lifecycle" required><Select name="lifecycle" defaultValue="draft"><option value="draft">Draft</option><option value="scheduled">Scheduled</option><option value="active">Active</option><option value="retired">Retired</option><option value="archived">Archived</option></Select></Field><Field label="JSON payload" hint="Validated by the existing admin endpoint" required><Textarea className="admin-json" name="json" defaultValue={'{\n  "note": "Describe the intended content change here"\n}'} spellCheck={false} /></Field><Button variant="primary" icon={<NWIcon name="data" size={16} />}>Validate and save draft</Button></Panel></form> : <Panel><DataGrid rows={config} getRowKey={row => row.id} empty="No configuration versions found." columns={[{ key: 'slug', header: 'Slug', render: row => <strong>{row.slug}</strong> },{ key: 'version', header: 'Version', render: row => <span className="nw-numeric">{row.version}</span> },{ key: 'lifecycle', header: 'Lifecycle', render: row => <Badge tone={lifecycleTone(row.lifecycle)}>{row.lifecycle}</Badge> },{ key: 'created', header: 'Created', render: row => new Date(row.createdAt).toLocaleString() }]} /></Panel>}
    </div>
  );
}

function lifecycleTone(lifecycle: string) {
  if (lifecycle === 'active') return 'success' as const;
  if (lifecycle === 'scheduled') return 'info' as const;
  if (lifecycle === 'retired' || lifecycle === 'archived') return 'neutral' as const;
  return 'warning' as const;
}

createRoot(document.getElementById('root')!).render(<Root />);
