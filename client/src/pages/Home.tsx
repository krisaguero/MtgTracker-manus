import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Bookmark, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { SetCard } from '@/components/SetCard';
import { HomePreconCard } from '@/components/HomePreconCard';
import { CatalogSkeleton } from '@/components/CatalogSkeleton';
import { useScryfallSets } from '@/hooks/useScryfallSets';
import { buildHomePreconIndex, homePreconProductKey } from '@/lib/homePreconIndex';
import { buildHomePreconSummary, formatHomePreconCatalogSummary, formatHomePreconSummary } from '@/lib/homePreconSummary';
import { getCatalogPage } from '@/lib/homeCatalogPagination';

type SetTypeFilter = 'all' | 'expansion' | 'core' | 'masters';
type SortMode = 'newest' | 'oldest' | 'value' | 'cards';
type CatalogView = 'sets' | 'precons';

function CatalogPagination({
  label,
  page,
  pageCount,
  start,
  end,
  total,
  onPageChange,
  scrollTargetId,
}: {
  label: string;
  page: number;
  pageCount: number;
  start: number;
  end: number;
  total: number;
  onPageChange: (page: number) => void;
  scrollTargetId: string;
}) {
  if (pageCount <= 1) return null;

  const changePage = (nextPage: number) => {
    onPageChange(nextPage);
    const target = document.getElementById(scrollTargetId);
    if (target) {
      window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 16, behavior: 'smooth' });
    }
  };

  return (
    <nav aria-label={`${label} pagination`} className="mt-6 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p aria-live="polite" className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">Showing {start}–{end} of {total}</p>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => changePage(page - 1)} disabled={page <= 1} className="border border-border bg-card px-3 py-2 font-mono text-xs font-black uppercase disabled:cursor-not-allowed disabled:opacity-40 hover:enabled:border-primary">Previous</button>
        <span aria-current="page" className="min-w-24 text-center font-mono text-xs font-bold uppercase text-muted-foreground">Page {page} of {pageCount}</span>
        <button type="button" onClick={() => changePage(page + 1)} disabled={page >= pageCount} className="border border-border bg-card px-3 py-2 font-mono text-xs font-black uppercase disabled:cursor-not-allowed disabled:opacity-40 hover:enabled:border-primary">Next</button>
      </div>
    </nav>
  );
}

const SET_TYPE_LABELS: Record<SetTypeFilter, string> = {
  all: 'All set types',
  expansion: 'Expansions',
  core: 'Core sets',
  masters: 'Masters',
};

function readStoredStringList(key: string): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = window.localStorage.getItem(key);
    const parsed: unknown = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

