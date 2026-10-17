import React from 'react';
import { CalendarDays, ExternalLink, FileText, TrendingDown, TrendingUp } from 'lucide-react';
import { Link, useParams } from 'wouter';
import { MarketCardPreview } from '@/components/MarketCardPreview';
import { formatPricingDate, importedCardHref, importedReportHref, importedSetHref, importedMarketReports, type ImportedMarketReport } from '@/data/marketReportArchive';

function ReportCard({ report }: { report: ImportedMarketReport }) {
  const positive = report.movers.filter((mover) => mover.changePercent > 0).length;
  return (
    <Link href={importedReportHref(report.dateKey)} className="group block border-2 border-border bg-card p-6 transition-colors hover:border-primary">
      <div className="flex items-start justify-between gap-4">
        <span className="inline-flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-widest text-primary"><CalendarDays className="h-4 w-4" /> {formatPricingDate(report.dateKey)}</span>
        <FileText className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
      </div>
      <h2 className="mt-6 text-2xl font-bold tracking-tight group-hover:text-primary">{report.title}</h2>
      <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{report.body[0] || report.status}</p>
      <div className="mt-6 flex flex-wrap gap-3 border-t border-border pt-4 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground"><span>{report.movers.length} dated movers</span><span>·</span><span>{positive} positive</span><span>·</span><span>Read article →</span></div>
    </Link>
  );
}

function ResearchBriefCard({ date, title, label, description, href }: { date: string; title: string; label: string; description: string; href: string }) {
  return (
    <Link href={href} className="group block border-2 border-border bg-card p-5 transition-colors hover:border-primary sm:p-6">
      <p className="inline-flex items-center gap-2 font-mono text-[10px] font-black uppercase tracking-widest text-primary"><CalendarDays className="h-4 w-4" /> {date}</p>
      <h3 className="mt-4 text-xl font-black leading-tight group-hover:text-primary">{title}</h3>
      <p className="mt-3 font-mono text-[10px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-200">{label}</p>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
      <span className="mt-5 inline-flex items-center gap-1 border-t border-border pt-3 font-mono text-[10px] font-black uppercase text-primary">Open separate report <ExternalLink className="h-3 w-3" /></span>
    </Link>
  );
}

export default function MarketReportArchive() {
  const { dateKey } = useParams<{ dateKey?: string }>();
  if (dateKey) {
    const report = importedMarketReports.find((item) => item.dateKey === dateKey);
    if (!report) return <div className="min-h-screen bg-background p-8 text-foreground"><Link href="/market-reports" className="font-mono text-xs uppercase text-primary hover:underline">← Report archive</Link><h1 className="mt-8 text-3xl font-bold">Report not found</h1></div>;
    return <MarketReportArticle report={report} />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b-2 border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
          <Link href="/movers" className="font-mono text-xs uppercase tracking-widest text-primary hover:underline">← Dated mover snapshot</Link>
          <p className="mt-8 font-mono text-xs font-bold uppercase tracking-[0.2em] text-primary">Historical market intelligence</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Dated market reports</h1>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-muted-foreground">Imported price-mover reports retain their original report dates and pricing vintages. Separate catalyst and market-watch research briefs appear below with their own dates, scopes, and verification limits.</p>
        </div>
      </header>
      <main className="mx-auto max-w-7xl space-y-12 px-4 py-8 sm:px-8">
        <section aria-labelledby="imported-price-reports-heading">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-2 border-primary/30 bg-primary/5 p-5">
            <div><p className="font-mono text-xs font-bold uppercase tracking-widest text-primary">Imported price-report archive</p><p className="mt-1 text-sm text-muted-foreground">{importedMarketReports.length} dated articles · 65 dashboard movers · pricing dates preserved as UTC report dates</p></div>
            <Link href="/market-articles" className="border-2 border-border bg-card px-4 py-2 font-mono text-xs font-bold uppercase hover:border-primary">Category deep dives</Link>
          </div>
          <h2 id="imported-price-reports-heading" className="sr-only">Imported dated price reports</h2>
          <div className="grid gap-5 md:grid-cols-2">{importedMarketReports.map((report) => <ReportCard key={report.dateKey} report={report} />)}</div>
        </section>

        <section aria-labelledby="source-research-briefs-heading">
          <div className="mb-5 border-b-2 border-border pb-4">
            <p className="font-mono text-xs font-black uppercase tracking-widest text-primary">Separate source-dated research archive</p>
            <h2 id="source-research-briefs-heading" className="mt-2 text-2xl font-black">Catalyst and market-watch briefs</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">These reports are not folded into the imported price-mover counts. A competitive or policy signal does not establish price movement, completed sales, or current quotes.</p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <ResearchBriefCard
              date="October 5, 2026"
              title="Daily MTG Market Movers Report"
              label="Historical price and format signals · data through Oct 1"
              description="Ten source categories with an approximate Sep 19–Oct 1 window. Price claims are often unverified or multi-day; repeated cards are cross-category mentions, not unique-card counts or current movers."
              href="/market-report/october-05-daily-market-movers"
            />
            <ResearchBriefCard
              date="October 11, 2026"
              title="Daily MTG Market Movers Report"
              label="Historical price/interest observations · data through Oct 10"
              description="The source could not verify 250 distinct prior-day movers. Its price, interest, spoiler, and metagame signals remain separate; repeated names are not unique-printing counts, and historical moves are not current quotes."
              href="/market-report/october-11-daily-market-movers"
            />
            <ResearchBriefCard
              date="October 15, 2026"
              title="Daily MTG Market Movers — 30-Signal Brief"
              label="Catalyst and metagame signals · price movement unverified"
              description="The source could not verify a complete prior-day price feed, completed-sales dataset, or 21-day history. The full brief preserves its individual confidence labels and source citations; it is not 30 verified price movers."
              href="/market-report/october-15-30-signal-brief"
            />
            <ResearchBriefCard
              date="October 16, 2026"
              title="MTG Market Movers — 2026-10-16"
              label="Notion source snapshot · data through October 16"
              description="A separate static read-only snapshot with its own report, card signals, official notices, review outcomes, and public citations. It is not merged with the October 15 catalyst brief."
              href="/market-watch#source-market-watch-heading"
            />
          </div>
        </section>
      </main>
    </div>
  );
}

