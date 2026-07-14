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
  visualKey: string;
  maxLevel: number;
  prerequisites: string[];
  construction: {
    resources: Record<string, number>;
    baseProgressUnits: number;
  };
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
  risk: Risk;
  fuelCost: number;
  minCrew: number;
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
export const salvageCooldownSeconds: Readonly<{ cutters: number; cargo: number; override: number }>;
export const expeditionDefinitions: Readonly<Record<string, ExpeditionDefinition>>;
