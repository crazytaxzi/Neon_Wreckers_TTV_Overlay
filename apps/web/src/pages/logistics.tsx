import { useEffect, useState, type ChangeEvent } from 'react';
import {
  Badge,
  Button,
  DataGrid,
  Field,
  Input,
  Notification,
  NWIcon,
  Panel,
  Pill,
  ProgressBar,
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
  const usedSlots = inventory.length;
  const slotCapacity = Math.max(24, Math.ceil(usedSlots / 6) * 6);

  return (
    <div className="page-stack cargo-console">
      <section className="cargo-console__masthead">
        <div>
          <span className="nw-eyebrow">PERSONAL LOGISTICS // CARGO HOLD</span>
          <h2>Salvage Inventory</h2>
          <p>Recovered materials, components, relics, and trade stock arranged as a tactical cargo manifest.</p>
        </div>
        <div className="cargo-capacity">
          <span>Hold Capacity</span>
          <strong className="nw-numeric">{usedSlots} / {slotCapacity}</strong>
          <ProgressBar value={usedSlots} max={slotCapacity} showValue={false} tone={usedSlots / slotCapacity > 0.8 ? 'warning' : 'success'} />
        </div>
      </section>

      <div className="cargo-summary-grid">
        <StatusDisplay label="Unique Stacks" value={inventory.length} icon="inventory" tone="success" />
        <StatusDisplay label="Total Units" value={totalUnits.toLocaleString()} icon="cargo" tone="info" />
        <StatusDisplay label="Guide Value" value={totalValue.toLocaleString()} unit=" cr" icon="credits" tone="purple" />
        <StatusDisplay label="Rare+ Stacks" value={rareStacks} icon="museum" tone="warning" />
      </div>

      <Panel className="cargo-manifest-panel">
        <div className="cargo-toolbar">
          <Field label="Search hold"><Input value={search} placeholder="Item, code, or use…" onChange={event => setSearch(event.target.value)} /></Field>
          <Field label="Rarity"><Select value={filter} onChange={(event: ChangeEvent<HTMLSelectElement>) => setFilter(event.target.value)}><option value="all">All rarities</option><option value="common">Common</option><option value="uncommon">Uncommon</option><option value="rare">Rare</option><option value="epic">Epic</option><option value="legendary">Legendary</option></Select></Field>
          <Field label="Sort by"><Select value={sort} onChange={event => setSort(event.target.value)}><option value="name">Item name</option><option value="quantity">Quantity</option><option value="value">Stack value</option><option value="rarity">Rarity</option></Select></Field>
          <div className="cargo-toolbar__result"><span>Manifest Result</span><strong className="nw-numeric">{items.length} / {inventory.length}</strong></div>
        </div>

        {items.length ? (
          <div className="cargo-slot-grid">
            {items.map(item => (
              <article key={item.itemSlug} className={`cargo-slot nw-rarity--${item.rarity}`}>
                <div className="cargo-slot__glyph"><NWIcon name={itemIcon(item.itemSlug)} size={38} /></div>
                <div className="cargo-slot__identity"><span>{item.rarity}</span><h3>{item.name}</h3><small>{item.itemSlug}</small></div>
                <strong className="cargo-slot__quantity nw-numeric">×{item.quantity.toLocaleString()}</strong>
                <div className="cargo-slot__value"><span>Stack Value</span><strong className="nw-numeric">{item.totalValue.toLocaleString()} cr</strong></div>
                <div className="cargo-slot__use"><NWIcon name="data" size={14} /><span>{item.definition?.uses[0] ?? 'General salvage'}</span></div>
              </article>
            ))}
            {Array.from({ length: Math.max(0, Math.min(6, slotCapacity - items.length)) }, (_, index) => <div key={`empty-${index}`} className="cargo-slot cargo-slot--empty"><NWIcon name="cargo" size={24} /><span>Empty Slot</span></div>)}
          </div>
        ) : <Notification title="No matching inventory" tone="info">Adjust the search or rarity filter to view other records.</Notification>}
      </Panel>

      <Panel className="cargo-codex-panel">
        <SectionTitle eyebrow="ITEM CODEX" title="Values, Recipes & Discovery" description={`${catalog.length} known station items, including materials not yet recovered.`} icon="data" />
        <DataGrid rows={catalog} getRowKey={item => item.slug} empty="No catalog records." columns={[
          { key: 'item', header: 'Known item', render: item => <div><strong>{item.name}</strong><small className="hold-code">{item.slug}</small></div> },
          { key: 'rarity', header: 'Rarity', render: item => <Badge tone={rarityTone(item.rarity)}>{item.rarity}</Badge> },
          { key: 'value', header: 'Guide value', align: 'right', render: item => <span className="nw-numeric">{item.valueCredits.toLocaleString()} cr</span> },
          { key: 'vendor', header: 'Vendor pays', align: 'right', render: item => <span className="nw-numeric">{item.sellable ? `${(item.vendorSellCredits ?? 0).toLocaleString()} cr` : '—'}</span> },
          { key: 'recipe', header: 'Recipe', render: item => item.recipes[0] ?? 'Not craftable' },
          { key: 'source', header: 'Found through', render: item => item.sources[0] ?? 'Salvage and trade' }
        ]} />
      </Panel>
    </div>
  );
}

