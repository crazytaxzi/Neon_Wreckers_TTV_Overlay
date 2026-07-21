import { Card, Notification, NWIcon, ScrollableList, type IconName, type Tone } from '@neon-wreckers/ui';
import type { ActionCooldown, HistoryEntry, PlayerNotification, StationModule } from './model.js';

export function CommandAction({ icon, title, detail, onClick, tone = 'success', disabled = false }: { icon: IconName; title: string; detail: string; onClick: () => void; tone?: Tone; disabled?: boolean }) {
  return (
    <button className={`command-action nw-tone--${tone}`} onClick={onClick} disabled={disabled}>
      <span className="command-action__icon"><NWIcon name={icon} size={25} /></span>
      <span className="nw-eyebrow">COMMAND</span>
      <strong>{title}</strong>
      <small>{detail}</small>
      <i aria-hidden="true">EXECUTE</i>
    </button>
  );
}

export function formatCountdown(milliseconds: number) {
  if (milliseconds <= 0) return '00:00';
  const totalSeconds = Math.ceil(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor(totalSeconds % 3600 / 60);
  const seconds = totalSeconds % 60;
  return hours > 0 ? `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}` : `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function cooldownRemaining(cooldowns: ActionCooldown[], actionKey: string, now: number) {
  const cooldown = cooldowns.find(candidate => candidate.actionKey === actionKey);
  return cooldown ? Date.parse(cooldown.expiresAt) - now : 0;
}
export function HistoryList({ history, limit = 12 }: { history: HistoryEntry[]; limit?: number }) {
  const entries = (history ?? []).slice(0, limit);
  if (!entries.length) return <Notification title="No station events" tone="info">The permanent log is currently empty.</Notification>;
  return (
    <ScrollableList label="Station history" maxHeight={limit > 12 ? '65vh' : '24rem'}>
      {entries.map((entry, index) => <Card key={entry.id ?? index} className="history-entry"><div className="history-entry__index nw-numeric">{String(index + 1).padStart(2, '0')}</div><NWIcon name="events" size={16} /><div><strong>{entry.title}</strong><p>{entry.body}</p></div><span className="nw-numeric">{entry.createdAt ? new Date(entry.createdAt).toLocaleString() : 'LIVE'}</span></Card>)}
    </ScrollableList>
  );
}


export function notificationTone(notification: PlayerNotification): Tone {
  if (notification.priority >= 80 || /critical|danger|breach|failure/i.test(`${notification.type} ${notification.title}`)) return 'danger';
  if (notification.priority >= 50 || /warning|alert|low/i.test(`${notification.type} ${notification.title}`)) return 'warning';
  return notification.readAt ? 'neutral' : 'info';
}

export function quartersObjectIcon(key: string): IconName {
  if (key.includes('relic')) return 'museum';
  if (key.includes('espresso')) return 'reactor';
  if (key.includes('bed')) return 'module';
  return 'inventory';
}

export function toneForValue(value?: number): Tone {
  if ((value ?? 0) < 35) return 'danger';
  if ((value ?? 0) < 60) return 'warning';
  return 'success';
}

export function riskTone(risk?: string): Tone {
  const value = String(risk ?? '').toLowerCase();
  if (value.includes('high') || value.includes('extreme')) return 'danger';
  if (value.includes('medium') || value.includes('moderate')) return 'warning';
  return 'info';
}

export function rarityTone(rarity?: string): Tone {
  if (rarity === 'legendary' || rarity === 'epic') return 'purple';
  if (rarity === 'rare') return 'warning';
  if (rarity === 'uncommon') return 'info';
  return 'neutral';
}

export function rarityRank(rarity?: string) {
  return { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4 }[String(rarity ?? '').toLowerCase()] ?? 0;
}

export function expeditionTone(status?: string): Tone {
  if (status === 'resolved') return 'success';
  if (status === 'failed') return 'danger';
  if (status === 'active') return 'info';
  return 'neutral';
}

export function moduleIcon(slug?: string): IconName {
  const value = String(slug ?? '');
  if (value.includes('refinery')) return 'reactor';
  if (value.includes('cargo') || value.includes('storage')) return 'storage';
  if (value.includes('habitat') || value.includes('medical')) return 'population';
  if (value.includes('museum')) return 'museum';
  if (value.includes('research')) return 'research';
  if (value.includes('command')) return 'station';
  return 'module';
}

export function moduleEffectDescription(module: StationModule) {
  if ('scanBonus' in module.effects) return `Adds ${Math.round(Number(module.effects.scanBonus) * 100)}% salvage success.`;
  if ('storage' in module.effects) return `Adds ${Number(module.effects.storage).toLocaleString()} station storage and ${Math.round(Number(module.effects.cargoYieldBonus ?? 0) * 100)}% Cargo yield.`;
  if ('craftingSpeedBonus' in module.effects) return `Reduces refinery crafting time by ${Math.round(Number(module.effects.craftingSpeedBonus) * 100)}%.`;
  if ('populationCapacity' in module.effects) return `Supports ${Number(module.effects.populationCapacity).toLocaleString()} additional residents and crew quarters.`;
  if ('injuryRecoveryBonus' in module.effects) return `Reduces crew recovery time by ${Math.round(Number(module.effects.injuryRecoveryBonus) * 100)}%.`;
  if ('rareDiscoveryBonus' in module.effects) return `Adds ${Math.round(Number(module.effects.rareDiscoveryBonus) * 100)}% rare discovery chance.`;
  if ('artifactDailyIntake' in module.effects) return `Processes ${Number(module.effects.artifactDailyIntake).toLocaleString()} artifacts daily with a ${Math.round(Number(module.effects.donationRewardBonus) * 100)}% reward bonus.`;
  if ('tradeEnabled' in module.effects) return `Enables station trading and adds ${Math.round(Number(module.effects.marketSellBonus ?? 0) * 100)}% vendor proceeds.`;
  if ('shipRepairDiscount' in module.effects) return `Reduces ship repair costs by ${Math.round(Number(module.effects.shipRepairDiscount) * 100)}%.`;
  return 'Provides station infrastructure support.';
}

export function itemIcon(slug?: string): IconName {
  const value = String(slug ?? '');
  if (value.includes('fuel')) return 'fuel';
  if (value.includes('data') || value.includes('electronics')) return 'data';
  if (value.includes('relic')) return 'museum';
  if (value.includes('credit')) return 'credits';
  if (value.includes('scrap') || value.includes('alloy')) return 'resources';
  return 'inventory';
}
