import type { FastifyInstance } from 'fastify';
import { env, twitchScopes } from '../env.js';
import type { ApiContext } from '../types.js';
import { requireAdmin, requireUser } from '../services/auth.js';
import {
  createTwitchEventSubSubscription,
  fetchTwitchAppToken,
  refreshTwitchToken,
  TwitchEventSubSubscriptionError
} from '@neon-wreckers/integrations';
import { decryptCredential, saveTwitchCredential } from '../services/twitch-credentials.js';

const requiredEventSubScopes = [
  'user:read:chat',
  'moderator:read:followers',
  'channel:read:subscriptions',
  'bits:read'
] as const;

export function findMissingTwitchScopes(grantedScopes: readonly string[]) {
  const granted = new Set(grantedScopes);
  return requiredEventSubScopes.filter(scope => !granted.has(scope));
}

function eventSubFailureMessage(error: unknown) {
  if (error instanceof TwitchEventSubSubscriptionError) {
    if (error.statusCode === 401 || error.statusCode === 403) {
      return 'Twitch rejected authorization. Reconnect the streamer account and retry.';
    }
    return `Twitch rejected the request (${error.statusCode}). Check server logs for details.`;
  }
  return error instanceof Error ? error.message : 'Unknown Twitch EventSub failure';
}

export async function registerIntegrationRoutes(app: FastifyInstance, context: ApiContext) {
  app.get('/api/v1/integrations/streamelements/health', async request => {
    await requireAdmin(context.prisma, request);
    return { data: await context.loyaltyProvider.health(), requestId: request.id };
  });

  app.get('/api/v1/integrations/streamelements/balance', async request => {
    const user = await requireUser(context.prisma, request);
    return {
      data: await context.loyaltyProvider.getBalance({
        channelId: env.STREAMELEMENTS_CHANNEL_ID,
        username: user.twitchLogin || user.displayName
      }),
      requestId: request.id
    };
  });

  app.get('/api/v1/integrations/twitch/health', async request => {
    await requireAdmin(context.prisma, request);
    const user = await context.prisma.user.findUnique({ where: { twitchUserId: env.STREAMER_TWITCH_ID }, include: { twitchCredential: true } });
    const grantedScopes = user?.twitchCredential?.scopes ?? [];
    return {
      data: {
        configured: Boolean(env.TWITCH_CLIENT_ID && env.TWITCH_CLIENT_SECRET && env.STREAMER_TWITCH_ID),
        authorized: Boolean(user?.twitchCredential),
        expiresAt: user?.twitchCredential?.expiresAt ?? null,
        scopes: grantedScopes,
        requiredScopes: requiredEventSubScopes,
        missingScopes: findMissingTwitchScopes(grantedScopes)
      },
      requestId: request.id
    };
  });

  app.post('/api/v1/integrations/twitch/subscribe', async request => {
    await requireAdmin(context.prisma, request);
    const broadcaster = await context.prisma.user.findUnique({ where: { twitchUserId: env.STREAMER_TWITCH_ID }, include: { twitchCredential: true } });
    if (!broadcaster?.twitchCredential) throw new Error('The streamer must sign in again to grant Twitch event scopes.');

    const missingConfiguredScopes = findMissingTwitchScopes(twitchScopes);
    const missingGrantedScopes = findMissingTwitchScopes(broadcaster.twitchCredential.scopes);
    const missingScopes = [...new Set([...missingConfiguredScopes, ...missingGrantedScopes])];
    if (missingScopes.length > 0) {
      return {
        data: [{
          type: 'authorization',
          ok: false,
          error: `Reconnect Twitch authorization. Missing scopes: ${missingScopes.join(', ')}`
        }],
        requestId: request.id
      };
    }

    if (broadcaster.twitchCredential.expiresAt <= new Date(Date.now() + 60_000)) {
      const refreshed = await refreshTwitchToken({ clientId: env.TWITCH_CLIENT_ID, clientSecret: env.TWITCH_CLIENT_SECRET }, decryptCredential(broadcaster.twitchCredential.refreshTokenEncrypted));
      await saveTwitchCredential(context.prisma, broadcaster.id, refreshed);
    }

    const appToken = await fetchTwitchAppToken(env.TWITCH_CLIENT_ID, env.TWITCH_CLIENT_SECRET);
    const callback = new URL('/api/v1/integrations/twitch/eventsub', env.PUBLIC_WEB_URL).toString();
    const broadcasterId = env.STREAMER_TWITCH_ID;
    const definitions: Array<{ type: string; version: string; condition: Record<string, string> }> = [
      { type: 'channel.chat.message', version: '1', condition: { broadcaster_user_id: broadcasterId, user_id: broadcasterId } },
      { type: 'channel.follow', version: '2', condition: { broadcaster_user_id: broadcasterId, moderator_user_id: broadcasterId } },
      { type: 'channel.subscribe', version: '1', condition: { broadcaster_user_id: broadcasterId } },
      { type: 'channel.cheer', version: '1', condition: { broadcaster_user_id: broadcasterId } },
      { type: 'channel.raid', version: '1', condition: { to_broadcaster_user_id: broadcasterId } }
    ];
    const results = await Promise.allSettled(definitions.map(definition => createTwitchEventSubSubscription({ clientId: env.TWITCH_CLIENT_ID, accessToken: appToken.access_token, callback, secret: env.TWITCH_EVENTSUB_SECRET, ...definition })));
    const response = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return { type: definitions[index].type, ok: true, status: result.value.status };
      }
      const error = result.reason;
      request.log.warn({
        err: error,
        eventSubType: definitions[index].type,
        twitchStatusCode: error instanceof TwitchEventSubSubscriptionError ? error.statusCode : undefined,
        twitchResponse: error instanceof TwitchEventSubSubscriptionError ? error.responsePayload : undefined
      }, 'Twitch EventSub subscription reconciliation failed');
      return { type: definitions[index].type, ok: false, error: eventSubFailureMessage(error) };
    });
    return { data: response, requestId: request.id };
  });
}
