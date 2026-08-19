// Design philosophy: hard-edged MTG editorial archive, with chronology as the main structure, color-coded filter chips, and product art left unobscured.
import { useMemo, useState } from 'react';
import { ArrowDownUp, ArrowLeft, CalendarDays, ExternalLink, Layers3, Search, Sparkles } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { commanderDecklistsData } from '@/data/commanderDecklistsData';
import { classifySet, useCommanderLibrary, type CommanderArchiveSet } from '@/hooks/useCommanderLibrary';
import { CatalogSkeleton } from '@/components/CatalogSkeleton';

type FamilyFilter = 'all' | 'set' | 'universes' | 'starter';
type CoverageFilter = 'all' | 'with-products' | 'with-local';
type SortMode = 'newest' | 'oldest' | 'cards' | 'products';

const FAMILY_LABELS: Record<FamilyFilter, string> = {
  all: 'All families',
  set: 'Set-linked',
  universes: 'Universes Beyond',
  starter: 'Starter products',
};

export default function CommanderLibrary() {
  const [, navigate] = useLocation();
  const { sets, loading, productsLoading, error } = useCommanderLibrary();
  const [query, setQuery] = useState('');
  const [family, setFamily] = useState<FamilyFilter>('all');
  const [coverage, setCoverage] = useState<CoverageFilter>('all');
  const [year, setYear] = useState('all');
  const [sortMode, setSortMode] = useState<SortMode>('newest');

  const years = useMemo(() => Array.from(new Set(sets.map((set) => set.released_at.slice(0, 4)))), [sets]);
  const localSetCodes = useMemo(() => new Set(commanderDecklistsData.map((deck) => deck.set_code.toLowerCase())), []);
  const filteredSets = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return [...sets]
      .filter((set) => {
        const kind = classifySet(set);
        const matchesQuery = !normalized || set.name.toLowerCase().includes(normalized) || set.code.toLowerCase().includes(normalized) || set.products.some((product) => product.name.toLowerCase().includes(normalized));
        const matchesFamily = family === 'all' || kind === family;
        const matchesCoverage = coverage === 'all' || (coverage === 'with-products' ? set.products.length > 0 : localSetCodes.has(set.code.toLowerCase()));
        const matchesYear = year === 'all' || set.released_at.startsWith(year);
        return matchesQuery && matchesFamily && matchesCoverage && matchesYear;
      })
      .sort((a, b) => {
        if (sortMode === 'oldest') return dateValue(a) - dateValue(b);
        if (sortMode === 'cards') return b.card_count - a.card_count || dateValue(b) - dateValue(a);
        if (sortMode === 'products') return b.products.length - a.products.length || dateValue(b) - dateValue(a);
        return dateValue(b) - dateValue(a);
      });
  }, [coverage, family, localSetCodes, query, sets, sortMode, year]);

  const productCount = sets.reduce((sum, set) => sum + set.products.length, 0);
  const localCount = sets.filter((set) => localSetCodes.has(set.code.toLowerCase())).length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="w-full px-4 py-3 sm:px-6 lg:px-8 2xl:px-12">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to timeline</Link>
            <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              <span className="border border-border bg-card px-3 py-2">{sets.length} releases</span>
              <span className="border border-border bg-card px-3 py-2">{productCount} products</span>
              <span className="border border-primary/30 bg-primary/5 px-3 py-2 text-primary">2022 → now</span>
            </div>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-center">
            <div className="border-l-4 border-primary pl-4 sm:pl-5">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Commander archive / live Scryfall index</p>
              <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em] sm:text-5xl">The Commander shelf, tracked over time.</h1>
              <p className="mt-2 max-w-4xl text-sm leading-relaxed text-muted-foreground sm:text-base">A chronological library of Commander releases from 2022 forward. Filter by release year, product family, live product records, or local decklist coverage without losing the art that makes each shelf distinct.</p>
            </div>
            <div className="border-t border-border pt-3 text-xs leading-relaxed text-muted-foreground lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0"><strong className="text-foreground">Archive rule.</strong> The release index comes from Scryfall; local decklists are labeled separately so imported collection matching never implies unsupported coverage.</div>
          </div>
        </div>
      </header>

      <main className="w-full px-4 py-4 sm:px-6 sm:py-10 lg:px-8 2xl:px-12">
        {loading && <CatalogSkeleton kind="timeline" label="Loading historical Commander releases" />}
        {error && <div className="border-2 border-destructive/50 bg-destructive/10 p-6"><h2 className="font-bold text-destructive">Commander archive unavailable</h2><p className="mt-2 text-sm text-destructive/80">{error}</p></div>}

        {!loading && !error && (
          <>
            <section className="grid gap-px border border-border bg-border md:grid-cols-3">
              <ArchiveStat icon={<CalendarDays className="h-5 w-5" />} label="Release span" value={years.length ? `${years.at(-1)} → ${years[0]}` : '—'} detail="Set chronology from the live index" />
              <ArchiveStat icon={<Layers3 className="h-5 w-5" />} label="Cataloged products" value={`${productCount}`} detail={productsLoading ? 'Product cards still resolving' : 'Scryfall product records found'} />
              <ArchiveStat icon={<Sparkles className="h-5 w-5" />} label="Local coverage" value={`${localCount} releases`} detail="Decklists available for collection matching" />
            </section>

            <section className="mt-10 border-y border-border py-5" aria-labelledby="commander-archive-controls">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div><p className="text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">Archive controls</p><h2 id="commander-archive-controls" className="mt-2 text-2xl font-bold">Filter the shelf without hiding the evidence.</h2></div>
                <p className="text-sm text-muted-foreground">Showing {filteredSets.length} of {sets.length} Commander releases.</p>
              </div>
              <div className="mt-5 grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto_auto]">
                <label className="relative block"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search release names, codes, or product names" aria-label="Search Commander releases" className="h-11 w-full border border-border bg-card pl-10 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" /></label>
                <label className="flex h-11 items-center gap-2 border border-border bg-card px-3 text-sm"><span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Year</span><select value={year} onChange={(event) => setYear(event.target.value)} className="bg-transparent font-semibold outline-none"><option value="all">All years</option>{years.map((entry) => <option key={entry} value={entry}>{entry}</option>)}</select></label>
                <label className="flex h-11 items-center gap-2 border border-border bg-card px-3 text-sm"><ArrowDownUp className="h-4 w-4 text-muted-foreground" /><span className="sr-only">Sort Commander archive</span><select value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)} className="bg-transparent font-semibold outline-none"><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="products">Most products</option><option value="cards">Largest card index</option></select></label>
              </div>
              <div className="mt-4 flex flex-wrap gap-2" aria-label="Commander archive filters">
                {(Object.keys(FAMILY_LABELS) as FamilyFilter[]).map((value) => <FilterChip key={value} active={family === value} onClick={() => setFamily(value)}>{FAMILY_LABELS[value]}</FilterChip>)}
                <span className="hidden h-6 w-px bg-border sm:block" aria-hidden="true" />
                <FilterChip active={coverage === 'all'} onClick={() => setCoverage('all')}>All coverage</FilterChip>
                <FilterChip active={coverage === 'with-products'} tone="teal" onClick={() => setCoverage('with-products')}>Live products</FilterChip>
                <FilterChip active={coverage === 'with-local'} tone="amber" onClick={() => setCoverage('with-local')}>Local decklists</FilterChip>
              </div>
            </section>

            <section className="mt-8" aria-label="Chronological Commander release archive">
              {filteredSets.length === 0 ? <div className="border-2 border-dashed border-border p-12 text-center text-sm text-muted-foreground">No Commander releases match those filters. <button type="button" onClick={() => { setQuery(''); setFamily('all'); setCoverage('all'); setYear('all'); }} className="font-semibold text-primary hover:underline">Clear the archive filters.</button></div> : <div className="relative space-y-8 pl-7 before:absolute before:bottom-0 before:left-2 before:top-0 before:w-0.5 before:bg-primary/25 lg:space-y-10 lg:pl-0">{filteredSets.map((set, index) => <div key={set.id} className="relative grid gap-4 lg:grid-cols-[170px_minmax(0,1fr)] lg:gap-8"><div className="relative lg:pt-7"><span className="absolute -left-[31px] top-7 h-4 w-4 border-2 border-background bg-primary lg:left-auto lg:right-[-25px]" /><p className="text-xs font-black uppercase tracking-[0.18em] text-primary">{formatDate(set.released_at)}</p><p className="mt-1 font-mono text-sm font-bold text-foreground">{set.code.toUpperCase()}</p><p className="mt-2 text-xs leading-relaxed text-muted-foreground">{set.card_count} indexed cards</p></div><div className={index % 2 === 0 ? 'lg:translate-x-0' : 'lg:translate-x-8'}><CommanderArchiveCard set={set} hasLocalDecklist={localSetCodes.has(set.code.toLowerCase())} onOpen={() => navigate(`/${set.parent_set_code || set.code}`)} /></div></div>)}</div>}
            </section>
          </>
        )}
      </main>

      <footer className="mt-12 border-t border-border bg-muted/30 py-8"><div className="w-full px-4 text-center text-sm text-muted-foreground sm:px-6 lg:px-8 2xl:px-12"><p>Archive metadata and product discovery powered by <a href="https://scryfall.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline">Scryfall</a>. Magic: The Gathering is © Wizards of the Coast.</p></div></footer>
    </div>
  );
}

