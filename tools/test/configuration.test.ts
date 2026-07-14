import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import type { FastifyRequest } from 'fastify';

Object.assign(process.env, {
  NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
  REDIS_URL: 'redis://localhost:6379',
  SESSION_SECRET: '0123456789abcdef0123456789abcdef'
});

const { parseEnvironment } = await import('../../apps/api/src/env.js');
const { readSignedCookie } = await import('../../apps/api/src/services/auth.js');
const {
  constructionProgressRules,
  expeditionDefinitions,
  pointActions,
  salvageCooldownSeconds
} = await import('@neon-wreckers/content');

const baseEnvironment = {
  DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
  REDIS_URL: 'redis://localhost:6379',
  SESSION_SECRET: '0123456789abcdef0123456789abcdef'
};

test('production environment rejects insecure proxy and incomplete provider configuration', () => {
  assert.throws(() => parseEnvironment({
    ...baseEnvironment,
    NODE_ENV: 'production',
    TRUST_PROXY: 'false',
    COOKIE_SECURE: 'false'
  }), /TWITCH_CLIENT_ID is required in production/);

  assert.throws(() => parseEnvironment({
    ...baseEnvironment,
    FEATURE_POINTS_ACTIONS: 'true',
    STREAMELEMENTS_PROVIDER: 'disabled'
  }), /FEATURE_POINTS_ACTIONS requires STREAMELEMENTS_PROVIDER=streamelements/);
});

test('signed cookie reader rejects invalid signatures', () => {
  const valid = {
    cookies: { nw_session: 'signed-value' },
    unsignCookie: () => ({ valid: true, renew: false, value: 'raw-token' })
  } as unknown as FastifyRequest;
  const invalid = {
    cookies: { nw_session: 'tampered-value' },
    unsignCookie: () => ({ valid: false, renew: false, value: null })
  } as unknown as FastifyRequest;

  assert.equal(readSignedCookie(valid, 'nw_session'), 'raw-token');
  assert.equal(readSignedCookie(invalid, 'nw_session'), null);
});

test('runtime game configuration matches the canonical balance document', () => {
  const balance = JSON.parse(fs.readFileSync('content/base/balance.json', 'utf8'));
  assert.deepEqual(pointActions, balance.pointActions);
  assert.deepEqual(constructionProgressRules, balance.construction);
  assert.deepEqual(salvageCooldownSeconds, {
    cutters: balance.salvageCooldownSeconds,
    cargo: balance.cargoCooldownSeconds,
    override: balance.overrideCooldownSeconds
  });
  assert.deepEqual(Object.values(expeditionDefinitions), balance.expeditions);
});
