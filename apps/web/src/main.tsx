import { useCallback, useEffect, useRef, useState, type ChangeEvent, type CSSProperties, type ReactNode } from 'react';
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
  Input,
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
import { GameArtwork } from './components/GameArtwork.js';
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
  description: string;
  maxLevel: number;
  prerequisites: string[];
  level: number;
  state: string;
  progress: number;
  integrity: number;
  visualKey: string;
  effects: Record<string, unknown>;
  perLevelEffects: Record<string, unknown>;
  nextLevelRequirements: Record<string, number> | null;
  project?: { id: string; kind: string; targetLevel: number; requirements: Record<string, number>; contributed: Record<string, number> } | null;
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
  populationStatus?: { capacity: number; trend: number; reasons: string[] };
  power: number;
  morale: number;
  integrity: number;
  storageCapacity: number;
  storageUsed: number;
  threatLevel: string | number;
  activeSeason: string | null;
  resources: Record<string, number>;
  museum: { collection: Array<{ itemSlug: string; name: string; quantity: number }>; donatedToday: number; dailyCapacity: number };
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
  salvageProfile: Record<'cutters' | 'cargo', { successChance: number; scrapRange: number[]; electronicsChance: number; fuelChance: number; relicChance: number; wreckLootRolls: number; wreckLootChancePerRoll: number; wreckLootPool: Array<{ slug: string; name: string; rarity: string }> }>;
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
  ownedSkins: string[];
  activeSkin: string | null;
  visualKey: string;
  createdAt: string;
};

type CrewMember = {
  id: string;
  name: string;
  role: string;
  level: number;
  jobStars: number;
  talentStars: number;
  morale: number;
  injuredUntil: string | null;
  traits: string[];
};

type Expedition = {
  id: string;
  definition: string;
  shipId: string | null;
  crewIds: string[];
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
  details: { operation?: string; mode?: string; wreckName?: string; expeditionName?: string; shipName?: string; items?: Array<{ itemSlug: string; name: string; quantity: number; rarity?: string }> };
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
  ships: {
    purchases: Array<{ slug: string; name: string; credits: number; cargoCapacity: number; fuel: number }>;
    upgrades: Array<{ slug: string; name: string; description: string; credits: number; alloys?: number; electronics?: number; conditionBonus?: number; cargoBonus?: number; fuelDiscount?: number; repairDiscount?: number; lootRollBonus?: number }>;
    skins: Array<{ slug: string; classSlug: string; name: string; description: string; credits: number; cargoBonus?: number; fuelDiscount?: number; repairDiscount?: number; lootRollBonus?: number; successBonus?: number }>;
    skinCooldownSeconds: number;
    repair: { creditsPerCondition: number; alloysPerTwentyCondition: number };
    crewPerShip: number;
    renameCredits: number;
  };
};

