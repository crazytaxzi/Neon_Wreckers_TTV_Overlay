import { z } from 'zod';

export const isoDateTimeSchema = z.string().datetime({ offset: true }).or(z.string().datetime());
const serializedDateTimeSchema = z.preprocess(value => value instanceof Date ? value.toISOString() : value, isoDateTimeSchema);
export const jsonValueSchema: z.ZodType<unknown> = z.unknown();

export const apiErrorSchema = z.object({
  code: z.string().optional(),
  message: z.string().min(1),
  details: jsonValueSchema.optional()
}).passthrough();

export const apiErrorEnvelopeSchema = z.object({
  error: apiErrorSchema,
  requestId: z.string().optional()
}).passthrough();

export function apiSuccessEnvelopeSchema<T extends z.ZodTypeAny>(data: T) {
  return z.object({ data, requestId: z.string().optional() }).passthrough();
}

export const stationAlertSchema = z.object({
  id: z.string(),
  severity: z.string(),
  title: z.string(),
  body: z.string(),
  createdAt: serializedDateTimeSchema
}).passthrough();

const historyDetailsSchema = z.preprocess(
  value => value && typeof value === 'object' ? value : {},
  z.object({
    operation: z.string().optional(),
    mode: z.string().optional(),
    wreckName: z.string().optional(),
    expeditionName: z.string().optional(),
    shipName: z.string().optional(),
    items: z.array(z.object({
      itemSlug: z.string(),
      name: z.string(),
      quantity: z.number(),
      rarity: z.string().optional()
    }).passthrough()).optional()
  }).passthrough()
);

export const historyRecordSchema = z.object({
  id: z.string(),
  category: z.string(),
  title: z.string(),
  body: z.string(),
  createdAt: serializedDateTimeSchema,
  actorDisplayName: z.string().nullable().default(null),
  details: historyDetailsSchema
}).passthrough();

const plaqueSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  playerDisplayName: z.string().nullable(),
  createdAt: serializedDateTimeSchema
}).passthrough();

export const stationModuleSchema = z.object({
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  maxLevel: z.number(),
  prerequisites: z.array(z.string()),
  level: z.number(),
  state: z.string(),
  progress: z.number(),
  integrity: z.number(),
  visualKey: z.string(),
  effects: z.record(z.unknown()),
  perLevelEffects: z.record(z.unknown()),
  nextLevelRequirements: z.record(z.number()).nullable(),
  plaques: z.array(plaqueSchema),
  project: z.object({
    id: z.string(),
    kind: z.string(),
    targetLevel: z.number(),
    requirements: z.record(z.number()),
    contributed: z.record(z.number())
  }).passthrough().nullable().optional()
}).passthrough();

export const stationSnapshotSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  level: z.number(),
  population: z.number(),
  populationStatus: z.object({
    capacity: z.number(),
    trend: z.number(),
    reasons: z.array(z.string())
  }).optional(),
  power: z.number(),
  morale: z.number(),
  integrity: z.number(),
  storageCapacity: z.number(),
  storageUsed: z.number(),
  threatLevel: z.union([z.string(), z.number()]),
  activeSeason: z.string().nullable(),
  resources: z.record(z.number()),
  museum: z.object({
    collection: z.array(z.object({ itemSlug: z.string(), name: z.string(), quantity: z.number() })),
    donatedToday: z.number(),
    dailyCapacity: z.number()
  }),
  modules: z.array(stationModuleSchema),
  alerts: z.array(stationAlertSchema),
  activeModifiers: z.array(z.unknown())
}).passthrough();

const salvageModeSchema = z.object({
  successChance: z.number(),
  scrapRange: z.array(z.number()),
  electronicsChance: z.number(),
  fuelChance: z.number(),
  relicChance: z.number(),
  wreckLootRolls: z.number(),
  wreckLootChancePerRoll: z.number(),
  wreckLootPool: z.array(z.object({ slug: z.string(), name: z.string(), rarity: z.string() }))
}).passthrough();

export const currentWreckSchema = z.object({
  id: z.string(),
  archetype: z.string(),
  name: z.string(),
  description: z.string(),
  risk: z.string(),
  integrity: z.number(),
  depleted: z.boolean(),
  visualKey: z.string(),
  remainingLootBudget: z.number(),
  createdAt: serializedDateTimeSchema,
  updatedAt: serializedDateTimeSchema,
  salvageProfile: z.object({ cutters: salvageModeSchema, cargo: salvageModeSchema })
}).passthrough();

