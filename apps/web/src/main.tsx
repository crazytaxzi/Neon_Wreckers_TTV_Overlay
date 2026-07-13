import { type Dispatch, type ReactNode, type SetStateAction, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  BedDouble,
  Hammer,
  Home,
  Landmark,
  type LucideIcon,
  Package,
  Radar,
  Rocket,
  ScrollText,
  Settings,
  ShieldAlert,
  Store,
  Trophy,
  Users,
  Warehouse
} from 'lucide-react';
import { errorMessage, requestApi } from '@neon-wreckers/browser-client';
import '@neon-wreckers/client-theme/styles.css';

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
  player: Player | null;
};

type Plaque = {
  id: string;
  title: string;
  body: string;
};

type StationModule = {
  slug: string;
  name: string;
  state: string;
  progress: number;
  plaques: Plaque[];
};

type Station = {
  name: string;
  population: number;
  power: number;
  integrity: number;
  modules: StationModule[];
};

type Wreck = {
  name: string;
  description: string;
  risk: string;
  integrity: number;
};

type InventoryItem = {
  itemSlug: string;
  name: string;
  quantity: number;
  rarity: string;
  visualKey: string;
};

type Ship = {
  id: string;
  name: string;
  classSlug: string;
  condition: number;
  fuel: number;
  cargoCapacity: number;
};

type CrewMember = {
  id: string;
  name: string;
  role: string;
  level: number;
  morale: number;
  traits: string[];
};

type HistoryEntry = {
  id: string;
  title: string;
  body: string;
};

type ActionHandler = (path: string, payload?: unknown, label?: string) => Promise<unknown | undefined>;

type GameData = {
  me: CurrentUser | null;
  station: Station | null;
  wreck: Wreck | null;
  inventory: InventoryItem[];
  ships: Ship[];
  crew: CrewMember[];
  history: HistoryEntry[];
  notice: string;
  setNotice: Dispatch<SetStateAction<string>>;
  login: () => void;
  action: ActionHandler;
};

type TabId = 'station' | 'salvage' | 'inventory' | 'construction' | 'crew' | 'ships' | 'museum' | 'market' | 'quarters' | 'profile';

type RealtimeMessage =
  | { type: 'station.updated'; station: Station }
  | { type: 'wreck.updated'; wreck: Wreck }
  | { type: 'history.added'; entry: HistoryEntry };

const WS_URL = (() => {
  const url = new URL('/api/v1/ws', window.location.origin);
  url.protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return url.toString();
})();

function parseRealtimeMessage(value: string): RealtimeMessage | null {
  try {
    const message = JSON.parse(value) as Partial<RealtimeMessage>;
    return typeof message.type === 'string' ? message as RealtimeMessage : null;
  } catch {
    return null;
  }
}

function useGameData(): GameData {
  const [me, setMe] = useState<CurrentUser | null>(null);
  const [station, setStation] = useState<Station | null>(null);
  const [wreck, setWreck] = useState<Wreck | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [ships, setShips] = useState<Ship[]>([]);
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [notice, setNotice] = useState('');

  const refresh = async () => {
    setMe(await requestApi<CurrentUser>('/api/v1/me'));
    const results = await Promise.allSettled([
      requestApi<Station>('/api/v1/station'),
      requestApi<Wreck>('/api/v1/wrecks/current'),
      requestApi<InventoryItem[]>('/api/v1/inventory'),
      requestApi<Ship[]>('/api/v1/ships'),
      requestApi<CrewMember[]>('/api/v1/crew'),
      requestApi<HistoryEntry[]>('/api/v1/history')
    ]);

    if (results[0].status === 'fulfilled') setStation(results[0].value);
    if (results[1].status === 'fulfilled') setWreck(results[1].value);
    if (results[2].status === 'fulfilled') setInventory(results[2].value);
    if (results[3].status === 'fulfilled') setShips(results[3].value);
    if (results[4].status === 'fulfilled') setCrew(results[4].value);
    if (results[5].status === 'fulfilled') setHistory(results[5].value);
  };

  useEffect(() => {
    refresh().catch(() => setMe(null));
  }, []);

  useEffect(() => {
    const websocket = new WebSocket(WS_URL);
    websocket.onmessage = event => {
      const message = parseRealtimeMessage(event.data);
      if (!message) return;
      if (message.type === 'station.updated') setStation(message.station);
      if (message.type === 'wreck.updated') setWreck(message.wreck);
      if (message.type === 'history.added') {
        setHistory(current => [message.entry, ...current].slice(0, 50));
      }
    };
    return () => websocket.close();
  }, []);

  const login = () => {
    window.location.href = '/api/v1/auth/twitch/start';
  };

  const action: ActionHandler = async (path, payload, label = 'Done') => {
    try {
      const data = await requestApi(path, {
        method: 'POST',
        body: payload == null ? undefined : JSON.stringify(payload)
      });
      setNotice(label);
      await refresh();
      return data;
    } catch (error) {
      setNotice(errorMessage(error));
      return undefined;
    }
  };

  return { me, station, wreck, inventory, ships, crew, history, notice, setNotice, login, action };
}

