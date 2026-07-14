import { useCallback, useEffect, useState, type ChangeEvent, type CSSProperties, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { errorMessage, requestApi } from '@neon-wreckers/browser-client';
import {
  AppShell,
  Badge,
  Button,
  Card,
  CommandHeader,
  CommandNavigation,
  ConfirmWindow,
  DataGrid,
  Field,
  HealthBar,
  InventoryCard,
  LoadingScreen,
  Meter,
  ModuleCard,
  Notification,
  NWIcon,
  Panel,
  Pill,
  PopulationDisplay,
  ProfileChip,
  ProgressBar,
  ResponsiveGrid,
  ScrollableList,
  SectionTitle,
  Select,
  SliderControl,
  SplitLayout,
  StatusDisplay,
  ThemeProvider,
  ToastProvider,
  ToggleSwitch,
  Tooltip,
  defaultTheme,
  highContrastTheme,
  type IconName,
  type TabItem,
  type Tone,
  useToast
} from '@neon-wreckers/ui';
import './styles.css';

type Player = {
  level: number;
  title: string;
  career: string;
  credits: number;
};

type CurrentUser = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  roles: string[];
  player: Player | null;
};

type Plaque = {
  id: string;
  title: string;
  body: string;
  playerDisplayName: string | null;
  createdAt: string;
};

type StationModule = {
  slug: string;
  name: string;
  level: number;
  state: string;
  progress: number;
  integrity: number;
  visualKey: string;
  effects: Record<string, unknown>;
  plaques: Plaque[];
};

type StationAlert = {
  id: string;
  severity: string;
  title: string;
  body: string;
  createdAt: string;
};

type Station = {
  id: string;
  slug: string;
  name: string;
  level: number;
  population: number;
  power: number;
  morale: number;
  integrity: number;
  storageCapacity: number;
  storageUsed: number;
  threatLevel: string | number;
  activeSeason: string | null;
  resources: Record<string, number>;
  modules: StationModule[];
  alerts: StationAlert[];
  activeModifiers: unknown[];
};

type Wreck = {
  id: string;
  archetype: string;
  name: string;
  description: string;
  risk: string;
  integrity: number;
  depleted: boolean;
  visualKey: string;
  remainingLootBudget: number;
  createdAt: string;
  updatedAt: string;
};

type InventoryItem = {
  id: string;
  itemSlug: string;
  name: string;
  quantity: number;
  rarity: string;
  visualKey: string;
  updatedAt: string;
};

type Ship = {
  id: string;
  name: string;
  classSlug: string;
  condition: number;
  fuel: number;
  cargoCapacity: number;
  upgrades: string[];
  visualKey: string;
  createdAt: string;
};

type CrewMember = {
  id: string;
  name: string;
  role: string;
  level: number;
  morale: number;
  injuredUntil: string | null;
  traits: string[];
};

type Expedition = {
  id: string;
  definition: string;
  name: string;
  status: string;
  risk: string;
  launchedAt: string | null;
  resolvesAt: string | null;
  rewards: unknown[];
  incidentLog: string[];
  createdAt: string;
  updatedAt: string;
};

type HistoryEntry = {
  id: string;
  category: string;
  title: string;
  body: string;
  actorDisplayName: string | null;
  createdAt: string;
};

type PlayerNotification = {
  id: string;
  type: string;
  priority: number;
  title: string;
  body: string;
  deepLink: string | null;
  readAt: string | null;
  expiresAt: string | null;
  createdAt: string;
};

type MarketplaceListing = {
  slug: string;
  name: string;
  priceCredits: number;
  itemSlug: string;
  quantity: number;
};

type Marketplace = {
  unlocked: boolean;
  listings: MarketplaceListing[];
};

type QuartersObject = {
  key: string;
  x: number;
  y: number;
};

type Quarters = {
  playerId: string;
  layout: {
    theme: string;
    objects: QuartersObject[];
  };
};

type UiPreferences = {
  reducedMotion: boolean;
  highContrast: boolean;
  lowEffects: boolean;
  largeText: boolean;
  glowIntensity: number;
};

type ActionHandler = (path: string, payload?: unknown, label?: string) => Promise<unknown | undefined>;

type GameData = {
  me: CurrentUser;
  station: Station | null;
  wreck: Wreck | null;
  inventory: InventoryItem[];
  ships: Ship[];
  crew: CrewMember[];
  history: HistoryEntry[];
  expeditions: Expedition[];
  notifications: PlayerNotification[];
  marketplace: Marketplace | null;
  quarters: Quarters | null;
  login: () => void;
  action: ActionHandler;
  refresh: () => Promise<void>;
};

type RealtimeMessage =
  | { type: 'station.updated'; station: Station }
  | { type: 'wreck.updated'; wreck: Wreck }
  | { type: 'history.added'; entry: HistoryEntry };

const WS_URL = (() => {
  const url = new URL('/api/v1/ws', window.location.origin);
  url.protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return url.toString();
})();

const defaultPreferences: UiPreferences = {
  reducedMotion: false,
  highContrast: false,
  lowEffects: false,
  largeText: false,
  glowIntensity: 72
};

