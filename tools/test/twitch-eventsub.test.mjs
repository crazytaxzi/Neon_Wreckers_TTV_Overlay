import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const route = fs.readFileSync('apps/api/src/routes/integrations.ts', 'utf8');
const twitch = fs.readFileSync('packages/integrations/src/twitch.ts', 'utf8');
const environment = fs.readFileSync('.env.example', 'utf8');
const admin = fs.readFileSync('apps/admin/src/main.tsx', 'utf8');

const requiredScopes = [
  'user:read:chat',
  'moderator:read:followers',
  'channel:read:subscriptions',
  'bits:read'
];

test('deployment and runtime require every EventSub authorization scope', () => {
  for (const scope of requiredScopes) {
    assert.ok(environment.includes(scope), `.env.example is missing ${scope}`);
    assert.ok(route.includes(`'${scope}'`), `runtime scope validation is missing ${scope}`);
  }
  assert.match(route, /findMissingTwitchScopes\(broadcaster\.twitchCredential\.scopes\)/);
  assert.match(route, /Reconnect Twitch authorization\. Missing scopes:/);
});

test('duplicate EventSub subscriptions reconcile as success', () => {
  assert.match(twitch, /response\.statusCode === 409/);
  assert.match(twitch, /status: 'existing'/);
  assert.doesNotMatch(twitch, /failed with \$\{response\.statusCode\}: \$\{JSON\.stringify\(payload\)\}/);
});

test('raw Twitch payloads stay in structured logs instead of operator toasts', () => {
  assert.match(route, /twitchResponse:/);
  assert.match(route, /request\.log\.warn/);
  assert.match(route, /Check server logs for details/);
  assert.doesNotMatch(admin, /JSON\.stringify\([^)]*Twitch/i);
});
