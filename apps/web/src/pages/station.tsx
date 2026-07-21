import { useEffect, useRef, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  ConfirmWindow,
  Field,
  HealthBar,
  ModuleCard,
  Notification,
  NWIcon,
  Panel,
  ProgressBar,
  ResponsiveGrid,
  SectionTitle,
  Select,
  SplitLayout,
  ToggleSwitch,
  Tooltip
} from '@neon-wreckers/ui';
import { GameArtwork } from '../components/GameArtwork.js';
import type { GameData, Wreck } from '../model.js';
import { CommandAction, formatCountdown, cooldownRemaining, toneForValue, riskTone, moduleIcon, moduleEffectDescription, itemIcon } from '../page-utils.js';

export function GuidePage() {
  const steps = [
    ['1. Salvage', 'Scan a wreck, then deploy cutters or cargo teams. Cargo mode rolls more wreck-specific materials; Research Skiffs yield Research Data, while freighters carry food and coolant supplies.'],
    ['2. Build', 'Contribute recovered scrap, electronics, alloys, and research data to shared station modules.'],
    ['3. Keep Zero alive', 'Repair the hull, fuel the reactor, and run food or medical drives. Power and integrity directly affect resident retention.'],
    ['4. Trade', 'Buy fixed station stock or list your own items in the 48-hour player Auction House. Compare every item’s guide value first.'],
    ['5. Expeditions', 'Glass Belt Runs return ice, water, algae, food, polymer, and biofiber. Dead Relay Pings return Research Data, electronics, lenses, charts, conduits, relays, and rare Quantum Keys.']
  ];
  return <div className="page-stack concept-standard-page"><SectionTitle eyebrow="WRECKER ORIENTATION" title="How to Play" description="A quick path from first scan to a thriving player-run station." icon="data" /><Notification title="Command tooltips active" tone="info">Buttons, prices, status readouts, and item cards include contextual help. Timers count down beside actions that are busy.</Notification><ResponsiveGrid min="19rem">{steps.map(([title, body]) => <Card key={title} className="field-manual-card"><span className="nw-eyebrow">FIELD MANUAL</span><h3>{title}</h3><p>{body}</p></Card>)}</ResponsiveGrid><Panel><SectionTitle eyebrow="COMMUNITY OBJECTIVE" title="Why population matters" icon="population" /><p>Residents are Station Zero’s workforce and survival score. A larger population supports future station capacity and shows that the community is keeping habitats safe. Residents arrive after food drives, clinics, good morale, and habitat construction; they leave when power, hull integrity, or morale becomes dangerous.</p></Panel></div>;
}

function inventoryQuantity(game: Pick<GameData, 'inventory'>, slug: string) {
  return game.inventory.find(item => item.itemSlug === slug)?.quantity ?? 0;
}

