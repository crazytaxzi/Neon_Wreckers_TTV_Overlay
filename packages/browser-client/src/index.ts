import { apiErrorEnvelopeSchema, apiSuccessEnvelopeSchema } from '@neon-wreckers/contracts';
import { z, type ZodTypeAny } from 'zod';

export class ContractValidationError extends Error {
  constructor(message: string, readonly issues: z.ZodIssue[]) {
    super(message);
    this.name = 'ContractValidationError';
  }
}

export async function requestApi<T>(path: string, init: RequestInit = {}, schema?: ZodTypeAny): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body != null && !headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }

  const response = await fetch(path, {
    ...init,
    credentials: 'include',
    headers
  });
  const payload: unknown = await response.json().catch(() => ({}));

  if (!response.ok) {
    const parsedError = apiErrorEnvelopeSchema.safeParse(payload);
    if (parsedError.success) throw new Error(parsedError.data.error.message);
    throw new ContractValidationError(`Invalid error envelope for ${path}`, parsedError.error.issues);
  }

  const envelope = apiSuccessEnvelopeSchema(schema ?? z.unknown()).safeParse(payload);
  if (!envelope.success) {
    console.error('API contract validation failed', { path, issues: envelope.error.issues });
    throw new ContractValidationError(`Invalid API response contract for ${path}`, envelope.error.issues);
  }
  return envelope.data.data as T;
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