function parseRealtimeMessage(value: unknown): RealtimeMessage | null {
  if (typeof value !== 'string') return null;
  try {
    const message = JSON.parse(value) as Partial<RealtimeMessage>;
    return typeof message.type === 'string' ? message as RealtimeMessage : null;
  } catch {
    return null;
  }
}

function loadPreferences(): UiPreferences {
  try {
    const stored = JSON.parse(localStorage.getItem('nw-ui-preferences') ?? '{}') as Partial<UiPreferences>;
    return { ...defaultPreferences, ...stored };
  } catch {
    return defaultPreferences;
  }
}

function useGameData(): Omit<GameData, 'me'> & { me: CurrentUser | null | undefined } {
  const [me, setMe] = useState<CurrentUser | null>();
  const [station, setStation] = useState<Station | null>(null);
  const [wreck, setWreck] = useState<Wreck | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [ships, setShips] = useState<Ship[]>([]);
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [expeditions, setExpeditions] = useState<Expedition[]>([]);
  const [notifications, setNotifications] = useState<PlayerNotification[]>([]);
  const [marketplace, setMarketplace] = useState<Marketplace | null>(null);
  const [quarters, setQuarters] = useState<Quarters | null>(null);
  const { pushToast } = useToast();

  const refresh = useCallback(async () => {
    setMe(await requestApi<CurrentUser>('/api/v1/me'));
    const [stationResult, wreckResult, inventoryResult, shipsResult, crewResult, historyResult, expeditionsResult, notificationsResult, marketplaceResult, quartersResult] = await Promise.allSettled([
      requestApi<Station>('/api/v1/station'),
      requestApi<Wreck>('/api/v1/wrecks/current'),
      requestApi<InventoryItem[]>('/api/v1/inventory'),
      requestApi<Ship[]>('/api/v1/ships'),
      requestApi<CrewMember[]>('/api/v1/crew'),
      requestApi<HistoryEntry[]>('/api/v1/history'),
      requestApi<Expedition[]>('/api/v1/expeditions'),
      requestApi<PlayerNotification[]>('/api/v1/notifications'),
      requestApi<Marketplace>('/api/v1/marketplace/listings'),
      requestApi<Quarters>('/api/v1/quarters')
    ]);
    if (stationResult.status === 'fulfilled') setStation(stationResult.value);
    if (wreckResult.status === 'fulfilled') setWreck(wreckResult.value);
    if (inventoryResult.status === 'fulfilled') setInventory(inventoryResult.value);
    if (shipsResult.status === 'fulfilled') setShips(shipsResult.value);
    if (crewResult.status === 'fulfilled') setCrew(crewResult.value);
    if (historyResult.status === 'fulfilled') setHistory(historyResult.value);
    if (expeditionsResult.status === 'fulfilled') setExpeditions(expeditionsResult.value);
    if (notificationsResult.status === 'fulfilled') setNotifications(notificationsResult.value);
    if (marketplaceResult.status === 'fulfilled') setMarketplace(marketplaceResult.value);
    if (quartersResult.status === 'fulfilled') setQuarters(quartersResult.value);
  }, []);

  useEffect(() => {
    void refresh().catch(() => setMe(null));
  }, [refresh]);

  useEffect(() => {
    const socket = new WebSocket(WS_URL);
    socket.onmessage = event => {
      const message = parseRealtimeMessage(event.data);
      if (!message) return;
      if (message.type === 'station.updated') setStation(message.station);
      if (message.type === 'wreck.updated') setWreck(message.wreck);
      if (message.type === 'history.added') setHistory(current => [message.entry, ...current].slice(0, 50));
    };
    return () => socket.close();
  }, []);

  const login = () => {
    window.location.href = '/api/v1/auth/twitch/start';
  };

  const action = useCallback<ActionHandler>(async (path, payload, label = 'Operation complete') => {
    try {
      const data = await requestApi<unknown>(path, {
        method: 'POST',
        body: payload == null ? undefined : JSON.stringify(payload)
      });
      pushToast({ title: label, tone: 'success' });
      await refresh();
      return data;
    } catch (error) {
      pushToast({
        title: 'Command rejected',
        message: errorMessage(error),
        tone: 'danger'
      });
      return undefined;
    }
  }, [pushToast, refresh]);

  return { me, station, wreck, inventory, ships, crew, history, expeditions, notifications, marketplace, quarters, login, action, refresh };
}

const navigation: TabItem[] = [
  { id: 'station', label: 'Station', icon: 'station' },
  { id: 'salvage', label: 'Salvage', icon: 'salvage' },
  { id: 'inventory', label: 'Hold', icon: 'inventory' },
  { id: 'construction', label: 'Build', icon: 'construction' },
  { id: 'crew', label: 'Crew', icon: 'crew' },
  { id: 'ships', label: 'Ships', icon: 'expedition' },
  { id: 'expeditions', label: 'Expeditions', icon: 'scanner' },
  { id: 'museum', label: 'Museum', icon: 'museum' },
  { id: 'history', label: 'History', icon: 'archive' },
  { id: 'notifications', label: 'Alerts', icon: 'notifications' },
  { id: 'market', label: 'Trade', icon: 'trade' },
  { id: 'quarters', label: 'Quarters', icon: 'module' },
  { id: 'profile', label: 'Profile', icon: 'twitch' },
  { id: 'settings', label: 'Settings', icon: 'settings' }
];

