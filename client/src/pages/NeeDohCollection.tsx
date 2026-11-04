import { useMemo, useState } from 'react';
import { Link } from 'wouter';
import { Check, Minus, Plus, RotateCcw, Search, Sparkles } from 'lucide-react';
import { InternalPageNav } from '@/components/InternalPageNav';
import { alternativeCategories, needohAlternatives, needohCategories, needohChecklistItems, needohTextures, type ProductChecklistItem } from '@/lib/needohCatalog';

const STORAGE_KEY = 'mtg-tracker.needoh-collection.v2';
type CollectionState = Record<string, number>;
type Tab = 'needoh' | 'alternatives';

function loadCollection(): CollectionState {
  if (typeof window === 'undefined') return {};
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}');
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return Object.fromEntries(Object.entries(parsed).filter(([, value]) => Number.isSafeInteger(value) && Number(value) > 0).map(([key, value]) => [key, Number(value)]));
  } catch { return {}; }
}

function saveCollection(next: CollectionState) {
  if (typeof window === 'undefined') return;
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* browser storage is best effort */ }
}

function ChecklistRow({ item, quantity, onChange }: { item: ProductChecklistItem; quantity: number; onChange: (delta: number) => void }) {
  return <article className={`border-2 p-4 transition-colors ${quantity ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}>
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0"><p className="font-mono text-[10px] font-black uppercase tracking-widest text-primary">{item.family}</p><h2 className="mt-1 text-base font-black leading-5">{item.name}</h2></div>
      {quantity > 0 && <span className="inline-flex shrink-0 items-center gap-1 border border-primary bg-primary px-2 py-1 text-[10px] font-black uppercase text-primary-foreground"><Check className="h-3 w-3" /> {quantity}</span>}
    </div>
    <p className="mt-2 text-xs font-semibold text-muted-foreground">{item.category} · {item.texture}</p>
    {item.note && <p className="mt-2 text-xs leading-5 text-muted-foreground">{item.note}</p>}
    <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3"><span className="text-xs font-bold text-muted-foreground">{quantity ? 'Collected' : 'Not recorded'}</span><div className="flex items-center border-2 border-border"><button type="button" aria-label={`Remove one ${item.name}`} onClick={() => onChange(-1)} disabled={!quantity} className="p-2 text-muted-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-30"><Minus className="h-4 w-4" /></button><span className="min-w-8 text-center text-sm font-black">{quantity}</span><button type="button" aria-label={`Add one ${item.name}`} onClick={() => onChange(1)} className="border-l border-border bg-primary p-2 text-primary-foreground hover:bg-primary/80"><Plus className="h-4 w-4" /></button></div></div>
  </article>;
}

export default function NeeDohCollection() {
  const [collection, setCollection] = useState<CollectionState>(loadCollection);
  const [tab, setTab] = useState<Tab>('needoh');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [texture, setTexture] = useState('All');
  const [ownedOnly, setOwnedOnly] = useState(false);

  const sourceItems = tab === 'needoh' ? needohChecklistItems : needohAlternatives;
  const categoryOptions = tab === 'needoh' ? needohCategories : alternativeCategories;
  const textureOptions = tab === 'needoh' ? needohTextures : ['All', ...Array.from(new Set(needohAlternatives.map((item) => item.texture)))];
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return sourceItems.filter((item) => {
      const matchesQuery = !needle || [item.name, item.family, item.category, item.texture, item.note].join(' ').toLowerCase().includes(needle);
      const matchesCategory = category === 'All' || item.category === category;
      const matchesTexture = texture === 'All' || item.texture === texture;
      const matchesOwned = !ownedOnly || Boolean(collection[item.id]);
      return matchesQuery && matchesCategory && matchesTexture && matchesOwned;
    });
  }, [category, collection, ownedOnly, query, sourceItems, texture]);

  const ownedOfficial = needohChecklistItems.filter((item) => collection[item.id]).length;
  const ownedAlternatives = needohAlternatives.filter((item) => collection[item.id]).length;
  const totalPieces = Object.values(collection).reduce((sum, value) => sum + value, 0);
  const updateQuantity = (id: string, delta: number) => setCollection((current) => { const next = { ...current }; const quantity = Math.max(0, (next[id] || 0) + delta); if (quantity) next[id] = quantity; else delete next[id]; saveCollection(next); return next; });
  const clearCollection = () => { if (!window.confirm('Clear the browser-stored sensory collection?')) return; setCollection({}); saveCollection({}); };
  const resetFilters = () => { setQuery(''); setCategory('All'); setTexture('All'); setOwnedOnly(false); };

  return <>
    <InternalPageNav />
    <main className="min-h-screen bg-background text-foreground">
      <section className="border-b-2 border-border bg-gradient-to-br from-fuchsia-100 via-background to-cyan-100 px-4 py-10 dark:from-fuchsia-950/30 dark:to-cyan-950/30 sm:px-8"><div className="mx-auto max-w-[1440px]">
        <div className="flex flex-wrap items-start justify-between gap-6"><div className="max-w-3xl"><p className="font-mono text-[10px] font-black uppercase tracking-[0.28em] text-primary">Sensory product checklist</p><h1 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">NeeDoh & alternatives</h1><p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">Track every named NeeDoh color, expression, character, seasonal item, and multipack separately. Switch to Alternatives for the attached Speks Gump, Blur, and Fleks checklist.</p><p className="mt-3 max-w-2xl border-l-4 border-primary pl-3 text-sm leading-6 text-muted-foreground"><strong className="text-foreground">Separate ledgers:</strong> alternatives are useful comparison products, but they are never counted toward your official NeeDoh completion percentage.</p></div>
          <div className="min-w-[240px] border-2 border-border bg-background p-4 shadow-[6px_6px_0_hsl(var(--border))]"><p className="font-mono text-[10px] font-black uppercase tracking-widest text-muted-foreground">Browser ledger</p><div className="mt-2 grid grid-cols-2 gap-3"><div><p className="text-3xl font-black text-primary">{ownedOfficial}</p><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">NeeDoh rows</p></div><div><p className="text-3xl font-black text-primary">{ownedAlternatives}</p><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">alternative rows</p></div></div><p className="mt-3 text-sm font-semibold">{totalPieces} total pieces recorded</p><button type="button" onClick={clearCollection} className="mt-4 inline-flex items-center gap-2 border border-border px-3 py-2 text-xs font-black uppercase tracking-wider text-muted-foreground hover:border-destructive hover:text-destructive"><RotateCcw className="h-3.5 w-3.5" /> Clear ledger</button></div>
        </div>
        <div className="mt-8 flex flex-wrap gap-2 text-xs font-bold"><span className="border-2 border-primary bg-primary px-3 py-2 text-primary-foreground">{needohChecklistItems.length} NeeDoh checklist rows</span><span className="border-2 border-border bg-background px-3 py-2">{needohAlternatives.length} alternative rows</span><span className="border-2 border-border bg-background px-3 py-2">variant-level tracking</span></div>
      </div></section>

      <section className="mx-auto max-w-[1440px] px-4 py-6 sm:px-8">
        <div className="grid gap-2 sm:grid-cols-2"><button type="button" onClick={() => { setTab('needoh'); resetFilters(); }} className={`border-2 p-4 text-left ${tab === 'needoh' ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card'}`}><p className="font-mono text-[10px] font-black uppercase tracking-widest">Official family</p><p className="mt-1 text-xl font-black">NeeDoh checklist</p><p className="mt-1 text-xs opacity-80">{needohChecklistItems.length} individual rows from the indexed catalog</p></button><button type="button" onClick={() => { setTab('alternatives'); resetFilters(); }} className={`border-2 p-4 text-left ${tab === 'alternatives' ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card'}`}><p className="font-mono text-[10px] font-black uppercase tracking-widest">Attached guides</p><p className="mt-1 text-xl font-black">Non-NeeDoh alternatives</p><p className="mt-1 text-xs opacity-80">Speks, dumplings, sugar gel, jumbos, characters, and budget hunts</p></button></div>
        <div className="mt-5 border-2 border-border bg-card p-4 shadow-sm"><div className="grid gap-3 lg:grid-cols-[minmax(240px,1.5fr)_repeat(2,minmax(170px,0.7fr))_auto]"><label className="relative block"><span className="sr-only">Search products</span><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search colors, characters, textures…" className="h-10 w-full border-2 border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary" /></label><select aria-label="Filter by category" value={category} onChange={(event) => setCategory(event.target.value)} className="h-10 w-full border-2 border-border bg-background px-3 text-sm font-semibold outline-none focus:border-primary">{categoryOptions.map((item) => <option key={item}>{item}</option>)}</select><select aria-label="Filter by texture" value={texture} onChange={(event) => setTexture(event.target.value)} className="h-10 w-full border-2 border-border bg-background px-3 text-sm font-semibold outline-none focus:border-primary">{textureOptions.map((item) => <option key={item}>{item}</option>)}</select><label className="flex h-10 items-center gap-2 border-2 border-border px-3 text-xs font-black uppercase tracking-wide"><input type="checkbox" checked={ownedOnly} onChange={(event) => setOwnedOnly(event.target.checked)} /> Collected only</label></div><div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-xs text-muted-foreground"><span>Showing <strong className="text-foreground">{filtered.length}</strong> of {sourceItems.length} rows</span><button type="button" onClick={resetFilters} className="font-bold text-primary underline">Reset filters</button></div></div>

        {filtered.length === 0 ? <div className="mt-6 border-2 border-dashed border-primary/40 p-10 text-center"><Sparkles className="mx-auto h-8 w-8 text-primary" /><h2 className="mt-3 text-xl font-black">No matching checklist rows</h2><p className="mt-2 text-sm text-muted-foreground">Clear a filter or search for a broader term.</p></div> : <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{filtered.map((item) => <ChecklistRow key={item.id} item={item} quantity={collection[item.id] || 0} onChange={(delta) => updateQuantity(item.id, delta)} />)}</div>}
        <div className="mt-8 border-l-4 border-primary bg-muted/40 p-4 text-sm leading-6 text-muted-foreground"><strong className="text-foreground">Storage:</strong> this checklist is saved only in this browser under <code className="font-mono text-xs">mtg-tracker.needoh-collection.v2</code>. It is separate from your MTG cards, decks, and ManaBox workspace.</div>
        <p className="mt-6 text-xs leading-5 text-muted-foreground">NeeDoh catalog basis: Schylling’s official product pages, the NeeDohTracker catalog, and the Adventure Town Toys field guide. Alternative rows come from the attached Speks guide, the supplied holiday buyer’s guide, and current Speks product listings. Retailer, price, and availability notes are reference points rather than live inventory. Product names and colorways can change by region and season. <Link href="/collection" className="font-bold text-primary underline">Return to MTG collection tools</Link>.</p>
      </section>
    </main>
  </>;
}
