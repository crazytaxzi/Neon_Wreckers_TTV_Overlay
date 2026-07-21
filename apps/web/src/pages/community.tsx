import { useEffect, useState, type CSSProperties } from 'react';
import {
  Badge,
  Button,
  Card,
  ConfirmWindow,
  DataGrid,
  Field,
  Input,
  Notification,
  NWIcon,
  Panel,
  Pill,
  ProfileChip,
  ProgressBar,
  ResponsiveGrid,
  ScrollableList,
  SectionTitle,
  Select,
  SliderControl,
  SplitLayout,
  StatusDisplay,
  ToggleSwitch,
  Tooltip
} from '@neon-wreckers/ui';
import type { ActionHandler, AuctionListing, CurrentUser, GameData, InventoryItem, ItemDefinition, Marketplace, PlayerNotification, Quarters, QuartersObject, UiPreferences } from '../model.js';
import { formatCountdown, notificationTone, quartersObjectIcon, rarityTone, itemIcon } from '../page-utils.js';

export function MuseumPage({ station, inventory, action }: Pick<GameData, 'station' | 'inventory' | 'action'>) {
  const plaques = station?.modules.flatMap(module => module.plaques ?? []) ?? [];
  const artifacts = inventory.filter(item => ['unknown-relic', 'quantum-key'].includes(item.itemSlug));
  const museum = station?.modules.find(module => module.slug === 'museum');
  const intakeRemaining = Math.max(0, (station?.museum.dailyCapacity ?? 0) - (station?.museum.donatedToday ?? 0));
  const rewardMultiplier = 1 + Number(museum?.effects.donationRewardBonus ?? 0);
  return (
    <div className="page-stack">
      <SectionTitle eyebrow="CULTURAL ARCHIVE" title="Museum & Founders Hall" description="Artifacts are permanently consumed for study, public morale, personal credits, XP, and reputation." icon="museum" />
      <ResponsiveGrid min="13rem"><StatusDisplay label="Museum Level" value={museum?.level ?? 0} unit={`/${museum?.maxLevel ?? 4}`} icon="museum" tone="purple" /><StatusDisplay label="Today's Intake" value={station?.museum.donatedToday ?? 0} unit={`/${station?.museum.dailyCapacity ?? 0}`} icon="resources" tone={intakeRemaining > 0 ? 'success' : 'warning'} /><StatusDisplay label="Reward Bonus" value={Math.round((rewardMultiplier - 1) * 100)} unit="%" icon="credits" tone="success" /></ResponsiveGrid>
      {!!station?.museum.collection.length && <Panel><SectionTitle eyebrow="PERMANENT COLLECTION" title="Artifacts Consumed" icon="archive" /><div className="trait-list">{station.museum.collection.map(item => <Pill key={item.itemSlug} tone="purple">{item.quantity} × {item.name}</Pill>)}</div></Panel>}
      {plaques.length ? <ResponsiveGrid min="19rem">{plaques.map(plaque => <Card key={plaque.id} className="plaque-card"><NWIcon name="museum" size={24} /><span className="nw-eyebrow">ARCHIVE PLAQUE</span><h3>{plaque.title}</h3><p>{plaque.body}</p></Card>)}</ResponsiveGrid> : <Notification title="No plaques installed" tone="info" icon="museum">Community milestones will appear here when the existing game systems create them.</Notification>}
      {artifacts.map(item => { const base = item.itemSlug === 'quantum-key' ? { credits: 1500, xp: 100, reputation: 5, morale: 2 } : { credits: 450, xp: 25, reputation: 1, morale: 1 }; const batch = Math.min(10, item.quantity, intakeRemaining); return <Panel key={item.itemSlug} tone="purple"><SectionTitle eyebrow="DONATION READY" title={item.name} icon="museum" /><p>{item.quantity} held. Each donation pays {Math.floor(base.credits * rewardMultiplier).toLocaleString()} credits, {Math.floor(base.xp * rewardMultiplier)} XP, {base.reputation} reputation, and +{base.morale} station morale.</p><div className="inline-actions"><Button disabled={intakeRemaining < 1} onClick={() => void action('/api/v1/museum/donate', { itemSlug: item.itemSlug, quantity: 1 }, 'Artifact donated')}>Donate 1</Button><Button variant="ghost" disabled={batch < 2} onClick={() => void action('/api/v1/museum/donate', { itemSlug: item.itemSlug, quantity: batch }, `${batch} artifacts donated`)}>Donate {batch}</Button></div></Panel>; })}
      {!artifacts.length && <Notification title="No artifacts in your hold" tone="info">Unknown Relics and Quantum Keys can be surrendered here when recovered.</Notification>}
    </div>
  );
}

