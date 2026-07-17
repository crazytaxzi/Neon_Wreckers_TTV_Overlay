CREATE TABLE "AuctionListing" (
  "id" TEXT NOT NULL,
  "sellerId" TEXT NOT NULL,
  "buyerId" TEXT,
  "itemSlug" TEXT NOT NULL,
  "itemName" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "priceCredits" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'active',
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "soldAt" TIMESTAMP(3),
  CONSTRAINT "AuctionListing_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AuctionListing_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AuctionListing_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "AuctionListing_status_expiresAt_createdAt_idx" ON "AuctionListing"("status", "expiresAt", "createdAt");
CREATE INDEX "AuctionListing_sellerId_status_idx" ON "AuctionListing"("sellerId", "status");
