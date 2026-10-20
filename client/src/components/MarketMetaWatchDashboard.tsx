import React from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  ShieldAlert,
  TrendingUp,
  Users,
} from "lucide-react";
import { Link } from "wouter";
import rawMetaWatch from "@/data/metaWatch.json";
import rawPriceHistory from "@/data/dailyMoverHistory.json";
import { MarketCardPreview } from "@/components/MarketCardPreview";

type MetaWatch = typeof rawMetaWatch;
type PriceSignal = MetaWatch["priceSpikes"]["signals"][number];
type CommanderSignal = MetaWatch["commanderDemand"]["shifts"][number];
type BrawlSignal = MetaWatch["brawlMeta"]["cardSignals"][number];

function formatDate(value: string | null) {
  if (!value) return "n/a";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(`${value}T12:00:00Z`));
}

function formatUsd(value: number | null) {
  return value === null ? "—" : `$${value.toFixed(2)}`;
}

function formatDelta(value: number | null, suffix = "%") {
  return value === null
    ? "n/a"
    : `${value > 0 ? "+" : ""}${value.toFixed(1)}${suffix}`;
}

function deltaClass(value: number | null) {
  return Number(value || 0) >= 0
    ? "text-emerald-700 dark:text-emerald-400"
    : "text-destructive";
}

function PriceTrendChart({ signal }: { signal: PriceSignal }) {
  const points = rawPriceHistory.snapshots
    .map(snapshot => ({
      date: snapshot.date,
      price: (snapshot.prices as Record<string, number>)[signal.key],
    }))
    .filter(
      (point): point is { date: string; price: number } =>
        typeof point.price === "number"
    );
  if (points.length < 2) {
    return (
      <div className="mt-4 border border-border bg-card p-3 font-mono text-[10px] uppercase text-muted-foreground">
        Historical chart unavailable for this exact printing.
      </div>
    );
  }
  const prices = points.map(point => point.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const chartPoints = points
    .map(
      (point, index) =>
        `${(index / (points.length - 1)) * 100},${92 - ((point.price - min) / range) * 76}`
    )
    .join(" ");
  const last = points[points.length - 1];
  return (
    <div
      className="mt-4 border border-border bg-card p-3"
      aria-label={`${signal.name} historical price trend`}
    >
      <div className="flex items-center justify-between gap-3 font-mono text-[10px] font-black uppercase tracking-wider">
        <span>30-snapshot price trend</span>
        <span>{formatUsd(last.price)}</span>
      </div>
      <svg
        className="mt-3 h-20 w-full overflow-visible"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        role="img"
        aria-label={`Price trend from ${formatUsd(points[0].price)} to ${formatUsd(last.price)}`}
      >
        <line
          x1="0"
          y1="92"
          x2="100"
          y2="92"
          className="stroke-border"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
        <line
          x1="0"
          y1="16"
          x2="100"
          y2="16"
          className="stroke-border"
          strokeWidth="1"
          strokeDasharray="2 3"
          vectorEffect="non-scaling-stroke"
        />
        <polyline
          points={chartPoints}
          fill="none"
          className="stroke-primary"
          strokeWidth="2.5"
          vectorEffect="non-scaling-stroke"
        />
        <circle
          cx="100"
          cy={92 - ((last.price - min) / range) * 76}
          r="2.5"
          className="fill-primary"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="mt-1 flex justify-between font-mono text-[9px] uppercase text-muted-foreground">
        <span>{formatDate(points[0].date)}</span>
        <span>
          low {formatUsd(min)} · high {formatUsd(max)}
        </span>
        <span>{formatDate(last.date)}</span>
      </div>
      <p className="mt-2 border-l-2 border-amber-500 pl-2 text-[10px] leading-4 text-muted-foreground">
        Snapshot history, not a continuous marketplace tape; gaps reflect
        unavailable refresh observations.
      </p>
    </div>
  );
}

function PriceSignalCard({ signal }: { signal: PriceSignal }) {
  const movement = signal.sevenDayPct ?? signal.latestDayPct;
  return (
    <article className="border-2 border-border bg-background p-4 sm:p-5">
      <div className="flex items-start gap-4">
        <MarketCardPreview
          name={signal.name}
          setCode={signal.setCode}
          size="md"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] font-black uppercase tracking-wider text-primary">
                {signal.setCode.toUpperCase()} · #
                {signal.collectorNumber || "n/a"}
              </p>
              <Link
                href={`/card/${encodeURIComponent(signal.name)}`}
                className="mt-1 block text-lg font-black leading-tight hover:text-primary"
              >
                {signal.name}
              </Link>
            </div>
            <span
              className={`inline-flex items-center gap-1 font-mono text-xs font-black ${deltaClass(movement)}`}
            >
              {Number(movement || 0) >= 0 ? (
                <ArrowUpRight className="h-4 w-4" />
              ) : (
                <ArrowDownRight className="h-4 w-4" />
              )}
              {formatDelta(movement)}
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 border-y border-border py-3 font-mono text-[10px]">
            <div>
              <p className="uppercase text-muted-foreground">Current</p>
              <p className="mt-1 text-base font-black">
                {formatUsd(signal.currentUsd)}
              </p>
            </div>
            <div>
              <p className="uppercase text-muted-foreground">Prior day</p>
              <p className="mt-1 text-base font-black">
                {formatUsd(signal.previousUsd)}
              </p>
            </div>
            <div>
              <p className="uppercase text-muted-foreground">1-day</p>
              <p
                className={`mt-1 font-black ${deltaClass(signal.latestDayPct)}`}
              >
                {formatDelta(signal.latestDayPct)}
              </p>
            </div>
            <div>
              <p className="uppercase text-muted-foreground">7-day</p>
              <p
                className={`mt-1 font-black ${deltaClass(signal.sevenDayPct)}`}
              >
                {formatDelta(signal.sevenDayPct)}
              </p>
            </div>
          </div>
          <PriceTrendChart signal={signal} />
          <p className="mt-3 text-xs leading-5 text-muted-foreground">
            {signal.sourceCount ?? 0} price sources ·{" "}
            {signal.category.replaceAll("-", " ")} · exact printing tracked
          </p>
          <p className="mt-2 border-l-2 border-amber-500 pl-2 font-mono text-[10px] leading-4 text-muted-foreground">
            Evidence: {formatDate(signal.evidenceDates.latest)} vs{" "}
            {formatDate(signal.evidenceDates.previous)}; baseline{" "}
            {formatDate(signal.evidenceDates.baseline)}.
          </p>
        </div>
      </div>
    </article>
  );
}

