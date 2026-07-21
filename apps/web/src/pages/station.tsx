import { useEffect, useRef, useState, type CSSProperties } from 'react';
import {
  Badge,
  Button,
  Card,
  ConfirmWindow,
  Field,
  HealthBar,
  InventoryCard,
  Meter,
  ModuleCard,
  Notification,
  NWIcon,
  Panel,
  PopulationDisplay,
  ProgressBar,
  ResponsiveGrid,
  SectionTitle,
  Select,
  SplitLayout,
  StatusDisplay,
  ToggleSwitch,
  Tooltip
} from '@neon-wreckers/ui';
import { GameArtwork } from '../components/GameArtwork.js';
import type { GameData, Station, Wreck } from '../model.js';
import { CommandAction, formatCountdown, cooldownRemaining, HistoryList, toneForValue, riskTone, moduleIcon, moduleEffectDescription, itemIcon } from '../page-utils.js';

export function GuidePage() {
  const steps = [
    ['1. Salvage', 'Scan a wreck, then deploy cutters or cargo teams. Cargo mode rolls more wreck-specific materials; Research Skiffs yield Research Data, while freighters carry food and coolant supplies.'],
    ['2. Build', 'Contribute recovered scrap, electronics, alloys, and research data to shared station modules.'],
    ['3. Keep Zero alive', 'Repair the hull, fuel the reactor, and run food or medical drives. Power and integrity directly affect resident retention.'],
    ['4. Trade', 'Buy fixed station stock or list your own items in the 48-hour player Auction House. Compare every item’s guide value first.'],
    ['5. Expeditions', 'Glass Belt Runs return ice, water, algae, food, polymer, and biofiber. Dead Relay Pings return Research Data, electronics, lenses, charts, conduits, relays, and rare Quantum Keys.']
  ];
  return <div className="page-stack"><SectionTitle eyebrow="WRECKER ORIENTATION" title="How to Play" description="A quick path from first scan to a thriving player-run station." icon="data" /><Notification title="Hover for details" tone="info">Buttons, prices, status readouts, and item cards include contextual help. Timers count down beside actions that are busy.</Notification><ResponsiveGrid min="19rem">{steps.map(([title, body]) => <Card key={title}><span className="nw-eyebrow">FIELD MANUAL</span><h3>{title}</h3><p>{body}</p></Card>)}</ResponsiveGrid><Panel><SectionTitle eyebrow="COMMUNITY OBJECTIVE" title="Why population matters" icon="population" /><p>Residents are Station Zero’s workforce and survival score. A larger population supports future station capacity and shows that the community is keeping habitats safe. Residents arrive after food drives, clinics, good morale, and habitat construction; they leave when power, hull integrity, or morale becomes dangerous. The Station page names the current causes and gives every player actions to change them.</p></Panel></div>;
}

export function StationPage({ station, wreck, inventory, history, cooldowns, action }: GameData) {
  const scrap = inventory.find(item => item.itemSlug === 'scrap')?.quantity ?? 0;
  return (
    <div className="page-stack">
      <SectionTitle eyebrow="ORBITAL COMMAND" title={station?.name ?? 'Station Zero'} description="Live station condition, active wreck telemetry, inventory readiness, and permanent community history." icon="station" />
      <ResponsiveGrid min="13rem" className="status-rack">
        <Tooltip content={(station?.populationStatus?.reasons ?? ['Population reacts to power, hull safety, morale, food, and medical support.']).join(' ')}><div><PopulationDisplay current={station?.population ?? 0} capacity={station?.populationStatus?.capacity} trend={station?.populationStatus?.trend ?? 0} /></div></Tooltip>
        <StatusDisplay label="Power Reserve" value={station?.power ?? 0} unit="%" icon="power" tone={toneForValue(station?.power)} detail="Grid synchronized" />
        <StatusDisplay label="Hull Integrity" value={station?.integrity ?? 0} unit="%" icon="integrity" tone={toneForValue(station?.integrity)} detail={(station?.integrity ?? 0) < 50 ? 'Repair priority' : 'Pressure stable'} />
        <StatusDisplay label="Construction Stock" value={scrap} unit=" scrap" icon="resources" tone="info" detail="Personal hold" />
      </ResponsiveGrid>
      <StationMaintenance station={station} inventory={inventory} cooldowns={cooldowns} action={action} />
      <SplitLayout ratio="minmax(0, 1.55fr) minmax(20rem, .85fr)">
        <StationSchematic station={station} />
        <div className="side-stack">
          <WreckPanel wreck={wreck} />
          <Panel>
            <SectionTitle eyebrow="PERSONAL HOLD" title="Ready Materials" icon="inventory" />
            <div className="compact-inventory">
              {inventory.slice(0, 4).map(item => <InventoryCard key={item.itemSlug} name={item.name} quantity={item.quantity} rarity={item.rarity} icon={itemIcon(item.itemSlug)} />)}
            </div>
          </Panel>
        </div>
      </SplitLayout>
      <Panel>
        <SectionTitle eyebrow="PERMANENT RECORD" title="Station Feed" description="Recent events written by server-side game systems." icon="events" />
        <HistoryList history={history} />
      </Panel>
    </div>
  );
}

