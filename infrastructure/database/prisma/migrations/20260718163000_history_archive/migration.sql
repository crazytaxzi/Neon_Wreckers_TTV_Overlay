ALTER TABLE "HistoryEntry"
ADD COLUMN "details" JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX "HistoryEntry_category_createdAt_idx"
ON "HistoryEntry"("category", "createdAt");
