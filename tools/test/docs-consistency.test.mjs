import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const read = file => fs.readFileSync(file, 'utf8');

test('public visibility and proprietary license are consistent', () => {
  const readme = read('README.md');
  const license = read('LICENSE');
  assert.doesNotMatch(readme, /This repository is private/i);
  assert.match(readme, /publicly visible on GitHub/i);
  assert.match(readme, /Public visibility is not a software license/i);
  assert.match(license, /proprietary/i);
  assert.match(license, /All rights reserved/);
});

test('historical reports cannot masquerade as current release evidence', () => {
  for (const file of ['docs/TEST_REPORT.md', 'docs/DEPLOYMENT_VERIFICATION.md']) {
    const source = read(file);
    assert.match(source, /Historical evidence snapshot/);
    assert.match(source, /RELEASE_EVIDENCE_TEMPLATE\.md/);
  }
});

test('security and release evidence documents cover required boundaries', () => {
  const security = read('SECURITY.md');
  const boundaries = read('docs/VERIFICATION_BOUNDARIES.md');
  const template = read('docs/RELEASE_EVIDENCE_TEMPLATE.md');
  for (const credential of ['PostgreSQL', 'Redis', 'session', 'Twitch', 'StreamElements', 'TLS']) assert.match(security, new RegExp(credential, 'i'));
  for (const boundary of ['Source-level verification', 'Deployment verification', 'External-integration verification']) assert.match(boundaries, new RegExp(boundary));
  for (const field of ['Commit SHA', 'Environment identifier', 'Final go or no-go decision']) assert.match(template, new RegExp(field));
});
