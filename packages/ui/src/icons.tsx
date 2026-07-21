import { forwardRef } from 'react';
import {
  AlertTriangle,
  Archive,
  BadgeDollarSign,
  Bell,
  Boxes,
  Box,
  BrickWall,
  Radio,
  Building2,
  Cable,
  CircleGauge,
  ClipboardList,
  Coins,
  Construction,
  Database,
  FlaskConical,
  Hammer,
  HardDrive,
  Hexagon,
  Landmark,
  Megaphone,
  PackageOpen,
  Pickaxe,
  Power,
  RadioTower,
  Atom,
  Rocket,
  Satellite,
  ScanLine,
  Settings,
  ShieldAlert,
  ShoppingCart,
  Sparkles,
  Telescope,
  Terminal,
  Twitch,
  Users,
  Warehouse,
  Waves,
  Wrench,
  Zap,
  type LucideIcon,
  type LucideProps
} from 'lucide-react';

function glyphProps(size: LucideProps['size'], color: LucideProps['color'], strokeWidth: LucideProps['strokeWidth']) {
  return {
    width: size ?? 24,
    height: size ?? 24,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color ?? 'currentColor',
    strokeWidth: strokeWidth ?? 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const
  };
}

const WreckerSkull = forwardRef<SVGSVGElement, LucideProps>(function WreckerSkull({ size, color, strokeWidth, absoluteStrokeWidth: _absoluteStrokeWidth, ...props }, ref) {
  return <svg ref={ref} {...props} {...glyphProps(size, color, strokeWidth)}>
    <path d="M12 2.2c-5.1 0-8.2 3.5-8.2 8.1 0 3.1 1.5 5.7 4.1 7v3.2h2.7v-2.3h2.8v2.3h2.7v-3.2c2.6-1.3 4.1-3.9 4.1-7 0-4.6-3.1-8.1-8.2-8.1Z" fill="currentColor" fillOpacity=".16" />
    <path d="M12 2.2c-5.1 0-8.2 3.5-8.2 8.1 0 3.1 1.5 5.7 4.1 7v3.2h2.7v-2.3h2.8v2.3h2.7v-3.2c2.6-1.3 4.1-3.9 4.1-7 0-4.6-3.1-8.1-8.2-8.1Z" />
    <path d="M6.1 10.7c0-1.8 1.3-3.1 2.9-3.1s2.9 1.3 2.9 3.1-1.3 3.1-2.9 3.1-2.9-1.3-2.9-3.1Zm6 0c0-1.8 1.3-3.1 2.9-3.1s2.9 1.3 2.9 3.1-1.3 3.1-2.9 3.1-2.9-1.3-2.9-3.1Z" fill="var(--nw-color-void, #05070b)" />
    <path d="m10 15.2 2-2.4 2 2.4-2 1.8-2-1.8ZM2 9.1h2.3M19.7 9.1H22M4.2 4.6l2 1.4M19.8 4.6l-2 1.4M7.5 1l1.2 2.8M16.5 1l-1.2 2.8" />
  </svg>;
});

const StationGlyph = forwardRef<SVGSVGElement, LucideProps>(function StationGlyph({ size, color, strokeWidth, absoluteStrokeWidth: _absoluteStrokeWidth, ...props }, ref) {
  return <svg ref={ref} {...props} {...glyphProps(size, color, strokeWidth)}>
    <ellipse cx="12" cy="12" rx="10" ry="4.8" opacity=".65" />
    <ellipse cx="12" cy="12" rx="6.2" ry="2.8" fill="currentColor" fillOpacity=".12" />
    <path d="M10.2 4.2h3.6l.7 4.5 2 1.4v3.8l-2 1.4-.7 4.5h-3.6l-.7-4.5-2-1.4v-3.8l2-1.4.7-4.5Z" />
    <path d="M12 1.8v2.4M12 19.8v2.4M2 12h5.5M16.5 12H22M5 7.1l3 1.6M19 7.1l-3 1.6M5 16.9l3-1.6M19 16.9l-3-1.6" />
    <circle cx="12" cy="12" r="1.65" fill="currentColor" />
  </svg>;
});

