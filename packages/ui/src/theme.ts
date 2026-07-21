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

const baseTheme: ThemeDefinition = {
  id: 'neon-wreckers-stream',
  colors: {
    void: '#010204',
    canvas: '#05070b',
    surface: '#0a0e14',
    surfaceRaised: '#111821',
    glass: 'rgba(8, 13, 18, 0.78)',
    glassStrong: 'rgba(6, 10, 15, 0.94)',
    text: '#f2f7f4',
    textMuted: '#a4b0ad',
    textDim: '#66716f',
    green: '#9cff16',
    purple: '#bb4dff',
    cyan: '#54ddff',
    orange: '#ff9b42',
    red: '#ff405c',
    line: 'rgba(201, 222, 216, 0.14)',
    lineStrong: 'rgba(210, 232, 226, 0.30)'
  },
  fonts: {
    display: 'Bahnschrift, "DIN Alternate", "Arial Narrow", "Segoe UI", sans-serif',
    body: '"Segoe UI Variable", "Segoe UI", Inter, system-ui, sans-serif',
    mono: '"Cascadia Mono", "SFMono-Regular", Consolas, monospace'
  },
  typography: {
    display: 'clamp(1.65rem, 2.2vw, 3.1rem)',
    title: 'clamp(1.2rem, 1.35vw, 1.9rem)',
    section: 'clamp(1rem, 0.65vw + 0.76rem, 1.3rem)',
    panelHeader: '0.86rem',
    body: 'clamp(0.94rem, 0.28vw + 0.84rem, 1.06rem)',
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
    control: '0.28rem',
    panel: '0.42rem',
    pill: '999rem'
  },
  border: {
    thin: '1px',
    strong: '2px'
  },
  blur: {
    glass: '10px',
    deep: '18px'
  },
  transparency: {
    panel: '0.88',
    raised: '0.96',
    overlay: '0.76'
  },
  glow: {
    soft: '0 0 16px rgba(var(--nw-color-green-rgb), 0.10)',
    active: '0 0 22px rgba(var(--nw-color-green-rgb), 0.24)',
    warning: '0 0 20px rgba(var(--nw-color-orange-rgb), 0.22)',
    danger: '0 0 22px rgba(var(--nw-color-red-rgb), 0.24)'
  },
  depth: {
    low: '0 8px 22px rgba(var(--nw-color-void-rgb), 0.28)',
    medium: '0 14px 34px rgba(var(--nw-color-void-rgb), 0.38)',
    high: '0 20px 52px rgba(var(--nw-color-void-rgb), 0.48)'
  },
  animation: {
    fast: '110ms',
    normal: '210ms',
    slow: '420ms',
    easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)'
  }
};

export function createTheme(id: string, overrides: ThemeOverrides = {}): ThemeDefinition {
  return {
    ...baseTheme,
    ...overrides,
    id,
    colors: { ...baseTheme.colors, ...overrides.colors },
    fonts: { ...baseTheme.fonts, ...overrides.fonts },
    typography: { ...baseTheme.typography, ...overrides.typography },
    spacing: { ...baseTheme.spacing, ...overrides.spacing },
    radius: { ...baseTheme.radius, ...overrides.radius },
    border: { ...baseTheme.border, ...overrides.border },
    blur: { ...baseTheme.blur, ...overrides.blur },
    transparency: { ...baseTheme.transparency, ...overrides.transparency },
    glow: { ...baseTheme.glow, ...overrides.glow },
    depth: { ...baseTheme.depth, ...overrides.depth },
    animation: { ...baseTheme.animation, ...overrides.animation }
  };
}

/** Canonical production theme shared by the player, admin, and OBS surfaces. */
export const streamTheme = createTheme('neon-wreckers-stream');

/** Compatibility export retained for existing applications and seasonal extensions. */
export const defaultTheme = streamTheme;

export const highContrastTheme = createTheme('neon-wreckers-stream-high-contrast', {
  colors: {
    void: '#000000',
    canvas: '#010203',
    surface: '#05080a',
    surfaceRaised: '#0b1115',
    text: '#ffffff',
    textMuted: '#d4dfdc',
    textDim: '#a8b4b1',
    green: '#b8ff3d',
    purple: '#d174ff',
    cyan: '#79e8ff',
    orange: '#ffb367',
    red: '#ff6278',
    line: 'rgba(255, 255, 255, 0.32)',
    lineStrong: 'rgba(255, 255, 255, 0.62)'
  },
  blur: { glass: '0px', deep: '0px' }
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
  for (const [property, value] of Object.entries(themeToCssVariables(theme))) root.style.setProperty(property, value);
  root.dataset.nwTheme = theme.id;
}

export function ThemeProvider({ theme = streamTheme, children }: PropsWithChildren<{ theme?: ThemeDefinition }>): ReactElement {
  useLayoutEffect(() => applyTheme(theme), [theme]);
  return children as ReactElement;
}
