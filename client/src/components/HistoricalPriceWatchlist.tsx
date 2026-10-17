import React from 'react';
import type { HistoricalPriceWatchSignal } from '@/data/historicalMarketWatchSignals';

type HistoricalPriceWatchlistProps = {
  title: string;
  intro: string;
  signals: HistoricalPriceWatchSignal[];
};

export function HistoricalPriceWatchlist({ title, intro, signals }: HistoricalPriceWatchlistProps) {
  return (
    <section className="mb-10" aria-label={title} data-testid="historical-price-watchlist">
      <div className="mb-4 border-l-4 border-primary bg-primary/5 p-4">
        <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-primary">High-profile watchers · historical price signals</p>
        <h2 className="mt-2 text-2xl font-black tracking-tight">{title}</h2>
        <p className="mt-2 max-w-5xl text-sm leading-6 text-muted-foreground">{intro}</p>
        <p className="mt-2 max-w-5xl text-xs leading-5 text-muted-foreground">Signals are selected from the source report, not ranked by percentage return; measurement windows are not comparable. “Confirmed,” “Developing,” and similar labels are the original report’s confidence language, not independent verification or a current price signal.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {signals.map((signal, index) => (
          <article key={`${signal.reportDate}-${signal.card}-${signal.printing}`} className="border border-border bg-card p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="border border-primary/40 bg-primary/5 px-2 py-1 font-mono text-[9px] font-black uppercase tracking-wider text-primary">High-profile watcher · historical</span>
              <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Report date: {signal.reportDate}</span>
            </div>
            <h3 className="mt-3 text-xl font-black">{index + 1}. {signal.card}</h3>
            <p className="mt-1 text-xs leading-5 text-muted-foreground"><strong className="text-foreground">Printing:</strong> {signal.printing}</p>
            <dl className="mt-4 grid gap-3 text-xs leading-5 sm:grid-cols-2">
              <div><dt className="font-mono text-[9px] font-black uppercase tracking-wider text-muted-foreground">Measurement window</dt><dd className="mt-1">{signal.measurementWindow}</dd></div>
              <div><dt className="font-mono text-[9px] font-black uppercase tracking-wider text-muted-foreground">Reported price</dt><dd className="mt-1">{signal.reportedPrice}</dd></div>
              <div><dt className="font-mono text-[9px] font-black uppercase tracking-wider text-muted-foreground">Reported move</dt><dd className="mt-1">{signal.reportedMove}</dd></div>
              <div><dt className="font-mono text-[9px] font-black uppercase tracking-wider text-muted-foreground">Source-reported confidence</dt><dd className="mt-1">{signal.sourceConfidence}</dd></div>
              <div className="sm:col-span-2"><dt className="font-mono text-[9px] font-black uppercase tracking-wider text-muted-foreground">Catalyst</dt><dd className="mt-1">{signal.catalyst}</dd></div>
              <div className="sm:col-span-2"><dt className="font-mono text-[9px] font-black uppercase tracking-wider text-muted-foreground">Risk</dt><dd className="mt-1">{signal.risk}</dd></div>
              <div className="sm:col-span-2"><dt className="font-mono text-[9px] font-black uppercase tracking-wider text-muted-foreground">Verification status</dt><dd className="mt-1">{signal.verificationStatus}</dd></div>
            </dl>
            <div className="mt-4 border-t border-border pt-3">
              <p className="font-mono text-[9px] font-black uppercase tracking-wider text-muted-foreground">Source links</p>
              <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs">
                {signal.sources.map((source) => <li key={`${source.label}-${source.url}`}><a href={source.url} target="_blank" rel="noopener noreferrer" className="break-words text-primary underline underline-offset-2 hover:opacity-80">{source.label}</a></li>)}
              </ul>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