export function StationPage({ station, wreck, inventory, history, cooldowns, action, ships, expeditions, notifications, me, onNavigate }: GameData & { onNavigate: (destination: string) => void }) {
  const activeExpedition = expeditions.find(expedition => expedition.status === 'active') ?? expeditions[0] ?? null;
  const activeShip = ships.find(ship => ship.id === activeExpedition?.shipId) ?? ships[0] ?? null;
  const unreadNotifications = notifications.filter(notification => !notification.readAt);
  const stationName = station?.name ?? 'Station Zero';
  const resources = [
    { slug: 'scrap', label: 'Scrap', icon: 'resources' as const, tone: 'success' as const },
    { slug: 'electronics', label: 'Electronics', icon: 'data' as const, tone: 'info' as const },
    { slug: 'alloys', label: 'Alloys', icon: 'integrity' as const, tone: 'purple' as const },
    { slug: 'fuel', label: 'Fuel', icon: 'fuel' as const, tone: 'warning' as const }
  ];
  const quickActions = [
    { id: 'salvage', label: 'Scan Wreck', detail: 'Acquire salvage target', icon: 'scanner' as const, tone: 'success' },
    { id: 'construction', label: 'Build Station', detail: 'Modules and repairs', icon: 'construction' as const, tone: 'purple' },
    { id: 'crew', label: 'Manage Crew', detail: 'Assignments and training', icon: 'crew' as const, tone: 'purple' },
    { id: 'ships', label: 'Fleet Registry', detail: 'Repair and upgrade ships', icon: 'expedition' as const, tone: 'info' },
    { id: 'crafting', label: 'Craft Items', detail: 'Refinery production', icon: 'engineering' as const, tone: 'purple' },
    { id: 'market', label: 'Open Market', detail: 'Trade and auctions', icon: 'trade' as const, tone: 'success' }
  ];

  return (
    <div className="command-center-page">
      <div className="command-center-grid">
        <Panel depth="high" className="command-center-hero">
          <div className="command-center-hero__copy">
            <span className="concept-kicker"><NWIcon name="station" size={16} /> Command Center</span>
            <div className="command-center-hero__title"><div><small>Station Overview</small><h2>{stationName}</h2></div><Badge tone="purple">Tier {station?.level ?? 1}</Badge></div>
            <p>Community salvage hub, orbital reconstruction yard, and persistent home of the Neon Wreckers.</p>
            <div className="command-center-vitals">
              <div><span>Hull Integrity</span><strong>{station?.integrity ?? 0}%</strong><i><b style={{ width: `${station?.integrity ?? 0}%` }} /></i></div>
              <div><span>Power Core</span><strong>{station?.power ?? 0}%</strong><i><b style={{ width: `${station?.power ?? 0}%` }} /></i></div>
              <div><span>Morale</span><strong>{station?.morale ?? 0}%</strong><i><b style={{ width: `${station?.morale ?? 0}%` }} /></i></div>
              <div><span>Population</span><strong>{(station?.population ?? 0).toLocaleString()}</strong><small>{station?.populationStatus?.trend ? `${station.populationStatus.trend > 0 ? '+' : ''}${station.populationStatus.trend} cycle` : 'Stable'}</small></div>
            </div>
            <div className="command-center-hero__actions"><Button variant="primary" onClick={() => onNavigate('construction')}>Station Details</Button><Button variant="ghost" onClick={() => onNavigate('history')}>Operations Log</Button></div>
          </div>
          <div className="command-center-hero__visual">
            <GameArtwork src="/station/station-zero.webp" alt="Station Zero orbital command hub" eager sizes="(max-width: 760px) 96vw, 62vw" />
            <div className="command-center-hero__scan" aria-hidden="true" />
            <span className="command-center-hero__designation">NW // ZERO-01</span>
          </div>
        </Panel>

        <Panel tone={riskTone(wreck?.risk)} className="dashboard-wreck-card">
          <div className="dashboard-panel-heading"><div><span>Current Wreck</span><h3>{wreck?.name ?? 'Scanning debris field'}</h3></div><Badge tone={riskTone(wreck?.risk)}>{wreck?.risk ?? 'unknown'}</Badge></div>
          <div className="dashboard-wreck-card__visual">{wreck ? <GameArtwork src={`/wrecks/${wreck.archetype}.webp`} alt={`${wreck.name} salvage target`} eager sizes="(max-width: 760px) 88vw, 24rem" /> : <NWIcon name="wreck" size={72} />}</div>
          <div className="dashboard-wreck-card__data"><span>Hull <b>{wreck?.integrity ?? 0}%</b></span><span>Loot Budget <b>{(wreck?.remainingLootBudget ?? 0).toLocaleString()}</b></span></div>
          <HealthBar label="Structural integrity" value={wreck?.integrity ?? 0} />
          <Button variant="secondary" fullWidth onClick={() => onNavigate('salvage')}>View Wreck</Button>
        </Panel>

        <Panel className="dashboard-resources-card">
          <div className="dashboard-panel-heading"><div><span>Resources</span><h3>Personal Hold</h3></div><NWIcon name="inventory" size={22} /></div>
          <div className="dashboard-resource-list">
            {resources.map(resource => <button key={resource.slug} type="button" className={`nw-tone--${resource.tone}`} onClick={() => onNavigate('inventory')}><NWIcon name={resource.icon} size={18} /><span>{resource.label}</span><strong className="nw-numeric">{inventoryQuantity({ inventory }, resource.slug).toLocaleString()}</strong></button>)}
            <button type="button" className="nw-tone--purple" onClick={() => onNavigate('market')}><NWIcon name="credits" size={18} /><span>Credits</span><strong className="nw-numeric">{(me.player?.credits ?? 0).toLocaleString()}</strong></button>
          </div>
          <Button variant="primary" fullWidth onClick={() => onNavigate('inventory')}>Resource Overview</Button>
        </Panel>
      </div>

      <div className="command-center-secondary">
        <Panel className="dashboard-expedition-card">
          <div className="dashboard-panel-heading"><div><span>Active Expedition</span><h3>{activeExpedition?.name ?? 'No deployment active'}</h3></div><Badge tone={activeExpedition?.status === 'active' ? 'success' : 'neutral'}>{activeExpedition?.status ?? 'idle'}</Badge></div>
          <div className="dashboard-expedition-card__body">
            <div className="dashboard-expedition-card__ship">{activeShip ? <GameArtwork src={activeShip.activeSkin ? `/ships/skins/${activeShip.activeSkin}.webp` : `/ships/base/${activeShip.classSlug}.webp`} alt={`${activeShip.name} expedition ship`} sizes="(max-width: 760px) 42vw, 18rem" /> : <NWIcon name="expedition" size={58} />}</div>
            <div><span>{activeShip?.name ?? 'Fleet standing by'}</span><strong>{activeExpedition?.risk ?? 'Ready'}</strong><p>{activeExpedition?.resolvesAt ? `Return signal ${new Date(activeExpedition.resolvesAt).toLocaleString()}` : 'Select an expedition and deploy a prepared ship.'}</p></div>
          </div>
          <ProgressBar label="Ship condition" value={activeShip?.condition ?? 0} tone={toneForValue(activeShip?.condition)} />
          <Button fullWidth onClick={() => onNavigate('expeditions')}>{activeExpedition ? 'Track Expedition' : 'Launch Expedition'}</Button>
        </Panel>

        <Panel className="dashboard-quick-actions">
          <div className="dashboard-panel-heading"><div><span>Quick Actions</span><h3>Command Shortcuts</h3></div><NWIcon name="terminal" size={22} /></div>
          <div className="dashboard-action-grid">{quickActions.map(command => <button key={command.id} type="button" className={`dashboard-action nw-tone--${command.tone}`} onClick={() => onNavigate(command.id)}><span><NWIcon name={command.icon} size={22} /></span><strong>{command.label}</strong><small>{command.detail}</small></button>)}</div>
        </Panel>

        <Panel className="dashboard-news-card">
          <div className="dashboard-panel-heading"><div><span>Neon Wreck News</span><h3>Live Signals</h3></div><Badge tone={unreadNotifications.length ? 'warning' : 'success'}>{unreadNotifications.length} new</Badge></div>
          <div className="dashboard-news-list">
            {(unreadNotifications.length ? unreadNotifications : notifications).slice(0, 4).map(notification => <button key={notification.id} type="button" onClick={() => onNavigate('notifications')}><span className="dashboard-news-list__icon"><NWIcon name="notifications" size={17} /></span><span><strong>{notification.title}</strong><small>{notification.body}</small></span><time>{new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time></button>)}
            {!notifications.length && history.slice(0, 3).map(entry => <button key={entry.id} type="button" onClick={() => onNavigate('history')}><span className="dashboard-news-list__icon"><NWIcon name="events" size={17} /></span><span><strong>{entry.title}</strong><small>{entry.body}</small></span><time>LOG</time></button>)}
          </div>
          <Button variant="ghost" fullWidth onClick={() => onNavigate('notifications')}>Open News Feed</Button>
        </Panel>
      </div>

      <Panel className="dashboard-live-feed">
        <div className="dashboard-live-feed__label"><span className="signal-dot" />Live Feed</div>
        <div className="dashboard-live-feed__items">{history.slice(0, 5).map(entry => <button key={entry.id} type="button" onClick={() => onNavigate('history')}><NWIcon name="events" size={16} /><span><small>{entry.category}</small><strong>{entry.title}</strong></span><time>{new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time></button>)}</div>
      </Panel>

      <StationMaintenance station={station} inventory={inventory} cooldowns={cooldowns} action={action} />
    </div>
  );
}

function StationMaintenance({ station, inventory, cooldowns, action }: Pick<GameData, 'station' | 'inventory' | 'cooldowns' | 'action'>) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, []);
  const run = async (key: string) => { await action('/api/v1/station/maintain', { action: key }, 'Community action complete'); };
  const qty = (slug: string) => inventory.find(item => item.itemSlug === slug)?.quantity ?? 0;
  const options = [
    { key: 'repair-hull', title: 'Repair Main Station', cost: '2 Hull Plates + 3 Sealant Foam', reward: '+8 integrity', icon: 'integrity' as const, ready: qty('hull-plate') >= 2 && qty('sealant-foam') >= 3 },
    { key: 'fuel-reactor', title: 'Fuel Reactor Grid', cost: '2 Fuel Cells + 1 Reactor Coolant', reward: '+15 power', icon: 'reactor' as const, ready: qty('fuel') >= 2 && qty('reactor-coolant') >= 1 },
    { key: 'food-drive', title: 'Run Food Drive', cost: '10 Ration Packs + 5 Water Cartridges', reward: '+6 residents, +4 morale', icon: 'population' as const, ready: qty('ration-pack') >= 10 && qty('water-cartridge') >= 5 },
    { key: 'medical-clinic', title: 'Open Community Clinic', cost: '4 Medical Supplies', reward: '+3 residents, +6 morale', icon: 'crew' as const, ready: qty('medical-supplies') >= 4 }
  ];
  return <Panel tone={(station?.integrity ?? 100) < 40 || (station?.power ?? 100) < 30 ? 'danger' : 'info'} className="station-survival-panel"><SectionTitle eyebrow="COMMUNITY OPERATIONS" title="Station Survival" description={(station?.populationStatus?.reasons ?? ['Community systems nominal.']).join(' ')} icon="population" /><div className="station-survival-grid">{options.map(option => { const remaining = cooldownRemaining(cooldowns, `station:${option.key}`, now); return <Tooltip key={option.key} content={`Cost: ${option.cost}. Effect: ${option.reward}. These resources are consumed for the whole community.`}><Card className="station-survival-card"><span className="station-survival-card__icon"><NWIcon name={option.icon} size={23} /></span><h3>{option.title}</h3><p>{option.cost}</p><Badge tone="success">{option.reward}</Badge><Button fullWidth disabled={!option.ready || remaining > 0} onClick={() => void run(option.key)}>{remaining > 0 ? `Ready in ${formatCountdown(remaining)}` : option.ready ? 'Contribute Now' : 'Materials Needed'}</Button></Card></Tooltip>; })}</div></Panel>;
}

