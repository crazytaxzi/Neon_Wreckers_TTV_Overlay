import crypto from 'node:crypto';
import type { Prisma, PrismaClient } from '@prisma/client';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { env, cookieSecure } from '../env.js';
import { acquireTransactionLock } from '../lib/database.js';
import { HttpError } from '../lib/errors.js';
import type { AuthenticatedUser, AuthenticatedUserWithPlayer } from '../types.js';


export function readSignedCookie(request: FastifyRequest, name: string): string | null {
  const value = request.cookies[name];
  if (!value) return null;
  const result = request.unsignCookie(value);
  return result.valid ? result.value : null;
}

export function sessionTokenHash(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function createSession(prisma: PrismaClient, userId: string) {
  const raw = crypto.randomBytes(32).toString('base64url');
  const tokenHash = sessionTokenHash(raw);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await prisma.session.create({ data: { userId, tokenHash, expiresAt } });
  return { raw, expiresAt };
}

export function setSessionCookie(reply: FastifyReply, raw: string, expiresAt: Date) {
  reply.setCookie(env.SESSION_COOKIE_NAME, raw, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: cookieSecure,
    expires: expiresAt,
    signed: true
  });
}

export async function getUserFromRequest(prisma: PrismaClient, request: FastifyRequest): Promise<AuthenticatedUser | null> {
  const token = readSignedCookie(request, env.SESSION_COOKIE_NAME);
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { tokenHash: sessionTokenHash(token) },
    include: { user: { include: { player: true } } }
  });
  if (!session || session.revokedAt || session.expiresAt < new Date()) return null;
  return session.user;
}

export async function requireUser(prisma: PrismaClient, request: FastifyRequest): Promise<AuthenticatedUserWithPlayer> {
  const user = await getUserFromRequest(prisma, request);
  if (!user || !user.player) throw new HttpError(401, 'Sign in required.', 'AUTH_REQUIRED');
  if (user.player.bannedUntil && user.player.bannedUntil > new Date()) {
    throw new HttpError(403, 'Player is suspended.', 'PLAYER_SUSPENDED');
  }
  return user as AuthenticatedUserWithPlayer;
}

export async function requireAdmin(prisma: PrismaClient, request: FastifyRequest) {
  const user = await requireUser(prisma, request);
  if (!user.roles.includes('admin') && !user.roles.includes('streamer')) {
    throw new HttpError(403, 'Streamer/admin access required.', 'ADMIN_REQUIRED');
  }
  return user;
}

export async function upsertPlayerForTwitch(
  prisma: PrismaClient,
  userInfo: { id: string; login: string; display_name: string; profile_image_url?: string; email?: string }
) {
  const roles: Array<'player' | 'streamer' | 'admin'> = userInfo.id === env.STREAMER_TWITCH_ID
    ? ['player', 'streamer', 'admin']
    : ['player'];
  const user = await prisma.user.upsert({
    where: { twitchUserId: userInfo.id },
    update: {
      twitchLogin: userInfo.login,
      displayName: userInfo.display_name,
      avatarUrl: userInfo.profile_image_url,
      email: userInfo.email,
      roles
    },
    create: {
      twitchUserId: userInfo.id,
      twitchLogin: userInfo.login,
      displayName: userInfo.display_name,
      avatarUrl: userInfo.profile_image_url,
      email: userInfo.email,
      roles
    }
  });

  return prisma.$transaction(async (transaction: Prisma.TransactionClient) => {
    await acquireTransactionLock(transaction, `user:${user.id}:onboarding`);
    const player = await transaction.player.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id }
    });
    if (await transaction.ship.count({ where: { playerId: player.id } }) === 0) {
      await transaction.ship.create({
        data: {
          playerId: player.id,
          name: 'Rustlight Tug',
          classSlug: 'starter-salvage-tug',
          condition: 100,
          fuel: 4,
          cargoCapacity: 24,
          upgrades: [],
          visualKey: 'ship-rustlight-tug'
        }
      });
    }
    if (await transaction.crewMember.count({ where: { playerId: player.id } }) === 0) {
      await transaction.crewMember.createMany({
        data: [
          { playerId: player.id, name: 'Kira Volts', role: 'pilot', level: 1, morale: 82, traits: ['steady hands'] },
          { playerId: player.id, name: 'Moss Bracket', role: 'cutter', level: 1, morale: 76, traits: ['fast torch'] },
          { playerId: player.id, name: 'Doc Spindle', role: 'medic', level: 1, morale: 73, traits: ['field triage'] }
        ]
      });
    }
    return transaction.user.findUniqueOrThrow({
      where: { id: user.id },
      include: { player: true }
    });
  });
}
