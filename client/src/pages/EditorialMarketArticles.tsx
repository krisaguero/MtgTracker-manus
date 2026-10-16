import { ArrowRight, BookOpen, CalendarDays, ShieldCheck, TrendingUp } from 'lucide-react';
import { Link } from 'wouter';
import { MarketCardPreview } from '@/components/MarketCardPreview';
import { InternalPageNav } from '@/components/InternalPageNav';
import { useEditorialMarket } from '@/hooks/useEditorialMarket';

export default function EditorialMarketArticles() {
  const { data, loading } = useEditorialMarket();
  const articles = Object.entries(data?.articles ?? {});
  const pricedMovers = data?.movers.filter(mover => Number.isFinite(mover.price) && mover.price > 0).length ?? 0;
  const featuredMovers = data?.movers.length ?? 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <InternalPageNav active="/market-articles" />
      <header className="relative overflow-hidden border-b-2 border-border bg-card">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] opacity-10 [background-size:18px_18px]" />
        <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-8 sm:py-12">
          <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-primary">Market desk · editorial research</p>
          <h1 className="mt-3 max-w-5xl text-4xl font-black tracking-tight sm:text-6xl">Market deep dives, built for readers—not spreadsheets.</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">Each story pairs a plain-language thesis with specific cards, visible market context, risk notes, and links back to the underlying printing and set.</p>
          {data && (
            <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Editorial evidence snapshot">
              <div className="border-2 border-primary/50 bg-background/90 p-4"><CalendarDays className="h-4 w-4 text-primary" /><p className="mt-3 font-mono text-[10px] font-bold uppercase text-muted-foreground">Source snapshot</p><p className="mt-1 text-lg font-black">{data.snapshot.label}</p><p className="mt-1 text-xs text-muted-foreground">{data.snapshot.date}</p></div>
              <div className="border border-border bg-background/90 p-4"><BookOpen className="h-4 w-4 text-primary" /><p className="mt-3 font-mono text-[10px] font-bold uppercase text-muted-foreground">Deep-dive topics</p><p className="mt-1 text-2xl font-black">{articles.length}</p><p className="mt-1 text-xs text-muted-foreground">Readable category stories</p></div>
              <div className="border border-border bg-background/90 p-4"><TrendingUp className="h-4 w-4 text-primary" /><p className="mt-3 font-mono text-[10px] font-bold uppercase text-muted-foreground">Cards in evidence</p><p className="mt-1 text-2xl font-black">{featuredMovers}</p><p className="mt-1 text-xs text-muted-foreground">Linked to exact card and set searches</p></div>
              <div className="border border-border bg-background/90 p-4"><ShieldCheck className="h-4 w-4 text-emerald-600" /><p className="mt-3 font-mono text-[10px] font-bold uppercase text-muted-foreground">Price coverage</p><p className="mt-1 text-2xl font-black">{pricedMovers}/{featuredMovers}</p><p className="mt-1 text-xs text-muted-foreground">Missing quotes are not estimated</p></div>
            </div>
          )}
          <p className="mt-5 max-w-4xl border-l-2 border-amber-500 bg-amber-500/5 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
            {data ? `Historical context: ${data.snapshot.dataWindow}. These articles describe that dated market snapshot, not a live quote or a guaranteed forecast. Snapshot source: ${data.snapshot.source}.` : 'Articles display their data date and source before the analysis.'}
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-8 sm:py-10">
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2"><div className="h-56 animate-pulse border border-border bg-muted" /><div className="h-56 animate-pulse border border-border bg-muted" /></div>
        ) : articles.length ? (
          <div className="grid gap-5 lg:grid-cols-2">
            {articles.map(([category, article]) => {
              const categoryMovers = data?.movers.filter(mover => mover.category === category) ?? [];
              const featured = categoryMovers[0];
              const strongestMove = categoryMovers.reduce((best, mover) => Math.abs(mover.changePercent) > Math.abs(best?.changePercent ?? 0) ? mover : best, categoryMovers[0]);
              return (
                <Link key={article.slug} href={`/market-category/${article.slug}`} className="group grid overflow-hidden border-2 border-border bg-card transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-[6px_6px_0_0_rgba(59,130,246,0.15)] sm:grid-cols-[180px_minmax(0,1fr)]">
                  <div className="relative flex min-h-48 items-center justify-center overflow-hidden border-b border-border bg-gradient-to-br from-primary/20 via-muted to-amber-500/10 p-4 sm:border-b-0 sm:border-r">
                    <div className="absolute inset-0 bg-[radial-gradient(#fff_1px,transparent_1px)] opacity-20 [background-size:14px_14px]" />
                    {featured ? <MarketCardPreview name={featured.name} setCode={featured.printing} size="md" /> : <BookOpen className="relative h-10 w-10 text-primary" />}
                    {strongestMove && <span className="absolute bottom-3 left-3 border border-border bg-background/95 px-2 py-1 font-mono text-[10px] font-black text-primary">{strongestMove.changePercent >= 0 ? '+' : ''}{strongestMove.changePercent}% snapshot move</span>}
                  </div>
                  <div className="flex min-w-0 flex-col p-5 sm:p-6">
                    <div className="flex items-center justify-between gap-3"><span className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-primary">{category}</span><span className="font-mono text-[9px] uppercase text-muted-foreground">{categoryMovers.length} evidence card{categoryMovers.length === 1 ? '' : 's'}</span></div>
                    <h2 className="mt-4 text-2xl font-black leading-tight tracking-tight group-hover:text-primary">{article.title}</h2>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">{article.dek}</p>
                    {featured && <p className="mt-4 border-l-2 border-primary bg-muted/40 px-3 py-2 text-xs leading-relaxed text-muted-foreground"><strong className="text-foreground">Evidence lead:</strong> {featured.name} · {featured.setName} · ${featured.price.toFixed(2)} in the dated snapshot. {featured.risk}</p>}
                    <span className="mt-auto inline-flex items-center gap-2 pt-5 font-mono text-xs font-bold uppercase text-primary">Read the deep dive <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="border-2 border-dashed border-border p-8 text-center text-sm text-muted-foreground">No editorial articles are available in this snapshot.</div>
        )}
        <footer className="mt-8 border-t border-border pt-5 text-xs leading-relaxed text-muted-foreground">Card images are requested from Scryfall and displayed for card identification. Magic card names and artwork are Wizards of the Coast property; this independent fan content is not produced or endorsed by Wizards. Market prices are estimates and are not guaranteed.</footer>
      </main>
    </div>
  );
}