function Root() {
  const [preferences, setPreferences] = useState<UiPreferences>(loadPreferences);
  useEffect(() => {
    localStorage.setItem('nw-ui-preferences', JSON.stringify(preferences));
    const root = document.documentElement;
    root.dataset.reducedMotion = String(preferences.reducedMotion);
    root.dataset.lowEffects = String(preferences.lowEffects);
    root.dataset.largeText = String(preferences.largeText);
    root.style.setProperty('--nw-user-glow', `${preferences.glowIntensity / 100}`);
  }, [preferences]);
  const updatePreferences = (patch: Partial<UiPreferences>) => setPreferences(current => ({ ...current, ...patch }));

  return (
    <ThemeProvider theme={preferences.highContrast ? highContrastTheme : defaultTheme}>
      <ToastProvider>
        <GameApp preferences={preferences} updatePreferences={updatePreferences} />
      </ToastProvider>
    </ThemeProvider>
  );
}

function GameApp({ preferences, updatePreferences }: { preferences: UiPreferences; updatePreferences: (patch: Partial<UiPreferences>) => void }) {
  const game = useGameData();
  const [tab, setTab] = useState('station');

  if (game.me === undefined) {
    return <LoadingScreen label="Synchronizing Station Zero" detail="Negotiating identity, telemetry, wreck state, and community systems." />;
  }

  if (!game.me) {
    return <LoginScreen onLogin={game.login} />;
  }

  const me = game.me;
  const pageProps: GameData = { ...game, me };
  const pages: Record<string, ReactNode> = {
    station: <StationPage {...pageProps} />,
    salvage: <SalvagePage {...pageProps} />,
    inventory: <InventoryPage {...pageProps} />,
    construction: <ConstructionPage {...pageProps} />,
    crew: <CrewPage {...pageProps} />,
    ships: <ShipsPage {...pageProps} />,
    expeditions: <ExpeditionPage {...pageProps} />,
    museum: <MuseumPage {...pageProps} />,
    history: <HistoryPage {...pageProps} />,
    notifications: <NotificationsPage notifications={game.notifications} />,
    market: <MarketPage marketplace={game.marketplace} credits={me.player?.credits ?? 0} />,
    quarters: <QuartersPage me={me} quarters={game.quarters} />,
    profile: <ProfilePage me={me} />,
    settings: <SettingsPage preferences={preferences} updatePreferences={updatePreferences} />
  };

  return (
    <AppShell
      header={<CommandHeader
        title="Station Zero Command Mesh"
        subtitle="Community salvage and orbital reconstruction network"
        status={<Badge tone="success" icon="network">LIVE LINK</Badge>}
        actions={<Tooltip content="Refresh station telemetry"><Button variant="ghost" size="sm" icon={<NWIcon name="diagnostics" size={15} />} onClick={() => void game.refresh()}>Resync</Button></Tooltip>}
        profile={<ProfileChip name={me.displayName} detail={`Rank ${me.player?.level ?? 1} · ${me.player?.title ?? 'Wrecker'}`} avatarUrl={me.avatarUrl || undefined} />}
      />}
      navigation={<CommandNavigation items={navigation} value={tab} onChange={setTab} />}
    >
      <div className="game-page" key={tab}>{pages[tab] ?? pages.station}</div>
    </AppShell>
  );
}

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  return (
    <main className="login-screen">
      <div className="login-screen__grid" aria-hidden="true" />
      <Panel depth="high" className="login-console">
        <div className="login-console__sigil"><NWIcon name="station" size={58} /></div>
        <span className="nw-eyebrow">IDENTITY GATEWAY</span>
        <h1>Neon Wreckers</h1>
        <p>Connect a Twitch identity to enter the Station Zero command mesh. Authentication is handled by the existing secure gateway.</p>
        <Button size="lg" variant="primary" icon={<NWIcon name="twitch" size={19} />} onClick={onLogin} fullWidth>Authenticate with Twitch</Button>
        <div className="login-console__status"><Badge tone="success">Gateway online</Badge><span>Secure Twitch session required for command access.</span></div>
      </Panel>
    </main>
  );
}