const WreckGlyph = forwardRef<SVGSVGElement, LucideProps>(function WreckGlyph({ size, color, strokeWidth, absoluteStrokeWidth: _absoluteStrokeWidth, ...props }, ref) {
  return <svg ref={ref} {...props} {...glyphProps(size, color, strokeWidth)}>
    <path d="M3 7V3h4M17 3h4v4M21 17v4h-4M7 21H3v-4" opacity=".7" />
    <path d="m5.2 13 3.1-4.2 4.1.5 2.2-2.2 4.2 2.3-2 2.1 2.2 2.8-4.4 2.8-4.1-1-3.2 1.2-2.1-4.3Z" fill="currentColor" fillOpacity=".18" />
    <path d="m5.2 13 3.1-4.2 4.1.5 2.2-2.2 4.2 2.3-2 2.1 2.2 2.8-4.4 2.8-4.1-1-3.2 1.2-2.1-4.3ZM8.3 8.8l2.2 7.3M12.4 9.3l2.2 7.8" />
    <path d="m4 5 2 1M18 18l2 1M19 5l-1.4 1.5M6.4 18.5 5 20" opacity=".65" />
  </svg>;
});

const SalvageGlyph = forwardRef<SVGSVGElement, LucideProps>(function SalvageGlyph({ size, color, strokeWidth, absoluteStrokeWidth: _absoluteStrokeWidth, ...props }, ref) {
  return <svg ref={ref} {...props} {...glyphProps(size, color, strokeWidth)}>
    <circle cx="8.3" cy="8.3" r="4.7" fill="currentColor" fillOpacity=".12" />
    <circle cx="8.3" cy="8.3" r="2.6" />
    <path d="M8.3 1.5v2.1M8.3 13v2.1M1.5 8.3h2.1M13 8.3h2.1M3.5 3.5 5 5M11.6 11.6l1.5 1.5M13.1 3.5 11.6 5M5 11.6l-1.5 1.5" />
    <path d="m12 12 8.2 8.2M15 10.8l4-4 2.2 2.2-4 4M17.8 18.8l2.4-2.4" />
  </svg>;
});

const CrateGlyph = forwardRef<SVGSVGElement, LucideProps>(function CrateGlyph({ size, color, strokeWidth, absoluteStrokeWidth: _absoluteStrokeWidth, ...props }, ref) {
  return <svg ref={ref} {...props} {...glyphProps(size, color, strokeWidth)}>
    <path d="m12 2.5 8.2 4.2v10.6L12 21.5l-8.2-4.2V6.7L12 2.5Z" fill="currentColor" fillOpacity=".12" />
    <path d="m12 2.5 8.2 4.2v10.6L12 21.5l-8.2-4.2V6.7L12 2.5Zm0 0v19M3.8 6.7 12 11l8.2-4.3M7 4.9l8.1 4.3M7 19.1v-6.3l5-2.6 5 2.6v6.3" />
  </svg>;
});

const CrewGlyph = forwardRef<SVGSVGElement, LucideProps>(function CrewGlyph({ size, color, strokeWidth, absoluteStrokeWidth: _absoluteStrokeWidth, ...props }, ref) {
  return <svg ref={ref} {...props} {...glyphProps(size, color, strokeWidth)}>
    <path d="M7.5 9.5V7.8a4.5 4.5 0 0 1 9 0v1.7l-1.3 2.2H8.8L7.5 9.5Z" fill="currentColor" fillOpacity=".13" />
    <path d="M7.5 9.5V7.8a4.5 4.5 0 0 1 9 0v1.7l-1.3 2.2H8.8L7.5 9.5ZM9.2 8.4h5.6M8.8 11.7v2.2l3.2 2.2 3.2-2.2v-2.2M5.5 20.5v-2.2l3.3-2.1M18.5 20.5v-2.2l-3.3-2.1" />
    <path d="M3.2 11.4a2.8 2.8 0 0 1 3.2-2.8M20.8 11.4a2.8 2.8 0 0 0-3.2-2.8M2.3 19.8v-2.1l3-1.8M21.7 19.8v-2.1l-3-1.8" opacity=".62" />
  </svg>;
});

const MarketGlyph = forwardRef<SVGSVGElement, LucideProps>(function MarketGlyph({ size, color, strokeWidth, absoluteStrokeWidth: _absoluteStrokeWidth, ...props }, ref) {
  return <svg ref={ref} {...props} {...glyphProps(size, color, strokeWidth)}>
    <path d="M3.2 5.5h17.6l-1.3 5.8H4.5L3.2 5.5Z" fill="currentColor" fillOpacity=".13" />
    <path d="M3.2 5.5h17.6l-1.3 5.8H4.5L3.2 5.5ZM5 11.3v7.2h14v-7.2M8 18.5v-4.2h8v4.2" />
    <path d="M2 5.5 4.5 2h15L22 5.5M8 2v3.5M16 2v3.5" />
    <circle cx="17.8" cy="15.5" r="3.1" fill="var(--nw-color-void, #05070b)" />
    <path d="M17.8 13.8v3.4M16.5 14.6h2.1M17 16.4h2.1" />
  </svg>;
});