export const authenticatedUserSummarySchema = z.object({
  id: z.string(),
  twitchUserId: z.string().optional(),
  displayName: z.string(),
  avatarUrl: z.string().nullable(),
  roles: z.array(z.string()),
  player: z.object({
    id: z.string(),
    level: z.number(),
    title: z.string(),
    career: z.string(),
    credits: z.number()
  }).passthrough().nullable()
}).passthrough();

export const inventoryItemSchema = z.object({
  id: z.string(),
  playerId: z.string().optional(),
  itemSlug: z.string(),
  name: z.string(),
  quantity: z.number().int().nonnegative(),
  rarity: z.string(),
  visualKey: z.string(),
  updatedAt: serializedDateTimeSchema
}).passthrough();

export const shipSchema = z.object({
  id: z.string(),
  playerId: z.string().optional(),
  name: z.string(),
  classSlug: z.string(),
  condition: z.number(),
  fuel: z.number(),
  cargoCapacity: z.number(),
  upgrades: z.array(z.string()),
  ownedSkins: z.array(z.string()),
  activeSkin: z.string().nullable(),
  visualKey: z.string(),
  createdAt: serializedDateTimeSchema
}).passthrough();

export const crewMemberSchema = z.object({
  id: z.string(),
  playerId: z.string().optional(),
  name: z.string(),
  role: z.string(),
  level: z.number(),
  jobStars: z.number(),
  talentStars: z.number(),
  morale: z.number(),
  injuredUntil: serializedDateTimeSchema.nullable(),
  traits: z.array(z.string())
}).passthrough();

export const expeditionSchema = z.object({
  id: z.string(),
  playerId: z.string().optional(),
  definition: z.string(),
  name: z.string(),
  status: z.string(),
  risk: z.string(),
  shipId: z.string().nullable(),
  crewIds: z.array(z.string()),
  launchedAt: serializedDateTimeSchema.nullable(),
  resolvesAt: serializedDateTimeSchema.nullable(),
  rewards: z.array(z.unknown()),
  incidentLog: z.array(z.string()),
  createdAt: serializedDateTimeSchema,
  updatedAt: serializedDateTimeSchema
}).passthrough();

export const presenceUpdatedEventSchema = z.object({
  type: z.literal('presence.updated'),
  count: z.number().int().nonnegative()
});
export const playerConnectedEventSchema = z.object({ type: z.literal('player.connected') });
export const stationUpdatedEventSchema = z.object({ type: z.literal('station.updated'), station: stationSnapshotSchema });
export const wreckUpdatedEventSchema = z.object({ type: z.literal('wreck.updated'), wreck: currentWreckSchema });
export const historyAddedEventSchema = z.object({ type: z.literal('history.added'), entry: historyRecordSchema });
export const playerUpdatedEventSchema = z.object({ type: z.literal('player.updated') }).passthrough();
export const inventoryUpdatedEventSchema = z.object({ type: z.literal('inventory.updated') }).passthrough();
export const fleetUpdatedEventSchema = z.object({ type: z.literal('fleet.updated') }).passthrough();
export const expeditionUpdatedEventSchema = z.object({ type: z.literal('expedition.updated') }).passthrough();
export const notificationAddedEventSchema = z.object({ type: z.literal('notification.added') }).passthrough();

export const realtimeEventSchema = z.discriminatedUnion('type', [
  presenceUpdatedEventSchema,
  playerConnectedEventSchema,
  stationUpdatedEventSchema,
  wreckUpdatedEventSchema,
  historyAddedEventSchema,
  playerUpdatedEventSchema,
  inventoryUpdatedEventSchema,
  fleetUpdatedEventSchema,
  expeditionUpdatedEventSchema,
  notificationAddedEventSchema
]);

export type ApiError = z.infer<typeof apiErrorSchema>;
export type StationAlert = z.infer<typeof stationAlertSchema>;
export type HistoryRecord = z.infer<typeof historyRecordSchema>;
export type StationSnapshot = z.infer<typeof stationSnapshotSchema>;
export type CurrentWreck = z.infer<typeof currentWreckSchema>;
export type AuthenticatedUserSummary = z.infer<typeof authenticatedUserSummarySchema>;
export type InventoryItem = z.infer<typeof inventoryItemSchema>;
export type Ship = z.infer<typeof shipSchema>;
export type CrewMember = z.infer<typeof crewMemberSchema>;
export type Expedition = z.infer<typeof expeditionSchema>;
export type RealtimeEvent = z.infer<typeof realtimeEventSchema>;

export function parseRealtimeEvent(value: unknown): RealtimeEvent {
  return realtimeEventSchema.parse(value);
}
