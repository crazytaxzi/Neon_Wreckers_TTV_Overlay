DROP INDEX IF EXISTS "MuseumExhibit_playerId_itemSlug_key";

ALTER TABLE "MuseumExhibit"
ADD COLUMN "quantity" INTEGER NOT NULL DEFAULT 1;

CREATE INDEX "MuseumExhibit_playerId_itemSlug_idx"
ON "MuseumExhibit"("playerId", "itemSlug");