type ItemDefinition = { slug: string; name: string; rarity: string; valueCredits: number; vendorSellCredits?: number; sellable: boolean; description: string; uses: string[]; recipes: string[]; sources: string[] };
type AuctionListing = { id: string; itemSlug: string; itemName: string; quantity: number; priceCredits: number; sellerName: string; ownListing: boolean; cancellationFee: number; expiresAt: string };
type CraftingRecipe = { slug: string; name: string; baseDurationSeconds: number; durationSeconds: number; inputValue: number; outputValue: number; valueAdded: number; efficiency: number; inputs: Record<string, number>; outputs: Record<string, number>; stationModule: string; unlocked: boolean };
type ActionCooldown = { actionKey: string; expiresAt: string };
type ExpeditionDefinition = {
  slug: string;
  name: string;
  description: string;
  risk: string;
  fuelCost: number;
  minCrew: number;
  durationMinutes: [number, number];
  lootRolls: number;
  successChance: number;
  rewardQuantity: [number, number];
  baseRewards: { success: string; failure: string };
  lootPool: Array<{ slug: string; name: string; rarity: string; chancePerRoll: number }>;
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

type ActionHandler = (path: string, payload?: unknown, label?: string, headers?: HeadersInit) => Promise<unknown | undefined>;

type GameData = {
  me: CurrentUser;
  station: Station | null;
  wreck: Wreck | null;
  inventory: InventoryItem[];
  ships: Ship[];
  crew: CrewMember[];
  history: HistoryEntry[];
  expeditions: Expedition[];
  expeditionDefinitions: ExpeditionDefinition[];
  notifications: PlayerNotification[];
  marketplace: Marketplace | null;
  catalog: ItemDefinition[];
  auctions: AuctionListing[];
  recipes: CraftingRecipe[];
  cooldowns: ActionCooldown[];
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
  const [expeditionDefinitions, setExpeditionDefinitions] = useState<ExpeditionDefinition[]>([]);
  const [notifications, setNotifications] = useState<PlayerNotification[]>([]);
  const [marketplace, setMarketplace] = useState<Marketplace | null>(null);
  const [catalog, setCatalog] = useState<ItemDefinition[]>([]);
  const [auctions, setAuctions] = useState<AuctionListing[]>([]);
  const [recipes, setRecipes] = useState<CraftingRecipe[]>([]);
  const [cooldowns, setCooldowns] = useState<ActionCooldown[]>([]);
  const [quarters, setQuarters] = useState<Quarters | null>(null);
  const { pushToast } = useToast();
  const refreshInFlight = useRef<Promise<void> | null>(null);

  const refresh = useCallback(() => {
    if (refreshInFlight.current) return refreshInFlight.current;
    const pending = (async () => {
      setMe(await requestApi<CurrentUser>('/api/v1/me'));
      const [stationResult, wreckResult, inventoryResult, shipsResult, crewResult, historyResult, expeditionsResult, expeditionDefinitionsResult, notificationsResult, marketplaceResult, quartersResult, catalogResult, auctionResult, recipesResult, cooldownResult] = await Promise.allSettled([
      requestApi<Station>('/api/v1/station'),
      requestApi<Wreck>('/api/v1/wrecks/current'),
      requestApi<InventoryItem[]>('/api/v1/inventory'),
      requestApi<Ship[]>('/api/v1/ships'),
      requestApi<CrewMember[]>('/api/v1/crew'),
      requestApi<HistoryEntry[]>('/api/v1/history'),
      requestApi<Expedition[]>('/api/v1/expeditions'),
      requestApi<ExpeditionDefinition[]>('/api/v1/expeditions/definitions'),
      requestApi<PlayerNotification[]>('/api/v1/notifications'),
      requestApi<Marketplace>('/api/v1/marketplace/listings'),
      requestApi<Quarters>('/api/v1/quarters'),
      requestApi<ItemDefinition[]>('/api/v1/items/catalog'),
      requestApi<AuctionListing[]>('/api/v1/auction/listings'),
      requestApi<CraftingRecipe[]>('/api/v1/crafting/recipes'),
      requestApi<ActionCooldown[]>('/api/v1/cooldowns')
      ]);
      if (stationResult.status === 'fulfilled') setStation(stationResult.value);
      if (wreckResult.status === 'fulfilled') setWreck(wreckResult.value);
      if (inventoryResult.status === 'fulfilled') setInventory(inventoryResult.value);
      if (shipsResult.status === 'fulfilled') setShips(shipsResult.value);
      if (crewResult.status === 'fulfilled') setCrew(crewResult.value);
      if (historyResult.status === 'fulfilled') setHistory(historyResult.value);
      if (expeditionsResult.status === 'fulfilled') setExpeditions(expeditionsResult.value);
      if (expeditionDefinitionsResult.status === 'fulfilled') setExpeditionDefinitions(expeditionDefinitionsResult.value);
      if (notificationsResult.status === 'fulfilled') setNotifications(notificationsResult.value);
      if (marketplaceResult.status === 'fulfilled') setMarketplace(marketplaceResult.value);
      if (quartersResult.status === 'fulfilled') setQuarters(quartersResult.value);
      if (catalogResult.status === 'fulfilled') setCatalog(catalogResult.value);
      if (auctionResult.status === 'fulfilled') setAuctions(auctionResult.value);
      if (recipesResult.status === 'fulfilled') setRecipes(recipesResult.value);
      if (cooldownResult.status === 'fulfilled') setCooldowns(cooldownResult.value);
    })();
    refreshInFlight.current = pending;
    const clearPending = () => {
      if (refreshInFlight.current === pending) refreshInFlight.current = null;
    };
    void pending.then(clearPending, clearPending);
    return pending;
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

  useEffect(() => {
    if (!me) return;
    const url = new URL('/api/v1/player/ws', window.location.origin);
    url.protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(url);
    socket.onmessage = event => {
      try {
        const message = JSON.parse(String(event.data)) as { type?: string };
        if (message.type && message.type !== 'player.connected') void refresh();
      } catch { /* Ignore malformed personal packets. */ }
    };
    const poll = window.setInterval(() => void refresh().catch(() => undefined), 15_000);
    return () => { socket.close(); window.clearInterval(poll); };
  }, [me?.id, refresh]);

  const login = () => {
    window.location.href = '/api/v1/auth/twitch/start';
  };

  const action = useCallback<ActionHandler>(async (path, payload, label = 'Operation complete', headers) => {
    try {
      const data = await requestApi<unknown>(path, {
        method: 'POST',
        headers,
        body: payload == null ? undefined : JSON.stringify(payload)
      });
      pushToast({ title: label, message: actionResultMessage(data), tone: 'success' });
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

  return { me, station, wreck, inventory, ships, crew, history, expeditions, expeditionDefinitions, notifications, marketplace, catalog, auctions, recipes, cooldowns, quarters, login, action, refresh };
}

const navigation: TabItem[] = [
  { id: 'guide', label: 'How to Play', icon: 'data' },
  { id: 'station', label: 'Station', icon: 'station' },
  { id: 'salvage', label: 'Salvage', icon: 'salvage' },
  { id: 'inventory', label: 'Hold', icon: 'inventory' },
  { id: 'crafting', label: 'Craft', icon: 'resources' },
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
    guide: <GuidePage />,
    station: <StationPage {...pageProps} />,
    salvage: <SalvagePage {...pageProps} />,
    inventory: <InventoryPage {...pageProps} />,
    crafting: <CraftingPage recipes={game.recipes} inventory={game.inventory} catalog={game.catalog} cooldowns={game.cooldowns} action={game.action} />,
    construction: <ConstructionPage {...pageProps} />,
    crew: <CrewPage {...pageProps} />,
    ships: <ShipsPage {...pageProps} />,
    expeditions: <ExpeditionPage {...pageProps} />,
    museum: <MuseumPage {...pageProps} />,
    history: <HistoryPage {...pageProps} />,
    notifications: <NotificationsPage notifications={game.notifications} action={game.action} />,
    market: <MarketPage marketplace={game.marketplace} credits={me.player?.credits ?? 0} inventory={game.inventory} catalog={game.catalog} auctions={game.auctions} action={game.action} />,
    quarters: <QuartersPage me={me} quarters={game.quarters} action={game.action} />,
    profile: <ProfilePage me={me} action={game.action} />,
    settings: <SettingsPage preferences={preferences} updatePreferences={updatePreferences} />
  };

  return (
    <AppShell
      header={<CommandHeader
        title="Station Zero Command Mesh"
        subtitle="Community salvage and orbital reconstruction network"
        status={<Badge tone="success" icon="network">LIVE LINK</Badge>}
        actions={<div className="inline-actions"><Tooltip content="Refresh station telemetry"><Button variant="ghost" size="sm" icon={<NWIcon name="diagnostics" size={15} />} onClick={() => void game.refresh()}>Resync</Button></Tooltip><Button variant="ghost" size="sm" onClick={() => void game.action('/api/v1/auth/logout', undefined, 'Signed out').then(() => { window.location.href = '/'; })}>Sign out</Button></div>}
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

function GuidePage() {
  const steps = [
    ['1. Salvage', 'Scan a wreck, then deploy cutters or cargo teams. Cargo mode rolls more wreck-specific materials; Research Skiffs yield Research Data, while freighters carry food and coolant supplies.'],
    ['2. Build', 'Contribute recovered scrap, electronics, alloys, and research data to shared station modules.'],
    ['3. Keep Zero alive', 'Repair the hull, fuel the reactor, and run food or medical drives. Power and integrity directly affect resident retention.'],
    ['4. Trade', 'Buy fixed station stock or list your own items in the 48-hour player Auction House. Compare every item’s guide value first.'],
    ['5. Expeditions', 'Glass Belt Runs return ice, water, algae, food, polymer, and biofiber. Dead Relay Pings return Research Data, electronics, lenses, charts, conduits, relays, and rare Quantum Keys.']
  ];
  return <div className="page-stack"><SectionTitle eyebrow="WRECKER ORIENTATION" title="How to Play" description="A quick path from first scan to a thriving player-run station." icon="data" /><Notification title="Hover for details" tone="info">Buttons, prices, status readouts, and item cards include contextual help. Timers count down beside actions that are busy.</Notification><ResponsiveGrid min="19rem">{steps.map(([title, body]) => <Card key={title}><span className="nw-eyebrow">FIELD MANUAL</span><h3>{title}</h3><p>{body}</p></Card>)}</ResponsiveGrid><Panel><SectionTitle eyebrow="COMMUNITY OBJECTIVE" title="Why population matters" icon="population" /><p>Residents are Station Zero’s workforce and survival score. A larger population supports future station capacity and shows that the community is keeping habitats safe. Residents arrive after food drives, clinics, good morale, and habitat construction; they leave when power, hull integrity, or morale becomes dangerous. The Station page names the current causes and gives every player actions to change them.</p></Panel></div>;
}

function StationPage({ station, wreck, inventory, history, cooldowns, action }: GameData) {
  const scrap = inventory.find(item => item.itemSlug === 'scrap')?.quantity ?? 0;
  return (
    <div className="page-stack">
      <SectionTitle eyebrow="ORBITAL COMMAND" title={station?.name ?? 'Station Zero'} description="Live station condition, active wreck telemetry, inventory readiness, and permanent community history." icon="station" />
      <ResponsiveGrid min="13rem" className="status-rack">
        <Tooltip content={(station?.populationStatus?.reasons ?? ['Population reacts to power, hull safety, morale, food, and medical support.']).join(' ')}><div><PopulationDisplay current={station?.population ?? 0} capacity={station?.populationStatus?.capacity} trend={station?.populationStatus?.trend ?? 0} /></div></Tooltip>
        <StatusDisplay label="Power Reserve" value={station?.power ?? 0} unit="%" icon="power" tone={toneForValue(station?.power)} detail="Grid synchronized" />
        <StatusDisplay label="Hull Integrity" value={station?.integrity ?? 0} unit="%" icon="integrity" tone={toneForValue(station?.integrity)} detail={(station?.integrity ?? 0) < 50 ? 'Repair priority' : 'Pressure stable'} />
        <StatusDisplay label="Construction Stock" value={scrap} unit=" scrap" icon="resources" tone="info" detail="Personal hold" />
      </ResponsiveGrid>
      <StationMaintenance station={station} inventory={inventory} cooldowns={cooldowns} action={action} />
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

function StationMaintenance({ station, inventory, cooldowns, action }: Pick<GameData, 'station' | 'inventory' | 'cooldowns' | 'action'>) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, []);
  const run = async (key: string) => {
    await action('/api/v1/station/maintain', { action: key }, 'Community action complete');
  };
  const qty = (slug: string) => inventory.find(item => item.itemSlug === slug)?.quantity ?? 0;
  const options = [
    { key: 'repair-hull', title: 'Repair Main Station', cost: '2 Hull Plates + 3 Sealant Foam', reward: '+8 integrity', ready: qty('hull-plate') >= 2 && qty('sealant-foam') >= 3 },
    { key: 'fuel-reactor', title: 'Fuel Reactor Grid', cost: '2 Fuel Cells + 1 Reactor Coolant', reward: '+15 power', ready: qty('fuel') >= 2 && qty('reactor-coolant') >= 1 },
    { key: 'food-drive', title: 'Run Food Drive', cost: '10 Ration Packs + 5 Water Cartridges', reward: '+6 residents, +4 morale', ready: qty('ration-pack') >= 10 && qty('water-cartridge') >= 5 },
    { key: 'medical-clinic', title: 'Open Community Clinic', cost: '4 Medical Supplies', reward: '+3 residents, +6 morale', ready: qty('medical-supplies') >= 4 }
  ];
  return <Panel tone={(station?.integrity ?? 100) < 40 || (station?.power ?? 100) < 30 ? 'danger' : 'info'}><SectionTitle eyebrow="COMMUNITY OPERATIONS" title="Station Survival" description={(station?.populationStatus?.reasons ?? []).join(' ')} icon="population" /><ResponsiveGrid min="15rem">{options.map(option => { const remaining = cooldownRemaining(cooldowns, `station:${option.key}`, now); return <Tooltip key={option.key} content={`Cost: ${option.cost}. Effect: ${option.reward}. These resources are consumed for the whole community.`}><Card><h3>{option.title}</h3><p>{option.cost}</p><Badge tone="success">{option.reward}</Badge><Button fullWidth disabled={!option.ready || remaining > 0} onClick={() => void run(option.key)}>{remaining > 0 ? `Ready in ${formatCountdown(remaining)}` : option.ready ? 'Contribute now' : 'Materials needed'}</Button></Card></Tooltip>; })}</ResponsiveGrid></Panel>;
}

function StationSchematic({ station }: { station: Station | null }) {
  const modules = station?.modules ?? [];
  return (
    <Panel depth="medium" className="station-schematic">
      <div className="station-schematic__header"><Badge tone="info">TACTICAL SCHEMATIC</Badge><span className="nw-numeric">ORBIT // ZERO-01</span></div>
      <div className="station-orbit" aria-label="Station Zero operational schematic">
        <GameArtwork className="station-orbit__art" src="/station/station-zero.webp" alt="Station Zero modular orbital station" eager sizes="(max-width: 760px) 92vw, 46rem" />
        <div className="station-orbit__grid" />
        <div className="station-orbit__ring station-orbit__ring--outer" />
        <div className="station-orbit__ring station-orbit__ring--inner" />
        <div className="station-core"><NWIcon name="station" size={36} /><strong>ZERO</strong><small>COMMAND CORE</small></div>
        {modules.map((module, index) => {
          const angle = (360 / Math.max(modules.length, 1)) * index - 90;
          return <div key={module.slug} className={`station-node is-${module.state}`} style={{ '--node-angle': `${angle}deg`, '--node-radius': index % 2 ? '38%' : '45%' } as CSSProperties}><span><GameArtwork src={`/station/modules/${module.slug}.webp`} alt="" sizes="(max-width: 760px) 88px, 112px" /><b>{module.name}</b><i>{module.state}</i></span></div>;
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
      <div className="wreck-scan">{wreck ? <GameArtwork src={`/wrecks/${wreck.archetype}.webp`} alt={`${wreck.name}, current salvage target`} eager sizes="(max-width: 760px) 88vw, 34rem" /> : <NWIcon name="wreck" size={70} />}<span /><span /><span /><strong className="nw-numeric">{wreck?.integrity ?? 0}% HULL</strong></div>
      <p>{wreck?.description ?? 'Awaiting server telemetry.'}</p>
      <HealthBar label="Remaining hull" value={wreck?.integrity ?? 0} />
      {wreck?.salvageProfile && <div className="side-stack">{(['cutters', 'cargo'] as const).map(mode => { const stats = wreck.salvageProfile[mode]; return <Card key={mode}><strong>{mode === 'cargo' ? 'Cargo team' : 'Cutters'} · {Math.round(stats.successChance * 100)}% success</strong><p>{stats.scrapRange[0]}–{stats.scrapRange[1]} scrap · {Math.round(stats.electronicsChance * 100)}% electronics · {Math.round(stats.fuelChance * 100)}% fuel · {(stats.relicChance * 100).toFixed(1)}% relic</p><small>{stats.wreckLootRolls} wreck-specific roll{stats.wreckLootRolls === 1 ? '' : 's'} at {Math.round(stats.wreckLootChancePerRoll * 100)}% each: {stats.wreckLootPool.map(item => item.name).join(', ')}</small></Card>; })}</div>}
    </Panel>
  );
}

function SalvagePage({ wreck, cooldowns, action }: Pick<GameData, 'wreck' | 'cooldowns' | 'action'>) {
  const [confirmOverride, setConfirmOverride] = useState(false);
  const [autoSalvage, setAutoSalvage] = useState(false);
  const autoRunning = useRef(false);
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, []);
  const scanRemaining = cooldownRemaining(cooldowns, 'scan', now);
  const cuttersRemaining = cooldownRemaining(cooldowns, 'salvage:cutters', now);
  const cargoRemaining = cooldownRemaining(cooldowns, 'salvage:cargo', now);
  const overrideRemaining = cooldownRemaining(cooldowns, 'salvage:override', now);
  useEffect(() => {
    if (!autoSalvage || autoRunning.current) return;
    const next = wreck?.depleted
      ? scanRemaining <= 0 ? ['/api/v1/salvage/scan', undefined, 'Auto scan acquired'] as const : null
      : cargoRemaining <= 0
        ? ['/api/v1/salvage/deploy', { mode: 'cargo' }, 'Auto cargo recovered'] as const
        : cuttersRemaining <= 0 ? ['/api/v1/salvage/deploy', { mode: 'cutters' }, 'Auto cutters deployed'] as const : null;
    if (!next) return;
    autoRunning.current = true;
    void action(next[0], next[1], next[2]).finally(() => { autoRunning.current = false; });
  }, [action, autoSalvage, cargoRemaining, cuttersRemaining, now, scanRemaining, wreck?.depleted, wreck?.id]);
  return (
    <div className="page-stack">
      <SectionTitle eyebrow="WRECK OPERATIONS" title="Salvage Control" description="All rolls, costs, rewards, and damage remain authoritative on the server." icon="salvage" />
      <SplitLayout ratio="minmax(0, 1.35fr) minmax(20rem, .65fr)">
        <Panel depth="medium">
          <ToggleSwitch checked={autoSalvage} onChange={setAutoSalvage} label="Auto salvage" description="While this tab remains open, automatically deploy cargo teams and cutters, then scan for a new wreck when the current target is depleted." />
          <ResponsiveGrid min="15rem" className="action-matrix">
            <CommandAction icon="scanner" title="Active Scan" detail={scanRemaining > 0 ? `Ready in ${formatCountdown(scanRemaining)}` : 'Acquire and profile the next salvage opportunity.'} disabled={scanRemaining > 0} onClick={() => void action('/api/v1/salvage/scan', undefined, 'Signal acquired')} />
            <CommandAction icon="signal" title="Rush Scan" detail="Spend 75 StreamElements points to replace the current target immediately." onClick={() => void action('/api/v1/points/actions/rush_scan', undefined, 'Rush scan purchased', { 'Idempotency-Key': crypto.randomUUID() })} tone="purple" />
            <CommandAction icon="salvage" title="Deploy Cutters" detail={cuttersRemaining > 0 ? `Ready in ${formatCountdown(cuttersRemaining)}` : 'Execute the standard salvage profile.'} disabled={cuttersRemaining > 0} onClick={() => void action('/api/v1/salvage/deploy', { mode: 'cutters' }, 'Cutters deployed')} />
            <CommandAction icon="cargo" title="Recover Cargo" detail={cargoRemaining > 0 ? `Ready in ${formatCountdown(cargoRemaining)}` : 'Prioritize high-value internal cargo compartments.'} disabled={cargoRemaining > 0} onClick={() => void action('/api/v1/salvage/deploy', { mode: 'cargo' }, 'Cargo team launched')} tone="info" />
            <CommandAction icon="danger" title="Safety Override" detail={overrideRemaining > 0 ? `Ready in ${formatCountdown(overrideRemaining)}` : 'Engage the existing high-risk deployment mode.'} disabled={overrideRemaining > 0} onClick={() => setConfirmOverride(true)} tone="danger" />
          </ResponsiveGrid>
          <Notification title="Server authority active" tone="info" icon="network">The interface submits commands only. It does not calculate outcomes, rewards, cooldowns, or balance.</Notification>
        </Panel>
        <WreckPanel wreck={wreck} />
      </SplitLayout>
      <ConfirmWindow open={confirmOverride} onClose={() => setConfirmOverride(false)} onConfirm={() => { setConfirmOverride(false); void action('/api/v1/points/actions/safety_override', undefined, 'Override purchased', { 'Idempotency-Key': crypto.randomUUID() }); }} title="Purchase safety override?" confirmLabel="Spend 250 points" tone="danger"><p>This premium command charges StreamElements points before executing. Failed execution follows the server refund workflow.</p></ConfirmWindow>
    </div>
  );
}

function ConstructionPage({ station, inventory, action }: Pick<GameData, 'station' | 'inventory' | 'action'>) {
  const modules = station?.modules ?? [];
  const defaultProject = modules.find(module => ['building', 'upgrading', 'damaged'].includes(module.state)) ?? modules.find(module => module.slug === 'habitat-ring');
  const [moduleSlug, setModuleSlug] = useState(defaultProject?.slug ?? 'habitat-ring');
  const activeProject = modules.find(module => module.slug === moduleSlug) ?? defaultProject;
  const canContribute = Boolean(activeProject && ['locked', 'building', 'upgrading', 'damaged'].includes(activeProject.state));
  return (
    <div className="page-stack">
      <SectionTitle eyebrow="STRUCTURAL OPERATIONS" title="Construction Yard" description="Community module state and contribution progress, using the existing construction endpoint." icon="construction" />
      <SplitLayout ratio="minmax(0, 1.4fr) minmax(18rem, .6fr)">
        <ResponsiveGrid min="17rem">{modules.map(module => { const needsRepair = ['damaged', 'disabled'].includes(module.state); const nextCost = module.nextLevelRequirements ? Object.entries(module.nextLevelRequirements).map(([slug, amount]) => `${amount} ${slug}`).join(' · ') : 'Maximum level'; return <ModuleCard key={module.slug} name={module.name} state={module.state} progress={needsRepair && !module.project ? module.integrity : module.progress ?? 0} progressLabel={needsRepair && !module.project ? 'Module integrity' : needsRepair ? 'Repair progress' : 'Module progress'} icon={moduleIcon(module.slug)} description={`${module.description} Current: ${moduleEffectDescription(module)} ${module.state === 'active' ? 'Benefit online.' : needsRepair ? 'Benefit offline until repaired.' : ''}`} stats={<span>Integrity <strong>{module.integrity}%</strong> · Level <strong>{module.level}/{module.maxLevel}</strong><br />Next upgrade: <strong>{nextCost}</strong></span>} action={needsRepair && !module.project ? <Button size="sm" variant="warning" fullWidth onClick={() => void action('/api/v1/construction/start', { moduleSlug: module.slug, kind: 'repair' }, `${module.name} repair started`)}>Start repair</Button> : undefined} />; })}</ResponsiveGrid>
        <Panel tone="info" className="project-console">
          <SectionTitle eyebrow="ACTIVE PROJECT" title={activeProject?.name ?? 'No project queued'} icon="construction" />
          <Field label="Construction target"><Select value={moduleSlug} onChange={event => setModuleSlug(event.target.value)}>{modules.map(module => <option key={module.slug} value={module.slug}>{module.name} · {module.state}</option>)}</Select></Field>
          <ProgressBar label="Build progress" value={activeProject?.progress ?? 0} tone="info" />
          {activeProject?.project && <div className="material-readout"><span>Project requirements</span><strong>{Object.entries(activeProject.project.requirements).map(([slug, amount]) => `${slug} ${activeProject.project?.contributed[slug] ?? 0}/${amount}`).join(' · ')}</strong></div>}
          <div className="material-readout"><span>Available hold</span><strong>{inventory.map(item => `${item.name} ${item.quantity}`).join(' · ') || 'No materials'}</strong></div>
          <Button variant="primary" fullWidth icon={<NWIcon name="resources" size={16} />} disabled={!canContribute} onClick={() => void action('/api/v1/construction/contribute', { moduleSlug: activeProject?.slug ?? 'habitat-ring', scrap: 10 }, 'Materials delivered')}>Contribute 10 Hull Scrap</Button>
          {activeProject?.state === 'active' && <Button variant="warning" fullWidth onClick={() => void action('/api/v1/construction/start', { moduleSlug: activeProject.slug, kind: 'upgrade' }, 'Module upgrade started')}>Start module upgrade</Button>}
          <Button variant="ghost" fullWidth disabled={!canContribute} onClick={() => void action('/api/v1/construction/contribute', { moduleSlug: activeProject?.slug, electronics: 1 }, 'Electronics delivered')}>Contribute 1 Electronics</Button>
          <Button variant="ghost" fullWidth disabled={!canContribute} onClick={() => void action('/api/v1/construction/contribute', { moduleSlug: activeProject?.slug, alloys: 1 }, 'Alloys delivered')}>Contribute 1 Alloy</Button>
          <Button variant="ghost" fullWidth disabled={!canContribute} onClick={() => void action('/api/v1/construction/contribute', { moduleSlug: activeProject?.slug, researchData: 1 }, 'Research data delivered')}>Contribute 1 Research Data</Button>
        </Panel>
      </SplitLayout>
    </div>
  );
}

function InventoryPage({ inventory, catalog }: Pick<GameData, 'inventory' | 'catalog'>) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('name');
  const catalogBySlug = new Map(catalog.map(item => [item.slug, item]));
  const rows = inventory.map(item => {
    const definition = catalogBySlug.get(item.itemSlug);
    const unitValue = definition?.valueCredits ?? 0;
    return { ...item, definition, unitValue, totalValue: unitValue * item.quantity };
  });
  const query = search.trim().toLowerCase();
  const items = rows
    .filter(item => (filter === 'all' || item.rarity === filter) && (!query || `${item.name} ${item.itemSlug} ${item.definition?.uses.join(' ') ?? ''}`.toLowerCase().includes(query)))
    .sort((left, right) => sort === 'quantity' ? right.quantity - left.quantity : sort === 'value' ? right.totalValue - left.totalValue : sort === 'rarity' ? rarityRank(right.rarity) - rarityRank(left.rarity) || left.name.localeCompare(right.name) : left.name.localeCompare(right.name));
  const totalUnits = inventory.reduce((sum, item) => sum + item.quantity, 0);
  const totalValue = rows.reduce((sum, item) => sum + item.totalValue, 0);
  const rareStacks = inventory.filter(item => rarityRank(item.rarity) >= rarityRank('rare')).length;
  return (
    <div className="page-stack">
      <SectionTitle eyebrow="PERSONAL LOGISTICS" title="Salvage Hold" description="A compact manifest for tracking every recovered resource, component, relic, and credit." icon="inventory" />
      <div className="hold-summary"><div><span>Unique stacks</span><strong>{inventory.length}</strong></div><div><span>Total units</span><strong>{totalUnits.toLocaleString()}</strong></div><div><span>Guide value</span><strong>{totalValue.toLocaleString()} cr</strong></div><div><span>Rare+ stacks</span><strong>{rareStacks}</strong></div></div>
      <Panel className="hold-ledger"><div className="hold-toolbar"><Field label="Search hold"><Input value={search} placeholder="Item, code, or use…" onChange={event => setSearch(event.target.value)} /></Field><Field label="Rarity"><Select value={filter} onChange={(event: ChangeEvent<HTMLSelectElement>) => setFilter(event.target.value)}><option value="all">All rarities</option><option value="common">Common</option><option value="uncommon">Uncommon</option><option value="rare">Rare</option><option value="epic">Epic</option><option value="legendary">Legendary</option></Select></Field><Field label="Sort by"><Select value={sort} onChange={event => setSort(event.target.value)}><option value="name">Item name</option><option value="quantity">Quantity</option><option value="value">Stack value</option><option value="rarity">Rarity</option></Select></Field></div><div className="hold-result-count">Showing <strong>{items.length}</strong> of {inventory.length} held stacks</div>{items.length ? <DataGrid rows={items} getRowKey={item => item.itemSlug} empty="No items in hold." columns={[
        { key: 'item', header: 'Item', render: item => <div className="hold-item"><span className="hold-item__icon"><NWIcon name={itemIcon(item.itemSlug)} size={18} /></span><div><strong>{item.name}</strong><small>{item.itemSlug}</small></div></div> },
        { key: 'rarity', header: 'Rarity', render: item => <Badge tone={rarityTone(item.rarity)}>{item.rarity}</Badge> },
        { key: 'quantity', header: 'Quantity', align: 'right', render: item => <strong className="nw-numeric hold-quantity">{item.quantity.toLocaleString()}</strong> },
        { key: 'unit', header: 'Each', align: 'right', render: item => <span className="nw-numeric">{item.unitValue.toLocaleString()} cr</span> },
        { key: 'total', header: 'Stack value', align: 'right', render: item => <strong className="nw-numeric">{item.totalValue.toLocaleString()} cr</strong> },
        { key: 'use', header: 'Primary use', render: item => <span className="hold-use">{item.definition?.uses[0] ?? 'General salvage'}</span> }
      ]} /> : <Notification title="No matching inventory" tone="info">Adjust the search or rarity filter to view other records.</Notification>}</Panel>
      <Panel className="hold-codex"><SectionTitle eyebrow="ITEM CODEX" title="Values, Recipes & Discovery" description={`${catalog.length} known station items, including materials not yet recovered.`} icon="data" /><DataGrid rows={catalog} getRowKey={item => item.slug} empty="No catalog records." columns={[
        { key: 'item', header: 'Known item', render: item => <div><strong>{item.name}</strong><small className="hold-code">{item.slug}</small></div> },
        { key: 'rarity', header: 'Rarity', render: item => <Badge tone={rarityTone(item.rarity)}>{item.rarity}</Badge> },
        { key: 'value', header: 'Guide value', align: 'right', render: item => <span className="nw-numeric">{item.valueCredits.toLocaleString()} cr</span> },
        { key: 'vendor', header: 'Vendor pays', align: 'right', render: item => <span className="nw-numeric">{item.sellable ? `${(item.vendorSellCredits ?? 0).toLocaleString()} cr` : '—'}</span> },
        { key: 'recipe', header: 'Recipe', render: item => item.recipes[0] ?? 'Not craftable' },
        { key: 'source', header: 'Found through', render: item => item.sources[0] ?? 'Salvage and trade' }
      ]} /></Panel>
    </div>
  );
}

function CraftingPage({ recipes, inventory, catalog, cooldowns, action }: Pick<GameData, 'recipes' | 'inventory' | 'catalog' | 'cooldowns' | 'action'>) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, []);
  const held = (slug: string) => inventory.find(item => item.itemSlug === slug)?.quantity ?? 0;
  const craft = async (recipe: CraftingRecipe, quantity: number) => {
    await action('/api/v1/crafting/craft', { recipeSlug: recipe.slug, quantity }, `${quantity} × ${recipe.name} fabrication started`);
  };
  return <div className="page-stack"><SectionTitle eyebrow="FABRICATION NETWORK" title="Crafting Bay" description="Turn salvage and expedition materials into reactor fuel, repair parts, food, medicine, and advanced components." icon="resources" /><Notification title="How the supply chain works" tone="info">Choose a batch of up to ten. Materials are consumed when fabrication starts, and completed items arrive after the batch timer finishes. Guide value measures utility, while vendor proceeds remain lower.</Notification><ResponsiveGrid min="20rem">{recipes.map(recipe => { const maxAffordable = Math.min(10, ...Object.entries(recipe.inputs).map(([slug, amount]) => Math.floor(held(slug) / amount))); const quantity = quantities[recipe.slug] ?? 1; const ready = maxAffordable >= quantity; const remaining = cooldownRemaining(cooldowns, `craft:${recipe.slug}`, now); const setQuantity = (value: number) => setQuantities(current => ({ ...current, [recipe.slug]: Math.max(1, Math.min(10, value)) })); return <Card key={recipe.slug}><div className="ship-card__head"><h3>{recipe.name}</h3><Badge tone={recipe.unlocked ? 'success' : 'warning'}>{recipe.unlocked ? `${recipe.durationSeconds * quantity}s batch` : `${recipe.stationModule} locked`}</Badge></div><Field label={`Batch size · materials available for ${maxAffordable}`}><div className="inline-actions"><Button type="button" size="sm" variant="ghost" disabled={quantity <= 1} aria-label={`Decrease ${recipe.name} batch`} onClick={() => setQuantity(quantity - 1)}>−</Button><StatusDisplay compact label="Quantity" value={quantity} icon="resources" tone="info" /><Button type="button" size="sm" variant="ghost" disabled={quantity >= 10} aria-label={`Increase ${recipe.name} batch`} onClick={() => setQuantity(quantity + 1)}>+</Button></div></Field><div className="material-readout"><span>Requires</span><strong>{Object.entries(recipe.inputs).map(([slug, amount]) => `${catalog.find(item => item.slug === slug)?.name ?? slug} ${held(slug)}/${amount * quantity}`).join(' · ')}</strong></div><div className="material-readout"><span>Produces</span><strong>{Object.entries(recipe.outputs).map(([slug, amount]) => `${amount * quantity} × ${catalog.find(item => item.slug === slug)?.name ?? slug}`).join(' · ')}</strong></div><div className="material-readout"><span>Economy</span><strong>{(recipe.inputValue * quantity).toLocaleString()} cr in → {(recipe.outputValue * quantity).toLocaleString()} cr out · {recipe.valueAdded >= 0 ? '+' : ''}{(recipe.valueAdded * quantity).toLocaleString()} cr · {Math.round(recipe.efficiency * 100)}%</strong></div><Button fullWidth disabled={!recipe.unlocked || !ready || remaining > 0} onClick={() => void craft(recipe, quantity)}>{remaining > 0 ? `Ready in ${formatCountdown(remaining)}` : !recipe.unlocked ? 'Station module offline' : ready ? `Craft ${quantity}` : `Need materials for ${quantity}`}</Button></Card>; })}</ResponsiveGrid></div>;
}

function ShipsPage({ ships, crew, expeditions, cooldowns, inventory, marketplace, station, me, action }: Pick<GameData, 'ships' | 'crew' | 'expeditions' | 'cooldowns' | 'inventory' | 'marketplace' | 'station' | 'me' | 'action'>) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [operation, setOperation] = useState('rename');
  const [renameName, setRenameName] = useState('');
  const [upgradeSlug, setUpgradeSlug] = useState('');
  const [skinSlug, setSkinSlug] = useState('');
  const [fuelCells, setFuelCells] = useState(1);
  const [repairAmount, setRepairAmount] = useState(10);
  const [confirm, setConfirm] = useState<{ path: string; payload: unknown; label: string; title: string; body: string } | null>(null);
  const selected = ships.find(ship => ship.id === selectedId) ?? null;
  const deployed = new Set(expeditions.filter(expedition => expedition.status === 'active').map(expedition => expedition.shipId));
  const upgrade = marketplace?.ships.upgrades.find(item => item.slug === upgradeSlug);
  const skin = marketplace?.ships.skins.find(item => item.slug === skinSlug);
  const fuelHeld = inventory.find(item => item.itemSlug === 'fuel')?.quantity ?? 0;
  const skinRemaining = selected ? cooldownRemaining(cooldowns, `ship-skin:${selected.id}`, Date.now()) : 0;
  const openShip = (ship: Ship) => { setSelectedId(ship.id); setRenameName(ship.name); setUpgradeSlug(marketplace?.ships.upgrades.find(item => !ship.upgrades.includes(item.slug))?.slug ?? ''); setSkinSlug(marketplace?.ships.skins.find(item => item.classSlug === ship.classSlug && item.slug !== ship.activeSkin)?.slug ?? ''); };
  const requestConfirmation = () => {
    if (!selected) return;
    if (operation === 'rename') setConfirm({ path: `/api/v1/ships/${selected.id}/rename`, payload: { name: renameName.trim() }, label: `${selected.name} renamed`, title: 'Confirm registry rename', body: `Rename ${selected.name} to ${renameName.trim()} for ${marketplace?.ships.renameCredits ?? 100} credits?` });
    if (operation === 'upgrade' && upgrade) setConfirm({ path: `/api/v1/ships/${selected.id}/upgrade`, payload: { slug: upgrade.slug }, label: `${upgrade.name} installed`, title: 'Confirm ship upgrade', body: `Install ${upgrade.name} for ${upgrade.credits.toLocaleString()} credits${upgrade.alloys ? `, ${upgrade.alloys} alloys` : ''}${upgrade.electronics ? `, ${upgrade.electronics} electronics` : ''}?` });
    if (operation === 'license' && skin) setConfirm({ path: `/api/v1/ships/${selected.id}/skin`, payload: { skinSlug: skin.slug }, label: `${skin.name} frame equipped`, title: 'Confirm premium license and 30-day lock', body: `${selected.ownedSkins.includes(skin.slug) ? 'Equip the owned' : `Purchase the ${skin.credits.toLocaleString()} credit`} ${skin.name} frame? This immediately locks skin changes on this ship for 30 days.` });
    if (operation === 'refuel') setConfirm({ path: `/api/v1/ships/${selected.id}/refuel`, payload: { cells: fuelCells }, label: `${selected.name} refueled`, title: 'Confirm fuel transfer', body: `Transfer ${fuelCells} fuel cell${fuelCells === 1 ? '' : 's'} to ${selected.name}? Your hold currently contains ${fuelHeld}.` });
    if (operation === 'repair') setConfirm({ path: `/api/v1/ships/${selected.id}/repair`, payload: { amount: repairAmount }, label: `${selected.name} repaired`, title: 'Confirm hull repair', body: `Restore up to ${repairAmount}% condition. Base estimate: ${(repairAmount * (marketplace?.ships.repair.creditsPerCondition ?? 8)).toLocaleString()} credits plus ${Math.ceil(repairAmount / 20) * (marketplace?.ships.repair.alloysPerTwentyCondition ?? 1)} alloys before discounts.` });
  };
  return <div className="page-stack"><SectionTitle eyebrow="FLEET REGISTRY" title="Ships" description="Select a ship card to open its management console." icon="expedition" /><ResponsiveGrid min="19rem">{ships.map(ship => <Card key={ship.id} className={`ship-card ship-card--selectable ${selectedId === ship.id ? 'is-selected' : ''}`} role="button" tabIndex={0} onClick={() => openShip(ship)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') openShip(ship); }}><div className="ship-card__schematic">{ship.activeSkin ? <GameArtwork src={`/ships/skins/${ship.activeSkin}.webp`} alt={`${ship.name} premium frame`} sizes="(max-width: 760px) 88vw, 28rem" /> : ["salvage-skiff", "cargo-hauler"].includes(ship.classSlug) ? <GameArtwork src={`/ships/base/${ship.classSlug}.webp`} alt={`${ship.name} base frame`} sizes="(max-width: 760px) 88vw, 28rem" /> : <NWIcon name="expedition" size={50} />}<span>{ship.classSlug}</span></div><div className="ship-card__head"><h3>{ship.name}</h3><Badge tone={deployed.has(ship.id) ? 'warning' : 'success'}>{deployed.has(ship.id) ? 'Deployed' : 'Select to manage'}</Badge></div><HealthBar label="Hull condition" value={ship.condition} /><div className="ship-card__stats"><StatusDisplay compact label="Cargo" value={ship.cargoCapacity} icon="cargo" tone="info" /><StatusDisplay compact label="Fuel" value={ship.fuel} icon="fuel" tone="purple" /></div></Card>)}</ResponsiveGrid>{!selected && <Notification title="Select a ship" tone="info">Management controls remain closed until you choose a fleet card.</Notification>}{selected && <Panel tone="purple"><SectionTitle eyebrow="SELECTED SHIP" title={selected.name} description={`${selected.classSlug} · ${selected.condition}% hull · ${selected.fuel} fuel · ${selected.cargoCapacity} cargo`} icon="expedition" action={<Button size="sm" variant="ghost" onClick={() => setSelectedId(null)}>Close</Button>} />{deployed.has(selected.id) && <Notification title="Ship deployed" tone="warning">Preview is available, but changes cannot be confirmed until this ship returns.</Notification>}<Field label="Management action"><Select value={operation} onChange={event => setOperation(event.target.value)}><option value="rename">Rename registry</option><option value="upgrade">Install upgrade</option><option value="license">Upgrade skin license</option><option value="refuel">Transfer fuel</option><option value="repair">Repair hull</option></Select></Field>{operation === 'rename' && <Card><Field label="Preview new name"><Input value={renameName} maxLength={40} onChange={event => setRenameName(event.target.value)} /></Field><p>{selected.name} → <strong>{renameName.trim() || 'Enter a name'}</strong> · {marketplace?.ships.renameCredits ?? 100} credits</p></Card>}{operation === 'upgrade' && <Card><Field label="Upgrade preview"><Select value={upgradeSlug} onChange={event => setUpgradeSlug(event.target.value)}>{marketplace?.ships.upgrades.filter(item => !selected.upgrades.includes(item.slug)).map(item => <option key={item.slug} value={item.slug}>{item.name} · {item.credits.toLocaleString()} cr</option>)}</Select></Field>{upgrade ? <><h3>{upgrade.name}</h3><p>{upgrade.description}</p><div className="trait-list">{upgrade.cargoBonus ? <Pill tone="info">+{upgrade.cargoBonus} cargo</Pill> : null}{upgrade.fuelDiscount ? <Pill tone="purple">−{upgrade.fuelDiscount} fuel</Pill> : null}{upgrade.repairDiscount ? <Pill tone="success">−{Math.round(upgrade.repairDiscount * 100)}% repair</Pill> : null}</div></> : <p>All upgrades installed.</p>}</Card>}{operation === 'license' && <Card>{skin && <GameArtwork className="management-preview" src={`/ships/skins/${skin.slug}.webp`} alt={`${skin.name} preview`} sizes="(max-width: 760px) 88vw, 34rem" />}<Field label="License preview"><Select value={skinSlug} onChange={event => setSkinSlug(event.target.value)}>{marketplace?.ships.skins.filter(item => item.classSlug === selected.classSlug).map(item => <option key={item.slug} value={item.slug}>{item.name} · {selected.ownedSkins.includes(item.slug) ? 'owned' : `${item.credits.toLocaleString()} cr`}</option>)}</Select></Field>{skin && <><h3>{skin.name}</h3><p>{skin.description}</p><p><strong>Warning:</strong> equipping starts a 30-day cooldown. {skinRemaining > 0 ? `Current lock: ${formatCountdown(skinRemaining)}.` : 'Frame controls ready.'}</p></>}</Card>}{operation === 'refuel' && <Card><Field label="Fuel transfer preview"><Select value={fuelCells} onChange={event => setFuelCells(Number(event.target.value))}>{[1, 5, 10].map(value => <option key={value} value={value}>{value} cell{value === 1 ? '' : 's'} · fuel {selected.fuel} → {selected.fuel + value}</option>)}</Select></Field><p>{fuelHeld} fuel cells available in your hold.</p></Card>}{operation === 'repair' && <Card><Field label="Repair preview"><Select value={repairAmount} onChange={event => setRepairAmount(Number(event.target.value))}>{[10, 25, 50, 100].map(value => <option key={value} value={Math.min(value, 100 - selected.condition)}>Restore up to {Math.min(value, 100 - selected.condition)}% condition</option>)}</Select></Field></Card>}<Button fullWidth disabled={deployed.has(selected.id) || (operation === 'rename' && (renameName.trim().length < 2 || renameName.trim() === selected.name)) || (operation === 'upgrade' && !upgrade) || (operation === 'license' && (!skin || skinRemaining > 0)) || (operation === 'refuel' && fuelHeld < fuelCells) || (operation === 'repair' && selected.condition >= 100)} onClick={requestConfirmation}>Preview complete · Continue to confirmation</Button></Panel>}<Panel tone="purple"><SectionTitle eyebrow="SHIP BROKER" title="Expand the Fleet" description="Purchases require two crew per registered ship and active Marketplace and Shipyard modules." icon="trade" /><div className="inline-actions">{marketplace?.ships.purchases.map(definition => <Button key={definition.slug} disabled={!marketplace.unlocked || station?.modules.find(module => module.slug === 'shipyard')?.state !== 'active' || ships.length >= Math.max(1, Math.floor(crew.length / 2)) || (me.player?.credits ?? 0) < definition.credits} onClick={() => setConfirm({ path: '/api/v1/ships/purchase', payload: { classSlug: definition.slug }, label: `${definition.name} purchased`, title: `Confirm ${definition.name} purchase`, body: `Purchase for ${definition.credits.toLocaleString()} credits? Base capacity: ${definition.cargoCapacity} cargo and ${definition.fuel} fuel.` })}>{definition.name} · {definition.credits.toLocaleString()} cr</Button>)}</div></Panel><ConfirmWindow open={Boolean(confirm)} onClose={() => setConfirm(null)} onConfirm={() => { if (confirm) void action(confirm.path, confirm.payload, confirm.label); setConfirm(null); }} title={confirm?.title ?? 'Confirm change'} confirmLabel="Confirm"><p>{confirm?.body}</p></ConfirmWindow></div>;
}

export function LegacyShipsPage({ ships, crew, expeditions, cooldowns, marketplace, station, me, action }: Pick<GameData, 'ships' | 'crew' | 'expeditions' | 'cooldowns' | 'marketplace' | 'station' | 'me' | 'action'>) {
  const [renameNames, setRenameNames] = useState<Record<string, string>>({});
  const fleetCapacity = Math.max(1, Math.floor(crew.length / 2));
  const canAddShip = ships.length < fleetCapacity;
  const shipyardActive = station?.modules.find(module => module.slug === 'shipyard')?.state === 'active';
  const deployedShipIds = new Set(expeditions.filter(expedition => expedition.status === 'active').map(expedition => expedition.shipId));
  const renameCredits = marketplace?.ships.renameCredits ?? 100;
  return (
    <div className="page-stack">
      <SectionTitle eyebrow="FLEET REGISTRY" title="Ships" description="Condition, fuel, cargo, and crew-supported fleet capacity." icon="expedition" action={<Badge tone={canAddShip ? 'success' : 'warning'}>{ships.length}/{fleetCapacity} SLOTS</Badge>} />
      <ResponsiveGrid min="19rem">{ships.map(ship => <Card key={ship.id} className="ship-card"><div className="ship-card__schematic">{ship.activeSkin ? <GameArtwork src={`/ships/skins/${ship.activeSkin}.webp`} alt={`${ship.name} premium frame`} sizes="(max-width: 760px) 88vw, 28rem" /> : ["salvage-skiff", "cargo-hauler"].includes(ship.classSlug) ? <GameArtwork src={`/ships/base/${ship.classSlug}.webp`} alt={`${ship.name} base frame`} sizes="(max-width: 760px) 88vw, 28rem" /> : <NWIcon name="expedition" size={50} />}<span className="nw-numeric">{ship.classSlug}</span></div><div className="ship-card__head"><h3>{ship.name}</h3><Badge tone={toneForValue(ship.condition)}>{ship.condition}% condition</Badge></div><HealthBar label="Hull condition" value={ship.condition} /><div className="ship-card__stats"><StatusDisplay compact label="Cargo" value={ship.cargoCapacity} icon="cargo" tone="info" /><StatusDisplay compact label="Fuel" value={ship.fuel} icon="fuel" tone="purple" /></div><div className="inline-actions"><Button size="sm" onClick={() => void action(`/api/v1/ships/${ship.id}/refuel`, { cells: 1 }, 'Ship refueled')}>Use fuel cell</Button><Button size="sm" variant="ghost" disabled={ship.condition >= 100} onClick={() => void action(`/api/v1/ships/${ship.id}/repair`, { amount: Math.min(10, 100 - ship.condition) }, 'Ship repaired')}>Repair hull</Button><Button size="sm" variant="ghost" onClick={() => void action(`/api/v1/ships/${ship.id}/upgrade`, { slug: 'expanded-hold' }, 'Cargo upgrade installed')}>Upgrade hold</Button></div></Card>)}</ResponsiveGrid>
      {!!ships.length && <Panel><SectionTitle eyebrow="SHIP REGISTRY" title="Rename Registered Ships" description={`Registry changes cost ${renameCredits.toLocaleString()} credits. Ships currently deployed cannot be renamed.`} icon="data" /><div className="side-stack">{ships.map(ship => { const name = renameNames[ship.id] ?? ship.name; const deployed = deployedShipIds.has(ship.id); const invalid = name.trim().length < 2 || name.trim().length > 40 || name.trim() === ship.name; return <Card key={ship.id}><div className="ship-card__head"><h3>{ship.name}</h3><Badge tone={deployed ? 'warning' : 'success'}>{deployed ? 'Deployed' : 'In dock'}</Badge></div><Field label="New registry name"><div className="inline-actions"><Input value={name} maxLength={40} disabled={deployed} onChange={event => setRenameNames(current => ({ ...current, [ship.id]: event.target.value }))} /><Button size="sm" disabled={deployed || invalid || (me.player?.credits ?? 0) < renameCredits} onClick={() => void action(`/api/v1/ships/${ship.id}/rename`, { name: name.trim() }, `${ship.name} renamed`)}>Rename · {renameCredits} cr</Button></div></Field></Card>; })}</div></Panel>}
      {!!ships.length && <Panel><SectionTitle eyebrow="UPGRADE CATALOG" title="Ship Upgrade Statistics" description={`Base repairs cost ${marketplace?.ships.repair.creditsPerCondition ?? 8} credits per condition plus ${marketplace?.ships.repair.alloysPerTwentyCondition ?? 1} alloy per 20 condition before career and Shipyard discounts.`} icon="data" /><ResponsiveGrid min="17rem">{marketplace?.ships.upgrades.map(upgrade => <Card key={upgrade.slug}><h3>{upgrade.name}</h3><p>{upgrade.description}</p><div className="material-readout"><span>Install cost</span><strong>{upgrade.credits.toLocaleString()} cr{upgrade.alloys ? ` · ${upgrade.alloys} alloys` : ''}{upgrade.electronics ? ` · ${upgrade.electronics} electronics` : ''}</strong></div><div className="trait-list">{ships.map(ship => <Button key={ship.id} size="sm" variant="ghost" disabled={ship.upgrades.includes(upgrade.slug)} onClick={() => void action(`/api/v1/ships/${ship.id}/upgrade`, { slug: upgrade.slug }, `${upgrade.name} installed`)}>{ship.name} · {ship.upgrades.includes(upgrade.slug) ? 'installed' : 'install'}</Button>)}</div></Card>)}</ResponsiveGrid></Panel>}
      <PremiumSkinsPanel ships={ships} expeditions={expeditions} cooldowns={cooldowns} marketplace={marketplace} me={me} action={action} />
      {!ships.length && <Notification title="No registered craft" tone="info">The fleet registry is currently empty.</Notification>}
      <Panel tone="purple"><SectionTitle eyebrow="SHIP BROKER" title="Expand the Fleet" description="Each registered ship requires two recruited crew. Purchases require an active Marketplace and Shipyard." icon="trade" /><ResponsiveGrid min="13rem"><StatusDisplay label="Credits" value={me.player?.credits ?? 0} unit=" cr" icon="credits" tone="success" /><StatusDisplay label="Crew" value={crew.length} icon="crew" tone="info" /><StatusDisplay label="Fleet Capacity" value={fleetCapacity} icon="expedition" tone="purple" /></ResponsiveGrid>{!marketplace?.unlocked && <Notification title="Marketplace offline" tone="warning">Repair the Marketplace module in the Build menu before buying ships.</Notification>}{!shipyardActive && <Notification title="Shipyard offline" tone="warning">Complete the Shipyard module before buying ships.</Notification>}<div className="inline-actions"><Button disabled={!canAddShip || !marketplace?.unlocked || !shipyardActive || (me.player?.credits ?? 0) < 1200} onClick={() => void action('/api/v1/ships/purchase', { classSlug: 'salvage-skiff' }, 'Salvage Skiff purchased')}>Buy Salvage Skiff · 1,200 cr</Button><Button variant="ghost" disabled={!canAddShip || !marketplace?.unlocked || !shipyardActive || (me.player?.credits ?? 0) < 2200} onClick={() => void action('/api/v1/ships/purchase', { classSlug: 'cargo-hauler' }, 'Cargo Hauler purchased')}>Buy Cargo Hauler · 2,200 cr</Button></div>{!canAddShip && <p>Recruit {Math.max(0, (ships.length + 1) * 2 - crew.length)} more crew to open the next fleet slot.</p>}</Panel>
    </div>
  );
}

function PremiumSkinsPanel({ ships, expeditions, cooldowns, marketplace, me, action }: Pick<GameData, 'ships' | 'expeditions' | 'cooldowns' | 'marketplace' | 'me' | 'action'>) {
  const [choice, setChoice] = useState<{ ship: Ship; skin: Marketplace['ships']['skins'][number] } | null>(null);
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, []);
  const deployed = new Set(expeditions.filter(expedition => expedition.status === 'active').map(expedition => expedition.shipId));
  if (!marketplace?.ships.skins.length) return null;
  return <Panel tone="purple"><SectionTitle eyebrow="PREMIUM FRAME LICENSES" title="Ship Skins & Specialized Statistics" description="Permanent licenses cost 25,000 credits. Every equip locks that ship's frame controls for 30 days." icon="expedition" /><Notification title="Massive cooldown — confirm carefully" tone="warning">The 30-day cooldown begins immediately and cannot be bypassed. Bonuses stack with installed upgrades. A purchased license remains owned, but equipping an owned skin still starts the cooldown.</Notification><ResponsiveGrid min="20rem">{marketplace.ships.skins.map(skin => <Card key={skin.slug} className="skin-card"><GameArtwork src={`/ships/skins/${skin.slug}.webp`} alt={`${skin.name} premium ${skin.classSlug} skin`} sizes="(max-width: 760px) 88vw, 30rem" /><div className="ship-card__head"><h3>{skin.name}</h3><Badge tone="purple">{skin.credits.toLocaleString()} cr</Badge></div><p>{skin.description}</p><div className="trait-list">{skin.cargoBonus ? <Pill tone="info">+{skin.cargoBonus} cargo</Pill> : null}{skin.fuelDiscount ? <Pill tone="purple">−{skin.fuelDiscount} expedition fuel</Pill> : null}{skin.repairDiscount ? <Pill tone="success">−{Math.round(skin.repairDiscount * 100)}% repair cost</Pill> : null}{skin.lootRollBonus ? <Pill tone="info">+{skin.lootRollBonus} loot roll</Pill> : null}{skin.successBonus ? <Pill tone="success">+{Math.round(skin.successBonus * 100)}% success</Pill> : null}</div><div className="side-stack">{ships.filter(ship => ship.classSlug === skin.classSlug).map(ship => { const owned = ship.ownedSkins.includes(skin.slug); const active = ship.activeSkin === skin.slug; const busy = deployed.has(ship.id); const remaining = cooldownRemaining(cooldowns, `ship-skin:${ship.id}`, now); return <Button key={ship.id} size="sm" variant={owned ? 'ghost' : 'primary'} disabled={active || busy || remaining > 0 || (!owned && (me.player?.credits ?? 0) < skin.credits)} onClick={() => setChoice({ ship, skin })}>{ship.name} · {active ? 'active' : busy ? 'deployed' : remaining > 0 ? `locked ${formatCountdown(remaining)}` : owned ? 'equip owned' : `license ${skin.credits.toLocaleString()} cr`}</Button>; })}</div></Card>)}</ResponsiveGrid><ConfirmWindow open={Boolean(choice)} onClose={() => setChoice(null)} onConfirm={() => { if (choice) void action(`/api/v1/ships/${choice.ship.id}/skin`, { skinSlug: choice.skin.slug }, `${choice.skin.name} frame equipped`); setChoice(null); }} title="Confirm 30-day frame lock" confirmLabel={choice?.ship.ownedSkins.includes(choice.skin.slug) ? 'Equip and lock 30 days' : `Spend ${choice?.skin.credits.toLocaleString() ?? '25,000'} credits`}><p><strong>{choice?.skin.name}</strong> will be installed on <strong>{choice?.ship.name}</strong>. This immediately starts a 30-day per-ship cooldown. No other skin can be equipped on this ship until it expires.</p></ConfirmWindow></Panel>;
}

function CrewPage({ crew, action }: Pick<GameData, 'crew' | 'action'>) {
  const [recruitName, setRecruitName] = useState('Nova');
  const [recruitRole, setRecruitRole] = useState('engineer');
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, []);
  return (
    <div className="page-stack">
      <SectionTitle eyebrow="PERSONNEL NETWORK" title="Crew Roster" description="Role, level, morale, and trait telemetry from the station crew service." icon="crew" />
      <ResponsiveGrid min="18rem">{crew.map(member => { const exhaustion = member.injuredUntil ? Date.parse(member.injuredUntil) - now : 0; const cost = member.level * 250; const stars = (value: number) => `${'★'.repeat(value)}${'☆'.repeat(5 - value)}`; const jobBenefit = member.role === 'pilot' ? '+1% expedition success per job star' : member.role === 'engineer' ? '3 job stars: −1 expedition fuel' : member.role === 'quartermaster' ? '4 job stars: +1 expedition loot roll' : member.role === 'scout' ? '+0.6% expedition success per job star' : member.role === 'medic' ? 'Improves field readiness' : '+0.2% expedition success per talent star'; const talentBenefit = member.role === 'medic' ? '−8% injury recovery time per talent star' : member.role === 'scout' ? '+0.8% expedition success per talent star' : member.role === 'pilot' ? '+0.4% expedition success per talent star' : '+0.2% expedition success per talent star'; return <Card key={member.id} className="crew-card"><div className="crew-card__identity"><div className="crew-ident">{member.name.slice(0, 2).toUpperCase()}</div><div><h3>{member.name}</h3><p>{member.role} · Level {member.level}</p></div><Badge tone={exhaustion > 0 ? 'warning' : toneForValue(member.morale)}>{exhaustion > 0 ? `Resting ${formatCountdown(exhaustion)}` : `${member.morale}% morale`}</Badge></div><ProgressBar label="Morale" value={member.morale} tone={toneForValue(member.morale)} /><div className="crew-rating"><div><span>Job certification</span><strong aria-label={`${member.jobStars} of 5 job stars`}>{stars(member.jobStars)}</strong><small>{jobBenefit}</small></div><div><span>Talent</span><strong aria-label={`${member.talentStars} of 5 talent stars`}>{stars(member.talentStars)}</strong><small>{talentBenefit}</small></div></div><div className="trait-list">{member.traits?.map((trait: string) => <Pill key={trait} tone="neutral">{trait}</Pill>)}</div><div className="inline-actions"><Button size="sm" variant="ghost" disabled={exhaustion > 0 || member.jobStars >= 5} onClick={() => void action(`/api/v1/crew/${member.id}/train`, { focus: 'job' }, 'Job certification improved')}>{exhaustion > 0 ? `Available in ${formatCountdown(exhaustion)}` : member.jobStars >= 5 ? 'Job maxed' : `Train job · ${cost.toLocaleString()} cr`}</Button><Button size="sm" variant="ghost" disabled={exhaustion > 0 || member.talentStars >= 5} onClick={() => void action(`/api/v1/crew/${member.id}/train`, { focus: 'talent' }, 'Talent improved')}>{exhaustion > 0 ? 'Resting' : member.talentStars >= 5 ? 'Talent maxed' : `Train talent · ${cost.toLocaleString()} cr`}</Button></div></Card>; })}</ResponsiveGrid>
      {!crew.length && <Notification title="No crew records" tone="info">Personnel data has not yet been assigned to this station.</Notification>}
      <Panel><SectionTitle eyebrow="RECRUITMENT" title="Hire Crew" description="Recruitment costs are enforced by the server." icon="crew" /><Field label="Crew name"><Input value={recruitName} onChange={event => setRecruitName(event.target.value)} /></Field><Field label="Role"><Select value={recruitRole} onChange={event => setRecruitRole(event.target.value)}><option value="pilot">Pilot</option><option value="engineer">Engineer</option><option value="medic">Medic</option><option value="scout">Scout</option><option value="quartermaster">Quartermaster</option></Select></Field><Button onClick={() => void action('/api/v1/crew/recruit', { name: recruitName, role: recruitRole }, 'Crew recruited')}>Recruit for 400 credits</Button></Panel>
    </div>
  );
}

function ExpeditionPage({ expeditions, expeditionDefinitions, ships, crew, action }: Pick<GameData, 'expeditions' | 'expeditionDefinitions' | 'ships' | 'crew' | 'action'>) {
  const activeShipIds = new Set(expeditions.filter(expedition => expedition.status === 'active').map(expedition => expedition.shipId));
  const availableShips = ships.filter(ship => !activeShipIds.has(ship.id));
  const [shipId, setShipId] = useState(availableShips[0]?.id ?? '');
  const activeCrewIds = new Set(expeditions.filter(expedition => expedition.status === 'active').flatMap(expedition => expedition.crewIds ?? []));
  const availableCrew = crew.filter(member => !activeCrewIds.has(member.id) && (!member.injuredUntil || Date.parse(member.injuredUntil) <= Date.now()));
  const [crewIds, setCrewIds] = useState<string[]>(availableCrew.slice(0, 3).map(member => member.id));
  const [now, setNow] = useState(Date.now());
  const [lootInfo, setLootInfo] = useState<ExpeditionDefinition | null>(null);
  useEffect(() => { if (!availableShips.some(ship => ship.id === shipId)) setShipId(availableShips[0]?.id ?? ''); }, [shipId, ships, expeditions]);
  useEffect(() => { setCrewIds(current => current.filter(id => !activeCrewIds.has(id) && crew.some(member => member.id === id && (!member.injuredUntil || Date.parse(member.injuredUntil) <= Date.now())))); }, [expeditions, crew]);
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, []);
  const toggleCrew = (id: string) => setCrewIds(current => current.includes(id) ? current.filter(candidate => candidate !== id) : [...current, id].slice(0, 4));
  const launch = (definition: string) => action('/api/v1/expeditions/launch', { definition, shipId: shipId || undefined, crewIds }, 'Expedition launched');
  const selectedShip = availableShips.find(ship => ship.id === shipId);
  return (
    <div className="page-stack">
      <SectionTitle eyebrow="DEEP FIELD" title="Expeditions" description="Launch existing expedition definitions, observe worker resolution, and claim server-calculated rewards." icon="expedition" />
      <ResponsiveGrid min="18rem" className="expedition-launchers">
        {expeditionDefinitions.map(definition => {
          const unavailable = !selectedShip || selectedShip.fuel < definition.fuelCost || crewIds.length < definition.minCrew;
          return <Card key={definition.slug} tone={definition.risk === 'extreme' || definition.risk === 'high' ? 'purple' : undefined}><div className="inline-actions"><NWIcon name={definition.risk === 'high' || definition.risk === 'extreme' ? 'signal' : 'expedition'} size={24} /><Badge tone={riskTone(definition.risk)}>{definition.risk} risk</Badge></div><h3>{definition.name}</h3><p>{definition.description}</p><div className="trait-list"><Pill tone="purple">{definition.fuelCost} fuel</Pill><Pill tone="neutral">{definition.minCrew} crew</Pill><Pill tone="neutral">{definition.durationMinutes[0]}–{definition.durationMinutes[1]} min</Pill></div><div className="inline-actions"><Button size="sm" disabled={unavailable} onClick={() => void launch(definition.slug)}>Launch</Button><Button size="sm" variant="ghost" onClick={() => setLootInfo(definition)}>Loot info</Button></div></Card>;
        })}
      </ResponsiveGrid>
      <Panel><SectionTitle eyebrow="MISSION LOADOUT" title="Assign ship and crew" icon="crew" /><Field label="Available ship"><Select value={shipId} disabled={!availableShips.length} onChange={event => setShipId(event.target.value)}>{!availableShips.length && <option value="">All ships deployed</option>}{availableShips.map(ship => <option key={ship.id} value={ship.id}>{ship.name} · {ship.fuel} fuel</option>)}</Select></Field><div className="trait-list">{crew.map(member => { const busy = activeCrewIds.has(member.id); const resting = Boolean(member.injuredUntil && Date.parse(member.injuredUntil) > now); return <Button key={member.id} size="sm" disabled={busy || resting} variant={crewIds.includes(member.id) ? 'primary' : 'ghost'} onClick={() => toggleCrew(member.id)}>{member.name} · {busy ? 'deployed' : resting ? `resting ${formatCountdown(Date.parse(member.injuredUntil!) - now)}` : member.role}</Button>; })}</div><p>{crewIds.length} crew assigned. Deployed ships and crew are excluded; up to four crew may deploy.</p></Panel>
      <Panel>
        <SectionTitle eyebrow="MISSION LEDGER" title="Deployment History" icon="archive" />
        <DataGrid rows={expeditions ?? []} getRowKey={expedition => expedition.id} empty="No expeditions have been launched." columns={[
          { key: 'name', header: 'Mission', render: expedition => <strong>{expedition.name}</strong> },
          { key: 'status', header: 'Status', render: expedition => <Badge tone={expeditionTone(expedition.status)}>{expedition.status}</Badge> },
          { key: 'return', header: 'Return', render: expedition => expedition.status === 'active' && expedition.resolvesAt ? <span className="nw-numeric">{formatCountdown(Date.parse(expedition.resolvesAt) - now)}</span> : <span className="nw-numeric">—</span> },
          { key: 'log', header: 'Incident log', render: expedition => expedition.incidentLog?.join(' ') || 'Awaiting telemetry' },
          { key: 'action', header: 'Command', align: 'right', render: expedition => ['resolved', 'failed'].includes(expedition.status) ? <Button size="sm" variant="primary" onClick={() => void action(`/api/v1/expeditions/${expedition.id}/claim`, undefined, 'Expedition claimed')}>Claim</Button> : <span className="nw-numeric">LOCKED</span> }
        ]} />
      </Panel>
      <ConfirmWindow open={Boolean(lootInfo)} onClose={() => setLootInfo(null)} onConfirm={() => setLootInfo(null)} title={`${lootInfo?.name ?? 'Expedition'} loot statistics`} confirmLabel="Close"><p>{lootInfo ? `${Math.round(lootInfo.successChance * 100)}% mission success · ${lootInfo.lootRolls} weighted loot rolls · ${lootInfo.rewardQuantity[0]}–${lootInfo.rewardQuantity[1]} units per roll. Success base: ${lootInfo.baseRewards.success}. Failure base: ${lootInfo.baseRewards.failure}.` : ''}</p><div className="trait-list">{lootInfo?.lootPool.map(item => <Pill key={item.slug} tone={rarityTone(item.rarity)}>{item.name} · {item.rarity} · {(item.chancePerRoll * 100).toFixed(1)}%/roll</Pill>)}</div></ConfirmWindow>
    </div>
  );
}

function MuseumPage({ station, inventory, action }: Pick<GameData, 'station' | 'inventory' | 'action'>) {
  const plaques = station?.modules.flatMap(module => module.plaques ?? []) ?? [];
  const artifacts = inventory.filter(item => ['unknown-relic', 'quantum-key'].includes(item.itemSlug));
  const museum = station?.modules.find(module => module.slug === 'museum');
  const intakeRemaining = Math.max(0, (station?.museum.dailyCapacity ?? 0) - (station?.museum.donatedToday ?? 0));
  const rewardMultiplier = 1 + Number(museum?.effects.donationRewardBonus ?? 0);
  return (
    <div className="page-stack">
      <SectionTitle eyebrow="CULTURAL ARCHIVE" title="Museum & Founders Hall" description="Artifacts are permanently consumed for study, public morale, personal credits, XP, and reputation." icon="museum" />
      <ResponsiveGrid min="13rem"><StatusDisplay label="Museum Level" value={museum?.level ?? 0} unit={`/${museum?.maxLevel ?? 4}`} icon="museum" tone="purple" /><StatusDisplay label="Today's Intake" value={station?.museum.donatedToday ?? 0} unit={`/${station?.museum.dailyCapacity ?? 0}`} icon="resources" tone={intakeRemaining > 0 ? 'success' : 'warning'} /><StatusDisplay label="Reward Bonus" value={Math.round((rewardMultiplier - 1) * 100)} unit="%" icon="credits" tone="success" /></ResponsiveGrid>
      {!!station?.museum.collection.length && <Panel><SectionTitle eyebrow="PERMANENT COLLECTION" title="Artifacts Consumed" icon="archive" /><div className="trait-list">{station.museum.collection.map(item => <Pill key={item.itemSlug} tone="purple">{item.quantity} × {item.name}</Pill>)}</div></Panel>}
      {plaques.length ? <ResponsiveGrid min="19rem">{plaques.map(plaque => <Card key={plaque.id} className="plaque-card"><NWIcon name="museum" size={24} /><span className="nw-eyebrow">ARCHIVE PLAQUE</span><h3>{plaque.title}</h3><p>{plaque.body}</p></Card>)}</ResponsiveGrid> : <Notification title="No plaques installed" tone="info" icon="museum">Community milestones will appear here when the existing game systems create them.</Notification>}
      {artifacts.map(item => { const base = item.itemSlug === 'quantum-key' ? { credits: 1500, xp: 100, reputation: 5, morale: 2 } : { credits: 450, xp: 25, reputation: 1, morale: 1 }; const batch = Math.min(10, item.quantity, intakeRemaining); return <Panel key={item.itemSlug} tone="purple"><SectionTitle eyebrow="DONATION READY" title={item.name} icon="museum" /><p>{item.quantity} held. Each donation pays {Math.floor(base.credits * rewardMultiplier).toLocaleString()} credits, {Math.floor(base.xp * rewardMultiplier)} XP, {base.reputation} reputation, and +{base.morale} station morale.</p><div className="inline-actions"><Button disabled={intakeRemaining < 1} onClick={() => void action('/api/v1/museum/donate', { itemSlug: item.itemSlug, quantity: 1 }, 'Artifact donated')}>Donate 1</Button><Button variant="ghost" disabled={batch < 2} onClick={() => void action('/api/v1/museum/donate', { itemSlug: item.itemSlug, quantity: batch }, `${batch} artifacts donated`)}>Donate {batch}</Button></div></Panel>; })}
      {!artifacts.length && <Notification title="No artifacts in your hold" tone="info">Unknown Relics and Quantum Keys can be surrendered here when recovered.</Notification>}
    </div>
  );
}

function HistoryPage({ history }: Pick<GameData, 'history'>) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('newest');
  const query = search.trim().toLowerCase();
  const categories = [...new Set(history.map(entry => entry.category))].sort();
  const entries = history.filter(entry => (category === 'all' || entry.category === category) && (!query || `${entry.title} ${entry.body} ${entry.actorDisplayName ?? ''} ${JSON.stringify(entry.details ?? {})}`.toLowerCase().includes(query))).sort((left, right) => sort === 'oldest' ? Date.parse(left.createdAt) - Date.parse(right.createdAt) : sort === 'actor' ? (left.actorDisplayName ?? '').localeCompare(right.actorDisplayName ?? '') || Date.parse(right.createdAt) - Date.parse(left.createdAt) : sort === 'category' ? left.category.localeCompare(right.category) || Date.parse(right.createdAt) - Date.parse(left.createdAt) : Date.parse(right.createdAt) - Date.parse(left.createdAt));
  return (
    <div className="page-stack">
      <SectionTitle eyebrow="STATION MEMORY" title="Permanent Operations Archive" description="Search and sort up to 2,000 permanent records by player, operation, wreck, expedition, ship, or recovered item." icon="archive" action={<Badge tone="info">{entries.length.toLocaleString()} records</Badge>} />
      <Panel><div className="hold-toolbar"><Field label="Search archive"><Input value={search} placeholder="Player, ship, wreck, item, operation…" onChange={event => setSearch(event.target.value)} /></Field><Field label="Category"><Select value={category} onChange={event => setCategory(event.target.value)}><option value="all">All categories</option>{categories.map(value => <option key={value} value={value}>{value}</option>)}</Select></Field><Field label="Sort"><Select value={sort} onChange={event => setSort(event.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="actor">Player name</option><option value="category">Category</option></Select></Field></div><DataGrid rows={entries} getRowKey={entry => entry.id} empty="No archive records match those filters." columns={[
        { key: 'when', header: 'When', render: entry => <span className="nw-numeric">{new Date(entry.createdAt).toLocaleString()}</span> },
        { key: 'who', header: 'Who', render: entry => <strong>{entry.actorDisplayName ?? 'Station systems'}</strong> },
        { key: 'how', header: 'How', render: entry => <div><Badge tone="info">{entry.category}</Badge><small className="hold-code">{entry.details?.mode ?? entry.details?.operation ?? 'station event'}</small></div> },
        { key: 'what', header: 'What happened', render: entry => <div><strong>{entry.title}</strong><p>{entry.body}</p>{entry.details?.items?.length ? <div className="trait-list">{entry.details.items.map((item, index) => <Pill key={`${item.itemSlug}-${index}`} tone={rarityTone(item.rarity ?? 'common')}>{item.quantity} × {item.name}</Pill>)}</div> : null}</div> }
      ]} /></Panel>
    </div>
  );
}

function NotificationsPage({ notifications, action }: { notifications: PlayerNotification[]; action: ActionHandler }) {
  const unread = notifications.filter(notification => !notification.readAt).length;
  return (
    <div className="page-stack">
      <SectionTitle eyebrow="PERSONAL SIGNALS" title="Notifications" description="Server-persisted notices for this authenticated wrecker." icon="notifications" action={<div className="inline-actions"><Badge tone={unread ? 'warning' : 'success'}>{unread} unread</Badge>{unread > 0 && <Button size="sm" variant="ghost" onClick={() => void action('/api/v1/notifications/read-all', undefined, 'Notifications marked read')}>Mark all read</Button>}</div>} />
      {notifications.length ? <Panel><ScrollableList label="Player notifications" maxHeight="68vh">{notifications.map(notification => (
        <Notification key={notification.id} title={notification.title} tone={notificationTone(notification)} icon="notifications">
          {notification.body}
          <span className="notification-meta nw-numeric">{notification.type.toUpperCase()} · {new Date(notification.createdAt).toLocaleString()}{notification.readAt ? ' · READ' : ' · UNREAD'}</span>
          {!notification.readAt && <Button size="sm" variant="ghost" onClick={() => void action(`/api/v1/notifications/${notification.id}/read`, undefined, 'Notification marked read')}>Mark read</Button>}
        </Notification>
      ))}</ScrollableList></Panel> : <Notification title="Signal queue clear" tone="success">No personal notifications are currently stored for this account.</Notification>}
    </div>
  );
}

function MarketPage({ marketplace, credits, inventory, catalog, auctions, action }: { marketplace: Marketplace | null; credits: number; inventory: InventoryItem[]; catalog: ItemDefinition[]; auctions: AuctionListing[]; action: ActionHandler }) {
  const [sellItem, setSellItem] = useState(inventory.find(item => item.quantity > 0)?.itemSlug ?? '');
  const [sellQuantity, setSellQuantity] = useState(1);
  const [sellPrice, setSellPrice] = useState(100);
  const [auctionDuration, setAuctionDuration] = useState(48);
  const [cancelListing, setCancelListing] = useState<AuctionListing | null>(null);
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, []);
  return (
    <div className="page-stack">
      <SectionTitle eyebrow="COMMERCE NETWORK" title="Marketplace" description="Live marketplace availability and server-provided listings." icon="trade" action={<Badge tone={marketplace?.unlocked ? 'success' : 'warning'}>{marketplace?.unlocked ? 'ONLINE' : 'LOCKED'}</Badge>} />
      <ResponsiveGrid min="13rem"><StatusDisplay label="Available Credits" value={credits.toLocaleString()} unit=" cr" icon="credits" tone="success" /><StatusDisplay label="Market State" value={marketplace?.unlocked ? 'ACTIVE' : 'OFFLINE'} icon="market" tone={marketplace?.unlocked ? 'success' : 'warning'} /><StatusDisplay label="Listings" value={marketplace?.listings.length ?? 0} icon="inventory" tone="info" /></ResponsiveGrid>
      {marketplace?.unlocked ? (marketplace.listings.length ? <Panel><DataGrid caption="Current station marketplace listings" rows={marketplace.listings} getRowKey={listing => listing.slug} columns={[
        { key: 'item', header: 'Listing', render: listing => <span className="market-listing"><NWIcon name={itemIcon(listing.itemSlug)} size={17} /><strong>{listing.name}</strong></span> },
        { key: 'quantity', header: 'Quantity', align: 'right', render: listing => <span className="nw-numeric">{listing.quantity}</span> },
        { key: 'price', header: 'Price', align: 'right', render: listing => <span className="nw-numeric">{listing.priceCredits.toLocaleString()} cr</span> },
        { key: 'buy', header: 'Command', align: 'right', render: listing => <Button size="sm" disabled={credits < listing.priceCredits} onClick={() => void action('/api/v1/marketplace/buy', { slug: listing.slug, quantity: 1 }, 'Purchase complete')}>Buy</Button> }
      ]} /></Panel> : <Notification title="No listings transmitted" tone="info">The marketplace module is active, but the server returned no current listings.</Notification>) : <Panel className="locked-system"><div className="locked-system__glyph"><NWIcon name="market" size={58} /></div><Badge tone="warning">MODULE OFFLINE</Badge><h2>Marketplace access unavailable</h2><p>The server reports that the marketplace module is not active. The interface cannot bypass that station state.</p><ProgressBar value={0} label="Network availability" tone="warning" /></Panel>}
      {marketplace?.unlocked && <><Panel><SectionTitle eyebrow="PLAYER MARKET" title="Auction House" description="Player listings run for 6 to 72 hours. The shown price is for the full stack." icon="trade" /><DataGrid caption="Active player auctions" rows={auctions} getRowKey={listing => listing.id} empty="No active player auctions." columns={[
        { key: 'item', header: 'Item', render: listing => <Tooltip content={catalog.find(item => item.slug === listing.itemSlug)?.description ?? listing.itemName}><strong>{listing.quantity} × {listing.itemName}</strong></Tooltip> },
        { key: 'seller', header: 'Seller', render: listing => listing.sellerName },
        { key: 'value', header: 'Guide value', align: 'right', render: listing => <span className="nw-numeric">{((catalog.find(item => item.slug === listing.itemSlug)?.valueCredits ?? 0) * listing.quantity).toLocaleString()} cr</span> },
        { key: 'price', header: 'Auction price', align: 'right', render: listing => <span className="nw-numeric">{listing.priceCredits.toLocaleString()} cr</span> },
        { key: 'time', header: 'Ends', render: listing => <span className="nw-numeric">{formatCountdown(Date.parse(listing.expiresAt) - now)}</span> },
        { key: 'buy', header: 'Command', align: 'right', render: listing => listing.ownListing ? <Button size="sm" variant="warning" disabled={credits < listing.cancellationFee} onClick={() => setCancelListing(listing)}>Cancel · {listing.cancellationFee} cr</Button> : <Button size="sm" disabled={credits < listing.priceCredits} onClick={() => void action(`/api/v1/auction/${listing.id}/buy`, undefined, 'Auction purchase complete')}>Buy stack</Button> }
      ]} /></Panel><Panel><SectionTitle eyebrow="CREATE LISTING" title="Auction Your Items" icon="inventory" /><ResponsiveGrid min="12rem"><Field label="Item"><Select value={sellItem} onChange={event => setSellItem(event.target.value)}>{inventory.filter(item => item.quantity > 0 && item.itemSlug !== 'credits').map(item => <option key={item.itemSlug} value={item.itemSlug}>{item.name} ({item.quantity})</option>)}</Select></Field><Field label="Quantity"><Input type="number" min={1} value={sellQuantity} onChange={event => setSellQuantity(Number(event.target.value))} /></Field><Field label="Full stack price (credits)"><Input type="number" min={1} value={sellPrice} onChange={event => setSellPrice(Number(event.target.value))} /></Field><Field label="Auction duration"><Select value={auctionDuration} onChange={event => setAuctionDuration(Number(event.target.value))}><option value={6}>6 hours</option><option value={12}>12 hours</option><option value={24}>24 hours</option><option value={48}>48 hours</option><option value={72}>72 hours</option></Select></Field></ResponsiveGrid><p>Guide value: {((catalog.find(item => item.slug === sellItem)?.valueCredits ?? 0) * sellQuantity).toLocaleString()} cr</p><Button disabled={!sellItem || sellQuantity < 1 || sellPrice < 1} onClick={() => void action('/api/v1/auction/list', { itemSlug: sellItem, quantity: sellQuantity, priceCredits: sellPrice, durationHours: auctionDuration }, 'Auction created')}>List for {auctionDuration} hours</Button></Panel><Panel><SectionTitle eyebrow="SELL INVENTORY" title="Station Buyback" icon="trade" /><ResponsiveGrid min="14rem">{inventory.filter(item => item.quantity > 0 && catalog.find(entry => entry.slug === item.itemSlug)?.sellable).map(item => { const value = catalog.find(entry => entry.slug === item.itemSlug)?.valueCredits ?? 0; return <Tooltip key={item.itemSlug} content={`Guide value ${value} credits. Station buyback may pay a different amount based on career and spread.`}><Card><strong>{item.name}</strong><p>{item.quantity} available · {value.toLocaleString()} cr guide value each</p><Button size="sm" variant="ghost" onClick={() => void action('/api/v1/marketplace/sell', { itemSlug: item.itemSlug, quantity: 1 }, 'Item sold')}>Sell one</Button></Card></Tooltip>; })}</ResponsiveGrid></Panel><ConfirmWindow open={Boolean(cancelListing)} onClose={() => setCancelListing(null)} onConfirm={() => { if (cancelListing) void action(`/api/v1/auction/${cancelListing.id}/cancel`, undefined, 'Auction cancelled'); setCancelListing(null); }} title="Cancel this auction?" confirmLabel={`Pay ${cancelListing?.cancellationFee ?? 0} credits`} tone="warning"><p>The full item stack will return to your hold. The cancellation fee is 2% of the asking price, with a 10-credit minimum and 250-credit cap.</p></ConfirmWindow></>}
    </div>
  );
}

function QuartersPage({ me, quarters, action }: { me: CurrentUser; quarters: Quarters | null; action: ActionHandler }) {
  const [theme, setTheme] = useState(quarters?.layout.theme ?? 'station-zero-default');
  const [objects, setObjects] = useState<QuartersObject[]>(quarters?.layout.objects ?? []);
  const moveObject = (index: number, dx: number, dy: number) => setObjects(current => current.map((object, objectIndex) => objectIndex === index ? { ...object, x: Math.max(0, Math.min(7, object.x + dx)), y: Math.max(0, Math.min(4, object.y + dy)) } : object));
  return (
    <div className="page-stack">
      <SectionTitle eyebrow="PERSONAL HABITAT" title="Quarters Interface" description="Authenticated occupant identity and the current server-provided habitat layout." icon="module" />
      <SplitLayout>
        <Panel><SectionTitle eyebrow="OCCUPANT" title={me.displayName} icon="twitch" /><ProfileChip name={me.displayName} detail={`${me.player?.career ?? 'Wrecker'} · Level ${me.player?.level ?? 1}`} avatarUrl={me.avatarUrl || undefined} /><div className="quarters-readouts"><StatusDisplay label="Access Level" value={me.player?.level ?? 1} icon="module" tone="purple" /><StatusDisplay label="Credits" value={me.player?.credits ?? 0} unit=" cr" icon="credits" tone="success" /><StatusDisplay label="Layout Theme" value={quarters?.layout.theme ?? 'UNAVAILABLE'} icon="settings" tone="info" /></div></Panel>
        <Panel><SectionTitle eyebrow="HABITAT MAP" title="Installed objects" description="Move owned fixtures on the eight-by-five habitat grid and save the layout." icon="diagnostics" />{quarters ? <><Field label="Habitat theme"><Select value={theme} onChange={event => setTheme(event.target.value)}><option value="station-zero-default">Station Zero</option><option value="frost-wrecks">Frost Wrecks</option></Select></Field><div className="quarters-map" role="img" aria-label={`Quarters layout containing ${objects.length} objects`}>{objects.map(object => <div key={`${object.key}-${object.x}-${object.y}`} className="quarters-object" style={{ '--quarters-x': object.x, '--quarters-y': object.y } as CSSProperties}><NWIcon name={quartersObjectIcon(object.key)} size={19} /><span>{object.key.replaceAll('-', ' ')}</span><small className="nw-numeric">X{object.x} Y{object.y}</small></div>)}</div><div className="settings-grid">{objects.map((object, index) => <div key={object.key} className="inline-actions"><strong>{object.key.replaceAll('-', ' ')}</strong><Button size="sm" variant="ghost" onClick={() => moveObject(index, -1, 0)}>←</Button><Button size="sm" variant="ghost" onClick={() => moveObject(index, 1, 0)}>→</Button><Button size="sm" variant="ghost" onClick={() => moveObject(index, 0, -1)}>↑</Button><Button size="sm" variant="ghost" onClick={() => moveObject(index, 0, 1)}>↓</Button></div>)}</div><Button onClick={() => void action('/api/v1/quarters', { theme, objects }, 'Quarters saved')}>Save layout</Button></> : <Notification title="Layout unavailable" tone="warning">The quarters endpoint did not return a layout during this synchronization cycle.</Notification>}</Panel>
      </SplitLayout>
    </div>
  );
}

function ProfilePage({ me, action }: { me: CurrentUser; action: ActionHandler }) {
  return (
    <div className="page-stack">
      <SectionTitle eyebrow="IDENTITY RECORD" title="Wrecker Profile" description="Authenticated Twitch identity and existing player progression data." icon="twitch" />
      <Panel depth="medium" className="profile-console">
        <ProfileChip name={me.displayName} detail={me.player?.title ?? 'Wrecker'} avatarUrl={me.avatarUrl || undefined} />
        <ResponsiveGrid min="12rem"><StatusDisplay label="Level" value={me.player?.level ?? 1} icon="crew" tone="purple" /><StatusDisplay label="Credits" value={me.player?.credits ?? 0} unit=" cr" icon="credits" tone="success" /><StatusDisplay label="Career" value={me.player?.career ?? 'Wrecker'} icon="salvage" tone="info" /></ResponsiveGrid>
        <Field label="Retrain career" hint="The first selection is free; later changes cost credits and have a cooldown."><Select defaultValue={me.player?.career ?? 'salvager'} onChange={event => void action('/api/v1/player/career', { career: event.target.value }, 'Career updated')}><option value="salvager">Salvager</option><option value="hauler">Hauler</option><option value="engineer">Engineer</option><option value="builder">Builder</option><option value="explorer">Explorer</option><option value="trader">Trader</option></Select></Field>
        <Button variant="ghost" onClick={() => void action('/api/v1/auth/logout', undefined, 'Signed out').then(() => { window.location.href = '/'; })}>Sign out</Button>
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

function CommandAction({ icon, title, detail, onClick, tone = 'success', disabled = false }: { icon: IconName; title: string; detail: string; onClick: () => void; tone?: Tone; disabled?: boolean }) {
  return (
    <button className={`command-action nw-tone--${tone}`} onClick={onClick} disabled={disabled}>
      <span className="command-action__icon"><NWIcon name={icon} size={25} /></span>
      <span className="nw-eyebrow">COMMAND</span>
      <strong>{title}</strong>
      <small>{detail}</small>
      <i aria-hidden="true">EXECUTE</i>
    </button>
  );
}

function formatCountdown(milliseconds: number) {
  if (milliseconds <= 0) return '00:00';
  const totalSeconds = Math.ceil(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor(totalSeconds % 3600 / 60);
  const seconds = totalSeconds % 60;
  return hours > 0 ? `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}` : `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function cooldownRemaining(cooldowns: ActionCooldown[], actionKey: string, now: number) {
  const cooldown = cooldowns.find(candidate => candidate.actionKey === actionKey);
  return cooldown ? Date.parse(cooldown.expiresAt) - now : 0;
}

function actionResultMessage(value: unknown) {
  if (!value || typeof value !== 'object') return 'Station records synchronized.';
  const record = value as Record<string, unknown>;
  if (typeof record.received === 'string') return `Received: ${record.received}.`;
  if (record.received && typeof record.received === 'object') {
    if (Array.isArray(record.received)) return `Received: ${record.received.map(entry => { const item = entry as Record<string, unknown>; return `${item.quantity ?? ''} ${item.name ?? item.itemSlug ?? 'reward'}`; }).join(', ')}.`;
    const received = record.received as Record<string, unknown>;
    return `Received ${received.quantity ?? ''} ${received.name ?? received.itemSlug ?? 'reward'}.`;
  }
  const rewards = ['credits', 'creditsSpent', 'creditsEarned', 'scrapConsumed', 'alloysProduced', 'xp', 'loot', 'reward']
    .filter(key => record[key] != null)
    .map(key => `${key.replace(/([A-Z])/g, ' $1').toLowerCase()}: ${typeof record[key] === 'object' ? JSON.stringify(record[key]) : String(record[key])}`);
  return rewards.length ? rewards.join(' · ') : 'The action completed and your station data was updated.';
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

function rarityTone(rarity?: string): Tone {
  if (rarity === 'legendary' || rarity === 'epic') return 'purple';
  if (rarity === 'rare') return 'warning';
  if (rarity === 'uncommon') return 'info';
  return 'neutral';
}

function rarityRank(rarity?: string) {
  return { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4 }[String(rarity ?? '').toLowerCase()] ?? 0;
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

function moduleEffectDescription(module: StationModule) {
  if ('scanBonus' in module.effects) return `Adds ${Math.round(Number(module.effects.scanBonus) * 100)}% salvage success.`;
  if ('storage' in module.effects) return `Adds ${Number(module.effects.storage).toLocaleString()} station storage and ${Math.round(Number(module.effects.cargoYieldBonus ?? 0) * 100)}% Cargo yield.`;
  if ('craftingSpeedBonus' in module.effects) return `Reduces refinery crafting time by ${Math.round(Number(module.effects.craftingSpeedBonus) * 100)}%.`;
  if ('populationCapacity' in module.effects) return `Supports ${Number(module.effects.populationCapacity).toLocaleString()} additional residents and crew quarters.`;
  if ('injuryRecoveryBonus' in module.effects) return `Reduces crew recovery time by ${Math.round(Number(module.effects.injuryRecoveryBonus) * 100)}%.`;
  if ('rareDiscoveryBonus' in module.effects) return `Adds ${Math.round(Number(module.effects.rareDiscoveryBonus) * 100)}% rare discovery chance.`;
  if ('artifactDailyIntake' in module.effects) return `Processes ${Number(module.effects.artifactDailyIntake).toLocaleString()} artifacts daily with a ${Math.round(Number(module.effects.donationRewardBonus) * 100)}% reward bonus.`;
  if ('tradeEnabled' in module.effects) return `Enables station trading and adds ${Math.round(Number(module.effects.marketSellBonus ?? 0) * 100)}% vendor proceeds.`;
  if ('shipRepairDiscount' in module.effects) return `Reduces ship repair costs by ${Math.round(Number(module.effects.shipRepairDiscount) * 100)}%.`;
  return 'Provides station infrastructure support.';
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
