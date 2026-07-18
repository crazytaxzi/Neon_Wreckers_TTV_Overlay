# Economy and progression balance

This document records the July 2026 economy pass. Guide value measures an item's utility and replacement value. Fixed-vendor proceeds are normally about 55% of guide value; station shop prices are above guide value. That spread makes salvage and crafting useful without allowing risk-free shop arbitrage.

## Crafting economics

| Recipe | Input value | Output value | Value added | Base time |
|---|---:|---:|---:|---:|
| Refined Alloys | 40 | 50 | +25% | 20s |
| Fuel Cells | 265 | 325 | +23% | 30s |
| Reactor Coolant | 200 | 220 | +10% | 20s |
| Sealant Foam | 125 | 140 | +12% | 12s |
| Hull Plate | 120 | 140 | +17% | 25s |
| Water Cartridges | 20 | 24 | +20% | 10s |
| Ration Packs | 26 | 30 | +15% | 15s |
| Medical Supplies | 265 | 300 | +13% | 25s |
| Industrial Polymer | 12 | 15 | +25% | 12s |
| Chemical Gel | 185 | 190 | +3% | 20s |
| Biofiber | 75 | 85 | +13% | 18s |
| Nutrient Paste | 30 | 36 | +20% | 8s |
| Copper Coil | 61 | 70 | +15% | 20s |
| Plasma Conduit | 240 | 275 | +15% | 35s |
| Power Core | 665 | 760 | +14% | 45s |
| Sensor Lens | 100 | 115 | +15% | 25s |
| Navigation Chart | 535 | 610 | +14% | 35s |
| Drone Chassis | 625 | 700 | +12% | 55s |
| Grid Relay | 1,035 | 1,350 | +30% | 60s |

Refinery levels reduce applicable timers by 6% per level, capped at 40%. Recipe cards display live input value, output value, margin, and effective timer.

## Module progression

| Module | Per-level benefit | Maximum level |
|---|---|---:|
| Command Pod | +2.5 percentage points salvage success | 5 |
| Cargo Bay | +750 storage and +5% Cargo-mode material/credit yield | 5 |
| Refinery | 6% shorter Refinery crafting timers | 5 |
| Habitat Ring | +150 resident capacity | 4 |
| Medical Bay | 12% shorter injury recovery | 4 |
| Research Lab | +2.5 percentage points relic discovery | 4 |
| Museum | +10 daily artifact intake and +10% donation credits/XP | 4 |
| Marketplace | +3% fixed-vendor proceeds | 4 |
| Shipyard | 5% lower ship repair credit cost | 5 |

Upgrade projects cost the module's base construction load multiplied by the target level. The construction screen displays current effects, maximum level, and the complete next-level material requirement.

## Ship upgrades

| Upgrade | Total requirements | Permanent effect |
|---|---|---|
| Reinforced Hull | 600 credits + 8 alloys | 20% lower repair credit cost |
| Expanded Hold | 500 credits + 5 alloys | +8 cargo and +1 weighted loot roll on successful expeditions |
| Efficient Drive | 750 credits + 8 electronics | -1 expedition fuel, minimum cost 1 |

## Loot distribution

Expedition rolls are weighted by rarity rather than selecting every pool entry equally: common 100, uncommon 55, rare 22, epic 7, and legendary 2. Each successful roll yields 1–3 units. Mission success is 97% low, 90% moderate, 80% high, and 66% extreme before any future mission modifiers. The expedition dialog shows each item's exact normalized chance per roll.

Salvage retains distinct mode identities. Cutters are safer and run every 20 seconds. Cargo runs every 60 seconds, has a lower success chance, makes two wreck-specific rolls at 68% each, and has higher scrap, credit, electronics, fuel, and relic output. The live wreck card displays exact success, proc, relic, and wreck-pool statistics after player career and active module bonuses.

## Museum artifact sink

Unknown Relics and Quantum Keys are permanently consumed when donated. Unknown Relics have a base reward of 450 credits, 25 XP, 1 reputation, and +1 station morale. Quantum Keys have a base reward of 1,500 credits, 100 XP, 5 reputation, and +2 morale. Credits and XP gain 10% per Museum level. Daily community intake is 10 artifacts per Museum level, and the museum screen shows remaining intake plus lifetime collection totals.
