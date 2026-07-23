import assert from 'node:assert/strict';
import test from 'node:test';
import {
  classifyHeadline,
  headlineFromAlert,
  headlineFromHistory,
  isBreakingHeadline,
  sortAndLimitHeadlines,
  type Headline
} from '../../apps/overlay/src/headlines.js';

test('headline classification preserves existing severity behavior', () => {
  assert.equal(classifyHeadline('reactor breach detected'), 'critical');
  assert.equal(classifyHeadline('pirate threat nearby'), 'warning');
  assert.equal(classifyHeadline('subscriber joined'), 'viewer');
  assert.equal(classifyHeadline('repair complete'), 'positive');
  assert.equal(classifyHeadline('routine station update'), 'info');
});

test('breaking behavior remains deterministic', () => {
  assert.equal(isBreakingHeadline('routine message', 'critical'), true);
  assert.equal(isBreakingHeadline('pirate activity', 'warning'), true);
  assert.equal(isBreakingHeadline('routine warning', 'warning'), false);
});

test('history and alert records become stable headlines', () => {
  const history = headlineFromHistory({ id: 'history-1', category: 'salvage', title: 'Wreck found', body: 'Recovery operation online', createdAt: '2026-07-23T00:00:00.000Z' } as never, 1);
  assert.equal(history.id, 'history-1');
  assert.equal(history.label, 'SALVAGE');
  assert.equal(history.severity, 'positive');

  const alert = headlineFromAlert({ id: 'alert-1', severity: 'critical', title: 'Hull breach', body: 'Emergency response required', createdAt: '2026-07-23T00:00:00.000Z' } as never, 1);
  assert.equal(alert.label, 'BREAKING ALERT');
  assert.equal(alert.breaking, true);
});

test('headline ordering is bounded, breaking-first, and duplicate-free', () => {
  const entries: Headline[] = [
    { id: 'old', label: 'A', title: 'Old', body: '', severity: 'info', createdAt: 1 },
    { id: 'breaking', label: 'B', title: 'Breaking', body: '', severity: 'critical', createdAt: 0, breaking: true },
    { id: 'new', label: 'C', title: 'New', body: '', severity: 'info', createdAt: 2 },
    { id: 'new', label: 'C', title: 'Duplicate', body: '', severity: 'info', createdAt: 3 }
  ];
  assert.deepEqual(sortAndLimitHeadlines(entries, 3).map(entry => entry.id), ['breaking', 'new', 'old']);
});