function StationPage({ station, wreck, inventory, history }: GameData) {
  const scrap = inventory.find(item => item.itemSlug === 'scrap')?.quantity ?? 0;
  return (
    <div className="page-stack">
      <SectionTitle eyebrow="ORBITAL COMMAND" title={station?.name ?? 'Station Zero'} description="Live station condition, active wreck telemetry, inventory readiness, and permanent community history." icon="station" />
      <ResponsiveGrid min="13rem" className="status-rack">
        <PopulationDisplay current={station?.population ?? 0} trend={0} />
        <StatusDisplay label="Power Reserve" value={station?.power ?? 0} unit="%" icon="power" tone={toneForValue(station?.power)} detail="Grid synchronized" />
        <StatusDisplay label="Hull Integrity" value={station?.integrity ?? 0} unit="%" icon="integrity" tone={toneForValue(station?.integrity)} detail={(station?.integrity ?? 0) < 50 ? 'Repair priority' : 'Pressure stable'} />
        <StatusDisplay label="Construction Stock" value={scrap} unit=" scrap" icon="resources" tone="info" detail="Personal hold" />
      </ResponsiveGrid>
      <SplitLayout ratio="minmax(0, 1.55fr) minmax(20rem, .85fr)">
        <StationSchematic station={station} />
        <div className="side-stack">
          <WreckPanel wreck={wreck} />
          <Panel>
            <SectionTitle eyebrow="PERSONAL HOLD" title="Ready Materials" icon="inventory" />
            <div className="compact-inventory">
              {inventory.slice(0, 4).map(item => <InventoryCard key={item.itemSlug} name={item.name} quantity={item.quantity} rarity={item.rarity} icon={itemIcon(item.itemSlug)} />)}
            </div>
          </Panel>
        </div>
      </SplitLayout>
      <Panel>
        <SectionTitle eyebrow="PERMANENT RECORD" title="Station Feed" description="Recent events written by server-side game systems." icon="events" />
        <HistoryList history={history} />
      </Panel>
    </div>
  );
}

function StationSchematic({ station }: { station: Station | null }) {
  const modules = station?.modules ?? [];
  return (
    <Panel depth="medium" className="station-schematic">
      <div className="station-schematic__header"><Badge tone="info">TACTICAL SCHEMATIC</Badge><span className="nw-numeric">ORBIT // ZERO-01</span></div>
      <div className="station-orbit" aria-label="Station Zero operational schematic">
        <div className="station-orbit__grid" />
        <div className="station-orbit__ring station-orbit__ring--outer" />
        <div className="station-orbit__ring station-orbit__ring--inner" />
        <div className="station-core"><NWIcon name="station" size={36} /><strong>ZERO</strong><small>COMMAND CORE</small></div>
        {modules.map((module, index) => {
          const angle = (360 / Math.max(modules.length, 1)) * index - 90;
          return <div key={module.slug} className={`station-node is-${module.state}`} style={{ '--node-angle': `${angle}deg`, '--node-radius': index % 2 ? '38%' : '45%' } as CSSProperties}><span><NWIcon name={moduleIcon(module.slug)} size={16} /><b>{module.name}</b><i>{module.state}</i></span></div>;
        })}
      </div>
      <ResponsiveGrid min="10rem" className="station-schematic__footer">
        <Meter label="Reactor load" value={station?.power ?? 0} tone="purple" />
        <HealthBar label="Pressure hull" value={station?.integrity ?? 0} />
      </ResponsiveGrid>
    </Panel>
  );
}

function WreckPanel({ wreck }: { wreck: Wreck | null }) {
  const tone = riskTone(wreck?.risk);
  return (
    <Panel tone={tone} className="wreck-panel">
      <SectionTitle eyebrow="SALVAGE TARGET" title={wreck?.name ?? 'Scanning local debris field'} icon="wreck" action={<Badge tone={tone}>{wreck?.risk ?? 'unknown'}</Badge>} />
      <div className="wreck-scan"><NWIcon name="wreck" size={70} /><span /><span /><span /><strong className="nw-numeric">{wreck?.integrity ?? 0}%</strong></div>
      <p>{wreck?.description ?? 'Awaiting server telemetry.'}</p>
      <HealthBar label="Remaining hull" value={wreck?.integrity ?? 0} />
    </Panel>
  );
}

function SalvagePage({ wreck, action }: Pick<GameData, 'wreck' | 'action'>) {
  const [confirmOverride, setConfirmOverride] = useState(false);
  return (
    <div className="page-stack">
      <SectionTitle eyebrow="WRECK OPERATIONS" title="Salvage Control" description="All rolls, costs, rewards, and damage remain authoritative on the server." icon="salvage" />
      <SplitLayout ratio="minmax(0, 1.35fr) minmax(20rem, .65fr)">
        <Panel depth="medium">
          <ResponsiveGrid min="15rem" className="action-matrix">
            <CommandAction icon="scanner" title="Active Scan" detail="Acquire and profile the next salvage opportunity." onClick={() => void action('/api/v1/salvage/scan', undefined, 'Signal acquired')} />
            <CommandAction icon="salvage" title="Deploy Cutters" detail="Execute the standard salvage profile." onClick={() => void action('/api/v1/salvage/deploy', { mode: 'cutters' }, 'Cutters deployed')} />
            <CommandAction icon="cargo" title="Recover Cargo" detail="Prioritize high-value internal cargo compartments." onClick={() => void action('/api/v1/salvage/deploy', { mode: 'cargo' }, 'Cargo team launched')} tone="info" />
            <CommandAction icon="danger" title="Safety Override" detail="Engage the existing high-risk deployment mode." onClick={() => setConfirmOverride(true)} tone="danger" />
          </ResponsiveGrid>
          <Notification title="Server authority active" tone="info" icon="network">The interface submits commands only. It does not calculate outcomes, rewards, cooldowns, or balance.</Notification>
        </Panel>
        <WreckPanel wreck={wreck} />
      </SplitLayout>
      <ConfirmWindow open={confirmOverride} onClose={() => setConfirmOverride(false)} onConfirm={() => { setConfirmOverride(false); void action('/api/v1/salvage/deploy', { mode: 'override' }, 'Override engaged'); }} title="Engage safety override?" confirmLabel="Engage override" tone="danger"><p>This command uses the existing high-risk salvage mode. Server restrictions and costs still apply.</p></ConfirmWindow>
    </div>
  );
}

