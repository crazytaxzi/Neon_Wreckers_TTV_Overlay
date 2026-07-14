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

const navigation: TabItem[] = [
  { id: 'operations', label: 'Operations', icon: 'station' },
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
  const [confirmSpawn, setConfirmSpawn] = useState(false);
  const { pushToast } = useToast();

  const refresh = useCallback(async () => {
    const [stationData, healthData, configData] = await Promise.all([
      requestApi<StationSummary>('/api/v1/station'),
      requestApi<LoyaltyHealth>('/api/v1/integrations/streamelements/health'),
      requestApi<ConfigVersion[]>('/api/v1/admin/config')
    ]);
    setStation(stationData);
    setHealth(healthData);
    setConfig(configData);
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

  if (me === undefined) return <LoadingScreen label="Opening Streamer Control Center" detail="Verifying operator permissions and station telemetry." />;
  if (!me) return <AccessDenied reason="Sign in through the main Neon Wreckers interface, then reopen the Streamer Control Center." />;
  if (!me.roles.some(role => role === 'admin' || role === 'streamer')) {
    return <AccessDenied reason="This interface requires the streamer or administrator role." />;
  }

  const pages: Record<string, ReactNode> = {
    operations: <OperationsPage station={station} health={health} onSpawn={() => setConfirmSpawn(true)} onRefresh={() => void refresh()} />,
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
        actions={<Button size="sm" variant="ghost" icon={<NWIcon name="diagnostics" size={15} />} onClick={() => void refresh()}>Resync</Button>}
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

function OperationsPage({ station, health, onSpawn, onRefresh }: { station: StationSummary | null; health: LoyaltyHealth | null; onSpawn: () => void; onRefresh: () => void }) {
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
