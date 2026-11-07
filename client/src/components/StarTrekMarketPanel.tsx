import React, { useEffect, useMemo, useState } from "react";
import { ExternalLink, TrendingDown, TrendingUp } from "lucide-react";
import { CardIndexLink, CardMediaFrame } from "@/components/CardIndexLink";
import { getMarketCardImageUrls } from "@/lib/marketCardArtLookup";
import {
  starTrekDailyMovers,
  starTrekMarketSignals,
  starTrekProductWatch,
  type StarTrekMarketSignal,
} from "@/data/starTrekMarketWatch";
import starTrekPriceHistory from "@/data/starTrekPriceHistory.json";

type StarTrekTab = "daily" | "watch" | "history";

function StarTrekPriceHistoryPanel() {
  const snapshots = [...starTrekPriceHistory.snapshots].reverse();
  const products = starTrekProductWatch.decks.map((deck, index) => ({
    ...deck,
    id: ["federation-fleet", "landing-party", "klingon-fury", "we-are-the-borg"][index],
  }));

  return (
    <div className="mt-5 border border-border bg-card">
      <div className="border-b border-border p-4">
        <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-primary">Weekly historical desk</p>
        <h3 className="mt-1 text-xl font-black">Commander deck price trends</h3>
        <p className="mt-2 max-w-3xl text-xs leading-5 text-muted-foreground">
          The signal basket is the sum of tracked Star Trek singles associated with each deck. It is not a sealed-deck valuation. MSRP is shown as a baseline until a verified sealed-product quote source is connected.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead>
            <tr className="border-b border-border font-mono text-[9px] uppercase tracking-wide text-muted-foreground">
              <th className="p-3">Deck</th><th className="p-3">Identity</th><th className="p-3">MSRP</th>
              {snapshots.slice(0, 6).map(snapshot => <th key={snapshot.date} className="p-3">{snapshot.date}</th>)}
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product.id} className="border-b border-border last:border-0">
                <td className="p-3 font-bold">{product.name}</td>
                <td className="p-3 text-xs text-muted-foreground">{product.identity}</td>
                <td className="p-3 font-mono text-xs">${starTrekProductWatch.commanderDeckMsrp.toFixed(2)}</td>
                {snapshots.slice(0, 6).map(snapshot => {
                  const value = snapshot.signalBasketUsd[product.id as keyof typeof snapshot.signalBasketUsd];
                  return <td key={snapshot.date} className="p-3 font-mono text-xs font-bold">{typeof value === "number" ? `$${value.toFixed(2)}` : "—"}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid gap-px border-t border-border bg-border sm:grid-cols-3">
        <div className="bg-card p-3"><p className="font-mono text-[9px] uppercase text-muted-foreground">Snapshots retained</p><p className="mt-1 text-xl font-black">{starTrekPriceHistory.snapshots.length}</p></div>
        <div className="bg-card p-3"><p className="font-mono text-[9px] uppercase text-muted-foreground">Latest observation</p><p className="mt-1 font-mono text-sm font-black">{starTrekPriceHistory.snapshots.at(-1)?.date ?? "—"}</p></div>
        <div className="bg-card p-3"><p className="font-mono text-[9px] uppercase text-muted-foreground">Sealed quotes</p><p className="mt-1 text-sm font-black text-amber-700">Awaiting verified source</p></div>
      </div>
    </div>
  );
}

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
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    setImageSrc(null);
    setFailed(false);
    void getMarketCardImageUrls(signal.name, signal.setCode, signal.collectorNumber).then(urls => {
      if (!active) return;
      const nextUrl = urls?.normal || urls?.small || null;
      if (nextUrl) setImageSrc(nextUrl);
      else setFailed(true);
    });
    return () => {
      active = false;
    };
  }, [signal.collectorNumber, signal.name, signal.setCode]);
  const positive = signal.moveUsd !== undefined && signal.moveUsd > 0;
  const negative = signal.moveUsd !== undefined && signal.moveUsd < 0;
  const tone = positive
    ? "text-emerald-700 dark:text-emerald-400"
    : negative || signal.status === "confirmed-decline"
      ? "text-destructive"
      : "text-amber-700 dark:text-amber-400";

  return (
    <article className="border border-border bg-card p-3">
      <CardMediaFrame className="relative mx-auto max-w-[180px] border-2 border-border bg-[#171a24]">
        {!failed ? (
          <>
            <img
              src={imageSrc || "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="}
              data-card-art-query={signal.name}
              alt={`${signal.name} card art`}
              className="h-full w-full object-contain"
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              onError={() => {
                if (imageSrc) setFailed(true);
              }}
            />
            {!imageSrc && <div className="absolute inset-0 flex items-center justify-center bg-muted/80 font-mono text-[9px] font-bold uppercase text-muted-foreground">Loading art</div>}
          </>
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
            <p className="font-mono text-[9px] uppercase text-muted-foreground">Source price</p>
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
        <p className="mt-2 font-mono text-[9px] uppercase tracking-wide text-muted-foreground">Source window · {signal.verifiedWindow}</p>
      </div>
    </article>
  );
}

export function StarTrekMarketPanel() {
  const [filter, setFilter] = useState<(typeof filters)[number][0]>("all");
  const [tab, setTab] = useState<StarTrekTab>("daily");
  const visible = useMemo(
    () => filter === "all" ? starTrekMarketSignals : starTrekMarketSignals.filter(signal => signal.category === filter),
    [filter]
  );
  const dailyGains = starTrekDailyMovers.filter(signal => (signal.moveUsd ?? 0) > 0).length;
  const dailyDeclines = starTrekDailyMovers.filter(signal => (signal.moveUsd ?? 0) < 0).length;

  return (
    <section className="border-y-2 border-primary/40 bg-primary/5 px-4 py-6 sm:px-8" aria-labelledby="star-trek-market-watch-heading">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-primary">Editorial overlay · source-dated</p>
            <h2 id="star-trek-market-watch-heading" className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Star Trek release watch</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Latest tab: {starTrekDailyMovers.length} MTGGoldfish Daily Change rows read on November 7. Earlier editorial signals from November 2–5 and the Scryfall price-basket history remain available separately. The daily page has no separate as-of timestamp, and the moves are not completed-sale verification. Tabletop release: {starTrekProductWatch.releaseDate}.
            </p>
          </div>
          <a href={starTrekProductWatch.officialSource} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 border-2 border-primary px-3 py-2 font-mono text-[10px] font-black uppercase tracking-wider text-primary hover:bg-primary hover:text-primary-foreground">
            Official decklists <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        <div className="mt-5 grid gap-px border border-border bg-border sm:grid-cols-3">
          <div className="bg-card p-3"><p className="font-mono text-[9px] uppercase text-muted-foreground">Daily reported gainers · Nov. 7</p><p className="mt-1 text-2xl font-black text-emerald-700 dark:text-emerald-400">{dailyGains}</p></div>
          <div className="bg-card p-3"><p className="font-mono text-[9px] uppercase text-muted-foreground">Daily reported decliners · Nov. 7</p><p className="mt-1 text-2xl font-black text-destructive">{dailyDeclines}</p></div>
          <div className="bg-card p-3"><p className="font-mono text-[9px] uppercase text-muted-foreground">Deck MSRP / Collector's</p><p className="mt-1 font-mono text-lg font-black">${starTrekProductWatch.commanderDeckMsrp} / ${starTrekProductWatch.collectorsEditionMsrp}</p></div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Star Trek market watch filters">
          <button type="button" onClick={() => setTab("daily")} aria-pressed={tab === "daily"} className={`border-2 px-3 py-2 font-mono text-[10px] font-black uppercase tracking-wider ${tab === "daily" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:border-primary hover:text-primary"}`}>Daily movers · Nov. 7</button>
          <button type="button" onClick={() => setTab("watch")} aria-pressed={tab === "watch"} className={`border-2 px-3 py-2 font-mono text-[10px] font-black uppercase tracking-wider ${tab === "watch" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:border-primary hover:text-primary"}`}>Earlier editorial watch · Nov. 5</button>
          <button type="button" onClick={() => setTab("history")} aria-pressed={tab === "history"} className={`border-2 px-3 py-2 font-mono text-[10px] font-black uppercase tracking-wider ${tab === "history" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:border-primary hover:text-primary"}`}>Historical trends</button>
        </div>
        {tab === "watch" && <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Star Trek market watch filters">
          {filters.map(([value, label]) => (
            <button key={value} type="button" onClick={() => setFilter(value)} aria-pressed={filter === value} className={`border px-3 py-2 font-mono text-[10px] font-black uppercase tracking-wider ${filter === value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:border-primary hover:text-primary"}`}>
              {label}
            </button>
          ))}
        </div>}
        {tab === "daily" && <>
          <p className="mt-4 border-l-2 border-amber-500 pl-3 text-xs leading-5 text-muted-foreground">Source: MTGGoldfish Star Trek paper Daily Change page, read November 7, 2026. The page has no separate as-of timestamp; these are not independently checked completed sales or buylist prices.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {starTrekDailyMovers.map(signal => <WatchCard key={signal.id} signal={signal} />)}
          </div>
        </>}
        {tab === "watch" && <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map(signal => <WatchCard key={signal.id} signal={signal} />)}
        </div>}
        {tab === "history" && <StarTrekPriceHistoryPanel />}
        <p className="mt-5 border-l-2 border-amber-500 pl-3 text-xs leading-5 text-muted-foreground">
          Buying posture: avoid chasing thin pre-release moves. Recheck completed sales, EDHREC adoption, and listing depth 3–7 days after the November 13 release. The earlier editorial watch keeps its own source dates; the Scryfall basket is not a sealed-deck valuation or financial advice.
        </p>
      </div>
    </section>
  );
}
