export type Risk = 'low' | 'moderate' | 'high' | 'extreme';
export type ModuleState = 'locked' | 'building' | 'active' | 'damaged' | 'disabled' | 'upgrading' | 'seasonal';

export interface ContentItem {
  slug: string;
  name: string;
  rarity: string;
  visualKey: string;
  stackLimit: number;
  lifecycle: 'active';
  tags: string[];
  valueCredits: number;
  description: string;
  uses: string[];
  recipes: string[];
  sources: string[];
}

export interface WreckArchetype {
  slug: string;
  name: string;
  risk: Risk;
  visualKey: string;
  description: string;
  lootTable: string;
  lifecycle: 'active';
  integrityRange: readonly [number, number];
  lootBudgetRange: readonly [number, number];
}

export interface ModuleDefinition {
  slug: string;
  name: string;
  description: string;
  visualKey: string;
  maxLevel: number;
  prerequisites: string[];
  construction: {
    resources: Record<string, number>;
    baseProgressUnits: number;
  };
  progression: { levelXp: number[]; careerChangeCredits: number; careerChangeCooldownSeconds: number };
  careers: Record<string, Record<string, number>>;
  ships: {
    crewPerShip: number;
    renameCredits: number;
    skinCooldownSeconds: number;
    skins: Array<{ slug: string; classSlug: string; name: string; description: string; credits: number; cargoBonus?: number; fuelDiscount?: number; repairDiscount?: number; lootRollBonus?: number; successBonus?: number }>;
    purchases: Array<{ slug: string; name: string; credits: number; cargoCapacity: number; fuel: number; visualKey: string }>;
    refuel: { fuelPerCell: number };
    repair: { creditsPerCondition: number; alloysPerTwentyCondition: number };
    upgrades: Array<{ slug: string; name: string; description: string; credits: number; alloys?: number; electronics?: number; conditionBonus?: number; cargoBonus?: number; fuelDiscount?: number; repairDiscount?: number; lootRollBonus?: number }>;
  };
  crew: { recruitCredits: number; trainCreditsPerLevel: number; maxRoster: number; injuryMinutes: readonly [number, number] };
  marketplace: { sellMultiplier: number; listings: Array<{ slug: string; name: string; priceCredits: number; itemSlug: string; quantity: number }>; sellPrices: Record<string, number> };
  quarters: { width: number; height: number; themes: string[]; objects: string[] };
  effects: Record<string, unknown>;
  lifecycle: 'active';
}

export interface InitialStationModule {
  slug: string;
  name: string;
  level: number;
  state: ModuleState;
  progress: number;
  integrity: number;
  visualKey: string;
  effects: Record<string, unknown>;
  plaques: [];
}

export interface InitialStation {
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
  resources: Record<string, number>;
  threatLevel: number;
  activeModifiers: [];
  activeSeason: string | null;
  alerts: Array<{ severity: string; title: string; body: string }>;
  modules: InitialStationModule[];
}

export interface ExpeditionDefinition {
  slug: string;
  name: string;
  description: string;
  risk: Risk;
  fuelCost: number;
  minCrew: number;
  lootPool: readonly string[];
  lootRolls: number;
  durationMinutes: readonly [number, number];
}

export const items: readonly ContentItem[];
export const itemsBySlug: Readonly<Record<string, ContentItem>>;
export const wreckArchetypes: readonly WreckArchetype[];
export const modules: readonly ModuleDefinition[];
export const modulesBySlug: Readonly<Record<string, ModuleDefinition>>;
export const initialStation: Readonly<InitialStation>;
export const balance: Readonly<{
  salvageCooldownSeconds: number;
  cargoCooldownSeconds: number;
  overrideCooldownSeconds: number;
  pointActions: {
    safety_override: { cost: number };
    rush_scan: { cost: number };
  };
  construction: {
    scrapUnitsPerProgress: number;
    electronicsProgress: number;
    alloysProgress: number;
  };
  expeditions: ExpeditionDefinition[];
}>;
export const pointActions: typeof balance.pointActions;
export const constructionProgressRules: typeof balance.construction;
export const progressionRules: typeof balance.progression;
export const careerRules: typeof balance.careers;
export const shipRules: typeof balance.ships;
export const crewRules: typeof balance.crew;
export const marketplaceRules: typeof balance.marketplace;
export const craftingRules: Readonly<Record<string, { name: string; durationSeconds: number; inputs: Record<string, number>; outputs: Record<string, number>; stationModule: string }>>;
export const quartersRules: typeof balance.quarters;
export const salvageCooldownSeconds: Readonly<{ cutters: number; cargo: number; override: number }>;
export const expeditionDefinitions: Readonly<Record<string, ExpeditionDefinition>>;
export interface EventDefinition { slug: string; name: string; trigger: 'condition' | 'manual' | 'scheduled'; durationMinutes: number; cooldownMinutes: number; conditions: Array<{ type: string; params: Record<string, unknown> }>; actions: Array<{ type: string; params: Record<string, unknown> }>; lifecycle: 'active' }
export interface SeasonDefinition { slug: string; name: string; startsAt: string; endsAt: string; gracePeriodDays: number; theme: string; lifecycle: 'active' | 'scheduled'; conversion: Record<string, string> }
export const events: readonly EventDefinition[];
export const eventsBySlug: Readonly<Record<string, EventDefinition>>;
export const seasons: readonly SeasonDefinition[];
export const seasonsBySlug: Readonly<Record<string, SeasonDefinition>>;
export const themes: Readonly<Record<string, { name: string; colors: Record<string, string>; decorations: string[] }>>;