function CommanderRow({ signal }: { signal: CommanderSignal }) {
  const shift = signal.signal === "shift";
  return (
    <li className="border-b border-border py-3 last:border-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-black leading-tight">
            #{signal.rank} · {signal.name}
          </p>
          <p className="mt-1 font-mono text-[10px] uppercase text-muted-foreground">
            {signal.decksPastMonth.toLocaleString()} decks ·{" "}
            {shift ? "measured shift" : signal.signal.replaceAll("-", " ")}
          </p>
        </div>
        <span
          className={`shrink-0 font-mono text-xs font-black ${shift ? deltaClass(signal.rankDelta) : "text-muted-foreground"}`}
        >
          {shift
            ? `${signal.rankDelta > 0 ? "+" : ""}${signal.rankDelta} rank`
            : "baseline"}
        </span>
      </div>
    </li>
  );
}

function BrawlRow({
  signal,
  maxCount,
}: {
  signal: BrawlSignal;
  maxCount: number;
}) {
  const width = Math.max(
    8,
    Math.round((signal.strategyCount / Math.max(maxCount, 1)) * 100)
  );
  return (
    <li className="border-b border-border py-3 last:border-0">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="font-black">{signal.name}</span>
        <span className="font-mono text-[10px] font-black text-muted-foreground">
          {signal.strategyCount} / {maxCount} docs
        </span>
      </div>
      <div className="mt-2 h-2 border border-border bg-card">
        <div className="h-full bg-primary" style={{ width: `${width}%` }} />
      </div>
    </li>
  );
}

