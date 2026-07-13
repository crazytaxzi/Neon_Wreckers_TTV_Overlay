import type { LoyaltyProvider } from '@neon-wreckers/integrations';

type ChargeRequest = {
  channelId: string;
  username: string;
  amount: number;
  reason: string;
  refundReason: string;
  idempotencyKey: string;
};

type ChargedActionResult<T> =
  | {
      status: 'committed';
      debitReference: string;
      outcome: T;
    }
  | {
      status: 'refunded';
      debitReference: string;
      error: unknown;
    }
  | {
      status: 'ambiguous';
      debitReference: string;
      error: unknown;
      refundError: unknown;
    };

export async function runChargedAction<T>(
  provider: LoyaltyProvider,
  charge: ChargeRequest,
  execute: () => Promise<T>
): Promise<ChargedActionResult<T>> {
  const debit = await provider.debit({
    channelId: charge.channelId,
    username: charge.username,
    amount: charge.amount,
    reason: charge.reason,
    idempotencyKey: charge.idempotencyKey
  });

  try {
    return {
      status: 'committed',
      debitReference: debit.externalReference,
      outcome: await execute()
    };
  } catch (error) {
    try {
      await provider.credit({
        channelId: charge.channelId,
        username: charge.username,
        amount: charge.amount,
        reason: charge.refundReason,
        idempotencyKey: `refund:${charge.idempotencyKey}`,
        priorReference: debit.externalReference
      });
      return { status: 'refunded', debitReference: debit.externalReference, error };
    } catch (refundError) {
      return {
        status: 'ambiguous',
        debitReference: debit.externalReference,
        error,
        refundError
      };
    }
  }
}