function StationMaintenance({ station, inventory, cooldowns, action }: Pick<GameData, 'station' | 'inventory' | 'cooldowns' | 'action'>) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, []);
  const run = async (key: string) => {
    await action('/api/v1/station/maintain', { action: key }, 'Community action complete');
  };
  const qty = (slug: string) => inventory.find(item => item.itemSlug === slug)?.quantity ?? 0;
  const options = [
    { key: 'repair-hull', title: 'Repair Main Station', cost: '2 Hull Plates + 3 Sealant Foam', reward: '+8 integrity', ready: qty('hull-plate') >= 2 && qty('sealant-foam') >= 3 },
    { key: 'fuel-reactor', title: 'Fuel Reactor Grid', cost: '2 Fuel Cells + 1 Reactor Coolant', reward: '+15 power', ready: qty('fuel') >= 2 && qty('reactor-coolant') >= 1 },
    { key: 'food-drive', title: 'Run Food Drive', cost: '10 Ration Packs + 5 Water Cartridges', reward: '+6 residents, +4 morale', ready: qty('ration-pack') >= 10 && qty('water-cartridge') >= 5 },
    { key: 'medical-clinic', title: 'Open Community Clinic', cost: '4 Medical Supplies', reward: '+3 residents, +6 morale', ready: qty('medical-supplies') >= 4 }
  ];
  return <Panel tone={(station?.integrity ?? 100) < 40 || (station?.power ?? 100) < 30 ? 'danger' : 'info'}><SectionTitle eyebrow="COMMUNITY OPERATIONS" title="Station Survival" description={(station?.populationStatus?.reasons ?? []).join(' ')} icon="population" /><ResponsiveGrid min="15rem">{options.map(option => { const remaining = cooldownRemaining(cooldowns, `station:${option.key}`, now); return <Tooltip key={option.key} content={`Cost: ${option.cost}. Effect: ${option.reward}. These resources are consumed for the whole community.`}><Card><h3>{option.title}</h3><p>{option.cost}</p><Badge tone="success">{option.reward}</Badge><Button fullWidth disabled={!option.ready || remaining > 0} onClick={() => void run(option.key)}>{remaining > 0 ? `Ready in ${formatCountdown(remaining)}` : option.ready ? 'Contribute now' : 'Materials needed'}</Button></Card></Tooltip>; })}</ResponsiveGrid></Panel>;
}