function ConstructionPage({ station, inventory, action }: Pick<GameData, 'station' | 'inventory' | 'action'>) {
  const modules = station?.modules ?? [];
  const activeProject = modules.find(module => module.state === 'building') ?? modules.find(module => module.slug === 'habitat-ring');
  return (
    <div className="page-stack">
      <SectionTitle eyebrow="STRUCTURAL OPERATIONS" title="Construction Yard" description="Community module state and contribution progress, using the existing construction endpoint." icon="construction" />
      <SplitLayout ratio="minmax(0, 1.4fr) minmax(18rem, .6fr)">
        <ResponsiveGrid min="17rem">{modules.map(module => <ModuleCard key={module.slug} name={module.name} state={module.state} progress={module.progress ?? 0} icon={moduleIcon(module.slug)} />)}</ResponsiveGrid>
        <Panel tone="info" className="project-console">
          <SectionTitle eyebrow="ACTIVE PROJECT" title={activeProject?.name ?? 'No project queued'} icon="construction" />
          <ProgressBar label="Build progress" value={activeProject?.progress ?? 0} tone="info" />
          <div className="material-readout"><span>Available hold</span><strong>{inventory.map(item => `${item.name} ${item.quantity}`).join(' · ') || 'No materials'}</strong></div>
          <Button variant="primary" fullWidth icon={<NWIcon name="resources" size={16} />} disabled={!activeProject} onClick={() => void action('/api/v1/construction/contribute', { moduleSlug: activeProject?.slug ?? 'habitat-ring', scrap: 10 }, 'Materials delivered')}>Contribute 10 Hull Scrap</Button>
        </Panel>
      </SplitLayout>
    </div>
  );
}

function InventoryPage({ inventory }: Pick<GameData, 'inventory'>) {
  const [filter, setFilter] = useState('all');
  const items = filter === 'all' ? inventory : inventory.filter(item => item.rarity === filter);
  return (
    <div className="page-stack">
      <SectionTitle eyebrow="PERSONAL LOGISTICS" title="Salvage Hold" description="Recovered resources, components, relics, and station currency records." icon="inventory" action={<Field label="Rarity filter" className="inline-field"><Select value={filter} onChange={(event: ChangeEvent<HTMLSelectElement>) => setFilter(event.target.value)}><option value="all">All records</option><option value="common">Common</option><option value="uncommon">Uncommon</option><option value="rare">Rare</option><option value="legendary">Legendary</option></Select></Field>} />
      {items.length ? <ResponsiveGrid min="17rem">{items.map(item => <InventoryCard key={item.itemSlug} name={item.name} quantity={item.quantity} rarity={item.rarity} icon={itemIcon(item.itemSlug)} detail={item.visualKey} />)}</ResponsiveGrid> : <Notification title="No matching inventory" tone="info">Change the rarity filter to view other records.</Notification>}
    </div>
  );
}

function ShipsPage({ ships }: Pick<GameData, 'ships'>) {
  return (
    <div className="page-stack">
      <SectionTitle eyebrow="FLEET REGISTRY" title="Ships" description="Condition, fuel, and cargo telemetry for registered station craft." icon="expedition" />
      <ResponsiveGrid min="19rem">{ships.map(ship => <Card key={ship.id} className="ship-card"><div className="ship-card__schematic"><NWIcon name="expedition" size={50} /><span className="nw-numeric">{ship.classSlug}</span></div><div className="ship-card__head"><h3>{ship.name}</h3><Badge tone={toneForValue(ship.condition)}>{ship.condition}% condition</Badge></div><HealthBar label="Hull condition" value={ship.condition} /><div className="ship-card__stats"><StatusDisplay compact label="Cargo" value={ship.cargoCapacity} icon="cargo" tone="info" /><StatusDisplay compact label="Fuel" value={ship.fuel} icon="fuel" tone="purple" /></div></Card>)}</ResponsiveGrid>
      {!ships.length && <Notification title="No registered craft" tone="info">The fleet registry is currently empty.</Notification>}
    </div>
  );
}

function CrewPage({ crew }: Pick<GameData, 'crew'>) {
  return (
    <div className="page-stack">
      <SectionTitle eyebrow="PERSONNEL NETWORK" title="Crew Roster" description="Role, level, morale, and trait telemetry from the station crew service." icon="crew" />
      <ResponsiveGrid min="18rem">{crew.map(member => <Card key={member.id} className="crew-card"><div className="crew-card__identity"><div className="crew-ident">{member.name.slice(0, 2).toUpperCase()}</div><div><h3>{member.name}</h3><p>{member.role} · Level {member.level}</p></div><Badge tone={toneForValue(member.morale)}>{member.morale}% morale</Badge></div><ProgressBar label="Morale" value={member.morale} tone={toneForValue(member.morale)} /><div className="trait-list">{member.traits?.map((trait: string) => <Pill key={trait} tone="neutral">{trait}</Pill>)}</div></Card>)}</ResponsiveGrid>
      {!crew.length && <Notification title="No crew records" tone="info">Personnel data has not yet been assigned to this station.</Notification>}
    </div>
  );
}

