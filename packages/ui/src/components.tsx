import {
  Children,
  cloneElement,
  createContext,
  forwardRef,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ChangeEvent,
  type CSSProperties,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PropsWithChildren,
  type ReactElement,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes
} from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, LoaderCircle, Menu, X } from 'lucide-react';
import { NWIcon, type IconName } from './icons.js';

export type Tone = 'neutral' | 'success' | 'info' | 'warning' | 'danger' | 'purple';
export type Size = 'sm' | 'md' | 'lg';

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'warning';
  size?: Size;
  icon?: ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
}>(({ className, variant = 'secondary', size = 'md', icon, loading, fullWidth, children, disabled, ...props }, ref) => (
  <button
    ref={ref}
    className={cx('nw-button', `nw-button--${variant}`, `nw-button--${size}`, fullWidth && 'nw-button--full', className)}
    disabled={disabled || loading}
    {...props}
  >
    {loading ? <LoaderCircle className="nw-spin" size={16} aria-hidden="true" /> : icon}
    <span>{children}</span>
  </button>
));
Button.displayName = 'Button';

export const IconButton = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  icon: ReactNode;
  tone?: Tone;
}>(({ label, icon, tone = 'neutral', className, ...props }, ref) => (
  <button ref={ref} className={cx('nw-icon-button', `nw-tone--${tone}`, className)} aria-label={label} title={label} {...props}>
    {icon}
  </button>
));
IconButton.displayName = 'IconButton';

export function Badge({ children, tone = 'neutral', icon }: PropsWithChildren<{ tone?: Tone; icon?: IconName }>) {
  return <span className={cx('nw-badge', `nw-tone--${tone}`)}>{icon && <NWIcon name={icon} size={12} />}{children}</span>;
}

export function Pill({ children, tone = 'neutral' }: PropsWithChildren<{ tone?: Tone }>) {
  return <span className={cx('nw-pill', `nw-tone--${tone}`)}>{children}</span>;
}

export const Card = forwardRef<HTMLElement, HTMLAttributes<HTMLElement> & {
  as?: 'article' | 'section' | 'div';
  tone?: Tone;
  interactive?: boolean;
}>(({ as: Tag = 'article', tone = 'neutral', interactive, className, children, ...props }, ref) => (
  <Tag ref={ref as never} className={cx('nw-card', `nw-tone--${tone}`, interactive && 'nw-card--interactive', className)} {...props}>{children}</Tag>
));
Card.displayName = 'Card';

export const Panel = forwardRef<HTMLElement, HTMLAttributes<HTMLElement> & {
  as?: 'aside' | 'section' | 'div' | 'main';
  depth?: 'low' | 'medium' | 'high';
  tone?: Tone;
  scanline?: boolean;
}>(({ as: Tag = 'section', depth = 'low', tone = 'neutral', scanline = true, className, children, ...props }, ref) => (
  <Tag ref={ref as never} className={cx('nw-panel', `nw-panel--${depth}`, `nw-tone--${tone}`, scanline && 'nw-panel--scanline', className)} {...props}>
    <span className="nw-panel__corner" aria-hidden="true" />
    {children}
  </Tag>
));
Panel.displayName = 'Panel';

