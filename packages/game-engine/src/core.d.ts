export type SalvageMode = 'cutters' | 'cargo' | 'override';
export type Risk = 'low' | 'moderate' | 'high' | 'extreme';
export type ModuleState = 'locked' | 'building' | 'active' | 'damaged' | 'disabled' | 'upgrading' | 'seasonal';

export interface ItemDefinition {
  slug: string;
  name: string;
  rarity: string;
  visualKey: string;
}

export interface InventoryStack extends ItemDefinition {
  itemSlug: string;
  quantity: number;
}

export interface StationModule {
  slug: string;
  name: string;
  level: number;
  state: ModuleState;
  progress: number;
  integrity: number;
  visualKey: string;
  effects: Record<string, unknown>;
  plaques: Array<{
    id: string;
    title: string;
    body: string;
    playerDisplayName?: string | null;
    createdAt: string;
  }>;
}

export interface StationState {
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
  activeModifiers: unknown[];
  activeSeason: string | null;
  alerts: Array<{ id?: string; severity: string; title: string; body: string; createdAt?: string }>;
  modules: StationModule[];
}

export interface WreckArchetype {
  slug: string;
  name: string;
  risk: Risk;
  visualKey: string;
  integrityRange: readonly [number, number];
  lootBudgetRange: readonly [number, number];
  description: string;
}

export interface WreckState {
  id: string;
  archetype: string;
  name: string;
  description: string;
  risk: Risk;
  integrity: number;
  depleted: boolean;
  visualKey: string;
  remainingLootBudget: number;
  discoveredBy?: string | null;
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

export interface ExpeditionState {
  id: string;
  name: string;
  status: string;
  risk: Risk;
  launchedAt: string | Date | null;
  resolvesAt: string | Date | null;
  rewards: unknown[];
  incidentLog: string[];
  [key: string]: unknown;
}

export function createRng(seed?: string): () => number;
export function clamp(value: number, minimum: number, maximum: number): number;
export function nowIso(clock?: () => Date): string;
export function newId(prefix?: string): string;
export function discoverWreck(args: {
  station: Pick<StationState, 'id' | 'threatLevel'>;
  playerId: string;
  archetypes: readonly WreckArchetype[];
  seed?: string;
}): WreckState;
export function salvageWreck(args: {
  wreck: WreckState;
  player: { id: string; career?: string };
  items: Readonly<Record<string, ItemDefinition>>;
  careerBonus?: number;
  rareDiscoveryBonus?: number;
  seed?: string;
  mode?: SalvageMode;
  now?: string;
}): {
  success: boolean;
  mode: SalvageMode;
  rewards: InventoryStack[];
  credits: number;
  stationDamage: { power: number; integrity: number };
  integrityLoss: number;
  wreck: WreckState;
};
export function contributeConstruction(args: {
  station: StationState;
  moduleSlug?: string;
  contribution: { scrap?: number; electronics?: number; alloys?: number };
  progressRules: {
    scrapUnitsPerProgress: number;
    electronicsProgress: number;
    alloysProgress: number;
  };
  actorDisplayName?: string;
  now?: string;
}): {
  station: StationState;
  completed: boolean;
  progressGain: number;
  history: Array<{ category: string; title: string; body: string; actorDisplayName: string; createdAt: string }>;
};
export function launchExpedition(args: {
  player: { id: string };
  ship: { id: string; name: string; condition: number; fuel: number; [key: string]: unknown };
  crew: Array<Record<string, unknown>>;
  expeditionDefinition: ExpeditionDefinition;
  seed?: string;
  now?: string;
}): ExpeditionState & { launchedAt: string; resolvesAt: string; ship: Record<string, unknown> & { fuel: number } };
export function resolveExpedition(args: {
  expedition: ExpeditionState;
  expeditionDefinition: ExpeditionDefinition;
  items: Readonly<Record<string, ItemDefinition>>;
  seed?: string;
  now?: string;
}): ExpeditionState;
export function applyInventoryStacks(existing: InventoryStack[], stacks: InventoryStack[]): InventoryStack[];
export function enforceCooldown(args: { key: string; cooldowns: Map<string, number>; seconds: number; nowMs?: number }): void;

export class GameRuleError extends Error {
  readonly code: string;
  constructor(code: string, message: string);
}
