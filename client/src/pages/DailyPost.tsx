import { Clock, ExternalLink, Flame, ShieldAlert, TrendingUp } from 'lucide-react';
import { Link } from 'wouter';
import { MarketCardPreview } from '@/components/MarketCardPreview';
import { getDailyMoverPost, getWeeklyPredictionRoundup } from '@/lib/dailyPostEngine';

export function DailyPost() {
  const dailyPost = getDailyMoverPost();
  const weeklyRoundup = getWeeklyPredictionRoundup();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/movers" className="font-mono text-xs font-bold uppercase tracking-widest text-primary hover:underline">← Daily Movers Hub</Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/market-articles" className="border border-border bg-card px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:border-primary hover:text-primary">Market Deep Dives</Link>
            <Link href="/spoiler-calendar" className="border border-border bg-primary px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-primary-foreground hover:bg-primary/90">Release Desk</Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-10 px-4 py-8 sm:px-6 sm:py-12">
        <section className="relative overflow-hidden border-2 border-primary/50 bg-gradient-to-br from-primary/10 via-card to-amber-500/5 p-5 sm:p-9">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] opacity-10 [background-size:18px_18px]" />
          <div className="relative max-w-4xl">
            <p className="flex flex-wrap items-center gap-2 font-mono text-xs font-black uppercase tracking-[0.18em] text-primary"><Clock className="h-4 w-4" /> {dailyPost.date} <span className="text-muted-foreground">·</span> Editorial layout demo</p>
            <h1 className="mt-4 text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">{dailyPost.title}</h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">{dailyPost.subtitle}</p>
            <div role="note" className="mt-6 flex items-start gap-3 border-2 border-amber-500/60 bg-amber-500/10 p-4 sm:p-5">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-300" />
              <div><p className="font-mono text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-300">Sample data · not a live market report</p><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Prices, percentage changes, explanations, and the weekly score below are fixed demonstration content. They are not current quotes or audited market outcomes. Price alerts are intentionally unavailable until this page is connected to a dated, verified price feed.</p></div>
            </div>
          </div>
        </section>

        <section aria-labelledby="top5-heading">
          <div className="flex flex-col gap-3 border-b-2 border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="font-mono text-xs font-black uppercase tracking-widest text-primary">Illustrative examples</p><h2 id="top5-heading" className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Five market-movement scenarios</h2></div>
            <span className="inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase text-muted-foreground"><Flame className="h-4 w-4 text-amber-500" /> Not ranked from current activity</span>
          </div>
          <div className="mt-5 space-y-4">
            {dailyPost.topMovers.map(mover => (
              <article key={mover.rank} className="grid gap-5 border-2 border-border bg-card p-4 transition-colors hover:border-primary sm:p-5 lg:grid-cols-[128px_minmax(0,1fr)]">
                <div className="flex justify-center lg:justify-start"><MarketCardPreview name={mover.cardName} setCode={mover.setCode} size="md" /></div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center border-2 border-primary bg-primary font-mono font-black text-primary-foreground">#{mover.rank}</span><div><span className="border border-border bg-muted px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{mover.driverCategory}</span><h3 className="mt-2 text-xl font-black leading-tight sm:text-2xl">{mover.cardName}</h3></div></div>
                    <div className="flex flex-wrap gap-2 font-mono">
                      <div className="border border-border bg-background px-3 py-2"><span className="block text-[9px] font-bold uppercase text-muted-foreground">Sample price · not live</span><strong className="mt-1 block text-lg">${mover.currentUsd.toFixed(2)}</strong></div>
                      <div className="border border-amber-500/50 bg-amber-500/5 px-3 py-2"><span className="block text-[9px] font-bold uppercase text-amber-700 dark:text-amber-300">Sample move</span><strong className="mt-1 flex items-center gap-1 text-lg text-amber-700 dark:text-amber-300"><TrendingUp className="h-4 w-4" /> +{mover.percentChange}%</strong></div>
                    </div>
                  </div>
                  <div className="mt-4 border-l-4 border-primary bg-muted/40 p-4">
                    <p className="font-mono text-[10px] font-black uppercase tracking-wider text-primary">Illustrative hypothesis · not observed in a live scan</p>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">{mover.movementThesis}</p>
                  </div>
                  <a href={`https://scryfall.com/search?q=${encodeURIComponent(mover.cardName)}`} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase text-primary hover:underline">Verify the card and printings on Scryfall <ExternalLink className="h-3 w-3" /></a>
                </div>
              </article>
            ))}
          </div>
          <div className="mt-5 border-2 border-border bg-card p-5 sm:p-6"><p className="font-mono text-xs font-black uppercase tracking-wider text-primary">Illustrative takeaway</p><p className="mt-2 max-w-4xl text-sm leading-7 text-muted-foreground sm:text-base">{dailyPost.marketTakeaway}</p></div>
        </section>

        <section className="border-t-2 border-primary pt-8" aria-labelledby="roundup-heading">
          <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div><span className="border border-primary/30 bg-primary/10 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-primary">Demonstration data only</span><h2 id="roundup-heading" className="mt-3 text-3xl font-black tracking-tight">Sample prediction review</h2></div>
            <div className="border border-border bg-card px-4 py-2 font-mono text-xs font-bold uppercase">Measured accuracy: <span className="text-muted-foreground">{weeklyRoundup.accuracyRate == null ? 'Not measured' : 'Sample only'}</span></div>
          </div>
          <p className="mt-4 max-w-4xl text-sm leading-7 text-muted-foreground">{weeklyRoundup.summary} ({weeklyRoundup.weekLabel}). These records are retained only to demonstrate the visual review format.</p>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {weeklyRoundup.predictions.map(prediction => {
              const isMoved = prediction.status === 'Moved as Predicted';
              const isStalled = prediction.status === 'Stalled / Rangebound';
              return (
                <article key={prediction.id} className="grid gap-4 border-2 border-border bg-card p-4 sm:grid-cols-[80px_minmax(0,1fr)] sm:p-5">
                  <div className="flex justify-center sm:justify-start"><MarketCardPreview name={prediction.cardName} size="sm" /></div>
                  <div>
                    <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-mono text-[9px] font-bold uppercase text-muted-foreground">Sample date · {prediction.predictedDate}</p><span className={`mt-2 inline-block border px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-wider ${isMoved ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : isStalled ? 'border-border bg-muted text-muted-foreground' : 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300'}`}>Sample status · {prediction.status}</span><h3 className="mt-2 text-lg font-black">{prediction.cardName}</h3></div><div className="flex gap-2 font-mono text-[10px]"><div className="border border-border bg-background p-2"><span className="block uppercase text-muted-foreground">Sample initial</span><strong>${prediction.initialPrice.toFixed(2)}</strong></div><div className="border border-border bg-background p-2"><span className="block uppercase text-muted-foreground">Sample later</span><strong>${prediction.currentPrice.toFixed(2)}</strong></div></div></div>
                    <div className="mt-4 grid gap-3 border-t border-border pt-3 text-xs sm:grid-cols-2"><div><p className="font-mono font-bold uppercase tracking-wider text-muted-foreground">Illustrative prediction</p><p className="mt-1 leading-relaxed">{prediction.originalPrediction}</p></div><div><p className="font-mono font-bold uppercase tracking-wider text-primary">Illustrative outcome</p><p className="mt-1 leading-relaxed text-muted-foreground">{prediction.outcomeNotes}</p></div></div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <footer className="border-t border-border pt-5 text-xs leading-relaxed text-muted-foreground">Card images are retrieved from Scryfall for identification. Prices are estimates and not guaranteed. Magic card names and artwork are property of Wizards of the Coast; this independent fan content is not produced or endorsed by Wizards. For sourced historical reporting, open <Link href="/market-articles" className="font-bold text-primary hover:underline">Market Deep Dives</Link> and inspect each article’s snapshot date.</footer>
      </main>
    </div>
  );
}
