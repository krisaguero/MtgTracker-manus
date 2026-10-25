/* Dated market workspace: the visible mover table is an imported snapshot, not a live quote or sentiment feed. */
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Link } from "wouter";
import dailyMarketSnapshotUrl from "@/data/dailyMarketSnapshot.json?url";
import dailyMoverHistoryUrl from "@/data/dailyMoverHistory.json?url";
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

type RollingPriceSnapshot = {
  date: string;
  prices: Record<string, number | undefined>;
};
type MarketSignal = {
  id: string;
  name: string;
  setCode: string;
  setName: string;
  rarity: string;
  currentUsd: number | null;
  previousUsd: number | null;
  percentChange: number;
  category: string;
  source: string;
  sourceCount: number;
  reason: string;
  cardKingdomUsd?: number | null;
  tcgplayerMarketUsd?: number | null;
  isCatalyst?: boolean;
  lastUpdated: string;
};
type DailyMarketSnapshot = {
  signals: MarketSignal[];
  sources: string[];
};
type DailyMoverHistory = {
  snapshots: RollingPriceSnapshot[];
};

const MOBILE_CARD_HEIGHT = 320;
const MOBILE_CARD_VIEWPORT_HEIGHT = 680;
const MOBILE_CARD_OVERSCAN = 4;

