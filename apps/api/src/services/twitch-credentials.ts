import crypto from 'node:crypto';
import type { PrismaClient } from '@prisma/client';
import { env } from '../env.js';

function key() {
  return crypto.createHash('sha256').update(env.CREDENTIAL_ENCRYPTION_KEY).digest();
}

export function encryptCredential(value: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return `${iv.toString('base64url')}.${cipher.getAuthTag().toString('base64url')}.${encrypted.toString('base64url')}`;
}

export function decryptCredential(value: string) {
  const [iv, tag, encrypted] = value.split('.');
  if (!iv || !tag || !encrypted) throw new Error('Encrypted credential is malformed.');
  const ivBytes = Buffer.from(iv, 'base64url');
  const tagBytes = Buffer.from(tag, 'base64url');
  const encryptedBytes = Buffer.from(encrypted, 'base64url');
  if (ivBytes.toString('base64url') !== iv || tagBytes.toString('base64url') !== tag || encryptedBytes.toString('base64url') !== encrypted) throw new Error('Encrypted credential is malformed.');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key(), ivBytes);
  decipher.setAuthTag(tagBytes);
  return Buffer.concat([decipher.update(encryptedBytes), decipher.final()]).toString('utf8');
}

export async function saveTwitchCredential(prisma: PrismaClient, userId: string, token: { access_token: string; refresh_token: string; expires_in: number; scope: string[] }) {
  return prisma.twitchCredential.upsert({
    where: { userId },
    create: { userId, accessTokenEncrypted: encryptCredential(token.access_token), refreshTokenEncrypted: encryptCredential(token.refresh_token), scopes: token.scope, expiresAt: new Date(Date.now() + token.expires_in * 1000) },
    update: { accessTokenEncrypted: encryptCredential(token.access_token), refreshTokenEncrypted: encryptCredential(token.refresh_token), scopes: token.scope, expiresAt: new Date(Date.now() + token.expires_in * 1000) }
  });
}
