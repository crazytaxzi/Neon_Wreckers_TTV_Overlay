import crypto from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { cookieSecure, env, twitchEventSubScopes, twitchScopes } from '../env.js';
import type { ApiContext } from '../types.js';
import { HttpError } from '../lib/errors.js';
import { readSignedCookie, requireAdmin, requireUser } from '../services/auth.js';
import {
  buildStreamElementsAuthorizeUrl,
  createTwitchEventSubSubscription,
  exchangeStreamElementsCode,
  fetchTwitchAppToken,
  refreshTwitchToken,
  TwitchEventSubSubscriptionError
} from '@neon-wreckers/integrations';
import { decryptCredential, saveTwitchCredential } from '../services/twitch-credentials.js';
import {
  importLegacyStreamElementsConnection,
  removeStreamElementsConnection,
  saveOAuthStreamElementsConnection,
  selectStreamElementsConnection,
  streamElementsOAuthConfig,
  streamElementsStatus,
  updateStreamElementsConnectionSettings,
  verifyStreamElementsConnection
} from '../services/streamelements.js';

export function findMissingTwitchScopes(grantedScopes: readonly string[]) {
  const granted = new Set(grantedScopes);
  return twitchEventSubScopes.filter(scope => !granted.has(scope));
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

function safeReturnTo(value: string | undefined) {
  return value?.startsWith('/') && !value.startsWith('//') ? value : '/admin/';
}

export async function registerIntegrationRoutes(app: FastifyInstance, context: ApiContext) {
  app.get('/api/v1/integrations/streamelements/health', async request => {
    await requireAdmin(context.prisma, request);
    return { data: await streamElementsStatus(context.prisma), requestId: request.id };
  });

  app.get('/api/v1/integrations/streamelements/balance', async request => {
    const user = await requireUser(context.prisma, request);
    const connection = await context.loyaltyProvider.connection();
    if (!connection) throw new HttpError(503, 'No active StreamElements account is selected.', 'STREAMELEMENTS_NOT_CONNECTED');
    return {
      data: await context.loyaltyProvider.getBalance({
        channelId: connection.channelId,
        username: user.twitchLogin || user.displayName
      }),
      requestId: request.id
    };
  });

  app.get('/api/v1/auth/streamelements/start', async (request, reply) => {
    await requireAdmin(context.prisma, request);
    const query = z.object({ returnTo: z.string().optional() }).parse(request.query);
    let config;
    try {
      config = streamElementsOAuthConfig();
    } catch {
      throw new HttpError(503, 'StreamElements OAuth client credentials are not configured.', 'STREAMELEMENTS_OAUTH_NOT_CONFIGURED');
    }
    const state = crypto.randomBytes(18).toString('base64url');
    reply.setCookie('nw_se_state', state, {
      path: '/api/v1/auth/streamelements',
      httpOnly: true,
      sameSite: 'lax',
      secure: cookieSecure,
      maxAge: 600,
      signed: true
    });
    reply.setCookie('nw_se_return', safeReturnTo(query.returnTo), {
      path: '/api/v1/auth/streamelements',
      httpOnly: true,
      sameSite: 'lax',
      secure: cookieSecure,
      maxAge: 600,
      signed: true
    });
    return reply.redirect(buildStreamElementsAuthorizeUrl(config, state));
  });

  app.get('/api/v1/auth/streamelements/callback', async (request, reply) => {
    const admin = await requireAdmin(context.prisma, request);
    const query = z.object({ code: z.string().optional(), state: z.string().optional(), error: z.string().optional() }).parse(request.query);
    if (query.error) throw new HttpError(400, 'StreamElements authorization was declined.', 'STREAMELEMENTS_OAUTH_DECLINED');
    if (!query.code || !query.state || readSignedCookie(request, 'nw_se_state') !== query.state) {
      throw new HttpError(400, 'Invalid StreamElements OAuth state.', 'INVALID_STREAMELEMENTS_STATE');
    }
    const token = await exchangeStreamElementsCode(streamElementsOAuthConfig(), query.code);
    await saveOAuthStreamElementsConnection(context.prisma, token, admin.id);
    const returnTo = safeReturnTo(readSignedCookie(request, 'nw_se_return') ?? undefined);
    reply.clearCookie('nw_se_state', { path: '/api/v1/auth/streamelements' });
    reply.clearCookie('nw_se_return', { path: '/api/v1/auth/streamelements' });
    return reply.redirect(`${returnTo}${returnTo.includes('?') ? '&' : '?'}streamelements=connected`);
  });

  app.post('/api/v1/integrations/streamelements/import-legacy', async request => {
    const admin = await requireAdmin(context.prisma, request);
    return { data: await importLegacyStreamElementsConnection(context.prisma, admin.id), requestId: request.id };
  });

  app.post('/api/v1/integrations/streamelements/connections/:id/select', async request => {
    const admin = await requireAdmin(context.prisma, request);
    const id = decodeURIComponent(String((request.params as { id: string }).id));
    return { data: await selectStreamElementsConnection(context.prisma, id, admin.id), requestId: request.id };
  });

  app.post('/api/v1/integrations/streamelements/connections/:id/verify', async request => {
    const admin = await requireAdmin(context.prisma, request);
    const id = decodeURIComponent(String((request.params as { id: string }).id));
    return { data: await verifyStreamElementsConnection(context.prisma, id, admin.id), requestId: request.id };
  });

  app.post('/api/v1/integrations/streamelements/connections/:id/settings', async request => {
    const admin = await requireAdmin(context.prisma, request);
    const id = decodeURIComponent(String((request.params as { id: string }).id));
    const body = z.object({ pointsEnabled: z.boolean() }).parse(request.body);
    return { data: await updateStreamElementsConnectionSettings(context.prisma, id, admin.id, body.pointsEnabled), requestId: request.id };
  });

  app.delete('/api/v1/integrations/streamelements/connections/:id', async request => {
    const admin = await requireAdmin(context.prisma, request);
    const id = decodeURIComponent(String((request.params as { id: string }).id));
    await removeStreamElementsConnection(context.prisma, id, admin.id);
    return { data: { removed: true }, requestId: request.id };
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
        requiredScopes: twitchEventSubScopes,
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
