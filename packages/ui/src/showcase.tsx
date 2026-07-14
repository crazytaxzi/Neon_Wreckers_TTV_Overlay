import { useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  ConfirmWindow,
  ContextMenu,
  DataGrid,
  Field,
  HealthBar,
  Input,
  InventoryCard,
  LoadingScreen,
  Meter,
  Modal,
  ModuleCard,
  Notification,
  Panel,
  Pill,
  PopulationDisplay,
  PowerBar,
  ProgressBar,
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
import { NWIcon } from './icons.js';

export function ComponentShowcase() {
  const [tab, setTab] = useState('primitives');
  const [toggle, setToggle] = useState(true);
  const [slider, setSlider] = useState(42);
  const [modal, setModal] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const { pushToast } = useToast();
  const rows = useMemo(() => [
    { id: 'A-17', system: 'Reactor manifold', state: 'Nominal', load: 67 },
    { id: 'C-04', system: 'Cargo lattice', state: 'Restricted', load: 91 }
  ], []);

  return (
    <div className="nw-showcase">
      <SectionTitle eyebrow="DESIGN SYSTEM 2.0" title="Interface Component Matrix" description="Production components, states, controls, motion, and accessibility behavior in one live reference." icon="diagnostics" />
      <Tabs value={tab} onChange={setTab} items={[
        { id: 'primitives', label: 'Primitives', icon: 'module' },
        { id: 'data', label: 'Data & Status', icon: 'data' },
        { id: 'controls', label: 'Controls', icon: 'settings' },
        { id: 'feedback', label: 'Feedback', icon: 'notifications' }
      ]} />

      {tab === 'primitives' && <ResponsiveGrid min="18rem">
        <Panel><SectionTitle eyebrow="ACTIONS" title="Buttons & Badges" /><div className="nw-demo-stack"><Button variant="primary" icon={<NWIcon name="salvage" size={16} />}>Primary action</Button><Button>Secondary action</Button><Button variant="ghost">Ghost action</Button><Button variant="warning">Warning action</Button><Button variant="danger">Danger action</Button><div><Badge tone="success">online</Badge> <Badge tone="info">linked</Badge> <Pill tone="purple">prototype-free</Pill></div></div></Panel>
        <Card><SectionTitle eyebrow="CONTENT" title="Cards & Panels" /><p>Sharp geometry, fine borders, black glass, restrained bloom, and layered depth.</p><Tooltip content="Tooltips are keyboard reachable"><Button variant="ghost">Hover or focus</Button></Tooltip></Card>
        <ModuleCard name="Refinery Spine" state="building" progress={64} description="Converts recovered alloys into station-grade structural stock." stats={<Badge tone="info">ETA 2 cycles</Badge>} />
        <InventoryCard name="Phase-thread Alloy" quantity={1284} rarity="legendary" icon="resources" detail="Recovered from Orpheus-class wreckage" />
      </ResponsiveGrid>}

      {tab === 'data' && <div className="nw-demo-stack">
        <ResponsiveGrid min="13rem"><StatusDisplay label="Station Power" value="84" unit="%" icon="power" tone="purple" detail="+3.2 MW reserve" /><StatusDisplay label="Hull Integrity" value="72" unit="%" icon="integrity" tone="success" detail="Stable" /><PopulationDisplay current={1248} capacity={1600} trend={18} /></ResponsiveGrid>
        <Panel><ProgressBar value={74} label="Construction progress" /><HealthBar value={36} label="Hull health" /><PowerBar value={88} label="Reactor output" /><Meter value={7} max={10} label="Signal fidelity" tone="info" /></Panel>
        <Panel><DataGrid rows={rows} getRowKey={row => row.id} columns={[{ key: 'id', header: 'Node', render: row => <span className="nw-numeric">{row.id}</span> },{ key: 'system', header: 'System', render: row => row.system },{ key: 'state', header: 'State', render: row => <Badge tone={row.state === 'Nominal' ? 'success' : 'warning'}>{row.state}</Badge> },{ key: 'load', header: 'Load', align: 'right', render: row => `${row.load}%` }]} /></Panel>
        <Panel><ScrollableList label="System events" maxHeight="14rem">{Array.from({ length: 8 }, (_, index) => <Card key={index}><strong>Cycle event {index + 1}</strong><p>Subsystem telemetry accepted by command core.</p></Card>)}</ScrollableList></Panel>
      </div>}

      {tab === 'controls' && <ResponsiveGrid min="20rem">
        <Panel><Field label="Callsign" hint="Visible in station history"><Input defaultValue="SENTI-01" /></Field><Field label="Operational mode"><Select defaultValue="balanced"><option value="balanced">Balanced</option><option value="performance">Performance</option><option value="accessibility">Accessibility</option></Select></Field><Field label="Command note"><Textarea defaultValue="Salvage lanes cleared for cycle 881." /></Field></Panel>
        <Panel><div className="nw-demo-stack"><ToggleSwitch checked={toggle} onChange={setToggle} label="Holographic flicker" description="Subtle panel life effect" /><SliderControl label="Glow intensity" value={slider} onChange={setSlider} unit="%" /><ContextMenu items={[{ id: 'inspect', label: 'Inspect module', icon: 'scanner', onSelect: () => pushToast({ title: 'Module inspected', tone: 'info' }) },{ id: 'archive', label: 'Archive record', icon: 'archive', onSelect: () => pushToast({ title: 'Record archived', tone: 'warning' }) },{ id: 'retire', label: 'Retire module', icon: 'danger', danger: true, onSelect: () => setConfirm(true) }]}><Card><strong>Right-click or open menu</strong><p>Keyboard and touch safe context actions.</p></Card></ContextMenu></div></Panel>
      </ResponsiveGrid>}

      {tab === 'feedback' && <div className="nw-demo-stack">
        <Notification title="Telemetry synchronized" tone="success">All station nodes report within tolerance.</Notification>
        <Notification title="Thermal threshold" tone="warning">Reactor coolant demand is approaching cycle limit.</Notification>
        <Notification title="Containment breach" tone="danger">Deck nine requires command authorization.</Notification>
        <Panel><div className="nw-demo-actions"><Button onClick={() => setModal(true)}>Open modal</Button><Button variant="warning" onClick={() => setConfirm(true)}>Open confirm window</Button><Button variant="primary" onClick={() => pushToast({ title: 'Salvage manifest received', message: 'Four inventory records were synchronized.', tone: 'success' })}>Send toast</Button></div><div className="nw-skeleton-group"><Skeleton width="48%" height="1.5rem" /><Skeleton width="92%" /><Skeleton width="76%" /></div></Panel>
        <Panel className="nw-loading-preview"><LoadingScreen label="Synchronizing station systems" detail="Compact reference preview" /></Panel>
      </div>}

      <Modal open={modal} onClose={() => setModal(false)} title="Command Authorization" description="Modals retain focus, close on Escape, and remain responsive." footer={<Button variant="primary" onClick={() => setModal(false)}>Acknowledge</Button>}><p>Secure station operations stay inside a focused black-glass command window.</p></Modal>
      <ConfirmWindow open={confirm} onClose={() => setConfirm(false)} onConfirm={() => { setConfirm(false); pushToast({ title: 'Action confirmed', tone: 'warning' }); }} title="Retire this subsystem?" confirmLabel="Retire subsystem" tone="danger"><p>This demonstrates destructive confirmation behavior. No live subsystem is affected.</p></ConfirmWindow>
    </div>
  );
}
