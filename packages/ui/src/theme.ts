import { useLayoutEffect, type PropsWithChildren, type ReactElement } from 'react';

export type ThemeDefinition = {
  id: string;
  colors: {
    void: string;
    canvas: string;
    surface: string;
    surfaceRaised: string;
    glass: string;
    glassStrong: string;
    text: string;
    textMuted: string;
    textDim: string;
    green: string;
    purple: string;
    cyan: string;
    orange: string;
    red: string;
    line: string;
    lineStrong: string;
  };
  fonts: {
    display: string;
    body: string;
    mono: string;
  };
  typography: {
    display: string;
    title: string;
    section: string;
    panelHeader: string;
    body: string;
    small: string;
    caption: string;
    status: string;
    numeric: string;
  };
  spacing: Record<'1' | '2' | '3' | '4' | '5' | '6' | '8' | '10' | '12' | '16', string>;
  radius: {
    sharp: string;
    control: string;
    panel: string;
    pill: string;
  };
  border: {
    thin: string;
    strong: string;
  };
  blur: {
    glass: string;
    deep: string;
  };
  transparency: {
    panel: string;
    raised: string;
    overlay: string;
  };
  glow: {
    soft: string;
    active: string;
    warning: string;
    danger: string;
  };
  depth: {
    low: string;
    medium: string;
    high: string;
  };
  animation: {
    fast: string;
    normal: string;
    slow: string;
    easing: string;
  };
};

export type ThemeOverrides = {
  id?: string;
  colors?: Partial<ThemeDefinition['colors']>;
  fonts?: Partial<ThemeDefinition['fonts']>;
  typography?: Partial<ThemeDefinition['typography']>;
  spacing?: Partial<ThemeDefinition['spacing']>;
  radius?: Partial<ThemeDefinition['radius']>;
  border?: Partial<ThemeDefinition['border']>;
  blur?: Partial<ThemeDefinition['blur']>;
  transparency?: Partial<ThemeDefinition['transparency']>;
  glow?: Partial<ThemeDefinition['glow']>;
  depth?: Partial<ThemeDefinition['depth']>;
  animation?: Partial<ThemeDefinition['animation']>;
};

export const defaultTheme: ThemeDefinition = {
  id: 'station-zero',
  colors: {
    void: '#020408',
    canvas: '#070a0f',
    surface: '#0d1218',
    surfaceRaised: '#131b24',
    glass: 'rgba(12, 19, 25, 0.76)',
    glassStrong: 'rgba(10, 16, 22, 0.92)',
    text: '#edf7f3',
    textMuted: '#9aaba8',
    textDim: '#61716f',
    green: '#8dff5a',
    purple: '#ae5cff',
    cyan: '#58e6ff',
    orange: '#ff9d43',
    red: '#ff4d67',
    line: 'rgba(174, 255, 226, 0.13)',
    lineStrong: 'rgba(174, 255, 226, 0.28)'
  },
  fonts: {
    display: 'Bahnschrift, "DIN Alternate", "Arial Narrow", sans-serif',
    body: 'Inter, "Segoe UI Variable", "Segoe UI", sans-serif',
    mono: '"Cascadia Mono", "JetBrains Mono", "SFMono-Regular", Consolas, monospace'
  },
  typography: {
    display: 'clamp(1.75rem, 2.5vw, 3.25rem)',
    title: 'clamp(1.25rem, 1.5vw, 2rem)',
    section: 'clamp(1rem, 0.75vw + 0.75rem, 1.3rem)',
    panelHeader: '0.9rem',
    body: 'clamp(0.94rem, 0.35vw + 0.82rem, 1.08rem)',
    small: '0.78rem',
    caption: '0.68rem',
    status: '0.72rem',
    numeric: '1rem'
  },
  spacing: {
    '1': '0.25rem',
    '2': '0.5rem',
    '3': '0.75rem',
    '4': '1rem',
    '5': '1.25rem',
    '6': '1.5rem',
    '8': '2rem',
    '10': '2.5rem',
    '12': '3rem',
    '16': '4rem'
  },
  radius: {
    sharp: '0.125rem',
    control: '0.375rem',
    panel: '0.625rem',
    pill: '999rem'
  },
  border: {
    thin: '1px',
    strong: '2px'
  },
  blur: {
    glass: '14px',
    deep: '24px'
  },
  transparency: {
    panel: '0.82',
    raised: '0.94',
    overlay: '0.72'
  },
  glow: {
    soft: '0 0 18px rgba(var(--nw-color-green-rgb), 0.10)',
    active: '0 0 24px rgba(var(--nw-color-green-rgb), 0.22)',
    warning: '0 0 22px rgba(var(--nw-color-orange-rgb), 0.20)',
    danger: '0 0 24px rgba(var(--nw-color-red-rgb), 0.22)'
  },
  depth: {
    low: '0 8px 24px rgba(var(--nw-color-void-rgb), 0.20)',
    medium: '0 14px 34px rgba(var(--nw-color-void-rgb), 0.28)',
    high: '0 18px 48px rgba(var(--nw-color-void-rgb), 0.36)'
  },
  animation: {
    fast: '120ms',
    normal: '220ms',
    slow: '480ms',
    easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)'
  }
};

