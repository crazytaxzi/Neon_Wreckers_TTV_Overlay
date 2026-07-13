import { PrismaClient } from '@prisma/client';
import { discoverWreck } from '@neon-wreckers/game-engine';
import { initialStation, wreckArchetypes } from '@neon-wreckers/content';

const prisma = new PrismaClient();

async function main() {
  const stationSeed = initialStation;
  const station = await prisma.station.upsert({
    where: { slug: stationSeed.slug },
    update: { name: stationSeed.name },
    create: {
      slug: stationSeed.slug,
      name: stationSeed.name,
      level: stationSeed.level,
      population: stationSeed.population,
      power: stationSeed.power,
      morale: stationSeed.morale,
      integrity: stationSeed.integrity,
      storageCapacity: stationSeed.storageCapacity,
      storageUsed: stationSeed.storageUsed,
      threatLevel: stationSeed.threatLevel,
      activeSeason: stationSeed.activeSeason
    }
  });

  for (const [slug, amount] of Object.entries(stationSeed.resources)) {
    await prisma.stationResource.upsert({
      where: { stationId_slug: { stationId: station.id, slug } },
      update: {},
      create: { stationId: station.id, slug, amount: Number(amount) }
    });
  }

  for (const module of stationSeed.modules) {
    await prisma.stationModule.upsert({
      where: { stationId_slug: { stationId: station.id, slug: module.slug } },
      update: { name: module.name, visualKey: module.visualKey, effects: module.effects },
      create: {
        stationId: station.id,
        slug: module.slug,
        name: module.name,
        level: module.level,
        state: module.state,
        progress: module.progress,
        integrity: module.integrity,
        visualKey: module.visualKey,
        effects: module.effects
      }
    });
  }

  for (const alert of stationSeed.alerts) {
    const existing = await prisma.stationAlert.findFirst({
      where: { stationId: station.id, title: alert.title, body: alert.body }
    });
    if (!existing) {
      await prisma.stationAlert.create({
        data: { stationId: station.id, severity: alert.severity, title: alert.title, body: alert.body }
      });
    }
  }

  const currentWreck = discoverWreck({ station: stationSeed, playerId: 'system', archetypes: wreckArchetypes, seed: 'seed-current-wreck' });
  const existingWreck = await prisma.wreck.findFirst({
    where: { stationId: station.id, depleted: false },
    orderBy: { createdAt: 'desc' }
  });
  if (!existingWreck) {
    await prisma.wreck.create({
      data: {
        stationId: station.id,
        archetype: currentWreck.archetype,
        name: currentWreck.name,
        description: currentWreck.description,
        risk: currentWreck.risk,
        integrity: currentWreck.integrity,
        depleted: false,
        visualKey: currentWreck.visualKey,
        remainingLootBudget: currentWreck.remainingLootBudget,
        discoveredBy: 'system'
      }
    });
  }

}

main()
  .catch(error => {
    console.error('Database seed failed.', error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
