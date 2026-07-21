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
  const [view, setView] = useState<'marketplace' | 'auctions' | 'mine' | 'sell'>('marketplace');
  const [sellItem, setSellItem] = useState(inventory.find(item => item.quantity > 0)?.itemSlug ?? '');
  const [sellQuantity, setSellQuantity] = useState(1);
  const [sellPrice, setSellPrice] = useState(100);
  const [auctionDuration, setAuctionDuration] = useState(48);
  const [cancelListing, setCancelListing] = useState<AuctionListing | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const guideValue = (slug: string) => catalog.find(item => item.slug === slug)?.valueCredits ?? 0;
  const sellableInventory = inventory.filter(item => item.quantity > 0 && catalog.find(entry => entry.slug === item.itemSlug)?.sellable);
  const ownAuctions = auctions.filter(listing => listing.ownListing);
  const publicAuctions = auctions.filter(listing => !listing.ownListing);
  const featured = publicAuctions[0] ?? auctions[0] ?? null;
  const marketListings = marketplace?.listings ?? [];
  const selectedDefinition = catalog.find(item => item.slug === sellItem);
  const selectedHeld = inventory.find(item => item.itemSlug === sellItem)?.quantity ?? 0;

  const tabs: Array<{ id: typeof view; label: string; count?: number }> = [
    { id: 'marketplace', label: 'Marketplace', count: marketListings.length },
    { id: 'auctions', label: 'Live Auctions', count: publicAuctions.length },
    { id: 'mine', label: 'My Auctions', count: ownAuctions.length },
    { id: 'sell', label: 'Sell From Hold' }
  ];

  return (
    <div className="page-stack market-console">
      <section className="market-console__masthead">
        <div>
          <span className="nw-eyebrow">VOID EXCHANGE // COMMERCE NETWORK</span>
          <h2>Market / Auction</h2>
          <p>Buy station stock, secure player listings, or turn recovered salvage into working capital.</p>
        </div>
        <div className="market-credit-bank">
          <span>Your Credits</span>
          <strong className="nw-numeric"><NWIcon name="credits" size={24} />{credits.toLocaleString()}</strong>
          <Badge tone={marketplace?.unlocked ? 'success' : 'warning'}>{marketplace?.unlocked ? 'MARKET ONLINE' : 'MARKET LOCKED'}</Badge>
        </div>
      </section>

      <nav className="market-console__tabs" aria-label="Market sections">
        {tabs.map(tab => (
          <button key={tab.id} type="button" className={view === tab.id ? 'is-active' : ''} onClick={() => setView(tab.id)}>
            <NWIcon name={tab.id === 'marketplace' ? 'market' : tab.id === 'sell' ? 'inventory' : 'trade'} size={18} />
            <span>{tab.label}</span>
            {typeof tab.count === 'number' && <small>{tab.count}</small>}
          </button>
        ))}
      </nav>

      {!marketplace?.unlocked && (
        <Panel className="locked-system market-console__locked">
          <div className="locked-system__glyph"><NWIcon name="market" size={58} /></div>
          <Badge tone="warning">MODULE OFFLINE</Badge>
          <h2>Marketplace access unavailable</h2>
          <p>The server reports that the marketplace module is not active. The interface cannot bypass that station state.</p>
          <ProgressBar value={0} label="Network availability" tone="warning" />
        </Panel>
      )}

      {marketplace?.unlocked && featured && view !== 'sell' && (
        <Panel tone="purple" depth="high" className="market-featured">
          <div className="market-featured__art" aria-hidden="true">
            <span><NWIcon name={itemIcon(featured.itemSlug)} size={76} /></span>
            <i /><i /><i />
          </div>
          <div className="market-featured__copy">
            <span className="nw-eyebrow">Featured Listing</span>
            <h3>{featured.itemName}</h3>
            <p>{catalog.find(item => item.slug === featured.itemSlug)?.description ?? `${featured.quantity} unit player listing from ${featured.sellerName}.`}</p>
            <div className="trait-list">
              <Badge tone={rarityTone(catalog.find(item => item.slug === featured.itemSlug)?.rarity ?? 'common')}>{catalog.find(item => item.slug === featured.itemSlug)?.rarity ?? 'salvage'}</Badge>
              <Pill tone="neutral">{featured.quantity} unit{featured.quantity === 1 ? '' : 's'}</Pill>
              <Pill tone="purple">Ends {formatCountdown(Date.parse(featured.expiresAt) - now)}</Pill>
            </div>
          </div>
          <div className="market-featured__price">
            <span>Market Price</span>
            <strong className="nw-numeric"><NWIcon name="credits" size={22} />{featured.priceCredits.toLocaleString()}</strong>
            <small>Guide value {(guideValue(featured.itemSlug) * featured.quantity).toLocaleString()} cr</small>
            {featured.ownListing ? (
              <Button variant="warning" disabled={credits < featured.cancellationFee} onClick={() => setCancelListing(featured)}>Cancel Listing</Button>
            ) : (
              <Button disabled={credits < featured.priceCredits} onClick={() => void action(`/api/v1/auction/${featured.id}/buy`, undefined, 'Auction purchase complete')}>Secure Listing</Button>
            )}
          </div>
        </Panel>
      )}

      {marketplace?.unlocked && view === 'marketplace' && (
        <Panel className="market-browse-panel">
          <SectionTitle eyebrow="STATION INVENTORY" title="Browse Market" description="Fixed station stock with server-authoritative prices and availability." icon="market" action={<Badge tone="success">{marketListings.length} listings</Badge>} />
          {marketListings.length ? (
            <div className="market-product-grid">
              {marketListings.map(listing => {
                const definition = catalog.find(item => item.slug === listing.itemSlug);
                return (
                  <article key={listing.slug} className={`market-product nw-rarity--${definition?.rarity ?? 'common'}`}>
                    <div className="market-product__icon"><NWIcon name={itemIcon(listing.itemSlug)} size={36} /></div>
                    <div className="market-product__copy">
                      <span>{definition?.rarity ?? 'station stock'}</span>
                      <h3>{listing.name}</h3>
                      <p>{definition?.description ?? `${listing.quantity} units available through station commerce.`}</p>
                    </div>
                    <div className="market-product__numbers">
                      <small>Quantity</small><strong className="nw-numeric">{listing.quantity}</strong>
                      <small>Price</small><strong className="nw-numeric">{listing.priceCredits.toLocaleString()} cr</strong>
                    </div>
                    <Button disabled={credits < listing.priceCredits} onClick={() => void action('/api/v1/marketplace/buy', { slug: listing.slug, quantity: 1 }, 'Purchase complete')}>Buy Item</Button>
                  </article>
                );
              })}
            </div>
          ) : <Notification title="No listings transmitted" tone="info">The marketplace module is active, but the server returned no current listings.</Notification>}
        </Panel>
      )}

      {marketplace?.unlocked && view === 'auctions' && (
        <Panel className="market-auction-panel">
          <SectionTitle eyebrow="PLAYER MARKET" title="Live Auctions" description="The shown price is for the full stack. Auctions resolve through the existing server transaction routes." icon="trade" action={<Badge tone="purple">{publicAuctions.length} live</Badge>} />
          {publicAuctions.length ? <div className="market-auction-list">{publicAuctions.map(listing => (
            <article key={listing.id} className="market-auction-row">
              <div className="market-auction-row__icon"><NWIcon name={itemIcon(listing.itemSlug)} size={32} /></div>
              <div><span className="nw-eyebrow">{catalog.find(item => item.slug === listing.itemSlug)?.rarity ?? 'player listing'}</span><h3>{listing.itemName}</h3><p>{listing.quantity} × item stack · Seller {listing.sellerName}</p></div>
              <div><small>Guide Value</small><strong className="nw-numeric">{(guideValue(listing.itemSlug) * listing.quantity).toLocaleString()} cr</strong></div>
              <div><small>Buy Now</small><strong className="nw-numeric">{listing.priceCredits.toLocaleString()} cr</strong></div>
              <div><small>Time Remaining</small><strong className="nw-numeric">{formatCountdown(Date.parse(listing.expiresAt) - now)}</strong></div>
              <Button disabled={credits < listing.priceCredits} onClick={() => void action(`/api/v1/auction/${listing.id}/buy`, undefined, 'Auction purchase complete')}>Buy Stack</Button>
            </article>
          ))}</div> : <Notification title="No active auctions" tone="info">The player exchange is waiting for new listings.</Notification>}
        </Panel>
      )}

      {marketplace?.unlocked && view === 'mine' && (
        <Panel className="market-auction-panel">
          <SectionTitle eyebrow="MY EXCHANGE RECORDS" title="Active Listings" description="Cancel a listing to return the full item stack to your hold. The server calculates and charges the cancellation fee." icon="archive" action={<Badge tone="info">{ownAuctions.length} owned</Badge>} />
          {ownAuctions.length ? <div className="market-auction-list">{ownAuctions.map(listing => (
            <article key={listing.id} className="market-auction-row market-auction-row--owned">
              <div className="market-auction-row__icon"><NWIcon name={itemIcon(listing.itemSlug)} size={32} /></div>
              <div><span className="nw-eyebrow">Your Listing</span><h3>{listing.itemName}</h3><p>{listing.quantity} × item stack · {listing.sellerName}</p></div>
              <div><small>Asking Price</small><strong className="nw-numeric">{listing.priceCredits.toLocaleString()} cr</strong></div>
              <div><small>Cancellation Fee</small><strong className="nw-numeric">{listing.cancellationFee.toLocaleString()} cr</strong></div>
              <div><small>Time Remaining</small><strong className="nw-numeric">{formatCountdown(Date.parse(listing.expiresAt) - now)}</strong></div>
              <Button variant="warning" disabled={credits < listing.cancellationFee} onClick={() => setCancelListing(listing)}>Cancel</Button>
            </article>
          ))}</div> : <Notification title="No personal listings" tone="info">Items you auction will appear here until purchased, expired, or cancelled.</Notification>}
        </Panel>
      )}

      {marketplace?.unlocked && view === 'sell' && (
        <div className="market-sell-layout">
          <Panel className="market-sell-panel">
            <SectionTitle eyebrow="CREATE LISTING" title="Auction Your Salvage" description="List a held stack for 6 to 72 hours. The route, validation, and transfer remain server-authoritative." icon="trade" />
            <div className="market-sell-form">
              <Field label="Item"><Select value={sellItem} onChange={event => { setSellItem(event.target.value); setSellQuantity(1); }}>{inventory.filter(item => item.quantity > 0 && item.itemSlug !== 'credits').map(item => <option key={item.itemSlug} value={item.itemSlug}>{item.name} ({item.quantity})</option>)}</Select></Field>
              <Field label="Quantity"><Input type="number" min={1} max={selectedHeld} value={sellQuantity} onChange={event => setSellQuantity(Number(event.target.value))} /></Field>
              <Field label="Full stack price"><Input type="number" min={1} value={sellPrice} onChange={event => setSellPrice(Number(event.target.value))} /></Field>
              <Field label="Auction duration"><Select value={auctionDuration} onChange={event => setAuctionDuration(Number(event.target.value))}><option value={6}>6 hours</option><option value={12}>12 hours</option><option value={24}>24 hours</option><option value={48}>48 hours</option><option value={72}>72 hours</option></Select></Field>
            </div>
            <div className="market-listing-preview">
              <div className="market-listing-preview__icon"><NWIcon name={itemIcon(sellItem)} size={42} /></div>
              <div><span className="nw-eyebrow">Listing Preview</span><h3>{selectedDefinition?.name ?? 'Choose an item'}</h3><p>{sellQuantity} of {selectedHeld} held · guide value {(guideValue(sellItem) * sellQuantity).toLocaleString()} cr</p></div>
              <strong className="nw-numeric">{sellPrice.toLocaleString()} cr</strong>
            </div>
            <Button fullWidth disabled={!sellItem || sellQuantity < 1 || sellQuantity > selectedHeld || sellPrice < 1} onClick={() => void action('/api/v1/auction/list', { itemSlug: sellItem, quantity: sellQuantity, priceCredits: sellPrice, durationHours: auctionDuration }, 'Auction created')}>List for {auctionDuration} Hours</Button>
          </Panel>

          <Panel className="market-buyback-panel">
            <SectionTitle eyebrow="STATION BUYBACK" title="Quick Sell" description="Sell one item at a time through the existing station buyback route." icon="inventory" />
            <div className="market-sell-grid">{sellableInventory.map(item => {
              const definition = catalog.find(entry => entry.slug === item.itemSlug);
              return <article key={item.itemSlug} className={`market-sell-tile nw-rarity--${item.rarity}`}><div><NWIcon name={itemIcon(item.itemSlug)} size={28} /></div><span>{item.name}</span><small>{item.quantity.toLocaleString()} held</small><strong className="nw-numeric">{(definition?.vendorSellCredits ?? definition?.valueCredits ?? 0).toLocaleString()} cr</strong><Button size="sm" variant="ghost" onClick={() => void action('/api/v1/marketplace/sell', { itemSlug: item.itemSlug, quantity: 1 }, 'Item sold')}>Sell One</Button></article>;
            })}</div>
          </Panel>
        </div>
      )}

      <ConfirmWindow open={Boolean(cancelListing)} onClose={() => setCancelListing(null)} onConfirm={() => { if (cancelListing) void action(`/api/v1/auction/${cancelListing.id}/cancel`, undefined, 'Auction cancelled'); setCancelListing(null); }} title="Cancel this auction?" confirmLabel={`Pay ${cancelListing?.cancellationFee ?? 0} credits`} tone="warning">
        <p>The full item stack will return to your hold. The cancellation fee is 2% of the asking price, with a 10-credit minimum and 250-credit cap.</p>
      </ConfirmWindow>
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