export function MarketMetaWatchDashboard() {
  const report = rawMetaWatch as MetaWatch;
  const priceSignals = report.priceSpikes.signals;
  const commanderSignals = report.commanderDemand.shifts.slice(0, 8);
  const measuredShifts = report.commanderDemand.shifts.filter(
    signal => signal.signal === "shift"
  );
  const brawlSignals = report.brawlMeta.cardSignals.slice(0, 8);
  const maxBrawlCount = brawlSignals[0]?.strategyCount || 1;

  return (
    <section
      className="border-2 border-primary bg-primary/5 p-5 sm:p-7"
      aria-labelledby="market-meta-watch-heading"
    >
      <header className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-primary/20 pb-5">
        <div>
          <div className="flex items-center gap-2 font-mono text-[10px] font-black uppercase tracking-[0.2em] text-primary">
            <Activity className="h-4 w-4" /> Automated market watch
          </div>
          <h2
            id="market-meta-watch-heading"
            className="mt-2 text-2xl font-black sm:text-3xl"
          >
            Price spikes & meta movement
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Merged from the daily repository evidence pass. Use this as a review
            queue, not a live quote or a standalone buy signal.
          </p>
        </div>
        <div className="border border-border bg-background px-3 py-2 font-mono text-[10px] font-black uppercase tracking-wider">
          As of {formatDate(report.asOf)}
        </div>
      </header>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="border border-border bg-background p-3">
          <p className="font-mono text-[9px] font-black uppercase text-muted-foreground">
            Price alerts
          </p>
          <p className="mt-1 text-2xl font-black">{priceSignals.length}</p>
          <p className="text-xs text-muted-foreground">
            threshold-qualified records
          </p>
        </div>
        <div className="border border-border bg-background p-3">
          <p className="font-mono text-[9px] font-black uppercase text-muted-foreground">
            Commander shifts
          </p>
          <p className="mt-1 text-2xl font-black">{measuredShifts.length}</p>
          <p className="text-xs text-muted-foreground">
            rank or deck-count changes
          </p>
        </div>
        <div className="border border-border bg-background p-3">
          <p className="font-mono text-[9px] font-black uppercase text-muted-foreground">
            Brawl corpus
          </p>
          <p className="mt-1 text-2xl font-black">
            {report.brawlMeta.strategyDocumentCount}
          </p>
          <p className="text-xs text-muted-foreground">
            curated strategy documents
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div>
          <div className="flex items-end justify-between gap-3 border-b border-border pb-3">
            <div>
              <p className="font-mono text-xs font-black uppercase tracking-wider text-primary">
                Price spike queue
              </p>
              <h3 className="mt-1 text-xl font-black">
                Cards needing verification
              </h3>
            </div>
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div className="mt-4 space-y-3">
            {priceSignals.length ? (
              priceSignals.map(signal => (
                <PriceSignalCard key={signal.key} signal={signal} />
              ))
            ) : (
              <p className="border border-border bg-background p-4 text-sm text-muted-foreground">
                No threshold-qualified price signals in the latest snapshot.
              </p>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="border border-border bg-background p-4 sm:p-5">
            <div className="flex items-center gap-2 font-mono text-xs font-black uppercase tracking-wider text-primary">
              <Users className="h-4 w-4" /> Commander demand
            </div>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              {report.commanderDemand.methodology}
            </p>
            <ul className="mt-3">
              {commanderSignals.map(signal => (
                <CommanderRow key={signal.name} signal={signal} />
              ))}
            </ul>
            {!measuredShifts.length && (
              <p className="mt-3 border-l-2 border-amber-500 pl-3 font-mono text-[10px] leading-4 text-muted-foreground">
                No measured shifts yet. The current EDHREC file is establishing
                the first comparison baseline.
              </p>
            )}
          </div>

          <div className="border border-border bg-background p-4 sm:p-5">
            <div className="flex items-center gap-2 font-mono text-xs font-black uppercase tracking-wider text-primary">
              <BarChart3 className="h-4 w-4" /> Brawl corpus pulse
            </div>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Representation across curated strategy documents; this is not
              tournament prevalence or platform-wide metagame data.
            </p>
            <ul className="mt-3">
              {brawlSignals.map(signal => (
                <BrawlRow
                  key={signal.name}
                  signal={signal}
                  maxCount={maxBrawlCount}
                />
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-start gap-2 border-t border-primary/20 pt-4 font-mono text-[10px] font-bold uppercase leading-relaxed text-muted-foreground">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />{" "}
        Verify exact printings, liquidity, source dates, and current listings
        before acting. This dashboard is market intelligence, not financial
        advice.
      </div>
    </section>
  );
}

export default MarketMetaWatchDashboard;
