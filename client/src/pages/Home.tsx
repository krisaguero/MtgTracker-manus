import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, ArrowDownUp, Bookmark, ChevronDown, ChevronUp, Menu, Search, X } from 'lucide-react';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  // Close mobile menu on outside click or Escape key
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };

    if (mobileMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    try {
      window.localStorage.setItem('mtg-hero-collapsed-v2', String(isHeroCollapsed));
    } catch {
      // Local storage fallback
    }
  }, [isHeroCollapsed]);

  useEffect(() => {
    try {
      window.localStorage.setItem('mtg-favorite-sets', JSON.stringify(favoriteCodes));
    } catch {
      // Local storage fallback
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
      {/* Compact Top Navigation Bar with Left Logo and Mobile Hamburger */}
      <nav ref={menuRef} className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-md" aria-label="Main navigation">
        <div className="container flex items-center justify-between py-2.5">
          <div className="flex items-center gap-3">
            <Link href="/" aria-label="MTG Sets Tracker home" className="group flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">
              <img src="/mtg-mark.svg" alt="MTG" className="h-8 w-8 transition-transform group-hover:scale-105" />
              <span className="font-mono text-xs font-bold uppercase tracking-wider hidden sm:inline">MTG Tracker</span>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em]">
            <Link href="/" className="border border-border bg-background px-2.5 py-1.5 text-primary hover:border-primary">Home</Link>
            <Link href="/movers" className="border border-primary bg-primary px-2.5 py-1.5 text-primary-foreground hover:bg-primary/90">Daily Movers</Link>
            <Link href="/market-report" className="border border-border bg-background px-2.5 py-1.5 text-primary hover:border-primary">Market Report</Link>
            <Link href="/dupe-decks" className="border border-border bg-background px-2.5 py-1.5 text-primary hover:border-primary">Dupe-Decks</Link>
            <Link href="/collection" className="border border-border bg-background px-2.5 py-1.5 text-muted-foreground hover:text-primary">Collection</Link>
            <Link href="/commander" className="border border-border bg-card px-2.5 py-1.5 text-muted-foreground hover:text-primary">Archive</Link>
            <Link href="/precons" className="border border-amber-500 bg-amber-500 text-black px-2.5 py-1.5 hover:opacity-90">Precons</Link>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="lg:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation"
              className="inline-flex h-9 w-9 items-center justify-center border border-border bg-background text-foreground hover:bg-muted focus:outline-none focus:ring-1 focus:ring-primary"
              data-menu-toggle="true"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Slide-In Dropdown Menu with Transition */}
        <div
          id="mobile-navigation"
          aria-hidden={!mobileMenuOpen}
          className={`overflow-hidden transition-[max-height,opacity,padding] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] lg:hidden border-b border-border bg-card ${
            mobileMenuOpen ? 'pointer-events-auto max-h-96 opacity-100 py-4' : 'pointer-events-none max-h-0 opacity-0 py-0 border-transparent'
          }`}
        >
          <div className="container flex flex-col gap-2 font-mono text-xs font-bold uppercase">
            <Link href="/" onClick={() => setMobileMenuOpen(false)} className="border border-border bg-background px-3 py-2 text-center text-primary transition-colors hover:border-primary">Home</Link>
            <Link href="/movers" onClick={() => setMobileMenuOpen(false)} className="border border-primary bg-primary px-3 py-2 text-center text-primary-foreground transition-colors hover:opacity-90">Daily Movers</Link>
            <Link href="/market-report" onClick={() => setMobileMenuOpen(false)} className="border border-border bg-background px-3 py-2 text-center text-primary transition-colors hover:border-primary">Market Report</Link>
            <Link href="/dupe-decks" onClick={() => setMobileMenuOpen(false)} className="border border-border bg-background px-3 py-2 text-center text-primary transition-colors hover:border-primary">Dupe-Decks (1v1)</Link>
            <Link href="/collection" onClick={() => setMobileMenuOpen(false)} className="border border-border bg-background px-3 py-2 text-center text-muted-foreground transition-colors hover:text-primary">Collection</Link>
            <Link href="/commander" onClick={() => setMobileMenuOpen(false)} className="border border-border bg-card px-3 py-2 text-center text-muted-foreground transition-colors hover:text-primary">Commander Archive</Link>
            <Link href="/precons" onClick={() => setMobileMenuOpen(false)} className="border border-amber-500 bg-amber-500 px-3 py-2 text-center text-black transition-colors hover:opacity-90">Precon Library</Link>
          </div>
        </div>
      </nav>

      {/* Dimming backdrop keeps the open mobile menu in focus without hiding the page context. */}
      <button
        type="button"
        aria-label="Close navigation menu"
        aria-hidden={!mobileMenuOpen}
        tabIndex={mobileMenuOpen ? 0 : -1}
        onClick={() => setMobileMenuOpen(false)}
        className={`fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] transition-opacity duration-200 lg:hidden ${
          mobileMenuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      {/* Hero Banner with Collapse Toggle */}
      <header className="border-b border-border bg-background">
        <div id="mobile-hero" className={`container relative flex items-center justify-center transition-[min-height] duration-200 ${isHeroCollapsed ? 'min-h-[50px]' : 'min-h-[45vh]'} sm:min-h-[16vh]`}>
          <a href="/" aria-label="MTG Sets Tracker home" className="group inline-flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            <img src="/mtg-mark.svg" alt="MTG Sets Tracker" className={`transition-[height,width,transform] duration-200 group-hover:scale-105 ${isHeroCollapsed ? 'h-8 w-8' : 'h-16 w-16'} sm:h-14 sm:w-14`} />
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

        {!loading && !error && (
          <div className="space-y-8">
            {/* Discovery & Filter Bar */}
            <div className="border-2 border-border bg-card p-4 sm:p-6 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h1 className="text-xl font-bold uppercase tracking-tight sm:text-2xl">Chronological Set &amp; Precon Hub</h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Indexing <strong className="text-foreground">{sets.length}</strong> sets and <strong className="text-foreground">{totalDecks}</strong> Commander precons ({valuedDecks} valued).
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative flex-1 sm:w-72">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search sets, precons, cards..."
                      className="w-full border border-border bg-background py-2 pl-9 pr-4 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <select
                    value={setType}
                    onChange={(e) => setSetType(e.target.value as SetTypeFilter)}
                    className="border border-border bg-background px-3 py-2 font-mono text-xs uppercase font-bold focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {Object.entries(SET_TYPE_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>

                  <select
                    value={sortMode}
                    onChange={(e) => setSortMode(e.target.value as SortMode)}
                    className="border border-border bg-background px-3 py-2 font-mono text-xs uppercase font-bold focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="newest">Newest Released</option>
                    <option value="oldest">Oldest Released</option>
                    <option value="value">Highest Precon Value</option>
                    <option value="cards">Largest Card Count</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => setShowFavorites((fav) => !fav)}
                    className={`inline-flex items-center gap-1.5 border px-3 py-2 font-mono text-xs uppercase font-bold transition-colors ${showFavorites ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background hover:border-primary'}`}
                  >
                    <Bookmark className="h-3.5 w-3.5" /> Favorites ({favoriteCodes.length})
                  </button>
                </div>
              </div>
            </div>

            {/* Sets Grid */}
            {filteredSets.length === 0 ? (
              <div className="border-2 border-dashed border-border bg-card p-12 text-center">
                <p className="text-lg font-bold">No sets match your active filters.</p>
                <p className="mt-1 text-sm text-muted-foreground">Try clearing your search query or switching set type filters.</p>
                <button
                  type="button"
                  onClick={() => { setQuery(''); setSetType('all'); setShowFavorites(false); }}
                  className="mt-4 border border-primary bg-primary px-4 py-2 font-mono text-xs uppercase font-bold text-primary-foreground"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredSets.map(({ set, precons: setPrecons, knownValue }) => (
                  <SetCard
                    key={set.code}
                    set={set}
                    precons={setPrecons}
                    knownValue={knownValue}
                    isFavorite={favoriteCodes.includes(set.code.toLowerCase())}
                    onToggleFavorite={toggleFavorite}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
