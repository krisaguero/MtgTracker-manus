import React, { useMemo } from "react";
import { History, TrendingDown, TrendingUp } from "lucide-react";
import rawPriceHistory from "@/data/dailyMoverHistory.json";
import type { MoverCard } from "@/lib/dailyMoversEngine";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type PriceHistorySnapshot = {
  date: string;
  prices: Record<string, number>;
};

type PriceHistoryData = {
  snapshots: PriceHistorySnapshot[];
};

const priceHistory = rawPriceHistory as unknown as PriceHistoryData;

function formatUsd(value: number) {
  return `$${value.toFixed(2)}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T12:00:00Z`));
}

function formatPct(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function HistoryChart({
  points,
  name,
}: {
  points: PriceHistorySnapshot[];
  name: string;
}) {
  const values = points
    .map(point => point.prices[name])
    .filter(Number.isFinite);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const width = 760;
  const height = 280;
  const paddingX = 18;
  const paddingY = 24;
  const xFor = (index: number) =>
    paddingX +
    (index / Math.max(points.length - 1, 1)) * (width - paddingX * 2);
  const yFor = (value: number) =>
    height - paddingY - ((value - min) / range) * (height - paddingY * 2);
  const chartPoints = points
    .map((point, index) => `${xFor(index)},${yFor(point.prices[name])}`)
    .join(" ");
  const first = points[0]?.prices[name] ?? 0;
  const last = points[points.length - 1]?.prices[name] ?? 0;
  const rising = last > first;
  const falling = last < first;
  const stroke = rising ? "#059669" : falling ? "#dc2626" : "#64748b";
  const dateIndexes = Array.from(
    new Set([0, Math.floor((points.length - 1) / 2), points.length - 1])
  );

  return (
    <div className="border-2 border-border bg-card p-3 sm:p-5">
      <div className="relative h-64 w-full overflow-hidden">
        <svg
          className="h-full w-full"
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          role="img"
          aria-label={`${name} historical price chart from ${formatUsd(first)} to ${formatUsd(last)}`}
        >
          {[0, 0.5, 1].map(ratio => {
            const y = paddingY + ratio * (height - paddingY * 2);
            const value = max - ratio * range;
            return (
              <g key={ratio}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke="currentColor"
                  strokeOpacity="0.14"
                  strokeDasharray="4 6"
                />
                <text
                  x={paddingX}
                  y={Math.max(12, y - 6)}
                  fill="currentColor"
                  fillOpacity="0.65"
                  fontSize="12"
                >
                  {formatUsd(value)}
                </text>
              </g>
            );
          })}
          <polyline
            points={chartPoints}
            fill="none"
            stroke={stroke}
            strokeWidth="4"
            strokeLinecap="square"
            strokeLinejoin="miter"
          />
          <circle
            cx={xFor(points.length - 1)}
            cy={yFor(last)}
            r="6"
            fill={stroke}
          />
        </svg>
      </div>
      <div className="mt-2 flex justify-between gap-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {dateIndexes.map(index => (
          <span key={points[index]?.date}>
            {formatDate(points[index]?.date ?? "")}
          </span>
        ))}
      </div>
    </div>
  );
}

export function MoverPriceHistoryDialog({ mover }: { mover: MoverCard }) {
  const points = useMemo(
    () =>
      priceHistory.snapshots.filter(snapshot =>
        Number.isFinite(snapshot.prices[mover.id])
      ),
    [mover.id]
  );
  const first = points[0]?.prices[mover.id];
  const last = points[points.length - 1]?.prices[mover.id];
  const values = points.map(point => point.prices[mover.id]);
  const low = values.length ? Math.min(...values) : null;
  const high = values.length ? Math.max(...values) : null;
  const changePct = first && last ? ((last - first) / first) * 100 : null;
  const TrendIcon =
    changePct !== null && changePct < 0 ? TrendingDown : TrendingUp;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 border border-border bg-background px-2.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-primary transition-colors hover:border-primary hover:bg-primary/5"
          aria-label={`View price history for ${mover.name}`}
        >
          <History className="h-3.5 w-3.5" aria-hidden="true" />
          History
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto rounded-none border-2 border-border p-4 sm:p-6">
        <DialogHeader className="border-b border-border pb-4 pr-8 text-left">
          <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-primary">
            Historical price watch
          </p>
          <DialogTitle className="mt-2 text-2xl font-black tracking-tight">
            {mover.name}
          </DialogTitle>
          <DialogDescription className="mt-2 text-left text-sm leading-5">
            Exact-printing snapshot history for {mover.setCode.toUpperCase()} ·{" "}
            {mover.setName}. This chart uses daily refresh observations, not a
            continuous marketplace tape.
          </DialogDescription>
        </DialogHeader>

        {points.length >= 2 && first !== undefined && last !== undefined ? (
          <>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="border border-border bg-muted/20 p-3">
                <p className="font-mono text-[10px] uppercase text-muted-foreground">
                  Latest
                </p>
                <p className="mt-1 text-lg font-black">{formatUsd(last)}</p>
              </div>
              <div className="border border-border bg-muted/20 p-3">
                <p className="font-mono text-[10px] uppercase text-muted-foreground">
                  Window move
                </p>
                <p
                  className={`mt-1 text-lg font-black ${changePct !== null && changePct < 0 ? "text-destructive" : "text-emerald-700 dark:text-emerald-400"}`}
                >
                  {changePct === null ? "—" : formatPct(changePct)}
                </p>
              </div>
              <div className="border border-border bg-muted/20 p-3">
                <p className="font-mono text-[10px] uppercase text-muted-foreground">
                  Low / high
                </p>
                <p className="mt-1 text-sm font-black">
                  {formatUsd(low ?? 0)} / {formatUsd(high ?? 0)}
                </p>
              </div>
              <div className="border border-border bg-muted/20 p-3">
                <p className="font-mono text-[10px] uppercase text-muted-foreground">
                  Observations
                </p>
                <p className="mt-1 inline-flex items-center gap-1 text-lg font-black">
                  <TrendIcon className="h-4 w-4" aria-hidden="true" />{" "}
                  {points.length}
                </p>
              </div>
            </div>
            <HistoryChart points={points} name={mover.id} />
            <p className="border-l-2 border-amber-500 pl-3 font-mono text-[10px] leading-4 text-muted-foreground">
              Coverage: {formatDate(points[0]?.date ?? "")} through{" "}
              {formatDate(points[points.length - 1]?.date ?? "")}. The available
              window expands automatically as the daily GitHub refresh commits
              new snapshots.
            </p>
          </>
        ) : (
          <div className="border-2 border-dashed border-border p-8 text-center">
            <p className="font-mono text-xs font-black uppercase tracking-wider">
              History pending
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              This exact printing does not yet have enough daily snapshot
              observations for a chart.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
