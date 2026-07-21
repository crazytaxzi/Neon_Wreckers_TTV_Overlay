import { useEffect, useState, type ChangeEvent } from 'react';
import {
  Badge,
  Button,
  Card,
  DataGrid,
  Field,
  Input,
  Notification,
  NWIcon,
  Panel,
  ResponsiveGrid,
  SectionTitle,
  Select,
  StatusDisplay
} from '@neon-wreckers/ui';
import type { CraftingRecipe, GameData } from '../model.js';
import { formatCountdown, cooldownRemaining, rarityTone, rarityRank, itemIcon } from '../page-utils.js';

export function InventoryPage({ inventory, catalog }: Pick<GameData, 'inventory' | 'catalog'>) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('name');
  const catalogBySlug = new Map(catalog.map(item => [item.slug, item]));
  const rows = inventory.map(item => {
    const definition = catalogBySlug.get(item.itemSlug);
    const unitValue = definition?.valueCredits ?? 0;
    return { ...item, definition, unitValue, totalValue: unitValue * item.quantity };
  });
  const query = search.trim().toLowerCase();
  const items = rows
    .filter(item => (filter === 'all' || item.rarity === filter) && (!query || `${item.name} ${item.itemSlug} ${item.definition?.uses.join(' ') ?? ''}`.toLowerCase().includes(query)))
    .sort((left, right) => sort === 'quantity' ? right.quantity - left.quantity : sort === 'value' ? right.totalValue - left.totalValue : sort === 'rarity' ? rarityRank(right.rarity) - rarityRank(left.rarity) || left.name.localeCompare(right.name) : left.name.localeCompare(right.name));
  const totalUnits = inventory.reduce((sum, item) => sum + item.quantity, 0);
  const totalValue = rows.reduce((sum, item) => sum + item.totalValue, 0);
  const rareStacks = inventory.filter(item => rarityRank(item.rarity) >= rarityRank('rare')).length;
  return (
    <div className="page-stack">
      <SectionTitle eyebrow="PERSONAL LOGISTICS" title="Salvage Hold" description="A compact manifest for tracking every recovered resource, component, relic, and credit." icon="inventory" />
      <div className="hold-summary"><div><span>Unique stacks</span><strong>{inventory.length}</strong></div><div><span>Total units</span><strong>{totalUnits.toLocaleString()}</strong></div><div><span>Guide value</span><strong>{totalValue.toLocaleString()} cr</strong></div><div><span>Rare+ stacks</span><strong>{rareStacks}</strong></div></div>
      <Panel className="hold-ledger"><div className="hold-toolbar"><Field label="Search hold"><Input value={search} placeholder="Item, code, or use…" onChange={event => setSearch(event.target.value)} /></Field><Field label="Rarity"><Select value={filter} onChange={(event: ChangeEvent<HTMLSelectElement>) => setFilter(event.target.value)}><option value="all">All rarities</option><option value="common">Common</option><option value="uncommon">Uncommon</option><option value="rare">Rare</option><option value="epic">Epic</option><option value="legendary">Legendary</option></Select></Field><Field label="Sort by"><Select value={sort} onChange={event => setSort(event.target.value)}><option value="name">Item name</option><option value="quantity">Quantity</option><option value="value">Stack value</option><option value="rarity">Rarity</option></Select></Field></div><div className="hold-result-count">Showing <strong>{items.length}</strong> of {inventory.length} held stacks</div>{items.length ? <DataGrid rows={items} getRowKey={item => item.itemSlug} empty="No items in hold." columns={[
        { key: 'item', header: 'Item', render: item => <div className="hold-item"><span className="hold-item__icon"><NWIcon name={itemIcon(item.itemSlug)} size={18} /></span><div><strong>{item.name}</strong><small>{item.itemSlug}</small></div></div> },
        { key: 'rarity', header: 'Rarity', render: item => <Badge tone={rarityTone(item.rarity)}>{item.rarity}</Badge> },
        { key: 'quantity', header: 'Quantity', align: 'right', render: item => <strong className="nw-numeric hold-quantity">{item.quantity.toLocaleString()}</strong> },
        { key: 'unit', header: 'Each', align: 'right', render: item => <span className="nw-numeric">{item.unitValue.toLocaleString()} cr</span> },
        { key: 'total', header: 'Stack value', align: 'right', render: item => <strong className="nw-numeric">{item.totalValue.toLocaleString()} cr</strong> },
        { key: 'use', header: 'Primary use', render: item => <span className="hold-use">{item.definition?.uses[0] ?? 'General salvage'}</span> }
      ]} /> : <Notification title="No matching inventory" tone="info">Adjust the search or rarity filter to view other records.</Notification>}</Panel>
      <Panel className="hold-codex"><SectionTitle eyebrow="ITEM CODEX" title="Values, Recipes & Discovery" description={`${catalog.length} known station items, including materials not yet recovered.`} icon="data" /><DataGrid rows={catalog} getRowKey={item => item.slug} empty="No catalog records." columns={[
        { key: 'item', header: 'Known item', render: item => <div><strong>{item.name}</strong><small className="hold-code">{item.slug}</small></div> },
        { key: 'rarity', header: 'Rarity', render: item => <Badge tone={rarityTone(item.rarity)}>{item.rarity}</Badge> },
        { key: 'value', header: 'Guide value', align: 'right', render: item => <span className="nw-numeric">{item.valueCredits.toLocaleString()} cr</span> },
        { key: 'vendor', header: 'Vendor pays', align: 'right', render: item => <span className="nw-numeric">{item.sellable ? `${(item.vendorSellCredits ?? 0).toLocaleString()} cr` : '—'}</span> },
        { key: 'recipe', header: 'Recipe', render: item => item.recipes[0] ?? 'Not craftable' },
        { key: 'source', header: 'Found through', render: item => item.sources[0] ?? 'Salvage and trade' }
      ]} /></Panel>
    </div>
  );
}

