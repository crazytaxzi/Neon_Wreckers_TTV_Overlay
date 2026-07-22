import { GameRuleError } from '@neon-wreckers/game-engine';
import { ZodError } from 'zod';
import { CooldownError } from '../services/actions.js';

export class HttpError extends Error {
  constructor(public readonly statusCode: number, message: string, public readonly code = 'HTTP_ERROR') {
    super(message);
    this.name = 'HttpError';
  }
}

export function isDatabaseError(error: unknown, code: string): error is Error & { code: string } {
  return error instanceof Error && 'code' in error && (error as Error & { code?: unknown }).code === code;
}

export function errorResponse(error: unknown, production: boolean) {
  if (error instanceof CooldownError) {
    return {
      statusCode: 409,
      code: error.code,
      message: error.message,
      details: { retryAt: error.retryAt, retryAfterSeconds: error.retryAfterSeconds }
    };
  }
  if (error instanceof GameRuleError) {
    return { statusCode: 409, code: error.code, message: error.message };
  }
  if (error instanceof HttpError) {
    return { statusCode: error.statusCode, code: error.code, message: error.message };
  }
  if (error instanceof ZodError) {
    return { statusCode: 400, code: 'INVALID_REQUEST', message: error.issues[0]?.message ?? 'Invalid request.' };
  }
  if (isDatabaseError(error, 'P2025')) {
    return { statusCode: 404, code: 'NOT_FOUND', message: 'The requested station record was not found.' };
  }
  const statusCode = typeof error === 'object' && error && 'statusCode' in error
    ? Number((error as { statusCode: unknown }).statusCode) || 500
    : 500;
  const rawMessage = error instanceof Error ? error.message : String(error);
  return {
    statusCode,
    code: statusCode >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_FAILED',
    message: production && statusCode >= 500 ? 'The station coughed sparks. Try again.' : rawMessage
  };
}
