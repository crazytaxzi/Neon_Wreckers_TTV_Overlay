import { PrismaClient, type Prisma } from '@prisma/client';
import { Worker } from 'bullmq';
import { resolveExpedition } from '@neon-wreckers/game-engine';
import { itemsBySlug } from '@neon-wreckers/content';
import { parseRedisConnection } from '@neon-wreckers/integrations';

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) throw new Error('REDIS_URL is required.');

const connection = parseRedisConnection(redisUrl);
const prisma = new PrismaClient();
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
  console.info(`Worker shutting down after ${signal}.`);
  try {
    await worker.close();
    await prisma.$disconnect();
  } catch (error) {
    console.error('Worker shutdown failed', error);
    process.exitCode = 1;
  }
}

process.once('SIGTERM', () => void shutdown('SIGTERM'));
process.once('SIGINT', () => void shutdown('SIGINT'));
console.info('Neon Wreckers worker online.');
