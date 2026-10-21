/* Dated market workspace: the visible mover table is an imported snapshot, not a live quote or sentiment feed. */
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Link } from "wouter";
import {
  ExternalLink,
  Search,
  Sparkles,
  Star,
  TrendingUp,
  Zap,
} from "lucide-react";
import { MarketMoversTable } from "@/components/MarketMoversTable";
import { MarketCardItem } from "@/components/MarketCardItem";
import { MOVER_CATEGORIES, type MoverCard } from "@/lib/dailyMoversEngine";
import { NavigationSearch } from "@/components/NavigationSearch";
import {
  isMarketCardWatched,
  loadMarketWatchlist,
  toggleMarketWatchlist,
  type MarketWatchlistEntry,
} from "@/lib/marketWatchlist";
import {
  findImportedMover,
  importedReportHref,
} from "@/data/marketReportArchive";
import currentSnapshot from "@/data/dailyMarketSnapshot.json";

const currentSnapshotDate = currentSnapshot.signals.reduce(
  (latest, signal) =>
    signal.lastUpdated > latest ? signal.lastUpdated : latest,
  ""
);

export function DailyMovers() {
  const [activeFeed, setActiveFeed] = useState<"snapshot" | "watchlist">(
    "snapshot"
  );
  const [moverLens, setMoverLens] = useState<
    "all" | "gainers" | "losers" | "reprint-squashes"
  >("all");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [selectedSetCode, setSelectedSetCode] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<string>("all");
  const [rarityFilter, setRarityFilter] = useState<string>("all");
  const [trendFilter, setTrendFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("pct-desc");
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [watchlist, setWatchlist] = useState<MarketWatchlistEntry[]>(() =>
    loadMarketWatchlist()
  );
  const [selectedCard, setSelectedCard] = useState<MoverCard | null>(null);

  // The primary feed is the newest dated snapshot only. Older CSV and canonical
  // records remain available through the archive and deeper research routes.
  const snapshotMovers = useMemo<MoverCard[]>(() => {
    return currentSnapshot.signals
      .filter(
        signal =>
          signal.lastUpdated === currentSnapshotDate &&
          signal.previousUsd !== null &&
          signal.percentChange !== 0
      )
      .map(signal => ({
        id: signal.id,
        name: signal.name,
        setCode: signal.setCode,
        setName: signal.setName,
        rarity: signal.rarity as MoverCard["rarity"],
        currentUsd: signal.currentUsd,
        previousUsd: signal.previousUsd as number,
        changeUsd: Number(
          (signal.currentUsd - (signal.previousUsd as number)).toFixed(2)
        ),
        percentChange: signal.percentChange,
        recentPrices: [signal.previousUsd as number, signal.currentUsd],
        category: signal.category,
        signalSource: "MTGJSON Aggregate",
        priceSource: signal.source,
        sourceCount: signal.sourceCount,
        lastUpdated: signal.lastUpdated,
        thesis: signal.reason,
        cardKingdomUsd: signal.cardKingdomUsd ?? undefined,
        tcgplayerMarketUsd: signal.tcgplayerMarketUsd ?? undefined,
        isCatalyst: signal.isCatalyst,
      }));
  }, []);
  const activeMoversList = useMemo(
    () =>
      snapshotMovers.map(mover => {
        const imported = findImportedMover(mover.name, mover.setCode);
        return imported
          ? {
              ...mover,
              pricingDate: imported.pricingDate,
              pricingReportHref: importedReportHref(imported.pricingDate),
            }
          : mover;
      }),
    [snapshotMovers]
  );

  const availableSets = useMemo(() => {
    const set = new Set<string>();
    activeMoversList.forEach(m => set.add(m.setCode.toUpperCase()));
    return Array.from(set).sort();
  }, [activeMoversList]);

  const availableCategories = useMemo(
    () =>
      MOVER_CATEGORIES.filter(
        category =>
          category.id === "all" ||
          activeMoversList.some(mover => mover.category === category.id)
      ),
    [activeMoversList]
  );

  const filteredMovers = useMemo(() => {
    let result = activeMoversList;

    if (activeFeed === "watchlist") {
      result = result.filter(m => isMarketCardWatched(m, watchlist));
    }

    if (moverLens === "gainers") {
      result = result.filter(m => m.percentChange > 0);
    } else if (moverLens === "losers") {
      result = result.filter(m => m.percentChange < 0);
    } else if (moverLens === "reprint-squashes") {
      result = result.filter(m => m.category === "reprint-squashes");
    }

    if (activeCategory !== "all") {
      result = result.filter(m => m.category === activeCategory);
    }

    if (selectedSetCode !== "all") {
      result = result.filter(
        m => m.setCode.toUpperCase() === selectedSetCode.toUpperCase()
      );
    }

    if (priceRange !== "all") {
      result = result.filter(m => {
        if (priceRange === "under-5") return m.currentUsd < 5;
        if (priceRange === "5-25")
          return m.currentUsd >= 5 && m.currentUsd <= 25;
        if (priceRange === "25-100")
          return m.currentUsd > 25 && m.currentUsd <= 100;
        if (priceRange === "over-100") return m.currentUsd > 100;
        return true;
      });
    }

    if (rarityFilter !== "all") {
      result = result.filter(m => m.rarity.toLowerCase() === rarityFilter);
    }

    if (trendFilter !== "all") {
      result = result.filter(m =>
        trendFilter === "rising"
          ? m.percentChange > 0
          : trendFilter === "falling"
            ? m.percentChange < 0
            : m.percentChange === 0
      );
    }

    if (searchFilter.trim()) {
      const q = searchFilter.trim().toLowerCase();
      result = result.filter(
        m =>
          m.name.toLowerCase().includes(q) ||
          m.setCode.toLowerCase().includes(q) ||
          m.thesis.toLowerCase().includes(q)
      );
    }

    return [...result].sort((a, b) => {
      if (sortBy === "pct-desc") return b.percentChange - a.percentChange;
      if (sortBy === "pct-asc") return a.percentChange - b.percentChange;
      if (sortBy === "price-desc") return b.currentUsd - a.currentUsd;
      if (sortBy === "price-asc") return a.currentUsd - b.currentUsd;
      if (sortBy === "name-asc") return a.name.localeCompare(b.name);
      return 0;
    });
  }, [
    activeMoversList,
    activeFeed,
    moverLens,
    activeCategory,
    selectedSetCode,
    priceRange,
    rarityFilter,
    trendFilter,
    searchFilter,
    sortBy,
    watchlist,
  ]);

  const activeFeedMovers = filteredMovers;
  const visibleWatchlist = activeMoversList.filter(m =>
    isMarketCardWatched(m, watchlist)
  );

  function handleToggleWatchlist(mover: MoverCard) {
    const updated = toggleMarketWatchlist(mover);
    setWatchlist(updated);
  }

  function handleExportSnapshotTxt() {
    const lines = [
      "====================================================================",
      " MTG CURRENT MARKET MOVERS EXPORT",
      ` Data date: ${currentSnapshotDate.slice(0, 10)}`,
      ` Exported: ${new Date().toISOString()}`,
      "====================================================================",
      "",
    ];
    activeMoversList.forEach((m, i) => {
      lines.push(
        `${i + 1}. [${m.setCode.toUpperCase()}] ${m.name} (${m.rarity}) - Snapshot USD: $${m.currentUsd.toFixed(2)} | Source-reported change: ${m.percentChange >= 0 ? "+" : ""}${m.percentChange}% | Source: ${m.signalSource}`
      );
      lines.push(`   Thesis: ${m.thesis}`);
      lines.push("");
    });
    const blob = new Blob([lines.join("\n")], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mtg-current-market-movers-${currentSnapshotDate.slice(0, 10)}.txt`;
    a.click();
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Top Header Bar */}
      <header className="border-b-2 border-border bg-card px-4 py-4 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 border-2 border-border bg-muted px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider hover:border-primary"
            >
              ← Back to Sets
            </Link>
            <div className="hidden sm:block h-6 w-px bg-border" />
            <span className="hidden sm:inline-block font-mono text-xs font-bold uppercase tracking-widest text-primary">
              Dated Market Snapshots
            </span>
          </div>

          <div className="flex min-w-0 w-full flex-wrap items-center gap-3 md:w-auto">
            <NavigationSearch />
            <Link
              href="/market-watch"
              className="inline-flex items-center gap-1.5 border-2 border-amber-500 bg-amber-500/10 px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-amber-700 hover:border-amber-600 whitespace-nowrap"
            >
              Market Watch Feed
            </Link>
            <details className="relative max-w-full">
              <summary className="inline-flex max-w-full cursor-pointer list-none items-center gap-1.5 border-2 border-border bg-card px-3 py-1.5 font-mono text-xs font-bold uppercase hover:border-primary sm:whitespace-nowrap">
                More research
              </summary>
              <div className="absolute right-0 top-full z-20 mt-2 grid w-64 gap-1 border-2 border-border bg-background p-2 shadow-xl">
                <Link
                  href="/signal-matrix-article"
                  className="border border-border px-3 py-2 font-mono text-[10px] font-bold uppercase hover:border-primary"
                >
                  <Sparkles className="mr-1 inline h-3.5 w-3.5" /> Featured
                  article
                </Link>
                <Link
                  href="/market-articles"
                  className="border border-border px-3 py-2 font-mono text-[10px] font-bold uppercase hover:border-primary"
                >
                  Editorial deep dives
                </Link>
                <Link
                  href="/costco-deal-article"
                  className="border border-border px-3 py-2 font-mono text-[10px] font-bold uppercase hover:border-primary"
                >
                  Historical Costco note
                </Link>
              </div>
            </details>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 py-8 sm:px-8">
        {/* Page Title & Feed Mode Toggles */}
        <div className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-border pb-6">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.2em] text-primary">
              <Zap className="h-4 w-4" /> Current signal window ·{" "}
              {currentSnapshotDate.slice(0, 10)}
            </div>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Current Market Movers
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Only the newest dated signal records with a non-zero move are
              shown here. Use category filters to narrow the current screen; use
              Market Watch for historical context and methodology.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3 border-2 border-primary/40 bg-primary/5 px-3 py-2 text-xs">
              <span className="font-mono font-black uppercase tracking-wider text-primary">
                Current signal window
              </span>
              <span className="text-muted-foreground">
                {currentSnapshotDate.slice(0, 10)} · {snapshotMovers.length}{" "}
                cards with a non-zero move
              </span>
              <Link
                href="/market-watch"
                className="font-mono font-bold uppercase tracking-wider text-primary underline decoration-2 underline-offset-2 hover:text-foreground"
              >
                Open research feed →
              </Link>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/market-reports"
              className="font-mono text-xs font-bold uppercase tracking-wider text-primary underline"
            >
              Historical reports archive →
            </Link>
            <Link
              href="/market-signal-audit"
              className="font-mono text-xs font-bold uppercase tracking-wider text-primary underline"
            >
              Signal audit →
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/market-reports"
              className="inline-flex items-center gap-2 border-2 border-border bg-card px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider hover:border-primary"
            >
              Dated Reports Archive
            </Link>
            <Link
              href="/market-signal-audit"
              className="inline-flex items-center gap-2 border-2 border-primary bg-primary/10 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-primary hover:bg-primary hover:text-primary-foreground"
            >
              Signal Audit
            </Link>
            <Link
              href="/market-movers-manus-report"
              className="inline-flex items-center gap-2 border-2 border-amber-600/50 bg-amber-500/10 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-amber-700 hover:bg-amber-500 hover:text-black"
            >
              Historical mover archive
            </Link>
            <div className="inline-flex border-2 border-border bg-card p-1">
              <button
                type="button"
                onClick={() => setActiveFeed("snapshot")}
                className={`px-4 py-1.5 font-mono text-xs font-bold uppercase tracking-wider transition-colors ${
                  activeFeed === "snapshot"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Current Movers ({activeMoversList.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveFeed("watchlist")}
                className={`px-4 py-1.5 font-mono text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 ${
                  activeFeed === "watchlist"
                    ? "bg-amber-500 text-black font-extrabold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Star
                  className="h-3.5 w-3.5"
                  fill={activeFeed === "watchlist" ? "currentColor" : "none"}
                />
                Watchlist ({visibleWatchlist.length})
              </button>
            </div>

            <button
              type="button"
              onClick={handleExportSnapshotTxt}
              className="inline-flex items-center gap-2 border-2 border-primary bg-primary text-primary-foreground px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider shadow hover:opacity-90"
            >
              Export Snapshot (TXT)
            </button>
          </div>
        </div>

        <details className="mt-8 border border-border bg-card">
          <summary className="cursor-pointer px-4 py-3 font-mono text-xs font-black uppercase tracking-wider">
            Current snapshot provenance · {currentSnapshot.signals.length}{" "}
            signals tracked
          </summary>
          <div className="grid gap-3 border-t border-border p-4 md:grid-cols-3">
            <article className="border border-border bg-card p-4">
              <p className="font-mono text-[10px] font-black uppercase tracking-wider text-primary">
                Current window
              </p>
              <p className="mt-2 text-lg font-black">
                {currentSnapshotDate.slice(0, 10)}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Only records with this latest observation date and a non-zero
                prior-period change appear in the mover grid.
              </p>
            </article>
            <article className="border border-border bg-card p-4">
              <p className="font-mono text-[10px] font-black uppercase tracking-wider text-primary">
                Sources
              </p>
              <p className="mt-2 text-lg font-black">
                {currentSnapshot.sources.length} feeds
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {currentSnapshot.sources.join(" · ")}
              </p>
            </article>
            <article className="border border-border bg-card p-4">
              <p className="font-mono text-[10px] font-black uppercase tracking-wider text-primary">
                Caveat
              </p>
              <p className="mt-2 text-sm font-black">
                Source-specific, not live quotes
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Exact printing, venue, liquidity, and completed-sale checks
                still belong in the deeper Market Watch research feed.
              </p>
            </article>
          </div>
        </details>

        <section className="mt-8 flex flex-wrap items-center justify-between gap-4 border border-border bg-card p-4 sm:p-5">
          <div>
            <p className="font-mono text-[10px] font-black uppercase tracking-widest text-primary">
              Deeper context
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Historical reports, methodology, and source caveats live in the
              Market Watch feed.
            </p>
          </div>
          <Link
            href="/market-watch"
            className="border-2 border-primary bg-primary px-4 py-2 font-mono text-xs font-bold uppercase text-primary-foreground hover:opacity-90"
          >
            Open Market Watch →
          </Link>
        </section>

        {/* Filter and Category Bar */}
        <section className="mt-8 border-2 border-border bg-card p-4 sm:p-6 shadow-sm">
          <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-mono text-[10px] font-black uppercase tracking-widest text-primary">
                Mover lens
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Toggle the current window by direction or reprint pressure.
              </p>
            </div>
            <div
              className="flex flex-wrap gap-2"
              role="group"
              aria-label="Filter current movers by lens"
            >
              {(
                [
                  ["all", "All current"],
                  ["gainers", "Gainers"],
                  ["losers", "Losers"],
                  ["reprint-squashes", "Reprint squashes"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMoverLens(value)}
                  aria-pressed={moverLens === value}
                  className={`border px-3 py-2 font-mono text-[10px] font-black uppercase tracking-wider transition-colors ${
                    moverLens === value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:border-primary hover:text-primary"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto flex-1">
              {/* Search Filter */}
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={e => setSearchFilter(e.target.value)}
                  placeholder="Filter movers by card name, set..."
                  className="w-full bg-background border border-border pl-9 pr-3 py-2 font-mono text-xs uppercase focus:border-primary focus:outline-none"
                  aria-label="Filter movers by card name or set"
                />
              </div>

              {/* Set Code Filter */}
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Set:
                </span>
                <select
                  value={selectedSetCode}
                  onChange={e => setSelectedSetCode(e.target.value)}
                  aria-label="Filter by Set"
                  className="border border-border bg-background px-2.5 py-1.5 font-mono text-xs uppercase text-foreground outline-none focus:border-primary"
                >
                  <option value="all">All Sets</option>
                  {availableSets.map(setCode => (
                    <option key={setCode} value={setCode}>
                      {setCode}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Range Filter */}
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Price:
                </span>
                <select
                  value={priceRange}
                  onChange={e => setPriceRange(e.target.value)}
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
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Rarity:
                </span>
                <select
                  value={rarityFilter}
                  onChange={e => setRarityFilter(e.target.value)}
                  aria-label="Filter by Rarity"
                  className="border border-border bg-background px-2.5 py-1.5 font-mono text-xs uppercase text-foreground outline-none focus:border-primary"
                >
                  <option value="all">Any Rarity</option>
                  <option value="mythic">Mythic</option>
                  <option value="rare">Rare</option>
                  <option value="uncommon">Uncommon</option>
                  <option value="common">Common</option>
                </select>
              </div>

              {/* Trend Filter */}
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Trend:
                </span>
                <select
                  value={trendFilter}
                  onChange={e => setTrendFilter(e.target.value)}
                  aria-label="Filter by Price Trend"
                  className="border border-border bg-background px-2.5 py-1.5 font-mono text-xs uppercase text-foreground outline-none focus:border-primary"
                >
                  <option value="all">Any Trend</option>
                  <option value="rising">Rising</option>
                  <option value="falling">Falling</option>
                  <option value="flat">Flat</option>
                </select>
              </div>

              {/* Sort By */}
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Sort:
                </span>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  aria-label="Sort Daily Movers"
                  className="border border-border bg-background px-2.5 py-1.5 font-mono text-xs uppercase text-foreground outline-none focus:border-primary"
                >
                  <option value="pct-desc">Highest Spike (%)</option>
                  <option value="pct-asc">Biggest Loss (%)</option>
                  <option value="price-desc">Highest Price ($)</option>
                  <option value="price-asc">Lowest Price ($)</option>
                  <option value="name-asc">Card Name (A-Z)</option>
                </select>
              </div>
            </div>
            <p className="w-full font-mono text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              Showing {activeFeedMovers.length} of {activeMoversList.length}{" "}
              current movers
            </p>
          </div>

          {/* Category Tabs */}
          <div className="mt-6 flex flex-wrap gap-2">
            {availableCategories.map(cat => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`border px-3 py-2 font-mono text-xs font-bold uppercase tracking-wider transition-colors ${
                    isActive
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-primary hover:text-primary"
                  }`}
                >
                  {cat.label}{" "}
                  {cat.id !== "all" &&
                    `(${activeMoversList.filter(mover => mover.category === cat.id).length})`}
                </button>
              );
            })}
          </div>

          {/* Movers Grid with Loading Skeleton or Cards */}
          {activeFeed === "watchlist" && visibleWatchlist.length === 0 && (
            <div className="mt-8 border-2 border-dashed border-amber-500/40 bg-amber-500/5 p-8 text-center">
              <Star
                className="mx-auto h-6 w-6 text-amber-600 dark:text-amber-300"
                aria-hidden="true"
              />
              <p className="mt-3 font-semibold">Your watchlist is empty.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Switch to the imported snapshot and star cards in the table to
                keep them here.
              </p>
            </div>
          )}

          <div
            className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
            aria-live="polite"
          >
            {activeFeedMovers.map((mover, index) => (
              <div
                key={mover.id}
                className="market-mover-enter"
                style={{ "--market-mover-index": index } as CSSProperties}
              >
                <MarketCardItem
                  mover={mover}
                  watchlist={watchlist}
                  onSelect={setSelectedCard}
                  onToggleWatchlist={handleToggleWatchlist}
                />
              </div>
            ))}
          </div>

          {/* Detailed Table View */}
          <div className="mt-12 space-y-8">
            <MarketMoversTable
              data={activeFeedMovers}
              title={
                activeFeed === "watchlist"
                  ? "Watchlist Table"
                  : "Current Movers Table"
              }
              description={`Current source-reported prices and percentage moves from the ${currentSnapshotDate.slice(0, 10)} signal window; exact printing and liquidity still require verification.`}
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
              <TrendingUp className="h-4 w-4" /> Current Mover Detail
            </div>
            <h2 className="mt-2 text-2xl font-extrabold">
              {selectedCard.name}
            </h2>
            <p className="font-mono text-xs text-muted-foreground uppercase">
              {selectedCard.setCode} Set · Rarity: {selectedCard.rarity} ·
              Source: {selectedCard.signalSource}
            </p>

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
                    src={`https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(selectedCard.name.replace(/\s*\([^)]*\)/g, "").trim())}&set=${encodeURIComponent(selectedCard.setCode.toLowerCase())}&format=image&version=normal`}
                    alt={selectedCard.name}
                    className="h-full w-full object-cover"
                    onError={e => {
                      (e.currentTarget as HTMLImageElement).src =
                        'data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" width="240" height="336" viewBox="0 0 240 336"><rect fill="%231e293b" width="240" height="336"/><text x="120" y="168" font-family="monospace" font-size="14" fill="%23cbd5e1" text-anchor="middle">MTG Art</text></svg>';
                    }}
                  />
                </div>
                <div className="mt-4 flex items-center gap-2 w-full max-w-[240px]">
                  <button
                    type="button"
                    onClick={() => handleToggleWatchlist(selectedCard)}
                    className={`flex-1 inline-flex items-center justify-center gap-2 border-2 border-border px-3 py-2 font-mono text-xs font-bold uppercase ${isMarketCardWatched(selectedCard, watchlist) ? "bg-amber-500 text-black border-amber-600" : "bg-background hover:bg-muted"}`}
                  >
                    <Star
                      className="h-4 w-4"
                      fill={
                        isMarketCardWatched(selectedCard, watchlist)
                          ? "currentColor"
                          : "none"
                      }
                    />
                    {isMarketCardWatched(selectedCard, watchlist)
                      ? "Watched"
                      : "Watch Card"}
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
                    <span className="text-[10px] uppercase text-muted-foreground block">
                      Snapshot USD
                    </span>
                    <span className="text-xl font-extrabold">
                      ${selectedCard.currentUsd.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-muted-foreground block">
                      Source-reported change
                    </span>
                    <span
                      className={`text-xl font-extrabold ${selectedCard.percentChange >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}
                    >
                      {selectedCard.percentChange >= 0
                        ? `+${selectedCard.percentChange}%`
                        : `${selectedCard.percentChange}%`}
                    </span>
                  </div>
                </div>

                <div className="border border-border p-3 bg-card font-mono text-xs space-y-2">
                  <span className="font-bold text-muted-foreground uppercase block">
                    Vendor quotes included in this row
                  </span>
                  <div className="grid grid-cols-3 gap-1 text-center">
                    <div className="border border-border p-1 bg-muted/20">
                      <span className="text-[9px] text-muted-foreground block">
                        Card Kingdom
                      </span>
                      <span className="font-bold">
                        {selectedCard.cardKingdomUsd == null
                          ? "Not in snapshot"
                          : `$${selectedCard.cardKingdomUsd.toFixed(2)}`}
                      </span>
                    </div>
                    <div className="border border-border p-1 bg-muted/20">
                      <span className="text-[9px] text-muted-foreground block">
                        TCGplayer
                      </span>
                      <span className="font-bold">
                        {selectedCard.tcgplayerMarketUsd == null
                          ? "Not in snapshot"
                          : `$${selectedCard.tcgplayerMarketUsd.toFixed(2)}`}
                      </span>
                    </div>
                    <div className="border border-border p-1 bg-muted/20">
                      <span className="text-[9px] text-muted-foreground block">
                        MTGGoldfish
                      </span>
                      <span className="font-bold">
                        {selectedCard.mtgGoldfishUsd == null
                          ? "Not in snapshot"
                          : `$${selectedCard.mtgGoldfishUsd.toFixed(2)}`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border border-border p-3 bg-card text-xs space-y-1">
                  <span className="font-mono font-bold text-muted-foreground uppercase block">
                    Market Thesis
                  </span>
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
