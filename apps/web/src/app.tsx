import { useEffect, useState, type ReactNode } from 'react';
import {
  AppShell,
  Badge,
  Button,
  CommandHeader,
  CommandNavigation,
  LoadingScreen,
  NWIcon,
  Panel,
  ProfileChip,
  ThemeProvider,
  ToastProvider,
  Tooltip,
  defaultTheme,
  highContrastTheme,
  type TabItem
} from '@neon-wreckers/ui';
import { useGameData } from './game-data.js';
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
