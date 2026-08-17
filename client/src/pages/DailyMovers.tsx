/* Design reminder: hard-edged market intelligence workspace; features 10 categories of 25 movers each, penny buyout watches, Reddit sentiment metrics, and deep-dive sentiment analysis. */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'wouter';
import { ArrowUpRight, ExternalLink, Flame, Search, ShieldAlert, Sparkles, Star, TrendingDown, TrendingUp, Zap } from 'lucide-react';
import { MarketMoversTable } from '@/components/MarketMoversTable';
import { MOVER_CATEGORIES, generateCategoryMovers, getMarketSentimentDeepDive, type MoverCard } from '@/lib/dailyMoversEngine';
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
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeFeed, setActiveFeed] = useState<'feed' | 'watchlist'>('feed');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSet, setSelectedSet] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<string>('all'); // 'all', 'under-5', '5-25', '25-100', 'over-100'
  const [sortBy, setSortBy] = useState<string>('pct-desc'); // 'pct-desc', 'price-desc', 'price-asc', 'name-asc'
  const [watchlist, setWatchlist] = useState<MarketWatchlistEntry[]>([]);

  useEffect(() => {
    setWatchlist(loadMarketWatchlist());
  }, []);

  const sentiment = getMarketSentimentDeepDive();
  const moversQuery = trpc.market.getMovers.useQuery();
  const oldSchoolQuery = trpc.market.getOldSchoolSpikes.useQuery();

  const localMovers = useMemo(() => {
    const list: MoverCard[] = [];
    for (const cat of MOVER_CATEGORIES) {
      if (cat.id === 'all') continue;
      list.push(...generateCategoryMovers(cat.id));
    }
    return list;
  }, []);

  const liveMovers = useMemo(() => mapMarketRows(moversQuery.data?.rows ?? [], 'daily-movers'), [moversQuery.data?.rows]);
  const allMovers = liveMovers.length > 0 ? liveMovers : localMovers;
  const marketSource = moversQuery.data?.source === 'parquet' ? 'Live Parquet / DuckDB' : 'Local fallback while Parquet is unavailable';

  const availableSets = useMemo(() => {
    const sets = new Set<string>();
    allMovers.forEach((m) => {
      if (m.setCode) sets.add(m.setCode.toUpperCase());
    });
    return Array.from(sets).sort();
  }, [allMovers]);

  const visibleMovers = useMemo(() => {
    let result = activeCategory === 'all' ? allMovers : allMovers.filter((m) => m.category === activeCategory);
    
    // Set filter
    if (selectedSet !== 'all') {
      result = result.filter((m) => m.setCode.toUpperCase() === selectedSet.toUpperCase());
    }

    // Price range filter
    if (priceRange === 'under-5') {
      result = result.filter((m) => m.currentUsd < 5);
    } else if (priceRange === '5-25') {
      result = result.filter((m) => m.currentUsd >= 5 && m.currentUsd <= 25);
    } else if (priceRange === '25-100') {
      result = result.filter((m) => m.currentUsd > 25 && m.currentUsd <= 100);
    } else if (priceRange === 'over-100') {
      result = result.filter((m) => m.currentUsd > 100);
    }

    // Search query
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      result = result.filter((m) => m.name.toLowerCase().includes(query) || m.setCode.toLowerCase().includes(query) || m.thesis.toLowerCase().includes(query));
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'pct-desc') {
        return Math.abs(b.percentChange) - Math.abs(a.percentChange);
      } else if (sortBy === 'price-desc') {
        return b.currentUsd - a.currentUsd;
      } else if (sortBy === 'price-asc') {
        return a.currentUsd - b.currentUsd;
      } else if (sortBy === 'name-asc') {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });

    return result;
  }, [allMovers, activeCategory, selectedSet, priceRange, searchQuery, sortBy]);

  const oldSchoolSpikes = useMemo(() => {
    const liveOldSchool = mapMarketRows(oldSchoolQuery.data?.rows ?? [], 'old-school');
    if (liveOldSchool.length > 0) return liveOldSchool;
    const oldSchoolSets = new Set(['lea', 'leb', '2ed', 'arn', 'atq', 'leg', 'drk']);
    return allMovers
      .filter((mover) => oldSchoolSets.has(mover.setCode.toLowerCase()) && mover.percentChange >= 10)
      .sort((left, right) => right.percentChange - left.percentChange)
      .slice(0, 50);
  }, [allMovers, oldSchoolQuery.data?.rows]);

  const watchlistUniverse = useMemo(() => {
    const byKey = new Map<string, MoverCard>();
    [...allMovers, ...oldSchoolSpikes].forEach((mover) => byKey.set(getMarketWatchKey(mover), mover));
    return Array.from(byKey.values());
  }, [allMovers, oldSchoolSpikes]);

  const visibleWatchlist = useMemo(() => {
    let result = watchlistUniverse.filter((mover) => isMarketCardWatched(mover, watchlist));
    if (activeCategory !== 'all') result = result.filter((mover) => mover.category === activeCategory);
    if (selectedSet !== 'all') {
      result = result.filter((m) => m.setCode.toUpperCase() === selectedSet.toUpperCase());
    }
    if (priceRange === 'under-5') {
      result = result.filter((m) => m.currentUsd < 5);
    } else if (priceRange === '5-25') {
      result = result.filter((m) => m.currentUsd >= 5 && m.currentUsd <= 25);
    } else if (priceRange === '25-100') {
      result = result.filter((m) => m.currentUsd > 25 && m.currentUsd <= 100);
    } else if (priceRange === 'over-100') {
      result = result.filter((m) => m.currentUsd > 100);
    }
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      result = result.filter((mover) => mover.name.toLowerCase().includes(query) || mover.setCode.toLowerCase().includes(query) || mover.thesis.toLowerCase().includes(query));
    }
    result.sort((a, b) => {
      if (sortBy === 'pct-desc') return Math.abs(b.percentChange) - Math.abs(a.percentChange);
      if (sortBy === 'price-desc') return b.currentUsd - a.currentUsd;
      if (sortBy === 'price-asc') return a.currentUsd - b.currentUsd;
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      return 0;
    });
    return result;
  }, [activeCategory, selectedSet, priceRange, searchQuery, sortBy, watchlist, watchlistUniverse]);

  const activeFeedMovers = activeFeed === 'watchlist' ? visibleWatchlist : visibleMovers;
  const activeOldSchoolSpikes = activeFeed === 'watchlist'
    ? oldSchoolSpikes.filter((mover) => isMarketCardWatched(mover, watchlist))
    : oldSchoolSpikes;

  function handleToggleWatchlist(mover: MoverCard) {
    setWatchlist(toggleMarketWatchlist(mover));
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top minimal navigation */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-primary hover:underline">
            ← Back to recent sets
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/movers/post" className="border border-primary bg-primary px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-primary-foreground hover:bg-primary/90">
              Daily Top 5 &amp; Weekly Roundup
            </Link>
            <Link href="/market-report" className="border border-border bg-card px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground hover:border-primary hover:text-primary">
              Market Report
            </Link>
            <Link href="/commander" className="border border-border bg-card px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground hover:border-primary hover:text-primary">
              Commander Archive
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        {/* Editorial Header */}
        <div className="border-b-2 border-primary pb-6 sm:pb-8">
          <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.2em] text-primary">
            <Zap className="h-4 w-4" /> Comprehensive Market Feed &amp; Buyout Intelligence
          </div>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-5xl">Daily Movers &amp; Sentiment Hub</h1>
          <p className="mt-3 max-w-3xl text-base text-muted-foreground sm:text-lg">
            Scanning 250+ cards across 10 specialized categories—from high-velocity spikes and penny buyout targets to Rules Committee watchlists and Reddit speculation trends.
          </p>
        </div>

        {/* Daily Sentiment Deep-Dive Panel */}
        <section className="mt-10 border-2 border-primary/30 bg-primary/5 p-6 sm:p-8" aria-labelledby="sentiment-heading">
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

        {/* Category Selector Tabs & Search Bar */}
        <section className="mt-12 sm:mt-16" aria-labelledby="movers-heading">
          <div className="flex flex-col gap-4 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-widest text-primary">Categorized Market Feed</p>
              <h2 id="movers-heading" className="text-2xl font-bold tracking-tight sm:text-3xl">250 Tracked Movers (25 per category)</h2>
              <p className="mt-2 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Data source: {marketSource}</p>
            </div>
            <div className="w-full lg:w-80">
              <label className="flex h-11 items-center gap-2 border-2 border-border bg-card px-3 focus-within:border-primary">
                <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search mover name or thesis..."
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
                {searchQuery && (
                  <button type="button" onClick={() => setSearchQuery('')} className="text-xs text-muted-foreground hover:text-foreground">Clear</button>
                )}
              </label>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-y border-border bg-card p-3" role="tablist" aria-label="Market feed views and filters">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                role="tab"
                aria-selected={activeFeed === 'feed'}
                onClick={() => setActiveFeed('feed')}
                className={`border px-3 py-2 font-mono text-xs font-bold uppercase tracking-wider ${activeFeed === 'feed' ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-muted-foreground hover:border-primary hover:text-primary'}`}
              >
                Live feed
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeFeed === 'watchlist'}
                onClick={() => setActiveFeed('watchlist')}
                className={`inline-flex items-center gap-2 border px-3 py-2 font-mono text-xs font-bold uppercase tracking-wider ${activeFeed === 'watchlist' ? 'border-amber-500 bg-amber-500 text-black' : 'border-border bg-background text-muted-foreground hover:border-amber-500 hover:text-amber-700 dark:hover:text-amber-300'}`}
              >
                <Star className="h-3.5 w-3.5" fill={activeFeed === 'watchlist' ? 'currentColor' : 'none'} aria-hidden="true" />
                Watchlist <span className="border border-current px-1.5 py-0.5 text-[10px]">{watchlist.length}</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Set Filter */}
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Set:</span>
                <select
                  value={selectedSet}
                  onChange={(e) => setSelectedSet(e.target.value)}
                  aria-label="Filter by MTG Set"
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
                  {cat.label} {cat.id !== 'all' && `(25)`}
                </button>
              );
            })}
          </div>

          {/* Movers Grid */}
          {activeFeed === 'watchlist' && visibleWatchlist.length === 0 && (
            <div className="mt-8 border-2 border-dashed border-amber-500/40 bg-amber-500/5 p-8 text-center">
              <Star className="mx-auto h-6 w-6 text-amber-600 dark:text-amber-300" aria-hidden="true" />
              <p className="mt-3 font-semibold">Your watchlist is empty.</p>
              <p className="mt-1 text-sm text-muted-foreground">Switch to Live feed and star cards in either table to keep them here.</p>
            </div>
          )}

          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {activeFeedMovers.map((mover) => {
              const isPositive = mover.percentChange >= 0;
              const scryfallImageUrl = `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(mover.name)}&format=image&version=normal`;
              const isWatched = isMarketCardWatched(mover, watchlist);
              return (
                <div key={mover.id} className="flex flex-col border-2 border-border bg-card p-5 transition-colors hover:border-primary">
                  {/* Hero Card Image Display with 7-Day Hover Chart Overlay */}
                  <div className="relative group mx-auto w-full max-w-[240px] aspect-[5/7] overflow-hidden border-2 border-border bg-muted shadow-md">
                    <img
                      src={scryfallImageUrl}
                      alt={mover.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = 'data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" width="240" height="336" viewBox="0 0 240 336"><rect fill="%231e293b" width="240" height="336"/><text x="120" y="168" font-family="monospace" font-size="14" fill="%23cbd5e1" text-anchor="middle">MTG Spike Art</text></svg>';
                      }}
                    />
                    
                    {/* Hover & Focus 7-Day Price History Overlay */}
                    <div className="absolute inset-0 bg-background/95 backdrop-blur-sm opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200 p-4 flex flex-col justify-between z-10">
                      <div>
                        <div className="flex items-center justify-between border-b border-border pb-2">
                          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-primary">7-Day Price History</span>
                          <span className="font-mono text-[10px] uppercase text-muted-foreground">{mover.setCode.toUpperCase()}</span>
                        </div>
                        <p className="mt-2 text-xs font-bold leading-tight">{mover.name}</p>
                      </div>

                      <div className="my-auto py-2">
                        {(() => {
                          const history = (mover.recentPrices && mover.recentPrices.length > 0 ? mover.recentPrices : [mover.previousUsd, mover.currentUsd]).map(Number).filter(n => Number.isFinite(n));
                          const chartWidth = 200;
                          const chartHeight = 80;
                          const pad = 8;
                          const min = Math.min(...history);
                          const max = Math.max(...history);
                          const yFor = (v: number) => max === min ? chartHeight / 2 : chartHeight - pad - ((v - min) / (max - min)) * (chartHeight - pad * 2);
                          const xFor = (i: number) => pad + (i / Math.max(1, history.length - 1)) * (chartWidth - pad * 2);
                          const pts = history.map((v, i) => `${xFor(i)},${yFor(v)}`).join(' ');
                          const trendPositive = history[history.length - 1] >= history[0];
                          const strokeColor = trendPositive ? '#059669' : '#dc2626';

                          return (
                            <div className="space-y-2">
                              <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="overflow-visible bg-card border border-border p-1">
                                <line x1={pad} y1={chartHeight - pad} x2={chartWidth - pad} y2={chartHeight - pad} stroke="currentColor" strokeOpacity="0.2" strokeWidth="1" />
                                <polyline points={pts} fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter" />
                                {history.map((val, idx) => (
                                  <circle key={idx} cx={xFor(idx)} cy={yFor(val)} r="3" fill={strokeColor} />
                                ))}
                              </svg>
                              <div className="flex items-center justify-between font-mono text-[10px]">
                                <span className="text-muted-foreground">Start: ${history[0]?.toFixed(2)}</span>
                                <span className={`font-bold ${trendPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}`}>
                                  Now: ${history[history.length - 1]?.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      <div className="border-t border-border pt-2 text-center">
                        <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Hover out to return to card art</span>
                      </div>
                    </div>

                    <div className="absolute top-2 right-2 flex items-center gap-1 z-20">
                      <button
                        type="button"
                        onClick={() => handleToggleWatchlist(mover)}
                        aria-pressed={isWatched}
                        aria-label={`${isWatched ? 'Remove' : 'Add'} ${mover.name} ${isWatched ? 'from' : 'to'} watchlist`}
                        title={isWatched ? 'Remove from watchlist' : 'Add to watchlist'}
                        className={`inline-flex h-9 w-9 items-center justify-center border-2 shadow ${isWatched ? 'border-amber-500 bg-amber-500 text-black font-bold' : 'border-border bg-background/90 text-foreground hover:border-amber-500 hover:text-amber-600'}`}
                      >
                        <Star className="h-4 w-4" fill={isWatched ? 'currentColor' : 'none'} aria-hidden="true" />
                      </button>
                    </div>
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between bg-background/90 backdrop-blur-sm border border-border px-2 py-1 z-20">
                      <span className="font-mono text-[10px] font-bold uppercase tracking-wider">{mover.setCode.toUpperCase()}</span>
                      <span className={`font-mono text-xs font-extrabold ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}`}>
                        {isPositive ? `+${mover.percentChange}%` : `${mover.percentChange}%`}
                      </span>
                    </div>
                  </div>

                  {/* Details & Metadata */}
                  <div className="mt-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="border border-primary/30 bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-primary">
                          {mover.signalSource}
                        </span>
                        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{mover.rarity}</span>
                      </div>
                      <h3 className="mt-2 text-lg font-bold tracking-tight line-clamp-1" title={mover.name}>{mover.name}</h3>
                    </div>

                    <div className="mt-4 flex items-baseline justify-between border-t border-border pt-3">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Current Price</p>
                        <p className="text-2xl font-extrabold text-primary">${mover.currentUsd.toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Previous</p>
                        <p className="text-sm font-semibold text-muted-foreground">${mover.previousUsd.toFixed(2)}</p>
                      </div>
                    </div>

                    <p className="mt-3 text-xs leading-relaxed text-muted-foreground border-l-2 border-primary/40 pl-3">
                      {mover.thesis}
                    </p>

                    <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Category: {mover.category}</span>
                      <a
                        href={`https://scryfall.com/search?q=${encodeURIComponent(mover.name)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-mono text-xs font-bold text-primary hover:underline"
                      >
                        Scryfall <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-12 space-y-8">
            <MarketMoversTable
              data={activeFeedMovers}
              title={activeFeed === 'watchlist' ? 'Watchlist Movers Table' : 'Daily Movers Table'}
              description="A dense, sortable view of the full market feed. Sort by current price, dollar movement, or percentage momentum, then narrow the dataset by category, signal source, rarity, and move threshold."
              isLoading={moversQuery.isLoading}
              watchlist={watchlist}
              onToggleWatchlist={handleToggleWatchlist}
            />
            <MarketMoversTable
              data={activeOldSchoolSpikes}
              title="Old-School Spike Watch"
              description="Legacy-set candidates from Alpha, Beta, Unlimited, Arabian Nights, Antiquities, Legends, and The Dark. Use the minimum-move filter to isolate meaningful momentum from low-dollar noise."
              accent="amber"
              showCategory={false}
              emptyMessage="No old-school spikes meet the current filter threshold."
              isLoading={oldSchoolQuery.isLoading}
              watchlist={watchlist}
              onToggleWatchlist={handleToggleWatchlist}
            />
          </div>

          {activeFeedMovers.length === 0 && activeFeed === 'feed' && (
            <div className="mt-12 border-2 border-dashed border-border p-12 text-center">
              <p className="font-semibold text-muted-foreground">No movers match "{searchQuery}" in this category.</p>
              <button type="button" onClick={() => { setSearchQuery(''); setActiveCategory('all'); }} className="mt-4 border border-primary bg-primary px-4 py-2 font-mono text-xs font-bold uppercase text-primary-foreground">
                Reset filters
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