function dateValue(set: CommanderArchiveSet) { return new Date(`${set.released_at}T00:00:00`).getTime(); }

function ArchiveStat({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: string; detail: string }) {
  return <div className="bg-card p-5"><div className="text-primary">{icon}</div><p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p><p className="mt-1 text-sm text-muted-foreground">{detail}</p></div>;
}

function FilterChip({ children, active, onClick, tone = 'indigo' }: { children: React.ReactNode; active: boolean; onClick: () => void; tone?: 'indigo' | 'teal' | 'amber' }) {
  const tones = { indigo: 'border-primary/40 text-primary', teal: 'border-teal-600/40 text-teal-700', amber: 'border-amber-600/50 text-amber-800' };
  return <button type="button" onClick={onClick} className={`border px-3 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${active ? 'border-primary bg-primary text-primary-foreground' : `bg-card hover:bg-muted ${tones[tone]}`}`}>{children}</button>;
}

function CommanderArchiveCard({ set, hasLocalDecklist, onOpen }: { set: CommanderArchiveSet; hasLocalDecklist: boolean; onOpen: () => void }) {
  return <article className="border-2 border-border bg-card p-5 transition-colors hover:border-primary sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{formatDate(set.released_at)} · {set.code.toUpperCase()}</p><h3 className="mt-2 text-2xl font-bold tracking-tight">{set.name}</h3><p className="mt-2 text-sm text-muted-foreground">{set.card_count} cards in the Scryfall index</p></div><div className="flex flex-wrap justify-end gap-2 text-[10px] font-bold uppercase tracking-wider"><span className="border border-border bg-background px-2 py-1">{classifySet(set)}</span>{hasLocalDecklist && <span className="border border-amber-600/50 bg-amber-500/10 px-2 py-1 text-amber-800">Local decklists</span>}</div></div><div className="mt-5 grid gap-3 sm:grid-cols-2">{set.products.length > 0 ? set.products.map((product) => <div key={product.id} className="flex min-w-0 gap-3 border border-border bg-background p-3"><div className="h-24 w-16 shrink-0 overflow-hidden bg-muted">{product.imageUrl ? <img src={product.imageUrl} alt="" className="h-full w-full object-contain" loading="lazy" /> : <div className="flex h-full items-center justify-center p-2 text-center text-[10px] text-muted-foreground">No art</div>}</div><div className="min-w-0"><p className="font-semibold leading-snug">{product.name}</p><p className="mt-2 text-xs text-muted-foreground">{product.cardCount ? `${product.cardCount} cards` : 'Product record'}</p>{product.scryfall_uri && <a href={product.scryfall_uri} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline">Scryfall <ExternalLink className="h-3 w-3" /></a>}</div></div>) : <div className="border border-dashed border-border p-4 text-sm text-muted-foreground">Scryfall has not exposed a product card for this release yet; the set catalog remains available.</div>}</div><div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4"><p className="text-xs leading-relaxed text-muted-foreground">{hasLocalDecklist ? 'Collection matching is available for at least one local decklist in this release.' : 'Use the live set catalog to browse every indexed card.'}</p><button type="button" onClick={onOpen} className="inline-flex items-center gap-2 border border-primary bg-primary px-3 py-2 text-xs font-bold uppercase tracking-wider text-primary-foreground transition-colors hover:bg-primary/90">Open set catalog <ExternalLink className="h-3 w-3" /></button></div></article>;
}

function formatDate(value: string) { return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(`${value}T00:00:00`)); }
