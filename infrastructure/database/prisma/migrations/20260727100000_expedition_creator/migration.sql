BEGIN;

ALTER TABLE "Expedition"
  ADD COLUMN "definitionSnapshot" JSONB NOT NULL DEFAULT '{}'::jsonb;

UPDATE "Expedition"
SET "definitionSnapshot" = jsonb_build_object('slug', "definition")
WHERE "definitionSnapshot" = '{}'::jsonb;

COMMIT;
