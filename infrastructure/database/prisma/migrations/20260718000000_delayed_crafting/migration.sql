CREATE TABLE "CraftingJob" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "recipeSlug" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "resolvesAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CraftingJob_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "CraftingJob_status_resolvesAt_idx" ON "CraftingJob"("status", "resolvesAt");
CREATE INDEX "CraftingJob_playerId_createdAt_idx" ON "CraftingJob"("playerId", "createdAt");
ALTER TABLE "CraftingJob" ADD CONSTRAINT "CraftingJob_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
