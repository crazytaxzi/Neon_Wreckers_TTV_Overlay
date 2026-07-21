import { useMemo, useState } from 'react';
import {
  ActionTile,
  Badge,
  Button,
  Card,
  ConfirmWindow,
  ContextMenu,
  DataGrid,
  DispatchBanner,
  EmptyState,
  EntityCard,
  Field,
  HealthBar,
  Input,
  InventoryCard,
  InventoryGrid,
  InventorySlot,
  LoadingScreen,
  LoadingState,
  Meter,
  Modal,
  ModuleCard,
  Notification,
  OverlayEventPopup,
  OverlayTelemetryPanel,
  Panel,
  Pill,
  PopulationDisplay,
  PowerBar,
  ProgressBar,
  ResourceStrip,
  ResponsiveGrid,
  ScrollableList,
  SectionTitle,
  Select,
  Skeleton,
  SliderControl,
  StatusDisplay,
  Tabs,
  Textarea,
  ToggleSwitch,
  Tooltip,
  useToast
} from './components.js';
import { NWIcon, type IconName } from './icons.js';

const graphicGlyphs = [
  { name: 'wrecker', label: 'Wrecker mark', tone: 'success', detail: 'Brand identity' },
  { name: 'station', label: 'Station', tone: 'success', detail: 'Orbital command' },
  { name: 'wreck', label: 'Wreck', tone: 'info', detail: 'Salvage target' },
  { name: 'salvage', label: 'Cutter', tone: 'purple', detail: 'Salvage action' },
  { name: 'inventory', label: 'Cargo', tone: 'warning', detail: 'Inventory hold' },
  { name: 'crew', label: 'Crew', tone: 'purple', detail: 'Personnel deck' },
  { name: 'market', label: 'Market', tone: 'success', detail: 'Trade network' },
  { name: 'construction', label: 'Build', tone: 'info', detail: 'Station works' },
  { name: 'broadcast', label: 'Broadcast', tone: 'purple', detail: 'Viewer network' },
  { name: 'danger', label: 'Hazard', tone: 'danger', detail: 'Critical state' }
] as const satisfies ReadonlyArray<{ name: IconName; label: string; tone: 'success' | 'info' | 'warning' | 'danger' | 'purple'; detail: string }>;

