import { ArrowLeft, ExternalLink, ShieldAlert, TrendingUp } from 'lucide-react';
import { Link, useParams } from 'wouter';
import { MarketCardPreview } from '@/components/MarketCardPreview';
import { useEditorialMarket } from '@/hooks/useEditorialMarket';
import { editorialCardUrl, editorialSetUrl } from '@/lib/editorialMarketLinks';

function formatSnapshotDate(value?: string) {
  if (!value) return 'date unavailable';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(date);
}

export default function EditorialMarketArticle() {
  const { slug } = useParams<{ slug: string }>();
  const { data, loading } = useEditorialMarket();
  const article = data && Object.values(data.articles).find(item => item.slug === slug);
  const category = data && Object.keys(data.articles).find(key => data.articles[key].slug === slug);
  const movers = data?.movers.filter(item => item.category === category) ?? [];
  const featured = movers[0];

  if (loading) return <main className="mx-auto max-w-3xl px-4 py-12 text-muted-foreground">Loading article…</main>;
  if (!article) return <main className="mx-auto max-w-3xl px-4 py-12"><p>Article not found.</p><Link href="/market-articles" className="mt-4 inline-block text-primary underline">Back to articles</Link></main>;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b-2 border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-8">
          <Link href="/market-articles" className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-primary hover:underline"><ArrowLeft className="h-4 w-4" /> All deep dives</Link>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-8 sm:py-10">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_300px]">
          <article className="min-w-0 max-w-4xl">
            <div className="border-b-2 border-primary pb-6 sm:pb-8">
              <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-primary">{article.kicker} · {category}</p>
              <h1 className="mt-4 max-w-4xl text-4xl font-black leading-[1.06] tracking-tight sm:text-5xl lg:text-6xl">{article.title}</h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground sm:text-xl">{article.dek}</p>
              <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-4 font-mono text-[10px] font-bold uppercase text-muted-foreground">
                <span>Snapshot: {data?.snapshot.label}</span><span>{formatSnapshotDate(data?.snapshot.date)}</span><span>Window: {data?.snapshot.dataWindow}</span>
              </div>
            </div>

            {featured && (
              <section className="mt-7 grid gap-5 border-2 border-primary/40 bg-gradient-to-br from-primary/5 via-card to-amber-500/5 p-4 sm:grid-cols-[160px_minmax(0,1fr)] sm:p-5" aria-label="Featured market evidence">
                <div className="flex justify-center sm:justify-start"><MarketCardPreview name={featured.name} setCode={featured.printing} size="md" /></div>
                <div className="min-w-0">
                  <p className="font-mono text-[10px] font-black uppercase tracking-widest text-primary">Evidence lead · dated snapshot</p>
                  <h2 className="mt-2 text-2xl font-black leading-tight">{featured.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{featured.setName} · {featured.printing} · {featured.formats}</p>
                  <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    <div className="border border-border bg-background p-3"><span className="block font-mono text-[9px] font-bold uppercase text-muted-foreground">Snapshot price</span><strong className="mt-1 block text-lg">${featured.price.toFixed(2)}</strong></div>
                    <div className="border border-border bg-background p-3"><span className="block font-mono text-[9px] font-bold uppercase text-muted-foreground">Snapshot move</span><strong className={`mt-1 block text-lg ${featured.changePercent >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{featured.changePercent >= 0 ? '+' : ''}{featured.changePercent}%</strong></div>
                    <div className="border border-border bg-background p-3"><span className="block font-mono text-[9px] font-bold uppercase text-muted-foreground">Confidence</span><strong className="mt-1 block text-sm">{featured.confidence}</strong></div>
                  </div>
                  <p className="mt-4 border-l-2 border-amber-500 bg-amber-500/5 px-3 py-2 text-xs leading-relaxed text-muted-foreground"><strong className="text-foreground">Risk to the thesis:</strong> {featured.risk}</p>
                  <div className="mt-4 flex flex-wrap gap-4 font-mono text-[10px] font-black uppercase"><a href={editorialCardUrl(featured.name)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">Open card <ExternalLink className="h-3 w-3" /></a><a href={editorialSetUrl(featured.setName)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">Open set <ExternalLink className="h-3 w-3" /></a></div>
                </div>
              </section>
            )}

            <div className="mt-8 border-l-4 border-amber-500 bg-amber-500/5 p-4 sm:p-5">
              <div className="flex items-center gap-2 font-mono text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400"><ShieldAlert className="h-4 w-4" /> Read the price context</div>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">Values and percentage changes in this article belong to the {data?.snapshot.label} snapshot ({formatSnapshotDate(data?.snapshot.date)}). They are not live quotes, an assurance of sell-through, or a buying recommendation. Source: {data?.snapshot.source}; market status: {data?.snapshot.marketStatus}.</p>
            </div>

            <div className="mt-9 max-w-[72ch] space-y-7 text-base leading-8 text-foreground/90 sm:text-lg sm:leading-9">
              {article.body.map((paragraph, index) => <p key={`${index}-${paragraph}`} className={index === 0 ? 'first-letter:float-left first-letter:mr-2 first-letter:mt-1 first-letter:text-5xl first-letter:font-black first-letter:leading-none first-letter:text-primary' : ''}>{paragraph}</p>)}
            </div>
          </article>

          <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start" aria-label="Article reading guide">
            <section className="border-2 border-border bg-card p-5">
              <p className="font-mono text-[10px] font-black uppercase tracking-widest text-primary">At a glance</p>
              <h2 className="mt-2 text-xl font-black">{movers.length} evidence card{movers.length === 1 ? '' : 's'}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Every card below includes its snapshot price, percentage move, source printing, risk note, and a Scryfall card/set link.</p>
              <div className="mt-4 space-y-2 border-t border-border pt-4 font-mono text-[10px] uppercase"><p className="flex justify-between gap-3"><span className="text-muted-foreground">Source</span><strong>{data?.snapshot.source}</strong></p><p className="flex justify-between gap-3"><span className="text-muted-foreground">Date</span><strong>{formatSnapshotDate(data?.snapshot.date)}</strong></p></div>
            </section>
            <Link href="/market-articles" className="block border-2 border-primary bg-primary p-4 font-mono text-xs font-black uppercase text-primary-foreground transition-colors hover:bg-primary/90">Browse more deep dives →</Link>
          </aside>
        </div>

        <section className="mt-14 border-t-2 border-primary pt-8" aria-labelledby="linked-evidence-heading">
          <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="font-mono text-xs font-black uppercase tracking-widest text-primary">Linked evidence</p><h2 id="linked-evidence-heading" className="mt-2 text-2xl font-black">Cards in {category}</h2></div>
            <span className="font-mono text-[10px] uppercase text-muted-foreground">Each move is dated to the source snapshot</span>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {movers.map(mover => (
              <article key={mover.id} className="border-2 border-border bg-card p-4 transition-colors hover:border-primary">
                <div className="flex items-start gap-3"><MarketCardPreview name={mover.name} setCode={mover.printing} /><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><div><h3 className="font-bold leading-snug">{mover.name}</h3><p className="mt-1 text-xs text-muted-foreground">{mover.setName} · {mover.printing}</p></div><span className={`shrink-0 font-mono text-xs font-black ${mover.changePercent >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{mover.changePercent >= 0 ? '+' : ''}{mover.changePercent}%</span></div><div className="mt-3 grid grid-cols-2 gap-2 border-y border-border py-2 font-mono text-[10px]"><span className="text-muted-foreground">Snapshot price</span><strong>${mover.price.toFixed(2)}</strong><span className="text-muted-foreground">Confidence</span><strong>{mover.confidence}</strong></div><p className="mt-3 text-xs leading-relaxed text-muted-foreground">{mover.thesis}</p><p className="mt-2 flex items-start gap-1 text-[10px] leading-relaxed text-amber-700 dark:text-amber-300"><ShieldAlert className="mt-0.5 h-3 w-3 shrink-0" />{mover.risk}</p><div className="mt-4 flex flex-wrap gap-4 border-t border-border pt-3 font-mono text-[10px] font-bold uppercase"><a href={editorialCardUrl(mover.name)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">Card <ExternalLink className="h-3 w-3" /></a><a href={editorialSetUrl(mover.setName)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">Set <ExternalLink className="h-3 w-3" /></a></div></div></div>
              </article>
            ))}
          </div>
        </section>
        <footer className="mt-10 border-t border-border pt-5 text-xs leading-relaxed text-muted-foreground">Card images are requested from Scryfall for identification. Magic card names and artwork are property of Wizards of the Coast; this independent fan content is not produced or endorsed by Wizards. Market prices are estimates and are not guaranteed.</footer>
      </main>
    </div>
  );
}
