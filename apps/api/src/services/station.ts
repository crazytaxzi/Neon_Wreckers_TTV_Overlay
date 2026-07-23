import type { PrismaClient } from '@prisma/client';
import type { ModuleState } from '@neon-wreckers/game-engine';
import { modulesBySlug } from '@neon-wreckers/content';
import { withEventPresentation } from './event-presentation.js';

type StationResourceRecord = { slug: string; amount: number };
type PlaqueRecord = { id: string; title: string; body: string; playerName: string | null; createdAt: Date };
type StationModuleRecord = {
  slug: string;
  name: string;
  level: number;
  state: ModuleState;
  progress: number;
  integrity: number;
  visualKey: string;
  effects: Record<string, unknown>;
  plaques: PlaqueRecord[];
  projects: Array<{ id: string; kind: string; targetLevel: number; requirements: unknown; contributed: unknown }>;
};
type StationAlertRecord = { id: string; severity: string; title: string; body: string; createdAt: Date };

export async function publicMe(prisma: PrismaClient, userId: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, include: { player: true } });
  return {
    id: user.id,
    twitchUserId: user.twitchUserId,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    roles: user.roles,
    player: user.player
  };
}

export async function stationDto(prisma: Pick<PrismaClient, 'station' | 'runtimeEvent' | 'museumExhibit'>) {
  const dayStart = new Date();
  dayStart.setUTCHours(0, 0, 0, 0);
  const [station, activeEvents, museumCollection, museumDaily] = await Promise.all([prisma.station.findUniqueOrThrow({
    where: { slug: 'station-zero' },
    include: { resources: true, modules: { include: { plaques: true, projects: { where: { status: 'active' }, orderBy: { createdAt: 'desc' }, take: 1 } } }, alerts: true }
  }), prisma.runtimeEvent.findMany({ where: { status: 'active', OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }] }, orderBy: { startsAt: 'desc' } }),
  prisma.museumExhibit.groupBy({ by: ['itemSlug', 'name'], _sum: { quantity: true } }),
  prisma.museumExhibit.aggregate({ where: { donatedAt: { gte: dayStart } }, _sum: { quantity: true } })]);
  const museumModule = (station.modules as StationModuleRecord[]).find(module => module.slug === 'museum');
  const museumDailyCapacity = museumModule?.state === 'active' ? Number(modulesBySlug.museum.effects.artifactDailyIntake ?? 0) * museumModule.level : 0;
  const cargoModule = (station.modules as StationModuleRecord[]).find(module => module.slug === 'cargo-bay');
  const cargoStorage = cargoModule?.state === 'active' ? Number(modulesBySlug['cargo-bay'].effects.storage ?? 0) * cargoModule.level : 0;
  return {
    id: station.id,
    slug: station.slug,
    name: station.name,
    level: station.level,
    population: station.population,
    populationStatus: {
      capacity: Math.max(100, 100 + (station.modules as StationModuleRecord[]).filter(module => module.slug === 'habitat-ring' && module.state === 'active').reduce((total, module) => total + 150 * Math.max(1, module.level), 0)),
      trend: station.power < 25 || station.integrity < 35 ? -2 : station.morale >= 70 ? 1 : 0,
      reasons: [
        station.power < 25 ? 'Power shortages are driving residents away.' : 'Power supply is supporting occupied decks.',
        station.integrity < 35 ? 'Hull damage is forcing habitat evacuations.' : 'Hull pressure is safe for residents.',
        station.morale < 40 ? 'Low morale is reducing retention.' : 'Community morale is stable.'
      ]
    },
    power: station.power,
    morale: station.morale,
    integrity: station.integrity,
    storageCapacity: station.storageCapacity + cargoStorage,
    storageUsed: station.storageUsed,
    threatLevel: station.threatLevel,
    activeSeason: station.activeSeason,
    resources: Object.fromEntries((station.resources as StationResourceRecord[]).map(resource => [resource.slug, resource.amount])),
    museum: {
      collection: museumCollection.map(entry => ({ itemSlug: entry.itemSlug, name: entry.name, quantity: entry._sum.quantity ?? 0 })),
      donatedToday: museumDaily._sum.quantity ?? 0,
      dailyCapacity: museumDailyCapacity
    },
    modules: (station.modules as StationModuleRecord[]).map(module => {
      const definition = modulesBySlug[module.slug];
      const level = Math.max(0, module.level);
      const effects = Object.fromEntries(Object.entries(definition?.effects ?? module.effects).map(([key, value]) => [key, typeof value === 'number' ? value * level : value]));
      const nextLevelRequirements = definition && level < definition.maxLevel ? Object.fromEntries(Object.entries(definition.construction.resources).map(([slug, amount]) => [slug, Math.ceil(amount * (level + 1))])) : null;
      return {
        slug: module.slug,
        name: module.name,
        description: definition?.description ?? '',
        maxLevel: definition?.maxLevel ?? level,
        prerequisites: definition?.prerequisites ?? [],
        level: module.level,
        state: module.state,
        progress: module.progress,
        integrity: module.integrity,
        visualKey: module.visualKey,
        effects,
        perLevelEffects: definition?.effects ?? module.effects,
        nextLevelRequirements,
        project: module.projects[0] ? { id: module.projects[0].id, kind: module.projects[0].kind, targetLevel: module.projects[0].targetLevel, requirements: module.projects[0].requirements, contributed: module.projects[0].contributed } : null,
        plaques: module.plaques.map(plaque => ({ id: plaque.id, title: plaque.title, body: plaque.body, playerDisplayName: plaque.playerName, createdAt: plaque.createdAt.toISOString() }))
      };
    }),
    alerts: (station.alerts as StationAlertRecord[]).map(alert => withEventPresentation({
      id: alert.id,
      category: 'event',
      severity: alert.severity,
      title: alert.title,
      body: alert.body,
      createdAt: alert.createdAt.toISOString()
    })),
    activeModifiers: activeEvents.map(event => ({ slug: event.slug, startsAt: event.startsAt.toISOString(), endsAt: event.endsAt?.toISOString() ?? null, payload: event.payload }))
  };
}
