export type Player = {
  level: number;
  title: string;
  career: string;
  credits: number;
};

export type CurrentUser = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  roles: string[];
  player: Player | null;
};

export type Plaque = {
  id: string;
  title: string;
  body: string;
  playerDisplayName: string | null;
  createdAt: string;
};

export type StationModule = {
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

export type StationAlert = {
  id: string;
  severity: string;
  title: string;
  body: string;
  createdAt: string;
};

export type Station = {
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

export type Wreck = {
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

export type InventoryItem = {
  id: string;
  itemSlug: string;
  name: string;
  quantity: number;
  rarity: string;
  visualKey: string;
  updatedAt: string;
};

export type Ship = {
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

export type CrewMember = {
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

export type Expedition = {
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

export type HistoryEntry = {
  id: string;
  category: string;
  title: string;
  body: string;
  actorDisplayName: string | null;
  details: { operation?: string; mode?: string; wreckName?: string; expeditionName?: string; shipName?: string; items?: Array<{ itemSlug: string; name: string; quantity: number; rarity?: string }> };
  createdAt: string;
};

export type PlayerNotification = {
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

export type MarketplaceListing = {
  slug: string;
  name: string;
  priceCredits: number;
  itemSlug: string;
  quantity: number;
};

export type Marketplace = {
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

export type ItemDefinition = { slug: string; name: string; rarity: string; valueCredits: number; vendorSellCredits?: number; sellable: boolean; description: string; uses: string[]; recipes: string[]; sources: string[] };
export type AuctionListing = { id: string; itemSlug: string; itemName: string; quantity: number; priceCredits: number; sellerName: string; ownListing: boolean; cancellationFee: number; expiresAt: string };
export type CraftingRecipe = { slug: string; name: string; baseDurationSeconds: number; durationSeconds: number; inputValue: number; outputValue: number; valueAdded: number; efficiency: number; inputs: Record<string, number>; outputs: Record<string, number>; stationModule: string; unlocked: boolean };
export type ActionCooldown = { actionKey: string; expiresAt: string };
export type ExpeditionDefinition = {
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

export type QuartersObject = {
  key: string;
  x: number;
  y: number;
};

export type Quarters = {
  playerId: string;
  layout: {
    theme: string;
    objects: QuartersObject[];
  };
};

export type UiPreferences = {
  reducedMotion: boolean;
  highContrast: boolean;
  lowEffects: boolean;
  largeText: boolean;
  glowIntensity: number;
};

export type ActionHandler = (path: string, payload?: unknown, label?: string, headers?: HeadersInit) => Promise<unknown | undefined>;

export type GameData = {
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
