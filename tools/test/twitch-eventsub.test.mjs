import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const route = fs.readFileSync('apps/api/src/routes/integrations.ts', 'utf8');
const auth = fs.readFileSync('apps/api/src/routes/auth.ts', 'utf8');
const twitch = fs.readFileSync('packages/integrations/src/twitch.ts', 'utf8');
const environmentExample = fs.readFileSync('.env.example', 'utf8');
const environmentSource = fs.readFileSync('apps/api/src/env.ts', 'utf8');
const admin = fs.readFileSync('apps/admin/src/main.tsx', 'utf8');

const requiredScopes = [
  'user:read:chat',
  'user:bot',
  'channel:bot',
  'moderator:read:followers',
  'channel:read:subscriptions',
  'bits:read'
];

test('deployment and runtime require every EventSub authorization scope', () => {
  for (const scope of requiredScopes) {
    assert.ok(environmentExample.includes(scope), `.env.example is missing ${scope}`);
    assert.ok(environmentSource.includes(`'${scope}'`), `canonical OAuth scopes are missing ${scope}`);
  }
  assert.match(environmentSource, /new Set\(\[\.\.\.twitchBaseScopes, \.\.\.configuredTwitchScopes\]\)/);
  assert.match(route, /import \{[^}]*\benv\b[^}]*\btwitchEventSubScopes\b[^}]*\btwitchScopes\b[^}]*\} from '\.\.\/env\.js'/);
  assert.match(route, /findMissingTwitchScopes\(broadcaster\.twitchCredential\.scopes\)/);
  assert.match(route, /Reconnect Twitch authorization\. Missing scopes:/);
});

test('Twitch reauthorization can return to admin without allowing open redirects', () => {
  assert.match(auth, /function safeReturnPath/);
  assert.match(auth, /value\.startsWith\('\/\/'\)/);
  assert.match(auth, /nw_twitch_return_to/);
  assert.match(auth, /force_verify/);
  assert.match(auth, /new URL\(returnTo, env\.PUBLIC_WEB_URL\)/);
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
