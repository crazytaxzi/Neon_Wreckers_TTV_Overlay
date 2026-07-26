UPDATE "Wreck"
SET "visualKey" = CASE "archetype"
  WHEN 'helios-courier' THEN 'wreck-helios-courier'
  WHEN 'orpheus-barge' THEN 'wreck-orpheus-barge'
  WHEN 'ashfall-cutter' THEN 'wreck-ashfall-cutter'
  WHEN 'morrowline-freighter' THEN 'wreck-morrowline-freighter'
  WHEN 'research-skiff' THEN 'wreck-research-skiff'
  WHEN 'kestrel-medical-frigate' THEN 'wreck-kestrel-medical-frigate'
  WHEN 'cinder-refinery-hulk' THEN 'wreck-cinder-refinery-hulk'
  WHEN 'pilgrim-habitat-ark' THEN 'wreck-pilgrim-habitat-ark'
  WHEN 'null-signal-probe' THEN 'wreck-null-signal-probe'
  WHEN 'atlas-fuel-tanker' THEN 'wreck-atlas-fuel-tanker'
  WHEN 'revenant-drone-carrier' THEN 'wreck-revenant-drone-carrier'
  WHEN 'frostline-cryo-tug' THEN 'wreck-frostline-cryo-tug'
  ELSE "visualKey"
END;