export function ComponentShowcase() {
  const [tab, setTab] = useState('primitives');
  const [toggle, setToggle] = useState(true);
  const [slider, setSlider] = useState(42);
  const [modal, setModal] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState('alloy');
  const { pushToast } = useToast();
  const rows = useMemo(() => [
    { id: 'A-17', system: 'Reactor manifold', state: 'Nominal', load: 67 },
    { id: 'C-04', system: 'Cargo lattice', state: 'Restricted', load: 91 }
  ], []);

  return (
    <div className="nw-showcase">
      <SectionTitle eyebrow="DESIGN SYSTEM 2.2" title="Interface Component Matrix" description="The production contract for player, administrator, and broadcast surfaces. Every state remains live HTML, keyboard reachable, token driven, and visually synchronized." icon="diagnostics" />
      <Tabs value={tab} onChange={setTab} items={[
        { id: 'primitives', label: 'Primitives', icon: 'module' },
        { id: 'graphics', label: 'Graphic Language', icon: 'wrecker' },
        { id: 'entities', label: 'Entities & Inventory', icon: 'inventory' },
        { id: 'data', label: 'Data & Status', icon: 'data' },
        { id: 'controls', label: 'Controls', icon: 'settings' },
        { id: 'broadcast', label: 'Broadcast', icon: 'broadcast' },
        { id: 'feedback', label: 'Feedback', icon: 'notifications' }
      ]} />

      {tab === 'primitives' && <div className="nw-demo-stack">
        <ResponsiveGrid min="18rem">
          <Panel><SectionTitle eyebrow="ACTIONS" title="Buttons & Badges" /><div className="nw-demo-stack"><Button variant="primary" icon={<NWIcon name="salvage" size={16} />}>Primary action</Button><Button>Secondary action</Button><Button variant="ghost">Ghost action</Button><Button variant="warning">Warning action</Button><Button variant="danger">Danger action</Button><div><Badge tone="success">online</Badge> <Badge tone="info">linked</Badge> <Pill tone="purple">token driven</Pill></div></div></Panel>
          <Card><SectionTitle eyebrow="CONTENT" title="Cards & Panels" /><p>Angular metal framing, segmented surfaces, restrained glow, and readable hierarchy without flattened screenshot furniture.</p><Tooltip content="Tooltips are keyboard reachable"><Button variant="ghost">Hover or focus</Button></Tooltip></Card>
          <ModuleCard name="Refinery Spine" state="building" progress={64} description="Converts recovered alloys into station-grade structural stock." stats={<Badge tone="info">ETA 2 cycles</Badge>} />
          <InventoryCard name="Phase-thread Alloy" quantity={1284} rarity="legendary" icon="resources" detail="Recovered from Orpheus-class wreckage" />
        </ResponsiveGrid>
        <ResponsiveGrid min="18rem">
          <ActionTile icon="scanner" title="Active Scan" detail="Acquire the next real wreck profile." tone="info" onClick={() => pushToast({ title: 'Action tile activated', tone: 'info' })} />
          <ActionTile icon="salvage" title="Deploy Cutters" detail="Standard command state." tone="success" onClick={() => pushToast({ title: 'Cutters dispatched', tone: 'success' })} />
          <ActionTile icon="danger" title="Safety Override" detail="Danger treatment includes label and icon, not color alone." tone="danger" onClick={() => setConfirm(true)} badge={<Badge tone="danger">HIGH RISK</Badge>} />
        </ResponsiveGrid>
      </div>}

      {tab === 'graphics' && <div className="nw-demo-stack">
        <Panel tone="success"><SectionTitle eyebrow="SYNCHRONIZED GLYPHS" title="Neon Wreckers Graphic Language" description="Custom SVG glyphs replace generic dashboard symbols for the core player, administrator, and broadcast vocabulary." icon="wrecker" />
          <ResponsiveGrid min="8.5rem">
            {graphicGlyphs.map(glyph => <Card key={glyph.name} className="nw-glyph-swatch" tone={glyph.tone}>
              <div className="nw-glyph-swatch__plate"><NWIcon name={glyph.name} size={32} /></div>
              <strong>{glyph.label}</strong>
              <small>{glyph.detail}</small>
            </Card>)}
          </ResponsiveGrid>
        </Panel>
        <Panel tone="purple"><SectionTitle eyebrow="RARITY HARDWARE" title="Inventory Frame Ladder" description="Every rarity retains a live label and receives a distinct frame, pattern, and accent treatment." icon="inventory" />
          <div className="nw-rarity-demo">
            <InventorySlot name="Hull Scrap" quantity={842} rarity="common" icon="resources" />
            <InventorySlot name="Refined Alloy" quantity={64} rarity="uncommon" icon="resources" />
            <InventorySlot name="Quantum Lens" quantity={7} rarity="rare" icon="scanner" />
            <InventorySlot name="Ghost Relay" quantity={2} rarity="epic" icon="signal" />
            <InventorySlot name="Station Core" quantity={1} rarity="legendary" icon="station" />
          </div>
        </Panel>
        <div className="nw-broadcast-demo">
          <DispatchBanner label="WRECKER NEWS" title="Major update deployed" tone="success" icon="broadcast">New synchronized graphics are available across every command surface.</DispatchBanner>
          <DispatchBanner label="BREAKING" title="Reactor breach detected" tone="danger" icon="danger">Hazard communication uses icon, wording, pattern, and color together.</DispatchBanner>
        </div>
      </div>}

      {tab === 'entities' && <div className="nw-demo-stack">
        <ResponsiveGrid min="24rem">
          <EntityCard title="Orpheus Freight Hulk" subtitle="Current salvage target" icon="wreck" tone="warning" status={<Badge tone="warning">ELEVATED RISK</Badge>} action={<Button size="sm" variant="primary">Open telemetry</Button>}>
            <ProgressBar value={58} label="Remaining hull" tone="warning" />
          </EntityCard>
          <EntityCard title="Wayfarer" subtitle="Player salvage ship" icon="expedition" tone="purple" status={<Badge tone="success">READY</Badge>} action={<Button size="sm">Manage vessel</Button>}>
            <ResourceStrip compact resources={[{ id: 'condition', label: 'Condition', value: '82%', icon: 'integrity', tone: 'success' }, { id: 'fuel', label: 'Fuel', value: '64%', icon: 'power', tone: 'purple' }]} />
          </EntityCard>
        </ResponsiveGrid>
        <Panel><SectionTitle eyebrow="TACTILE HOLD" title="Inventory Slots & Rarity" description="Rarity is reinforced by text, icon treatment, and border pattern rather than color alone." icon="inventory" /><InventoryGrid min="9rem">
          <InventorySlot name="Hull Scrap" quantity={842} rarity="common" icon="resources" selected={selectedSlot === 'scrap'} onClick={() => setSelectedSlot('scrap')} />
          <InventorySlot name="Refined Alloy" quantity={64} rarity="uncommon" icon="resources" selected={selectedSlot === 'alloy'} onClick={() => setSelectedSlot('alloy')} />
          <InventorySlot name="Quantum Lens" quantity={7} rarity="rare" icon="scanner" selected={selectedSlot === 'lens'} onClick={() => setSelectedSlot('lens')} />
          <InventorySlot name="Ghost Relay" quantity={2} rarity="epic" icon="signal" selected={selectedSlot === 'relay'} onClick={() => setSelectedSlot('relay')} />
          <InventorySlot name="Station Core" quantity={1} rarity="legendary" icon="station" selected={selectedSlot === 'core'} onClick={() => setSelectedSlot('core')} />
        </InventoryGrid></Panel>
      </div>}

      {tab === 'data' && <div className="nw-demo-stack">
        <ResourceStrip resources={[{ id: 'credits', label: 'Credits', value: '12,480', icon: 'credits', tone: 'success' }, { id: 'scrap', label: 'Scrap', value: '842', icon: 'resources', tone: 'info' }, { id: 'research', label: 'Research', value: '39', icon: 'data', tone: 'purple' }, { id: 'alerts', label: 'Alerts', value: '2', icon: 'notifications', tone: 'warning' }]} />
        <ResponsiveGrid min="13rem"><StatusDisplay label="Station Power" value="84" unit="%" icon="power" tone="purple" detail="+3.2 MW reserve" /><StatusDisplay label="Hull Integrity" value="72" unit="%" icon="integrity" tone="success" detail="Stable" /><PopulationDisplay current={1248} capacity={1600} trend={18} /></ResponsiveGrid>
        <Panel><ProgressBar value={74} label="Construction progress" /><HealthBar value={36} label="Hull health" /><PowerBar value={88} label="Reactor output" /><Meter value={7} max={10} label="Signal fidelity" tone="info" /></Panel>
        <Panel><DataGrid rows={rows} getRowKey={row => row.id} columns={[{ key: 'id', header: 'Node', render: row => <span className="nw-numeric">{row.id}</span> },{ key: 'system', header: 'System', render: row => row.system },{ key: 'state', header: 'State', render: row => <Badge tone={row.state === 'Nominal' ? 'success' : 'warning'}>{row.state}</Badge> },{ key: 'load', header: 'Load', align: 'right', render: row => `${row.load}%` }]} /></Panel>
        <Panel><ScrollableList label="System events" maxHeight="14rem">{Array.from({ length: 8 }, (_, index) => <Card key={index}><strong>Cycle event {index + 1}</strong><p>Subsystem telemetry accepted by command core.</p></Card>)}</ScrollableList></Panel>
      </div>}

      {tab === 'controls' && <ResponsiveGrid min="20rem">
        <Panel><Field label="Callsign" hint="Visible in station history"><Input defaultValue="SENTI-01" /></Field><Field label="Operational mode"><Select defaultValue="balanced"><option value="balanced">Balanced</option><option value="performance">Performance</option><option value="accessibility">Accessibility</option></Select></Field><Field label="Command note"><Textarea defaultValue="Salvage lanes cleared for cycle 881." /></Field></Panel>
        <Panel><div className="nw-demo-stack"><ToggleSwitch checked={toggle} onChange={setToggle} label="Holographic flicker" description="Subtle panel life effect" /><SliderControl label="Glow intensity" value={slider} onChange={setSlider} unit="%" /><ContextMenu items={[{ id: 'inspect', label: 'Inspect module', icon: 'scanner', onSelect: () => pushToast({ title: 'Module inspected', tone: 'info' }) },{ id: 'archive', label: 'Archive record', icon: 'archive', onSelect: () => pushToast({ title: 'Record archived', tone: 'warning' }) },{ id: 'retire', label: 'Retire module', icon: 'danger', danger: true, onSelect: () => setConfirm(true) }]}><Card><strong>Right-click or open menu</strong><p>Keyboard and touch safe context actions.</p></Card></ContextMenu></div></Panel>
      </ResponsiveGrid>}

      {tab === 'broadcast' && <div className="nw-demo-stack">
        <Panel tone="purple"><SectionTitle eyebrow="OBS CONTRACT" title="Compact Broadcast Regions" description="Transparent, token-driven components intended for real station, wreck, history, and viewer-event data." icon="broadcast" /><ResponsiveGrid min="13rem"><OverlayTelemetryPanel title="Hull Integrity" value="72" unit="%" icon="integrity" tone="success"><ProgressBar value={72} showValue={false} tone="success" /></OverlayTelemetryPanel><OverlayTelemetryPanel title="Reactor Power" value="84" unit="%" icon="power" tone="purple"><ProgressBar value={84} showValue={false} tone="purple" /></OverlayTelemetryPanel><OverlayTelemetryPanel title="Threat" value="ELEVATED" icon="warning" tone="warning" /></ResponsiveGrid></Panel>
        <OverlayEventPopup label="Viewer Network" title="Raid party connected" tone="purple" icon="twitch">Twenty-seven operators joined the station feed.</OverlayEventPopup>
        <OverlayEventPopup label="Breaking Alert" title="Reactor instability detected" tone="danger" icon="danger">Engineering crews are responding to the server-issued event.</OverlayEventPopup>
        <DispatchBanner label="ACTIVITY DISPATCH" title="Rare salvage recovered" tone="success" icon="broadcast">A Quantum Lens entered the permanent station history feed.</DispatchBanner>
      </div>}

      {tab === 'feedback' && <div className="nw-demo-stack">
        <Notification title="Telemetry synchronized" tone="success">All station nodes report within tolerance.</Notification>
        <Notification title="Thermal threshold" tone="warning">Reactor coolant demand is approaching cycle limit.</Notification>
        <Notification title="Containment breach" tone="danger">Deck nine requires command authorization.</Notification>
        <Panel><div className="nw-demo-actions"><Button onClick={() => setModal(true)}>Open modal</Button><Button variant="warning" onClick={() => setConfirm(true)}>Open confirm window</Button><Button variant="primary" onClick={() => pushToast({ title: 'Salvage manifest received', message: 'Four inventory records were synchronized.', tone: 'success' })}>Send toast</Button></div><div className="nw-skeleton-group"><Skeleton width="48%" height="1.5rem" /><Skeleton width="92%" /><Skeleton width="76%" /></div></Panel>
        <ResponsiveGrid min="18rem"><Panel><EmptyState title="No active dispatches" icon="events">New real events appear here when the authoritative API supplies them.</EmptyState></Panel><Panel><LoadingState label="Synchronizing compact telemetry" /></Panel></ResponsiveGrid>
        <Panel className="nw-loading-preview"><LoadingScreen label="Synchronizing station systems" detail="Compact reference preview" /></Panel>
      </div>}

      <Modal open={modal} onClose={() => setModal(false)} title="Command Authorization" description="Modals retain focus, close on Escape, and remain responsive." footer={<Button variant="primary" onClick={() => setModal(false)}>Acknowledge</Button>}><p>Secure station operations stay inside a focused black-metal command window.</p></Modal>
      <ConfirmWindow open={confirm} onClose={() => setConfirm(false)} onConfirm={() => { setConfirm(false); pushToast({ title: 'Action confirmed', tone: 'warning' }); }} title="Retire this subsystem?" confirmLabel="Retire subsystem" tone="danger"><p>This demonstrates destructive confirmation behavior. No live subsystem is affected.</p></ConfirmWindow>
    </div>
  );
}
