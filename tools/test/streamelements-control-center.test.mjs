import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const integration = fs.readFileSync('packages/integrations/src/streamelements.ts', 'utf8');
const service = fs.readFileSync('apps/api/src/services/streamelements.ts', 'utf8');
const routes = fs.readFileSync('apps/api/src/routes/integrations.ts', 'utf8');
const adminRoutes = fs.readFileSync('apps/api/src/routes/admin.ts', 'utf8');
const points = fs.readFileSync('apps/api/src/services/points.ts', 'utf8');
const commands = fs.readFileSync('apps/api/src/services/chat-commands.ts', 'utf8');
const commandRoutes = fs.readFileSync('apps/api/src/routes/chat-commands.ts', 'utf8');
const eventsub = fs.readFileSync('apps/api/src/routes/eventsub.ts', 'utf8');
const admin = fs.readFileSync('apps/admin/src/main.tsx', 'utf8');
const environment = fs.readFileSync('.env.example', 'utf8');
const docs = fs.readFileSync('docs/STREAMELEMENTS_INTEGRATION.md', 'utf8');

test('StreamElements uses the documented authorization-code flow and verifies exact account identity', () => {
  for (const endpoint of ['/oauth2/authorize', '/oauth2/token', '/oauth2/validate', '/channels/me']) {
    assert.ok(integration.includes(endpoint), `StreamElements integration is missing ${endpoint}`);
  }
  for (const field of ['channelId', 'providerId', 'username', 'displayName', 'avatarUrl']) {
    assert.ok(service.includes(field), `saved connection identity is missing ${field}`);
  }
  assert.match(routes, /STREAMELEMENTS_OAUTH_NOT_CONFIGURED/);
  assert.match(routes, /saveOAuthStreamElementsConnection/);
  assert.match(service, /encryptCredential\(input\.accessToken\)/);
  assert.doesNotMatch(service, /accessToken:\s*input\.accessToken/);
});

test('StreamElements account routing is selectable, verifiable, and guarded', () => {
  for (const path of ['import-legacy', '/select', '/verify', '/settings']) assert.ok(routes.includes(path));
  assert.match(service, /activeConnectionSlug/);
  assert.match(service, /matchesStreamer/);
  assert.match(points, /connection\.channelId/);
  assert.match(adminRoutes, /STREAMELEMENTS_ACCOUNT_MISMATCH/);
  assert.match(admin, /Choose the charged channel/);
  assert.match(admin, /Verify selected account/);
  assert.match(admin, /Use this account/);
  assert.match(admin, /FEATURE_POINTS_ACTIONS=true/);
});

test('encrypted managed configuration is isolated from the generic registry', () => {
  assert.match(adminRoutes, /reservedConfigPrefixes = \['integration\.', 'chat-command\.'\]/);
  assert.match(adminRoutes, /where: \{ NOT: reservedConfigPrefixes\.map/);
  assert.match(adminRoutes, /select: \{ id: true, slug: true, version: true, lifecycle: true, createdAt: true \}/);
  assert.match(adminRoutes, /assertPublicConfigSlug\(body\.slug\)/);
  assert.doesNotMatch(adminRoutes, /select: \{[^}]*contentJson: true/);
});

test('OAuth scopes are least-privilege for identity and loyalty operations', () => {
  for (const scope of ['channel:read', 'loyalty:read', 'loyalty:write']) {
    assert.ok(environment.includes(scope), `.env.example is missing ${scope}`);
    assert.ok(docs.includes(scope), `StreamElements documentation is missing ${scope}`);
  }
  assert.doesNotMatch(environment, /STREAMELEMENTS_OAUTH_SCOPES=.*activities:read/);
  assert.match(docs, /does not request that permission/i);
});

test('chat command editing remains inside a server-side action allowlist', () => {
  assert.match(commands, /defaultChatCommands/);
  assert.match(commands, /findChatCommand/);
  assert.match(commandRoutes, /z\.discriminatedUnion\('type'/);
  for (const allowed of ['scan', 'salvage', 'point_action']) assert.ok(commandRoutes.includes(`z.literal('${allowed}')`));
  assert.match(eventsub, /findChatCommand/);
  assert.match(eventsub, /executeChatCommand/);
  assert.doesNotMatch([commands, commandRoutes, eventsub].join('\n'), /\beval\s*\(|new Function\s*\(/);
  assert.match(admin, /Command Editor/);
  assert.match(admin, /safe server-side action allowlist/);
});

test('overlay event behavior is documented without duplicate StreamElements ingestion', () => {
  assert.match(docs, /Twitch EventSub/i);
  assert.match(docs, /follows, subscriptions, cheers, and raids/i);
  assert.match(docs, /duplicate activity cards/i);
});
