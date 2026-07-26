import { useState } from 'react';
import { Button, Modal, NWIcon, ProfileChip, ResponsiveGrid, Tooltip, type IconName } from '@neon-wreckers/ui';
import type { CurrentUser, InventoryItem, PlayerNotification } from '../model.js';

const resourceDefinitions: Array<{ slug: string; label: string; icon: IconName; tone: string }> = [
  { slug: 'scrap', label: 'Scrap', icon: 'resources', tone: 'green' },
  { slug: 'electronics', label: 'Electronics', icon: 'data', tone: 'cyan' },
  { slug: 'alloys', label: 'Alloys', icon: 'integrity', tone: 'purple' },
  { slug: 'fuel', label: 'Fuel', icon: 'fuel', tone: 'orange' }
];

const actionDestinations: Array<{ id: string; label: string; detail: string; icon: IconName }> = [
  { id: 'salvage', label: 'Salvage target', detail: 'Scan and deploy recovery teams', icon: 'salvage' },
  { id: 'crafting', label: 'Craft items', detail: 'Open fabrication recipes', icon: 'resources' },
  { id: 'ships', label: 'Manage ships', detail: 'Rename, refuel, repair, upgrade, or buy', icon: 'expedition' },
  { id: 'crew', label: 'Manage crew', detail: 'Recruit and train personnel', icon: 'crew' },
  { id: 'expeditions', label: 'Launch expedition', detail: 'Choose a mission, ship, and crew', icon: 'scanner' },
  { id: 'construction', label: 'Build station', detail: 'Start projects and contribute materials', icon: 'construction' },
  { id: 'market', label: 'Trade items', detail: 'Buy, sell, auction, or cancel listings', icon: 'trade' },
  { id: 'museum', label: 'Donate artifacts', detail: 'Contribute collection items', icon: 'museum' },
  { id: 'quarters', label: 'Edit quarters', detail: 'Arrange fixtures and use room actions', icon: 'module' },
  { id: 'profile', label: 'Career and profile', detail: 'Review progression and career options', icon: 'profile' },
  { id: 'notifications', label: 'Notifications', detail: 'Review personal alerts', icon: 'notifications' },
  { id: 'settings', label: 'Settings', detail: 'Accessibility and display controls', icon: 'settings' }
];

const compactNumber = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1
});

function quantityFor(inventory: InventoryItem[], slug: string) {
  return inventory.find(item => item.itemSlug === slug)?.quantity ?? 0;
}

function formatHeaderValue(value: number) {
  return Math.abs(value) >= 10_000 ? compactNumber.format(value) : value.toLocaleString();
}

export function PlayerHeader({
  me,
  inventory,
  notifications,
  onNavigate,
  onRefresh,
  onSignOut
}: {
  me: CurrentUser;
  inventory: InventoryItem[];
  notifications: PlayerNotification[];
  onNavigate: (destination: string) => void;
  onRefresh: () => void;
  onSignOut: () => void;
}) {
  const [actionsOpen, setActionsOpen] = useState(false);
  const unread = notifications.filter(notification => !notification.readAt).length;
  return (
    <header className="player-command-header">
      <button className="player-brand" type="button" onClick={() => onNavigate('station')} aria-label="Open command center">
        <span className="player-brand__mark"><NWIcon name="wreck" size={25} /></span>
        <span className="player-brand__copy"><b>NEON</b><strong>WRECKERS</strong></span>
      </button>

      <div className="player-resource-deck" aria-label="Personal resources">
        {resourceDefinitions.map(resource => (
          <button key={resource.slug} type="button" className={`player-resource player-resource--${resource.tone}`} onClick={() => onNavigate('inventory')}>
            <NWIcon name={resource.icon} size={17} />
            <span>{resource.label}</span>
            <strong className="nw-numeric">{formatHeaderValue(quantityFor(inventory, resource.slug))}</strong>
          </button>
        ))}
        <button type="button" className="player-resource player-resource--purple" onClick={() => onNavigate('market')}>
          <NWIcon name="credits" size={17} />
          <span>Credits</span>
          <strong className="nw-numeric">{formatHeaderValue(me.player?.credits ?? 0)}</strong>
        </button>
      </div>

      <div className="player-header-tools">
        <Button className="player-header-action" aria-label="Open actions" variant="primary" size="sm" icon={<NWIcon name="terminal" size={16} />} onClick={() => setActionsOpen(true)}>Actions</Button>
        <Tooltip content="Refresh station telemetry">
          <Button className="player-header-resync" aria-label="Resync station telemetry" variant="ghost" size="sm" icon={<NWIcon name="diagnostics" size={16} />} onClick={onRefresh}>Resync</Button>
        </Tooltip>
        <button className="player-alert-button" type="button" onClick={() => onNavigate('notifications')} aria-label={`${unread} unread notifications`}>
          <NWIcon name="notifications" size={19} />
          {unread > 0 && <span>{Math.min(unread, 99)}</span>}
        </button>
        <button className="player-profile-button" type="button" onClick={() => onNavigate('profile')}>
          <ProfileChip name={me.displayName} detail={`Level ${me.player?.level ?? 1} · ${me.player?.title ?? 'Wrecker'}`} avatarUrl={me.avatarUrl || undefined} />
        </button>
        <Button className="player-signout" variant="ghost" size="sm" onClick={onSignOut}>Sign out</Button>
      </div>
      <Modal open={actionsOpen} onClose={() => setActionsOpen(false)} title="What do you want to do?" description="Every player workflow is available here; selecting one opens its workspace and action windows." size="lg">
        <ResponsiveGrid min="14rem" className="player-action-hub">
          {actionDestinations.map(destination => <Button key={destination.id} variant="ghost" onClick={() => { onNavigate(destination.id); setActionsOpen(false); }}><NWIcon name={destination.icon} size={20} /><span><strong>{destination.label}</strong><small>{destination.detail}</small></span></Button>)}
        </ResponsiveGrid>
      </Modal>
    </header>
  );
}