export function CraftingPage({ recipes, inventory, catalog, cooldowns, action }: Pick<GameData, 'recipes' | 'inventory' | 'catalog' | 'cooldowns' | 'action'>) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, []);
  const held = (slug: string) => inventory.find(item => item.itemSlug === slug)?.quantity ?? 0;
  const craft = async (recipe: CraftingRecipe, quantity: number) => {
    await action('/api/v1/crafting/craft', { recipeSlug: recipe.slug, quantity }, `${quantity} × ${recipe.name} fabrication started`);
  };
  return <div className="page-stack"><SectionTitle eyebrow="FABRICATION NETWORK" title="Crafting Bay" description="Turn salvage and expedition materials into reactor fuel, repair parts, food, medicine, and advanced components." icon="resources" /><Notification title="How the supply chain works" tone="info">Choose a batch of up to ten. Materials are consumed when fabrication starts, and completed items arrive after the batch timer finishes. Guide value measures utility, while vendor proceeds remain lower.</Notification><ResponsiveGrid min="20rem">{recipes.map(recipe => { const maxAffordable = Math.min(10, ...Object.entries(recipe.inputs).map(([slug, amount]) => Math.floor(held(slug) / amount))); const quantity = quantities[recipe.slug] ?? 1; const ready = maxAffordable >= quantity; const remaining = cooldownRemaining(cooldowns, `craft:${recipe.slug}`, now); const setQuantity = (value: number) => setQuantities(current => ({ ...current, [recipe.slug]: Math.max(1, Math.min(10, value)) })); return <Card key={recipe.slug}><div className="ship-card__head"><h3>{recipe.name}</h3><Badge tone={recipe.unlocked ? 'success' : 'warning'}>{recipe.unlocked ? `${recipe.durationSeconds * quantity}s batch` : `${recipe.stationModule} locked`}</Badge></div><Field label={`Batch size · materials available for ${maxAffordable}`}><div className="inline-actions"><Button type="button" size="sm" variant="ghost" disabled={quantity <= 1} aria-label={`Decrease ${recipe.name} batch`} onClick={() => setQuantity(quantity - 1)}>−</Button><StatusDisplay compact label="Quantity" value={quantity} icon="resources" tone="info" /><Button type="button" size="sm" variant="ghost" disabled={quantity >= 10} aria-label={`Increase ${recipe.name} batch`} onClick={() => setQuantity(quantity + 1)}>+</Button></div></Field><div className="material-readout"><span>Requires</span><strong>{Object.entries(recipe.inputs).map(([slug, amount]) => `${catalog.find(item => item.slug === slug)?.name ?? slug} ${held(slug)}/${amount * quantity}`).join(' · ')}</strong></div><div className="material-readout"><span>Produces</span><strong>{Object.entries(recipe.outputs).map(([slug, amount]) => `${amount * quantity} × ${catalog.find(item => item.slug === slug)?.name ?? slug}`).join(' · ')}</strong></div><div className="material-readout"><span>Economy</span><strong>{(recipe.inputValue * quantity).toLocaleString()} cr in → {(recipe.outputValue * quantity).toLocaleString()} cr out · {recipe.valueAdded >= 0 ? '+' : ''}{(recipe.valueAdded * quantity).toLocaleString()} cr · {Math.round(recipe.efficiency * 100)}%</strong></div><Button fullWidth disabled={!recipe.unlocked || !ready || remaining > 0} onClick={() => void craft(recipe, quantity)}>{remaining > 0 ? `Ready in ${formatCountdown(remaining)}` : !recipe.unlocked ? 'Station module offline' : ready ? `Craft ${quantity}` : `Need materials for ${quantity}`}</Button></Card>; })}</ResponsiveGrid></div>;
}
