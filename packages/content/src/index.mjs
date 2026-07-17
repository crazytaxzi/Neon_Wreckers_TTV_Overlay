import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const lifecycle = z.literal('active');
const risk = z.enum(['low', 'moderate', 'high', 'extreme']);
const range = z.tuple([z.number().int().nonnegative(), z.number().int().nonnegative()])
  .refine(([minimum, maximum]) => maximum >= minimum, 'Range maximum must be greater than or equal to its minimum.');

const itemSchema = z.object({
  slug,
  name: z.string().min(1),
  rarity: z.string().min(1),
  visualKey: slug,
  stackLimit: z.number().int().positive(),
  lifecycle,
  tags: z.array(slug),
  valueCredits: z.number().int().nonnegative().default(0),
  description: z.string().min(1).default('Recovered station salvage.'),
  uses: z.array(z.string().min(1)).default([]),
  recipes: z.array(z.string().min(1)).default([]),
  sources: z.array(z.string().min(1)).default([])
});

const wreckSchema = z.object({
  slug,
  name: z.string().min(1),
  risk,
  visualKey: slug,
  description: z.string().min(1),
  lootTable: slug,
  lifecycle,
  integrityRange: range,
  lootBudgetRange: range
});

const moduleSchema = z.object({
  slug,
  name: z.string().min(1),
  visualKey: slug,
  maxLevel: z.number().int().positive(),
  prerequisites: z.array(slug),
  construction: z.object({
    resources: z.record(z.number().int().nonnegative()),
    baseProgressUnits: z.number().int().positive()
  }),
  effects: z.record(z.unknown()),
  lifecycle
});

const moduleStateSchema = z.enum(['locked', 'building', 'active', 'damaged', 'disabled', 'upgrading', 'seasonal']);
const stationSchema = z.object({
  id: z.string().min(1),
  slug,
  name: z.string().min(1),
  level: z.number().int().positive(),
  population: z.number().int().nonnegative(),
  power: z.number().int().min(0).max(100),
  morale: z.number().int().min(0).max(100),
  integrity: z.number().int().min(0).max(100),
  storageCapacity: z.number().int().nonnegative(),
  storageUsed: z.number().int().nonnegative(),
  resources: z.record(z.number().int().nonnegative()),
  threatLevel: z.number().int().nonnegative(),
  activeSeason: slug.nullable(),
  alerts: z.array(z.object({
    severity: z.string().min(1),
    title: z.string().min(1),
    body: z.string().min(1)
  })),
  modules: z.array(z.object({
    slug,
    level: z.number().int().nonnegative(),
    state: moduleStateSchema,
    progress: z.number().int().min(0).max(100),
    integrity: z.number().int().min(0).max(100)
  }))
});

const pointActionSchema = z.object({ cost: z.number().int().positive() });
const expeditionDefinitionSchema = z.object({
  slug,
  name: z.string().min(1),
  risk,
  fuelCost: z.number().int().nonnegative(),
  minCrew: z.number().int().nonnegative(),
  durationMinutes: z.tuple([z.number().int().positive(), z.number().int().positive()])
    .refine(([minimum, maximum]) => maximum >= minimum, 'Expedition duration maximum must be greater than or equal to its minimum.')
});
const balanceSchema = z.object({
  salvageCooldownSeconds: z.number().int().nonnegative(),
  cargoCooldownSeconds: z.number().int().nonnegative(),
  overrideCooldownSeconds: z.number().int().nonnegative(),
  pointActions: z.object({
    safety_override: pointActionSchema,
    rush_scan: pointActionSchema
  }),
  construction: z.object({
    scrapUnitsPerProgress: z.number().int().positive(),
    electronicsProgress: z.number().int().nonnegative(),
    alloysProgress: z.number().int().nonnegative()
  }),
  progression: z.object({
    levelXp: z.array(z.number().int().nonnegative()).min(2),
    careerChangeCredits: z.number().int().nonnegative(),
    careerChangeCooldownSeconds: z.number().int().nonnegative()
  }),
  careers: z.record(z.record(z.number())),
  ships: z.object({
    crewPerShip: z.number().int().positive(),
    purchases: z.array(z.object({ slug, name: z.string().min(1), credits: z.number().int().positive(), cargoCapacity: z.number().int().positive(), fuel: z.number().int().nonnegative(), visualKey: slug })),
    refuel: z.object({ fuelPerCell: z.number().int().positive() }),
    repair: z.object({ creditsPerCondition: z.number().int().positive(), alloysPerTwentyCondition: z.number().int().nonnegative() }),
    upgrades: z.array(z.object({ slug, name: z.string().min(1), credits: z.number().int().nonnegative(), alloys: z.number().int().nonnegative().optional(), electronics: z.number().int().nonnegative().optional(), conditionBonus: z.number().int().optional(), cargoBonus: z.number().int().optional(), fuelDiscount: z.number().int().optional() }))
  }),
  crew: z.object({ recruitCredits: z.number().int().nonnegative(), trainCreditsPerLevel: z.number().int().nonnegative(), maxRoster: z.number().int().positive(), injuryMinutes: range }),
  marketplace: z.object({
    sellMultiplier: z.number().positive().max(1),
    listings: z.array(z.object({ slug, name: z.string().min(1), priceCredits: z.number().int().positive(), itemSlug: slug, quantity: z.number().int().positive() })),
    sellPrices: z.record(z.number().int().nonnegative())
  }),
  crafting: z.record(z.object({ name: z.string().min(1), durationSeconds: z.number().int().positive(), inputs: z.record(z.number().int().positive()), outputs: z.record(z.number().int().positive()), stationModule: slug })),
  quarters: z.object({ width: z.number().int().positive(), height: z.number().int().positive(), themes: z.array(slug).min(1), objects: z.array(slug) }),
  expeditions: z.array(expeditionDefinitionSchema).min(1)
});

