import type { EventPresentation, EventSeverity } from '@neon-wreckers/contracts';

type PresentableEvent = {
  category?: string | null;
  severity?: string | null;
  title?: string | null;
  body?: string | null;
  details?: unknown;
};

const categoryDefaults: Record<string, Omit<EventPresentation, 'fallbackText'>> = {
  community: { severity: 'positive', category: 'community', priority: 40, breaking: false, iconKey: 'crew', localizationKey: 'event.community' },
  construction: { severity: 'positive', category: 'construction', priority: 45, breaking: false, iconKey: 'construction', localizationKey: 'event.construction' },
  expedition: { severity: 'info', category: 'expedition', priority: 50, breaking: false, iconKey: 'broadcast', localizationKey: 'event.expedition' },
  salvage: { severity: 'positive', category: 'salvage', priority: 50, breaking: false, iconKey: 'salvage', localizationKey: 'event.salvage' },
  event: { severity: 'warning', category: 'event', priority: 70, breaking: false, iconKey: 'danger', localizationKey: 'event.runtime' },
  viewer: { severity: 'viewer', category: 'viewer', priority: 60, breaking: false, iconKey: 'broadcast', localizationKey: 'event.viewer' },
  integration: { severity: 'viewer', category: 'integration', priority: 55, breaking: false, iconKey: 'broadcast', localizationKey: 'event.integration' },
  system: { severity: 'info', category: 'system', priority: 35, breaking: false, iconKey: 'station', localizationKey: 'event.system' }
};

function normalizeSeverity(value?: string | null): EventSeverity | null {
  const normalized = value?.toLowerCase();
  return normalized === 'positive' || normalized === 'info' || normalized === 'viewer' || normalized === 'warning' || normalized === 'critical' ? normalized : null;
}

export function presentationForEvent(event: PresentableEvent): EventPresentation {
  const category = String(event.category || 'system').toLowerCase();
  const base = categoryDefaults[category] ?? { ...categoryDefaults.system, category, localizationKey: `event.${category}` };
  const explicitSeverity = normalizeSeverity(event.severity);
  const severity = explicitSeverity ?? base.severity;
  const breaking = severity === 'critical' || Boolean((event.details as { breaking?: unknown } | null)?.breaking);
  return {
    ...base,
    severity,
    priority: breaking ? Math.max(base.priority, 90) : base.priority,
    breaking,
    fallbackText: String(event.title || event.body || 'Station event')
  };
}

export function withEventPresentation<T extends PresentableEvent>(event: T): T & { presentation: EventPresentation } {
  return { ...event, presentation: presentationForEvent(event) };
}