function ExpeditionPage({ expeditions, action }: Pick<GameData, 'expeditions' | 'action'>) {
  return (
    <div className="page-stack">
      <SectionTitle eyebrow="DEEP FIELD" title="Expeditions" description="Launch existing expedition definitions, observe worker resolution, and claim server-calculated rewards." icon="expedition" />
      <ResponsiveGrid min="18rem" className="expedition-launchers">
        <CommandAction icon="expedition" title="Glass Belt Run" detail="Moderate-risk deployment using one fuel and two crew." onClick={() => void action('/api/v1/expeditions/launch', { definition: 'glass-belt-run' }, 'Expedition launched')} />
        <CommandAction icon="signal" title="Dead Relay Ping" detail="High-risk signal investigation using the existing definition." onClick={() => void action('/api/v1/expeditions/launch', { definition: 'dead-relay-ping' }, 'Expedition launched')} tone="purple" />
      </ResponsiveGrid>
      <Panel>
        <SectionTitle eyebrow="MISSION LEDGER" title="Deployment History" icon="archive" />
        <DataGrid rows={expeditions ?? []} getRowKey={expedition => expedition.id} empty="No expeditions have been launched." columns={[
          { key: 'name', header: 'Mission', render: expedition => <strong>{expedition.name}</strong> },
          { key: 'status', header: 'Status', render: expedition => <Badge tone={expeditionTone(expedition.status)}>{expedition.status}</Badge> },
          { key: 'log', header: 'Incident log', render: expedition => expedition.incidentLog?.join(' ') || 'Awaiting telemetry' },
          { key: 'action', header: 'Command', align: 'right', render: expedition => ['resolved', 'failed'].includes(expedition.status) ? <Button size="sm" variant="primary" onClick={() => void action(`/api/v1/expeditions/${expedition.id}/claim`, undefined, 'Expedition claimed')}>Claim</Button> : <span className="nw-numeric">LOCKED</span> }
        ]} />
      </Panel>
    </div>
  );
}

function MuseumPage({ station }: Pick<GameData, 'station'>) {
  const plaques = station?.modules.flatMap(module => module.plaques ?? []) ?? [];
  return (
    <div className="page-stack">
      <SectionTitle eyebrow="CULTURAL ARCHIVE" title="Museum & Founders Hall" description="Permanent plaques earned by the community and stored in station records." icon="museum" />
      {plaques.length ? <ResponsiveGrid min="19rem">{plaques.map(plaque => <Card key={plaque.id} className="plaque-card"><NWIcon name="museum" size={24} /><span className="nw-eyebrow">ARCHIVE PLAQUE</span><h3>{plaque.title}</h3><p>{plaque.body}</p></Card>)}</ResponsiveGrid> : <Notification title="No plaques installed" tone="info" icon="museum">Community milestones will appear here when the existing game systems create them.</Notification>}
    </div>
  );
}

function HistoryPage({ history }: Pick<GameData, 'history'>) {
  return (
    <div className="page-stack">
      <SectionTitle eyebrow="STATION MEMORY" title="Permanent History" description="A readable command-log view of server-persisted station events." icon="archive" />
      <Panel><HistoryList history={history} limit={50} /></Panel>
    </div>
  );
}

function NotificationsPage({ notifications }: { notifications: PlayerNotification[] }) {
  const unread = notifications.filter(notification => !notification.readAt).length;
  return (
    <div className="page-stack">
      <SectionTitle eyebrow="PERSONAL SIGNALS" title="Notifications" description="Server-persisted notices for this authenticated wrecker." icon="notifications" action={<Badge tone={unread ? 'warning' : 'success'}>{unread} unread</Badge>} />
      {notifications.length ? <Panel><ScrollableList label="Player notifications" maxHeight="68vh">{notifications.map(notification => (
        <Notification key={notification.id} title={notification.title} tone={notificationTone(notification)} icon="notifications">
          {notification.body}
          <span className="notification-meta nw-numeric">{notification.type.toUpperCase()} · {new Date(notification.createdAt).toLocaleString()}{notification.readAt ? ' · READ' : ' · UNREAD'}</span>
        </Notification>
      ))}</ScrollableList></Panel> : <Notification title="Signal queue clear" tone="success">No personal notifications are currently stored for this account.</Notification>}
    </div>
  );
}