export function CraftingPage({ recipes, inventory, catalog, cooldowns, action }: Pick<GameData, 'recipes' | 'inventory' | 'catalog' | 'cooldowns' | 'action'>) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, []);
  const held = (slug: string) => inventory.find(item => item.itemSlug === slug)?.quantity ?? 0;
  const nameFor = (slug: string) => catalog.find(item => item.slug === slug)?.name ?? slug;
  const affordableFor = (recipe: CraftingRecipe) => Math.max(0, Math.min(10, ...Object.entries(recipe.inputs).map(([slug, amount]) => Math.floor(held(slug) / amount))));
  const unlockedRecipes = recipes.filter(recipe => recipe.unlocked);
  const readyRecipes = unlockedRecipes.filter(recipe => affordableFor(recipe) > 0);
  const affordableBatches = unlockedRecipes.reduce((sum, recipe) => sum + affordableFor(recipe), 0);
  const averageEfficiency = recipes.length ? Math.round(recipes.reduce((sum, recipe) => sum + recipe.efficiency, 0) / recipes.length * 100) : 0;
  const onlineModules = [...new Set(unlockedRecipes.map(recipe => recipe.stationModule))];
  const craft = async (recipe: CraftingRecipe, quantity: number) => {
    await action('/api/v1/crafting/craft', { recipeSlug: recipe.slug, quantity }, `${quantity} × ${recipe.name} fabrication started`);
  };

  return (
    <div className="page-stack fabrication-console">
      <section className="fabrication-console__masthead">
        <div><span className="nw-eyebrow">STATION FABRICATION // INDUSTRIAL BAY</span><h2>Crafting Network</h2><p>Convert recovered salvage into fuel, repair parts, supplies, and advanced station components.</p></div>
        <div className="fabrication-console__status"><NWIcon name="resources" size={28} /><div><span>Fabricators</span><strong>{unlockedRecipes.length} Online</strong></div></div>
      </section>

      <ResponsiveGrid min="11rem" className="fabrication-summary-grid">
        <StatusDisplay label="Schematics" value={recipes.length} icon="data" tone="purple" />
        <StatusDisplay label="Ready Now" value={readyRecipes.length} icon="resources" tone={readyRecipes.length ? 'success' : 'warning'} />
        <StatusDisplay label="Affordable Batches" value={affordableBatches} icon="cargo" tone="info" />
        <StatusDisplay label="Mean Efficiency" value={averageEfficiency} unit="%" icon="integrity" tone={averageEfficiency >= 100 ? 'success' : 'warning'} />
      </ResponsiveGrid>

      <Panel className="fabrication-network-panel">
        <SectionTitle eyebrow="PRODUCTION BUS" title="Fabricator Readiness" description="Only modules and recipes returned by the live content system are represented here." icon="signal" />
        <div className="trait-list">
          {onlineModules.map(module => <Pill key={module} tone="success">{module} online</Pill>)}
          {!onlineModules.length && <Pill tone="warning">No fabricators online</Pill>}
          {readyRecipes.map(recipe => <Pill key={recipe.slug} tone="purple">{recipe.name}: {affordableFor(recipe)} batches</Pill>)}
        </div>
      </Panel>

      <div className="fabrication-grid">
        {recipes.map(recipe => {
          const maxAffordable = affordableFor(recipe);
          const quantity = quantities[recipe.slug] ?? 1;
          const ready = maxAffordable >= quantity;
          const remaining = cooldownRemaining(cooldowns, `craft:${recipe.slug}`, now);
          const setQuantity = (value: number) => setQuantities(current => ({ ...current, [recipe.slug]: Math.max(1, Math.min(10, value)) }));
          const primaryOutput = Object.keys(recipe.outputs)[0] ?? 'resources';
          return (
            <article key={recipe.slug} className={`fabrication-card ${recipe.unlocked ? 'is-online' : 'is-locked'}`}>
              <header>
                <div className="fabrication-card__icon"><NWIcon name={itemIcon(primaryOutput)} size={42} /></div>
                <div><span className="nw-eyebrow">{recipe.stationModule} fabricator</span><h3>{recipe.name}</h3></div>
                <Badge tone={recipe.unlocked ? 'success' : 'warning'}>{recipe.unlocked ? 'ONLINE' : 'LOCKED'}</Badge>
              </header>

              <div className="fabrication-card__flow">
                <div className="fabrication-materials">
                  <span>Input Materials</span>
                  {Object.entries(recipe.inputs).map(([slug, amount]) => <div key={slug} className={held(slug) >= amount * quantity ? 'is-ready' : 'is-missing'}><NWIcon name={itemIcon(slug)} size={20} /><strong>{nameFor(slug)}</strong><small className="nw-numeric">{held(slug).toLocaleString()} / {(amount * quantity).toLocaleString()}</small></div>)}
                </div>
                <div className="fabrication-arrow"><NWIcon name="signal" size={24} /><span>{recipe.durationSeconds * quantity}s</span></div>
                <div className="fabrication-output">
                  <span>Output</span>
                  {Object.entries(recipe.outputs).map(([slug, amount]) => <div key={slug}><NWIcon name={itemIcon(slug)} size={32} /><strong>{amount * quantity} × {nameFor(slug)}</strong></div>)}
                </div>
              </div>

              <div className="fabrication-card__economy">
                <div><span>Input Value</span><strong className="nw-numeric">{(recipe.inputValue * quantity).toLocaleString()} cr</strong></div>
                <div><span>Output Value</span><strong className="nw-numeric">{(recipe.outputValue * quantity).toLocaleString()} cr</strong></div>
                <div><span>Efficiency</span><strong className="nw-numeric">{Math.round(recipe.efficiency * 100)}%</strong></div>
              </div>

              <div className="fabrication-card__batch">
                <span>Batch Size</span>
                <Button type="button" size="sm" variant="ghost" disabled={quantity <= 1} aria-label={`Decrease ${recipe.name} batch`} onClick={() => setQuantity(quantity - 1)}>−</Button>
                <strong className="nw-numeric">{quantity}</strong>
                <Button type="button" size="sm" variant="ghost" disabled={quantity >= 10} aria-label={`Increase ${recipe.name} batch`} onClick={() => setQuantity(quantity + 1)}>+</Button>
                <Pill tone={ready ? 'success' : 'warning'}>{maxAffordable} affordable</Pill>
              </div>

              <Button fullWidth disabled={!recipe.unlocked || !ready || remaining > 0} onClick={() => void craft(recipe, quantity)}>{remaining > 0 ? `Ready in ${formatCountdown(remaining)}` : !recipe.unlocked ? 'Station Module Offline' : ready ? `Fabricate Batch ×${quantity}` : `Need Materials for ×${quantity}`}</Button>
            </article>
          );
        })}
      </div>

      {!recipes.length && <Notification title="No fabrication schematics" tone="info">No crafting recipes were returned by the content service.</Notification>}
    </div>
  );
}
