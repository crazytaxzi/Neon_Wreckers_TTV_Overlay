import type { Prisma, PrismaClient } from '@prisma/client';
import {
  StreamElementsProvider,
  normalizeStreamElementsScopes,
  refreshStreamElementsToken,
  validateStreamElementsOAuthToken,
  type StreamElementsCredential,
  type StreamElementsIdentity,
  type StreamElementsTokenResponse
} from '@neon-wreckers/integrations';
import { env, streamElementsScopes } from '../env.js';
import { acquireTransactionLock } from '../lib/database.js';
import { decryptCredential, encryptCredential } from './twitch-credentials.js';

const connectionPrefix = 'integration.streamelements.connection.';
const settingsSlug = 'integration.streamelements.settings';

type StoredConnection = {
  channelId: string;
  provider: string;
  providerId: string | null;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  authType: 'jwt' | 'oauth2';
  accessTokenEncrypted: string;
  refreshTokenEncrypted: string | null;
  scopes: string[];
  expiresAt: string | null;
  pointsEnabled: boolean;
  lastVerifiedAt: string | null;
  lastError: string | null;
  createdById: string | null;
};

type StreamElementsSettings = {
  activeConnectionSlug: string | null;
};

function jsonClone(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function connectionSlug(channelId: string) {
  return `${connectionPrefix}${channelId.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}

async function writeVersion(
  prisma: PrismaClient,
  slug: string,
  contentJson: unknown,
  createdById: string | null,
  lifecycle: 'active' | 'retired' = 'active'
) {
  return prisma.$transaction(async transaction => {
    await acquireTransactionLock(transaction, `content-version:${slug}`);
    const latest = await transaction.contentVersion.findFirst({ where: { slug }, orderBy: { version: 'desc' } });
    return transaction.contentVersion.create({
      data: {
        slug,
        version: (latest?.version ?? 0) + 1,
        lifecycle,
        contentJson: jsonClone(contentJson),
        validation: { source: 'streamelements-control-center' },
        publishedAt: lifecycle === 'active' ? new Date() : null,
        createdById
      }
    });
  });
}

async function latestBySlug(prisma: PrismaClient, slug: string) {
  return prisma.contentVersion.findFirst({ where: { slug }, orderBy: { version: 'desc' } });
}

async function listStoredConnections(prisma: PrismaClient) {
  const versions = await prisma.contentVersion.findMany({
    where: { slug: { startsWith: connectionPrefix } },
    orderBy: [{ slug: 'asc' }, { version: 'desc' }]
  });
  const latest = new Map<string, typeof versions[number]>();
  for (const version of versions) if (!latest.has(version.slug)) latest.set(version.slug, version);
  return [...latest.values()]
    .filter(version => version.lifecycle !== 'retired')
    .map(version => ({ slug: version.slug, stored: version.contentJson as unknown as StoredConnection, updatedAt: version.createdAt }));
}

async function readSettings(prisma: PrismaClient): Promise<StreamElementsSettings> {
  const version = await latestBySlug(prisma, settingsSlug);
  if (!version || version.lifecycle === 'retired') return { activeConnectionSlug: null };
  const raw = version.contentJson as Record<string, unknown>;
  return { activeConnectionSlug: typeof raw.activeConnectionSlug === 'string' ? raw.activeConnectionSlug : null };
}

function oauthConfigured() {
  return Boolean(env.STREAMELEMENTS_CLIENT_ID && env.STREAMELEMENTS_CLIENT_SECRET && env.STREAMELEMENTS_REDIRECT_URI);
}

function oauthConfig() {
  if (!oauthConfigured() || !env.STREAMELEMENTS_REDIRECT_URI) {
    throw new Error('StreamElements OAuth client credentials are not configured.');
  }
  return {
    clientId: env.STREAMELEMENTS_CLIENT_ID,
    clientSecret: env.STREAMELEMENTS_CLIENT_SECRET,
    redirectUri: env.STREAMELEMENTS_REDIRECT_URI,
    scopes: streamElementsScopes
  };
}

function tokenExpiresAt(token: StreamElementsTokenResponse) {
  return new Date(Date.now() + Math.max(0, token.expires_in) * 1000);
}

function publicConnection(slug: string, stored: StoredConnection, activeConnectionSlug: string | null, updatedAt: Date) {
  return {
    id: slug,
    channelId: stored.channelId,
    provider: stored.provider,
    providerId: stored.providerId,
    username: stored.username,
    displayName: stored.displayName,
    avatarUrl: stored.avatarUrl,
    authType: stored.authType,
    scopes: stored.scopes,
    expiresAt: stored.expiresAt,
    isActive: slug === activeConnectionSlug,
    pointsEnabled: stored.pointsEnabled,
    lastVerifiedAt: stored.lastVerifiedAt,
    lastError: stored.lastError,
    updatedAt,
    matchesStreamer: stored.provider !== 'twitch' || stored.providerId === env.STREAMER_TWITCH_ID
  };
}

function storedCredential(stored: StoredConnection): StreamElementsCredential {
  return {
    apiBase: env.STREAMELEMENTS_API_BASE,
    token: decryptCredential(stored.accessTokenEncrypted),
    authType: stored.authType,
    channelId: stored.channelId,
    username: stored.username,
    displayName: stored.displayName,
    provider: stored.provider,
    providerId: stored.providerId,
    avatarUrl: stored.avatarUrl,
    scopes: stored.scopes,
    pointsEnabled: stored.pointsEnabled
  };
}

async function persistConnection(
  prisma: PrismaClient,
  input: {
    authType: 'jwt' | 'oauth2';
    accessToken: string;
    refreshToken?: string;
    expiresAt?: Date;
    scopes?: string[];
    identity: StreamElementsIdentity;
    createdById: string;
    pointsEnabled?: boolean;
  }
) {
  const slug = connectionSlug(input.identity.channelId);
  const existing = await latestBySlug(prisma, slug);
  const existingContent = existing?.contentJson as unknown as Partial<StoredConnection> | undefined;
  const stored: StoredConnection = {
    channelId: input.identity.channelId,
    provider: input.identity.provider,
    providerId: input.identity.providerId,
    username: input.identity.username,
    displayName: input.identity.displayName,
    avatarUrl: input.identity.avatarUrl,
    authType: input.authType,
    accessTokenEncrypted: encryptCredential(input.accessToken),
    refreshTokenEncrypted: input.refreshToken ? encryptCredential(input.refreshToken) : null,
    scopes: [...new Set(input.scopes ?? [])],
    expiresAt: input.expiresAt?.toISOString() ?? null,
    pointsEnabled: input.pointsEnabled ?? existingContent?.pointsEnabled ?? env.FEATURE_POINTS_ACTIONS === 'true',
    lastVerifiedAt: new Date().toISOString(),
    lastError: null,
    createdById: input.createdById
  };
  await writeVersion(prisma, slug, stored, input.createdById);
  await writeVersion(prisma, settingsSlug, { activeConnectionSlug: slug }, input.createdById);
  return publicConnection(slug, stored, slug, new Date());
}

async function refreshStoredIfNeeded(prisma: PrismaClient, slug: string, stored: StoredConnection) {
  const expiresAt = stored.expiresAt ? Date.parse(stored.expiresAt) : Number.POSITIVE_INFINITY;
  if (stored.authType !== 'oauth2' || expiresAt > Date.now() + 5 * 60_000) return stored;
  if (!stored.refreshTokenEncrypted) throw new Error('StreamElements OAuth refresh token is missing.');
  const token = await refreshStreamElementsToken(oauthConfig(), decryptCredential(stored.refreshTokenEncrypted));
  const refreshed: StoredConnection = {
    ...stored,
    accessTokenEncrypted: encryptCredential(token.access_token),
    refreshTokenEncrypted: token.refresh_token ? encryptCredential(token.refresh_token) : stored.refreshTokenEncrypted,
    scopes: normalizeStreamElementsScopes(token.scope),
    expiresAt: tokenExpiresAt(token).toISOString(),
    lastError: null
  };
  await writeVersion(prisma, slug, refreshed, stored.createdById);
  return refreshed;
}

export async function resolveStreamElementsCredential(prisma: PrismaClient): Promise<StreamElementsCredential | null> {
  const settings = await readSettings(prisma);
  if (settings.activeConnectionSlug) {
    const version = await latestBySlug(prisma, settings.activeConnectionSlug);
    if (version && version.lifecycle !== 'retired') {
      const stored = await refreshStoredIfNeeded(prisma, version.slug, version.contentJson as unknown as StoredConnection);
      return storedCredential(stored);
    }
  }
  if (env.STREAMELEMENTS_PROVIDER === 'streamelements' && env.STREAMELEMENTS_JWT && env.STREAMELEMENTS_CHANNEL_ID) {
    return {
      apiBase: env.STREAMELEMENTS_API_BASE,
      token: env.STREAMELEMENTS_JWT,
      authType: 'jwt',
      channelId: env.STREAMELEMENTS_CHANNEL_ID,
      username: 'legacy-env',
      displayName: 'Legacy environment token',
      provider: 'unknown',
      providerId: null,
      avatarUrl: null,
      scopes: [],
      pointsEnabled: env.FEATURE_POINTS_ACTIONS === 'true'
    };
  }
  return null;
}

export async function importLegacyStreamElementsConnection(prisma: PrismaClient, createdById: string) {
  if (!env.STREAMELEMENTS_JWT) throw new Error('No legacy STREAMELEMENTS_JWT is configured.');
  const provisional: StreamElementsCredential = {
    apiBase: env.STREAMELEMENTS_API_BASE,
    token: env.STREAMELEMENTS_JWT,
    authType: 'jwt',
    channelId: env.STREAMELEMENTS_CHANNEL_ID || 'pending',
    username: 'pending',
    displayName: 'Pending verification',
    provider: 'unknown',
    providerId: null,
    avatarUrl: null,
    scopes: ['owner:*'],
    pointsEnabled: env.FEATURE_POINTS_ACTIONS === 'true'
  };
  const identity = await new StreamElementsProvider(provisional).fetchIdentity();
  return persistConnection(prisma, {
    authType: 'jwt',
    accessToken: env.STREAMELEMENTS_JWT,
    scopes: ['owner:*'],
    identity,
    createdById,
    pointsEnabled: env.FEATURE_POINTS_ACTIONS === 'true'
  });
}

export async function saveOAuthStreamElementsConnection(prisma: PrismaClient, token: StreamElementsTokenResponse, createdById: string) {
  const validation = await validateStreamElementsOAuthToken(token.access_token);
  if (validation.clientId && validation.clientId !== env.STREAMELEMENTS_CLIENT_ID) throw new Error('StreamElements returned a token for a different OAuth client.');
  const scopes = [...new Set([...normalizeStreamElementsScopes(token.scope), ...validation.scopes])];
  const missingScopes = streamElementsScopes.filter(scope => !scopes.includes(scope));
  if (missingScopes.length) throw new Error(`StreamElements did not grant required scopes: ${missingScopes.join(', ')}`);
  const provisional: StreamElementsCredential = {
    apiBase: env.STREAMELEMENTS_API_BASE,
    token: token.access_token,
    authType: 'oauth2',
    channelId: 'pending',
    username: 'pending',
    displayName: 'Pending verification',
    provider: 'unknown',
    providerId: null,
    avatarUrl: null,
    scopes,
    pointsEnabled: env.FEATURE_POINTS_ACTIONS === 'true'
  };
  const identity = await new StreamElementsProvider(provisional).fetchIdentity();
  if (validation.channelId && validation.channelId !== identity.channelId) throw new Error('StreamElements token validation and channel identity did not match.');
  return persistConnection(prisma, {
    authType: 'oauth2',
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
    expiresAt: tokenExpiresAt(token),
    scopes,
    identity,
    createdById,
    pointsEnabled: env.FEATURE_POINTS_ACTIONS === 'true'
  });
}

export async function verifyStreamElementsConnection(prisma: PrismaClient, slug: string, actorId: string) {
  const version = await latestBySlug(prisma, slug);
  if (!version || version.lifecycle === 'retired') throw new Error('StreamElements connection was not found.');
  const stored = await refreshStoredIfNeeded(prisma, slug, version.contentJson as unknown as StoredConnection);
  try {
    const credential = storedCredential(stored);
    const validation = stored.authType === 'oauth2' ? await validateStreamElementsOAuthToken(credential.token) : null;
    if (validation?.clientId && validation.clientId !== env.STREAMELEMENTS_CLIENT_ID) throw new Error('StreamElements returned a token for a different OAuth client.');
    const missingScopes = stored.authType === 'oauth2' ? streamElementsScopes.filter(scope => !stored.scopes.includes(scope)) : [];
    if (missingScopes.length) throw new Error(`StreamElements connection is missing required scopes: ${missingScopes.join(', ')}`);
    const identity = await new StreamElementsProvider(credential).fetchIdentity();
    if (identity.channelId !== stored.channelId || (validation?.channelId && validation.channelId !== stored.channelId)) {
      throw new Error('StreamElements returned a different channel than the saved connection.');
    }
    const verified: StoredConnection = {
      ...stored,
      provider: identity.provider,
      providerId: identity.providerId,
      username: identity.username,
      displayName: identity.displayName,
      avatarUrl: identity.avatarUrl,
      lastVerifiedAt: new Date().toISOString(),
      lastError: null
    };
    const saved = await writeVersion(prisma, slug, verified, actorId);
    const settings = await readSettings(prisma);
    return publicConnection(slug, verified, settings.activeConnectionSlug, saved.createdAt);
  } catch (error) {
    const failed: StoredConnection = { ...stored, lastError: error instanceof Error ? error.message : String(error) };
    await writeVersion(prisma, slug, failed, actorId);
    throw error;
  }
}

export async function selectStreamElementsConnection(prisma: PrismaClient, slug: string, actorId: string) {
  const version = await latestBySlug(prisma, slug);
  if (!version || version.lifecycle === 'retired') throw new Error('StreamElements connection was not found.');
  const verified = await verifyStreamElementsConnection(prisma, slug, actorId);
  await writeVersion(prisma, settingsSlug, { activeConnectionSlug: slug }, actorId);
  return { ...verified, isActive: true };
}

export async function updateStreamElementsConnectionSettings(
  prisma: PrismaClient,
  slug: string,
  actorId: string,
  pointsEnabled: boolean
) {
  const version = await latestBySlug(prisma, slug);
  if (!version || version.lifecycle === 'retired') throw new Error('StreamElements connection was not found.');
  const stored = version.contentJson as unknown as StoredConnection;
  const updated = { ...stored, pointsEnabled };
  const saved = await writeVersion(prisma, slug, updated, actorId);
  const settings = await readSettings(prisma);
  return publicConnection(slug, updated, settings.activeConnectionSlug, saved.createdAt);
}

export async function removeStreamElementsConnection(prisma: PrismaClient, slug: string, actorId: string) {
  const version = await latestBySlug(prisma, slug);
  if (!version || version.lifecycle === 'retired') return;
  const stored = version.contentJson as unknown as StoredConnection;
  await writeVersion(prisma, slug, { ...stored, accessTokenEncrypted: '', refreshTokenEncrypted: null }, actorId, 'retired');
  const settings = await readSettings(prisma);
  if (settings.activeConnectionSlug === slug) await writeVersion(prisma, settingsSlug, { activeConnectionSlug: null }, actorId);
}

export async function streamElementsStatus(prisma: PrismaClient) {
  const [connections, settings] = await Promise.all([listStoredConnections(prisma), readSettings(prisma)]);
  let health: Awaited<ReturnType<StreamElementsProvider['health']>> = { ok: false, detail: 'No active StreamElements account is selected.' };
  try {
    const credential = await resolveStreamElementsCredential(prisma);
    if (credential) health = await new StreamElementsProvider(credential).health();
  } catch (error) {
    health = { ok: false, detail: error instanceof Error ? error.message : String(error) };
  }
  return {
    ...health,
    configured: connections.length > 0 || Boolean(env.STREAMELEMENTS_JWT),
    oauthConfigured: oauthConfigured(),
    oauthScopes: streamElementsScopes,
    legacyAvailable: Boolean(env.STREAMELEMENTS_JWT),
    pointsKillSwitchEnabled: env.FEATURE_POINTS_ACTIONS === 'true',
    activeConnectionId: settings.activeConnectionSlug,
    connections: connections.map(connection => publicConnection(connection.slug, connection.stored, settings.activeConnectionSlug, connection.updatedAt))
  };
}

export { oauthConfig as streamElementsOAuthConfig };