function MarketPage({ marketplace, credits }: { marketplace: Marketplace | null; credits: number }) {
  return (
    <div className="page-stack">
      <SectionTitle eyebrow="COMMERCE NETWORK" title="Marketplace" description="Live marketplace availability and server-provided listings." icon="trade" action={<Badge tone={marketplace?.unlocked ? 'success' : 'warning'}>{marketplace?.unlocked ? 'ONLINE' : 'LOCKED'}</Badge>} />
      <ResponsiveGrid min="13rem"><StatusDisplay label="Available Credits" value={credits.toLocaleString()} unit=" cr" icon="credits" tone="success" /><StatusDisplay label="Market State" value={marketplace?.unlocked ? 'ACTIVE' : 'OFFLINE'} icon="market" tone={marketplace?.unlocked ? 'success' : 'warning'} /><StatusDisplay label="Listings" value={marketplace?.listings.length ?? 0} icon="inventory" tone="info" /></ResponsiveGrid>
      {marketplace?.unlocked ? (marketplace.listings.length ? <Panel><DataGrid caption="Current station marketplace listings" rows={marketplace.listings} getRowKey={listing => listing.slug} columns={[
        { key: 'item', header: 'Listing', render: listing => <span className="market-listing"><NWIcon name={itemIcon(listing.itemSlug)} size={17} /><strong>{listing.name}</strong></span> },
        { key: 'quantity', header: 'Quantity', align: 'right', render: listing => <span className="nw-numeric">{listing.quantity}</span> },
        { key: 'price', header: 'Price', align: 'right', render: listing => <span className="nw-numeric">{listing.priceCredits.toLocaleString()} cr</span> }
      ]} /></Panel> : <Notification title="No listings transmitted" tone="info">The marketplace module is active, but the server returned no current listings.</Notification>) : <Panel className="locked-system"><div className="locked-system__glyph"><NWIcon name="market" size={58} /></div><Badge tone="warning">MODULE OFFLINE</Badge><h2>Marketplace access unavailable</h2><p>The server reports that the marketplace module is not active. The interface cannot bypass that station state.</p><ProgressBar value={0} label="Network availability" tone="warning" /></Panel>}
    </div>
  );
}

function QuartersPage({ me, quarters }: { me: CurrentUser; quarters: Quarters | null }) {
  return (
    <div className="page-stack">
      <SectionTitle eyebrow="PERSONAL HABITAT" title="Quarters Interface" description="Authenticated occupant identity and the current server-provided habitat layout." icon="module" />
      <SplitLayout>
        <Panel><SectionTitle eyebrow="OCCUPANT" title={me.displayName} icon="twitch" /><ProfileChip name={me.displayName} detail={`${me.player?.career ?? 'Wrecker'} · Level ${me.player?.level ?? 1}`} avatarUrl={me.avatarUrl || undefined} /><div className="quarters-readouts"><StatusDisplay label="Access Level" value={me.player?.level ?? 1} icon="module" tone="purple" /><StatusDisplay label="Credits" value={me.player?.credits ?? 0} unit=" cr" icon="credits" tone="success" /><StatusDisplay label="Layout Theme" value={quarters?.layout.theme ?? 'UNAVAILABLE'} icon="settings" tone="info" /></div></Panel>
        <Panel><SectionTitle eyebrow="HABITAT MAP" title="Installed objects" description="Coordinates are supplied by the current quarters endpoint." icon="diagnostics" />{quarters ? <div className="quarters-map" role="img" aria-label={`Quarters layout containing ${quarters.layout.objects.length} objects`}>{quarters.layout.objects.map(object => <div key={`${object.key}-${object.x}-${object.y}`} className="quarters-object" style={{ '--quarters-x': object.x, '--quarters-y': object.y } as CSSProperties}><NWIcon name={quartersObjectIcon(object.key)} size={19} /><span>{object.key.replaceAll('-', ' ')}</span><small className="nw-numeric">X{object.x} Y{object.y}</small></div>)}</div> : <Notification title="Layout unavailable" tone="warning">The quarters endpoint did not return a layout during this synchronization cycle.</Notification>}</Panel>
      </SplitLayout>
    </div>
  );
}

function ProfilePage({ me }: { me: CurrentUser }) {
  return (
    <div className="page-stack">
      <SectionTitle eyebrow="IDENTITY RECORD" title="Wrecker Profile" description="Authenticated Twitch identity and existing player progression data." icon="twitch" />
      <Panel depth="medium" className="profile-console">
        <ProfileChip name={me.displayName} detail={me.player?.title ?? 'Wrecker'} avatarUrl={me.avatarUrl || undefined} />
        <ResponsiveGrid min="12rem"><StatusDisplay label="Level" value={me.player?.level ?? 1} icon="crew" tone="purple" /><StatusDisplay label="Credits" value={me.player?.credits ?? 0} unit=" cr" icon="credits" tone="success" /><StatusDisplay label="Career" value={me.player?.career ?? 'Wrecker'} icon="salvage" tone="info" /></ResponsiveGrid>
      </Panel>
    </div>
  );
}

