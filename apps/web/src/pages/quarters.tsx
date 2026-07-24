import { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  Field,
  Notification,
  NWIcon,
  Panel,
  Pill,
  ResponsiveGrid,
  SectionTitle,
  Select,
  StatusDisplay
} from '@neon-wreckers/ui';
import type { GameData, QuartersObject } from '../model.js';
import { cooldownRemaining, formatCountdown, toneForValue } from '../page-utils.js';
import '../quarters.css';

type FixtureKey = 'bed' | 'relic-shelf' | 'espresso-rig';

type FixtureDefinition = {
  key: FixtureKey;
  name: string;
  icon: 'crew' | 'archive' | 'resources';
  action: string;
  description: string;
  cost: string;
  reward: string;
  cooldownKey: string;
};

const fixtures: FixtureDefinition[] = [
  {
    key: 'bed',
    name: 'Recovery Bunk',
    icon: 'crew',
    action: 'Run recovery cycle',
    description: 'Open the bunk rotation to idle crew and restore their morale between deployments.',
    cost: 'No supplies',
    reward: '+12 idle crew morale · +10 XP',
    cooldownKey: 'quarters:bed'
  },
  {
    key: 'relic-shelf',
    name: 'Relic Analysis Shelf',
    icon: 'archive',
    action: 'Decode research fragment',
    description: 'Use the private archive instruments to turn recovered data into personal progression.',
    cost: '1 Research Data',
    reward: '125 credits · 50 XP · 1 reputation',
    cooldownKey: 'quarters:relic-shelf'
  },
  {
    key: 'espresso-rig',
    name: 'Galley Espresso Rig',
    icon: 'resources',
    action: 'Serve galley batch',
    description: 'Brew a station-grade stimulant batch for crew currently off duty.',
    cost: '1 Water Cartridge · 1 Nutrient Paste',
    reward: '+8 idle crew morale · +5 XP',
    cooldownKey: 'quarters:espresso-rig'
  }
];

function fixtureName(key: string) {
  return fixtures.find(fixture => fixture.key === key)?.name ?? key.replaceAll('-', ' ');
}

