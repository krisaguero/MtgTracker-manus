import { ArrowLeft, ExternalLink, Flame, TrendingDown, TrendingUp } from 'lucide-react';
import { Link, useParams } from 'wouter';
import { canonicalMarketRows } from '@/lib/canonicalMarketEngine';
import { linkedMarketMover, moverSlug } from '@/lib/marketMoverLinks';

export default function MarketMoverArticle() {
  const { moverSlug: slug } = useParams<{ moverSlug: string }>();
  const row = canonicalMarketRows.find((candidate) => moverSlug(candidate.name) === slug);
  const mover = row ? linkedMarketMover(row) : null;

  if (!mover) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <main className="mx-auto max-w-3xl px-4 py-12 sm:px-8">
          <Link href="/latest-market-report" className="inline-flex items-center gap-2 font-mono text-xs uppercase text-primary hover:underline">
            <ArrowLeft className="h-4 w-4" /> Back to latest market report
          </Link>
          <section className="mt-8 border-2 border-border bg-card p-8 text-center">
            <h1 className="text-2xl font-bold">Mover post unavailable</h1>
            <p className="mt-2 text-sm text-muted-foreground">This card is not present in the current canonical market snapshot.</p>
          </section>
        </main>
      </div>
    );
  }

  const isUp = mover.trend === 'up';
  const formattedChange = `${isUp ? '+' : ''}${mover.percentChange.toFixed(1)}%`;
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <header className="border-b-2 border-border bg-card px-4 py-4 sm:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <Link href="/movers" className="inline-flex items-center gap-2 border-2 border-border bg-muted px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider hover:border-primary">
            <ArrowLeft className="h-4 w-4" /> Daily Movers
          </Link>
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-primary">Market mover post</span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-8">
        <article className="border-2 border-primary/40 bg-card p-6 sm:p-10">
          <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-wider text-primary">
            <Flame className="h-4 w-4" /> {mover.category} · {mover.setCode.toUpperCase()}
          </div>
          <h1 className="mt-4 max-w-3xl text-3xl font-extrabold tracking-tight sm:text-5xl">{mover.name}: why it is on today’s market watch</h1>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground">{mover.reason}</p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="border border-border bg-background p-4">
              <p className="font-mono text-[10px] uppercase text-muted-foreground">Indexed price</p>
              <p className="mt-2 text-2xl font-black text-primary">${mover.price.toFixed(2)}</p>
            </div>
            <div className="border border-border bg-background p-4">
              <p className="font-mono text-[10px] uppercase text-muted-foreground">Snapshot move</p>
              <p className={`mt-2 flex items-center gap-2 text-2xl font-black ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                {isUp ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />} {formattedChange}
              </p>
            </div>
            <div className="border border-border bg-background p-4">
              <p className="font-mono text-[10px] uppercase text-muted-foreground">Signal source</p>
              <p className="mt-2 text-sm font-bold">{mover.source}</p>
            </div>
          </div>
        </article>

        <section className="grid gap-4 sm:grid-cols-2">
          <Link href={mover.cardHref} className="border-2 border-border bg-card p-5 transition-colors hover:border-primary">
            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-primary">Research the card</p>
            <p className="mt-2 text-lg font-bold">Open card profile</p>
            <p className="mt-1 text-sm text-muted-foreground">Review printings, finance history, and Commander inclusions.</p>
          </Link>
          <Link href={mover.setHref} className="border-2 border-border bg-card p-5 transition-colors hover:border-primary">
            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-primary">Research the set</p>
            <p className="mt-2 text-lg font-bold">Open {mover.setName}</p>
            <p className="mt-1 text-sm text-muted-foreground">See the set catalog and any other hot-watch signals.</p>
          </Link>
        </section>

        <section className="border-2 border-border bg-card p-6 sm:p-8">
          <h2 className="text-xl font-bold">How to read this signal</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">This post is generated from the latest indexed market snapshot. It is a research aid, not a guarantee of future performance or a recommendation to buy or sell. Confirm live vendor listings, printing, condition, and fees before making a purchase decision.</p>
          <a href={`https://scryfall.com/search?q=${encodeURIComponent(mover.name)}`} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-2 border-2 border-border bg-background px-3 py-2 font-mono text-xs font-bold uppercase hover:border-primary">
            Verify on Scryfall <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </section>
      </main>
    </div>
  );
}