function SettingsPage({ preferences, updatePreferences }: { preferences: UiPreferences; updatePreferences: (patch: Partial<UiPreferences>) => void }) {
  return (
    <div className="page-stack">
      <SectionTitle eyebrow="INTERFACE CONTROL" title="Accessibility & Display" description="Local interface preferences only. Game state, APIs, and balance are untouched." icon="settings" />
      <SplitLayout>
        <Panel>
          <div className="settings-grid">
            <ToggleSwitch checked={preferences.reducedMotion} onChange={value => updatePreferences({ reducedMotion: value })} label="Reduced motion" description="Disables decorative movement and transition travel." />
            <ToggleSwitch checked={preferences.lowEffects} onChange={value => updatePreferences({ lowEffects: value })} label="Low performance effects" description="Reduces blur, bloom, scanlines, and background layers." />
            <ToggleSwitch checked={preferences.highContrast} onChange={value => updatePreferences({ highContrast: value })} label="High contrast markings" description="Strengthens text and interface boundary contrast." />
            <ToggleSwitch checked={preferences.largeText} onChange={value => updatePreferences({ largeText: value })} label="Large interface text" description="Raises the global scalable-text baseline." />
            <SliderControl label="Glow intensity" value={preferences.glowIntensity} min={0} max={100} unit="%" onChange={value => updatePreferences({ glowIntensity: value })} />
          </div>
        </Panel>
        <Panel>
          <SectionTitle eyebrow="ACTIVE PROFILE" title="Interface State" description="The current local rendering profile is applied immediately and saved on this device." icon="terminal" />
          <ResponsiveGrid min="10rem">
            <StatusDisplay label="Motion" value={preferences.reducedMotion ? 'REDUCED' : 'STANDARD'} icon="events" tone={preferences.reducedMotion ? 'info' : 'success'} />
            <StatusDisplay label="Effects" value={preferences.lowEffects ? 'LOW' : 'FULL'} icon="diagnostics" tone={preferences.lowEffects ? 'info' : 'purple'} />
            <StatusDisplay label="Contrast" value={preferences.highContrast ? 'HIGH' : 'STANDARD'} icon="integrity" tone={preferences.highContrast ? 'success' : 'neutral'} />
            <StatusDisplay label="Text Scale" value={preferences.largeText ? 'LARGE' : 'STANDARD'} icon="data" tone={preferences.largeText ? 'info' : 'neutral'} />
          </ResponsiveGrid>
          <Notification title="Preferences stored locally" tone="success">These display controls do not alter station data or gameplay behavior.</Notification>
        </Panel>
      </SplitLayout>
    </div>
  );
}

function CommandAction({ icon, title, detail, onClick, tone = 'success' }: { icon: IconName; title: string; detail: string; onClick: () => void; tone?: Tone }) {
  return (
    <button className={`command-action nw-tone--${tone}`} onClick={onClick}>
      <span className="command-action__icon"><NWIcon name={icon} size={25} /></span>
      <span className="nw-eyebrow">COMMAND</span>
      <strong>{title}</strong>
      <small>{detail}</small>
      <i aria-hidden="true">EXECUTE</i>
    </button>
  );
}

function HistoryList({ history, limit = 12 }: { history: HistoryEntry[]; limit?: number }) {
  const entries = (history ?? []).slice(0, limit);
  if (!entries.length) return <Notification title="No station events" tone="info">The permanent log is currently empty.</Notification>;
  return (
    <ScrollableList label="Station history" maxHeight={limit > 12 ? '65vh' : '24rem'}>
      {entries.map((entry, index) => <Card key={entry.id ?? index} className="history-entry"><div className="history-entry__index nw-numeric">{String(index + 1).padStart(2, '0')}</div><NWIcon name="events" size={16} /><div><strong>{entry.title}</strong><p>{entry.body}</p></div><span className="nw-numeric">{entry.createdAt ? new Date(entry.createdAt).toLocaleString() : 'LIVE'}</span></Card>)}
    </ScrollableList>
  );
}


function notificationTone(notification: PlayerNotification): Tone {
  if (notification.priority >= 80 || /critical|danger|breach|failure/i.test(`${notification.type} ${notification.title}`)) return 'danger';
  if (notification.priority >= 50 || /warning|alert|low/i.test(`${notification.type} ${notification.title}`)) return 'warning';
  return notification.readAt ? 'neutral' : 'info';
}

function quartersObjectIcon(key: string): IconName {
  if (key.includes('relic')) return 'museum';
  if (key.includes('espresso')) return 'reactor';
  if (key.includes('bed')) return 'module';
  return 'inventory';
}

function toneForValue(value?: number): Tone {
  if ((value ?? 0) < 35) return 'danger';
  if ((value ?? 0) < 60) return 'warning';
  return 'success';
}

function riskTone(risk?: string): Tone {
  const value = String(risk ?? '').toLowerCase();
  if (value.includes('high') || value.includes('extreme')) return 'danger';
  if (value.includes('medium') || value.includes('moderate')) return 'warning';
  return 'info';
}

function expeditionTone(status?: string): Tone {
  if (status === 'resolved') return 'success';
  if (status === 'failed') return 'danger';
  if (status === 'active') return 'info';
  return 'neutral';
}

function moduleIcon(slug?: string): IconName {
  const value = String(slug ?? '');
  if (value.includes('refinery')) return 'reactor';
  if (value.includes('cargo') || value.includes('storage')) return 'storage';
  if (value.includes('habitat') || value.includes('medical')) return 'population';
  if (value.includes('museum')) return 'museum';
  if (value.includes('research')) return 'research';
  if (value.includes('command')) return 'station';
  return 'module';
}

function itemIcon(slug?: string): IconName {
  const value = String(slug ?? '');
  if (value.includes('fuel')) return 'fuel';
  if (value.includes('data') || value.includes('electronics')) return 'data';
  if (value.includes('relic')) return 'museum';
  if (value.includes('credit')) return 'credits';
  if (value.includes('scrap') || value.includes('alloy')) return 'resources';
  return 'inventory';
}

createRoot(document.getElementById('root')!).render(<Root />);