export function DailyMovers() {
  const [currentSnapshot, setCurrentSnapshot] =
    useState<DailyMarketSnapshot | null>(null);
  const [moverHistory, setMoverHistory] = useState<DailyMoverHistory | null>(
    null
  );
  const [snapshotError, setSnapshotError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    const fetchJson = async (url: string) => {
      const response = await fetch(url, { cache: "no-cache" });
      if (!response.ok) {
        throw new Error(`Market data request failed: ${response.status}`);
      }
      return response.json();
    };
    Promise.all([fetchJson(dailyMarketSnapshotUrl), fetchJson(dailyMoverHistoryUrl)])
      .then(([snapshot, history]) => {
        if (cancelled) return;
        setCurrentSnapshot(snapshot as DailyMarketSnapshot);
        setMoverHistory(history as DailyMoverHistory);
      })
      .catch(() => {
        if (!cancelled) {
          setSnapshotError(
            "The market snapshot could not be loaded. Please refresh and try again."
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const rollingPriceSnapshots = useMemo<RollingPriceSnapshot[]>(
    () => (moverHistory?.snapshots ?? []) as unknown as RollingPriceSnapshot[],
    [moverHistory]
  );
  const currentSnapshotDate = useMemo(
    () =>
      currentSnapshot?.signals.reduce(
        (latest, signal) =>
          signal.lastUpdated > latest ? signal.lastUpdated : latest,
        ""
      ) ?? "",
    [currentSnapshot]
  );
  const snapshotLoading = !currentSnapshot && !snapshotError;
  const [activeFeed, setActiveFeed] = useState<"snapshot" | "watchlist">(
    "snapshot"
  );
  const [moverLens, setMoverLens] = useState<
    "all" | "gainers" | "losers" | "reprint-squashes"
  >("all");
  const [missionScope, setMissionScope] = useState<
    "top" | "major" | "all"
  >("top");
  const [quickPreset, setQuickPreset] = useState<
    "none" | "top-gainers" | "dollar-shifts" | "budget-breakouts"
  >("none");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [selectedSetCode, setSelectedSetCode] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<string>("all");
  const [rarityFilter, setRarityFilter] = useState<string>("all");
  const [trendFilter, setTrendFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("pct-desc");
  const [page, setPage] = useState(1);
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [watchlist, setWatchlist] = useState<MarketWatchlistEntry[]>(() =>
    loadMarketWatchlist()
  );
  const [selectedCard, setSelectedCard] = useState<MoverCard | null>(null);
  const [mobileLayout, setMobileLayout] = useState(true);
  const [cardWindowStart, setCardWindowStart] = useState(0);
  const cardViewportRef = useRef<HTMLDivElement>(null);
  const cardScrollEndTimerRef = useRef<number | null>(null);
  const cardWindowStartRef = useRef(0);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 639px)");
    const syncLayout = () => setMobileLayout(media.matches);
    syncLayout();
    media.addEventListener("change", syncLayout);
    return () => media.removeEventListener("change", syncLayout);
  }, []);

  // The primary feed starts with the newest dated snapshot, then adds cards with
  // a real multi-day move from the rolling history window. This keeps flat first
  // observations out while surfacing cards that are riding or falling between
  // daily refreshes.
  const snapshotMovers = useMemo<MoverCard[]>(() => {
    if (!currentSnapshot) return [];
    return currentSnapshot.signals
      .filter(
        signal =>
          signal.lastUpdated === currentSnapshotDate &&
          signal.currentUsd !== null
      )
      .map((signal): MoverCard | null => {
        const latestPrice = signal.currentUsd;
        if (latestPrice === null) return null;
        const history = rollingPriceSnapshots
          .map(snapshot => snapshot.prices[signal.id])
          .filter(
            (price): price is number =>
              price !== undefined && Number.isFinite(price) && price > 0
          );
        const hasDailyMove =
          signal.previousUsd !== null && signal.percentChange !== 0;
        const historyBaseline = history[0] ?? signal.previousUsd;
        const windowPercentChange =
          history.length >= 2 && historyBaseline
            ? Number(
                (
                  ((latestPrice - historyBaseline) / historyBaseline) *
                  100
                ).toFixed(2)
              )
            : 0;
        const effectivePercentChange = hasDailyMove
          ? signal.percentChange
          : windowPercentChange;

        if (
          effectivePercentChange === 0 ||
          (!hasDailyMove && history.length < 2)
        ) {
          return null;
        }

        const previousUsd = hasDailyMove
          ? (signal.previousUsd as number)
          : (historyBaseline as number);
        return {
          id: signal.id,
          name: signal.name,
          setCode: signal.setCode,
          setName: signal.setName,
          rarity: signal.rarity as MoverCard["rarity"],
          currentUsd: latestPrice,
          previousUsd,
          changeUsd: Number((latestPrice - previousUsd).toFixed(2)),
          percentChange: effectivePercentChange,
          recentPrices:
            history.length >= 2 ? history : [previousUsd, latestPrice],
          category: signal.category,
          signalSource: "MTGJSON Aggregate" as const,
          priceSource: signal.source,
          sourceCount: signal.sourceCount,
          lastUpdated: signal.lastUpdated,
          thesis: hasDailyMove
            ? signal.reason
            : `${signal.reason} Rolling ${history.length}-snapshot trend added to the current watch window.`,
          cardKingdomUsd: signal.cardKingdomUsd ?? undefined,
          tcgplayerMarketUsd: signal.tcgplayerMarketUsd ?? undefined,
          isCatalyst: signal.isCatalyst,
        };
      })
      .filter((mover): mover is MoverCard => mover !== null);
  }, [currentSnapshot, currentSnapshotDate, rollingPriceSnapshots]);
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

  const scannerSummary = useMemo(() => {
    const shortlist = new Map<string, MoverCard>();
    const takeTop = (items: MoverCard[], limit: number) => {
      items
        .slice()
        .sort(
          (left, right) =>
            Math.abs(right.percentChange) - Math.abs(left.percentChange) ||
            Math.abs(right.changeUsd) - Math.abs(left.changeUsd)
        )
        .slice(0, limit)
        .forEach(item => shortlist.set(item.id, item));
    };
    const pricedAtDollar = activeMoversList.filter(
      mover => mover.currentUsd >= 1 && mover.previousUsd >= 1
    );
    takeTop(pricedAtDollar.filter(mover => mover.percentChange > 0), 10);
    takeTop(pricedAtDollar.filter(mover => mover.percentChange < 0), 10);
    takeTop(activeMoversList.filter(mover => mover.changeUsd >= 1), 10);
    takeTop(activeMoversList.filter(mover => mover.changeUsd <= -1), 10);
    takeTop(
      activeMoversList.filter(
        mover =>
          mover.currentUsd <= 10 &&
          mover.changeUsd >= 0.25 &&
          mover.percentChange >= 10
      ),
      10
    );

    return {
      rawObservations: currentSnapshot?.signals.length ?? 0,
      moverWindow: activeMoversList.length,
      rising: activeMoversList.filter(mover => mover.percentChange > 0).length,
      falling: activeMoversList.filter(mover => mover.percentChange < 0).length,
      shortlist: shortlist.size,
      shortlistIds: new Set(shortlist.keys()),
    };
  }, [activeMoversList, currentSnapshot]);

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

    if (missionScope === "top") {
      result = result.filter(m => scannerSummary.shortlistIds.has(m.id));
    } else if (missionScope === "major") {
      result = result.filter(
        m =>
          m.currentUsd >= 10 ||
          Math.abs(m.changeUsd) >= 1 ||
          (Math.abs(m.percentChange) >= 20 &&
          (m.rarity === "mythic" || m.rarity === "rare"))
      );
    }

    if (quickPreset === "top-gainers") {
      result = result.filter(m => m.percentChange > 0);
    } else if (quickPreset === "dollar-shifts") {
      result = result.filter(m => Math.abs(m.changeUsd) >= 1);
    } else if (quickPreset === "budget-breakouts") {
      result = result.filter(
        m =>
          m.currentUsd <= 10 &&
          m.changeUsd >= 0.25 &&
          m.percentChange >= 10
      );
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
    missionScope,
    quickPreset,
    scannerSummary.shortlistIds,
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

  const PAGE_SIZE = 24;
  const pageCount = Math.max(1, Math.ceil(filteredMovers.length / PAGE_SIZE));
  const activeFeedMovers = useMemo(
    () => filteredMovers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredMovers, page]
  );
  useEffect(() => {
    setPage(1);
  }, [activeFeed, missionScope, quickPreset, moverLens, activeCategory, selectedSetCode, priceRange, rarityFilter, trendFilter, searchFilter, sortBy]);
  const visibleWatchlist = activeMoversList.filter(m =>
    isMarketCardWatched(m, watchlist)
  );

  useEffect(() => {
    const viewport = cardViewportRef.current;
    if (!viewport || !mobileLayout) return;
    let frame = 0;
    const onScroll = () => {
      viewport.dataset.marketScrolling = "true";
      if (cardScrollEndTimerRef.current !== null) {
        window.clearTimeout(cardScrollEndTimerRef.current);
      }
      cardScrollEndTimerRef.current = window.setTimeout(() => {
        delete viewport.dataset.marketScrolling;
        cardScrollEndTimerRef.current = null;
      }, 120);
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const nextWindowStart = Math.max(
          0,
          Math.floor(viewport.scrollTop / MOBILE_CARD_HEIGHT) -
            MOBILE_CARD_OVERSCAN
        );
        if (nextWindowStart !== cardWindowStartRef.current) {
          cardWindowStartRef.current = nextWindowStart;
          setCardWindowStart(nextWindowStart);
        }
      });
    };
    viewport.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      if (cardScrollEndTimerRef.current !== null) {
        window.clearTimeout(cardScrollEndTimerRef.current);
      }
      viewport.removeEventListener("scroll", onScroll);
    };
  }, [mobileLayout]);

  useEffect(() => {
    cardWindowStartRef.current = 0;
    setCardWindowStart(0);
    cardViewportRef.current?.scrollTo({ top: 0 });
  }, [activeFeedMovers]);

  const virtualFeedMovers = useMemo(() => {
    if (!mobileLayout || activeFeedMovers.length === 0) {
      return { rows: activeFeedMovers, start: 0, end: activeFeedMovers.length };
    }
    const visibleCount = Math.ceil(
      MOBILE_CARD_VIEWPORT_HEIGHT / MOBILE_CARD_HEIGHT
    );
    const start = cardWindowStart;
    const end = Math.min(
      activeFeedMovers.length,
      start + visibleCount + MOBILE_CARD_OVERSCAN * 2
    );
    return {
      rows: activeFeedMovers.slice(start, end),
      start,
      end,
    };
  }, [activeFeedMovers, cardWindowStart, mobileLayout]);

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
              {snapshotLoading
                ? "Loading snapshot…"
                : currentSnapshotDate.slice(0, 10)}
            </div>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Current Market Movers
            </h1>
            {snapshotError && (
              <p
                role="alert"
                className="mt-3 border-2 border-destructive/50 bg-destructive/5 p-3 text-sm font-semibold text-destructive"
              >
                {snapshotError}
              </p>
            )}
            <p className="mt-1 text-sm text-muted-foreground">
              Daily movers plus multi-day riders and drops from the rolling
              snapshot history. Use category and direction filters to narrow the
              current screen; use Market Watch for deeper methodology.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3 border-2 border-primary/40 bg-primary/5 px-3 py-2 text-xs">
              <span className="font-mono font-black uppercase tracking-wider text-primary">
                Surfaced mover window
              </span>
              <span className="text-muted-foreground">
                {snapshotLoading ? "Loading snapshot…" : currentSnapshotDate.slice(0, 10)} · {scannerSummary.moverWindow}{" "}
                cards with a daily or rolling move
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

        <section className="mt-6 grid gap-px border-2 border-border bg-border sm:grid-cols-2 xl:grid-cols-4" aria-labelledby="scanner-coverage-heading">
          <h2 id="scanner-coverage-heading" className="sr-only">Scanner coverage and surfaced mover counts</h2>
          <article className="bg-card p-4">
            <p className="font-mono text-[10px] font-black uppercase tracking-wider text-muted-foreground">Raw observations</p>
            <p className="mt-2 text-2xl font-black tabular-nums">{snapshotLoading ? "—" : scannerSummary.rawObservations.toLocaleString()}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Exact-printing price records scanned in the latest snapshot.</p>
          </article>
          <article className="bg-card p-4">
            <p className="font-mono text-[10px] font-black uppercase tracking-wider text-primary">Mover window</p>
            <p className="mt-2 text-2xl font-black tabular-nums">{snapshotLoading ? "—" : scannerSummary.moverWindow.toLocaleString()}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Daily movers plus multi-day riders and drops shown in this table.</p>
          </article>
          <article className="bg-card p-4">
            <p className="font-mono text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">Threshold shortlist</p>
            <p className="mt-2 text-2xl font-black tabular-nums">{snapshotLoading ? "—" : scannerSummary.shortlist.toLocaleString()}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Top capped candidates across percentage, dollar, and budget lenses.</p>
          </article>
          <article className="bg-card p-4">
            <p className="font-mono text-[10px] font-black uppercase tracking-wider text-muted-foreground">Direction split</p>
            <p className="mt-2 text-2xl font-black tabular-nums">{snapshotLoading ? "—" : `${scannerSummary.rising.toLocaleString()} / ${scannerSummary.falling.toLocaleString()}`}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Rising versus falling cards in the surfaced mover window.</p>
          </article>
        </section>

        <details className="mt-8 border border-border bg-card">
          <summary className="cursor-pointer px-4 py-3 font-mono text-xs font-black uppercase tracking-wider">
            Raw snapshot provenance · {currentSnapshot?.signals.length ?? 0}{" "}
            observations tracked
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
                Records use the latest observation date plus a rolling-history
                comparison so flat daily observations can still surface as
                riders or drops when their multi-day trend is active.
              </p>
            </article>
            <article className="border border-border bg-card p-4">
              <p className="font-mono text-[10px] font-black uppercase tracking-wider text-primary">
                Sources
              </p>
              <p className="mt-2 text-lg font-black">
                {currentSnapshot?.sources.length ?? 0} feeds
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {currentSnapshot?.sources.join(" · ") ||
                  (snapshotLoading ? "Loading snapshot sources…" : "Unavailable")}
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
              Showing {activeFeedMovers.length} of {filteredMovers.length} filtered ·{" "}
              {activeMoversList.length.toLocaleString()} surfaced total
            </p>
          </div>

          <div className="mt-5 border border-primary/30 bg-primary/5 p-3 sm:p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="font-mono text-[10px] font-black uppercase tracking-widest text-primary">
                  Mission Control scope
                </p>
                <p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">
                  Start with the capped signal shortlist, switch to major-dollar cards,
                  or page through every surfaced observation without mounting the full feed.
                </p>
              </div>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Mission Control scope">
                {(
                  [
                    ["top", "Top movers", `${scannerSummary.shortlist}`],
                    ["major", "Major players", "price / $ move"],
                    ["all", "All surfaced", `${activeMoversList.length}`],
                  ] as const
                ).map(([value, label, note]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setMissionScope(value)}
                    aria-pressed={missionScope === value}
                    className={`border px-3 py-2 text-left font-mono text-[10px] font-black uppercase tracking-wider transition-colors ${
                      missionScope === value
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground hover:border-primary hover:text-primary"
                    }`}
                  >
                    <span className="block">{label}</span>
                    <span className="mt-1 block text-[9px] font-normal opacity-80">{note}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 border border-border bg-background p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
            <div>
              <p className="font-mono text-[10px] font-black uppercase tracking-widest text-foreground">
                Quick presets
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Fast screens for the three most useful daily review queues.
              </p>
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Quick mover presets">
              {(
                [
                  ["top-gainers", "Top gainers", "> 0%", "pct-desc"],
                  ["dollar-shifts", "Massive dollar shifts", "≥ $1 move", "price-desc"],
                  ["budget-breakouts", "Budget breakouts", "≤ $10 · ≥ 10%", "pct-desc"],
                ] as const
              ).map(([value, label, note, presetSort]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setQuickPreset(current => (current === value ? "none" : value));
                    setMissionScope("all");
                    setMoverLens("all");
                    setActiveCategory("all");
                    setSortBy(presetSort);
                  }}
                  aria-pressed={quickPreset === value}
                  className={`border px-3 py-2 text-left font-mono text-[10px] font-black uppercase tracking-wider transition-colors ${
                    quickPreset === value
                      ? "border-amber-600 bg-amber-500 text-black"
                      : "border-border bg-card text-muted-foreground hover:border-amber-600 hover:text-foreground"
                  }`}
                >
                  <span className="block">{label}</span>
                  <span className="mt-1 block text-[9px] font-normal opacity-80">{note}</span>
                </button>
              ))}
            </div>
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

          {filteredMovers.length > PAGE_SIZE && (
            <nav className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4" aria-label="Mover pages">
              <p className="font-mono text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                Page {Math.min(page, pageCount)} of {pageCount} · {PAGE_SIZE} cards per page
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage(current => Math.max(1, current - 1))}
                  disabled={page <= 1}
                  className="border border-border px-3 py-2 font-mono text-[10px] font-black uppercase disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setPage(current => Math.min(pageCount, current + 1))}
                  disabled={page >= pageCount}
                  className="border border-primary bg-primary px-3 py-2 font-mono text-[10px] font-black uppercase text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </nav>
          )}

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
            ref={cardViewportRef}
            className="mt-8 grid grid-cols-1 gap-6 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3"
            style={mobileLayout ? { maxHeight: MOBILE_CARD_VIEWPORT_HEIGHT } : undefined}
            aria-live="polite"
          >
            {mobileLayout && activeFeedMovers.length > 0 && (
              <div
                aria-hidden="true"
                className="pointer-events-none"
                style={{
                  height: virtualFeedMovers.start * MOBILE_CARD_HEIGHT,
                  gridColumn: "1 / -1",
                }}
              />
            )}
            {virtualFeedMovers.rows.map((mover, index) => (
              <div
                key={mover.id}
                className="market-mover-enter market-mover-card-surface"
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
            {mobileLayout && activeFeedMovers.length > 0 && (
              <div
                aria-hidden="true"
                className="pointer-events-none"
                style={{
                  height:
                    (activeFeedMovers.length - virtualFeedMovers.end) *
                    MOBILE_CARD_HEIGHT,
                  gridColumn: "1 / -1",
                }}
              />
            )}
          </div>

          {/* Detailed Table View */}
          <div className="mt-12 space-y-8">
            <MarketMoversTable
              data={activeFeedMovers}
              isLoading={snapshotLoading}
              title={
                activeFeed === "watchlist"
                  ? "Watchlist Table"
                  : "Current Movers Table"
              }
              description={`Current source-reported prices and percentage moves from the ${snapshotLoading ? "loading" : currentSnapshotDate.slice(0, 10)} signal window; exact printing and liquidity still require verification.`}
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