export function HistoryPage({ history }: Pick<GameData, 'history'>) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('newest');
  const query = search.trim().toLowerCase();
  const categories = [...new Set(history.map(entry => entry.category))].sort();
  const entries = history.filter(entry => (category === 'all' || entry.category === category) && (!query || `${entry.title} ${entry.body} ${entry.actorDisplayName ?? ''} ${JSON.stringify(entry.details ?? {})}`.toLowerCase().includes(query))).sort((left, right) => sort === 'oldest' ? Date.parse(left.createdAt) - Date.parse(right.createdAt) : sort === 'actor' ? (left.actorDisplayName ?? '').localeCompare(right.actorDisplayName ?? '') || Date.parse(right.createdAt) - Date.parse(left.createdAt) : sort === 'category' ? left.category.localeCompare(right.category) || Date.parse(right.createdAt) - Date.parse(left.createdAt) : Date.parse(right.createdAt) - Date.parse(left.createdAt));
  return (
    <div className="page-stack">
      <SectionTitle eyebrow="STATION MEMORY" title="Permanent Operations Archive" description="Search and sort up to 2,000 permanent records by player, operation, wreck, expedition, ship, or recovered item." icon="archive" action={<Badge tone="info">{entries.length.toLocaleString()} records</Badge>} />
      <Panel><div className="hold-toolbar"><Field label="Search archive"><Input value={search} placeholder="Player, ship, wreck, item, operation…" onChange={event => setSearch(event.target.value)} /></Field><Field label="Category"><Select value={category} onChange={event => setCategory(event.target.value)}><option value="all">All categories</option>{categories.map(value => <option key={value} value={value}>{value}</option>)}</Select></Field><Field label="Sort"><Select value={sort} onChange={event => setSort(event.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="actor">Player name</option><option value="category">Category</option></Select></Field></div><DataGrid rows={entries} getRowKey={entry => entry.id} empty="No archive records match those filters." columns={[
        { key: 'when', header: 'When', render: entry => <span className="nw-numeric">{new Date(entry.createdAt).toLocaleString()}</span> },
        { key: 'who', header: 'Who', render: entry => <strong>{entry.actorDisplayName ?? 'Station systems'}</strong> },
        { key: 'how', header: 'How', render: entry => <div><Badge tone="info">{entry.category}</Badge><small className="hold-code">{entry.details?.mode ?? entry.details?.operation ?? 'station event'}</small></div> },
        { key: 'what', header: 'What happened', render: entry => <div><strong>{entry.title}</strong><p>{entry.body}</p>{entry.details?.items?.length ? <div className="trait-list">{entry.details.items.map((item, index) => <Pill key={`${item.itemSlug}-${index}`} tone={rarityTone(item.rarity ?? 'common')}>{item.quantity} × {item.name}</Pill>)}</div> : null}</div> }
      ]} /></Panel>
    </div>
  );
}

export function NotificationsPage({ notifications, action }: { notifications: PlayerNotification[]; action: ActionHandler }) {
  const unread = notifications.filter(notification => !notification.readAt).length;
  return (
    <div className="page-stack">
      <SectionTitle eyebrow="PERSONAL SIGNALS" title="Notifications" description="Server-persisted notices for this authenticated wrecker." icon="notifications" action={<div className="inline-actions"><Badge tone={unread ? 'warning' : 'success'}>{unread} unread</Badge>{unread > 0 && <Button size="sm" variant="ghost" onClick={() => void action('/api/v1/notifications/read-all', undefined, 'Notifications marked read')}>Mark all read</Button>}</div>} />
      {notifications.length ? <Panel><ScrollableList label="Player notifications" maxHeight="68vh">{notifications.map(notification => (
        <Notification key={notification.id} title={notification.title} tone={notificationTone(notification)} icon="notifications">
          {notification.body}
          <span className="notification-meta nw-numeric">{notification.type.toUpperCase()} · {new Date(notification.createdAt).toLocaleString()}{notification.readAt ? ' · READ' : ' · UNREAD'}</span>
          {!notification.readAt && <Button size="sm" variant="ghost" onClick={() => void action(`/api/v1/notifications/${notification.id}/read`, undefined, 'Notification marked read')}>Mark read</Button>}
        </Notification>
      ))}</ScrollableList></Panel> : <Notification title="Signal queue clear" tone="success">No personal notifications are currently stored for this account.</Notification>}
    </div>
  );
}

export function MarketPage({ marketplace, credits, inventory, catalog, auctions, action }: { marketplace: Marketplace | null; credits: number; inventory: InventoryItem[]; catalog: ItemDefinition[]; auctions: AuctionListing[]; action: ActionHandler }) {
  const [sellItem, setSellItem] = useState(inventory.find(item => item.quantity > 0)?.itemSlug ?? '');
  const [sellQuantity, setSellQuantity] = useState(1);
  const [sellPrice, setSellPrice] = useState(100);
  const [auctionDuration, setAuctionDuration] = useState(48);
  const [cancelListing, setCancelListing] = useState<AuctionListing | null>(null);
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, []);
  return (
    <div className="page-stack">
      <SectionTitle eyebrow="COMMERCE NETWORK" title="Marketplace" description="Live marketplace availability and server-provided listings." icon="trade" action={<Badge tone={marketplace?.unlocked ? 'success' : 'warning'}>{marketplace?.unlocked ? 'ONLINE' : 'LOCKED'}</Badge>} />
      <ResponsiveGrid min="13rem"><StatusDisplay label="Available Credits" value={credits.toLocaleString()} unit=" cr" icon="credits" tone="success" /><StatusDisplay label="Market State" value={marketplace?.unlocked ? 'ACTIVE' : 'OFFLINE'} icon="market" tone={marketplace?.unlocked ? 'success' : 'warning'} /><StatusDisplay label="Listings" value={marketplace?.listings.length ?? 0} icon="inventory" tone="info" /></ResponsiveGrid>
      {marketplace?.unlocked ? (marketplace.listings.length ? <Panel><DataGrid caption="Current station marketplace listings" rows={marketplace.listings} getRowKey={listing => listing.slug} columns={[
        { key: 'item', header: 'Listing', render: listing => <span className="market-listing"><NWIcon name={itemIcon(listing.itemSlug)} size={17} /><strong>{listing.name}</strong></span> },
        { key: 'quantity', header: 'Quantity', align: 'right', render: listing => <span className="nw-numeric">{listing.quantity}</span> },
        { key: 'price', header: 'Price', align: 'right', render: listing => <span className="nw-numeric">{listing.priceCredits.toLocaleString()} cr</span> },
        { key: 'buy', header: 'Command', align: 'right', render: listing => <Button size="sm" disabled={credits < listing.priceCredits} onClick={() => void action('/api/v1/marketplace/buy', { slug: listing.slug, quantity: 1 }, 'Purchase complete')}>Buy</Button> }
      ]} /></Panel> : <Notification title="No listings transmitted" tone="info">The marketplace module is active, but the server returned no current listings.</Notification>) : <Panel className="locked-system"><div className="locked-system__glyph"><NWIcon name="market" size={58} /></div><Badge tone="warning">MODULE OFFLINE</Badge><h2>Marketplace access unavailable</h2><p>The server reports that the marketplace module is not active. The interface cannot bypass that station state.</p><ProgressBar value={0} label="Network availability" tone="warning" /></Panel>}
      {marketplace?.unlocked && <><Panel><SectionTitle eyebrow="PLAYER MARKET" title="Auction House" description="Player listings run for 6 to 72 hours. The shown price is for the full stack." icon="trade" /><DataGrid caption="Active player auctions" rows={auctions} getRowKey={listing => listing.id} empty="No active player auctions." columns={[
        { key: 'item', header: 'Item', render: listing => <Tooltip content={catalog.find(item => item.slug === listing.itemSlug)?.description ?? listing.itemName}><strong>{listing.quantity} × {listing.itemName}</strong></Tooltip> },
        { key: 'seller', header: 'Seller', render: listing => listing.sellerName },
        { key: 'value', header: 'Guide value', align: 'right', render: listing => <span className="nw-numeric">{((catalog.find(item => item.slug === listing.itemSlug)?.valueCredits ?? 0) * listing.quantity).toLocaleString()} cr</span> },
        { key: 'price', header: 'Auction price', align: 'right', render: listing => <span className="nw-numeric">{listing.priceCredits.toLocaleString()} cr</span> },
        { key: 'time', header: 'Ends', render: listing => <span className="nw-numeric">{formatCountdown(Date.parse(listing.expiresAt) - now)}</span> },
        { key: 'buy', header: 'Command', align: 'right', render: listing => listing.ownListing ? <Button size="sm" variant="warning" disabled={credits < listing.cancellationFee} onClick={() => setCancelListing(listing)}>Cancel · {listing.cancellationFee} cr</Button> : <Button size="sm" disabled={credits < listing.priceCredits} onClick={() => void action(`/api/v1/auction/${listing.id}/buy`, undefined, 'Auction purchase complete')}>Buy stack</Button> }
      ]} /></Panel><Panel><SectionTitle eyebrow="CREATE LISTING" title="Auction Your Items" icon="inventory" /><ResponsiveGrid min="12rem"><Field label="Item"><Select value={sellItem} onChange={event => setSellItem(event.target.value)}>{inventory.filter(item => item.quantity > 0 && item.itemSlug !== 'credits').map(item => <option key={item.itemSlug} value={item.itemSlug}>{item.name} ({item.quantity})</option>)}</Select></Field><Field label="Quantity"><Input type="number" min={1} value={sellQuantity} onChange={event => setSellQuantity(Number(event.target.value))} /></Field><Field label="Full stack price (credits)"><Input type="number" min={1} value={sellPrice} onChange={event => setSellPrice(Number(event.target.value))} /></Field><Field label="Auction duration"><Select value={auctionDuration} onChange={event => setAuctionDuration(Number(event.target.value))}><option value={6}>6 hours</option><option value={12}>12 hours</option><option value={24}>24 hours</option><option value={48}>48 hours</option><option value={72}>72 hours</option></Select></Field></ResponsiveGrid><p>Guide value: {((catalog.find(item => item.slug === sellItem)?.valueCredits ?? 0) * sellQuantity).toLocaleString()} cr</p><Button disabled={!sellItem || sellQuantity < 1 || sellPrice < 1} onClick={() => void action('/api/v1/auction/list', { itemSlug: sellItem, quantity: sellQuantity, priceCredits: sellPrice, durationHours: auctionDuration }, 'Auction created')}>List for {auctionDuration} hours</Button></Panel><Panel><SectionTitle eyebrow="SELL INVENTORY" title="Station Buyback" icon="trade" /><ResponsiveGrid min="14rem">{inventory.filter(item => item.quantity > 0 && catalog.find(entry => entry.slug === item.itemSlug)?.sellable).map(item => { const value = catalog.find(entry => entry.slug === item.itemSlug)?.valueCredits ?? 0; return <Tooltip key={item.itemSlug} content={`Guide value ${value} credits. Station buyback may pay a different amount based on career and spread.`}><Card><strong>{item.name}</strong><p>{item.quantity} available · {value.toLocaleString()} cr guide value each</p><Button size="sm" variant="ghost" onClick={() => void action('/api/v1/marketplace/sell', { itemSlug: item.itemSlug, quantity: 1 }, 'Item sold')}>Sell one</Button></Card></Tooltip>; })}</ResponsiveGrid></Panel><ConfirmWindow open={Boolean(cancelListing)} onClose={() => setCancelListing(null)} onConfirm={() => { if (cancelListing) void action(`/api/v1/auction/${cancelListing.id}/cancel`, undefined, 'Auction cancelled'); setCancelListing(null); }} title="Cancel this auction?" confirmLabel={`Pay ${cancelListing?.cancellationFee ?? 0} credits`} tone="warning"><p>The full item stack will return to your hold. The cancellation fee is 2% of the asking price, with a 10-credit minimum and 250-credit cap.</p></ConfirmWindow></>}
    </div>
  );
}

