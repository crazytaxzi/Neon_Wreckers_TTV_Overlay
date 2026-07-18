import { PrismaClient, type Prisma } from '@prisma/client';
import { Queue, Worker } from 'bullmq';
import { discoverWreck, resolveExpedition } from '@neon-wreckers/game-engine';
import { craftingRules, events, expeditionDefinitions, itemsBySlug, modulesBySlug, seasons, shipRules, wreckArchetypes } from '@neon-wreckers/content';
import { parseRedisConnection } from '@neon-wreckers/integrations';

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) throw new Error('REDIS_URL is required.');

const connection = parseRedisConnection(redisUrl);
const prisma = new PrismaClient();
const gameQueue = new Queue('neon-wreckers-game', { connection });
const worker = new Worker(
  'neon-wreckers-game',
  async job => {
    if (job.name === 'resolve-crafting') {
      return resolveCraftingJob(String(job.data.craftingJobId));
    }
    if (job.name !== 'resolve-expedition') {
      throw new Error(`Unsupported worker job: ${job.name}`);
    }

    const expedition = await prisma.expedition.findUniqueOrThrow({
      where: { id: String(job.data.expeditionId) },
      include: { ship: true }
    });
    if (expedition.status !== 'active') return { skipped: true, status: expedition.status };
    if (!expedition.resolvesAt) throw new Error(`Active expedition ${expedition.id} has no resolution time.`);
    const expeditionSkin = shipRules.skins.find((skin: { slug: string; successBonus?: number; lootRollBonus?: number }) => skin.slug === expedition.ship?.activeSkin);
    const expeditionCrew = await prisma.crewMember.findMany({ where: { id: { in: expedition.crewIds } } });
    const crewSuccessBonus = expeditionCrew.reduce((total, member) => total + (member.role === 'pilot' ? member.jobStars * .01 + member.talentStars * .004 : member.role === 'scout' ? member.jobStars * .006 + member.talentStars * .008 : member.talentStars * .002), 0);
    const crewLootBonus = expeditionCrew.some(member => member.role === 'quartermaster' && member.jobStars >= 4) ? 1 : 0;

    const resolved = resolveExpedition({
      expedition: {
        ...expedition,
        incidentLog: expedition.incidentLog as string[],
        rewards: expedition.rewards as unknown[]
      },
      expeditionDefinition: expeditionDefinitions[expedition.definition],
      items: itemsBySlug,
      lootRollBonus: (expedition.ship?.upgrades.includes('expanded-hold') ? Number(shipRules.upgrades.find((upgrade: { slug: string; lootRollBonus?: number }) => upgrade.slug === 'expanded-hold')?.lootRollBonus ?? 0) : 0) + Number(expeditionSkin?.lootRollBonus ?? 0) + crewLootBonus,
      successBonus: Number(expeditionSkin?.successBonus ?? 0) + crewSuccessBonus,
      now: expedition.resolvesAt.toISOString()
    });

    const resolvedStatus =

      resolved.status === 'resolved' || resolved.status === 'failed'

        ? resolved.status

        : (() => {

            throw new Error(

              `Unexpected expedition resolution status: ${resolved.status}`

            );

          })();

    const medical = await prisma.stationModule.findFirst({ where: { slug: 'medical-bay', state: 'active' } });
    const recoveryMultiplier = 1 - Math.min(0.6, Number(modulesBySlug['medical-bay'].effects.injuryRecoveryBonus ?? 0) * (medical?.level ?? 0));


    return prisma.$transaction(async (transaction: Prisma.TransactionClient) => {
      const updated = await transaction.expedition.updateMany({
        where: { id: expedition.id, status: 'active' },
        data: {
          status: resolvedStatus,
          rewards: JSON.parse(JSON.stringify(resolved.rewards)),
          incidentLog: JSON.parse(JSON.stringify(resolved.incidentLog))
        }
      });
      if (updated.count === 0) return { skipped: true, status: 'already-resolved' };

      if (resolvedStatus === 'failed') {
        if (expedition.shipId) {
          const ship = await transaction.ship.findUnique({ where: { id: expedition.shipId } });
          if (ship) await transaction.ship.update({ where: { id: ship.id }, data: { condition: Math.max(0, ship.condition - 10) } });
        }
        const medic = expeditionCrew.filter(member => member.role === 'medic').sort((a, b) => b.talentStars - a.talentStars)[0];
        const medicMultiplier = Math.max(.5, 1 - Number(medic?.talentStars ?? 0) * .08);
        await transaction.crewMember.updateMany({ where: { id: { in: expedition.crewIds } }, data: { morale: { decrement: 8 }, injuredUntil: new Date(Date.now() + 30 * 60_000 * recoveryMultiplier * medicMultiplier) } });
      } else {
        for (const crewId of expedition.crewIds) {
          const member = await transaction.crewMember.findUnique({ where: { id: crewId } });
          if (member) await transaction.crewMember.update({ where: { id: crewId }, data: { morale: Math.min(100, member.morale + 3) } });
        }
      }

      await transaction.notification.create({
        data: {
          playerId: expedition.playerId,
          type: 'inbox',
          priority: 2,
          title: 'Expedition returned',
          body: resolved.incidentLog.at(-1) ?? 'Crew returned.'
        }
      });
      return { resolved: true };
    });
  },
  { connection }
);

