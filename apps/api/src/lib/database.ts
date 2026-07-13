import type { Prisma } from '@prisma/client';

export async function acquireTransactionLock(transaction: Prisma.TransactionClient, key: string): Promise<void> {
  await transaction.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0))`;
}
