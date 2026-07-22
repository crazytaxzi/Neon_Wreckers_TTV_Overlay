import { useCallback, useEffect, useRef, useState } from 'react';
import { errorMessage, requestApi } from '@neon-wreckers/browser-client';
import { authenticatedUserSummarySchema, crewMemberSchema, currentWreckSchema, expeditionSchema, historyRecordSchema, inventoryItemSchema, realtimeEventSchema, shipSchema, stationSnapshotSchema, type RealtimeEvent } from '@neon-wreckers/contracts';
import { useToast } from '@neon-wreckers/ui';
import type {
  ActionCooldown,
  ActionHandler,
  AuctionListing,
  CraftingRecipe,
  CrewMember,
  CurrentUser,
  Expedition,
  ExpeditionDefinition,
  GameData,
  HistoryEntry,
  InventoryItem,
  ItemDefinition,
  Marketplace,
  PlayerNotification,
  Quarters,
  Ship,
  Station,
  Wreck
} from './model.js';

const WS_URL = (() => {
  const url = new URL('/api/v1/ws', window.location.origin);
  url.protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return url.toString();
})();

function parseRealtimeMessage(value: unknown): RealtimeEvent | null {
  if (typeof value !== 'string') return null;
  try {
    const decoded: unknown = JSON.parse(value);
    const parsed = realtimeEventSchema.safeParse(decoded);
    if (!parsed.success) console.warn('Player realtime contract validation failed', { issues: parsed.error.issues });
    return parsed.success ? parsed.data : null;
  } catch (error) {
    console.warn('Player realtime packet could not be decoded', { error });
    return null;
  }
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

export function useGameData(): Omit<GameData, 'me'> & { me: CurrentUser | null | undefined } {
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
      setMe(await requestApi<CurrentUser>('/api/v1/me', {}, authenticatedUserSummarySchema));
      const [stationResult, wreckResult, inventoryResult, shipsResult, crewResult, historyResult, expeditionsResult, expeditionDefinitionsResult, notificationsResult, marketplaceResult, quartersResult, catalogResult, auctionResult, recipesResult, cooldownResult] = await Promise.allSettled([
        requestApi<Station>('/api/v1/station', {}, stationSnapshotSchema),
        requestApi<Wreck>('/api/v1/wrecks/current', {}, currentWreckSchema),
        requestApi<InventoryItem[]>('/api/v1/inventory', {}, inventoryItemSchema.array()),
        requestApi<Ship[]>('/api/v1/ships', {}, shipSchema.array()),
        requestApi<CrewMember[]>('/api/v1/crew', {}, crewMemberSchema.array()),
        requestApi<HistoryEntry[]>('/api/v1/history', {}, historyRecordSchema.array()),
        requestApi<Expedition[]>('/api/v1/expeditions', {}, expeditionSchema.array()),
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
      const message = parseRealtimeMessage(String(event.data));
      if (message && message.type !== 'player.connected') void refresh();
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
