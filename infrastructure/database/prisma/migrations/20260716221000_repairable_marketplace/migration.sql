UPDATE "StationModule"
SET "state" = 'damaged', "integrity" = LEAST("integrity", 35), "progress" = 0
WHERE "slug" = 'marketplace' AND "state" = 'locked';
