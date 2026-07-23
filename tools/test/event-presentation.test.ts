import assert from 'node:assert/strict';
import test from 'node:test';
import { eventPresentationSchema } from '../../packages/contracts/src/index.js';
import { presentationForEvent, withEventPresentation } from '../../apps/api/src/services/event-presentation.js';
import { headlineFromHistory } from '../../apps/overlay/src/headlines.js';

test('server presentation is deterministic for representative event categories', () => {
  assert.deepEqual(presentationForEvent({ category: 'salvage', title: 'Wreck recovered' }), {
    severity: 'positive', category: 'salvage', priority: 50, breaking: false,
    iconKey: 'salvage', localizationKey: 'event.salvage', fallbackText: 'Wreck recovered'
  });
  assert.equal(presentationForEvent({ category: 'viewer', title: 'Raid joined' }).severity, 'viewer');
  assert.equal(presentationForEvent({ category: 'event', severity: 'critical', title: 'Hull breach' }).breaking, true);
});

test('presentation contract rejects arbitrary metadata', () => {
  assert.equal(eventPresentationSchema.safeParse({ severity: 'critical', category: 'event', priority: 90, breaking: true, playerId: 'secret' }).success, false);
});

test('overlay trusts explicit server metadata before legacy keyword fallback', () => {
  const entry = withEventPresentation({
    id: 'history-1', category: 'system', severity: 'info', title: 'Reactor attack wording', body: 'Legacy words should not override metadata.',
    createdAt: '2026-07-23T00:00:00.000Z', actorDisplayName: null, details: {}
  });
  const headline = headlineFromHistory(entry);
  assert.equal(headline.severity, 'info');
  assert.equal(headline.breaking, false);
});

test('legacy records remain displayable through conservative fallback', () => {
  const headline = headlineFromHistory({
    id: 'legacy-1', category: 'event', title: 'Emergency breach', body: 'Legacy row',
    createdAt: '2026-07-23T00:00:00.000Z', actorDisplayName: null, details: {}
  });
  assert.equal(headline.severity, 'critical');
  assert.equal(headline.breaking, true);
});