export function QuartersPage({ me, quarters, action }: { me: CurrentUser; quarters: Quarters | null; action: ActionHandler }) {
  const [theme, setTheme] = useState(quarters?.layout.theme ?? 'station-zero-default');
  const [objects, setObjects] = useState<QuartersObject[]>(quarters?.layout.objects ?? []);
  const moveObject = (index: number, dx: number, dy: number) => setObjects(current => current.map((object, objectIndex) => objectIndex === index ? { ...object, x: Math.max(0, Math.min(7, object.x + dx)), y: Math.max(0, Math.min(4, object.y + dy)) } : object));
  return (
    <div className="page-stack">
      <SectionTitle eyebrow="PERSONAL HABITAT" title="Quarters Interface" description="Authenticated occupant identity and the current server-provided habitat layout." icon="module" />
      <SplitLayout>
        <Panel><SectionTitle eyebrow="OCCUPANT" title={me.displayName} icon="twitch" /><ProfileChip name={me.displayName} detail={`${me.player?.career ?? 'Wrecker'} · Level ${me.player?.level ?? 1}`} avatarUrl={me.avatarUrl || undefined} /><div className="quarters-readouts"><StatusDisplay label="Access Level" value={me.player?.level ?? 1} icon="module" tone="purple" /><StatusDisplay label="Credits" value={me.player?.credits ?? 0} unit=" cr" icon="credits" tone="success" /><StatusDisplay label="Layout Theme" value={quarters?.layout.theme ?? 'UNAVAILABLE'} icon="settings" tone="info" /></div></Panel>
        <Panel><SectionTitle eyebrow="HABITAT MAP" title="Installed objects" description="Move owned fixtures on the eight-by-five habitat grid and save the layout." icon="diagnostics" />{quarters ? <><Field label="Habitat theme"><Select value={theme} onChange={event => setTheme(event.target.value)}><option value="station-zero-default">Station Zero</option><option value="frost-wrecks">Frost Wrecks</option></Select></Field><div className="quarters-map" role="img" aria-label={`Quarters layout containing ${objects.length} objects`}>{objects.map(object => <div key={`${object.key}-${object.x}-${object.y}`} className="quarters-object" style={{ '--quarters-x': object.x, '--quarters-y': object.y } as CSSProperties}><NWIcon name={quartersObjectIcon(object.key)} size={19} /><span>{object.key.replaceAll('-', ' ')}</span><small className="nw-numeric">X{object.x} Y{object.y}</small></div>)}</div><div className="settings-grid">{objects.map((object, index) => <div key={object.key} className="inline-actions"><strong>{object.key.replaceAll('-', ' ')}</strong><Button size="sm" variant="ghost" onClick={() => moveObject(index, -1, 0)}>←</Button><Button size="sm" variant="ghost" onClick={() => moveObject(index, 1, 0)}>→</Button><Button size="sm" variant="ghost" onClick={() => moveObject(index, 0, -1)}>↑</Button><Button size="sm" variant="ghost" onClick={() => moveObject(index, 0, 1)}>↓</Button></div>)}</div><Button onClick={() => void action('/api/v1/quarters', { theme, objects }, 'Quarters saved')}>Save layout</Button></> : <Notification title="Layout unavailable" tone="warning">The quarters endpoint did not return a layout during this synchronization cycle.</Notification>}</Panel>
      </SplitLayout>
    </div>
  );
}