const eventSchema = z.object({ slug, name: z.string().min(1), trigger: z.enum(['condition', 'manual', 'scheduled']), durationMinutes: z.number().int().positive(), cooldownMinutes: z.number().int().nonnegative(), conditions: z.array(z.object({ type: z.string().min(1), params: z.record(z.unknown()) })), actions: z.array(z.object({ type: z.string().min(1), params: z.record(z.unknown()) })), lifecycle });
const seasonSchema = z.object({ slug, name: z.string().min(1), startsAt: z.string().datetime(), endsAt: z.string().datetime(), gracePeriodDays: z.number().int().nonnegative(), theme: slug, lifecycle: z.enum(['active', 'scheduled']), conversion: z.record(z.string()) });
const themeSchema = z.record(z.object({ name: z.string().min(1), colors: z.record(z.string()), decorations: z.array(slug) }));

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const nested of Object.values(value)) deepFreeze(nested);
  }
  return value;
}

function loadJson(filename, schema) {
  const path = fileURLToPath(new URL(`../../../content/base/${filename}`, import.meta.url));
  return deepFreeze(schema.parse(JSON.parse(fs.readFileSync(path, 'utf8'))));
}

function uniqueBySlug(records, label) {
  const entries = records.map(record => [record.slug, record]);
  if (new Set(entries.map(([entrySlug]) => entrySlug)).size !== entries.length) {
    throw new Error(`${label} slugs must be unique.`);
  }
  return Object.freeze(Object.fromEntries(entries));
}

export const items = loadJson('items.json', z.array(itemSchema).min(1));
export const itemsBySlug = uniqueBySlug(items, 'Item');
export const wreckArchetypes = loadJson('wrecks.json', z.array(wreckSchema).min(1));
export const modules = loadJson('modules.json', z.array(moduleSchema).min(1));
export const modulesBySlug = uniqueBySlug(modules, 'Module');
export const balance = loadJson('balance.json', balanceSchema);
export const events = loadJson('events.json', z.array(eventSchema));
export const eventsBySlug = uniqueBySlug(events, 'Event');
export const seasons = loadJson('seasons.json', z.array(seasonSchema));
export const seasonsBySlug = uniqueBySlug(seasons, 'Season');
export const themes = loadJson('themes.json', themeSchema);

const station = loadJson('station.json', stationSchema);
const initialModuleSlugs = new Set();
for (const moduleState of station.modules) {
  if (initialModuleSlugs.has(moduleState.slug)) throw new Error(`Initial station module ${moduleState.slug} is duplicated.`);
  initialModuleSlugs.add(moduleState.slug);
  if (!modulesBySlug[moduleState.slug]) throw new Error(`Initial station references unknown module ${moduleState.slug}.`);
}

export const initialStation = deepFreeze({
  ...station,
  activeModifiers: [],
  alerts: station.alerts.map(alert => ({ ...alert })),
  modules: station.modules.map(moduleState => {
    const definition = modulesBySlug[moduleState.slug];
    return {
      ...moduleState,
      name: definition.name,
      visualKey: definition.visualKey,
      effects: definition.effects,
      plaques: []
    };
  })
});

export const pointActions = balance.pointActions;
export const constructionProgressRules = balance.construction;
export const progressionRules = balance.progression;
export const careerRules = balance.careers;
export const shipRules = balance.ships;
export const crewRules = balance.crew;
export const marketplaceRules = balance.marketplace;
export const craftingRules = balance.crafting;
export const quartersRules = balance.quarters;
export const salvageCooldownSeconds = Object.freeze({
  cutters: balance.salvageCooldownSeconds,
  cargo: balance.cargoCooldownSeconds,
  override: balance.overrideCooldownSeconds
});
export const expeditionDefinitions = uniqueBySlug(balance.expeditions, 'Expedition');
