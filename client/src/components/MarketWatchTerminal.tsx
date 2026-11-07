import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ChevronDown, Search, SlidersHorizontal } from "lucide-react";
import { Link } from "wouter";
import dailyMarketSnapshotUrl from "@/data/dailyMarketSnapshot.json?url";
import { MarketCardPreview } from "@/components/MarketCardPreview";
import { MarketMoverCardArt } from "@/components/MarketMoverCardArt";

type SnapshotSignal = {
  id?: string;
  name: string;
  setCode: string;
  setName?: string;
  collectorNumber?: string | null;
  currentUsd: number | null;
  previousUsd?: number | null;
  percentChange: number;
  category?: string;
  sourceCount?: number;
  reason?: string;
  lastUpdated?: string;
  format?: string;
};

type TerminalSignal = SnapshotSignal & { key: string };

type Props = {
  fallbackSignals?: SnapshotSignal[];
  generatedDate?: string;
};

function formatUsd(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? `$${value.toFixed(2)}` : "—";
}

function formatMove(value: number) {
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function normalizeCategory(value = "") {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function mapSignal(signal: SnapshotSignal, index: number): TerminalSignal {
  return {
    ...signal,
    key: `${signal.setCode}:${signal.collectorNumber || signal.name}:${index}`,
    setName: signal.setName || signal.setCode.toUpperCase(),
    category: signal.category || "watchlist",
    sourceCount: signal.sourceCount || 0,
    reason: signal.reason || "Snapshot-derived signal; review exact printing and liquidity before acting.",
  };
}

export function MarketWatchTerminal({ fallbackSignals = [], generatedDate }: Props) {
  const [signals, setSignals] = useState<TerminalSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [direction, setDirection] = useState("all");
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("move");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(dailyMarketSnapshotUrl)
      .then(response => {
        if (!response.ok) throw new Error(`Snapshot request failed: ${response.status}`);
        return response.json();
      })
      .then(payload => {
        if (!active) return;
        const remote = Array.isArray(payload?.signals) ? payload.signals : [];
        setSignals(remote.map(mapSignal));
        setLoadError(null);
      })
      .catch(error => {
        if (!active) return;
        setSignals(fallbackSignals.map(mapSignal));
        setLoadError(error instanceof Error ? error.message : "Snapshot unavailable; showing research-feed fallback.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [fallbackSignals]);

  const categories = useMemo(() => ["all", ...Array.from(new Set(signals.map(signal => signal.category || "watchlist"))).sort()], [signals]);
  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return signals
      .filter(signal => direction === "all" || (direction === "up" ? signal.percentChange > 0 : signal.percentChange < 0))
      .filter(signal => category === "all" || signal.category === category)
      .filter(signal => !normalizedQuery || `${signal.name} ${signal.setCode} ${signal.setName}`.toLowerCase().includes(normalizedQuery))
      .sort((a, b) => {
        if (sort === "price") return Number(b.currentUsd || 0) - Number(a.currentUsd || 0);
        if (sort === "name") return a.name.localeCompare(b.name);
        return Math.abs(b.percentChange) - Math.abs(a.percentChange) || Number(b.currentUsd || 0) - Number(a.currentUsd || 0);
      })
      .slice(0, 25);
  }, [category, direction, query, signals, sort]);

  const positive = signals.filter(signal => signal.percentChange > 0).length;
  const negative = signals.filter(signal => signal.percentChange < 0).length;
  const flat = signals.length - positive - negative;

  return (
    <section className="border-2 border-border bg-card" aria-label="25-mover market terminal">
      <div className="border-b-2 border-border bg-slate-950 px-4 py-5 text-white sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300">Market terminal · current snapshot</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight">Top 25 movers</h2>
            <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-300">Browse first. Open a row for the reason, risk, and exact-printing context.</p>
          </div>
          <div className="font-mono text-[10px] uppercase text-slate-400">{generatedDate || "Latest available"}</div>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2 font-mono text-[10px] font-black uppercase">
          <div className="border border-emerald-400/40 bg-emerald-400/10 p-3 text-emerald-200"><span className="block text-lg">{positive}</span>Gainers</div>
          <div className="border border-red-400/40 bg-red-400/10 p-3 text-red-200"><span className="block text-lg">{negative}</span>Losers</div>
          <div className="border border-slate-500/40 bg-slate-400/10 p-3 text-slate-200"><span className="block text-lg">{flat}</span>Flat</div>
        </div>
      </div>

      <div className="border-b border-border bg-background p-4">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
          <label className="flex min-h-11 items-center gap-2 border border-border bg-card px-3">
            <Search className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <span className="sr-only">Search movers</span>
            <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search card, set, or printing" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
          </label>
          <label className="flex min-h-11 items-center gap-2 border border-border bg-card px-3 font-mono text-[10px] font-black uppercase">
            <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="sr-only">Direction</span>
            <select value={direction} onChange={event => setDirection(event.target.value)} className="bg-transparent text-xs outline-none"><option value="all">All directions</option><option value="up">Gainers</option><option value="down">Losers</option></select>
          </label>
          <label className="flex min-h-11 items-center border border-border bg-card px-3 font-mono text-[10px] font-black uppercase">
            <span className="sr-only">Category</span>
            <select value={category} onChange={event => setCategory(event.target.value)} className="max-w-44 bg-transparent text-xs outline-none"><option value="all">All categories</option>{categories.filter(item => item !== "all").map(item => <option key={item} value={item}>{item.replaceAll("-", " ")}</option>)}</select>
          </label>
          <label className="flex min-h-11 items-center border border-border bg-card px-3 font-mono text-[10px] font-black uppercase">
            <span className="sr-only">Sort movers</span>
            <select value={sort} onChange={event => setSort(event.target.value)} className="bg-transparent text-xs outline-none"><option value="move">Sort: largest move</option><option value="price">Sort: price</option><option value="name">Sort: name</option></select>
          </label>
        </div>
        {loadError && <p className="mt-3 border-l-2 border-amber-500 pl-3 text-xs leading-5 text-amber-800 dark:text-amber-300">Snapshot fallback: {loadError}</p>}
      </div>

      <div className="divide-y divide-border">
        {loading && <div className="p-6 font-mono text-xs uppercase text-muted-foreground">Loading current snapshot…</div>}
        {!loading && filtered.length === 0 && <div className="p-6 text-sm text-muted-foreground">No movers match these filters.</div>}
        {!loading && filtered.map((signal, index) => {
          const isUp = signal.percentChange > 0;
          const isExpanded = expanded === signal.key;
          return <div key={signal.key} className="bg-card">
            <button type="button" onClick={() => setExpanded(isExpanded ? null : signal.key)} className="grid w-full grid-cols-[2rem_minmax(0,1fr)_auto_auto_auto] items-center gap-3 px-4 py-3 text-left hover:bg-primary/5 sm:grid-cols-[2.5rem_2.5rem_minmax(0,1fr)_8rem_6rem_7rem] sm:px-5">
              <span className="font-mono text-xs font-black text-muted-foreground">{index + 1}</span>
              <span className="sm:hidden"><MarketMoverCardArt name={signal.name} setCode={signal.setCode} /></span>
              <span className="hidden sm:block"><MarketMoverCardArt name={signal.name} setCode={signal.setCode} size="small" /></span>
              <span className="min-w-0"><strong className="block truncate text-sm font-black">{signal.name}</strong><span className="block truncate font-mono text-[10px] uppercase text-muted-foreground">{signal.setCode} · {signal.collectorNumber || "printing unresolved"}</span></span>
              <span className="hidden font-mono text-xs text-muted-foreground sm:block">{formatUsd(signal.currentUsd)}</span>
              <span className={`font-mono text-sm font-black ${isUp ? "text-emerald-600" : signal.percentChange < 0 ? "text-destructive" : "text-muted-foreground"}`}>{isUp ? <ArrowUp className="mr-1 inline h-3 w-3" /> : signal.percentChange < 0 ? <ArrowDown className="mr-1 inline h-3 w-3" /> : null}{formatMove(signal.percentChange)}</span>
              <span className="flex items-center justify-end gap-2"><span className="hidden border border-border px-2 py-1 font-mono text-[9px] font-black uppercase text-muted-foreground sm:inline">{signal.category}</span><ChevronDown className={`h-4 w-4 text-muted-foreground transition ${isExpanded ? "rotate-180" : ""}`} /></span>
            </button>
            {isExpanded && <div className="grid gap-4 border-t border-border bg-background px-4 py-4 sm:grid-cols-[auto_minmax(0,1fr)] sm:px-20"><MarketCardPreview name={signal.name} setCode={signal.setCode} size="md" /><div><div className="flex flex-wrap gap-2 font-mono text-[10px] font-black uppercase"><span className="border border-border px-2 py-1">{signal.format || "Market"}</span><span className="border border-border px-2 py-1">{signal.sourceCount || 0} price sources</span><span className="border border-border px-2 py-1">{formatUsd(signal.previousUsd)} → {formatUsd(signal.currentUsd)}</span></div><p className="mt-3 text-sm leading-6 text-muted-foreground">{signal.reason}</p><Link href={cardHref(signal.name)} className="mt-3 inline-flex text-xs font-black text-primary underline">Open card detail</Link></div></div>}
          </div>;
        })}
      </div>
      <div className="border-t border-border px-4 py-3 font-mono text-[10px] uppercase text-muted-foreground sm:px-5">Showing {filtered.length} of {signals.length.toLocaleString()} snapshot signals · snapshot-derived; verify exact printing, liquidity, and completed sales.</div>
    </section>
  );
}

function cardHref(name: string) {
  return `/card/${encodeURIComponent(name)}`;
}
