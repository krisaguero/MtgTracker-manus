/* Design reminder: hard-edged editorial market publishing workspace; presents Daily Top 5 mover posts with rigorous movement explanations and weekly prediction-performance roundups. */
import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { Bell, BellRing, Clock, ExternalLink, Flame } from 'lucide-react';
import { getDailyMoverPost, getWeeklyPredictionRoundup } from '@/lib/dailyPostEngine';
import { isPriceAlertTriggered, loadPriceAlerts, refreshPriceAlerts, removePriceAlert, savePriceAlert, type PriceAlert } from '@/lib/priceAlerts';

export function DailyPost() {
  const dailyPost = getDailyMoverPost();
  const weeklyRoundup = getWeeklyPredictionRoundup();
  const [alerts, setAlerts] = useState<PriceAlert[]>(() => loadPriceAlerts());

  useEffect(() => {
    setAlerts(refreshPriceAlerts(dailyPost.topMovers.map((mover) => ({ cardName: mover.cardName, currentUsd: mover.currentUsd }))));
  }, [dailyPost.topMovers]);

  function togglePriceAlert(mover: (typeof dailyPost.topMovers)[number]) {
    const existing = alerts.find((alert) => alert.cardName.toLowerCase() === mover.cardName.toLowerCase());
    if (existing) {
      removePriceAlert(mover.cardName);
      setAlerts((current) => current.filter((alert) => alert.cardName.toLowerCase() !== mover.cardName.toLowerCase()));
      return;
    }
    const next = savePriceAlert({
      cardName: mover.cardName,
      setCode: mover.setCode,
      thresholdPercent: 10,
      baselinePrice: mover.currentUsd,
      lastPrice: mover.currentUsd,
    });
    setAlerts((current) => [...current.filter((alert) => alert.cardName.toLowerCase() !== mover.cardName.toLowerCase()), next]);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/movers" className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-primary hover:underline">
            ← Back to Daily Movers Hub
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/market-report" className="border border-border bg-card px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground hover:border-primary hover:text-primary">
              Market Report
            </Link>
            <Link href="/" className="border border-border bg-primary px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-primary-foreground hover:bg-primary/90">
              Recent Sets
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        {/* Daily Post Header */}
        <div className="border-b-2 border-primary pb-6 sm:pb-8">
          <div className="flex flex-wrap items-center gap-3 font-mono text-xs font-bold uppercase tracking-[0.2em] text-primary">
            <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> Daily Editorial Brief</span>
            <span>·</span>
            <span>{dailyPost.date}</span>
          </div>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">{dailyPost.title}</h1>
          <p className="mt-3 text-base text-muted-foreground sm:text-lg leading-relaxed">{dailyPost.subtitle}</p>
        </div>

        {/* Top 5 Daily Movers Section */}
        <section className="mt-10 sm:mt-14" aria-labelledby="top5-heading">
          <div className="border-b border-border pb-4">
            <p className="font-mono text-xs font-bold uppercase tracking-widest text-primary">High-Velocity Selection</p>
            <h2 id="top5-heading" className="text-2xl font-bold tracking-tight sm:text-3xl">Today's Top 5 Movers &amp; Movement Theses</h2>
          </div>

          <div className="mt-6 space-y-6">
            {dailyPost.topMovers.map((mover) => (
              <div key={mover.rank} className="border-2 border-border bg-card p-6 transition-colors hover:border-primary">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-primary bg-primary font-mono text-base font-extrabold text-primary-foreground">
                      #{mover.rank}
                    </span>
                    <div>
                      <span className="border border-border bg-muted px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {mover.driverCategory}
                      </span>
                      <h3 className="mt-1 text-xl font-bold">{mover.cardName}</h3>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-3">
                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Current Price</p>
                      <p className="text-lg font-extrabold text-primary">${mover.currentUsd.toFixed(2)}</p>
                    </div>
                    <span className="flex items-center gap-1 border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      <Flame className="h-4 w-4" /> +{mover.percentChange}%
                    </span>
                    {(() => {
                      const alert = alerts.find((item) => item.cardName.toLowerCase() === mover.cardName.toLowerCase());
                      const triggered = alert ? alert.triggered || isPriceAlertTriggered(alert, mover.currentUsd) : false;
                      return <button type="button" onClick={() => togglePriceAlert(mover)} aria-pressed={Boolean(alert)} aria-label={alert ? `Stop tracking ${mover.cardName}` : `Track ${mover.cardName} with a 10 percent price alert`} className={`inline-flex items-center gap-2 border px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors ${triggered ? 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300' : alert ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background text-muted-foreground hover:border-primary hover:text-primary'}`}>
                        {triggered ? <BellRing className="h-3.5 w-3.5" /> : <Bell className="h-3.5 w-3.5" />}
                        {triggered ? 'Alert hit' : alert ? 'Tracking +10%' : 'Track +10%'}
                      </button>;
                    })()}
                  </div>
                </div>

                <div className="mt-5 border-l-2 border-primary bg-muted/40 p-4">
                  <p className="font-mono text-xs font-bold uppercase tracking-wider text-primary">Why is it moving?</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{mover.movementThesis}</p>
                </div>

                <div className="mt-4 flex justify-end">
                  <a
                    href={`https://scryfall.com/search?q=${encodeURIComponent(mover.cardName)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-mono text-xs font-bold text-primary hover:underline"
                  >
                    View Scryfall pricing &amp; printings <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 border-2 border-border bg-card p-6">
            <p className="font-mono text-xs font-bold uppercase tracking-wider text-primary">Daily Market Takeaway</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">{dailyPost.marketTakeaway}</p>
          </div>
        </section>

        {/* Weekly Roundup & Prediction Performance Section */}
        <section className="mt-16 sm:mt-24 border-t-2 border-primary pt-12" aria-labelledby="roundup-heading">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between border-b border-border pb-5">
            <div>
              <span className="border border-primary/30 bg-primary/10 px-2.5 py-1 font-mono text-xs font-bold uppercase tracking-wider text-primary">
                Weekly Performance Ledger
              </span>
              <h2 id="roundup-heading" className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">Weekly Roundup &amp; Prediction Evaluation</h2>
            </div>
            <div className="border border-border bg-card px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider">
              Prediction Accuracy: <span className="text-emerald-600 dark:text-emerald-400">{weeklyRoundup.accuracyRate}%</span>
            </div>
          </div>

          <p className="mt-4 text-sm text-muted-foreground sm:text-base leading-relaxed">
            {weeklyRoundup.summary} ({weeklyRoundup.weekLabel}). Below is an audited review of whether our prior market calls moved as expected, stalled, or reversed.
          </p>

          <div className="mt-8 space-y-4">
            {weeklyRoundup.predictions.map((pred) => {
              const isMoved = pred.status === 'Moved as Predicted';
              const isStalled = pred.status === 'Stalled / Rangebound';
              return (
                <div key={pred.id} className="border-2 border-border bg-card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold uppercase text-muted-foreground">{pred.predictedDate}</span>
                        <span className={`border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${
                          isMoved ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                          isStalled ? 'border-border bg-muted text-muted-foreground' :
                          'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        }`}>
                          {pred.status}
                        </span>
                      </div>
                      <h3 className="mt-2 text-xl font-bold">{pred.cardName}</h3>
                    </div>
                    <div className="flex items-center gap-4 text-right font-mono text-xs">
                      <div>
                        <p className="text-muted-foreground uppercase text-[10px]">Initial</p>
                        <p className="font-bold">${pred.initialPrice.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground uppercase text-[10px]">Current</p>
                        <p className="font-extrabold text-primary">${pred.currentPrice.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 border-t border-border pt-4 text-xs">
                    <div>
                      <p className="font-mono font-bold uppercase tracking-wider text-muted-foreground">Original Prediction</p>
                      <p className="mt-1 font-medium text-foreground">{pred.originalPrediction}</p>
                    </div>
                    <div>
                      <p className="font-mono font-bold uppercase tracking-wider text-primary">Realized Outcome</p>
                      <p className="mt-1 font-medium text-muted-foreground">{pred.outcomeNotes}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
