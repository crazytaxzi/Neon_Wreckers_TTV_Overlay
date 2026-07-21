import { useEffect, useState, type ReactNode } from 'react';
import {
  AppShell,
  Button,
  CommandNavigation,
  LoadingScreen,
  NWIcon,
  Panel,
  ThemeProvider,
  ToastProvider,
  defaultTheme,
  highContrastTheme,
  type TabItem
} from '@neon-wreckers/ui';
import { PlayerHeader } from './components/PlayerHeader.js';
import { useGameData } from './game-data.js';
import { useVisualGameData } from './visual-preview.js';
import type { GameData, UiPreferences } from './model.js';
import { GuidePage, StationPage, SalvagePage, ConstructionPage } from './pages/station.js';
import { InventoryPage, CraftingPage } from './pages/logistics.js';
import { ShipsPage, CrewPage, ExpeditionPage } from './pages/fleet.js';
import { MuseumPage, HistoryPage, NotificationsPage, MarketPage, QuartersPage, ProfilePage, SettingsPage } from './pages/community.js';

const defaultPreferences: UiPreferences = {
  reducedMotion: false,
  highContrast: false,
  lowEffects: false,
  largeText: false,
  glowIntensity: 72
};

function loadPreferences(): UiPreferences {
  try {
    const stored = JSON.parse(localStorage.getItem('nw-ui-preferences') ?? '{}') as Partial<UiPreferences>;
    return { ...defaultPreferences, ...stored };
  } catch {
    return defaultPreferences;
  }
}

const navigation: TabItem[] = [
  { id: 'station', label: 'Home', description: 'Command Center', icon: 'station', primary: true },
  { id: 'salvage', label: 'Salvage', description: 'Wreck Operations', icon: 'salvage', primary: true },
  { id: 'construction', label: 'Station', description: 'Build & Manage', icon: 'construction', primary: true },
  { id: 'market', label: 'Market', description: 'Trade & Auctions', icon: 'trade', primary: true },
  { id: 'profile', label: 'Profile', description: 'Identity & Career', icon: 'twitch', primary: true },
  { id: 'guide', label: 'How to Play', icon: 'data' },
  { id: 'inventory', label: 'Cargo Hold', icon: 'inventory' },
  { id: 'crafting', label: 'Crafting', icon: 'resources' },
  { id: 'crew', label: 'Crew', icon: 'crew' },
  { id: 'ships', label: 'Ships', icon: 'expedition' },
  { id: 'expeditions', label: 'Expeditions', icon: 'scanner' },
  { id: 'museum', label: 'Museum', icon: 'museum' },
  { id: 'history', label: 'History', icon: 'archive' },
  { id: 'notifications', label: 'Alerts', icon: 'notifications' },
  { id: 'quarters', label: 'Quarters', icon: 'module' },
  { id: 'settings', label: 'Settings', icon: 'settings' }
];

export function Root() {
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

const useRuntimeGameData = import.meta.env.VITE_VISUAL_PREVIEW === '1' ? useVisualGameData : useGameData;

function GameApp({ preferences, updatePreferences }: { preferences: UiPreferences; updatePreferences: (patch: Partial<UiPreferences>) => void }) {
  const game = useRuntimeGameData();
  const [tab, setTab] = useState(() => new URLSearchParams(window.location.search).get('view') ?? 'station');

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
    station: <StationPage {...pageProps} onNavigate={setTab} />,
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

  const signOut = () => void game.action('/api/v1/auth/logout', undefined, 'Signed out').then(() => { window.location.href = '/'; });

  return (
    <AppShell
      className="player-shell"
      header={<PlayerHeader
        me={me}
        inventory={game.inventory}
        notifications={game.notifications}
        onNavigate={setTab}
        onRefresh={() => void game.refresh()}
        onSignOut={signOut}
      />}
      navigation={<CommandNavigation items={navigation} value={tab} onChange={setTab} />}
    >
      <div className="game-page" data-page={tab} key={tab}>{pages[tab] ?? pages.station}</div>
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
        <div className="login-console__status"><span className="login-console__signal" />Gateway online · secure Twitch session required</div>
      </Panel>
    </main>
  );
}
