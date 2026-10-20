import React from "react";
import { ArrowLeft, CalendarDays, ShieldAlert } from "lucide-react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Link } from "wouter";
import sourceBrief from "@/data/marketBriefs/2026-10-17-daily-mtg-market-movers.md?raw";

const reportBody = sourceBrief.replace(
  /^# Daily MTG Market Movers — 30-Signal Brief\s*/,
  ""
);
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

export function October17MarketBrief() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b-2 border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8">
          <Link
            href="/market-reports"
            className="inline-flex items-center gap-2 font-mono text-xs font-black uppercase tracking-widest text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" /> Dated report archive
          </Link>
          <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="inline-flex items-center gap-2 font-mono text-xs font-black uppercase tracking-[0.2em] text-primary">
                <CalendarDays className="h-4 w-4" /> October 17, 2026 · separate
                research brief
              </p>
              <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl">
                Daily MTG Market Movers — 30-Signal Brief
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
                A source-auditable catalyst and metagame brief—not a verified
                list of 30 card-level price movers.
              </p>
            </div>
            <span className="border border-amber-600/50 bg-amber-500/10 px-3 py-2 font-mono text-[10px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-200">
              Historical · prices unverified
            </span>
          </div>
          <p className="mt-5 max-w-4xl text-sm leading-6 text-muted-foreground">
            <strong className="text-foreground">Data window:</strong> October
            16, 2026 prior trading day.
          </p>
          <div
            className="mt-5 border-l-4 border-amber-500 bg-amber-500/5 p-4"
            role="note"
            aria-label="Important price-verification limitation"
          >
            <p className="flex items-start gap-2 font-mono text-xs font-black uppercase tracking-wider text-amber-800 dark:text-amber-200">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" /> Read as a
              watch brief, not a live price tape
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              The supplied report could not independently verify a complete
              printing-specific prior-day USD feed, completed-sales dataset, or
              21-day price series. Tournament results, policy changes, and
              format adoption are presented as catalysts only. Do not treat the
              report’s unverified values or signals as confirmed investment
              performance.
            </p>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href="/market-watch"
              className="inline-flex min-h-10 items-center border-2 border-primary bg-primary px-4 py-2 font-mono text-[10px] font-black uppercase tracking-wider text-primary-foreground hover:opacity-90"
            >
              Open Market Watch feed
            </Link>
            <Link
              href="/market-watch?date=2026-10-16"
              className="inline-flex min-h-10 items-center border-2 border-border bg-background px-4 py-2 font-mono text-[10px] font-black uppercase tracking-wider hover:border-primary"
            >
              October 16 source snapshot
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
        <section
          className="border-2 border-primary/30 bg-primary/5 p-5 sm:p-7"
          aria-labelledby="brief-takeaways"
        >
          <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-primary">
            Quick read
          </p>
          <h2 id="brief-takeaways" className="mt-2 text-2xl font-black">
            What matters from this brief
          </h2>
          <ul className="mt-4 grid gap-3 text-sm leading-6 text-muted-foreground md:grid-cols-2">
            <li className="border-l-2 border-primary pl-3">
              No printing-specific price mover could be independently confirmed
              from the supplied evidence.
            </li>
            <li className="border-l-2 border-primary pl-3">
              Competitive Brawl changes were concentrated in Arena; they should
              not be treated as paper Brawl demand.
            </li>
            <li className="border-l-2 border-primary pl-3">
              Standard results remained decentralized across Reanimator,
              Artifacts, Landfall, Lifegain, and Midrange shells.
            </li>
            <li className="border-l-2 border-primary pl-3">
              The practical action is verification first: singles with a use
              case, not random sealed-product speculation.
            </li>
          </ul>
        </section>
        <details className="mt-6 border border-border bg-card">
          <summary className="cursor-pointer px-4 py-3 font-mono text-xs font-black uppercase tracking-wider text-primary">
            Open full 30-signal source brief
          </summary>
          <article className="border-t border-border p-5 prose prose-neutral max-w-none break-words dark:prose-invert prose-headings:tracking-tight prose-a:text-primary prose-strong:text-foreground prose-li:my-1 prose-blockquote:border-primary prose-blockquote:text-muted-foreground sm:p-8">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {reportBody}
            </ReactMarkdown>
          </article>
        </details>
      </main>
    </div>
  );
}

export function October17MarketBriefBody() {
  return (
    <article className="prose prose-neutral max-w-none break-words dark:prose-invert prose-headings:tracking-tight prose-a:text-primary prose-strong:text-foreground prose-li:my-1 prose-blockquote:border-primary prose-blockquote:text-muted-foreground">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={markdownComponents}
      >
        {reportBody}
      </ReactMarkdown>
    </article>
  );
}

export default October17MarketBrief;
