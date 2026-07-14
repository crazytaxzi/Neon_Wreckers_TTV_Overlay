import type { PrismaClient } from '@prisma/client';
import type { ModuleState } from '@neon-wreckers/game-engine';

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

export async function stationDto(prisma: Pick<PrismaClient, 'station'>) {
  const station = await prisma.station.findUniqueOrThrow({
    where: { slug: 'station-zero' },
    include: { resources: true, modules: { include: { plaques: true } }, alerts: true }
  });
  return {
    id: station.id,
    slug: station.slug,
    name: station.name,
    level: station.level,
    population: station.population,
    power: station.power,
    morale: station.morale,
    integrity: station.integrity,
    storageCapacity: station.storageCapacity,
    storageUsed: station.storageUsed,
    threatLevel: station.threatLevel,
    activeSeason: station.activeSeason,
    resources: Object.fromEntries(
      (station.resources as StationResourceRecord[]).map(resource => [resource.slug, resource.amount])
    ),
    modules: (station.modules as StationModuleRecord[]).map(module => ({
      slug: module.slug,
      name: module.name,
      level: module.level,
      state: module.state,
      progress: module.progress,
      integrity: module.integrity,
      visualKey: module.visualKey,
      effects: module.effects as Record<string, unknown>,
      plaques: module.plaques.map(plaque => ({
        id: plaque.id,
        title: plaque.title,
        body: plaque.body,
        playerDisplayName: plaque.playerName,
        createdAt: plaque.createdAt.toISOString()
      }))
    })),
    alerts: (station.alerts as StationAlertRecord[]).map(alert => ({
      id: alert.id,
      severity: alert.severity,
      title: alert.title,
      body: alert.body,
      createdAt: alert.createdAt.toISOString()
    })),
    activeModifiers: []
  };
}