export function ProfilePage({ me, action }: { me: CurrentUser; action: ActionHandler }) {
  return (
    <div className="page-stack">
      <SectionTitle eyebrow="IDENTITY RECORD" title="Wrecker Profile" description="Authenticated Twitch identity and existing player progression data." icon="twitch" />
      <Panel depth="medium" className="profile-console">
        <ProfileChip name={me.displayName} detail={me.player?.title ?? 'Wrecker'} avatarUrl={me.avatarUrl || undefined} />
        <ResponsiveGrid min="12rem"><StatusDisplay label="Level" value={me.player?.level ?? 1} icon="crew" tone="purple" /><StatusDisplay label="Credits" value={me.player?.credits ?? 0} unit=" cr" icon="credits" tone="success" /><StatusDisplay label="Career" value={me.player?.career ?? 'Wrecker'} icon="salvage" tone="info" /></ResponsiveGrid>
        <Field label="Retrain career" hint="The first selection is free; later changes cost credits and have a cooldown."><Select defaultValue={me.player?.career ?? 'salvager'} onChange={event => void action('/api/v1/player/career', { career: event.target.value }, 'Career updated')}><option value="salvager">Salvager</option><option value="hauler">Hauler</option><option value="engineer">Engineer</option><option value="builder">Builder</option><option value="explorer">Explorer</option><option value="trader">Trader</option></Select></Field>
        <Button variant="ghost" onClick={() => void action('/api/v1/auth/logout', undefined, 'Signed out').then(() => { window.location.href = '/'; })}>Sign out</Button>
      </Panel>
    </div>
  );
}

