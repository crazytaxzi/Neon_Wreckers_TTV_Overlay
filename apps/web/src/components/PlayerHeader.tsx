import { Button, NWIcon, ProfileChip, Tooltip, type IconName } from '@neon-wreckers/ui';
import type { CurrentUser, InventoryItem, PlayerNotification } from '../model.js';

const resourceDefinitions: Array<{ slug: string; label: string; icon: IconName; tone: string }> = [
  { slug: 'scrap', label: 'Scrap', icon: 'resources', tone: 'green' },
  { slug: 'electronics', label: 'Electronics', icon: 'data', tone: 'cyan' },
  { slug: 'alloys', label: 'Alloys', icon: 'integrity', tone: 'purple' },
  { slug: 'fuel', label: 'Fuel', icon: 'fuel', tone: 'orange' }
];

function quantityFor(inventory: InventoryItem[], slug: string) {
  return inventory.find(item => item.itemSlug === slug)?.quantity ?? 0;
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
            <strong className="nw-numeric">{quantityFor(inventory, resource.slug).toLocaleString()}</strong>
          </button>
        ))}
        <button type="button" className="player-resource player-resource--purple" onClick={() => onNavigate('market')}>
          <NWIcon name="credits" size={17} />
          <span>Credits</span>
          <strong className="nw-numeric">{(me.player?.credits ?? 0).toLocaleString()}</strong>
        </button>
      </div>

      <div className="player-header-tools">
        <Tooltip content="Refresh station telemetry">
          <Button variant="ghost" size="sm" icon={<NWIcon name="diagnostics" size={16} />} onClick={onRefresh}>Resync</Button>
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
    </header>
  );
}
