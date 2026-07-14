import { defaultTheme } from '@neon-wreckers/ui/theme';
export type OverlayTheme = {
  positive: string;
  info: string;
  viewer: string;
  warning: string;
  critical: string;
  panel: string;
  panelAlt: string;
  text: string;
  muted: string;
};

export type OverlayConfig = {
  status: {
    top: number;
    left: number;
    width: number;
    scale: number;
    visible: boolean;
  };
  ticker: {
    top: number;
    width: number;
    scale: number;
    rotationSeconds: number;
    visible: boolean;
  };
  feedIndicator: boolean;
  scanlines: boolean;
  glass: boolean;
  breakingNews: boolean;
  previewBackground: boolean;
  visibility: {
    tickerHoldSeconds: number;
    statusHoldSeconds: number;
    fadeSeconds: number;
    keepVisibleInPreview: boolean;
  };
  theme: OverlayTheme;
};

export const defaultConfig: OverlayConfig = {
  status: { top: 28, left: 28, width: 430, scale: 1, visible: true },
  ticker: { top: 28, width: 1120, scale: 1, rotationSeconds: 7.6, visible: true },
  feedIndicator: true,
  scanlines: true,
  glass: true,
  breakingNews: true,
  previewBackground: false,
  visibility: {
    tickerHoldSeconds: 9,
    statusHoldSeconds: 16,
    fadeSeconds: 2.2,
    keepVisibleInPreview: true
  },
  theme: {
    positive: defaultTheme.colors.green,
    info: defaultTheme.colors.cyan,
    viewer: defaultTheme.colors.purple,
    warning: defaultTheme.colors.orange,
    critical: defaultTheme.colors.red,
    panel: defaultTheme.colors.glassStrong,
    panelAlt: defaultTheme.colors.surfaceRaised,
    text: defaultTheme.colors.text,
    muted: defaultTheme.colors.textMuted
  }
};

function numberParam(params: URLSearchParams, key: string, fallback: number): number {
  const raw = params.get(key);
  if (raw == null || raw.trim() === '') return fallback;
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

function boolParam(params: URLSearchParams, key: string, fallback: boolean): boolean {
  const value = params.get(key);
  if (value == null) return fallback;
  return !['0', 'false', 'off', 'no'].includes(value.toLowerCase());
}

function colorParam(params: URLSearchParams, key: string, fallback: string): string {
  const value = params.get(key);
  return value && /^#?[0-9a-f]{6}$/i.test(value) ? (value.startsWith('#') ? value : `#${value}`) : fallback;
}

export async function loadOverlayConfig(): Promise<OverlayConfig> {
  let fileConfig: Partial<OverlayConfig> = {};
  try {
    const response = await fetch('/overlay/overlay-config.json', { cache: 'no-store' });
    if (response.ok) fileConfig = await response.json();
  } catch {
    // A missing config file must never take the overlay down.
  }

  const merged: OverlayConfig = {
    ...defaultConfig,
    ...fileConfig,
    status: { ...defaultConfig.status, ...(fileConfig.status ?? {}) },
    ticker: { ...defaultConfig.ticker, ...(fileConfig.ticker ?? {}) },
    visibility: { ...defaultConfig.visibility, ...(fileConfig.visibility ?? {}) },
    theme: { ...defaultConfig.theme, ...(fileConfig.theme ?? {}) }
  };

  const params = new URLSearchParams(window.location.search);
  return {
    ...merged,
    status: {
      ...merged.status,
      top: numberParam(params, 'statusTop', merged.status.top),
      left: numberParam(params, 'statusLeft', merged.status.left),
      width: numberParam(params, 'statusWidth', merged.status.width),
      scale: numberParam(params, 'statusScale', merged.status.scale),
      visible: boolParam(params, 'status', true)
    },
    ticker: {
      ...merged.ticker,
      top: numberParam(params, 'tickerTop', merged.ticker.top),
      width: numberParam(params, 'tickerWidth', merged.ticker.width),
      scale: numberParam(params, 'tickerScale', merged.ticker.scale),
      rotationSeconds: numberParam(params, 'rotation', merged.ticker.rotationSeconds),
      visible: boolParam(params, 'ticker', true)
    },
    feedIndicator: boolParam(params, 'feedIndicator', merged.feedIndicator),
    scanlines: boolParam(params, 'scanlines', merged.scanlines),
    glass: boolParam(params, 'glass', merged.glass),
    breakingNews: boolParam(params, 'breaking', merged.breakingNews),
    previewBackground: boolParam(params, 'preview', false),
    theme: {
      ...merged.theme,
      positive: colorParam(params, 'positive', merged.theme.positive),
      viewer: colorParam(params, 'viewer', merged.theme.viewer),
      warning: colorParam(params, 'warning', merged.theme.warning),
      critical: colorParam(params, 'critical', merged.theme.critical)
    }
  };
}