export default function Home() {
  const { sets, precons, localDecklists, localDecklistError, loadLocalDecklists, loading, error } = useScryfallSets();
  const [catalogView, setCatalogView] = useState<CatalogView>('sets');
  const [query, setQuery] = useState('');
  const [setType, setSetType] = useState<SetTypeFilter>('all');
  const [sortMode, setSortMode] = useState<SortMode>('newest');
  const [showFavorites, setShowFavorites] = useState(false);
  const [setsPage, setSetsPage] = useState(1);
  const [preconsPage, setPreconsPage] = useState(1);
  const [favoriteCodes, setFavoriteCodes] = useState<string[]>(() => readStoredStringList('mtg-favorite-sets'));
  const [preconEquityByProduct, setPreconEquityByProduct] = useState<Map<string, number>>(new Map());
  const [preconEquitySummary, setPreconEquitySummary] = useState<string | null>(null);
  const [preconEquitySummaryStatus, setPreconEquitySummaryStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [isHeroCollapsed, setIsHeroCollapsed] = useState(() => {
    if (typeof window === 'undefined') return true;
    try {
      const saved = window.localStorage.getItem('mtg-hero-collapsed-v2');
      return saved === null ? true : saved === 'true';
    } catch {
      return true;
    }
  });
  const needsLocalArchive = catalogView === 'precons' || sortMode === 'value';

  useEffect(() => {
    try {
      window.localStorage.setItem('mtg-hero-collapsed-v2', String(isHeroCollapsed));
    } catch {
      // Local storage may be unavailable in private browsing.
    }
  }, [isHeroCollapsed]);

  useEffect(() => {
    try {
      window.localStorage.setItem('mtg-favorite-sets', JSON.stringify(favoriteCodes));
    } catch {
      // Local storage may be unavailable in private browsing.
    }
  }, [favoriteCodes]);

  useEffect(() => {
    if (needsLocalArchive) void loadLocalDecklists();
  }, [needsLocalArchive, loadLocalDecklists]);

  useEffect(() => {
    if (!needsLocalArchive || localDecklists === null) return;

    let cancelled = false;
    setPreconEquitySummaryStatus('loading');
    void import('@/lib/marketPriceIndex').then((marketPriceIndex) => {
      if (cancelled) return;
      const equityByProduct = new Map<string, number>();
      for (const deck of localDecklists) {
        equityByProduct.set(
          homePreconProductKey(deck.set_code, deck.name),
          marketPriceIndex.resolveDeckMarketValue(deck).totalUsd,
        );
      }
      const summary = buildHomePreconSummary(localDecklists, marketPriceIndex.resolveDeckMarketValue);
      const summaryText = formatHomePreconSummary(
        summary,
        marketPriceIndex.commanderPriceSnapshotAsOf,
        marketPriceIndex.commanderPriceSnapshotSource,
      );
      setPreconEquityByProduct(equityByProduct);
      setPreconEquitySummary(summaryText);
      setPreconEquitySummaryStatus('idle');
    }).catch(() => {
      if (!cancelled) setPreconEquitySummaryStatus('error');
    });

    return () => { cancelled = true; };
  }, [needsLocalArchive, catalogView, sortMode, localDecklists]);

  const toggleFavorite = (setCode: string) => {
    const normalizedCode = setCode.toLowerCase();
    setSetsPage(1);
    setFavoriteCodes((current) => current.includes(normalizedCode)
      ? current.filter((code) => code !== normalizedCode)
      : [...current, normalizedCode]);
  };

  const decoratedSets = useMemo(() => sets.map((set) => {
    const setPrecons = precons.get(set.code) || [];
    const knownValue = setPrecons.reduce((sum, precon) => sum + (preconEquityByProduct.get(homePreconProductKey(precon.set_code, precon.name)) || 0), 0);
    return { set, precons: setPrecons, knownValue };
  }), [sets, precons, preconEquityByProduct]);

  const indexedPrecons = useMemo(() => buildHomePreconIndex(localDecklists ?? [], precons, sets), [localDecklists, precons, sets]);
  const favoriteSet = useMemo(() => new Set(favoriteCodes.map((code) => code.toLowerCase())), [favoriteCodes]);
  const normalizedQuery = query.trim().toLowerCase();

  const filteredSets = useMemo(() => decoratedSets
    .filter(({ set, precons: setPrecons }) => {
      const matchesType = setType === 'all' || set.set_type === setType;
      const matchesQuery = !normalizedQuery
        || set.name.toLowerCase().includes(normalizedQuery)
        || set.code.toLowerCase().includes(normalizedQuery)
        || setPrecons.some((precon) => precon.name.toLowerCase().includes(normalizedQuery));
      const matchesFavorites = !showFavorites || favoriteSet.has(set.code.toLowerCase());
      return matchesType && matchesQuery && matchesFavorites;
    })
    .sort((a, b) => {
      if (sortMode === 'oldest') return new Date(a.set.released_at).getTime() - new Date(b.set.released_at).getTime();
      if (sortMode === 'value') return b.knownValue - a.knownValue || new Date(b.set.released_at).getTime() - new Date(a.set.released_at).getTime();
      if (sortMode === 'cards') return b.set.card_count - a.set.card_count;
      return new Date(b.set.released_at).getTime() - new Date(a.set.released_at).getTime();
    }), [decoratedSets, favoriteSet, normalizedQuery, setType, showFavorites, sortMode]);

  const filteredPrecons = useMemo(() => indexedPrecons.filter((deck) => {
    if (!normalizedQuery) return true;
    return deck.name.toLowerCase().includes(normalizedQuery)
      || deck.set_code.toLowerCase().includes(normalizedQuery)
      || (deck.set_name || '').toLowerCase().includes(normalizedQuery)
      || deck.commanderName.toLowerCase().includes(normalizedQuery);
  }), [indexedPrecons, normalizedQuery]);

  const currentSetsPage = useMemo(() => getCatalogPage(filteredSets, setsPage), [filteredSets, setsPage]);
  const currentPreconsPage = useMemo(() => getCatalogPage(filteredPrecons, preconsPage), [filteredPrecons, preconsPage]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background">
        <div id="mobile-hero" className={`container relative flex items-center justify-center transition-[min-height] duration-200 ${isHeroCollapsed ? 'min-h-[50px]' : 'min-h-[45vh]'} sm:min-h-[16vh]`}>
          <a href="/" aria-label="MTG Sets Tracker home" className="group inline-flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            <img src="/mtg-mark.svg" alt="MTG Sets Tracker" decoding="async" className={`transition-[height,width,transform] duration-200 group-hover:scale-105 ${isHeroCollapsed ? 'h-8 w-8' : 'h-16 w-16'} sm:h-14 sm:w-14`} />
          </a>
          <button
            type="button"
            onClick={() => setIsHeroCollapsed((collapsed) => !collapsed)}
            aria-expanded={!isHeroCollapsed}
            aria-controls="mobile-hero"
            aria-label={isHeroCollapsed ? 'Expand hero banner' : 'Minimize hero banner'}
            title={isHeroCollapsed ? 'Expand hero banner' : 'Minimize hero banner'}
            className="absolute bottom-3 right-3 inline-flex h-8 w-8 items-center justify-center border border-border bg-card text-primary transition-colors hover:bg-primary hover:text-primary-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:hidden"
          >
            {isHeroCollapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
          </button>
        </div>
      </header>

      <main className="container py-6 sm:py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b-2 border-border pb-4">
          <div>
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-primary">MTG tracker index</p>
            <h1 className="mt-1 text-xl font-black uppercase tracking-tight sm:text-2xl">Browse Magic releases</h1>
          </div>
          <div role="tablist" aria-label="Homepage catalog" className="inline-flex border-2 border-border bg-card p-1">
            <button type="button" role="tab" aria-selected={catalogView === 'sets'} aria-controls="sets-catalog" onClick={() => { setCatalogView('sets'); setSetsPage(1); }} className={`px-3 py-2 font-mono text-[10px] font-black uppercase tracking-wider transition-colors ${catalogView === 'sets' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>Sets</button>
            <button type="button" role="tab" aria-selected={catalogView === 'precons'} aria-controls="precon-catalog" onClick={() => { setCatalogView('precons'); setPreconsPage(1); }} className={`px-3 py-2 font-mono text-[10px] font-black uppercase tracking-wider transition-colors ${catalogView === 'precons' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>All precons{localDecklists !== null ? <span className="ml-1 opacity-80">{indexedPrecons.length}</span> : null}</button>
          </div>
        </div>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative min-w-0 flex-1 sm:max-w-xl">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input type="search" value={query} onChange={(event) => { setQuery(event.target.value); setSetsPage(1); setPreconsPage(1); }} placeholder={catalogView === 'sets' ? 'Search sets, precons, commanders...' : 'Search all precons, commanders, or sets...'} aria-label={`Search ${catalogView === 'sets' ? 'sets' : 'all precons'}`} className="w-full border-2 border-border bg-background py-2.5 pl-9 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <p aria-live="polite" className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {catalogView === 'sets'
              ? `${sets.length} recent sets · ${localDecklists === null ? (localDecklistError ? 'local archive unavailable' : needsLocalArchive ? 'loading local archive' : 'local archive loads on demand') : `${localDecklists.length} local decklists`}`
              : localDecklists === null
                ? (localDecklistError ? 'local archive unavailable' : 'loading local archive')
                : formatHomePreconCatalogSummary(
                  filteredPrecons.length,
                  indexedPrecons.length,
                  localDecklists.length,
                  error ? 'unavailable' : loading ? 'loading' : 'available',
                )}
          </p>
        </div>

        {catalogView === 'precons' ? (
          <section id="precon-catalog" role="tabpanel" aria-label="All indexed Commander precons">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
              <div><p className="font-mono text-[10px] font-black uppercase tracking-widest text-primary">Local decklist archive</p><h2 className="mt-1 text-2xl font-black tracking-tight">All local Commander decklists</h2><p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">This view uses the local Commander decklist archive as its single product source, so the count and card-list equity share the same scope. Scryfall-only product listings are intentionally excluded. Card artwork loads as you scroll.</p></div>
              <a href="/precons" className="font-mono text-xs font-black uppercase tracking-wider text-primary hover:underline">Open full precon library →</a>
            </div>
            <p aria-label="Precon archive valuation summary" aria-live="polite" className="mb-5 border-l-4 border-primary bg-primary/5 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
              {preconEquitySummary
                || (preconEquitySummaryStatus === 'error'
                  ? 'Card-equity summary is unavailable; catalog counts and decklists remain available.'
                  : localDecklistError
                    ? <><span>{localDecklistError}</span> <button type="button" onClick={() => void loadLocalDecklists()} className="ml-2 font-bold text-primary underline">Retry archive load</button></>
                    : localDecklists === null || preconEquitySummaryStatus === 'loading'
                      ? 'Loading the local decklist archive and dated card-equity index…'
                    : 'Card-equity summary will load when the archive is ready.')}
            </p>
            {localDecklists === null ? (localDecklistError
              ? <div role="alert" className="border border-destructive/40 bg-destructive/5 p-5 text-sm text-muted-foreground">{localDecklistError}<button type="button" onClick={() => void loadLocalDecklists()} className="ml-3 font-bold text-primary underline">Retry</button></div>
              : <CatalogSkeleton kind="catalog" label="Loading the complete Commander precon index" />) : filteredPrecons.length === 0 ? (
              <div className="border-2 border-dashed border-border bg-card p-12 text-center"><p className="text-lg font-bold">No indexed precons match that search.</p><button type="button" onClick={() => setQuery('')} className="mt-3 border border-primary bg-primary px-4 py-2 font-mono text-xs font-black uppercase text-primary-foreground">Clear search</button></div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {currentPreconsPage.items.map((deck) => <HomePreconCard key={`${deck.set_code}:${deck.id}`} deck={deck} />)}
              </div>
            )}
            <CatalogPagination label="Commander precons" {...currentPreconsPage} onPageChange={setPreconsPage} scrollTargetId="precon-catalog" />
          </section>
        ) : (
          <section id="sets-catalog" role="tabpanel" aria-label="Recent release sets">
            {loading && <CatalogSkeleton kind="timeline" label="Loading recent sets from Scryfall" />}
            {error && <div className="flex gap-4 border-2 border-destructive bg-destructive/10 p-6"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" /><div><h2 className="mb-1 font-semibold text-destructive">Error loading the recent-set index</h2><p className="text-sm text-destructive/80">{error}</p></div></div>}

            {!loading && !error && <div className="space-y-6">
              <div className="border-2 border-border bg-card p-4 shadow-sm sm:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div><h2 className="text-lg font-black uppercase tracking-tight">Chronological set &amp; precon hub</h2><p className="mt-1 text-sm text-muted-foreground">Browse the 60 most recent main-set releases. Use <strong className="text-foreground">All precons</strong> above for the local Commander decklist archive.</p></div>
                  <div className="flex flex-wrap items-center gap-3">
                    <select aria-label="Filter sets by type" value={setType} onChange={(event) => { setSetType(event.target.value as SetTypeFilter); setSetsPage(1); }} className="border border-border bg-background px-3 py-2 font-mono text-xs font-bold uppercase focus:outline-none focus:ring-1 focus:ring-primary">
                      {Object.entries(SET_TYPE_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                    </select>
                    <select aria-label="Sort sets" value={sortMode} onChange={(event) => { setSortMode(event.target.value as SortMode); setSetsPage(1); }} className="border border-border bg-background px-3 py-2 font-mono text-xs font-bold uppercase focus:outline-none focus:ring-1 focus:ring-primary">
                      <option value="newest">Newest released</option><option value="oldest">Oldest released</option><option value="value">Highest indexed card equity</option><option value="cards">Largest card count</option>
                    </select>
                    <button type="button" onClick={() => { setShowFavorites((favorite) => !favorite); setSetsPage(1); }} aria-pressed={showFavorites} className={`inline-flex items-center gap-1.5 border px-3 py-2 font-mono text-xs font-bold uppercase transition-colors ${showFavorites ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background hover:border-primary'}`}><Bookmark className="h-3.5 w-3.5" />Favorites ({favoriteCodes.length})</button>
                  </div>
                </div>
              </div>

              {filteredSets.length === 0 ? (
                <div className="border-2 border-dashed border-border bg-card p-12 text-center"><p className="text-lg font-bold">No sets match your active filters.</p><p className="mt-1 text-sm text-muted-foreground">Try clearing the search or set-type filters.</p><button type="button" onClick={() => { setQuery(''); setSetType('all'); setShowFavorites(false); }} className="mt-4 border border-primary bg-primary px-4 py-2 font-mono text-xs font-black uppercase text-primary-foreground">Reset filters</button></div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {currentSetsPage.items.map(({ set, precons: setPrecons, knownValue }) => <SetCard key={set.code} set={set} precons={setPrecons} knownValue={knownValue} isFavorite={favoriteSet.has(set.code.toLowerCase())} onToggleFavorite={toggleFavorite} />)}
                </div>
              )}
              <CatalogPagination label="Recent sets" {...currentSetsPage} onPageChange={setSetsPage} scrollTargetId="sets-catalog" />
            </div>}
          </section>
        )}
      </main>
    </div>
  );
}
