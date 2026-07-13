BEGIN;

CREATE TYPE "Role" AS ENUM ('player', 'streamer', 'admin');
CREATE TYPE "Career" AS ENUM ('salvager', 'hauler', 'engineer', 'builder', 'explorer', 'trader');
CREATE TYPE "ModuleState" AS ENUM ('locked', 'building', 'active', 'damaged', 'disabled', 'upgrading', 'seasonal');
CREATE TYPE "WreckRisk" AS ENUM ('low', 'moderate', 'high', 'extreme');
CREATE TYPE "ExpeditionStatus" AS ENUM ('available', 'active', 'resolved', 'claimed', 'failed');
CREATE TYPE "TxStatus" AS ENUM ('pending', 'committed', 'refunded', 'ambiguous', 'failed');
CREATE TYPE "ContentLifecycle" AS ENUM ('draft', 'scheduled', 'active', 'retired', 'archived');

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "twitchUserId" TEXT NOT NULL,
  "twitchLogin" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "avatarUrl" TEXT,
  "email" TEXT,
  "roles" "Role"[] NOT NULL DEFAULT ARRAY['player']::"Role"[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Player" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "credits" INTEGER NOT NULL DEFAULT 1240,
  "xp" INTEGER NOT NULL DEFAULT 0,
  "level" INTEGER NOT NULL DEFAULT 1,
  "reputation" INTEGER NOT NULL DEFAULT 0,
  "career" "Career" NOT NULL DEFAULT 'salvager',
  "title" TEXT NOT NULL DEFAULT 'Cutter Pilot',
  "inventoryCapacity" INTEGER NOT NULL DEFAULT 80,
  "bannedUntil" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Session" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Station" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "level" INTEGER NOT NULL DEFAULT 1,
  "population" INTEGER NOT NULL DEFAULT 0,
  "power" INTEGER NOT NULL DEFAULT 100,
  "morale" INTEGER NOT NULL DEFAULT 60,
  "integrity" INTEGER NOT NULL DEFAULT 100,
  "storageCapacity" INTEGER NOT NULL DEFAULT 1000,
  "storageUsed" INTEGER NOT NULL DEFAULT 0,
  "threatLevel" INTEGER NOT NULL DEFAULT 1,
  "activeSeason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Station_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StationResource" (
  "id" TEXT NOT NULL,
  "stationId" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "amount" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "StationResource_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StationModule" (
  "id" TEXT NOT NULL,
  "stationId" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "level" INTEGER NOT NULL DEFAULT 0,
  "state" "ModuleState" NOT NULL DEFAULT 'locked',
  "progress" INTEGER NOT NULL DEFAULT 0,
  "integrity" INTEGER NOT NULL DEFAULT 100,
  "visualKey" TEXT NOT NULL,
  "effects" JSONB NOT NULL DEFAULT '{}',
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StationModule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Plaque" (
  "id" TEXT NOT NULL,
  "moduleId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "playerName" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Plaque_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StationAlert" (
  "id" TEXT NOT NULL,
  "stationId" TEXT NOT NULL,
  "severity" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StationAlert_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Wreck" (
  "id" TEXT NOT NULL,
  "stationId" TEXT NOT NULL,
  "archetype" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "risk" "WreckRisk" NOT NULL,
  "integrity" INTEGER NOT NULL,
  "depleted" BOOLEAN NOT NULL DEFAULT false,
  "visualKey" TEXT NOT NULL,
  "remainingLootBudget" INTEGER NOT NULL,
  "discoveredBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Wreck_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InventoryStack" (
  "id" TEXT NOT NULL,
  "playerId" TEXT NOT NULL,
  "itemSlug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "rarity" TEXT NOT NULL,
  "visualKey" TEXT NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InventoryStack_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Ship" (
  "id" TEXT NOT NULL,
  "playerId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "classSlug" TEXT NOT NULL,
  "condition" INTEGER NOT NULL DEFAULT 100,
  "fuel" INTEGER NOT NULL DEFAULT 4,
  "cargoCapacity" INTEGER NOT NULL DEFAULT 24,
  "upgrades" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "visualKey" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Ship_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CrewMember" (
  "id" TEXT NOT NULL,
  "playerId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "level" INTEGER NOT NULL DEFAULT 1,
  "morale" INTEGER NOT NULL DEFAULT 75,
  "injuredUntil" TIMESTAMP(3),
  "traits" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  CONSTRAINT "CrewMember_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Expedition" (
  "id" TEXT NOT NULL,
  "playerId" TEXT NOT NULL,
  "definition" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "status" "ExpeditionStatus" NOT NULL,
  "risk" "WreckRisk" NOT NULL,
  "launchedAt" TIMESTAMP(3),
  "resolvesAt" TIMESTAMP(3),
  "rewards" JSONB NOT NULL DEFAULT '[]',
  "incidentLog" JSONB NOT NULL DEFAULT '[]',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Expedition_pkey" PRIMARY KEY ("id")
);


CREATE TABLE "HistoryEntry" (
  "id" TEXT NOT NULL,
  "stationId" TEXT NOT NULL,
  "playerId" TEXT,
  "category" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "actorDisplayName" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HistoryEntry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Notification" (
  "id" TEXT NOT NULL,
  "playerId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "priority" INTEGER NOT NULL DEFAULT 0,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "deepLink" TEXT,
  "readAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);


CREATE TABLE "LoyaltyTransaction" (
  "id" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "playerId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "broadcasterId" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "actionSlug" TEXT NOT NULL,
  "status" "TxStatus" NOT NULL,
  "externalReference" TEXT,
  "requestJson" JSONB NOT NULL DEFAULT '{}',
  "responseJson" JSONB NOT NULL DEFAULT '{}',
  "error" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LoyaltyTransaction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ContentVersion" (
  "id" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "slug" TEXT NOT NULL,
  "lifecycle" "ContentLifecycle" NOT NULL,
  "contentJson" JSONB NOT NULL,
  "validation" JSONB NOT NULL DEFAULT '{}',
  "publishedAt" TIMESTAMP(3),
  "scheduledAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ContentVersion_pkey" PRIMARY KEY ("id")
);


CREATE TABLE "AuditLog" (
  "id" TEXT NOT NULL,
  "actorId" TEXT,
  "action" TEXT NOT NULL,
  "target" TEXT NOT NULL,
  "before" JSONB,
  "after" JSONB,
  "ip" TEXT,
  "requestId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);


CREATE UNIQUE INDEX "User_twitchUserId_key" ON "User"("twitchUserId");
CREATE UNIQUE INDEX "Player_userId_key" ON "Player"("userId");
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");
CREATE UNIQUE INDEX "Station_slug_key" ON "Station"("slug");
CREATE UNIQUE INDEX "StationResource_stationId_slug_key" ON "StationResource"("stationId", "slug");
CREATE UNIQUE INDEX "StationModule_stationId_slug_key" ON "StationModule"("stationId", "slug");
CREATE UNIQUE INDEX "InventoryStack_playerId_itemSlug_key" ON "InventoryStack"("playerId", "itemSlug");
CREATE UNIQUE INDEX "LoyaltyTransaction_idempotencyKey_key" ON "LoyaltyTransaction"("idempotencyKey");
CREATE UNIQUE INDEX "ContentVersion_slug_version_key" ON "ContentVersion"("slug", "version");
CREATE INDEX "Session_userId_expiresAt_idx" ON "Session"("userId", "expiresAt");
CREATE INDEX "Plaque_moduleId_createdAt_idx" ON "Plaque"("moduleId", "createdAt");
CREATE INDEX "StationAlert_stationId_createdAt_idx" ON "StationAlert"("stationId", "createdAt");
CREATE INDEX "Wreck_stationId_depleted_createdAt_idx" ON "Wreck"("stationId", "depleted", "createdAt");
CREATE INDEX "Ship_playerId_createdAt_idx" ON "Ship"("playerId", "createdAt");
CREATE INDEX "CrewMember_playerId_idx" ON "CrewMember"("playerId");
CREATE INDEX "Expedition_playerId_createdAt_idx" ON "Expedition"("playerId", "createdAt");
CREATE INDEX "Expedition_status_resolvesAt_idx" ON "Expedition"("status", "resolvesAt");
CREATE INDEX "HistoryEntry_stationId_createdAt_idx" ON "HistoryEntry"("stationId", "createdAt");
CREATE INDEX "HistoryEntry_playerId_createdAt_idx" ON "HistoryEntry"("playerId", "createdAt");
CREATE INDEX "Notification_playerId_createdAt_idx" ON "Notification"("playerId", "createdAt");
CREATE INDEX "LoyaltyTransaction_userId_createdAt_idx" ON "LoyaltyTransaction"("userId", "createdAt");
CREATE INDEX "LoyaltyTransaction_status_createdAt_idx" ON "LoyaltyTransaction"("status", "createdAt");
CREATE INDEX "ContentVersion_lifecycle_scheduledAt_idx" ON "ContentVersion"("lifecycle", "scheduledAt");
CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt");
CREATE INDEX "AuditLog_target_createdAt_idx" ON "AuditLog"("target", "createdAt");

ALTER TABLE "Player" ADD CONSTRAINT "Player_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StationResource" ADD CONSTRAINT "StationResource_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StationModule" ADD CONSTRAINT "StationModule_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Plaque" ADD CONSTRAINT "Plaque_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "StationModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StationAlert" ADD CONSTRAINT "StationAlert_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Wreck" ADD CONSTRAINT "Wreck_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InventoryStack" ADD CONSTRAINT "InventoryStack_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Ship" ADD CONSTRAINT "Ship_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CrewMember" ADD CONSTRAINT "CrewMember_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Expedition" ADD CONSTRAINT "Expedition_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HistoryEntry" ADD CONSTRAINT "HistoryEntry_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HistoryEntry" ADD CONSTRAINT "HistoryEntry_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LoyaltyTransaction" ADD CONSTRAINT "LoyaltyTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContentVersion" ADD CONSTRAINT "ContentVersion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT;
