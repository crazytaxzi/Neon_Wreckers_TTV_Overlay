import type { PrismaClient } from '@prisma/client';
import type { Queue } from 'bullmq';
import type { LoyaltyProvider } from '@neon-wreckers/integrations';
import type { RealtimeHub } from './lib/realtime.js';

export type PlayerSummary = {
  id: string;
  bannedUntil: Date | null;
  career: string;
  credits: number;
  xp: number;
  level: number;
  reputation: number;
  title: string;
  inventoryCapacity: number;
};

export type AuthenticatedUser = {
  id: string;
  twitchUserId: string;
  twitchLogin: string;
  displayName: string;
  avatarUrl: string | null;
  email: string | null;
  roles: string[];
  player: PlayerSummary | null;
};

export type AuthenticatedUserWithPlayer = AuthenticatedUser & { player: PlayerSummary };

export type ApiContext = {
  prisma: PrismaClient;
  gameQueue: Queue;
  loyaltyProvider: LoyaltyProvider;
  cooldowns: Map<string, number>;
  realtime: RealtimeHub;
};