function StationArt({ station }: { station: Station | null }) {
  const habitat = station?.modules.find(module => module.slug === 'habitat-ring');
  const damaged = (station?.integrity ?? 100) < 55;
  return (
    <div className={`station-art ${damaged ? 'damaged' : ''}`} aria-label="Animated view of Station Zero">
      <div className="stars" />
      <div className="orbit orbit-a" />
      <div className="orbit orbit-b" style={{ opacity: habitat?.state === 'active' ? 1 : 0.35 }} />
      <div className="core-ship"><span>STATION ZERO</span><i /><b /></div>
      <div className="dock dock-left" />
      <div className="dock dock-right" />
      {station?.modules.map((module, index) => <ModuleChip key={module.slug} module={module} index={index} />)}
    </div>
  );
}

function ModuleChip({ module, index }: { module: StationModule; index: number }) {
  const angle = index * 42;
  const radius = 110 + (index % 3) * 16;
  return (
    <div className={`module-chip ${module.state}`} style={{ transform: `rotate(${angle}deg) translateX(${radius}px) rotate(-${angle}deg)` }}>
      <span>{module.name.split(' ')[0]}</span>
      <meter max={100} value={module.progress} />
    </div>
  );
}

function ItemOrb({ visualKey }: { visualKey: string }) {
  return <div className={`item-orb ${visualKey}`}><span /></div>;
}

function Meter({ value, label }: { value: number; label: string }) {
  return (
    <div className="meter-wrap">
      <div className="meter-label"><span>{label}</span><b>{value}%</b></div>
      <div className="meter"><i style={{ width: `${value}%` }} /></div>
    </div>
  );
}

function App() {
  const game = useGameData();
  const [tab, setTab] = useState<TabId>('station');
  const pages: Record<TabId, ReactNode> = {
    station: <StationPage {...game} />,
    salvage: <SalvagePage {...game} />,
    inventory: <InventoryPage {...game} />,
    construction: <ConstructionPage {...game} />,
    crew: <CrewPage {...game} />,
    ships: <ShipsPage {...game} />,
    museum: <MuseumPage {...game} />,
    market: <MarketPage />,
    quarters: <QuartersPage />,
    profile: <ProfilePage {...game} />
  };

  if (!game.me) {
    return (
      <main className="login">
        <div className="brand-mark">NW</div>
        <h1>Neon Wreckers</h1>
        <p>Station Zero needs your Twitch identity before it lets you near the cutter controls. Honestly, fair.</p>
        <button onClick={game.login}>Sign in with Twitch</button>
        <small>A Twitch account is required.</small>
      </main>
    );
  }

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">NW</div>
          <div><h1>Neon Wreckers</h1><p>Community salvage & station builder</p></div>
        </div>
        <div className="profile">
          <img src={game.me.avatarUrl || ''} alt="" />
          <div><b>{game.me.displayName}</b><small>Rank {game.me.player?.level ?? 1} · {game.me.player?.title}</small></div>
        </div>
      </header>
      <main>{pages[tab]}</main>
      <Nav tab={tab} setTab={setTab} />
      {game.notice && (
        <button className="toast" onClick={() => game.setNotice('')}>
          <b>{game.notice}</b><small>tap to dismiss</small>
        </button>
      )}
    </div>
  );
}

