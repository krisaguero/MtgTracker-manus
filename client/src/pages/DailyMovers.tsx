/* Design reminder: hard-edged market intelligence workspace; features 10 categories of 25 movers each, penny buyout watches, Reddit sentiment metrics, and deep-dive sentiment analysis. */
import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Link } from 'wouter';
import { ArrowUpRight, ExternalLink, Flame, Search, ShieldAlert, Sparkles, Star, TrendingDown, TrendingUp, Zap } from 'lucide-react';
import { MarketMoversTable } from '@/components/MarketMoversTable';
import { MarketCardGridSkeleton } from '@/components/MarketCardSkeleton';
import { MarketCardItem } from '@/components/MarketCardItem';
import { MOVER_CATEGORIES, getMarketSentimentDeepDive, type MoverCard } from '@/lib/dailyMoversEngine';
import { loadCanonicalSnapshots, type CanonicalCardSnapshot } from '@/lib/canonicalMarketEngine';
import { csvMarketMovers, csvMarketMoversAsOf } from '@/data/marketMoversCsv';
import { NavigationSearch } from '@/components/NavigationSearch';
import { trpc } from '@/lib/trpc';
import type { MarketRow } from '@shared/market';
import { getMarketWatchKey, isMarketCardWatched, loadMarketWatchlist, toggleMarketWatchlist, type MarketWatchlistEntry } from '@/lib/marketWatchlist';

function mapMarketRows(rows: MarketRow[], defaultCategory: string): MoverCard[] {
  return rows.map((row, index) => {
    const currentUsd = Number(row.current_price) || 0;
    const previousUsd = Number(row.past_price) || 0;
    const percentChange = Number(row.pct_change) || 0;
    const assignedCategory = row.category && row.category !== 'daily-movers' ? row.category : defaultCategory;
    const signalSource = (row.signal_source as MoverCard['signalSource']) || 'Scryfall Snapshot';
    return {
      id: `${assignedCategory}-${row.set_code}-${row.name}-${index}`,
      name: row.name,
      setCode: row.set_code,
      setName: row.set_code.toUpperCase(),
      rarity: (row.rarity || 'rare') as MoverCard['rarity'],
      currentUsd,
      previousUsd,
      changeUsd: Number((currentUsd - previousUsd).toFixed(2)),
      percentChange: Number(percentChange.toFixed(1)),
      recentPrices: row.recent_prices,
      category: assignedCategory,
      signalSource,
      thesis: `Parquet-backed market intelligence signal for ${row.name} in category [${assignedCategory}].`,
    };
  });
}