export function SectionTitle({ eyebrow, title, description, action, icon }: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: IconName;
}) {
  return (
    <div className="nw-section-title">
      <div className="nw-section-title__mark">{icon && <NWIcon name={icon} size={18} />}</div>
      <div className="nw-section-title__copy">
        {eyebrow && <span className="nw-eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {action && <div className="nw-section-title__action">{action}</div>}
    </div>
  );
}

export function CommandHeader({ brand = 'NEON WRECKERS', title, subtitle, status, actions, profile }: {
  brand?: string;
  title: string;
  subtitle?: string;
  status?: ReactNode;
  actions?: ReactNode;
  profile?: ReactNode;
}) {
  return (
    <header className="nw-command-header">
      <div className="nw-brand-mark" aria-hidden="true"><span>NW</span></div>
      <div className="nw-command-header__identity">
        <span>{brand}</span>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {status && <div className="nw-command-header__status">{status}</div>}
      {actions && <div className="nw-command-header__actions">{actions}</div>}
      {profile && <div className="nw-command-header__profile">{profile}</div>}
    </header>
  );
}

export function StatusDisplay({ label, value, unit, icon, tone = 'neutral', detail, compact = false }: {
  label: string;
  value: ReactNode;
  unit?: string;
  icon?: IconName;
  tone?: Tone;
  detail?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={cx('nw-status-display', `nw-tone--${tone}`, compact && 'nw-status-display--compact')}>
      {icon && <NWIcon name={icon} className="nw-status-display__icon" size={18} />}
      <span className="nw-status-display__label">{label}</span>
      <strong className="nw-numeric">{value}<small>{unit}</small></strong>
      {detail && <span className="nw-status-display__detail">{detail}</span>}
    </div>
  );
}

export function Notification({ title, children, tone = 'info', icon = 'notifications', onDismiss }: PropsWithChildren<{
  title: string;
  tone?: Tone;
  icon?: IconName;
  onDismiss?: () => void;
}>) {
  return (
    <div className={cx('nw-notification', `nw-tone--${tone}`)} role={tone === 'danger' ? 'alert' : 'status'}>
      <NWIcon name={icon} size={18} />
      <div><strong>{title}</strong><p>{children}</p></div>
      {onDismiss && <IconButton label="Dismiss notification" icon={<X size={16} />} onClick={onDismiss} />}
    </div>
  );
}

export function Tooltip({ content, children, placement = 'top' }: PropsWithChildren<{ content: ReactNode; placement?: 'top' | 'bottom' | 'left' | 'right' }>) {
  const id = useId();
  const child = Children.only(children);
  return (
    <span className={cx('nw-tooltip', `nw-tooltip--${placement}`)}>
      {isValidElement(child) ? cloneElement(child as ReactElement<Record<string, unknown>>, { 'aria-describedby': id }) : child}
      <span role="tooltip" id={id} className="nw-tooltip__content">{content}</span>
    </span>
  );
}

export function ProgressBar({ value, max = 100, label, showValue = true, tone = 'success', indeterminate = false }: {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  tone?: Tone;
  indeterminate?: boolean;
}) {
  const safeMax = max > 0 ? max : 1;
  const percentage = Math.max(0, Math.min(100, (value / safeMax) * 100));
  return (
    <div className={cx('nw-progress', `nw-tone--${tone}`, indeterminate && 'nw-progress--indeterminate')}>
      {(label || showValue) && <div className="nw-progress__label"><span>{label}</span>{showValue && <strong className="nw-numeric">{Math.round(percentage)}%</strong>}</div>}
      <div className="nw-progress__track" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={indeterminate ? undefined : value}>
        <span style={{ '--nw-progress-value': `${percentage}%` } as CSSProperties} />
      </div>
    </div>
  );
}

export function Meter({ value, max = 100, label, tone = 'info', segments = 12 }: {
  value: number;
  max?: number;
  label: string;
  tone?: Tone;
  segments?: number;
}) {
  const safeMax = max > 0 ? max : 1;
  const active = Math.round(Math.max(0, Math.min(1, value / safeMax)) * segments);
  return (
    <div className={cx('nw-meter', `nw-tone--${tone}`)}>
      <div className="nw-meter__label"><span>{label}</span><strong className="nw-numeric">{value}</strong></div>
      <div className="nw-meter__segments" role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={value}>
        {Array.from({ length: segments }, (_, index) => <i key={index} className={index < active ? 'is-active' : ''} />)}
      </div>
    </div>
  );
}

export function HealthBar(props: Omit<Parameters<typeof ProgressBar>[0], 'tone'>) {
  const tone: Tone = props.value <= 25 ? 'danger' : props.value <= 50 ? 'warning' : 'success';
  return <ProgressBar {...props} tone={tone} />;
}

export function PowerBar(props: Omit<Parameters<typeof ProgressBar>[0], 'tone'>) {
  return <ProgressBar {...props} tone="purple" />;
}

export function PopulationDisplay({ current, capacity, trend = 0 }: { current: number; capacity?: number; trend?: number }) {
  const tone: Tone = trend < 0 ? 'warning' : 'success';
  return (
    <StatusDisplay
      label="Population"
      value={current.toLocaleString()}
      detail={<span className={cx('nw-trend', `nw-tone--${tone}`)}>{trend >= 0 ? '+' : ''}{trend} cycle</span>}
      unit={capacity ? ` / ${capacity.toLocaleString()}` : undefined}
      icon="population"
      tone={tone}
    />
  );
}

export function ModuleCard({ name, state, progress, progressLabel = 'Module progress', icon = 'module', description, stats, action }: {
  name: string;
  state: string;
  progress: number;
  progressLabel?: string;
  icon?: IconName;
  description?: string;
  stats?: ReactNode;
  action?: ReactNode;
}) {
  const tone: Tone = state === 'active' ? 'success' : state === 'building' ? 'info' : state === 'damaged' ? 'danger' : 'neutral';
  return (
    <Card className="nw-module-card" tone={tone}>
      <div className="nw-module-card__icon"><NWIcon name={icon} size={24} /></div>
      <div className="nw-module-card__head"><h3>{name}</h3><Badge tone={tone}>{state}</Badge></div>
      {description && <p>{description}</p>}
      <ProgressBar value={progress} label={progressLabel} tone={tone} />
      {stats && <div className="nw-module-card__stats">{stats}</div>}
      {action && <div className="nw-module-card__action">{action}</div>}
    </Card>
  );
}

export function InventoryCard({ name, quantity, rarity, icon = 'resources', detail, selected, onClick }: {
  name: string;
  quantity: number;
  rarity?: string;
  icon?: IconName;
  detail?: ReactNode;
  selected?: boolean;
  onClick?: () => void;
}) {
  return (
    <Card
      className={cx('nw-inventory-card', selected && 'is-selected')}
      interactive={Boolean(onClick)}
      onClick={onClick}
      onKeyDown={event => {
        if (!onClick || (event.key !== 'Enter' && event.key !== ' ')) return;
        event.preventDefault();
        onClick();
      }}
      role={onClick ? 'button' : undefined}
      aria-pressed={onClick ? Boolean(selected) : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="nw-inventory-card__glyph"><NWIcon name={icon} size={27} /></div>
      <div className="nw-inventory-card__copy"><h3>{name}</h3>{rarity && <Badge tone={rarity === 'legendary' ? 'purple' : 'neutral'}>{rarity}</Badge>}</div>
      <strong className="nw-numeric">{quantity.toLocaleString()}</strong>
      {detail && <div className="nw-inventory-card__detail">{detail}</div>}
    </Card>
  );
}

export function ScrollableList({ children, label, maxHeight = '28rem', className }: PropsWithChildren<{ label: string; maxHeight?: string; className?: string }>) {
  return <div className={cx('nw-scroll-list', className)} role="list" aria-label={label} style={{ '--nw-list-max-height': maxHeight } as CSSProperties}>{children}</div>;
}

export type DataColumn<T> = {
  key: string;
  header: ReactNode;
  render: (row: T) => ReactNode;
  align?: 'left' | 'center' | 'right';
  width?: string;
};

export function DataGrid<T>({ rows, columns, getRowKey, caption, empty = 'No records available.' }: {
  rows: T[];
  columns: DataColumn<T>[];
  getRowKey: (row: T) => string;
  caption?: string;
  empty?: ReactNode;
}) {
  return (
    <div className="nw-data-grid__wrap">
      <table className="nw-data-grid">
        {caption && <caption>{caption}</caption>}
        <thead><tr>{columns.map(column => <th key={column.key} style={{ width: column.width, textAlign: column.align }}>{column.header}</th>)}</tr></thead>
        <tbody>
          {rows.length === 0 ? <tr><td colSpan={columns.length} className="nw-data-grid__empty">{empty}</td></tr> : rows.map(row => (
            <tr key={getRowKey(row)}>{columns.map(column => <td key={column.key} style={{ textAlign: column.align }}>{column.render(row)}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const Table = DataGrid;

export type TabItem = { id: string; label: string; icon?: IconName; disabled?: boolean };
export function Tabs({ items, value, onChange, ariaLabel = 'Sections' }: { items: TabItem[]; value: string; onChange: (id: string) => void; ariaLabel?: string }) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const handleKey = (event: ReactKeyboardEvent<HTMLButtonElement>, index: number) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const enabled = items.map((item, itemIndex) => ({ item, itemIndex })).filter(({ item }) => !item.disabled);
    if (enabled.length === 0) return;
    const current = enabled.findIndex(({ itemIndex }) => itemIndex === index);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? enabled.length - 1 : (Math.max(0, current) + (event.key === 'ArrowRight' ? 1 : -1) + enabled.length) % enabled.length;
    const nextIndex = enabled[next]?.itemIndex;
    if (nextIndex !== undefined) {
      onChange(items[nextIndex].id);
      refs.current[nextIndex]?.focus();
    }
  };
  return (
    <div className="nw-tabs" role="tablist" aria-label={ariaLabel}>
      {items.map((item, index) => (
        <button
          key={item.id}
          ref={(node: HTMLButtonElement | null) => { refs.current[index] = node; }}
          role="tab"
          aria-selected={value === item.id}
          tabIndex={value === item.id ? 0 : -1}
          disabled={item.disabled}
          onClick={() => onChange(item.id)}
          onKeyDown={(event: ReactKeyboardEvent<HTMLButtonElement>) => handleKey(event, index)}
        >
          {item.icon && <NWIcon name={item.icon} size={16} />}
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
}

export function Field({ label, hint, error, required, children, className }: PropsWithChildren<{
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
}>) {
  return (
    <label className={cx('nw-field', error && 'nw-field--error', className)}>
      <span className="nw-field__label">{label}{required && <b aria-hidden="true"> *</b>}</span>
      {children}
      {(error || hint) && <small>{error ?? hint}</small>}
    </label>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => <input ref={ref} className={cx('nw-input', className)} {...props} />);
Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => <textarea ref={ref} className={cx('nw-textarea', className)} {...props} />);
Textarea.displayName = 'Textarea';

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(({ className, children, ...props }, ref) => (
  <span className="nw-select-wrap"><select ref={ref} className={cx('nw-select', className)} {...props}>{children}</select><ChevronDown size={15} aria-hidden="true" /></span>
));
Select.displayName = 'Select';

export function ToggleSwitch({ checked, onChange, label, description, disabled }: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}) {
  return (
    <button type="button" role="switch" aria-checked={checked} className="nw-toggle" onClick={() => onChange(!checked)} disabled={disabled}>
      <span className="nw-toggle__track"><i /></span>
      <span className="nw-toggle__copy"><strong>{label}</strong>{description && <small>{description}</small>}</span>
    </button>
  );
}

export function SliderControl({ label, value, min = 0, max = 100, step = 1, unit, onChange, disabled }: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  const range = Math.max(1, max - min);
  const percentage = Math.max(0, Math.min(100, ((value - min) / range) * 100));
  return (
    <label className="nw-slider">
      <span><strong>{label}</strong><b className="nw-numeric">{value}{unit}</b></span>
      <input type="range" value={value} min={min} max={max} step={step} disabled={disabled} onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(Number(event.target.value))} style={{ '--nw-slider-value': `${percentage}%` } as CSSProperties} />
    </label>
  );
}

export type ContextMenuItem = { id: string; label: string; icon?: IconName; danger?: boolean; disabled?: boolean; onSelect: () => void };
export function ContextMenu({ label = 'Open context menu', items, children }: PropsWithChildren<{ label?: string; items: ContextMenuItem[] }>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const closeMenu = useCallback((restoreFocus = false) => {
    setOpen(false);
    if (restoreFocus) window.requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  useEffect(() => {
    const close = (event: MouseEvent) => { if (!ref.current?.contains(event.target as Node)) closeMenu(); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [closeMenu]);

  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => menuRef.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  const handleMenuKey = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const buttons = Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? []);
    if (!buttons.length) return;
    const current = Math.max(0, buttons.indexOf(document.activeElement as HTMLButtonElement));
    let next: number | undefined;
    if (event.key === 'ArrowDown') next = (current + 1) % buttons.length;
    if (event.key === 'ArrowUp') next = (current - 1 + buttons.length) % buttons.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = buttons.length - 1;
    if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu(true);
      return;
    }
    if (next !== undefined) {
      event.preventDefault();
      buttons[next]?.focus();
    }
  };

  return (
    <div className="nw-context-menu" ref={ref}>
      <div onContextMenu={(event: ReactMouseEvent<HTMLDivElement>) => { event.preventDefault(); setOpen(true); }}>{children}</div>
      <IconButton ref={triggerRef} label={label} icon={<Menu size={16} />} onClick={() => setOpen(value => !value)} aria-expanded={open} aria-haspopup="menu" />
      {open && <div ref={menuRef} className="nw-context-menu__popover" role="menu" aria-label={label} onKeyDown={handleMenuKey}>{items.map(item => (
        <button key={item.id} role="menuitem" className={item.danger ? 'is-danger' : ''} disabled={item.disabled} onClick={() => { item.onSelect(); closeMenu(true); }}>
          {item.icon && <NWIcon name={item.icon} size={15} />}<span>{item.label}</span>
        </button>
      ))}</div>}
    </div>
  );
}

function useEscape(enabled: boolean, onEscape: () => void) {
  useEffect(() => {
    if (!enabled) return;
    const handle = (event: KeyboardEvent) => { if (event.key === 'Escape') onEscape(); };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [enabled, onEscape]);
}

export function Modal({ open, onClose, title, description, children, footer, size = 'md' }: PropsWithChildren<{
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  footer?: ReactNode;
  size?: Size;
}>) {
  const titleId = useId();
  const descriptionId = useId();
  const modalRef = useRef<HTMLElement | null>(null);
  useEscape(open, onClose);

  useEffect(() => {
    if (!open || typeof document === 'undefined') return;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const frame = window.requestAnimationFrame(() => {
      const firstFocusable = modalRef.current?.querySelector<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      (firstFocusable ?? modalRef.current)?.focus();
    });
    return () => {
      window.cancelAnimationFrame(frame);
      previouslyFocused?.focus();
    };
  }, [open]);

  const trapFocus = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Tab') return;
    const focusable = Array.from(modalRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])') ?? []);
    if (focusable.length === 0) {
      event.preventDefault();
      modalRef.current?.focus();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  if (!open || typeof document === 'undefined') return null;
  return createPortal(
    <div className="nw-modal-layer" role="presentation" onMouseDown={(event: ReactMouseEvent<HTMLDivElement>) => { if (event.target === event.currentTarget) onClose(); }}>
      <section
        ref={modalRef}
        className={cx('nw-modal', `nw-modal--${size}`)}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        onKeyDown={trapFocus}
      >
        <header><div><span className="nw-eyebrow">SECURE WINDOW</span><h2 id={titleId}>{title}</h2>{description && <p id={descriptionId}>{description}</p>}</div><IconButton label="Close window" icon={<X size={18} />} onClick={onClose} /></header>
        <div className="nw-modal__body">{children}</div>
        {footer && <footer>{footer}</footer>}
      </section>
    </div>, document.body
  );
}

export const Dialog = Modal;

export function ConfirmWindow({ open, onClose, onConfirm, title, children, confirmLabel = 'Confirm', cancelLabel = 'Cancel', tone = 'warning' }: PropsWithChildren<{
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'warning' | 'danger';
}>) {
  return (
    <Modal open={open} onClose={onClose} title={title} footer={<><Button variant="ghost" onClick={onClose}>{cancelLabel}</Button><Button variant={tone} onClick={onConfirm}>{confirmLabel}</Button></>}>
      <div className={cx('nw-confirm', `nw-tone--${tone}`)}><NWIcon name={tone === 'danger' ? 'danger' : 'warning'} size={28} /><div>{children}</div></div>
    </Modal>
  );
}

export type ToastRecord = { id: number; title: string; message?: string; tone?: Tone; duration?: number };
type ToastContextValue = { pushToast: (toast: Omit<ToastRecord, 'id'>) => number; dismissToast: (id: number) => void };
const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: PropsWithChildren) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const counter = useRef(0);
  const dismissToast = useCallback((id: number) => setToasts(current => current.filter(toast => toast.id !== id)), []);
  const pushToast = useCallback((toast: Omit<ToastRecord, 'id'>) => {
    const id = ++counter.current;
    setToasts(current => [...current, { ...toast, id }]);
    window.setTimeout(() => dismissToast(id), toast.duration ?? 4500);
    return id;
  }, [dismissToast]);
  const value = useMemo(() => ({ pushToast, dismissToast }), [pushToast, dismissToast]);
  return <ToastContext.Provider value={value}>{children}<ToastViewport toasts={toasts} onDismiss={dismissToast} /></ToastContext.Provider>;
}

export function useToast(): ToastContextValue {
  const value = useContext(ToastContext);
  if (!value) throw new Error('useToast must be used inside ToastProvider');
  return value;
}

export function ToastViewport({ toasts, onDismiss }: { toasts: ToastRecord[]; onDismiss: (id: number) => void }) {
  return (
    <div className="nw-toast-viewport" aria-live="polite" aria-label="Notifications">
      {toasts.map(toast => <div className={cx('nw-toast', `nw-tone--${toast.tone ?? 'info'}`)} key={toast.id}><NWIcon name="notifications" size={17} /><div><strong>{toast.title}</strong>{toast.message && <p>{toast.message}</p>}</div><IconButton label="Dismiss" icon={<X size={14} />} onClick={() => onDismiss(toast.id)} /></div>)}
    </div>
  );
}

export function Skeleton({ width = '100%', height = '1rem', className }: { width?: string; height?: string; className?: string }) {
  return <span className={cx('nw-skeleton', className)} aria-hidden="true" style={{ width, height }} />;
}

export function LoadingScreen({ label = 'Synchronizing station systems', detail }: { label?: string; detail?: string }) {
  return (
    <div className="nw-loading-screen" role="status" aria-busy="true" aria-live="polite">
      <div className="nw-loading-core"><i /><i /><i /><span>NW</span></div>
      <span className="nw-eyebrow">SYSTEM BOOT</span>
      <h1>{label}</h1>
      {detail && <p>{detail}</p>}
      <ProgressBar value={68} showValue={false} indeterminate label="Loading" />
    </div>
  );
}

export function AppShell({ header, navigation, children, utility, className }: PropsWithChildren<{ header: ReactNode; navigation: ReactNode; utility?: ReactNode; className?: string }>) {
  return <div className={cx('nw-app-shell', className)}><div className="nw-app-shell__header">{header}</div><aside className="nw-app-shell__nav">{navigation}</aside><main className="nw-app-shell__main" id="main-content">{children}</main>{utility && <aside className="nw-app-shell__utility">{utility}</aside>}</div>;
}

export function CommandNavigation({ items, value, onChange, ariaLabel = 'Primary navigation' }: { items: TabItem[]; value: string; onChange: (id: string) => void; ariaLabel?: string }) {
  return (
    <nav className="nw-command-nav" aria-label={ariaLabel}>
      {items.map(item => <button key={item.id} className={value === item.id ? 'is-active' : ''} onClick={() => onChange(item.id)} disabled={item.disabled} aria-current={value === item.id ? 'page' : undefined}>{item.icon && <NWIcon name={item.icon} size={19} />}<span>{item.label}</span></button>)}
    </nav>
  );
}

export function ResponsiveGrid({ children, min = '16rem', className }: PropsWithChildren<{ min?: string; className?: string }>) {
  return <div className={cx('nw-responsive-grid', className)} style={{ '--nw-grid-min': min } as CSSProperties}>{children}</div>;
}

export function SplitLayout({ children, ratio = '3fr 2fr', className }: PropsWithChildren<{ ratio?: string; className?: string }>) {
  return <div className={cx('nw-split-layout', className)} style={{ '--nw-split-ratio': ratio } as CSSProperties}>{children}</div>;
}

export function ProfileChip({ name, detail, avatarUrl }: { name: string; detail?: string; avatarUrl?: string }) {
  return <div className="nw-profile-chip">{avatarUrl ? <img src={avatarUrl} alt="" /> : <span aria-hidden="true">{name.slice(0, 1).toUpperCase()}</span>}<div><strong>{name}</strong>{detail && <small>{detail}</small>}</div></div>;
}