function Nav({ tab, setTab }: { tab: TabId; setTab: Dispatch<SetStateAction<TabId>> }) {
  const items: Array<[TabId, LucideIcon, string]> = [
    ['station', Home, 'Station'],
    ['salvage', Hammer, 'Salvage'],
    ['inventory', Package, 'Hold'],
    ['construction', Warehouse, 'Build'],
    ['crew', Users, 'Crew'],
    ['ships', Rocket, 'Ships'],
    ['museum', Landmark, 'Museum'],
    ['market', Store, 'Market'],
    ['quarters', BedDouble, 'Quarters'],
    ['profile', Settings, 'Profile']
  ];
  return (
    <nav className="bottom-nav">
      {items.map(([id, Icon, label]) => (
        <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>
          <Icon size={19} /><span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

function StationPage({ station, wreck, inventory, history }: GameData) {
  const scrap = inventory.find(item => item.itemSlug === 'scrap')?.quantity ?? 0;
  return (
    <section className="page-grid">
      <div className="hero-card">
        <div className="hero-copy">
          <span className="eyebrow">COMMUNITY HOME</span>
          <h2>{station?.name}</h2>
          <p>The central character. Bolted, scarred, still judging everybody.</p>
        </div>
        <StationArt station={station} />
        <div className="station-stats">
          <Stat label="Population" value={station?.population} />
          <Stat label="Power" value={`${station?.power}%`} />
          <Stat label="Integrity" value={`${station?.integrity}%`} />
        </div>
      </div>
      <aside className="panel">
        <h3>Current Wreck</h3>
        <WreckCard wreck={wreck} />
        <Meter label="Wreck integrity" value={wreck?.integrity ?? 0} />
        <h3>Your Hold</h3>
        <div className="mini-inventory">
          {inventory.slice(0, 4).map(item => (
            <div className="mini-item" key={item.itemSlug}>
              <ItemOrb visualKey={item.visualKey} /><b>{item.name}</b><span>{item.quantity}</span>
            </div>
          ))}
        </div>
        <p className="tiny">Hull scrap ready for construction: {scrap}</p>
      </aside>
      <aside className="panel wide"><h3>Station Feed</h3><HistoryList history={history} /></aside>
    </section>
  );
}

function SalvagePage({ wreck, action }: GameData) {
  return (
    <section className="two-col">
      <div className="panel console">
        <h2>Operations Console</h2>
        <p>All rolls, loot, costs, and damage come from the server. The client only asks politely and tries not to drool on the buttons.</p>
        <div className="action-grid">
          <Action icon={<Radar />} title="Active Scan" text="Reveal a new salvage opportunity." onClick={() => action('/api/v1/salvage/scan', undefined, 'Signal acquired')} />
          <Action icon={<Hammer />} title="Deploy Cutters" text="Safe baseline salvage run." onClick={() => action('/api/v1/salvage/deploy', { mode: 'cutters' }, 'Cutters deployed')} />
          <Action icon={<Package />} title="Recover Cargo" text="Higher value, higher chance of angry cargo." onClick={() => action('/api/v1/salvage/deploy', { mode: 'cargo' }, 'Cargo team launched')} />
          <Action danger icon={<ShieldAlert />} title="Safety Override" text="Point-funded or cooldown-gated chaos lever." onClick={() => action('/api/v1/salvage/deploy', { mode: 'override' }, 'Override engaged')} />
        </div>
      </div>
      <aside className="panel"><h3>Target</h3><WreckCard wreck={wreck} /><Meter label="Remaining hull" value={wreck?.integrity ?? 0} /></aside>
    </section>
  );
}

function ConstructionPage({ station, inventory, action }: GameData) {
  const habitat = station?.modules.find(module => module.slug === 'habitat-ring');
  return (
    <section className="two-col">
      <div className="panel"><h2>Construction Yard</h2><ModuleGallery modules={station?.modules ?? []} /></div>
      <aside className="panel">
        <h3>Active Project</h3><h2>{habitat?.name}</h2>
        <p>Donate materials and the station changes for everyone.</p>
        <Meter label="Build progress" value={habitat?.progress ?? 0} />
        <button className="primary" onClick={() => action('/api/v1/construction/contribute', { moduleSlug: 'habitat-ring', scrap: 10 }, 'Materials delivered')}>Contribute 10 Hull Scrap</button>
        <div className="tiny">Hold: {inventory.map(item => `${item.name} ${item.quantity}`).join(' · ')}</div>
      </aside>
    </section>
  );
}

function InventoryPage({ inventory }: GameData) {
  return (
    <section className="panel">
      <h2>Salvage Hold</h2>
      <div className="inventory-grid">
        {inventory.map(item => (
          <article className="item-card" key={item.itemSlug}>
            <ItemOrb visualKey={item.visualKey} /><h3>{item.name}</h3><span>{item.rarity}</span><b>{item.quantity}</b>
          </article>
        ))}
      </div>
    </section>
  );
}

function ShipsPage({ ships }: GameData) {
  return (
    <section className="panel">
      <h2>Ships</h2>
      <div className="card-grid">
        {ships.map(ship => (
          <article className="ship-card" key={ship.id}>
            <div className="ship-art" /><h3>{ship.name}</h3><p>{ship.classSlug}</p>
            <Meter label="Condition" value={ship.condition} />
            <span>Fuel {ship.fuel} · Cargo {ship.cargoCapacity}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

function CrewPage({ crew }: GameData) {
  return (
    <section className="panel">
      <h2>Crew</h2>
      <div className="card-grid">
        {crew.map(member => (
          <article className="crew-card" key={member.id}>
            <div className="crew-face">{member.name.slice(0, 1)}</div>
            <h3>{member.name}</h3><p>{member.role} · level {member.level}</p>
            <Meter label="Morale" value={member.morale} /><small>{member.traits?.join(' · ')}</small>
          </article>
        ))}
      </div>
    </section>
  );
}

function MuseumPage({ station }: GameData) {
  const plaques = station?.modules.flatMap(module => module.plaques ?? []) ?? [];
  return (
    <section className="panel">
      <h2>Museum & Founders Hall</h2>
      <div className="card-grid">
        {plaques.map(plaque => (
          <article className="plaque" key={plaque.id}><Trophy /><h3>{plaque.title}</h3><p>{plaque.body}</p></article>
        ))}
        <article className="plaque"><Landmark /><h3>Warm Compartment Incident</h3><p>First exhibit reserved for the courier compartment nobody wanted to open twice.</p></article>
      </div>
    </section>
  );
}

function MarketPage() {
  return <section className="panel"><h2>Marketplace Foundation</h2><p>Trade rails, listing model, and module unlock gates are in the backend schema. The starter market is intentionally closed until the Marketplace module is active.</p></section>;
}

function QuartersPage() {
  return <section className="panel"><h2>Personal Quarters</h2><div className="quarters"><div className="room"><span>bed</span><span>relic shelf</span><span>tiny illegal espresso rig</span></div></div></section>;
}

function ProfilePage({ me }: GameData) {
  return (
    <section className="panel">
      <h2>Profile</h2>
      <div className="profile-large">
        <img src={me?.avatarUrl || ''} alt="" />
        <div><h3>{me?.displayName}</h3><p>{me?.player?.career} · Level {me?.player?.level} · {me?.player?.credits} cr</p></div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string | number | undefined }) {
  return <div className="stat"><span>{label}</span><b>{value ?? '...'}</b></div>;
}

function WreckCard({ wreck }: { wreck: Wreck | null }) {
  return (
    <article className={`wreck-card ${wreck?.risk ?? ''}`}>
      <div className="wreck-visual" /><strong>{wreck?.name ?? 'Scanning...'}</strong>
      <p>{wreck?.description}</p><span>Threat: <b>{wreck?.risk}</b></span>
    </article>
  );
}

function Action({ icon, title, text, onClick, danger = false }: { icon: ReactNode; title: string; text: string; onClick: () => void; danger?: boolean }) {
  return <button className={`action ${danger ? 'danger' : ''}`} onClick={onClick}>{icon}<b>{title}</b><span>{text}</span></button>;
}

function ModuleGallery({ modules }: { modules: StationModule[] }) {
  return (
    <div className="module-gallery">
      {modules.map(module => (
        <article className={`module-card ${module.state}`} key={module.slug}>
          <h3>{module.name}</h3><span>{module.state}</span><Meter label="Progress" value={module.progress} />
        </article>
      ))}
    </div>
  );
}

function HistoryList({ history }: { history: HistoryEntry[] }) {
  return (
    <div className="history-list">
      {history.slice(0, 10).map(entry => (
        <article key={entry.id}><ScrollText size={16} /><div><b>{entry.title}</b><p>{entry.body}</p></div></article>
      ))}
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