export function DailyMovers() {
  const [activeFeed, setActiveFeed] = useState<'live' | 'watchlist'>('live');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedSetCode, setSelectedSetCode] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<string>('all');
  const [rarityFilter, setRarityFilter] = useState<string>('all');
  const [trendFilter, setTrendFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('pct-desc');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [watchlist, setWatchlist] = useState<MarketWatchlistEntry[]>(() => loadMarketWatchlist());
  const [selectedCard, setSelectedCard] = useState<MoverCard | null>(null);

  // The attached 2026-08-25 CSV is the primary reproducible feed. The existing
  // canonical snapshot remains the fallback for environments that omit the CSV.
  const localMovers = useMemo<MoverCard[]>(() => {
    if (csvMarketMovers.length > 0) {
      return csvMarketMovers.map((mover) => ({
        id: `csv-${mover.rank}-${mover.name}`,
        name: mover.name,
        setCode: mover.setCode,
        setName: mover.setName,
        rarity: 'rare',
        currentUsd: mover.currentUsd,
        previousUsd: mover.previousUsd,
        changeUsd: mover.changeUsd,
        percentChange: mover.percentChange,
        recentPrices: [mover.previousUsd, mover.currentUsd],
        category: mover.category,
        signalSource: 'CSV Market Movers',
        thesis: `${mover.signalSource} · Imported rank #${mover.rank} from the ${csvMarketMoversAsOf} snapshot.`,
        isCatalyst: mover.direction === 'up' && mover.percentChange >= 10,
      }));
    }

    const snaps: CanonicalCardSnapshot[] = loadCanonicalSnapshots();
    return snaps.map((s) => ({
      id: s.id,
      name: s.name,
      setCode: s.setCode,
      setName: s.setCode.toUpperCase(),
      rarity: s.rarity,
      currentUsd: s.currentUsd,
      previousUsd: s.previousUsd,
      changeUsd: Number((s.currentUsd - s.previousUsd).toFixed(2)),
      percentChange: s.percentChange,
      recentPrices: s.recentPrices,
      category: s.category,
      signalSource: s.signalSource,
      thesis: s.thesis,
      cardKingdomUsd: s.cardKingdomUsd,
      tcgplayerMarketUsd: s.tcgplayerMarketUsd,
      mtgGoldfishUsd: s.mtgGoldfishUsd,
      isCatalyst: s.isCatalyst,
    }));
  }, []);
  const sentiment = useMemo(() => getMarketSentimentDeepDive(), []);

  // Fetch live market rows from server parquet pipeline
  const { data: serverRows, isLoading: isLoadingMovers } = trpc.market.getMovers.useQuery();

  const liveMovers = useMemo(() => {
    // Always prioritize localMovers (the comprehensive 250-card signal matrix snapshot)
    if (localMovers && localMovers.length > 0) {
      return localMovers;
    }
    const rows = (serverRows as any)?.rows || (Array.isArray(serverRows) ? serverRows : []);
    if (rows && rows.length > 0) {
      return mapMarketRows(rows, activeCategory === 'all' ? 'high-value-spikes' : activeCategory);
    }
    return localMovers;
  }, [serverRows, activeCategory, localMovers]);

  const activeMoversList = liveMovers;

  const availableSets = useMemo(() => {
    const set = new Set<string>();
    activeMoversList.forEach((m) => set.add(m.setCode.toUpperCase()));
    return Array.from(set).sort();
  }, [activeMoversList]);

  const filteredMovers = useMemo(() => {
    let result = activeMoversList;

    if (activeFeed === 'watchlist') {
      result = result.filter((m) => isMarketCardWatched(m, watchlist));
    }

    if (activeCategory !== 'all') {
      result = result.filter((m) => m.category === activeCategory);
    }

    if (selectedSetCode !== 'all') {
      result = result.filter((m) => m.setCode.toUpperCase() === selectedSetCode.toUpperCase());
    }

    if (priceRange !== 'all') {
      result = result.filter((m) => {
        if (priceRange === 'under-5') return m.currentUsd < 5;
        if (priceRange === '5-25') return m.currentUsd >= 5 && m.currentUsd <= 25;
        if (priceRange === '25-100') return m.currentUsd > 25 && m.currentUsd <= 100;
        if (priceRange === 'over-100') return m.currentUsd > 100;
        return true;
      });
    }

    if (rarityFilter !== 'all') {
      result = result.filter((m) => m.rarity.toLowerCase() === rarityFilter);
    }

    if (trendFilter !== 'all') {
      result = result.filter((m) => trendFilter === 'rising' ? m.percentChange > 0 : trendFilter === 'falling' ? m.percentChange < 0 : m.percentChange === 0);
    }

    if (searchFilter.trim()) {
      const q = searchFilter.trim().toLowerCase();
      result = result.filter((m) => m.name.toLowerCase().includes(q) || m.setCode.toLowerCase().includes(q) || m.thesis.toLowerCase().includes(q));
    }

    return [...result].sort((a, b) => {
      if (sortBy === 'pct-desc') return b.percentChange - a.percentChange;
      if (sortBy === 'price-desc') return b.currentUsd - a.currentUsd;
      if (sortBy === 'price-asc') return a.currentUsd - b.currentUsd;
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      return 0;
    });
  }, [activeMoversList, activeFeed, activeCategory, selectedSetCode, priceRange, rarityFilter, trendFilter, searchFilter, sortBy, watchlist]);

  const activeFeedMovers = filteredMovers;
  const visibleWatchlist = activeMoversList.filter((m) => isMarketCardWatched(m, watchlist));

  function handleToggleWatchlist(mover: MoverCard) {
    const updated = toggleMarketWatchlist(mover);
    setWatchlist(updated);
  }

  function handleExportTop500Txt() {
    const lines = [
      '====================================================================',
      ' MTG TOP 500 MARKET MOVERS & SIGNAL MATRIX EXPORT',
      ` Generated: ${new Date().toISOString()}`,
      '====================================================================',
      '',
    ];
    activeMoversList.forEach((m, i) => {
      lines.push(`${i + 1}. [${m.setCode.toUpperCase()}] ${m.name} (${m.rarity}) - Current: $${m.currentUsd.toFixed(2)} | Change: ${m.percentChange >= 0 ? '+' : ''}${m.percentChange}% | Source: ${m.signalSource}`);
      lines.push(`   Thesis: ${m.thesis}`);
      lines.push('');
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mtg-top-500-movers.txt';
    a.click();
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Top Header Bar */}
      <header className="border-b-2 border-border bg-card px-4 py-4 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="inline-flex items-center gap-2 border-2 border-border bg-muted px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider hover:border-primary">
              ← Back to Sets
            </Link>
            <div className="hidden sm:block h-6 w-px bg-border" />
            <span className="hidden sm:inline-block font-mono text-xs font-bold uppercase tracking-widest text-primary">
              Daily Movers &amp; Market Intel
            </span>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <NavigationSearch />
            <Link
              href="/costco-deal-article"
              className="inline-flex items-center gap-1.5 border-2 border-amber-500 bg-amber-500 text-black px-3 py-1.5 font-mono text-xs font-bold uppercase shadow hover:opacity-90 whitespace-nowrap"
            >
              <Sparkles className="h-3.5 w-3.5" /> Costco TMNT Deal ($49.97)
            </Link>
            <Link
              href="/signal-matrix-article"
              className="inline-flex items-center gap-1.5 border-2 border-primary bg-primary px-3 py-1.5 font-mono text-xs font-bold uppercase text-primary-foreground shadow hover:opacity-90 whitespace-nowrap"
            >
              <Sparkles className="h-3.5 w-3.5" /> Featured Article
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 py-8 sm:px-8">
        {/* Page Title & Feed Mode Toggles */}
        <div className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-border pb-6">
          <div>
              <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.2em] text-primary">
              <Zap className="h-4 w-4" /> Imported Market Snapshot · {csvMarketMoversAsOf}
            </div>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Daily Market Movers &amp; Buyouts</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Tracking high-value spikes, penny risers, Reddit speculation threads, and old-school reserve list shifts across 10 specialized categories.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex border-2 border-border bg-card p-1">
              <button
                type="button"
                onClick={() => setActiveFeed('live')}
                className={`px-4 py-1.5 font-mono text-xs font-bold uppercase tracking-wider transition-colors ${
                  activeFeed === 'live' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Live Feed ({activeMoversList.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveFeed('watchlist')}
                className={`px-4 py-1.5 font-mono text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 ${
                  activeFeed === 'watchlist' ? 'bg-amber-500 text-black font-extrabold' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Star className="h-3.5 w-3.5" fill={activeFeed === 'watchlist' ? 'currentColor' : 'none'} />
                Watchlist ({visibleWatchlist.length})
              </button>
            </div>

              <button
              type="button"
              onClick={handleExportTop500Txt}
              className="inline-flex items-center gap-2 border-2 border-primary bg-primary text-primary-foreground px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider shadow hover:opacity-90"
            >
              Export Current Feed (TXT)
            </button>
          </div>
        </div>

        {/* Daily Sentiment Deep-Dive Panel */}
        <section className="mt-8 border-2 border-primary/30 bg-primary/5 p-6 sm:p-8" aria-labelledby="sentiment-heading">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5">
            <div>
              <span className="border border-primary/30 bg-primary/10 px-2.5 py-1 font-mono text-xs font-bold uppercase tracking-wider text-primary">
                Daily Sentiment Deep Dive · {sentiment.analyzedAt}
              </span>
              <h2 id="sentiment-heading" className="mt-3 text-2xl font-bold tracking-tight">{sentiment.headline}</h2>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="border border-border bg-background px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider">
                Sentiment: <span className="text-emerald-600 dark:text-emerald-400">{sentiment.overallSentiment}</span>
              </div>
              <div className="border border-border bg-background px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider">
                Reddit Activity: <span className="text-primary">{sentiment.redditActivityIndex}/100</span>
              </div>
              <div className="border border-border bg-background px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider">
                Buyout Risk: <span className="text-amber-600 dark:text-amber-400">{sentiment.buyoutRiskScore}/100</span>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <p className="font-mono text-xs font-bold uppercase tracking-wider text-primary">Market Synthesis</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">{sentiment.summary}</p>
            </div>
            <div className="border-l-2 border-primary/30 pl-4 sm:pl-6">
              <p className="font-mono text-xs font-bold uppercase tracking-wider text-primary">Key Speculation Drivers</p>
              <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
                {sentiment.keyDrivers.map((driver, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="mt-0.5 font-mono font-bold text-primary">✦</span>
                    <span>{driver}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Filter and Category Bar */}
        <section className="mt-8 border-2 border-border bg-card p-4 sm:p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto flex-1">
              {/* Search Filter */}
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Filter movers by card name, set..."
                  className="w-full bg-background border border-border pl-9 pr-3 py-2 font-mono text-xs uppercase focus:border-primary focus:outline-none"
                  aria-label="Filter movers by card name or set"
                />
              </div>

              {/* Set Code Filter */}
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Set:</span>
                <select
                  value={selectedSetCode}
                  onChange={(e) => setSelectedSetCode(e.target.value)}
                  aria-label="Filter by Set"
                  className="border border-border bg-background px-2.5 py-1.5 font-mono text-xs uppercase text-foreground outline-none focus:border-primary"
                >
                  <option value="all">All Sets</option>
                  {availableSets.map((setCode) => (
                    <option key={setCode} value={setCode}>{setCode}</option>
                  ))}
                </select>
              </div>

              {/* Price Range Filter */}
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Price:</span>
                <select
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value)}
                  aria-label="Filter by Price Range"
                  className="border border-border bg-background px-2.5 py-1.5 font-mono text-xs uppercase text-foreground outline-none focus:border-primary"
                >
                  <option value="all">Any Price</option>
                  <option value="under-5">&lt; $5.00</option>
                  <option value="5-25">$5.00 - $25.00</option>
                  <option value="25-100">$25.00 - $100.00</option>
                  <option value="over-100">&gt; $100.00</option>
                </select>
              </div>

              {/* Rarity Filter */}
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Rarity:</span>
                <select value={rarityFilter} onChange={(e) => setRarityFilter(e.target.value)} aria-label="Filter by Rarity" className="border border-border bg-background px-2.5 py-1.5 font-mono text-xs uppercase text-foreground outline-none focus:border-primary">
                  <option value="all">Any Rarity</option>
                  <option value="mythic">Mythic</option>
                  <option value="rare">Rare</option>
                  <option value="uncommon">Uncommon</option>
                  <option value="common">Common</option>
                </select>
              </div>

              {/* Trend Filter */}
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Trend:</span>
                <select value={trendFilter} onChange={(e) => setTrendFilter(e.target.value)} aria-label="Filter by Price Trend" className="border border-border bg-background px-2.5 py-1.5 font-mono text-xs uppercase text-foreground outline-none focus:border-primary">
                  <option value="all">Any Trend</option>
                  <option value="rising">Rising</option>
                  <option value="falling">Falling</option>
                  <option value="flat">Flat</option>
                </select>
              </div>

              {/* Sort By */}
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  aria-label="Sort Daily Movers"
                  className="border border-border bg-background px-2.5 py-1.5 font-mono text-xs uppercase text-foreground outline-none focus:border-primary"
                >
                  <option value="pct-desc">Highest Spike (%)</option>
                  <option value="price-desc">Highest Price ($)</option>
                  <option value="price-asc">Lowest Price ($)</option>
                  <option value="name-asc">Card Name (A-Z)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="mt-6 flex flex-wrap gap-2">
            {MOVER_CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`border px-3 py-2 font-mono text-xs font-bold uppercase tracking-wider transition-colors ${
                    isActive ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground hover:border-primary hover:text-primary'
                  }`}
                >
                  {cat.label} {cat.id !== 'all' && `(${activeMoversList.filter((mover) => mover.category === cat.id).length})`}
                </button>
              );
            })}
          </div>

          {/* Movers Grid with Loading Skeleton or Cards */}
          {activeFeed === 'watchlist' && visibleWatchlist.length === 0 && (
            <div className="mt-8 border-2 border-dashed border-amber-500/40 bg-amber-500/5 p-8 text-center">
              <Star className="mx-auto h-6 w-6 text-amber-600 dark:text-amber-300" aria-hidden="true" />
              <p className="mt-3 font-semibold">Your watchlist is empty.</p>
              <p className="mt-1 text-sm text-muted-foreground">Switch to Live feed and star cards in either table to keep them here.</p>
            </div>
          )}

          {isLoadingMovers && activeMoversList.length === 0 ? (
            <MarketCardGridSkeleton count={6} />
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-live="polite">
              {activeFeedMovers.map((mover, index) => (
                <div key={mover.id} className="market-mover-enter" style={{ '--market-mover-index': index } as CSSProperties}>
                <MarketCardItem
                  key={mover.id}
                  mover={mover}
                  watchlist={watchlist}
                  onSelect={(m) => setSelectedCard(m)}
                  onToggleWatchlist={(m) => handleToggleWatchlist(m)}
                />
                </div>
              ))}
            </div>
          )}

          {/* Detailed Table View */}
          <div className="mt-12 space-y-8">
            <MarketMoversTable
              data={activeFeedMovers}
              title={activeFeed === 'watchlist' ? 'Watchlist Movers Table' : 'Daily Movers Table'}
              description="Comprehensive sorted view of market movers, percentage spikes, and live outlet valuations across curated Magic: The Gathering categories."
              isLoading={isLoadingMovers}
              watchlist={watchlist}
              onToggleWatchlist={handleToggleWatchlist}
            />
          </div>
        </section>
      </main>

      {/* Detailed Modal View */}
      {selectedCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-2xl border-2 border-border bg-card p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setSelectedCard(null)}
              className="absolute top-4 right-4 inline-flex h-8 w-8 items-center justify-center border border-border bg-background hover:bg-muted"
              aria-label="Close modal"
            >
              ✕
            </button>

            <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.2em] text-primary">
              <TrendingUp className="h-4 w-4" /> Global Card Intelligence &amp; Stats
            </div>
            <h2 className="mt-2 text-2xl font-extrabold">{selectedCard.name}</h2>
            <p className="font-mono text-xs text-muted-foreground uppercase">{selectedCard.setCode} Set · Rarity: {selectedCard.rarity} · Source: {selectedCard.signalSource}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="flex flex-col items-center">
                <div className="relative w-full max-w-[240px] aspect-[5/7] overflow-hidden border-2 border-border bg-muted shadow-md">
                  {selectedCard.isCatalyst && (
                    <div className="absolute top-2 right-2 z-10">
                      <span className="border-2 border-primary bg-primary text-primary-foreground px-2 py-0.5 font-mono text-[10px] font-extrabold uppercase tracking-widest shadow">
                        Catalyst
                      </span>
                    </div>
                  )}
                  <img
                    src={`https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(selectedCard.name.replace(/\s*\([^)]*\)/g, '').trim())}&set=${encodeURIComponent(selectedCard.setCode.toLowerCase())}&format=image&version=normal`}
                    alt={selectedCard.name}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = 'data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" width="240" height="336" viewBox="0 0 240 336"><rect fill="%231e293b" width="240" height="336"/><text x="120" y="168" font-family="monospace" font-size="14" fill="%23cbd5e1" text-anchor="middle">MTG Art</text></svg>';
                    }}
                  />
                </div>
                <div className="mt-4 flex items-center gap-2 w-full max-w-[240px]">
                  <button
                    type="button"
                    onClick={() => handleToggleWatchlist(selectedCard)}
                    className={`flex-1 inline-flex items-center justify-center gap-2 border-2 border-border px-3 py-2 font-mono text-xs font-bold uppercase ${isMarketCardWatched(selectedCard, watchlist) ? 'bg-amber-500 text-black border-amber-600' : 'bg-background hover:bg-muted'}`}
                  >
                    <Star className="h-4 w-4" fill={isMarketCardWatched(selectedCard, watchlist) ? 'currentColor' : 'none'} />
                    {isMarketCardWatched(selectedCard, watchlist) ? 'Watched' : 'Watch Card'}
                  </button>
                  <a
                    href={`https://scryfall.com/search?q=${encodeURIComponent(selectedCard.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-2 border-2 border-border bg-primary px-3 py-2 font-mono text-xs font-bold uppercase text-primary-foreground hover:opacity-90"
                  >
                    Scryfall <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 border-2 border-border bg-muted/40 p-3 font-mono">
                  <div>
                    <span className="text-[10px] uppercase text-muted-foreground block">Current USD</span>
                    <span className="text-xl font-extrabold">${selectedCard.currentUsd.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-muted-foreground block">7-Day Momentum</span>
                    <span className={`text-xl font-extrabold ${selectedCard.percentChange >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}`}>
                      {selectedCard.percentChange >= 0 ? `+${selectedCard.percentChange}%` : `${selectedCard.percentChange}%`}
                    </span>
                  </div>
                </div>

                <div className="border border-border p-3 bg-card font-mono text-xs space-y-2">
                  <span className="font-bold text-muted-foreground uppercase block">Multi-Outlet Pricing</span>
                  <div className="grid grid-cols-3 gap-1 text-center">
                    <div className="border border-border p-1 bg-muted/20">
                      <span className="text-[9px] text-muted-foreground block">Card Kingdom</span>
                      <span className="font-bold">${selectedCard.cardKingdomUsd?.toFixed(2) ?? selectedCard.currentUsd.toFixed(2)}</span>
                    </div>
                    <div className="border border-border p-1 bg-muted/20">
                      <span className="text-[9px] text-muted-foreground block">TCGplayer</span>
                      <span className="font-bold">${selectedCard.tcgplayerMarketUsd?.toFixed(2) ?? selectedCard.currentUsd.toFixed(2)}</span>
                    </div>
                    <div className="border border-border p-1 bg-muted/20">
                      <span className="text-[9px] text-muted-foreground block">MTGGoldfish</span>
                      <span className="font-bold">${selectedCard.mtgGoldfishUsd?.toFixed(2) ?? selectedCard.currentUsd.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="border border-border p-3 bg-card text-xs space-y-1">
                  <span className="font-mono font-bold text-muted-foreground uppercase block">Market Thesis</span>
                  <p className="leading-relaxed">{selectedCard.thesis}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-border pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedCard(null)}
                className="border-2 border-border bg-card px-5 py-2 font-mono text-xs font-bold uppercase hover:bg-muted"
              >
                Close Stats
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