const ConstructionGlyph = forwardRef<SVGSVGElement, LucideProps>(function ConstructionGlyph({ size, color, strokeWidth, absoluteStrokeWidth: _absoluteStrokeWidth, ...props }, ref) {
  return <svg ref={ref} {...props} {...glyphProps(size, color, strokeWidth)}>
    <path d="M4.2 4.2 9 9m6 6 4.8 4.8M14.6 4.4a4.3 4.3 0 0 0 5 5l-4.3 4.3-5-5 4.3-4.3ZM9.4 14.6 5 19a2.1 2.1 0 1 1-3-3l4.4-4.4" />
    <path d="m3 3 3.6.8 1.1 2.8L5.5 8.8 2.7 7.7 2 4.1 3 3Z" fill="currentColor" fillOpacity=".16" />
    <circle cx="17.2" cy="6.8" r="1.2" />
  </svg>;
});

const BroadcastGlyph = forwardRef<SVGSVGElement, LucideProps>(function BroadcastGlyph({ size, color, strokeWidth, absoluteStrokeWidth: _absoluteStrokeWidth, ...props }, ref) {
  return <svg ref={ref} {...props} {...glyphProps(size, color, strokeWidth)}>
    <path d="M12 14.5v7M8.5 21.5h7M9.5 14.5l-2.2 7M14.5 14.5l2.2 7" />
    <circle cx="12" cy="10.5" r="3.5" fill="currentColor" fillOpacity=".13" />
    <circle cx="12" cy="10.5" r="1.1" fill="currentColor" />
    <path d="M6.7 5.2a7.5 7.5 0 0 0 0 10.6M17.3 5.2a7.5 7.5 0 0 1 0 10.6M4 2.5a11.3 11.3 0 0 0 0 16M20 2.5a11.3 11.3 0 0 1 0 16" />
  </svg>;
});

const DangerGlyph = forwardRef<SVGSVGElement, LucideProps>(function DangerGlyph({ size, color, strokeWidth, absoluteStrokeWidth: _absoluteStrokeWidth, ...props }, ref) {
  return <svg ref={ref} {...props} {...glyphProps(size, color, strokeWidth)}>
    <path d="M12 2.2 22 20H2L12 2.2Z" fill="currentColor" fillOpacity=".12" />
    <path d="M12 2.2 22 20H2L12 2.2Z" />
    <path d="M7.7 12.6c0-2.5 1.8-4.3 4.3-4.3s4.3 1.8 4.3 4.3c0 1.7-.8 3-2.2 3.7v2h-1.4v-1.2h-1.4v1.2H9.9v-2c-1.4-.7-2.2-2-2.2-3.7Z" />
    <path d="M9.2 12.5c0-.9.7-1.6 1.5-1.6s1.5.7 1.5 1.6-.7 1.6-1.5 1.6-1.5-.7-1.5-1.6Zm2.6 0c0-.9.7-1.6 1.5-1.6s1.5.7 1.5 1.6-.7 1.6-1.5 1.6-1.5-.7-1.5-1.6Z" fill="currentColor" />
  </svg>;
});

const iconRegistry = {
  station: StationGlyph,
  crew: CrewGlyph,
  power: Power,
  reactor: Atom,
  storage: Warehouse,
  wreck: WreckGlyph,
  mining: Pickaxe,
  danger: DangerGlyph,
  expedition: Rocket,
  trade: MarketGlyph,
  construction: ConstructionGlyph,
  research: FlaskConical,
  events: Sparkles,
  broadcast: BroadcastGlyph,
  twitch: Twitch,
  streamelements: RadioTower,
  inventory: CrateGlyph,
  resources: CrateGlyph,
  credits: Coins,
  salvage: SalvageGlyph,
  notifications: Bell,
  settings: Settings,
  module: Hexagon,
  population: Building2,
  integrity: BrickWall,
  warning: DangerGlyph,
  archive: Archive,
  data: Database,
  terminal: Terminal,
  cargo: CrateGlyph,
  engineering: ConstructionGlyph,
  signal: Waves,
  comms: Megaphone,
  diagnostics: CircleGauge,
  objectives: ClipboardList,
  museum: Landmark,
  scanner: Telescope,
  fuel: Zap,
  network: Cable,
  storageDrive: HardDrive,
  market: MarketGlyph,
  wrecker: WreckerSkull
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof iconRegistry;

export type NWIconProps = LucideProps & {
  name: IconName;
  label?: string;
};

export function NWIcon({ name, label, ...props }: NWIconProps) {
  const Icon = iconRegistry[name];
  return <Icon aria-hidden={label ? undefined : true} aria-label={label} focusable="false" {...props} />;
}
