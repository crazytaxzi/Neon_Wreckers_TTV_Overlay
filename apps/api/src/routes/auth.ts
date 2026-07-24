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

function safeReturnPath(value: unknown) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) return null;
  return value;
}

export async function registerAuthRoutes(app: FastifyInstance, context: ApiContext) {
  app.get('/api/v1/auth/twitch/start', async (request, reply) => {
    if (!env.TWITCH_CLIENT_ID || !env.TWITCH_CLIENT_SECRET || !env.TWITCH_REDIRECT_URI) {
      throw new HttpError(503, 'Twitch credentials are not configured.', 'TWITCH_NOT_CONFIGURED');
    }
    const query = z.object({
      returnTo: z.string().optional(),
      forceVerify: z.enum(['1']).optional()
    }).parse(request.query);
    const state = crypto.randomBytes(18).toString('base64url');
    const cookieOptions = {
      path: '/api/v1/auth/twitch',
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: cookieSecure,
      maxAge: 600,
      signed: true
    };
    reply.setCookie('nw_twitch_state', state, cookieOptions);
    const returnTo = safeReturnPath(query.returnTo);
    if (returnTo) reply.setCookie('nw_twitch_return_to', returnTo, cookieOptions);
    const config = {
      clientId: env.TWITCH_CLIENT_ID,
      clientSecret: env.TWITCH_CLIENT_SECRET,
      redirectUri: env.TWITCH_REDIRECT_URI,
      scopes: twitchScopes
    };
    const authorizeUrl = new URL(buildTwitchAuthorizeUrl(config, state));
    if (query.forceVerify === '1') authorizeUrl.searchParams.set('force_verify', 'true');
    return reply.redirect(authorizeUrl.toString());
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
    const returnTo = safeReturnPath(readSignedCookie(request, 'nw_twitch_return_to')) ?? '/';
    reply.clearCookie('nw_twitch_state', { path: '/api/v1/auth/twitch' });
    reply.clearCookie('nw_twitch_return_to', { path: '/api/v1/auth/twitch' });
    const redirectUrl = new URL(returnTo, env.PUBLIC_WEB_URL);
    redirectUrl.searchParams.set('signedIn', '1');
    return reply.redirect(redirectUrl.toString());
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