export function SettingsPage({ preferences, updatePreferences }: { preferences: UiPreferences; updatePreferences: (patch: Partial<UiPreferences>) => void }) {
  return (
    <div className="page-stack">
      <SectionTitle eyebrow="INTERFACE CONTROL" title="Accessibility & Display" description="Local interface preferences only. Game state, APIs, and balance are untouched." icon="settings" />
      <SplitLayout>
        <Panel>
          <div className="settings-grid">
            <ToggleSwitch checked={preferences.reducedMotion} onChange={value => updatePreferences({ reducedMotion: value })} label="Reduced motion" description="Disables decorative movement and transition travel." />
            <ToggleSwitch checked={preferences.lowEffects} onChange={value => updatePreferences({ lowEffects: value })} label="Low performance effects" description="Reduces blur, bloom, scanlines, and background layers." />
            <ToggleSwitch checked={preferences.highContrast} onChange={value => updatePreferences({ highContrast: value })} label="High contrast markings" description="Strengthens text and interface boundary contrast." />
            <ToggleSwitch checked={preferences.largeText} onChange={value => updatePreferences({ largeText: value })} label="Large interface text" description="Raises the global scalable-text baseline." />
            <SliderControl label="Glow intensity" value={preferences.glowIntensity} min={0} max={100} unit="%" onChange={value => updatePreferences({ glowIntensity: value })} />
          </div>
        </Panel>
        <Panel>
          <SectionTitle eyebrow="ACTIVE PROFILE" title="Interface State" description="The current local rendering profile is applied immediately and saved on this device." icon="terminal" />
          <ResponsiveGrid min="10rem">
            <StatusDisplay label="Motion" value={preferences.reducedMotion ? 'REDUCED' : 'STANDARD'} icon="events" tone={preferences.reducedMotion ? 'info' : 'success'} />
            <StatusDisplay label="Effects" value={preferences.lowEffects ? 'LOW' : 'FULL'} icon="diagnostics" tone={preferences.lowEffects ? 'info' : 'purple'} />
            <StatusDisplay label="Contrast" value={preferences.highContrast ? 'HIGH' : 'STANDARD'} icon="integrity" tone={preferences.highContrast ? 'success' : 'neutral'} />
            <StatusDisplay label="Text Scale" value={preferences.largeText ? 'LARGE' : 'STANDARD'} icon="data" tone={preferences.largeText ? 'info' : 'neutral'} />
          </ResponsiveGrid>
          <Notification title="Preferences stored locally" tone="success">These display controls do not alter station data or gameplay behavior.</Notification>
        </Panel>
      </SplitLayout>
    </div>
  );
}