function MarketReportArticle({ report }: { report: ImportedMarketReport }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b-2 border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8">
          <Link href="/market-reports" className="font-mono text-xs uppercase tracking-widest text-primary hover:underline">← Dated report archive</Link>
          <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
            <div><p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-primary">Published {formatPricingDate(report.dateKey)}</p><h1 className="mt-3 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl">{report.title}</h1></div>
            <span className="border border-border bg-background px-3 py-2 font-mono text-xs uppercase text-muted-foreground">{report.movers.length} movers</span>
          </div>
        </div>
      </header>
      <main className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <article className="border-2 border-border bg-card p-6 sm:p-10">
          <div className="border-b border-border pb-6">
            <p className="font-mono text-xs font-bold uppercase tracking-widest text-primary">Pricing date: {formatPricingDate(report.dateKey)}</p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground"><strong className="text-foreground">Data window:</strong> {report.dataWindow}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground"><strong className="text-foreground">Market status:</strong> {report.status}</p>
          </div>
          <div className="mt-8 space-y-5 text-base leading-8 text-muted-foreground">{report.body.map((paragraph, index) => <p key={`${report.dateKey}-${index}`}>{paragraph}</p>)}</div>
        </article>
        <aside className="space-y-5">
          <div className="border-2 border-border bg-card p-5">
            <p className="font-mono text-xs font-bold uppercase tracking-widest text-primary">Dated mover tape</p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">These prices and percentage moves belong to the {formatPricingDate(report.dateKey)} report, not a live quote.</p>
            <div className="mt-5 space-y-4">{report.movers.map((mover) => {
              const positive = mover.changePercent >= 0;
              const setHref = importedSetHref(mover.setCode);
              return <div key={`${mover.name}-${mover.setCode}`} className="flex items-start gap-3 border-t border-border pt-4">
                <MarketCardPreview name={mover.name} setCode={mover.setCode} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div><Link href={importedCardHref(mover.name)} className="font-bold hover:text-primary">{mover.name}</Link><div className="mt-1 font-mono text-[10px] uppercase text-muted-foreground">{mover.setCode} · {mover.category}</div></div>
                    <span className={`inline-flex items-center gap-1 font-mono text-xs font-bold ${positive ? 'text-emerald-500' : 'text-destructive'}`}>{positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}{mover.moveLabel}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between font-mono text-xs"><span>{mover.priceLabel}</span><span className="text-muted-foreground">As of {formatPricingDate(mover.pricingDate)}</span></div>
                  <div className="mt-2 flex flex-wrap gap-3 font-mono text-[10px] font-bold uppercase"><Link href={importedCardHref(mover.name)} className="text-primary hover:underline">Card profile</Link>{setHref && <Link href={setHref} className="text-primary hover:underline">Set page</Link>}<a href={`https://scryfall.com/search?q=${encodeURIComponent(`!"${mover.name}"`)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary">Scryfall <ExternalLink className="h-3 w-3" /></a></div>
                </div>
              </div>;
            })}</div>
          </div>
        </aside>
      </main>
    </div>
  );
}
