import test from 'node:test';
import assert from 'node:assert/strict';
import { expeditionDefinitions } from '@neon-wreckers/content';
import { activeExpeditionDefinitions } from '../../apps/api/src/services/expedition-definitions.js';

const base = Object.values(expeditionDefinitions)[0];

test('newest valid active authored expedition version wins', async () => {
  const older = { ...base, slug: 'handmade-test', name: 'Older Handmade Mission' };
  const newer = { ...older, name: 'Newest Handmade Mission' };
  const prisma = {
    contentVersion: {
      findMany: async () => [
        { slug: 'expedition.handmade-test', version: 2, contentJson: newer },
        { slug: 'expedition.handmade-test', version: 1, contentJson: older }
      ]
    }
  } as unknown as Parameters<typeof activeExpeditionDefinitions>[0];

  const definitions = await activeExpeditionDefinitions(prisma);
  assert.equal(definitions['handmade-test'].name, 'Newest Handmade Mission');
});

test('an invalid newest authored version falls back to the next valid active version', async () => {
  const valid = { ...base, slug: 'fallback-test', name: 'Valid Fallback Mission' };
  const prisma = {
    contentVersion: {
      findMany: async () => [
        { slug: 'expedition.fallback-test', version: 3, contentJson: { slug: 'fallback-test' } },
        { slug: 'expedition.fallback-test', version: 2, contentJson: valid }
      ]
    }
  } as unknown as Parameters<typeof activeExpeditionDefinitions>[0];

  const definitions = await activeExpeditionDefinitions(prisma);
  assert.equal(definitions['fallback-test'].name, 'Valid Fallback Mission');
});
