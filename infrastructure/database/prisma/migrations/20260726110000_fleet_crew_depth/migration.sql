ALTER TABLE "Ship"
  ADD COLUMN "masteryXp" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "masteryRank" INTEGER NOT NULL DEFAULT 0;

UPDATE "Ship"
SET "masteryRank" = LEAST(3, GREATEST(0, cardinality("upgrades") - 1)),
    "masteryXp" = CASE LEAST(3, GREATEST(0, cardinality("upgrades") - 1))
      WHEN 1 THEN 50
      WHEN 2 THEN 150
      WHEN 3 THEN 350
      ELSE 0
    END;

ALTER TABLE "CrewMember"
  ADD COLUMN "fatigue" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "specialty" TEXT NOT NULL DEFAULT 'generalist',
  ADD COLUMN "assignment" TEXT;

ALTER TABLE "Expedition"
  ADD COLUMN "route" TEXT NOT NULL DEFAULT 'balanced',
  ADD COLUMN "stage" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "stages" JSONB NOT NULL DEFAULT '[]';