function StationSchematic({ station }: { station: Station | null }) {
  const modules = station?.modules ?? [];
  return (
    <Panel depth="medium" className="station-schematic">
      <div className="station-schematic__header"><Badge tone="info">TACTICAL SCHEMATIC</Badge><span className="nw-numeric">ORBIT // ZERO-01</span></div>
      <div className="station-orbit" aria-label="Station Zero operational schematic">
        <GameArtwork className="station-orbit__art" src="/station/station-zero.webp" alt="Station Zero modular orbital station" eager sizes="(max-width: 760px) 92vw, 46rem" />
        <div className="station-orbit__grid" />
        <div className="station-orbit__ring station-orbit__ring--outer" />
        <div className="station-orbit__ring station-orbit__ring--inner" />
        <div className="station-core"><NWIcon name="station" size={36} /><strong>ZERO</strong><small>COMMAND CORE</small></div>
        {modules.map((module, index) => {
          const angle = (360 / Math.max(modules.length, 1)) * index - 90;
          return <div key={module.slug} className={`station-node is-${module.state}`} style={{ '--node-angle': `${angle}deg`, '--node-radius': index % 2 ? '38%' : '45%' } as CSSProperties}><span><GameArtwork src={`/station/modules/${module.slug}.webp`} alt="" sizes="(max-width: 760px) 88px, 112px" /><b>{module.name}</b><i>{module.state}</i></span></div>;
        })}
      </div>
      <ResponsiveGrid min="10rem" className="station-schematic__footer">
        <Meter label="Reactor load" value={station?.power ?? 0} tone="purple" />
        <HealthBar label="Pressure hull" value={station?.integrity ?? 0} />
      </ResponsiveGrid>
    </Panel>
  );
}

function WreckPanel({ wreck }: { wreck: Wreck | null }) {
  const tone = riskTone(wreck?.risk);
  return (
    <Panel tone={tone} className="wreck-panel">
      <SectionTitle eyebrow="SALVAGE TARGET" title={wreck?.name ?? 'Scanning local debris field'} icon="wreck" action={<Badge tone={tone}>{wreck?.risk ?? 'unknown'}</Badge>} />
      <div className="wreck-scan">{wreck ? <GameArtwork src={`/wrecks/${wreck.archetype}.webp`} alt={`${wreck.name}, current salvage target`} eager sizes="(max-width: 760px) 88vw, 34rem" /> : <NWIcon name="wreck" size={70} />}<span /><span /><span /><strong className="nw-numeric">{wreck?.integrity ?? 0}% HULL</strong></div>
      <p>{wreck?.description ?? 'Awaiting server telemetry.'}</p>
      <HealthBar label="Remaining hull" value={wreck?.integrity ?? 0} />
      {wreck?.salvageProfile && <div className="side-stack">{(['cutters', 'cargo'] as const).map(mode => { const stats = wreck.salvageProfile[mode]; return <Card key={mode}><strong>{mode === 'cargo' ? 'Cargo team' : 'Cutters'} · {Math.round(stats.successChance * 100)}% success</strong><p>{stats.scrapRange[0]}–{stats.scrapRange[1]} scrap · {Math.round(stats.electronicsChance * 100)}% electronics · {Math.round(stats.fuelChance * 100)}% fuel · {(stats.relicChance * 100).toFixed(1)}% relic</p><small>{stats.wreckLootRolls} wreck-specific roll{stats.wreckLootRolls === 1 ? '' : 's'} at {Math.round(stats.wreckLootChancePerRoll * 100)}% each: {stats.wreckLootPool.map(item => item.name).join(', ')}</small></Card>; })}</div>}
    </Panel>
  );
}