export function createTheme(id: string, overrides: ThemeOverrides = {}): ThemeDefinition {
  return {
    ...defaultTheme,
    ...overrides,
    id,
    colors: { ...defaultTheme.colors, ...overrides.colors },
    fonts: { ...defaultTheme.fonts, ...overrides.fonts },
    typography: { ...defaultTheme.typography, ...overrides.typography },
    spacing: { ...defaultTheme.spacing, ...overrides.spacing },
    radius: { ...defaultTheme.radius, ...overrides.radius },
    border: { ...defaultTheme.border, ...overrides.border },
    blur: { ...defaultTheme.blur, ...overrides.blur },
    transparency: { ...defaultTheme.transparency, ...overrides.transparency },
    glow: { ...defaultTheme.glow, ...overrides.glow },
    depth: { ...defaultTheme.depth, ...overrides.depth },
    animation: { ...defaultTheme.animation, ...overrides.animation }
  };
}

export const highContrastTheme = createTheme('station-zero-high-contrast', {
  colors: {
    canvas: '#020304',
    surface: '#080d10',
    surfaceRaised: '#10191d',
    text: '#ffffff',
    textMuted: '#c8d8d4',
    line: 'rgba(229, 255, 247, 0.30)',
    lineStrong: 'rgba(229, 255, 247, 0.58)'
  }
});

const colorVarNames: Record<keyof ThemeDefinition['colors'], string> = {
  void: '--nw-color-void',
  canvas: '--nw-color-canvas',
  surface: '--nw-color-surface',
  surfaceRaised: '--nw-color-surface-raised',
  glass: '--nw-color-glass',
  glassStrong: '--nw-color-glass-strong',
  text: '--nw-color-text',
  textMuted: '--nw-color-text-muted',
  textDim: '--nw-color-text-dim',
  green: '--nw-color-green',
  purple: '--nw-color-purple',
  cyan: '--nw-color-cyan',
  orange: '--nw-color-orange',
  red: '--nw-color-red',
  line: '--nw-color-line',
  lineStrong: '--nw-color-line-strong'
};

function colorToRgbChannels(color: string): string | undefined {
  const normalized = color.trim().replace(/^#/, '');
  const expanded = normalized.length === 3
    ? normalized.split('').map(character => `${character}${character}`).join('')
    : normalized;
  if (!/^[0-9a-fA-F]{6}$/.test(expanded)) return undefined;
  return [0, 2, 4]
    .map(index => Number.parseInt(expanded.slice(index, index + 2), 16))
    .join(', ');
}

export function themeToCssVariables(theme: ThemeDefinition): Record<string, string> {
  const variables: Record<string, string> = {};
  for (const [key, value] of Object.entries(theme.colors)) {
    const colorKey = key as keyof ThemeDefinition['colors'];
    const variableName = colorVarNames[colorKey];
    variables[variableName] = value;
    const rgbChannels = colorToRgbChannels(value);
    if (rgbChannels) variables[`${variableName}-rgb`] = rgbChannels;
  }
  for (const [key, value] of Object.entries(theme.typography)) variables[`--nw-type-${key.replace(/[A-Z]/g, character => `-${character.toLowerCase()}`)}`] = value;
  for (const [key, value] of Object.entries(theme.spacing)) variables[`--nw-space-${key}`] = value;
  for (const [key, value] of Object.entries(theme.radius)) variables[`--nw-radius-${key}`] = value;
  for (const [key, value] of Object.entries(theme.border)) variables[`--nw-border-${key}`] = value;
  for (const [key, value] of Object.entries(theme.blur)) variables[`--nw-blur-${key}`] = value;
  for (const [key, value] of Object.entries(theme.transparency)) variables[`--nw-alpha-${key}`] = value;
  for (const [key, value] of Object.entries(theme.glow)) variables[`--nw-glow-${key}`] = value;
  for (const [key, value] of Object.entries(theme.depth)) variables[`--nw-depth-${key}`] = value;
  for (const [key, value] of Object.entries(theme.animation)) variables[`--nw-motion-${key}`] = value;
  variables['--nw-font-display'] = theme.fonts.display;
  variables['--nw-font-body'] = theme.fonts.body;
  variables['--nw-font-mono'] = theme.fonts.mono;
  return variables;
}

export function applyTheme(theme: ThemeDefinition, target?: HTMLElement): void {
  if (typeof document === 'undefined') return;
  const root = target ?? document.documentElement;
  for (const [property, value] of Object.entries(themeToCssVariables(theme))) {
    root.style.setProperty(property, value);
  }
  root.dataset.nwTheme = theme.id;
}

export function ThemeProvider({ theme = defaultTheme, children }: PropsWithChildren<{ theme?: ThemeDefinition }>): ReactElement {
  useLayoutEffect(() => applyTheme(theme), [theme]);
  return children as ReactElement;
}
