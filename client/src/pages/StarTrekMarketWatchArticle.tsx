import { ArrowLeft, CalendarDays, ShieldAlert, TrendingDown, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { starTrekDailyMovers, starTrekProductWatch } from "@/data/starTrekMarketWatch";
import { MarketMoverCardArt } from "@/components/MarketMoverCardArt";
import React from "react";

const snapshotCards = [...starTrekDailyMovers].sort((a, b) => Math.abs(b.moveUsd ?? 0) - Math.abs(a.moveUsd ?? 0));

export function StarTrekMarketWatchArticle() {
  const gains = snapshotCards.filter(card => (card.moveUsd ?? 0) > 0);
  const declines = snapshotCards.filter(card => (card.moveUsd ?? 0) < 0);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b-2 border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8">
          <Link href="/market-reports" className="inline-flex items-center gap-2 font-mono text-xs font-black uppercase tracking-widest text-primary hover:underline"><ArrowLeft className="h-4 w-4" /> Chronological market hub</Link>
          <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="inline-flex items-center gap-2 font-mono text-xs font-black uppercase tracking-[0.2em] text-primary"><CalendarDays className="h-4 w-4" /> November 7, 2026 · Star Trek release watch</p>
              <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl">Star Trek before launch: early movers, wide swings</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">A short read on the Star Trek market-watch page: what moved in the latest snapshot, what is still only a signal, and why release-week prices need room to settle.</p>
            </div>
            <span className="border border-amber-600/50 bg-amber-500/10 px-3 py-2 font-mono text-[10px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-200">Pre-release · high volatility</span>
          </div>
          <p className="mt-5 max-w-4xl text-sm leading-6 text-muted-foreground"><strong className="text-foreground">Product timing:</strong> prerelease events run Nov. 6–12; tabletop release is Nov. 13. Commander deck MSRP is ${starTrekProductWatch.commanderDeckMsrp.toFixed(2)}, and Collector’s Edition Commander deck MSRP is ${starTrekProductWatch.collectorsEditionMsrp.toFixed(2)}.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <a href="/market-watch#star-trek-market-watch-heading" className="inline-flex min-h-10 items-center border-2 border-primary bg-primary px-4 py-2 font-mono text-[10px] font-black uppercase tracking-wider text-primary-foreground hover:opacity-90">Open Star Trek watch panel</a>
            <Link href="/market-report/november-06-30-signal-brief" className="inline-flex min-h-10 items-center border-2 border-border bg-background px-4 py-2 font-mono text-[10px] font-black uppercase tracking-wider hover:border-primary">Nov. 6 full movers brief</Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-8">
        <section className="border-l-4 border-amber-500 bg-amber-500/5 p-4 sm:p-5" role="note" aria-label="Snapshot caveat">
          <p className="flex items-start gap-2 font-mono text-xs font-black uppercase tracking-wider text-amber-800 dark:text-amber-200"><ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" /> One marketplace snapshot is not a sales tape</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">The figures below are the live MTGGoldfish “Daily Change” page checked on Nov. 7, 2026. That page does not show a separate as-of timestamp here, and this is not independent completed-sale or buylist verification. Treat the large percentage moves—especially on low-priced cards—as volatility prompts, not proof of durable demand.</p>
        </section>

        <section className="grid gap-5 md:grid-cols-2" aria-label="All Nov. 7 Star Trek daily movers">
          <MoverColumn title="Reported gains" cards={gains} />
          <MoverColumn title="Reported declines" cards={declines} />
        </section>

        <section className="border-2 border-primary/30 bg-primary/5 p-5 sm:p-7">
          <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-primary">What to watch next</p>
          <h2 className="mt-2 text-2xl font-black">The release is the next real test.</h2>
          <div className="mt-4 grid gap-4 text-sm leading-6 text-muted-foreground md:grid-cols-3">
            <p className="border-l-2 border-primary pl-3"><strong className="text-foreground">Supply arrives Nov. 13.</strong> Early listings can reprice quickly once more product reaches players and stores.</p>
            <p className="border-l-2 border-primary pl-3"><strong className="text-foreground">Check singles, not just decks.</strong> Official product lists give four precons, but this watch does not verify sealed-deck quotes. The price basket is not sealed value.</p>
            <p className="border-l-2 border-primary pl-3"><strong className="text-foreground">Wait for depth.</strong> Recheck completed sales, listing depth, and real Commander adoption after release before calling a floor or trend.</p>
          </div>
          <p className="mt-5 border-t border-primary/20 pt-4 text-xs leading-5 text-muted-foreground">The supplied Nov. 6 daily brief also flags the Star Trek prerelease window as the main near-term attention and supply catalyst. Its broader movers—such as Nethergoyf and Gandalf, White Rider—are separate signals, not evidence that Star Trek cards share the same demand drivers.</p>
        </section>

        <section className="flex flex-wrap gap-3 border-t border-border pt-5 text-xs leading-5 text-muted-foreground" aria-label="Sources">
          <p><strong className="text-foreground">Sources:</strong> <a className="text-primary underline" href={starTrekProductWatch.officialSource} target="_blank" rel="noopener noreferrer">Wizards’ Commander decklists</a> · <a className="text-primary underline" href={starTrekProductWatch.collectingSource} target="_blank" rel="noopener noreferrer">Wizards’ collecting guide</a> · <a className="text-primary underline" href="https://www.mtggoldfish.com/movers/paper/trk" target="_blank" rel="noopener noreferrer">MTGGoldfish Star Trek daily movers</a> · <a className="text-primary underline" href="https://www.tcgplayer.com/content/article/The-Biggest-Price-Spikes-in-Magic-The-Gathering-This-Week-11-05-2026/72b80c89-e8f8-4b1c-853c-3f0023677f11/" target="_blank" rel="noopener noreferrer">TCGplayer Nov. 5 weekly movers</a>.</p>
        </section>
      </main>
    </div>
  );
}

function MoverColumn({ title, cards }: { title: string; cards: typeof snapshotCards }) {
  return (
    <section className="border-2 border-border bg-card p-4 sm:p-5">
      <h2 className="border-b border-border pb-3 font-mono text-xs font-black uppercase tracking-widest text-primary">{title}</h2>
      <ol className="mt-3 divide-y divide-border">
        {cards.map(card => {
          const up = (card.moveUsd ?? 0) > 0;
          return (
            <li key={card.id} className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 py-3 sm:grid-cols-[auto_minmax(0,1fr)_auto]">
              <MarketMoverCardArt name={card.name} setCode={card.setCode} collectorNumber={card.collectorNumber} />
              <div className="min-w-0"><p className="font-bold">{card.name}</p><p className="mt-1 font-mono text-[10px] uppercase text-muted-foreground">TRK · #{card.collectorNumber} · ${card.priceUsd?.toFixed(2)}</p></div>
              <p className={`col-start-2 inline-flex items-center gap-1 font-mono text-xs font-black sm:col-start-auto ${up ? "text-emerald-700 dark:text-emerald-400" : "text-destructive"}`}>{up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}{card.moveLabel}</p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export default StarTrekMarketWatchArticle;
