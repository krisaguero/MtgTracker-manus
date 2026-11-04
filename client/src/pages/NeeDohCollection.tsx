import { useMemo, useState } from 'react';
import { Link } from 'wouter';
import { Check, Minus, Plus, RotateCcw, Search, Sparkles } from 'lucide-react';
import { InternalPageNav } from '@/components/InternalPageNav';
import { needohCategories, needohStyles, needohTextures, type NeeDohCategory } from '@/lib/needohCatalog';

const STORAGE_KEY = 'mtg-tracker.needoh-collection.v1';

type CollectionState = Record<string, number>;

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
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* best effort */ }
}

export default function NeeDohCollection() {
  const [collection, setCollection] = useState<CollectionState>(loadCollection);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [texture, setTexture] = useState('All');
  const [ownedOnly, setOwnedOnly] = useState(false);
  const [showVariants, setShowVariants] = useState(false);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return needohStyles.filter((item) => {
      const matchesQuery = !needle || [item.name, item.category, item.texture, item.note, ...item.variants].join(' ').toLowerCase().includes(needle);
      const matchesCategory = category === 'All' || item.category === category;
      const matchesTexture = texture === 'All' || item.texture === texture;
      const matchesOwned = !ownedOnly || Boolean(collection[item.id]);
      return matchesQuery && matchesCategory && matchesTexture && matchesOwned;
    });
  }, [category, collection, ownedOnly, query, texture]);

  const ownedStyles = Object.values(collection).filter((value) => value > 0).length;
  const ownedPieces = Object.values(collection).reduce((sum, value) => sum + value, 0);
  const updateQuantity = (id: string, delta: number) => {
    setCollection((current) => {
      const next = { ...current };
      const quantity = Math.max(0, (next[id] || 0) + delta);
      if (quantity) next[id] = quantity;
      else delete next[id];
      saveCollection(next);
      return next;
    });
  };
  const clearCollection = () => {
    if (!window.confirm('Clear the browser-stored NeeDoh collection?')) return;
    setCollection({});
    saveCollection({});
  };

  return <>
    <InternalPageNav />
    <main className="min-h-screen bg-background text-foreground">
      <section className="border-b-2 border-border bg-gradient-to-br from-fuchsia-100 via-background to-cyan-100 px-4 py-10 dark:from-fuchsia-950/30 dark:to-cyan-950/30 sm:px-8">
        <div className="mx-auto max-w-[1440px]">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-3xl">
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.28em] text-primary">Browser collection index</p>
              <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">NeeDoh catalog</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">A collector-facing checklist for the original Schylling NeeDoh family: glob styles, Nice Cube variants, Jelly Squish, Beedoh-style jelly references, seasonal releases, teenies, and multipacks.</p>
              <p className="mt-3 max-w-2xl border-l-4 border-primary pl-3 text-sm leading-6 text-muted-foreground"><strong className="text-foreground">Naming note:</strong> the official oversized cube is <em>Nice Berg</em>, not “Iceberg.” I included Nice Berg, Nice Berg Swirl, Nice Ice Baby, and Nice Cube families so the common search terms still resolve.</p>
            </div>
            <div className="min-w-[230px] border-2 border-border bg-background p-4 shadow-[6px_6px_0_hsl(var(--border))]">
              <p className="font-mono text-[10px] font-black uppercase tracking-widest text-muted-foreground">Your browser ledger</p>
              <p className="mt-2 text-4xl font-black text-primary">{ownedStyles}</p>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">styles collected</p>
              <p className="mt-3 text-sm font-semibold">{ownedPieces} total pieces recorded</p>
              <button type="button" onClick={clearCollection} className="mt-4 inline-flex items-center gap-2 border border-border px-3 py-2 text-xs font-black uppercase tracking-wider text-muted-foreground hover:border-destructive hover:text-destructive"><RotateCcw className="h-3.5 w-3.5" /> Clear ledger</button>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap gap-2 text-xs font-bold">
            <span className="border-2 border-primary bg-primary px-3 py-2 text-primary-foreground">{needohStyles.length} indexed styles</span>
            <span className="border-2 border-border bg-background px-3 py-2">{needohStyles.reduce((sum, item) => sum + item.variants.length, 0)} named variants</span>
            <span className="border-2 border-border bg-background px-3 py-2">local-only by default</span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-4 py-6 sm:px-8">
        <div className="border-2 border-border bg-card p-4 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[minmax(240px,1.5fr)_repeat(2,minmax(170px,0.7fr))_auto]">
            <label className="relative block"><span className="sr-only">Search NeeDoh styles</span><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search Nice Berg, Jelly, cats, holiday…" className="h-10 w-full border-2 border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary" /></label>
            <label className="block"><span className="sr-only">Filter by category</span><select value={category} onChange={(event) => setCategory(event.target.value)} className="h-10 w-full border-2 border-border bg-background px-3 text-sm font-semibold outline-none focus:border-primary">{needohCategories.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="block"><span className="sr-only">Filter by texture</span><select value={texture} onChange={(event) => setTexture(event.target.value)} className="h-10 w-full border-2 border-border bg-background px-3 text-sm font-semibold outline-none focus:border-primary">{needohTextures.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="flex h-10 items-center gap-2 border-2 border-border px-3 text-xs font-black uppercase tracking-wide"><input type="checkbox" checked={ownedOnly} onChange={(event) => setOwnedOnly(event.target.checked)} /> Collected only</label>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-xs text-muted-foreground"><span>Showing <strong className="text-foreground">{filtered.length}</strong> of {needohStyles.length} styles</span><label className="flex items-center gap-2 font-bold"><input type="checkbox" checked={showVariants} onChange={(event) => setShowVariants(event.target.checked)} /> Show named color / expression variants</label></div>
        </div>

        {filtered.length === 0 ? <div className="border-2 border-dashed border-primary/40 p-10 text-center"><Sparkles className="mx-auto h-8 w-8 text-primary" /><h2 className="mt-3 text-xl font-black">No matching styles</h2><p className="mt-2 text-sm text-muted-foreground">Clear a filter or search for a broader term.</p></div> : <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{filtered.map((item) => { const quantity = collection[item.id] || 0; return <article key={item.id} className={`border-2 p-4 transition-colors ${quantity ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}>
          <div className="flex items-start justify-between gap-3"><div><p className="font-mono text-[10px] font-black uppercase tracking-widest text-primary">{item.category}</p><h2 className="mt-1 text-xl font-black">{item.name}</h2></div>{quantity > 0 && <span className="inline-flex shrink-0 items-center gap-1 border border-primary bg-primary px-2 py-1 text-[10px] font-black uppercase text-primary-foreground"><Check className="h-3 w-3" /> {quantity}</span>}</div>
          <p className="mt-2 text-sm font-semibold text-muted-foreground">{item.texture}</p>{item.note && <p className="mt-2 text-xs leading-5 text-muted-foreground">{item.note}</p>}
          {showVariants && item.variants.length > 0 && <div className="mt-3 border-t border-border pt-3"><p className="font-mono text-[10px] font-black uppercase tracking-wider text-muted-foreground">Named variants</p><div className="mt-2 flex flex-wrap gap-1">{item.variants.map((variant) => <span key={variant} className="border border-border bg-background px-2 py-1 text-[11px]">{variant}</span>)}</div></div>}
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3"><span className="text-xs font-bold text-muted-foreground">{quantity ? 'In your collection' : 'Not recorded'}</span><div className="flex items-center border-2 border-border"><button type="button" aria-label={`Remove one ${item.name}`} onClick={() => updateQuantity(item.id, -1)} disabled={!quantity} className="p-2 text-muted-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-30"><Minus className="h-4 w-4" /></button><span className="min-w-8 text-center text-sm font-black">{quantity}</span><button type="button" aria-label={`Add one ${item.name}`} onClick={() => updateQuantity(item.id, 1)} className="border-l border-border bg-primary p-2 text-primary-foreground hover:bg-primary/80"><Plus className="h-4 w-4" /></button></div></div>
        </article>; })}</div>}
        <div className="mt-8 border-l-4 border-primary bg-muted/40 p-4 text-sm leading-6 text-muted-foreground"><strong className="text-foreground">Collection storage:</strong> this ledger is stored only in this browser under <code className="font-mono text-xs">mtg-tracker.needoh-collection.v1</code>. It is separate from your MTG card inventory and will not upload to your account or ManaBox workspace. Use the browser backup controls for broader workspace backups only after checking their scope.</div>
        <p className="mt-6 text-xs text-muted-foreground">Catalog basis: Schylling’s official NeeDoh pages plus the Adventure Town Toys field guide, cross-checked against the NeeDohTracker catalog. Availability and regional releases can change, especially seasonal and 2027-noted entries. <Link href="/collection" className="font-bold text-primary underline">Return to MTG collection tools</Link>.</p>
      </section>
    </main>
  </>;
}