worker.on('failed', (job, error) => {
  console.error('Worker job failed', { jobId: job?.id, name: job?.name, error });
});
worker.on('error', error => console.error('Worker connection error', error));

let closing = false;
async function shutdown(signal: string) {
  if (closing) return;
  closing = true;
  clearInterval(liveOperationsTimer);
  console.info(`Worker shutting down after ${signal}.`);
  try {
    await worker.close();
    await gameQueue.close();
    await prisma.$disconnect();
  } catch (error) {
    console.error('Worker shutdown failed', error);
    process.exitCode = 1;
  }
}

process.once('SIGTERM', () => void shutdown('SIGTERM'));
process.once('SIGINT', () => void shutdown('SIGINT'));
console.info('Neon Wreckers worker online.');

async function tickLiveOperations() {
  const now = new Date();
  const overdueExpeditions = await prisma.expedition.findMany({ where: { status: 'active', resolvesAt: { lte: now } }, select: { id: true }, take: 100 });
  for (const expedition of overdueExpeditions) {
    await gameQueue.add('resolve-expedition', { expeditionId: expedition.id }, { jobId: `reconcile-${expedition.id}-${Math.floor(now.getTime() / 60_000)}`, attempts: 3, backoff: { type: 'exponential', delay: 5_000 }, removeOnComplete: 100, removeOnFail: 500 });
  }
  const overdueCrafting = await prisma.craftingJob.findMany({ where: { status: 'active', resolvesAt: { lte: now } }, select: { id: true }, take: 100 });
  for (const crafting of overdueCrafting) {
    await gameQueue.add('resolve-crafting', { craftingJobId: crafting.id }, { jobId: `reconcile-craft-${crafting.id}-${Math.floor(now.getTime() / 60_000)}`, attempts: 5, backoff: { type: 'exponential', delay: 5_000 }, removeOnComplete: 100, removeOnFail: 500 });
  }
  await prisma.contentVersion.updateMany({ where: { lifecycle: 'scheduled', scheduledAt: { lte: now }, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }, data: { lifecycle: 'active', publishedAt: now } });
  await prisma.contentVersion.updateMany({ where: { lifecycle: 'active', expiresAt: { lte: now } }, data: { lifecycle: 'archived' } });
  const season = seasons.find(candidate => Date.parse(candidate.startsAt) <= now.getTime() && Date.parse(candidate.endsAt) >= now.getTime());
  await prisma.station.updateMany({ where: { slug: 'station-zero', activeSeason: { not: season?.slug ?? null } }, data: { activeSeason: season?.slug ?? null } });
  await prisma.runtimeEvent.updateMany({ where: { status: 'active', endsAt: { lte: now } }, data: { status: 'completed' } });
  await prisma.stationAlert.deleteMany({ where: { expiresAt: { lte: now } } });
  const station = await prisma.station.findUniqueOrThrow({ where: { slug: 'station-zero' }, include: { modules: true, resources: true } });
  for (const definition of events.filter(candidate => candidate.trigger !== 'manual')) {
    const eligible = definition.conditions.every(condition => {
      if (condition.type === 'stationResourceBelow') {
        const resource = String(condition.params.resource ?? '');
        const current = resource in station ? Number(station[resource as keyof typeof station]) : station.resources.find(candidate => candidate.slug === resource)?.amount ?? 0;
        return current < Number(condition.params.value ?? 0);
      }
      if (condition.type === 'moduleUnlocked') return station.modules.find(module => module.slug === String(condition.params.module ?? ''))?.state === 'active';
      if (condition.type === 'dateRange') return now.getUTCMonth() + 1 === Number(condition.params.month ?? 0);
      return false;
    });
    if (definition.trigger === 'condition') {
      const latest = await prisma.runtimeEvent.findFirst({ where: { slug: definition.slug }, orderBy: { startsAt: 'desc' } });
      if (!eligible) {
        if (latest && latest.status !== 'cleared') await prisma.runtimeEvent.update({ where: { id: latest.id }, data: { status: 'cleared' } });
        continue;
      }
      if (latest && latest.status !== 'cleared') continue;
    } else if (!eligible) continue;
    const recent = await prisma.runtimeEvent.findFirst({ where: { slug: definition.slug, startsAt: { gt: new Date(now.getTime() - definition.cooldownMinutes * 60_000) } } });
    if (recent) continue;
    await prisma.$transaction(async (transaction: Prisma.TransactionClient) => {
      await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`event:${definition.slug}`}))`;
      if (await transaction.runtimeEvent.findFirst({ where: { slug: definition.slug, startsAt: { gt: new Date(now.getTime() - definition.cooldownMinutes * 60_000) } } })) return;
      const runtime = await transaction.runtimeEvent.create({ data: { slug: definition.slug, status: 'active', source: 'worker', payload: JSON.parse(JSON.stringify(definition)), startsAt: now, endsAt: new Date(now.getTime() + definition.durationMinutes * 60_000) } });
      for (const action of definition.actions) {
        if (action.type === 'damageModule') {
          const module = station.modules.find(candidate => candidate.slug === String(action.params.module ?? ''));
          if (module?.state === 'active') await transaction.stationModule.update({ where: { id: module.id }, data: { integrity: Math.max(0, module.integrity - Number(action.params.amount ?? 0)), state: 'damaged' } });
        }
        if (action.type === 'notify') await transaction.stationAlert.create({ data: { stationId: station.id, severity: String(action.params.severity ?? 'warning'), title: String(action.params.title ?? definition.name), body: `${definition.name} is active.`, expiresAt: runtime.endsAt } });
        if (action.type === 'spawnWreck') {
          const archetypes = action.params.archetype ? wreckArchetypes.filter(candidate => candidate.slug === action.params.archetype) : action.params.risk ? wreckArchetypes.filter(candidate => candidate.risk === action.params.risk) : wreckArchetypes;
          const wreck = discoverWreck({ station, playerId: 'event', archetypes: archetypes.length ? archetypes : wreckArchetypes });
          await transaction.wreck.updateMany({ where: { stationId: station.id, depleted: false }, data: { depleted: true } });
          await transaction.wreck.create({ data: { stationId: station.id, archetype: wreck.archetype, name: wreck.name, description: wreck.description, risk: wreck.risk, integrity: wreck.integrity, visualKey: wreck.visualKey, remainingLootBudget: wreck.remainingLootBudget, discoveredBy: 'event' } });
        }
      }
      await transaction.historyEntry.create({ data: { stationId: station.id, category: 'event', title: definition.name, body: `${definition.name} activated aboard Station Zero.` } });
    });
  }
}

async function resolveCraftingJob(id: string) {
  const crafting = await prisma.craftingJob.findUniqueOrThrow({ where: { id } });
  if (crafting.status !== 'active') return { skipped: true, status: crafting.status };
  const recipe = craftingRules[crafting.recipeSlug];
  if (!recipe) throw new Error(`Unknown crafting recipe ${crafting.recipeSlug}.`);
  return prisma.$transaction(async transaction => {
    const claimed = await transaction.craftingJob.updateMany({ where: { id, status: 'active', resolvesAt: { lte: new Date() } }, data: { status: 'completed', completedAt: new Date() } });
    if (!claimed.count) return { skipped: true, status: 'not-ready-or-resolved' };
    const received: string[] = [];
    for (const [itemSlug, amount] of Object.entries(recipe.outputs)) {
      const item = itemsBySlug[itemSlug];
      const quantity = amount * crafting.quantity;
      await transaction.inventoryStack.upsert({ where: { playerId_itemSlug: { playerId: crafting.playerId, itemSlug } }, update: { quantity: { increment: quantity } }, create: { playerId: crafting.playerId, itemSlug, name: item.name, quantity, rarity: item.rarity, visualKey: item.visualKey } });
      received.push(`${quantity} × ${item.name}`);
    }
    await transaction.notification.create({ data: { playerId: crafting.playerId, type: 'crafting', title: `${recipe.name} crafted`, body: `Received ${received.join(', ')}.` } });
    return { resolved: true };
  });
}

async function recoverActiveExpeditions() {
  const activeExpeditions = await prisma.expedition.findMany({ where: { status: 'active' }, select: { id: true, resolvesAt: true }, take: 500 });
  for (const expedition of activeExpeditions) {
    if (!expedition.resolvesAt) {
      console.error('Active expedition has no resolution time', { expeditionId: expedition.id });
      continue;
    }
    await gameQueue.add('resolve-expedition', { expeditionId: expedition.id }, {
      delay: Math.max(0, expedition.resolvesAt.getTime() - Date.now()),
      jobId: `recovery-${expedition.id}`,
      attempts: 3,
      backoff: { type: 'exponential', delay: 5_000 },
      removeOnComplete: 100,
      removeOnFail: 500
    });
  }
}

async function recoverActiveCrafting() {
  const active = await prisma.craftingJob.findMany({ where: { status: 'active' }, select: { id: true, resolvesAt: true }, take: 500 });
  for (const crafting of active) {
    await gameQueue.add('resolve-crafting', { craftingJobId: crafting.id }, {
      delay: Math.max(0, crafting.resolvesAt.getTime() - Date.now()),
      jobId: `recovery-craft-${crafting.id}`,
      attempts: 5,
      backoff: { type: 'exponential', delay: 5_000 },
      removeOnComplete: 100,
      removeOnFail: 500
    });
  }
}

void recoverActiveExpeditions().catch(error => console.error('Active expedition recovery failed', error));
void recoverActiveCrafting().catch(error => console.error('Active crafting recovery failed', error));
void tickLiveOperations().catch(error => console.error('Live operations tick failed', error));
const liveOperationsTimer = setInterval(() => void tickLiveOperations().catch(error => console.error('Live operations tick failed', error)), 60_000);
liveOperationsTimer.unref();
