import {
  CalendarDays,
  ExternalLink,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Link, useParams } from "wouter";
import { MarketPostCard } from "@/components/MarketPostCard";
import {
  formatPricingDate,
  importedCardHref,
  importedMarketReports,
  type ImportedMarketReport,
} from "@/data/marketReportArchive";
import { chronologicalMarketEntries } from "@/data/marketChronology";

function ChronologyCard({
  entry,
}: {
  entry: (typeof chronologicalMarketEntries)[number];
}) {
  return (
    <Link
      href={entry.href}
      className="group block border-2 border-border bg-card p-5 transition-colors hover:border-primary sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-2 font-mono text-[10px] font-black uppercase tracking-widest text-primary">
          <CalendarDays className="h-4 w-4" />{" "}
          {formatPricingDate(entry.dateKey)}
        </span>
        <span className="border border-border px-2 py-1 font-mono text-[9px] font-black uppercase text-muted-foreground">
          {entry.kind}
        </span>
      </div>
      <h2 className="mt-4 text-xl font-black leading-tight group-hover:text-primary">
        {entry.title}
      </h2>
      <div className="mt-4 flex flex-wrap gap-2 font-mono text-[9px] font-black uppercase">
        <span className="border border-primary/40 bg-primary/5 px-2 py-1 text-primary">
          {entry.source}
        </span>
        <span className="border border-border px-2 py-1 text-muted-foreground">
          {entry.verification}
        </span>
      </div>
      <p className="mt-4 text-xs leading-5 text-muted-foreground">
        <strong className="text-foreground">Data window:</strong>{" "}
        {entry.dataWindow}
      </p>
      <p className="mt-2 border-l-2 border-amber-500 pl-3 text-xs leading-5 text-muted-foreground">
        {entry.caveat}
      </p>
      <span className="mt-5 inline-flex items-center gap-1 border-t border-border pt-3 font-mono text-[10px] font-black uppercase text-primary">
        Open original record <ExternalLink className="h-3 w-3" />
      </span>
    </Link>
  );
}

export default function MarketReportArchive() {
  const { dateKey } = useParams<{ dateKey?: string }>();
  if (dateKey) {
    const report = importedMarketReports.find(item => item.dateKey === dateKey);
    if (!report)
      return (
        <div className="min-h-screen bg-background p-8 text-foreground">
          <Link
            href="/market-reports"
            className="font-mono text-xs uppercase text-primary hover:underline"
          >
            ← Chronological market hub
          </Link>
          <h1 className="mt-8 text-3xl font-bold">Report not found</h1>
        </div>
      );
    return <MarketReportArticle report={report} />;
  }
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b-2 border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
          <Link
            href="/movers"
            className="font-mono text-xs uppercase tracking-widest text-primary hover:underline"
          >
            ← Dated mover snapshot
          </Link>
          <p className="mt-8 font-mono text-xs font-bold uppercase tracking-[0.2em] text-primary">
            Chronological market hub
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
            Market reports & watch, by date
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-muted-foreground">
            One discovery feed for imported price snapshots, catalyst briefs,
            and source-dated market watch records. The underlying reports remain
            separate; dates, sources, verification labels, URLs, and caveats are
            preserved.
          </p>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
        <div className="mb-6 border-2 border-primary/30 bg-primary/5 p-5">
          <p className="font-mono text-xs font-black uppercase tracking-widest text-primary">
            Historical reading rule
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            A card below is a dated record, not a live quote or combined mover
            total. Open the original record to read its complete source
            citations and methodology.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {chronologicalMarketEntries.map(entry => (
            <ChronologyCard key={entry.id} entry={entry} />
          ))}
        </div>
      </main>
    </div>
  );
}

function MarketReportArticle({ report }: { report: ImportedMarketReport }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b-2 border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8">
          <Link
            href="/market-reports"
            className="font-mono text-xs uppercase tracking-widest text-primary hover:underline"
          >
            ← Dated report archive
          </Link>
          <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-primary">
                Published {formatPricingDate(report.dateKey)}
              </p>
              <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl">
                {report.title}
              </h1>
            </div>
            <span className="border border-border bg-background px-3 py-2 font-mono text-xs uppercase text-muted-foreground">
              {report.movers.length} movers
            </span>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
        <article className="border-2 border-border bg-card p-6 sm:p-10">
          <div className="border-b border-border pb-6">
            <p className="font-mono text-xs font-bold uppercase tracking-widest text-primary">
              Pricing date: {formatPricingDate(report.dateKey)}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              <strong className="text-foreground">Data window:</strong>{" "}
              {report.dataWindow}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              <strong className="text-foreground">Market status:</strong>{" "}
              {report.status}
            </p>
          </div>
          <div className="mt-8 text-base leading-8 text-muted-foreground">
            {report.body[0] && <p>{report.body[0]}</p>}
            {report.body.length > 1 && (
              <details className="mt-5 border border-border bg-background">
                <summary className="cursor-pointer px-4 py-3 font-mono text-xs font-black uppercase tracking-wider text-primary">
                  Read full report narrative · {report.body.length - 1} more
                  sections
                </summary>
                <div className="space-y-5 border-t border-border p-4 sm:p-6">
                  {report.body.slice(1).map((paragraph, index) => (
                    <p key={`${report.dateKey}-${index + 1}`}>{paragraph}</p>
                  ))}
                </div>
              </details>
            )}
          </div>
          <div className="mt-10 space-y-6 border-t-2 border-primary/30 pt-8">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-widest text-primary">
                Dated mover tape
              </p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                These prices and percentage moves belong to the{" "}
                {formatPricingDate(report.dateKey)} report, not a live quote.
              </p>
            </div>
            {report.movers.map(mover => {
              const positive = mover.changePercent >= 0;
              return (
                <MarketPostCard
                  key={`${mover.name}-${mover.setCode}`}
                  name={mover.name}
                  setCode={mover.setCode}
                  sourceDate={formatPricingDate(mover.pricingDate)}
                  kicker={`${mover.category} · ${formatPricingDate(report.dateKey)}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
                    <span className="font-bold">
                      {mover.setCode} · {mover.category}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 font-bold ${positive ? "text-emerald-500" : "text-destructive"}`}
                    >
                      {positive ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {mover.moveLabel}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 font-mono text-xs">
                    <span>{mover.priceLabel}</span>
                    <span className="text-muted-foreground">
                      As of {formatPricingDate(mover.pricingDate)}
                    </span>
                  </div>
                </MarketPostCard>
              );
            })}
          </div>
        </article>
      </main>
    </div>
  );
}
