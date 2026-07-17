BEGIN;

ALTER TABLE "Player" ADD COLUMN "careerChosenAt" TIMESTAMP(3), ADD COLUMN "careerChangedAt" TIMESTAMP(3);
CREATE TABLE "TwitchCredential" (
  "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "accessTokenEncrypted" TEXT NOT NULL,
  "refreshTokenEncrypted" TEXT NOT NULL, "scopes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "expiresAt" TIMESTAMP(3) NOT NULL, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TwitchCredential_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "TwitchCredential" ADD CONSTRAINT "TwitchCredential_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE UNIQUE INDEX "TwitchCredential_userId_key" ON "TwitchCredential"("userId");
ALTER TABLE "Expedition" ADD COLUMN "shipId" TEXT, ADD COLUMN "crewIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Expedition" ADD CONSTRAINT "Expedition_shipId_fkey" FOREIGN KEY ("shipId") REFERENCES "Ship"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "Expedition_shipId_status_idx" ON "Expedition"("shipId", "status");

CREATE TABLE "ConstructionProject" (
  "id" TEXT NOT NULL, "moduleId" TEXT NOT NULL, "targetLevel" INTEGER NOT NULL,
  "kind" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'active', "requirements" JSONB NOT NULL,
  "contributed" JSONB NOT NULL DEFAULT '{}', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3), CONSTRAINT "ConstructionProject_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "ConstructionProject" ADD CONSTRAINT "ConstructionProject_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "StationModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "ConstructionProject_moduleId_status_idx" ON "ConstructionProject"("moduleId", "status");

CREATE TABLE "ActionCooldown" (
  "id" TEXT NOT NULL, "playerId" TEXT NOT NULL, "actionKey" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ActionCooldown_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "ActionCooldown" ADD CONSTRAINT "ActionCooldown_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE UNIQUE INDEX "ActionCooldown_playerId_actionKey_key" ON "ActionCooldown"("playerId", "actionKey");
CREATE INDEX "ActionCooldown_expiresAt_idx" ON "ActionCooldown"("expiresAt");

CREATE TABLE "ActionReceipt" (
  "id" TEXT NOT NULL, "idempotencyKey" TEXT NOT NULL, "playerId" TEXT, "action" TEXT NOT NULL,
  "responseJson" JSONB NOT NULL DEFAULT '{}', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ActionReceipt_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ActionReceipt_idempotencyKey_key" ON "ActionReceipt"("idempotencyKey");
CREATE INDEX "ActionReceipt_playerId_createdAt_idx" ON "ActionReceipt"("playerId", "createdAt");

CREATE TABLE "MarketTransaction" (
  "id" TEXT NOT NULL, "playerId" TEXT NOT NULL, "direction" TEXT NOT NULL, "itemSlug" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL, "credits" INTEGER NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MarketTransaction_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "MarketTransaction" ADD CONSTRAINT "MarketTransaction_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "MarketTransaction_playerId_createdAt_idx" ON "MarketTransaction"("playerId", "createdAt");

CREATE TABLE "QuartersLayout" (
  "id" TEXT NOT NULL, "playerId" TEXT NOT NULL, "theme" TEXT NOT NULL,
  "objects" JSONB NOT NULL DEFAULT '[]', "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "QuartersLayout_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "QuartersLayout" ADD CONSTRAINT "QuartersLayout_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE UNIQUE INDEX "QuartersLayout_playerId_key" ON "QuartersLayout"("playerId");

CREATE TABLE "MuseumExhibit" (
  "id" TEXT NOT NULL, "playerId" TEXT NOT NULL, "itemSlug" TEXT NOT NULL, "name" TEXT NOT NULL,
  "donatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "MuseumExhibit_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "MuseumExhibit" ADD CONSTRAINT "MuseumExhibit_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE UNIQUE INDEX "MuseumExhibit_playerId_itemSlug_key" ON "MuseumExhibit"("playerId", "itemSlug");
CREATE INDEX "MuseumExhibit_donatedAt_idx" ON "MuseumExhibit"("donatedAt");

CREATE TABLE "ExternalEvent" (
  "id" TEXT NOT NULL, "provider" TEXT NOT NULL, "externalId" TEXT NOT NULL, "type" TEXT NOT NULL,
  "actorId" TEXT, "payload" JSONB NOT NULL, "processedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "ExternalEvent_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ExternalEvent_provider_externalId_key" ON "ExternalEvent"("provider", "externalId");
CREATE INDEX "ExternalEvent_type_createdAt_idx" ON "ExternalEvent"("type", "createdAt");

CREATE TABLE "RuntimeEvent" (
  "id" TEXT NOT NULL, "slug" TEXT NOT NULL, "status" TEXT NOT NULL, "source" TEXT NOT NULL,
  "payload" JSONB NOT NULL DEFAULT '{}', "startsAt" TIMESTAMP(3) NOT NULL, "endsAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "RuntimeEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "RuntimeEvent_slug_status_idx" ON "RuntimeEvent"("slug", "status");
CREATE INDEX "RuntimeEvent_startsAt_endsAt_idx" ON "RuntimeEvent"("startsAt", "endsAt");

COMMIT;
