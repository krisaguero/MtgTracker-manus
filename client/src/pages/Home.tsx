/* Design reminder: hard-edged MTG editorial timeline; recent releases are the homepage’s primary content, while collection and archive utilities stay behind compact internal links. */
import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowDownUp, Bookmark, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { SetCard } from '@/components/SetCard';
import { CatalogSkeleton } from '@/components/CatalogSkeleton';
import { useScryfallSets } from '@/hooks/useScryfallSets';

type SetTypeFilter = 'all' | 'expansion' | 'core' | 'masters';
type SortMode = 'newest' | 'oldest' | 'value' | 'cards';

const SET_TYPE_LABELS: Record<SetTypeFilter, string> = {
  all: 'All set types',
  expansion: 'Expansions',
  core: 'Core sets',
  masters: 'Masters',
};

export default function Home() {
  const { sets, precons, loading, error } = useScryfallSets();
  const [, navigate] = useLocation();
  const [query, setQuery] = useState('');
  const [setType, setSetType] = useState<SetTypeFilter>('all');
  const [sortMode, setSortMode] = useState<SortMode>('newest');
  const [showFavorites, setShowFavorites] = useState(false);
  const [favoriteCodes, setFavoriteCodes] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = window.localStorage.getItem('mtg-favorite-sets');
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed.filter((code): code is string => typeof code === 'string') : [];
    } catch {
      return [];
    }
  });
  const [isHeroCollapsed, setIsHeroCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      const savedPreference = window.localStorage.getItem('mtg-hero-collapsed-v2');
      return savedPreference === null ? true : savedPreference === 'true';
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem('mtg-hero-collapsed-v2', String(isHeroCollapsed));
    } catch {
      // Local storage may be unavailable in private browsing; the toggle still works for this session.
    }
  }, [isHeroCollapsed]);

  useEffect(() => {
    try {
      window.localStorage.setItem('mtg-favorite-sets', JSON.stringify(favoriteCodes));
    } catch {
      // Favorites remain available for this session when local storage is unavailable.
    }
  }, [favoriteCodes]);

  const toggleFavorite = (setCode: string) => {
    const normalizedCode = setCode.toLowerCase();
    setFavoriteCodes((current) => current.includes(normalizedCode) ? current.filter((code) => code !== normalizedCode) : [...current, normalizedCode]);
  };

  const decoratedSets = useMemo(() => sets.map((set) => {
    const setPrecons = precons.get(set.code) || [];
    const knownValue = setPrecons.reduce((sum, precon) => sum + (precon.approxValue || 0), 0);
    const valuedDecks = setPrecons.filter((precon) => Boolean(precon.approxValue)).length;
    return { set, precons: setPrecons, knownValue, valuedDecks };
  }), [sets, precons]);

  const favoriteSet = useMemo(() => new Set(favoriteCodes), [favoriteCodes]);

  const filteredSets = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return decoratedSets
      .filter(({ set, precons: setPrecons }) => {
        const matchesType = setType === 'all' || set.set_type === setType;
        const matchesQuery = !normalizedQuery || set.name.toLowerCase().includes(normalizedQuery) || set.code.toLowerCase().includes(normalizedQuery) || setPrecons.some((precon) => precon.name.toLowerCase().includes(normalizedQuery));
        const matchesFavorites = !showFavorites || favoriteSet.has(set.code.toLowerCase());
        return matchesType && matchesQuery && matchesFavorites;
      })
      .sort((a, b) => {
        if (sortMode === 'oldest') return new Date(a.set.released_at).getTime() - new Date(b.set.released_at).getTime();
        if (sortMode === 'value') return b.knownValue - a.knownValue || new Date(b.set.released_at).getTime() - new Date(a.set.released_at).getTime();
        if (sortMode === 'cards') return b.set.card_count - a.set.card_count;
        return new Date(b.set.released_at).getTime() - new Date(a.set.released_at).getTime();
      });
  }, [decoratedSets, favoriteSet, query, setType, showFavorites, sortMode]);

  const totalDecks = decoratedSets.reduce((sum, entry) => sum + entry.precons.length, 0);
  const valuedDecks = decoratedSets.reduce((sum, entry) => sum + entry.valuedDecks, 0);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background">
        <div id="mobile-hero" className={`container relative flex items-center justify-center transition-[min-height] duration-200 ${isHeroCollapsed ? 'min-h-[64px]' : 'min-h-[70vh]'} sm:min-h-[16vh]`}>
          <a href="/" aria-label="MTG Sets Tracker home" className="group inline-flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            <img src="/mtg-mark.svg" alt="MTG Sets Tracker" className={`transition-[height,width,transform] duration-200 group-hover:scale-105 ${isHeroCollapsed ? 'h-10 w-10' : 'h-20 w-20'} sm:h-14 sm:w-14`} />
          </a>
          <button
            type="button"
            onClick={() => setIsHeroCollapsed((collapsed) => !collapsed)}
            aria-expanded={!isHeroCollapsed}
            aria-controls="mobile-hero"
            aria-label={isHeroCollapsed ? 'Expand hero banner' : 'Minimize hero banner'}
            title={isHeroCollapsed ? 'Expand hero banner' : 'Minimize hero banner'}
            className="absolute bottom-3 right-3 inline-flex h-9 w-9 items-center justify-center border border-border bg-card text-primary transition-colors hover:bg-primary hover:text-primary-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:hidden"
          >
            {isHeroCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
        </div>
      </header>

      <nav className="border-b border-border bg-card" aria-label="Primary discovery navigation">
        <div className="container flex flex-wrap items-center justify-between gap-3 py-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">Live Scryfall index</p>
            <p className="mt-1 text-sm font-semibold">Recent sets, tracked chronologically.</p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-bold uppercase tracking-[0.14em]">
            <Link href="/movers" className="border border-primary bg-primary px-3 py-2 text-primary-foreground transition-colors hover:bg-primary/90">Daily Movers</Link>
            <Link href="/market-report" className="border border-border bg-background px-3 py-2 text-primary transition-colors hover:border-primary hover:bg-primary/10">Market Report</Link>
            <Link href="/dupe-decks" className="border border-border bg-background px-3 py-2 text-primary transition-colors hover:border-primary hover:bg-primary/10">Dupe-Decks (1v1)</Link>
            <Link href="/collection" className="border border-border bg-background px-3 py-2 text-muted-foreground transition-colors hover:border-primary hover:text-primary">Collection</Link>
            <Link href="/commander" className="border border-border bg-card px-3 py-2 text-muted-foreground transition-colors hover:border-primary hover:text-primary">Commander archive</Link>
            <Link href="/precons" className="border border-amber-500 bg-amber-500 text-black px-3 py-2 transition-colors hover:opacity-90">Precon Library</Link>
          </div>
        </div>
      </nav>

      <main className="container py-6 sm:py-10">
        {loading && <CatalogSkeleton kind="timeline" label="Loading recent sets from Scryfall" />}

        {error && (
          <div className="flex gap-4 border-2 border-destructive bg-destructive/10 p-6">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            <div>
              <h2 className="mb-1 font-semibold text-destructive">Error loading the recent-set index</h2>
              <p className="text-sm text-destructive/80">{error}</p>
            </div>
          </div>
        )}

        {!loading && !error && sets.length > 0 && (
          <section aria-labelledby="recent-sets-heading">
            <div className="flex flex-col gap-4 border-b-2 border-primary pb-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Chronological release shelf</p>
                <h1 id="recent-sets-heading" className="mt-2 text-3xl font-bold tracking-[-0.04em] sm:text-5xl">Recent sets</h1>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">Start with the newest Magic releases, then move backward through the set timeline. Commander products and card indexes stay attached to each release.</p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                <span className="border border-border bg-card px-3 py-2">{sets.length} sets</span>
                <span className="border border-border bg-card px-3 py-2">{totalDecks} Commander products</span>
                <span className="border border-border bg-card px-3 py-2">{valuedDecks} priced</span>
              </div>
            </div>

            <section className="mt-6" aria-labelledby="discovery-controls">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">Catalog controls</p>
                  <h2 id="discovery-controls" className="mt-1 text-xl font-bold sm:text-2xl">Find a set or Commander product</h2>
                </div>
                <p className="text-sm text-muted-foreground">Showing {filteredSets.length} of {showFavorites ? favoriteCodes.length : sets.length} {showFavorites ? 'saved sets' : 'sets'}.</p>
              </div>

              <div className="grid gap-3 border-y border-border py-4 lg:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
                <label className="relative block">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search set names, codes, or Commander decks" aria-label="Search sets and Commander products" className="h-11 w-full border border-border bg-card pl-10 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20" />
                </label>
                <label className="flex h-11 items-center gap-2 border border-border bg-card px-3 text-sm">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Type</span>
                  <select value={setType} onChange={(event) => setSetType(event.target.value as SetTypeFilter)} className="bg-transparent font-semibold outline-none">
                    {(Object.keys(SET_TYPE_LABELS) as SetTypeFilter[]).map((type) => <option key={type} value={type}>{SET_TYPE_LABELS[type]}</option>)}
                  </select>
                </label>
                <button type="button" onClick={() => setShowFavorites((visible) => !visible)} aria-pressed={showFavorites} className={`flex h-11 items-center justify-center gap-2 border px-3 text-sm font-semibold transition-colors ${showFavorites ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground hover:border-primary hover:text-primary'}`}>
                  <Bookmark className={`h-4 w-4 ${showFavorites ? 'fill-current' : ''}`} />
                  Saved sets ({favoriteCodes.length})
                </button>
                <label className="flex h-11 items-center gap-2 border border-border bg-card px-3 text-sm">
                  <ArrowDownUp className="h-4 w-4 text-muted-foreground" />
                  <span className="sr-only">Sort recent sets</span>
                  <select value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)} className="bg-transparent font-semibold outline-none">
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                    <option value="value">Highest value</option>
                    <option value="cards">Most cards</option>
                  </select>
                </label>
              </div>
            </section>

            <section className="mt-6" aria-label="Chronological recent set timeline">
              {filteredSets.length === 0 ? (
                <div className="border-2 border-dashed border-border p-12 text-center">
                  <Search className="mx-auto h-6 w-6 text-muted-foreground" />
                  <p className="mt-3 font-semibold">{showFavorites ? 'No saved sets match those controls.' : 'No sets match those controls.'}</p>
                  <button type="button" onClick={() => { setQuery(''); setSetType('all'); setShowFavorites(false); }} className="mt-2 text-sm font-semibold text-primary hover:underline">Clear search and filters</button>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute bottom-0 left-0 top-0 w-px bg-gradient-to-b from-primary to-primary/20" />
                  <div className="pl-8">
                    {filteredSets.map(({ set, precons: setPrecons, knownValue, valuedDecks }) => (
                      <div key={set.id} className="relative mb-4">
                        <div className="absolute -left-[17px] top-6 h-4 w-4 border-2 border-background bg-primary" />
                        <SetCard set={set} precons={setPrecons} knownValue={knownValue} valuedDecks={valuedDecks} isFavorite={favoriteSet.has(set.code.toLowerCase())} onToggleFavorite={() => toggleFavorite(set.code)} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </section>
        )}
      </main>

      <footer className="mt-12 border-t border-border bg-muted/30 py-8">
        <div className="container text-center text-sm text-muted-foreground">
          <p>Recent-set metadata provided by <a href="https://scryfall.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline">Scryfall</a>. Magic: The Gathering is © Wizards of the Coast.</p>
        </div>
      </footer>
    </div>
  );
}