export function SalvagePage({ wreck, cooldowns, action }: Pick<GameData, 'wreck' | 'cooldowns' | 'action'>) {
  const [confirmOverride, setConfirmOverride] = useState(false);
  const [autoSalvage, setAutoSalvage] = useState(false);
  const autoRunning = useRef(false);
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, []);
  const scanRemaining = cooldownRemaining(cooldowns, 'scan', now);
  const cuttersRemaining = cooldownRemaining(cooldowns, 'salvage:cutters', now);
  const cargoRemaining = cooldownRemaining(cooldowns, 'salvage:cargo', now);
  const overrideRemaining = cooldownRemaining(cooldowns, 'salvage:override', now);
  useEffect(() => {
    if (!autoSalvage || autoRunning.current) return;
    const next = wreck?.depleted
      ? scanRemaining <= 0 ? ['/api/v1/salvage/scan', undefined, 'Auto scan acquired'] as const : null
      : cargoRemaining <= 0
        ? ['/api/v1/salvage/deploy', { mode: 'cargo' }, 'Auto cargo recovered'] as const
        : cuttersRemaining <= 0 ? ['/api/v1/salvage/deploy', { mode: 'cutters' }, 'Auto cutters deployed'] as const : null;
    if (!next) return;
    autoRunning.current = true;
    void action(next[0], next[1], next[2]).finally(() => { autoRunning.current = false; });
  }, [action, autoSalvage, cargoRemaining, cuttersRemaining, now, scanRemaining, wreck?.depleted, wreck?.id]);
  return (
    <div className="page-stack">
      <SectionTitle eyebrow="WRECK OPERATIONS" title="Salvage Control" description="All rolls, costs, rewards, and damage remain authoritative on the server." icon="salvage" />
      <SplitLayout ratio="minmax(0, 1.35fr) minmax(20rem, .65fr)">
        <Panel depth="medium">
          <ToggleSwitch checked={autoSalvage} onChange={setAutoSalvage} label="Auto salvage" description="While this tab remains open, automatically deploy cargo teams and cutters, then scan for a new wreck when the current target is depleted." />
          <ResponsiveGrid min="15rem" className="action-matrix">
            <CommandAction icon="scanner" title="Active Scan" detail={scanRemaining > 0 ? `Ready in ${formatCountdown(scanRemaining)}` : 'Acquire and profile the next salvage opportunity.'} disabled={scanRemaining > 0} onClick={() => void action('/api/v1/salvage/scan', undefined, 'Signal acquired')} />
            <CommandAction icon="signal" title="Rush Scan" detail="Spend 75 StreamElements points to replace the current target immediately." onClick={() => void action('/api/v1/points/actions/rush_scan', undefined, 'Rush scan purchased', { 'Idempotency-Key': crypto.randomUUID() })} tone="purple" />
            <CommandAction icon="salvage" title="Deploy Cutters" detail={cuttersRemaining > 0 ? `Ready in ${formatCountdown(cuttersRemaining)}` : 'Execute the standard salvage profile.'} disabled={cuttersRemaining > 0} onClick={() => void action('/api/v1/salvage/deploy', { mode: 'cutters' }, 'Cutters deployed')} />
            <CommandAction icon="cargo" title="Recover Cargo" detail={cargoRemaining > 0 ? `Ready in ${formatCountdown(cargoRemaining)}` : 'Prioritize high-value internal cargo compartments.'} disabled={cargoRemaining > 0} onClick={() => void action('/api/v1/salvage/deploy', { mode: 'cargo' }, 'Cargo team launched')} tone="info" />
            <CommandAction icon="danger" title="Safety Override" detail={overrideRemaining > 0 ? `Ready in ${formatCountdown(overrideRemaining)}` : 'Engage the existing high-risk deployment mode.'} disabled={overrideRemaining > 0} onClick={() => setConfirmOverride(true)} tone="danger" />
          </ResponsiveGrid>
          <Notification title="Server authority active" tone="info" icon="network">The interface submits commands only. It does not calculate outcomes, rewards, cooldowns, or balance.</Notification>
        </Panel>
        <WreckPanel wreck={wreck} />
      </SplitLayout>
      <ConfirmWindow open={confirmOverride} onClose={() => setConfirmOverride(false)} onConfirm={() => { setConfirmOverride(false); void action('/api/v1/points/actions/safety_override', undefined, 'Override purchased', { 'Idempotency-Key': crypto.randomUUID() }); }} title="Purchase safety override?" confirmLabel="Spend 250 points" tone="danger"><p>This premium command charges StreamElements points before executing. Failed execution follows the server refund workflow.</p></ConfirmWindow>
    </div>
  );
}

