import crypto from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { buildTwitchAuthorizeUrl, exchangeTwitchCode, fetchTwitchUser } from '@neon-wreckers/integrations';
import { cookieSecure, env, twitchScopes } from '../env.js';
import { HttpError } from '../lib/errors.js';
import type { ApiContext } from '../types.js';
import {
  createSession,
  readSignedCookie,
  requireUser,
  sessionTokenHash,
  setSessionCookie,
  upsertPlayerForTwitch
} from '../services/auth.js';
import { publicMe } from '../services/station.js';
import { saveTwitchCredential } from '../services/twitch-credentials.js';

export async function registerAuthRoutes(app: FastifyInstance, context: ApiContext) {
  app.get('/api/v1/auth/twitch/start', async (_request, reply) => {
    if (!env.TWITCH_CLIENT_ID || !env.TWITCH_CLIENT_SECRET || !env.TWITCH_REDIRECT_URI) {
      throw new HttpError(503, 'Twitch credentials are not configured.', 'TWITCH_NOT_CONFIGURED');
    }
    const state = crypto.randomBytes(18).toString('base64url');
    reply.setCookie('nw_twitch_state', state, {
      path: '/api/v1/auth/twitch',
      httpOnly: true,
      sameSite: 'lax',
      secure: cookieSecure,
      maxAge: 600,
      signed: true
    });
    const config = {
      clientId: env.TWITCH_CLIENT_ID,
      clientSecret: env.TWITCH_CLIENT_SECRET,
      redirectUri: env.TWITCH_REDIRECT_URI,
      scopes: twitchScopes
    };
    return reply.redirect(buildTwitchAuthorizeUrl(config, state));
  });

  app.get('/api/v1/auth/twitch/callback', async (request, reply) => {
    const query = z.object({ code: z.string(), state: z.string() }).parse(request.query);
    if (readSignedCookie(request, 'nw_twitch_state') !== query.state) {
      throw new HttpError(400, 'Invalid Twitch state.', 'INVALID_TWITCH_STATE');
    }
    if (!env.TWITCH_REDIRECT_URI) throw new HttpError(503, 'Twitch credentials are not configured.', 'TWITCH_NOT_CONFIGURED');
    const config = {
      clientId: env.TWITCH_CLIENT_ID,
      clientSecret: env.TWITCH_CLIENT_SECRET,
      redirectUri: env.TWITCH_REDIRECT_URI,
      scopes: twitchScopes
    };
    const token = await exchangeTwitchCode(config, query.code);
    const twitchUser = await fetchTwitchUser(env.TWITCH_CLIENT_ID, token.access_token);
    const user = await upsertPlayerForTwitch(context.prisma, twitchUser);
    if (twitchUser.id === env.STREAMER_TWITCH_ID) await saveTwitchCredential(context.prisma, user.id, token);
    const session = await createSession(context.prisma, user.id);
    setSessionCookie(reply, session.raw, session.expiresAt);
    reply.clearCookie('nw_twitch_state', { path: '/api/v1/auth/twitch' });
    return reply.redirect(`${env.PUBLIC_WEB_URL}/?signedIn=1`);
  });

  app.post('/api/v1/auth/logout', async (request, reply) => {
    const token = readSignedCookie(request, env.SESSION_COOKIE_NAME);
    if (token) {
      await context.prisma.session.updateMany({
        where: { tokenHash: sessionTokenHash(token) },
        data: { revokedAt: new Date() }
      });
    }
    reply.clearCookie(env.SESSION_COOKIE_NAME, { path: '/' });
    return { data: { ok: true }, requestId: request.id };
  });

  app.get('/api/v1/me', async request => {
    const user = await requireUser(context.prisma, request);
    return { data: await publicMe(context.prisma, user.id), requestId: request.id };
  });
}