function WreckIntel({ wreck }: { wreck: Wreck | null }) {
  const tone = riskTone(wreck?.risk);
  return <Panel tone={tone} className="salvage-wreck-intel"><div className="dashboard-panel-heading"><div><span>Target Acquired</span><h3>{wreck?.name ?? 'Scanning local debris field'}</h3></div><Badge tone={tone}>{wreck?.risk ?? 'unknown'}</Badge></div><div className="salvage-wreck-intel__scan">{wreck ? <GameArtwork src={`/wrecks/${wreck.archetype}.webp`} alt={`${wreck.name}, current salvage target`} eager sizes="(max-width: 760px) 94vw, 52rem" /> : <NWIcon name="wreck" size={90} />}<div className="salvage-radar" aria-hidden="true"><i /><i /><i /></div><strong className="nw-numeric">{wreck?.integrity ?? 0}% HULL</strong></div><p>{wreck?.description ?? 'Awaiting server telemetry.'}</p><HealthBar label="Remaining hull" value={wreck?.integrity ?? 0} /></Panel>;
}

export function SalvagePage({ wreck, cooldowns, action, inventory, ships }: GameData) {
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
  const profiles = wreck?.salvageProfile ? (['cutters', 'cargo'] as const).map(mode => ({ mode, ...wreck.salvageProfile[mode] })) : [];
  const activeShip = ships[0];
  return (
    <div className="salvage-console-page">
      <SectionTitle eyebrow="SALVAGE MODE" title="Wreck Operations" description="Scan, cut, and recover through the existing server-authoritative salvage routes." icon="salvage" action={<ToggleSwitch checked={autoSalvage} onChange={setAutoSalvage} label="Auto salvage" description="Run available standard actions while this screen remains open." />} />
      <div className="salvage-command-ribbon">
        <CommandAction icon="scanner" title="Active Scan" detail={scanRemaining > 0 ? `Ready in ${formatCountdown(scanRemaining)}` : 'Acquire the next salvage target.'} disabled={scanRemaining > 0} onClick={() => void action('/api/v1/salvage/scan', undefined, 'Signal acquired')} />
        <CommandAction icon="salvage" title="Deploy Cutters" detail={cuttersRemaining > 0 ? `Ready in ${formatCountdown(cuttersRemaining)}` : 'Execute the standard cutting profile.'} disabled={cuttersRemaining > 0} onClick={() => void action('/api/v1/salvage/deploy', { mode: 'cutters' }, 'Cutters deployed')} tone="purple" />
        <CommandAction icon="cargo" title="Recover Cargo" detail={cargoRemaining > 0 ? `Ready in ${formatCountdown(cargoRemaining)}` : 'Prioritize internal cargo compartments.'} disabled={cargoRemaining > 0} onClick={() => void action('/api/v1/salvage/deploy', { mode: 'cargo' }, 'Cargo team launched')} tone="info" />
        <CommandAction icon="signal" title="Rush Scan" detail="Spend 75 StreamElements points." onClick={() => void action('/api/v1/points/actions/rush_scan', undefined, 'Rush scan purchased', { 'Idempotency-Key': crypto.randomUUID() })} tone="purple" />
        <CommandAction icon="danger" title="Safety Override" detail={overrideRemaining > 0 ? `Ready in ${formatCountdown(overrideRemaining)}` : 'Existing high-risk point action.'} disabled={overrideRemaining > 0} onClick={() => setConfirmOverride(true)} tone="danger" />
      </div>

      <div className="salvage-console-grid">
        <WreckIntel wreck={wreck} />
        <Panel className="salvage-profile-panel">
          <div className="dashboard-panel-heading"><div><span>Salvage Profiles</span><h3>Yield Intelligence</h3></div><NWIcon name="diagnostics" size={21} /></div>
          <div className="salvage-profile-list">{profiles.map(profile => <Card key={profile.mode} className="salvage-profile-card"><span className="salvage-profile-card__icon"><NWIcon name={profile.mode === 'cargo' ? 'cargo' : 'salvage'} size={22} /></span><div><strong>{profile.mode === 'cargo' ? 'Cargo Team' : 'Cutters'}</strong><small>{Math.round(profile.successChance * 100)}% success</small></div><p>{profile.scrapRange[0]}–{profile.scrapRange[1]} scrap · {Math.round(profile.electronicsChance * 100)}% electronics · {Math.round(profile.fuelChance * 100)}% fuel</p><div className="salvage-profile-card__loot">{profile.wreckLootPool.slice(0, 4).map(item => <Badge key={item.slug} tone={item.rarity === 'epic' || item.rarity === 'legendary' ? 'purple' : 'info'}>{item.name}</Badge>)}</div></Card>)}</div>
          {!profiles.length && <Notification title="No profile telemetry" tone="info">Scan a wreck to populate current yield intelligence.</Notification>}
        </Panel>
      </div>

      <div className="salvage-lower-grid">
        <Panel className="salvage-cargo-panel"><div className="dashboard-panel-heading"><div><span>Cargo Hold</span><h3>Recovered Materials</h3></div><Badge tone="success">{inventory.reduce((sum, item) => sum + item.quantity, 0).toLocaleString()} units</Badge></div><div className="compact-inventory concept-inventory-tiles">{inventory.slice(0, 8).map(item => <div key={item.itemSlug} className={`concept-inventory-tile nw-rarity--${item.rarity}`}><NWIcon name={itemIcon(item.itemSlug)} size={21} /><span>{item.name}</span><strong className="nw-numeric">×{item.quantity}</strong></div>)}</div></Panel>
        <Panel className="salvage-ship-panel"><div className="dashboard-panel-heading"><div><span>Ship Readiness</span><h3>{activeShip?.name ?? 'No ship registered'}</h3></div><Badge tone={toneForValue(activeShip?.condition)}>{activeShip?.condition ?? 0}% hull</Badge></div>{activeShip && <div className="salvage-ship-panel__body"><GameArtwork src={activeShip.activeSkin ? `/ships/skins/${activeShip.activeSkin}.webp` : `/ships/base/${activeShip.classSlug}.webp`} alt={activeShip.name} sizes="(max-width:760px) 88vw, 26rem" /><div><HealthBar label="Hull integrity" value={activeShip.condition} /><ProgressBar label="Fuel level" value={activeShip.fuel} tone="purple" /><span className="nw-numeric">Cargo {activeShip.cargoCapacity}</span></div></div>}</Panel>
      </div>

      {riskTone(wreck?.risk) === 'danger' && <div className="salvage-danger-banner"><NWIcon name="danger" size={26} /><div><span>Extreme Hazard Detected</span><strong>{wreck?.name ?? 'Target'} requires deliberate command confirmation.</strong></div></div>}
      <Notification title="Server authority active" tone="info" icon="network">The interface submits commands only. It does not calculate outcomes, rewards, cooldowns, or balance.</Notification>
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
