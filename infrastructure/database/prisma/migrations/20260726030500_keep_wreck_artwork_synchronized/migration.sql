-- Keep every existing wreck aligned with the artwork for its actual archetype.
UPDATE "Wreck"
SET "visualKey" = 'wreck-' || "archetype"
WHERE "visualKey" <> 'wreck-' || "archetype";
