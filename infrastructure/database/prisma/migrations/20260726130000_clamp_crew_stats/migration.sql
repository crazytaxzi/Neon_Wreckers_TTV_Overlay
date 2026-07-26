UPDATE "CrewMember"
SET "fatigue" = LEAST(100, GREATEST(0, "fatigue")),
    "morale" = LEAST(100, GREATEST(0, "morale"));

ALTER TABLE "CrewMember"
  ADD CONSTRAINT "CrewMember_fatigue_range" CHECK ("fatigue" BETWEEN 0 AND 100),
  ADD CONSTRAINT "CrewMember_morale_range" CHECK ("morale" BETWEEN 0 AND 100);
