import { z } from 'zod';

export const isoDateTimeSchema = z.string().datetime({ offset: true }).or(z.string().datetime());
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
  createdAt: isoDateTimeSchema
}).passthrough();

export const historyRecordSchema = z.object({
  id: z.string(),
  category: z.string(),
  title: z.string(),
  body: z.string(),
  createdAt: z.union([isoDateTimeSchema, z.date()]),
  actorDisplayName: z.string().nullable().optional(),
  details: jsonValueSchema.optional()
}).passthrough();

export const stationModuleSchema = z.object({
  slug: z.string(),
  name: z.string(),
  level: z.number(),
  state: z.string(),
  progress: z.number(),
  integrity: z.number(),
  visualKey: z.string(),
  effects: z.record(z.unknown()),
  plaques: z.array(z.unknown()).optional(),
  project: z.unknown().nullable().optional()
}).passthrough();

export const stationSnapshotSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  level: z.number(),
  population: z.number(),
  power: z.number(),
  morale: z.number(),
  integrity: z.number(),
  storageCapacity: z.number(),
  storageUsed: z.number(),
  threatLevel: z.union([z.string(), z.number()]),
  resources: z.record(z.number()),
  modules: z.array(stationModuleSchema),
  alerts: z.array(stationAlertSchema),
  activeModifiers: z.array(z.unknown()).optional()
}).passthrough();

export const currentWreckSchema = z.object({
  id: z.string(),
  name: z.string(),
  risk: z.string(),
  integrity: z.number(),
  description: z.string().optional(),
  visualKey: z.string().optional(),
  salvageProfile: z.record(z.unknown()).optional()
}).passthrough();

export const authenticatedUserSummarySchema = z.object({
  id: z.string(),
  twitchUserId: z.string().optional(),
  displayName: z.string(),
  avatarUrl: z.string().nullable().optional(),
  roles: z.array(z.string()),
  player: z.object({ id: z.string() }).passthrough()
}).passthrough();

export const inventoryItemSchema = z.object({
  id: z.string(),
  playerId: z.string().optional(),
  itemSlug: z.string(),
  name: z.string(),
  quantity: z.number().int().nonnegative(),
  rarity: z.string().optional(),
  visualKey: z.string().optional()
}).passthrough();

export const shipSchema = z.object({
  id: z.string(),
  playerId: z.string().optional(),
  name: z.string(),
  fuel: z.number().optional(),
  condition: z.number().optional(),
  upgrades: z.array(z.string()).optional(),
  activeSkin: z.string().nullable().optional()
}).passthrough();

export const crewMemberSchema = z.object({
  id: z.string(),
  playerId: z.string().optional(),
  name: z.string(),
  role: z.string(),
  jobStars: z.number().optional(),
  talentStars: z.number().optional(),
  injuredUntil: z.union([isoDateTimeSchema, z.date(), z.null()]).optional()
}).passthrough();

export const expeditionSchema = z.object({
  id: z.string(),
  playerId: z.string().optional(),
  definition: z.string(),
  name: z.string(),
  status: z.string(),
  risk: z.string(),
  shipId: z.string(),
  crewIds: z.array(z.string()),
  launchedAt: z.union([isoDateTimeSchema, z.date()]),
  resolvesAt: z.union([isoDateTimeSchema, z.date()]),
  rewards: z.array(z.unknown()).optional(),
  incidentLog: z.array(z.unknown()).optional()
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
