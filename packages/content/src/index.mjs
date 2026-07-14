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
  tags: z.array(slug)
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
  expeditions: z.array(expeditionDefinitionSchema).min(1)
});

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
export const salvageCooldownSeconds = Object.freeze({
  cutters: balance.salvageCooldownSeconds,
  cargo: balance.cargoCooldownSeconds,
  override: balance.overrideCooldownSeconds
});
export const expeditionDefinitions = uniqueBySlug(balance.expeditions, 'Expedition');
