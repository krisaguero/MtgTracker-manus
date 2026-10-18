import React from 'react';
import { ArrowLeft, CalendarDays, ShieldAlert } from 'lucide-react';
import { MarketPostMarkdown } from '@/components/MarketPostMarkdown';
import { Link } from 'wouter';
import { HistoricalPriceWatchlist } from '@/components/HistoricalPriceWatchlist';
import { october11WatchSignals } from '@/data/historicalMarketWatchSignals';
import sourceReport from '@/data/marketBriefs/2026-10-11-daily-mtg-market-movers.md?raw';

const reportBody = sourceReport.replace(/^# Daily MTG Market Movers Report\s*/, '');

const enhancedBody = reportBody
  .replace('## 1. Historical Price/Value Signals', '```mtg-card\n{"name":"Ink-Treader Nephilim"}\n```\n\n## 1. Historical Price/Value Signals')
  .replace('## 3. Commander Format Staples', '```mtg-card\n{"name":"Doom Prevails"}\n```\n\n## 3. Commander Format Staples')
  .replace('## 6. Standard Breakout Candidates', '```mtg-card\n{"name":"Basking Broodscale"}\n```\n\n## 6. Standard Breakout Candidates');


export function October11MarketReport() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b-2 border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8">
          <Link href="/market-reports" className="inline-flex items-center gap-2 font-mono text-xs font-black uppercase tracking-widest text-primary hover:underline">
            <ArrowLeft className="h-4 w-4" /> Dated report archive
          </Link>
          <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="inline-flex items-center gap-2 font-mono text-xs font-black uppercase tracking-[0.2em] text-primary"><CalendarDays className="h-4 w-4" /> October 11, 2026 · historical report</p>
              <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl">Daily MTG Market Movers Report</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">Data window: visible public price and Interests/Weekly Winners material through October 10, plus recent metagame and spoiler signals.</p>
            </div>
            <span className="border border-amber-600/50 bg-amber-500/10 px-3 py-2 font-mono text-[10px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-200">Historical · not live</span>
          </div>
          <p className="mt-4 max-w-4xl text-sm leading-6 text-muted-foreground"><strong className="text-foreground">Market status as reported:</strong> spoiler- and precon-driven, with thin-supply spikes and Commander/precon singles demand.</p>
          <div className="mt-5 border-l-4 border-amber-500 bg-amber-500/5 p-4" role="note" aria-label="Historical report interpretation">
            <p className="flex items-start gap-2 font-mono text-xs font-black uppercase tracking-wider text-amber-800 dark:text-amber-200"><ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" /> Historical signals—not a verified 250-mover feed</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">The source explicitly says browser-only access could not verify 250 distinct card-level prior-day movers. This report mixes historical price/interest observations with separate spoiler, format, and metagame catalysts; repeated names and category entries are not unique-printing counts. Price and move fields, dates, confidence, risks, and source citations are retained below, but historical or multi-day observations are not current quotes or verified 24-hour moves.</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Workflow references [1], [20], and [21] are identified as related workflow documents, not market evidence. Their prompt text and URLs are omitted; the other public citations remain linked.</p>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/market-report/october-05-daily-market-movers" className="inline-flex min-h-10 items-center border border-border bg-background px-3 py-2 font-mono text-[10px] font-black uppercase tracking-wider hover:border-primary">Separate report · October 5</Link>
            <Link href="/market-report/october-15-30-signal-brief" className="inline-flex min-h-10 items-center border border-border bg-background px-3 py-2 font-mono text-[10px] font-black uppercase tracking-wider hover:border-primary">Separate report · October 15</Link>
            <Link href="/market-watch#source-market-watch-heading" className="inline-flex min-h-10 items-center border border-border bg-background px-3 py-2 font-mono text-[10px] font-black uppercase tracking-wider hover:border-primary">Separate Notion snapshot · October 16</Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
        <HistoricalPriceWatchlist
          title="Top 8 cards to watch"
          intro="This report supports eight distinct historical price-movement watchers. Catalyst-only and metagame-only candidates are intentionally kept in the report below rather than used to pad the price list. The overall report is dated October 11 with source material through October 10; each card shows its own stated or unspecified measurement window."
          signals={october11WatchSignals}
        />
        <October11MarketReportBody />
      </main>
    </div>
  );
}

export function October11MarketReportBody() {
  return (
    <article className="prose prose-neutral max-w-none break-words dark:prose-invert prose-headings:tracking-tight prose-a:text-primary prose-strong:text-foreground prose-li:my-1 prose-blockquote:border-primary prose-blockquote:text-muted-foreground">
      <MarketPostMarkdown body={enhancedBody} sourceDate="2026-10-11" />
    </article>
  );
}
