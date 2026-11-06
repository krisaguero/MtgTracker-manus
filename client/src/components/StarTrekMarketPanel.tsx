import { useMemo, useState } from "react";
import { ExternalLink, TrendingDown, TrendingUp } from "lucide-react";
import { CardIndexLink, CardMediaFrame } from "@/components/CardIndexLink";
import {
  starTrekMarketSignals,
  starTrekProductWatch,
  type StarTrekMarketSignal,
} from "@/data/starTrekMarketWatch";

const filters = [
  ["all", "All watch rows"],
  ["star-trek", "Star Trek"],
  ["confirmed", "Confirmed"],
  ["commander", "Commander"],
  ["supply-risk", "Supply / reversal risk"],
  ["constructed", "Constructed"],
] as const;

const statusLabel: Record<StarTrekMarketSignal["status"], string> = {
  confirmed: "Confirmed",
  developing: "Developing",
  speculative: "Speculative",
  "confirmed-decline": "Confirmed decline",
  unverified: "Unverified",
};

function WatchCard({ signal }: { signal: StarTrekMarketSignal }) {
  const [imageSrc, setImageSrc] = useState(
    `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(signal.name)}&set=${encodeURIComponent(signal.setCode)}&format=image&version=normal`
  );
  const [failed, setFailed] = useState(false);
  const positive = signal.moveUsd !== undefined && signal.moveUsd > 0;
  const negative = signal.moveUsd !== undefined && signal.moveUsd < 0;
  const tone = positive
    ? "text-emerald-700 dark:text-emerald-400"
    : negative || signal.status === "confirmed-decline"
      ? "text-destructive"
      : "text-amber-700 dark:text-amber-400";

  return (
    <article className="border border-border bg-card p-3">
      <CardMediaFrame className="mx-auto max-w-[180px] border-2 border-border bg-[#171a24]">
        {!failed ? (
          <img
            src={imageSrc}
            alt={`${signal.name} card art`}
            className="h-full w-full object-contain"
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={() => {
              if (imageSrc.includes("&set=")) {
                setImageSrc(
                  `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(signal.name)}&format=image&version=normal`
                );
              } else {
                setFailed(true);
              }
            }}
          />
        ) : (
          <div className="flex h-full items-center justify-center p-4 text-center font-mono text-[10px] uppercase text-muted-foreground">
            Art unavailable
          </div>
        )}
      </CardMediaFrame>
      <div className="mt-3 flex items-start justify-between gap-2">
        <div>
          <h3 className="font-bold leading-tight">{signal.name}</h3>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
            {signal.setLabel}{signal.collectorNumber ? ` · #${signal.collectorNumber}` : ""}
          </p>
        </div>
        <span className={`shrink-0 border border-current px-1.5 py-1 font-mono text-[9px] font-black uppercase ${tone}`}>
          {statusLabel[signal.status]}
        </span>
      </div>
      <div className="mt-3 border-t border-border pt-2">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="font-mono text-[9px] uppercase text-muted-foreground">Brief price</p>
            <p className="font-mono text-lg font-black">{signal.priceUsd !== undefined ? `$${signal.priceUsd.toFixed(2)}` : "Unverified"}</p>
          </div>
          <p className={`flex items-center gap-1 text-right font-mono text-[10px] font-black ${tone}`}>
            {positive ? <TrendingUp className="h-3 w-3" /> : negative ? <TrendingDown className="h-3 w-3" /> : null}
            {signal.moveLabel}
          </p>
        </div>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">{signal.thesis}</p>
        <p className="mt-2 border-l-2 border-amber-500 pl-2 text-[11px] leading-4 text-muted-foreground">Risk: {signal.risk}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <CardIndexLink name={signal.name} compact />
          <a href={signal.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center gap-1 border border-border px-2 py-1 font-mono text-[9px] font-bold uppercase text-muted-foreground hover:border-primary hover:text-primary">
            Source <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        <p className="mt-2 font-mono text-[9px] uppercase tracking-wide text-muted-foreground">Verified window · {signal.verifiedWindow}</p>
      </div>
    </article>
  );
}

export function StarTrekMarketPanel() {
  const [filter, setFilter] = useState<(typeof filters)[number][0]>("all");
  const visible = useMemo(
    () => filter === "all" ? starTrekMarketSignals : starTrekMarketSignals.filter(signal => signal.category === filter),
    [filter]
  );
  const declines = starTrekMarketSignals.filter(signal => signal.status === "confirmed-decline").length;
  const confirmed = starTrekMarketSignals.filter(signal => signal.status === "confirmed").length;

  return (
    <section className="border-y-2 border-primary/40 bg-primary/5 px-4 py-6 sm:px-8" aria-labelledby="star-trek-market-watch-heading">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-primary">Editorial overlay · source-dated</p>
            <h2 id="star-trek-market-watch-heading" className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Star Trek release watch</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              {starTrekMarketSignals.length} supplied singles and market signals, kept separate from the automated snapshot because the brief uses November 2–5 published windows and several rows are speculative or unverified. Product release: {starTrekProductWatch.releaseDate}.
            </p>
          </div>
          <a href={starTrekProductWatch.officialSource} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 border-2 border-primary px-3 py-2 font-mono text-[10px] font-black uppercase tracking-wider text-primary hover:bg-primary hover:text-primary-foreground">
            Official decklists <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        <div className="mt-5 grid gap-px border border-border bg-border sm:grid-cols-3">
          <div className="bg-card p-3"><p className="font-mono text-[9px] uppercase text-muted-foreground">Confirmed positive / non-Star Trek</p><p className="mt-1 text-2xl font-black">{confirmed}</p></div>
          <div className="bg-card p-3"><p className="font-mono text-[9px] uppercase text-muted-foreground">Star Trek declines</p><p className="mt-1 text-2xl font-black text-destructive">{declines}</p></div>
          <div className="bg-card p-3"><p className="font-mono text-[9px] uppercase text-muted-foreground">Deck MSRP / Collector's</p><p className="mt-1 font-mono text-lg font-black">${starTrekProductWatch.commanderDeckMsrp} / ${starTrekProductWatch.collectorsEditionMsrp}</p></div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Star Trek market watch filters">
          {filters.map(([value, label]) => (
            <button key={value} type="button" onClick={() => setFilter(value)} aria-pressed={filter === value} className={`border px-3 py-2 font-mono text-[10px] font-black uppercase tracking-wider ${filter === value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:border-primary hover:text-primary"}`}>
              {label}
            </button>
          ))}
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map(signal => <WatchCard key={signal.id} signal={signal} />)}
        </div>
        <p className="mt-5 border-l-2 border-amber-500 pl-3 text-xs leading-5 text-muted-foreground">
          Buying posture: do not chase early Star Trek singles before November 13. Recheck completed sales, EDHREC adoption, and listing depth 3–7 days after release. Prices above are the supplied brief’s reference values, not live quotes or financial advice.
        </p>
      </div>
    </section>
  );
}
