import crypto from 'node:crypto';

export function createRng(seed = crypto.randomBytes(8).toString('hex')) {
  let h = 2166136261 >>> 0;
  for (const ch of String(seed)) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6D2B79F5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
export function nowIso(clock = () => new Date()) { return clock().toISOString(); }
export function newId(prefix='nw') { return `${prefix}_${crypto.randomUUID()}`; }

export function discoverWreck({ station, playerId, archetypes, seed }) {
  const rng = createRng(seed ?? `${station.id}:${Date.now()}`);
  if (!archetypes?.length) throw new GameRuleError('WRECK_CONFIG_EMPTY', 'No wreck archetypes are configured.');
  const archetype = weightedPick(archetypes, rng, a => riskWeight(a.risk, station.threatLevel));
  const integrity = intBetween(archetype.integrityRange[0], archetype.integrityRange[1], rng);
  const budget = intBetween(archetype.lootBudgetRange[0], archetype.lootBudgetRange[1], rng);
  return {
    id: newId('wreck'), archetype: archetype.slug, name: archetype.name, description: archetype.description,
    risk: archetype.risk, integrity, depleted:false, visualKey: archetype.visualKey, remainingLootBudget: budget, discoveredBy: playerId
  };
}

function riskWeight(risk, threat) {
  const base = { low: 5, moderate: 8, high: 3, extreme: 1 }[risk] ?? 1;
  if (risk === 'high') return base + threat;
  if (risk === 'extreme') return base + Math.floor(threat/2);
  return base;
}

function weightedPick(items, rng, weight) {
  const total = items.reduce((sum,item) => sum + Math.max(0, weight(item)), 0);
  let roll = rng() * total;
  for (const item of items) { roll -= weight(item); if (roll <= 0) return item; }
  return items[items.length - 1];
}
function intBetween(min, max, rng) { return Math.floor(min + rng() * (max - min + 1)); }

export function salvageWreck({ wreck, player, items, careerBonus = 0, rareDiscoveryBonus = 0, seed, mode = 'cutters', now = nowIso() }) {
  if (!wreck || wreck.depleted || wreck.integrity <= 4) throw new GameRuleError('WRECK_DEPLETED', 'The wreck is exhausted. Run another scan.');
  const rng = createRng(seed ?? `${wreck.id}:${player.id}:${mode}:${now}`);
  const riskFactor = { low:1, moderate:1.18, high:1.45, extreme:1.85 }[wreck.risk] ?? 1;
  const modeFactor = { cutters:1, cargo:1.55, override:2.6 }[mode] ?? 1;
  const integrityLoss = Math.ceil((4 + rng()*8) * riskFactor * (mode === 'override' ? 1.75 : 1));
  const successChance = clamp(0.86 - ({low:.02,moderate:.08,high:.17,extreme:.29}[wreck.risk] ?? .1) + careerBonus - (mode === 'cargo' ? .08 : 0) - (mode === 'override' ? .24 : 0), .08, .96);
  const success = rng() <= successChance;
  const rewards = [];
  let credits = 0;
  const stationDamage = { power: 0, integrity: 0 };

  if (success) {
    const scrap = Math.max(1, Math.floor((5 + rng()*13) * modeFactor));
    rewards.push(stack(requiredItem(items, 'scrap'), scrap));
    credits = Math.floor((22 + scrap * 4 + rng()*90) * modeFactor);
    if (rng() < .42 * modeFactor) rewards.push(stack(requiredItem(items, 'electronics'), Math.ceil(rng()*3*modeFactor)));
    if (mode === 'cargo' && rng() < .24) rewards.push(stack(requiredItem(items, 'alloys'), 1 + Math.floor(rng()*3)));
    if (rng() < .18 * modeFactor) rewards.push(stack(requiredItem(items, 'fuel'), 1 + Math.floor(rng()*2)));
    if (rng() < (.055 + rareDiscoveryBonus) * modeFactor) rewards.push(stack(requiredItem(items, 'unknown-relic'), 1));
    if (mode === 'override' && rng() < .15) rewards.push(stack(requiredItem(items, 'rubber-rat-mascot'), 1));
    const pool = wreckLootPool(wreck.archetype, mode);
    const bonusRolls = mode === 'cargo' ? 2 : mode === 'override' ? 3 : 1;
    for (let roll = 0; roll < bonusRolls; roll += 1) {
      if (rng() > (mode === 'cutters' ? .38 : .68)) continue;
      const itemSlug = pool[Math.floor(rng() * pool.length)];
      rewards.push(stack(requiredItem(items, itemSlug), 1 + Math.floor(rng() * (mode === 'cargo' ? 3 : 2))));
    }
  } else {
    credits = -Math.floor(35 + rng()*130*modeFactor);
    stationDamage.power = Math.ceil((2 + rng()*7) * riskFactor);
    stationDamage.integrity = Math.ceil((1 + rng()*4) * riskFactor);
  }

  let budgetRemaining = Math.max(0, wreck.remainingLootBudget);
  for (const reward of rewards) {
    reward.quantity = Math.min(reward.quantity, budgetRemaining);
    budgetRemaining -= reward.quantity;
  }
  for (let index = rewards.length - 1; index >= 0; index -= 1) {
    if (rewards[index].quantity <= 0) rewards.splice(index, 1);
  }

  const nextWreck = { ...wreck };
  nextWreck.integrity = clamp(wreck.integrity - integrityLoss, 0, 100);
  nextWreck.remainingLootBudget = budgetRemaining;
  nextWreck.depleted = nextWreck.integrity <= 4 || nextWreck.remainingLootBudget <= 0;
  return { success, mode, rewards, credits, stationDamage, integrityLoss, wreck: nextWreck };
}

function wreckLootPool(archetype, mode) {
  const pools = {
    'helios-courier': ['electronics', 'sensor-lens', 'copper-coil', 'navigation-chart', 'medical-supplies'],
    'orpheus-barge': ['ice-crystal', 'polymer', 'hull-plate', 'sealant-foam', 'copper-coil'],
    'ashfall-cutter': ['plasma-conduit', 'power-core', 'grid-relay', 'drone-chassis', 'hull-plate'],
    'morrowline-freighter': ['ration-pack', 'water-cartridge', 'nutrient-paste', 'algae-culture', 'medical-supplies', 'reactor-coolant'],
    'research-skiff': ['research-data', 'chemical-gel', 'biofiber', 'sensor-lens', 'quantum-key', 'plasma-conduit']
  };
  const pool = pools[archetype] ?? ['ice-crystal', 'polymer', 'algae-culture', 'research-data'];
  return mode === 'cargo' ? pool : pool.filter(slug => !['quantum-key', 'power-core', 'grid-relay'].includes(slug));
}

function requiredItem(items, slug) {
  const item = items?.[slug];
  if (!item) throw new GameRuleError('ITEM_CONFIG_MISSING', `Missing item definition: ${slug}.`);
  return item;
}

function stack(item, quantity) { return { itemSlug:item.slug, name:item.name, quantity, rarity:item.rarity, visualKey:item.visualKey }; }

export function contributeConstruction({ station, moduleSlug='habitat-ring', contribution, progressRules, actorDisplayName='A Wrecker', now = nowIso() }) {
  const module = station.modules.find(m => m.slug === moduleSlug);
  if (!module) throw new GameRuleError('MODULE_NOT_FOUND', `Unknown module ${moduleSlug}.`);
  if (!['building','upgrading','damaged'].includes(module.state)) throw new GameRuleError('MODULE_NOT_CONTRIBUTABLE', `${module.name} is not accepting construction resources.`);
  const scrap = contribution.scrap ?? 0;
  const electronics = contribution.electronics ?? 0;
  const alloys = contribution.alloys ?? 0;
  if (scrap < 0 || electronics < 0 || alloys < 0) throw new GameRuleError('BAD_CONTRIBUTION', 'Contribution cannot be negative.');
  const progressGain = clamp(
    Math.floor(scrap / progressRules.scrapUnitsPerProgress)
      + electronics * progressRules.electronicsProgress
      + alloys * progressRules.alloysProgress,
    0,
    30
  );
  if (progressGain <= 0) throw new GameRuleError('CONTRIBUTION_TOO_SMALL', 'No meaningful construction progress was produced.');
  const next = structuredClone(station);
  const nextModule = next.modules.find(m => m.slug === moduleSlug);
  nextModule.progress = clamp(nextModule.progress + progressGain, 0, 100);
  const completed = nextModule.progress >= 100;
  const history = [];
  if (completed) {
    nextModule.state = 'active';
    nextModule.level = Math.max(1, nextModule.level);
    if (moduleSlug === 'habitat-ring') next.population += 80;
    nextModule.plaques.push({ id:newId('plaque'), title:`${nextModule.name} entered service`, body:`Completed through community salvage. ${actorDisplayName} delivered the final load.`, playerDisplayName:actorDisplayName, createdAt:now });
    history.push({ category:'construction', title:`${nextModule.name} completed`, body:`Station Zero changed shape. ${nextModule.name} is now active.`, actorDisplayName, createdAt:now });
  } else {
    history.push({ category:'construction', title:`${nextModule.name} advanced`, body:`${actorDisplayName} moved construction to ${nextModule.progress}%.`, actorDisplayName, createdAt:now });
  }
  return { station: next, completed, progressGain, history };
}

export function launchExpedition({ player, ship, crew, expeditionDefinition, seed, now = nowIso() }) {
  if (!ship || ship.condition <= 0) throw new GameRuleError('SHIP_DISABLED','Your ship is in no shape to leave dock.');
  if (ship.fuel < expeditionDefinition.fuelCost) throw new GameRuleError('NO_FUEL','Not enough fuel cells.');
  if ((crew?.length ?? 0) < expeditionDefinition.minCrew) throw new GameRuleError('NO_CREW','Assign more crew first.');
  const rng = createRng(seed ?? `${player.id}:${ship.id}:${expeditionDefinition.slug}:${now}`);
  const durationMinutes = intBetween(expeditionDefinition.durationMinutes[0], expeditionDefinition.durationMinutes[1], rng);
  return {
    id: newId('expedition'), name: expeditionDefinition.name, status:'active', risk: expeditionDefinition.risk,
    launchedAt: now, resolvesAt: new Date(Date.parse(now) + durationMinutes*60_000).toISOString(),
    rewards: [], incidentLog: [`${ship.name} left Docking Ring traffic with ${crew.length} crew aboard.`],
    ship: { ...ship, fuel: ship.fuel - expeditionDefinition.fuelCost }
  };
}

export function resolveExpedition({ expedition, expeditionDefinition, items, seed, now = nowIso() }) {
  if (expedition.status !== 'active') throw new GameRuleError('EXPEDITION_NOT_ACTIVE','This expedition is not active.');
  if (Date.parse(now) < Date.parse(expedition.resolvesAt)) throw new GameRuleError('EXPEDITION_NOT_READY','Crew is still out past the local beacon line.');
  const rng = createRng(seed ?? `${expedition.id}:${now}`);
  const riskPenalty = { low:.03, moderate:.1, high:.2, extreme:.34 }[expedition.risk] ?? .1;
  const success = rng() > riskPenalty;
  const rewards = success
    ? [stack(requiredItem(items, 'scrap'), intBetween(10,28,rng)), stack(requiredItem(items, 'credits'), intBetween(90,280,rng))]
    : [stack(requiredItem(items, 'scrap'), intBetween(2,8,rng))];
  if (success && rng() < .16) rewards.push(stack(requiredItem(items, 'research-data'), 1));
  if (success) {
    for (let roll = 0; roll < expeditionDefinition.lootRolls; roll += 1) {
      const slug = expeditionDefinition.lootPool[Math.floor(rng() * expeditionDefinition.lootPool.length)];
      rewards.push(stack(requiredItem(items, slug), 1 + Math.floor(rng() * 3)));
    }
  }
  return { ...expedition, status: success ? 'resolved' : 'failed', rewards, incidentLog: [...expedition.incidentLog, success ? 'Crew returned with salvage and almost believable stories.' : 'Expedition limped home. Nobody is allowed to touch the navigation toaster again.'] };
}

export function applyInventoryStacks(existing, stacks) {
  const bySlug = new Map(existing.map(item => [item.itemSlug, { ...item }]));
  for (const stack of stacks) {
    const current = bySlug.get(stack.itemSlug);
    if (current) current.quantity += stack.quantity;
    else bySlug.set(stack.itemSlug, { ...stack });
  }
  return [...bySlug.values()].sort((a,b) => a.name.localeCompare(b.name));
}

export function enforceCooldown({ key, cooldowns, seconds, nowMs = Date.now() }) {
  const until = cooldowns.get(key) ?? 0;
  if (until > nowMs) throw new GameRuleError('COOLDOWN', `Action cooling down for ${Math.ceil((until - nowMs)/1000)} seconds.`);
  cooldowns.set(key, nowMs + seconds*1000);
}

export class GameRuleError extends Error {
  constructor(code, message) { super(message); this.name='GameRuleError'; this.code=code; }
}
