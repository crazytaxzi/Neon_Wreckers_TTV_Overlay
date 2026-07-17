import { PrismaClient, type Prisma } from '@prisma/client';
import { Queue, Worker } from 'bullmq';
import { discoverWreck, resolveExpedition } from '@neon-wreckers/game-engine';
import { events, itemsBySlug, seasons, wreckArchetypes } from '@neon-wreckers/content';
import { parseRedisConnection } from '@neon-wreckers/integrations';

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) throw new Error('REDIS_URL is required.');

const connection = parseRedisConnection(redisUrl);
const prisma = new PrismaClient();
const gameQueue = new Queue('neon-wreckers-game', { connection });
const worker = new Worker(
  'neon-wreckers-game',
  async job => {
    if (job.name !== 'resolve-expedition') {
      throw new Error(`Unsupported worker job: ${job.name}`);
    }

    const expedition = await prisma.expedition.findUniqueOrThrow({
      where: { id: String(job.data.expeditionId) }
    });
    if (expedition.status !== 'active') return { skipped: true, status: expedition.status };
    if (!expedition.resolvesAt) throw new Error(`Active expedition ${expedition.id} has no resolution time.`);

    const resolved = resolveExpedition({
      expedition: {
        ...expedition,
        incidentLog: expedition.incidentLog as string[],
        rewards: expedition.rewards as unknown[]
      },
      items: itemsBySlug,
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
    const recoveryMultiplier = 1 - Number((medical?.effects as Record<string, unknown> | null)?.injuryRecoveryBonus ?? 0);


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
        await transaction.crewMember.updateMany({ where: { id: { in: expedition.crewIds } }, data: { morale: { decrement: 8 }, injuredUntil: new Date(Date.now() + 30 * 60_000 * recoveryMultiplier) } });
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
    await gameQueue.add('resolve-expedition', { expeditionId: expedition.id }, { jobId: `reconcile:${expedition.id}:${Math.floor(now.getTime() / 60_000)}`, attempts: 3, backoff: { type: 'exponential', delay: 5_000 }, removeOnComplete: 100, removeOnFail: 500 });
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
    if (!eligible) continue;
    const recent = await prisma.runtimeEvent.findFirst({ where: { slug: definition.slug, startsAt: { gt: new Date(now.getTime() - definition.cooldownMinutes * 60_000) } } });
    if (recent) continue;
    await prisma.$transaction(async (transaction: Prisma.TransactionClient) => {
      await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`event:${definition.slug}`}))`;
      if (await transaction.runtimeEvent.findFirst({ where: { slug: definition.slug, startsAt: { gt: new Date(now.getTime() - definition.cooldownMinutes * 60_000) } } })) return;
      const runtime = await transaction.runtimeEvent.create({ data: { slug: definition.slug, status: 'active', source: 'worker', payload: JSON.parse(JSON.stringify(definition)), startsAt: now, endsAt: new Date(now.getTime() + definition.durationMinutes * 60_000) } });
      for (const action of definition.actions) {
        if (action.type === 'damageModule') {
          const module = station.modules.find(candidate => candidate.slug === String(action.params.module ?? ''));
          if (module) await transaction.stationModule.update({ where: { id: module.id }, data: { integrity: Math.max(0, module.integrity - Number(action.params.amount ?? 0)), state: 'damaged' } });
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

void tickLiveOperations().catch(error => console.error('Live operations tick failed', error));
const liveOperationsTimer = setInterval(() => void tickLiveOperations().catch(error => console.error('Live operations tick failed', error)), 60_000);
liveOperationsTimer.unref();