export function QuartersPage({
  me,
  quarters,
  crew,
  inventory,
  cooldowns,
  expeditions,
  action
}: Pick<GameData, 'me' | 'quarters' | 'crew' | 'inventory' | 'cooldowns' | 'expeditions' | 'action'>) {
  const [theme, setTheme] = useState(quarters?.layout.theme ?? 'station-zero-default');
  const [objects, setObjects] = useState<QuartersObject[]>(quarters?.layout.objects ?? []);
  const [selectedKey, setSelectedKey] = useState<string | null>(objects[0]?.key ?? null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    setTheme(quarters?.layout.theme ?? 'station-zero-default');
    setObjects(quarters?.layout.objects ?? []);
    setSelectedKey(current => (quarters?.layout.objects ?? []).some(object => object.key === current)
      ? current
      : quarters?.layout.objects[0]?.key ?? null);
  }, [quarters]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, []);

  const deployedCrewIds = useMemo(() => new Set(
    expeditions.filter(expedition => expedition.status === 'active').flatMap(expedition => expedition.crewIds)
  ), [expeditions]);
  const idleCrew = crew.filter(member => !deployedCrewIds.has(member.id));
  const averageMorale = idleCrew.length
    ? Math.round(idleCrew.reduce((total, member) => total + member.morale, 0) / idleCrew.length)
    : 0;
  const selectedIndex = objects.findIndex(object => object.key === selectedKey);

  const held = (itemSlug: string) => inventory.find(item => item.itemSlug === itemSlug)?.quantity ?? 0;
  const isInstalled = (key: FixtureKey) => objects.some(object => object.key === key);
  const suppliesReady = (key: FixtureKey) => key === 'bed'
    || (key === 'relic-shelf' && held('research-data') >= 1)
    || (key === 'espresso-rig' && held('water-cartridge') >= 1 && held('nutrient-paste') >= 1);

  const installFixture = (key: FixtureKey) => {
    if (isInstalled(key)) return;
    const occupied = new Set(objects.map(object => `${object.x}:${object.y}`));
    for (let y = 0; y < 5; y += 1) {
      for (let x = 0; x < 8; x += 1) {
        if (!occupied.has(`${x}:${y}`)) {
          setObjects(current => [...current, { key, x, y }]);
          setSelectedKey(key);
          return;
        }
      }
    }
  };

  const removeSelected = () => {
    if (selectedIndex < 0) return;
    setObjects(current => current.filter((_, index) => index !== selectedIndex));
    setSelectedKey(null);
  };

  const moveSelected = (dx: number, dy: number) => {
    if (selectedIndex < 0) return;
    setObjects(current => {
      const selected = current[selectedIndex];
      const x = Math.max(0, Math.min(7, selected.x + dx));
      const y = Math.max(0, Math.min(4, selected.y + dy));
      if (current.some((object, index) => index !== selectedIndex && object.x === x && object.y === y)) return current;
      return current.map((object, index) => index === selectedIndex ? { ...object, x, y } : object);
    });
  };

  return (
    <div className="page-stack quarters-console">
      <section className="quarters-console__masthead">
        <div>
          <span className="nw-eyebrow">PERSONAL HABITAT // OFF-DUTY OPERATIONS</span>
          <h2>{me.displayName}&apos;s Quarters</h2>
          <p>Arrange your habitat, install functional fixtures, and use the room to support crew recovery and personal progression.</p>
        </div>
        <div className="quarters-console__occupancy">
          <span>Idle Crew</span>
          <strong className="nw-numeric">{idleCrew.length} / {crew.length}</strong>
          <Badge tone={toneForValue(averageMorale)}>{averageMorale || 0}% MORALE</Badge>
        </div>
      </section>

      <ResponsiveGrid min="13rem">
        <StatusDisplay label="Access Level" value={me.player?.level ?? 1} icon="module" tone="purple" />
        <StatusDisplay label="Credits" value={me.player?.credits ?? 0} unit=" cr" icon="credits" tone="success" />
        <StatusDisplay label="Installed Fixtures" value={objects.length} unit="/3" icon="diagnostics" tone="info" />
        <StatusDisplay label="Idle Crew Morale" value={averageMorale} unit="%" icon="crew" tone={toneForValue(averageMorale)} />
      </ResponsiveGrid>

      <div className="quarters-console__layout">
        <Panel depth="high" className="quarters-room-panel">
          <SectionTitle eyebrow="HABITAT EDITOR" title="Eight-by-Five Room Grid" description="Select a fixture, move it through the room, then save the server-backed layout." icon="diagnostics" />
          {quarters ? (
            <>
              <Field label="Habitat theme">
                <Select value={theme} onChange={event => setTheme(event.target.value)}>
                  <option value="station-zero-default">Station Zero Industrial</option>
                  <option value="frost-wrecks">Frost Wrecks</option>
                </Select>
              </Field>
              <div className={`quarters-room-map quarters-room-map--${theme}`} aria-label={`Quarters layout containing ${objects.length} fixtures`}>
                {objects.map((object, index) => (
                  <button
                    key={`${object.key}-${index}`}
                    type="button"
                    className={`quarters-room-object ${selectedKey === object.key ? 'is-selected' : ''}`}
                    style={{ gridColumn: object.x + 1, gridRow: object.y + 1 }}
                    onClick={() => setSelectedKey(object.key)}
                    aria-label={`${fixtureName(object.key)} at column ${object.x + 1}, row ${object.y + 1}`}
                  >
                    <NWIcon name={fixtures.find(fixture => fixture.key === object.key)?.icon ?? 'module'} size={22} />
                    <span>{fixtureName(object.key)}</span>
                    <small className="nw-numeric">{object.x + 1}:{object.y + 1}</small>
                  </button>
                ))}
                {!objects.length && <div className="quarters-room-empty"><NWIcon name="module" size={42} /><span>Install a fixture to wake this room up.</span></div>}
              </div>
              <div className="quarters-room-controls">
                <div>
                  <span className="nw-eyebrow">SELECTED FIXTURE</span>
                  <strong>{selectedIndex >= 0 ? fixtureName(objects[selectedIndex].key) : 'None selected'}</strong>
                </div>
                <div className="inline-actions">
                  <Button size="sm" variant="ghost" disabled={selectedIndex < 0} onClick={() => moveSelected(-1, 0)}>←</Button>
                  <Button size="sm" variant="ghost" disabled={selectedIndex < 0} onClick={() => moveSelected(0, -1)}>↑</Button>
                  <Button size="sm" variant="ghost" disabled={selectedIndex < 0} onClick={() => moveSelected(0, 1)}>↓</Button>
                  <Button size="sm" variant="ghost" disabled={selectedIndex < 0} onClick={() => moveSelected(1, 0)}>→</Button>
                  <Button size="sm" variant="warning" disabled={selectedIndex < 0} onClick={removeSelected}>Remove</Button>
                </div>
              </div>
              <Button fullWidth onClick={() => void action('/api/v1/quarters', { theme, objects }, 'Quarters layout saved')}>Save habitat layout</Button>
            </>
          ) : <Notification title="Layout unavailable" tone="warning">The quarters endpoint did not return a layout during this synchronization cycle.</Notification>}
        </Panel>

        <Panel className="quarters-fixture-panel">
          <SectionTitle eyebrow="FIXTURE LOCKER" title="Install Room Equipment" description="Each installed fixture unlocks a real server-authoritative quarters action." icon="module" />
          <div className="quarters-fixture-list">
            {fixtures.map(fixture => (
              <Card key={fixture.key} className={isInstalled(fixture.key) ? 'is-installed' : ''}>
                <div className="quarters-fixture-card__head"><span><NWIcon name={fixture.icon} size={24} /></span><div><h3>{fixture.name}</h3><p>{fixture.description}</p></div></div>
                <div className="trait-list"><Pill tone="neutral">{fixture.cost}</Pill><Pill tone="purple">{fixture.reward}</Pill></div>
                <Button size="sm" variant={isInstalled(fixture.key) ? 'ghost' : 'primary'} disabled={isInstalled(fixture.key) || !quarters} onClick={() => installFixture(fixture.key)}>{isInstalled(fixture.key) ? 'Installed' : 'Install in room'}</Button>
              </Card>
            ))}
          </div>
        </Panel>
      </div>

      <Panel tone="purple" depth="high" className="quarters-operations-panel">
        <SectionTitle eyebrow="OFF-DUTY OPERATIONS" title="Use Installed Fixtures" description="Fixture effects use persistent cooldowns and consume real inventory where listed." icon="events" />
        <ResponsiveGrid min="18rem">
          {fixtures.map(fixture => {
            const remaining = cooldownRemaining(cooldowns, fixture.cooldownKey, now);
            const installed = isInstalled(fixture.key);
            const ready = suppliesReady(fixture.key);
            return (
              <Card key={fixture.key} className={`quarters-operation-card ${installed ? 'is-online' : 'is-offline'}`}>
                <div className="quarters-operation-card__status"><NWIcon name={fixture.icon} size={28} /><Badge tone={!installed ? 'neutral' : remaining > 0 ? 'warning' : ready ? 'success' : 'danger'}>{!installed ? 'NOT INSTALLED' : remaining > 0 ? formatCountdown(remaining) : ready ? 'READY' : 'SUPPLIES NEEDED'}</Badge></div>
                <h3>{fixture.name}</h3>
                <p>{fixture.description}</p>
                <small>{fixture.cost}</small>
                <strong>{fixture.reward}</strong>
                <Button fullWidth disabled={!installed || !ready || remaining > 0} onClick={() => void action('/api/v1/quarters/use', { objectKey: fixture.key }, fixture.action)}>{fixture.action}</Button>
              </Card>
            );
          })}
        </ResponsiveGrid>
      </Panel>

      {!idleCrew.length && <Notification title="All crew deployed" tone="info">Recovery and galley actions remain available, but no off-duty crew can receive the morale bonus until a team returns.</Notification>}
    </div>
  );
}
