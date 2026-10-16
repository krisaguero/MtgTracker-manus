import { ArrowLeft, ExternalLink, ShieldAlert } from 'lucide-react';
import { Link } from 'wouter';
import { MarketCardPreview } from '@/components/MarketCardPreview';
import { importedCardHref, importedSetHref } from '@/data/marketReportArchive';
import { getChronologicalMarketPosts, type DailyBriefMover, type DailyBriefPost } from '@/lib/dailyPostEngine';

function formatDate(dateKey: string) {
  const date = new Date(`${dateKey}T00:00:00Z`);
  return Number.isNaN(date.getTime())
    ? dateKey
    : new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeZone: 'UTC' }).format(date);
}

function MoverCard({ mover }: { mover: DailyBriefMover }) {
  const positive = mover.changePercent !== null && mover.changePercent > 0;
  const negative = mover.changePercent !== null && mover.changePercent < 0;
  const moveTone = positive ? 'text-emerald-700 dark:text-emerald-400' : negative ? 'text-destructive' : 'text-muted-foreground';

  return (
    <article className="grid gap-4 border border-border bg-background p-4 sm:grid-cols-[92px_minmax(0,1fr)]">
      <div className="flex justify-center sm:justify-start"><MarketCardPreview name={mover.name} setCode={mover.setCode} size="sm" /></div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href={importedCardHref(mover.name)} className="text-lg font-black hover:text-primary">{mover.name}</Link>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {mover.setCode || 'Set unavailable'}{mover.setName ? ` · ${mover.setName}` : ''}{mover.category ? ` · ${mover.category}` : ''}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 font-mono text-xs">
            <span className="border border-border bg-card px-2 py-1">{mover.priceLabel}</span>
            <span className={`border border-border bg-card px-2 py-1 font-bold ${moveTone}`}>{mover.changeLabel}</span>
          </div>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{mover.thesis}</p>
        <div className="mt-3 border-l-2 border-amber-500 bg-amber-500/5 p-3">
          <p className="font-mono text-[10px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-300">{mover.volatilityLabel} · price date {formatDate(mover.pricingDate)}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{mover.volatilityNote}{mover.streak ? ` Reported streak: ${mover.streak} days.` : ''}</p>
        </div>

        <div className="mt-3 grid gap-2 md:grid-cols-2">
          <div className="border border-border bg-card p-3">
            <p className="font-mono text-[10px] font-black uppercase tracking-wider text-primary">Collector budget check · {mover.budgetBand}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{mover.collectorBudgetGuidance}</p>
          </div>
          <div className="border border-border bg-card p-3">
            <p className="font-mono text-[10px] font-black uppercase tracking-wider text-primary">Investor risk-budget check</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{mover.investorBudgetGuidance}</p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-3 font-mono text-[10px] font-bold uppercase">
          <Link href={importedCardHref(mover.name)} className="text-primary hover:underline">Card profile</Link>
          {importedSetHref(mover.setCode) && <Link href={importedSetHref(mover.setCode)!} className="text-primary hover:underline">Set page</Link>}
          <a href={mover.scryfallHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary">Verify exact printing on Scryfall <ExternalLink className="h-3 w-3" /></a>
        </div>
      </div>
    </article>
  );
}

function ReportPost({ post, embedded = false }: { post: DailyBriefPost; embedded?: boolean }) {
  const movers = embedded ? post.movers.slice(0, 2) : post.movers;
  return (
    <article id={post.dateKey} className="scroll-mt-6 border-2 border-border bg-card p-4 sm:p-6">
      <header className="border-b border-border pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-xs font-black uppercase tracking-widest text-primary">Historical snapshot · {formatDate(post.dateKey)}</p>
          {!embedded && <Link href={post.reportHref} className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline">Full archived report <ExternalLink className="h-3 w-3" /></Link>}
        </div>
        <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">{post.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{post.status}</p>
        <p className="mt-3 border-l-2 border-primary pl-3 text-xs leading-relaxed text-muted-foreground"><strong>Data window:</strong> {post.dataWindow}</p>
      </header>

      <blockquote className="mt-4 border border-border bg-background p-4 text-sm leading-6 text-muted-foreground">
        <p className="font-mono text-[10px] font-black uppercase tracking-wider text-primary">Archived report excerpt</p>
        <p className="mt-2">“{post.excerpt}”</p>
        <cite className="mt-2 block text-[10px] not-italic">Excerpt from <Link href={post.reportHref} className="font-bold text-primary hover:underline">{post.archiveSource} · {formatDate(post.dateKey)}</Link></cite>
      </blockquote>

      <div className="mt-4 flex flex-wrap gap-2" aria-label="Sources">
        {post.sourceLinks.map((source) => (
          <a key={source.href} href={source.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 border border-border bg-background px-3 py-2 font-mono text-[10px] font-bold uppercase hover:border-primary">
            {source.label} <ExternalLink className="h-3 w-3" />
          </a>
        ))}
      </div>

      <div className="mt-5 space-y-3">
        {movers.length ? movers.map((mover) => <MoverCard key={`${mover.name}-${mover.setCode}`} mover={mover} />) : (
          <p className="border border-dashed border-border p-4 text-sm text-muted-foreground">This archived report has no individual mover rows.</p>
        )}
      </div>
      {embedded && post.movers.length > movers.length && <p className="mt-3 text-xs text-muted-foreground">Showing {movers.length} of {post.movers.length} archived movers.</p>}
    </article>
  );
}

export default function TodayMarketBrief({ embedded = false }: { embedded?: boolean; params?: Record<string, string | undefined> }) {
  const posts = getChronologicalMarketPosts();
  const latestPost = posts[0];
  const dates = posts.map((post) => post.dateKey).sort();

  if (embedded) {
    if (!latestPost) return <p className="text-sm text-muted-foreground">No dated market report is available in the archive.</p>;
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
          <div>
            <p className="font-mono text-[10px] font-black uppercase tracking-widest text-primary">Dated archive · newest snapshot {formatDate(latestPost.dateKey)}</p>
            <h2 className="mt-2 text-xl font-black">Historical market notes, not a live quote feed</h2>
          </div>
          <Link href="/market-today" className="border border-primary bg-primary px-3 py-2 font-mono text-[10px] font-black uppercase text-primary-foreground hover:opacity-90">Read chronological brief →</Link>
        </div>
        <ReportPost post={latestPost} embedded />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-8">
          <Link href="/movers" className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-primary hover:underline"><ArrowLeft className="h-4 w-4" /> Daily movers</Link>
          <p className="mt-8 font-mono text-xs font-black uppercase tracking-[0.2em] text-primary">Chronological market brief · {posts.length} imported reports</p>
          <h1 className="mt-3 max-w-5xl text-4xl font-black tracking-tight sm:text-6xl">Dated market notes, with the evidence attached.</h1>
          <p className="mt-4 max-w-4xl text-base leading-relaxed text-muted-foreground">Historical posts built from the tracker’s archived market snapshots, newest first{dates.length ? ` (${formatDate(dates[0])}–${formatDate(dates[dates.length - 1])})` : ''}. Prices and percentage moves are reported snapshot values, not live quotes or independently audited sales.</p>
          <div role="note" className="mt-5 flex items-start gap-3 border border-amber-600/40 bg-amber-500/5 p-4">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-300" />
            <p className="text-xs leading-relaxed text-muted-foreground">A percentage move from one archived report does not show listing depth, completed-sale volume, or intraday volatility. Verify the exact printing and current sold listings before making a purchase. Collector and investor panels are budget/risk checks, not buy or sell recommendations.</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-8">
        {posts.length ? posts.map((post) => <ReportPost key={post.dateKey} post={post} />) : (
          <div className="border-2 border-dashed border-border p-8 text-center text-sm text-muted-foreground">No dated market reports are available yet.</div>
        )}
        <footer className="border-t border-border pt-5 text-xs leading-relaxed text-muted-foreground">Card images are fetched from Scryfall for identification. Archived price data may be stale, may use a market-wide rather than exact-variant price, and can change quickly. MTG card names and artwork belong to their owners; this independent tracker is not affiliated with Wizards of the Coast.</footer>
      </main>
    </div>
  );
}
