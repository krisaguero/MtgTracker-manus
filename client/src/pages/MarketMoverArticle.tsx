import {
  ArrowLeft,
  ExternalLink,
  Flame,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Link, useParams } from "wouter";
import { MarketPostCard } from "@/components/MarketPostCard";
import { canonicalMarketRows } from "@/lib/canonicalMarketEngine";
import { linkedMarketMover, moverSlug } from "@/lib/marketMoverLinks";

function formatSnapshotDate(value: string) {
  return value ? value.slice(0, 10) : "date unavailable";
}

export default function MarketMoverArticle() {
  const { moverSlug: slug } = useParams<{ moverSlug: string }>();
  const row = canonicalMarketRows.find(
    candidate => moverSlug(candidate.name) === slug
  );
  const mover = row ? linkedMarketMover(row) : null;
  if (!mover)
    return (
      <div className="min-h-screen bg-background text-foreground">
        <main className="mx-auto max-w-3xl px-4 py-12 sm:px-8">
          <Link
            href="/market-watch"
            className="inline-flex items-center gap-2 font-mono text-xs uppercase text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" /> Back to source-dated Market Watch
          </Link>
          <section className="mt-8 border-2 border-border bg-card p-8 text-center">
            <h1 className="text-2xl font-bold">Dated mover row unavailable</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              This card is not present in the current source-dated snapshot. No
              replacement price or movement is generated.
            </p>
          </section>
        </main>
      </div>
    );

  const isUp = mover.trend === "up";
  const formattedChange = `${isUp ? "+" : ""}${mover.percentChange.toFixed(1)}%`;
  const snapshotDate = formatSnapshotDate(mover.lastUpdated);
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <header className="border-b-2 border-border bg-card px-4 py-4 sm:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <Link
            href="/movers"
            className="inline-flex items-center gap-2 border-2 border-border bg-muted px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider hover:border-primary"
          >
            <ArrowLeft className="h-4 w-4" /> Dated mover snapshots
          </Link>
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-primary">
            Source-dated mover · {snapshotDate}
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-8">
        <article className="border-2 border-primary/40 bg-card p-6 sm:p-10">
          <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-wider text-primary">
            <Flame className="h-4 w-4" /> {mover.category} ·{" "}
            {mover.setCode.toUpperCase()} · {snapshotDate}
          </div>
          <h1 className="mt-4 max-w-3xl text-3xl font-extrabold tracking-tight sm:text-5xl">
            {mover.name}: a dated market snapshot
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground">
            {mover.reason}
          </p>
          <div className="mt-8">
            <MarketPostCard
              name={mover.name}
              setCode={mover.setCode}
              sourceDate={snapshotDate}
              kicker={`${mover.category} · source-dated snapshot`}
            >
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="border border-border bg-background p-4">
                  <p className="font-mono text-[10px] uppercase text-muted-foreground">
                    Source price · as of {snapshotDate}
                  </p>
                  <p className="mt-2 text-2xl font-black text-primary">
                    ${mover.price.toFixed(2)}
                  </p>
                </div>
                <div className="border border-border bg-background p-4">
                  <p className="font-mono text-[10px] uppercase text-muted-foreground">
                    Source snapshot change
                  </p>
                  <p
                    className={`mt-2 flex items-center gap-2 text-2xl font-black ${isUp ? "text-emerald-500" : "text-rose-500"}`}
                  >
                    {isUp ? (
                      <TrendingUp className="h-5 w-5" />
                    ) : (
                      <TrendingDown className="h-5 w-5" />
                    )}{" "}
                    {formattedChange}
                  </p>
                </div>
                <div className="border border-border bg-background p-4">
                  <p className="font-mono text-[10px] uppercase text-muted-foreground">
                    Price data source · coverage
                  </p>
                  <p className="mt-2 text-sm font-bold">
                    {mover.priceSource} · {mover.sourceCount} quote(s)
                  </p>
                </div>
              </div>
            </MarketPostCard>
          </div>
        </article>
        <section className="grid gap-4 sm:grid-cols-2">
          <Link
            href={mover.cardHref}
            className="border-2 border-border bg-card p-5 transition-colors hover:border-primary"
          >
            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-primary">
              Research the card
            </p>
            <p className="mt-2 text-lg font-bold">Open card profile</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Review printings and source-dated price references.
            </p>
          </Link>
          <Link
            href={mover.setHref}
            className="border-2 border-border bg-card p-5 transition-colors hover:border-primary"
          >
            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-primary">
              Research the set
            </p>
            <p className="mt-2 text-lg font-bold">Open {mover.setName}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              See the set catalog and other dated watch signals.
            </p>
          </Link>
        </section>
        <section className="border-2 border-border bg-card p-6 sm:p-8">
          <h2 className="text-xl font-bold">How to read this signal</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            This row is from the {snapshotDate} MTGJSON market snapshot and is
            not a live quote. The quote count does not establish listing depth
            or completed-sale volume. Verify the exact printing, condition,
            current listings, and fees before making a purchase decision.
          </p>
          <a
            href="https://mtgjson.com/downloads/all-files/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 border-2 border-border bg-background px-3 py-2 font-mono text-xs font-bold uppercase hover:border-primary"
          >
            Verify source at MTGJSON <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </section>
      </main>
    </div>
  );
}