export function ConstructionPage({ station, inventory, action }: Pick<GameData, 'station' | 'inventory' | 'action'>) {
  const modules = station?.modules ?? [];
  const defaultProject = modules.find(module => ['building', 'upgrading', 'damaged'].includes(module.state)) ?? modules.find(module => module.slug === 'habitat-ring');
  const [moduleSlug, setModuleSlug] = useState(defaultProject?.slug ?? 'habitat-ring');
  const activeProject = modules.find(module => module.slug === moduleSlug) ?? defaultProject;
  const canContribute = Boolean(activeProject && ['locked', 'building', 'upgrading', 'damaged'].includes(activeProject.state));
  return (
    <div className="page-stack">
      <SectionTitle eyebrow="STRUCTURAL OPERATIONS" title="Construction Yard" description="Community module state and contribution progress, using the existing construction endpoint." icon="construction" />
      <SplitLayout ratio="minmax(0, 1.4fr) minmax(18rem, .6fr)">
        <ResponsiveGrid min="17rem">{modules.map(module => { const needsRepair = ['damaged', 'disabled'].includes(module.state); const nextCost = module.nextLevelRequirements ? Object.entries(module.nextLevelRequirements).map(([slug, amount]) => `${amount} ${slug}`).join(' · ') : 'Maximum level'; return <ModuleCard key={module.slug} name={module.name} state={module.state} progress={needsRepair && !module.project ? module.integrity : module.progress ?? 0} progressLabel={needsRepair && !module.project ? 'Module integrity' : needsRepair ? 'Repair progress' : 'Module progress'} icon={moduleIcon(module.slug)} description={`${module.description} Current: ${moduleEffectDescription(module)} ${module.state === 'active' ? 'Benefit online.' : needsRepair ? 'Benefit offline until repaired.' : ''}`} stats={<span>Integrity <strong>{module.integrity}%</strong> · Level <strong>{module.level}/{module.maxLevel}</strong><br />Next upgrade: <strong>{nextCost}</strong></span>} action={needsRepair && !module.project ? <Button size="sm" variant="warning" fullWidth onClick={() => void action('/api/v1/construction/start', { moduleSlug: module.slug, kind: 'repair' }, `${module.name} repair started`)}>Start repair</Button> : undefined} />; })}</ResponsiveGrid>
        <Panel tone="info" className="project-console">
          <SectionTitle eyebrow="ACTIVE PROJECT" title={activeProject?.name ?? 'No project queued'} icon="construction" />
          <Field label="Construction target"><Select value={moduleSlug} onChange={event => setModuleSlug(event.target.value)}>{modules.map(module => <option key={module.slug} value={module.slug}>{module.name} · {module.state}</option>)}</Select></Field>
          <ProgressBar label="Build progress" value={activeProject?.progress ?? 0} tone="info" />
          {activeProject?.project && <div className="material-readout"><span>Project requirements</span><strong>{Object.entries(activeProject.project.requirements).map(([slug, amount]) => `${slug} ${activeProject.project?.contributed[slug] ?? 0}/${amount}`).join(' · ')}</strong></div>}
          <div className="material-readout"><span>Available hold</span><strong>{inventory.map(item => `${item.name} ${item.quantity}`).join(' · ') || 'No materials'}</strong></div>
          <Button variant="primary" fullWidth icon={<NWIcon name="resources" size={16} />} disabled={!canContribute} onClick={() => void action('/api/v1/construction/contribute', { moduleSlug: activeProject?.slug ?? 'habitat-ring', scrap: 10 }, 'Materials delivered')}>Contribute 10 Hull Scrap</Button>
          {activeProject?.state === 'active' && <Button variant="warning" fullWidth onClick={() => void action('/api/v1/construction/start', { moduleSlug: activeProject.slug, kind: 'upgrade' }, 'Module upgrade started')}>Start module upgrade</Button>}
          <Button variant="ghost" fullWidth disabled={!canContribute} onClick={() => void action('/api/v1/construction/contribute', { moduleSlug: activeProject?.slug, electronics: 1 }, 'Electronics delivered')}>Contribute 1 Electronics</Button>
          <Button variant="ghost" fullWidth disabled={!canContribute} onClick={() => void action('/api/v1/construction/contribute', { moduleSlug: activeProject?.slug, alloys: 1 }, 'Alloys delivered')}>Contribute 1 Alloy</Button>
          <Button variant="ghost" fullWidth disabled={!canContribute} onClick={() => void action('/api/v1/construction/contribute', { moduleSlug: activeProject?.slug, researchData: 1 }, 'Research data delivered')}>Contribute 1 Research Data</Button>
        </Panel>
      </SplitLayout>
    </div>
  );
}
