import type { FastifyInstance } from 'fastify';
import { env } from '../env.js';
import type { ApiContext } from '../types.js';
import { requireAdmin, requireUser } from '../services/auth.js';
import { createTwitchEventSubSubscription, fetchTwitchAppToken, refreshTwitchToken } from '@neon-wreckers/integrations';
import { decryptCredential, saveTwitchCredential } from '../services/twitch-credentials.js';

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
    return { data: { configured: Boolean(env.TWITCH_CLIENT_ID && env.TWITCH_CLIENT_SECRET && env.STREAMER_TWITCH_ID), authorized: Boolean(user?.twitchCredential), expiresAt: user?.twitchCredential?.expiresAt ?? null, scopes: user?.twitchCredential?.scopes ?? [] }, requestId: request.id };
  });

  app.post('/api/v1/integrations/twitch/subscribe', async request => {
    await requireAdmin(context.prisma, request);
    const broadcaster = await context.prisma.user.findUnique({ where: { twitchUserId: env.STREAMER_TWITCH_ID }, include: { twitchCredential: true } });
    if (!broadcaster?.twitchCredential) throw new Error('The streamer must sign in again to grant Twitch event scopes.');
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
    return { data: results.map((result, index) => result.status === 'fulfilled' ? { type: definitions[index].type, ok: true, response: result.value } : { type: definitions[index].type, ok: false, error: result.reason instanceof Error ? result.reason.message : String(result.reason) }), requestId: request.id };
  });
}
