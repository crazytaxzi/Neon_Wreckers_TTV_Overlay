import type { IconName, Tone } from '@neon-wreckers/ui';

export type PresentationSurface = 'player' | 'admin' | 'overlay';
export type PresentationVariant = 'primary' | 'compact' | 'record' | 'telemetry' | 'event';

export type FeaturePresentation = {
  id: string;
  visibleName: string;
  category: 'command' | 'station' | 'logistics' | 'personal' | 'system';
  icon: IconName;
  tone: Tone;
  variants: Partial<Record<PresentationSurface, PresentationVariant>>;
  capabilities: {
    player: boolean;
    admin: boolean;
    overlay: boolean;
  };
};

export type SemanticPresentation = {
  label: string;
  tone: Tone;
  icon: IconName;
  rank: number;
};

export const featurePresentationRegistry = {
  home: {
    id: 'home',
    visibleName: 'Command Center',
    category: 'command',
    icon: 'station',
    tone: 'success',
    variants: { player: 'primary', admin: 'compact', overlay: 'telemetry' },
    capabilities: { player: true, admin: true, overlay: true }
  },
  salvage: {
    id: 'salvage',
    visibleName: 'Salvage',
    category: 'command',
    icon: 'salvage',
    tone: 'info',
    variants: { player: 'primary', admin: 'compact', overlay: 'telemetry' },
    capabilities: { player: true, admin: true, overlay: true }
  },
  construction: {
    id: 'construction',
    visibleName: 'Construction',
    category: 'station',
    icon: 'construction',
    tone: 'warning',
    variants: { player: 'primary', admin: 'record', overlay: 'event' },
    capabilities: { player: true, admin: true, overlay: true }
  },
  inventory: {
    id: 'inventory',
    visibleName: 'Salvage Hold',
    category: 'logistics',
    icon: 'inventory',
    tone: 'info',
    variants: { player: 'primary', admin: 'record' },
    capabilities: { player: true, admin: true, overlay: false }
  },
  market: {
    id: 'market',
    visibleName: 'Market',
    category: 'logistics',
    icon: 'trade',
    tone: 'success',
    variants: { player: 'primary', admin: 'record' },
    capabilities: { player: true, admin: true, overlay: false }
  },
  expeditions: {
    id: 'expeditions',
    visibleName: 'Expeditions',
    category: 'station',
    icon: 'expedition',
    tone: 'purple',
    variants: { player: 'primary', admin: 'record', overlay: 'event' },
    capabilities: { player: true, admin: true, overlay: true }
  },
  alerts: {
    id: 'alerts',
    visibleName: 'Alerts',
    category: 'system',
    icon: 'notifications',
    tone: 'warning',
    variants: { player: 'record', admin: 'record', overlay: 'event' },
    capabilities: { player: true, admin: true, overlay: true }
  }
} satisfies Record<string, FeaturePresentation>;

export const rarityPresentation = {
  common: { label: 'Common', tone: 'neutral', icon: 'resources', rank: 0 },
  uncommon: { label: 'Uncommon', tone: 'success', icon: 'resources', rank: 1 },
  rare: { label: 'Rare', tone: 'info', icon: 'scanner', rank: 2 },
  epic: { label: 'Epic', tone: 'purple', icon: 'signal', rank: 3 },
  legendary: { label: 'Legendary', tone: 'warning', icon: 'station', rank: 4 }
} satisfies Record<string, SemanticPresentation>;

export const riskPresentation = {
  low: { label: 'Low Risk', tone: 'success', icon: 'integrity', rank: 0 },
  moderate: { label: 'Moderate Risk', tone: 'info', icon: 'scanner', rank: 1 },
  elevated: { label: 'Elevated Risk', tone: 'warning', icon: 'warning', rank: 2 },
  high: { label: 'High Risk', tone: 'danger', icon: 'danger', rank: 3 },
  critical: { label: 'Critical Risk', tone: 'danger', icon: 'danger', rank: 4 }
} satisfies Record<string, SemanticPresentation>;

export const statusPresentation = {
  active: { label: 'Active', tone: 'success', icon: 'network', rank: 0 },
  ready: { label: 'Ready', tone: 'success', icon: 'integrity', rank: 0 },
  building: { label: 'Building', tone: 'info', icon: 'construction', rank: 1 },
  pending: { label: 'Pending', tone: 'info', icon: 'events', rank: 1 },
  locked: { label: 'Locked', tone: 'neutral', icon: 'settings', rank: 2 },
  warning: { label: 'Warning', tone: 'warning', icon: 'warning', rank: 3 },
  damaged: { label: 'Damaged', tone: 'danger', icon: 'danger', rank: 4 },
  disabled: { label: 'Disabled', tone: 'danger', icon: 'danger', rank: 4 },
  failed: { label: 'Failed', tone: 'danger', icon: 'danger', rank: 4 }
} satisfies Record<string, SemanticPresentation>;

export const resourcePresentation = {
  credits: { label: 'Credits', tone: 'success', icon: 'credits', rank: 0 },
  scrap: { label: 'Scrap', tone: 'info', icon: 'resources', rank: 0 },
  electronics: { label: 'Electronics', tone: 'purple', icon: 'signal', rank: 0 },
  alloys: { label: 'Alloys', tone: 'warning', icon: 'construction', rank: 0 },
  researchData: { label: 'Research Data', tone: 'purple', icon: 'data', rank: 0 },
  fuel: { label: 'Fuel Cells', tone: 'purple', icon: 'power', rank: 0 }
} satisfies Record<string, SemanticPresentation>;

function normalizeKey(value: unknown): string {
  return String(value ?? '').trim().toLowerCase().replaceAll('_', '-').replaceAll(' ', '-');
}

export function presentationForRarity(value: unknown): SemanticPresentation {
  const key = normalizeKey(value);
  return rarityPresentation[key as keyof typeof rarityPresentation] ?? rarityPresentation.common;
}

export function presentationForRisk(value: unknown): SemanticPresentation {
  const key = normalizeKey(value);
  if (key.includes('critical') || key.includes('extreme')) return riskPresentation.critical;
  if (key.includes('high') || key.includes('severe')) return riskPresentation.high;
  if (key.includes('elevated') || key.includes('danger')) return riskPresentation.elevated;
  if (key.includes('moderate') || key.includes('medium')) return riskPresentation.moderate;
  return riskPresentation.low;
}

export function presentationForStatus(value: unknown): SemanticPresentation {
  const key = normalizeKey(value);
  return statusPresentation[key as keyof typeof statusPresentation] ?? {
    label: String(value || 'Unknown'),
    tone: 'neutral',
    icon: 'data',
    rank: 2
  };
}

export function presentationForResource(value: unknown): SemanticPresentation {
  const raw = String(value ?? '').trim();
  const camel = raw.replace(/[-_ ]+(.)/g, (_, character: string) => character.toUpperCase());
  return resourcePresentation[camel as keyof typeof resourcePresentation] ?? {
    label: raw || 'Resource',
    tone: 'neutral',
    icon: 'resources',
    rank: 0
  };
}

export function formatCompactNumber(value: unknown, locale = 'en-US'): string {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) return '0';
  return Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(numeric);
}

export function formatCredits(value: unknown, locale = 'en-US'): string {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) return '0 cr';
  return `${Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(numeric)} cr`;
}

export function formatPercent(value: unknown, maximumFractionDigits = 0): string {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) return '0%';
  return `${numeric.toFixed(maximumFractionDigits)}%`;
}
