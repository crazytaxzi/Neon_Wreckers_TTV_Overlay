import type { Prisma } from '@prisma/client';

export async function acquireTransactionLock(
  transaction: Prisma.TransactionClient,
  key: string
): Promise<void> {
  await transaction.$queryRaw<Array<{ locked: boolean }>>`
    WITH advisory_lock AS MATERIALIZED (
      SELECT pg_advisory_xact_lock(hashtext(${key})::bigint)
    )
    SELECT TRUE AS locked
    FROM advisory_lock
  `;
}
