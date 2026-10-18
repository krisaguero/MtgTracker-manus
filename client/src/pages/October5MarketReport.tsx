import React from 'react';
import { ArrowLeft, CalendarDays, ShieldAlert } from 'lucide-react';
import { MarketPostMarkdown } from '@/components/MarketPostMarkdown';
import { Link } from 'wouter';
import { HistoricalPriceWatchlist } from '@/components/HistoricalPriceWatchlist';
import { october5WatchSignals } from '@/data/historicalMarketWatchSignals';
import sourceReport from '@/data/marketBriefs/2026-10-05-daily-mtg-market-movers.md?raw';

const reportBody = sourceReport.replace(/(?:^|\n)# Daily MTG Market Movers Report\s*\n/, '\n');

const enhancedBody = reportBody
  .replace('## 1. High-Value Price Signals (historical source claims)', '```mtg-card\n{"name":"Ink-Treader Nephilim"}\n```\n\n## 1. High-Value Price Signals (historical source claims)')
  .replace('## 3. Commander Format Staples', '```mtg-card\n{"name":"Ganax, Astral Hunter"}\n```\n\n## 3. Commander Format Staples')
  .replace('## 6. Standard Breakout Candidates', '```mtg-card\n{"name":"Raffine, Scheming Seer"}\n```\n\n## 6. Standard Breakout Candidates');


export function October5MarketReport() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b-2 border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8">
          <Link href="/market-reports" className="inline-flex items-center gap-2 font-mono text-xs font-black uppercase tracking-widest text-primary hover:underline">
            <ArrowLeft className="h-4 w-4" /> Dated report archive
          </Link>
          <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="inline-flex items-center gap-2 font-mono text-xs font-black uppercase tracking-[0.2em] text-primary"><CalendarDays className="h-4 w-4" /> October 5, 2026 · historical report</p>
              <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl">Daily MTG Market Movers Report</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">Approximate data window: September 19–October 1, 2026. This archived report is not a current price feed.</p>
            </div>
            <span className="border border-amber-600/50 bg-amber-500/10 px-3 py-2 font-mono text-[10px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-200">Historical · not live</span>
          </div>
          <div className="mt-5 border-l-4 border-amber-500 bg-amber-500/5 p-4" role="note" aria-label="Historical report interpretation">
            <p className="flex items-start gap-2 font-mono text-xs font-black uppercase tracking-wider text-amber-800 dark:text-amber-200"><ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" /> Historical reported signals—not verified daily movers</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">The report states that exact prior-day prices and 24-hour moves are often unverified or multi-day. Its ten category sections preserve the source's historical price, interest, format, spoiler, and metagame signals; repeated cards are cross-category mentions, not unique-card counts. Confidence labels and source citations are retained as reported, not independently re-verified, and no old price is presented as current.</p>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/market-report/october-11-daily-market-movers" className="inline-flex min-h-10 items-center border border-border bg-background px-3 py-2 font-mono text-[10px] font-black uppercase tracking-wider hover:border-primary">Separate report · October 11</Link>
            <Link href="/market-report/october-15-30-signal-brief" className="inline-flex min-h-10 items-center border border-border bg-background px-3 py-2 font-mono text-[10px] font-black uppercase tracking-wider hover:border-primary">Separate report · October 15</Link>
            <Link href="/market-watch#source-market-watch-heading" className="inline-flex min-h-10 items-center border border-border bg-background px-3 py-2 font-mono text-[10px] font-black uppercase tracking-wider hover:border-primary">Separate snapshot · October 16</Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
        <HistoricalPriceWatchlist
          title="Top 10 cards to watch"
          intro="These ten high-profile historical price signals follow the October 5 report's first two price-focused categories. The source windows vary, and some cited weekly articles predate the report's approximate September 19–October 1 data window; each card shows its own stated window and evidence status. This is not a current-price ranking."
          signals={october5WatchSignals}
        />
        <October5MarketReportBody />
      </main>
    </div>
  );
}

export function October5MarketReportBody() {
  return (
    <article className="prose prose-neutral max-w-none break-words dark:prose-invert prose-headings:tracking-tight prose-a:text-primary prose-strong:text-foreground prose-li:my-1 prose-blockquote:border-primary prose-blockquote:text-muted-foreground">
      <MarketPostMarkdown body={enhancedBody} sourceDate="2026-10-05" />
    </article>
  );
}
