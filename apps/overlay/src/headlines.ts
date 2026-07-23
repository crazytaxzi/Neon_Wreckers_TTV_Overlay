import type { HistoryRecord, StationAlert } from '@neon-wreckers/contracts';

export type Severity = 'positive' | 'info' | 'viewer' | 'warning' | 'critical';

export type Headline = {
  id: string;
  label: string;
  title: string;
  body: string;
  severity: Severity;
  createdAt: number;
  breaking?: boolean;
};

export const MAX_HEADLINES = 40;

export function classifyHeadline(input: string, explicit?: string): Severity {
  const text = `${explicit ?? ''} ${input}`.toLowerCase();
  if (/critical|breach|destroy|attack|failure|emergency|dead|lost|boss/.test(text)) return 'critical';
  if (/warning|threat|danger|unstable|damage|pirate|storm|low/.test(text)) return 'warning';
  if (/viewer|twitch|raid|follow|redeem|subscriber|cheer|joined/.test(text)) return 'viewer';
  if (/complete|success|recovered|upgrade|repair|found|milestone|online/.test(text)) return 'positive';
  return 'info';
}

export function isBreakingHeadline(input: string, severity: Severity): boolean {
  return severity === 'critical' || /boss|attack|breach|emergency|reactor|pirate/.test(input.toLowerCase());
}

export function headlineFromHistory(entry: HistoryRecord, now = Date.now()): Headline {
  const title = String(entry.title || 'Station dispatch');
  const body = String(entry.body || 'New activity recorded aboard Station Zero.');
  const severity = classifyHeadline(`${title} ${body}`, entry.category);
  return {
    id: String(entry.id || `${entry.createdAt || now}-${title}-${body}`),
    label: String(entry.category || 'STATION NEWS').replaceAll('_', ' ').toUpperCase(),
    title,
    body,
    severity,
    createdAt: Date.parse(String(entry.createdAt ?? '')) || now,
    breaking: isBreakingHeadline(`${title} ${body}`, severity)
  };
}

export function headlineFromAlert(alert: StationAlert, now = Date.now()): Headline {
  const title = String(alert.title || 'Station alert');
  const body = String(alert.body || 'New station alert received.');
  const severity = classifyHeadline(`${title} ${body}`, alert.severity);
  return {
    id: String(alert.id || `${alert.createdAt || now}-${title}`),
    label: severity === 'critical' ? 'BREAKING ALERT' : 'STATION ALERT',
    title,
    body,
    severity,
    createdAt: Date.parse(String(alert.createdAt ?? '')) || now,
    breaking: isBreakingHeadline(`${title} ${body}`, severity)
  };
}

export function sortAndLimitHeadlines(entries: Headline[], limit = MAX_HEADLINES): Headline[] {
  const ids = new Set<string>();
  return [...entries]
    .sort((a, b) => Number(Boolean(b.breaking)) - Number(Boolean(a.breaking)) || b.createdAt - a.createdAt)
    .filter(entry => !ids.has(entry.id) && Boolean(ids.add(entry.id)))
    .slice(0, Math.max(1, limit));
}
