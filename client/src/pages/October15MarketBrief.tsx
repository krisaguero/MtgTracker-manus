import React from 'react';
import { ArrowLeft, CalendarDays, ShieldAlert } from 'lucide-react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Link } from 'wouter';
import sourceBrief from '@/data/marketBriefs/2026-10-15-daily-mtg-market-movers.md?raw';

const reportBody = sourceBrief.replace(/^# Daily MTG Market Movers — 30-Signal Brief\s*/, '');

const markdownComponents: Components = {
  a: ({ href, children, node: _node, ...props }) => (
    <a
      {...props}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="break-words text-primary underline underline-offset-2 hover:opacity-80"
    >
      {children}
    </a>
  ),
};

export function October15MarketBrief() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b-2 border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8">
          <Link href="/market-reports" className="inline-flex items-center gap-2 font-mono text-xs font-black uppercase tracking-widest text-primary hover:underline">
            <ArrowLeft className="h-4 w-4" /> Dated report archive
          </Link>
          <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="inline-flex items-center gap-2 font-mono text-xs font-black uppercase tracking-[0.2em] text-primary">
                <CalendarDays className="h-4 w-4" /> October 15, 2026 · separate research brief
              </p>
              <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl">Daily MTG Market Movers — 30-Signal Brief</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">30-signal catalyst and metagame research brief—not 30 verified price movers.</p>
            </div>
            <span className="border border-amber-600/50 bg-amber-500/10 px-3 py-2 font-mono text-[10px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-200">Historical · prices unverified</span>
          </div>
          <p className="mt-5 max-w-4xl text-sm leading-6 text-muted-foreground"><strong className="text-foreground">Data window:</strong> October 14 prior-day context plus the most recent tournament and policy signals available to the report author.</p>
          <div className="mt-5 border-l-4 border-amber-500 bg-amber-500/5 p-4" role="note" aria-label="Important price-verification limitation">
            <p className="flex items-start gap-2 font-mono text-xs font-black uppercase tracking-wider text-amber-800 dark:text-amber-200"><ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" /> Read as a signal brief, not a verified price-mover report</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">The source states that it could not independently verify a complete prior-day card-price feed, completed sales, or a 21-day price history. Its competitive and policy catalysts are distinct from price confirmation; entries marked unverified remain unverified. Do not treat this archive as a current quote or as 30 verified price movers.</p>
          </div>
          <Link href="/market-watch#source-market-watch-heading" className="mt-5 inline-flex min-h-10 items-center border-2 border-border bg-background px-4 py-2 font-mono text-[10px] font-black uppercase tracking-wider hover:border-primary">
            October 16 Notion source snapshot · separate report
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
        <October15MarketBriefBody />
      </main>
    </div>
  );
}

export function October15MarketBriefBody() {
  return (
    <article className="prose prose-neutral max-w-none break-words dark:prose-invert prose-headings:tracking-tight prose-a:text-primary prose-strong:text-foreground prose-li:my-1 prose-blockquote:border-primary prose-blockquote:text-muted-foreground">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{reportBody}</ReactMarkdown>
    </article>
  );
}
