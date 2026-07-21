import type { CurrentUser, GameData } from './model.js';

const at = (offsetMinutes: number) => new Date(Date.now() + offsetMinutes * 60_000).toISOString();

const me: CurrentUser = {
  id: 'visual-wrecker',
  displayName: 'WRECKER_77',
  avatarUrl: null,
  roles: ['player'],
  player: { level: 47, title: 'Scrap Baron', career: 'salvager', credits: 8450 }
};

const previewGame: GameData = {
  me,
  station: {
    id: 'station-zero',
    slug: 'station-zero',
    name: 'Neon Prime Hub',
    level: 4,
    population: 1248,
    populationStatus: { capacity: 1800, trend: 12, reasons: ['Habitat pressure stable.', 'Power production supports current population.'] },
    power: 78,
    morale: 86,
    integrity: 92,
    storageCapacity: 2000,
    storageUsed: 1274,
    threatLevel: 'elevated',
    activeSeason: 'Station Zero',
    resources: { scrap: 112600, electronics: 868, alloys: 560, fuel: 728 },
    museum: { collection: [{ itemSlug: 'unknown-relic', name: 'Unknown Relic', quantity: 18 }], donatedToday: 4, dailyCapacity: 12 },
    alerts: [{ id: 'alert-1', severity: 'warning', title: 'Reactor fluctuation', body: 'Grid output is stable but under observation.', createdAt: at(-20) }],
    activeModifiers: [],
    modules: [
      { slug: 'command-pod', name: 'Command Core', description: 'Coordinates station operations.', maxLevel: 4, prerequisites: [], level: 4, state: 'active', progress: 100, integrity: 100, visualKey: 'station.modules.command-pod', effects: {}, perLevelEffects: {}, nextLevelRequirements: null, project: null, plaques: [] },
      { slug: 'refinery', name: 'Refinery Complex', description: 'Processes recovered wreckage.', maxLevel: 4, prerequisites: [], level: 3, state: 'upgrading', progress: 64, integrity: 93, visualKey: 'station.modules.refinery', effects: { salvageYieldBonus: 0.12 }, perLevelEffects: {}, nextLevelRequirements: { scrap: 250, electronics: 40, alloys: 20 }, project: { id: 'project-refinery', kind: 'upgrade', targetLevel: 4, requirements: { scrap: 250, electronics: 40, alloys: 20 }, contributed: { scrap: 160, electronics: 24, alloys: 12 } }, plaques: [] },
      { slug: 'habitat-ring', name: 'Habitat Ring', description: 'Shelters the station population.', maxLevel: 4, prerequisites: [], level: 3, state: 'active', progress: 100, integrity: 88, visualKey: 'station.modules.habitat-ring', effects: {}, perLevelEffects: {}, nextLevelRequirements: { scrap: 300, alloys: 30 }, project: null, plaques: [] },
      { slug: 'medical-bay', name: 'Medical Bay', description: 'Keeps the community operational.', maxLevel: 4, prerequisites: [], level: 2, state: 'active', progress: 100, integrity: 96, visualKey: 'station.modules.medical-bay', effects: {}, perLevelEffects: {}, nextLevelRequirements: { scrap: 140, electronics: 18 }, project: null, plaques: [] },
      { slug: 'marketplace', name: 'Void Exchange', description: 'Operates station commerce.', maxLevel: 4, prerequisites: [], level: 3, state: 'active', progress: 100, integrity: 100, visualKey: 'station.modules.marketplace', effects: {}, perLevelEffects: {}, nextLevelRequirements: { scrap: 200, electronics: 35 }, project: null, plaques: [] },
      { slug: 'shipyard', name: 'Shipyard', description: 'Repairs and upgrades the fleet.', maxLevel: 4, prerequisites: [], level: 3, state: 'active', progress: 100, integrity: 91, visualKey: 'station.modules.shipyard', effects: {}, perLevelEffects: {}, nextLevelRequirements: { scrap: 230, alloys: 45 }, project: null, plaques: [] }
    ]
  },
  wreck: {
    id: 'wreck-dread-frigate', archetype: 'orpheus-barge', name: 'Dread Frigate', description: 'A capital-class hull tumbling through the salvage lane with unstable reactor telemetry.', risk: 'extreme', integrity: 23, depleted: false, visualKey: 'wreck.orpheus-barge', remainingLootBudget: 12480, createdAt: at(-30), updatedAt: at(-2),
    salvageProfile: {
      cutters: { successChance: 0.76, scrapRange: [90, 180], electronicsChance: 0.42, fuelChance: 0.18, relicChance: 0.03, wreckLootRolls: 2, wreckLootChancePerRoll: 0.36, wreckLootPool: [{ slug: 'plasma-cutter', name: 'Plasma Cutter', rarity: 'rare' }, { slug: 'reactor-core', name: 'Reactor Core', rarity: 'epic' }] },
      cargo: { successChance: 0.68, scrapRange: [45, 110], electronicsChance: 0.26, fuelChance: 0.34, relicChance: 0.07, wreckLootRolls: 3, wreckLootChancePerRoll: 0.44, wreckLootPool: [{ slug: 'ai-nav-unit', name: 'AI Nav Unit', rarity: 'legendary' }, { slug: 'encryption-core', name: 'Encryption Core', rarity: 'epic' }] }
    }
  },
  inventory: [
    { id: 'i1', itemSlug: 'scrap', name: 'Scrap', quantity: 112600, rarity: 'common', visualKey: 'item.scrap', updatedAt: at(-1) },
    { id: 'i2', itemSlug: 'electronics', name: 'Electronics', quantity: 868, rarity: 'uncommon', visualKey: 'item.electronics', updatedAt: at(-1) },
    { id: 'i3', itemSlug: 'alloys', name: 'Alloys', quantity: 560, rarity: 'rare', visualKey: 'item.alloys', updatedAt: at(-1) },
    { id: 'i4', itemSlug: 'fuel', name: 'Fuel Cells', quantity: 728, rarity: 'uncommon', visualKey: 'item.fuel', updatedAt: at(-1) },
    { id: 'i5', itemSlug: 'hull-plate', name: 'Hull Plates', quantity: 42, rarity: 'uncommon', visualKey: 'item.hull-plate', updatedAt: at(-1) },
    { id: 'i6', itemSlug: 'sealant-foam', name: 'Sealant Foam', quantity: 31, rarity: 'rare', visualKey: 'item.sealant-foam', updatedAt: at(-1) },
    { id: 'i7', itemSlug: 'reactor-coolant', name: 'Reactor Coolant', quantity: 18, rarity: 'epic', visualKey: 'item.reactor-coolant', updatedAt: at(-1) },
    { id: 'i8', itemSlug: 'unknown-relic', name: 'Unknown Relic', quantity: 8, rarity: 'legendary', visualKey: 'item.unknown-relic', updatedAt: at(-1) }
  ],
  ships: [
    { id: 'ship-1', name: 'Titan Interceptor', classSlug: 'salvage-skiff', condition: 78, fuel: 42, cargoCapacity: 64, upgrades: ['reinforced-cutters'], ownedSkins: ['salvage-skiff-reclaimer'], activeSkin: 'salvage-skiff-reclaimer', visualKey: 'ship.salvage-skiff-reclaimer', createdAt: at(-4000) },
    { id: 'ship-2', name: 'Void Lantern', classSlug: 'cargo-hauler', condition: 94, fuel: 81, cargoCapacity: 120, upgrades: ['expanded-hold'], ownedSkins: ['cargo-hauler-leviathan'], activeSkin: 'cargo-hauler-leviathan', visualKey: 'ship.cargo-hauler-leviathan', createdAt: at(-3000) }
  ],
  crew: [
    { id: 'crew-1', name: 'KAL-7', role: 'Engineer', level: 18, jobStars: 4, talentStars: 3, morale: 91, injuredUntil: null, traits: ['Refinery bonus', 'Rapid repair'] },
    { id: 'crew-2', name: 'NOVA-9', role: 'Production', level: 16, jobStars: 4, talentStars: 2, morale: 86, injuredUntil: null, traits: ['Cargo specialist'] },
    { id: 'crew-3', name: 'RIGGS', role: 'Builder', level: 14, jobStars: 3, talentStars: 3, morale: 78, injuredUntil: null, traits: ['Hull speed'] },
    { id: 'crew-4', name: 'FLINT', role: 'Logistics', level: 12, jobStars: 3, talentStars: 2, morale: 82, injuredUntil: null, traits: ['Fuel economy'] }
  ],
  history: [
    { id: 'h1', category: 'construction', title: 'Station upgrade complete', body: 'Refinery Complex reached level 3.', actorDisplayName: 'WRECKER_77', details: { operation: 'upgrade' }, createdAt: at(-15) },
    { id: 'h2', category: 'market', title: 'Auction won', body: 'Reactor Core secured from the Void Exchange.', actorDisplayName: 'WRECKER_77', details: { operation: 'auction' }, createdAt: at(-45) },
    { id: 'h3', category: 'salvage', title: 'Breach detected', body: 'Dread Frigate entered the salvage bay.', actorDisplayName: null, details: { wreckName: 'Dread Frigate' }, createdAt: at(-65) }
  ],
  expeditions: [{ id: 'exp-1', definition: 'dead-relay-ping', shipId: 'ship-1', crewIds: ['crew-1', 'crew-2'], name: 'Dead Relay Ping', status: 'active', risk: 'high', launchedAt: at(-90), resolvesAt: at(157), rewards: [], incidentLog: ['Signal lock acquired.'], createdAt: at(-90), updatedAt: at(-1) }],
  expeditionDefinitions: [{ slug: 'dead-relay-ping', name: 'Dead Relay Ping', description: 'Recover encrypted telemetry from a silent relay.', risk: 'high', fuelCost: 12, minCrew: 2, durationMinutes: [180, 240], lootRolls: 4, successChance: 0.72, rewardQuantity: [2, 6], baseRewards: { success: 'Research Data', failure: 'Scrap' }, lootPool: [{ slug: 'quantum-key', name: 'Quantum Key', rarity: 'legendary', chancePerRoll: 0.04 }] }],
  notifications: [
    { id: 'n1', type: 'danger', priority: 10, title: 'Reactor breach detected', body: 'Dread Frigate hazard profile escalated to extreme.', deepLink: 'salvage', readAt: null, expiresAt: null, createdAt: at(-16) },
    { id: 'n2', type: 'market', priority: 5, title: 'Market update', body: 'Void Lance Mk. II asking price moved sharply.', deepLink: 'market', readAt: null, expiresAt: null, createdAt: at(-60) },
    { id: 'n3', type: 'construction', priority: 4, title: 'New blueprint available', body: 'Titan armor frame has entered station production.', deepLink: 'crafting', readAt: null, expiresAt: null, createdAt: at(-180) }
  ],
  marketplace: {
    unlocked: true,
    listings: [
      { slug: 'void-lance', name: 'Void Lance Mk. II', priceCredits: 5750, itemSlug: 'electronics', quantity: 12 },
      { slug: 'reactor-core', name: 'Reactor Core', priceCredits: 12480, itemSlug: 'reactor-coolant', quantity: 4 },
      { slug: 'hull-kit', name: 'Titan Armor Frame', priceCredits: 6400, itemSlug: 'hull-plate', quantity: 8 }
    ],
    ships: {
      purchases: [{ slug: 'cargo-hauler', name: 'Cargo Hauler', credits: 18000, cargoCapacity: 120, fuel: 80 }],
      upgrades: [{ slug: 'expanded-hold', name: 'Expanded Hold', description: 'Adds cargo capacity.', credits: 2800, alloys: 8, cargoBonus: 20 }],
      skins: [{ slug: 'salvage-skiff-reclaimer', classSlug: 'salvage-skiff', name: 'Reclaimer Frame', description: 'Industrial salvage frame.', credits: 4200, lootRollBonus: 1 }],
      skinCooldownSeconds: 2592000,
      repair: { creditsPerCondition: 8, alloysPerTwentyCondition: 1 },
      crewPerShip: 4,
      renameCredits: 100
    }
  },
  catalog: [
    { slug: 'scrap', name: 'Scrap', rarity: 'common', valueCredits: 1, vendorSellCredits: 1, sellable: true, description: 'Raw recovered metal.', uses: ['Construction'], recipes: [], sources: ['Salvage'] },
    { slug: 'electronics', name: 'Electronics', rarity: 'uncommon', valueCredits: 12, vendorSellCredits: 8, sellable: true, description: 'Recovered circuitry.', uses: ['Crafting'], recipes: [], sources: ['Salvage'] },
    { slug: 'alloys', name: 'Alloys', rarity: 'rare', valueCredits: 30, vendorSellCredits: 20, sellable: true, description: 'Refined structural alloy.', uses: ['Ship upgrades'], recipes: [], sources: ['Refinery'] },
    { slug: 'fuel', name: 'Fuel Cell', rarity: 'uncommon', valueCredits: 18, vendorSellCredits: 12, sellable: true, description: 'Portable reactor fuel.', uses: ['Expeditions'], recipes: ['fuel-cell'], sources: ['Crafting'] },
    { slug: 'hull-plate', name: 'Hull Plate', rarity: 'uncommon', valueCredits: 45, vendorSellCredits: 30, sellable: true, description: 'Armored hull section.', uses: ['Station repair'], recipes: ['hull-plate'], sources: ['Crafting'] },
    { slug: 'reactor-coolant', name: 'Reactor Coolant', rarity: 'epic', valueCredits: 180, vendorSellCredits: 120, sellable: true, description: 'Cryogenic grid coolant.', uses: ['Power repair'], recipes: ['reactor-coolant'], sources: ['Expeditions'] },
    { slug: 'unknown-relic', name: 'Unknown Relic', rarity: 'legendary', valueCredits: 1200, vendorSellCredits: 800, sellable: true, description: 'Unclassified alien technology.', uses: ['Museum'], recipes: [], sources: ['Rare salvage'] }
  ],
  auctions: [
    { id: 'a1', itemSlug: 'electronics', itemName: 'Void Lance Mk. II', quantity: 1, priceCredits: 5750, sellerName: 'NovaHaul', ownListing: false, cancellationFee: 0, expiresAt: at(82) },
    { id: 'a2', itemSlug: 'hull-plate', itemName: 'Refinery Complex Kit', quantity: 1, priceCredits: 2800, sellerName: 'RustQueen', ownListing: false, cancellationFee: 0, expiresAt: at(258) },
    { id: 'a3', itemSlug: 'reactor-coolant', itemName: 'Voidbreaker Frame', quantity: 1, priceCredits: 6400, sellerName: 'WRECKER_77', ownListing: true, cancellationFee: 128, expiresAt: at(176) }
  ],
  recipes: [{ slug: 'fuel-cell', name: 'Fuel Cell Batch', baseDurationSeconds: 90, durationSeconds: 72, inputValue: 120, outputValue: 180, valueAdded: 60, efficiency: 1.5, inputs: { scrap: 20, electronics: 2 }, outputs: { fuel: 5 }, stationModule: 'refinery', unlocked: true }],
  cooldowns: [],
  quarters: { playerId: me.id, layout: { theme: 'station-zero-default', objects: [{ key: 'console', x: 1, y: 1 }, { key: 'trophy-case', x: 5, y: 2 }] } },
  login: () => undefined,
  action: async () => undefined,
  refresh: async () => undefined
};

export function useVisualGameData(): GameData {
  return previewGame;
}
