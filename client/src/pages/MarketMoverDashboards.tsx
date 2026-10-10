import { ArrowLeft, AlertTriangle, ArrowUpRight, CalendarClock, CircleDollarSign, ExternalLink, ShieldAlert, Sparkles, TrendingUp } from 'lucide-react';
import { Link, useParams } from 'wouter';
import { InternalPageNav } from '@/components/InternalPageNav';
import { MarketCardPreview } from '@/components/MarketCardPreview';
import { manusMoverDashboards, manusMoverReport, type ManusMoverDashboard, type ManusMoverTone } from '@/data/marketMoverManusReport';

const toneStyles: Record<ManusMoverTone, { border: string; text: string; icon: React.ReactNode }> = {
  positive: { border: 'border-emerald-600/40 bg-emerald-500/5', text: 'text-emerald-700', icon: <TrendingUp className="h-4 w-4" /> },
  watch: { border: 'border-amber-600/40 bg-amber-500/5', text: 'text-amber-700', icon: <CircleDollarSign className="h-4 w-4" /> },
  risk: { border: 'border-destructive/40 bg-destructive/5', text: 'text-destructive', icon: <ShieldAlert className="h-4 w-4" /> },
  supply: { border: 'border-primary/40 bg-primary/5', text: 'text-primary', icon: <CalendarClock className="h-4 w-4" /> },
};

function DashboardCard({ dashboard, card }: { dashboard: ManusMoverDashboard; card: ManusMoverDashboard['cards'][number] }) {
  const tone = toneStyles[card.tone];
  return <article className={`border-2 p-4 sm:p-5 ${tone.border}`}>
    <div className="flex items-start gap-4">
      <MarketCardPreview name={card.name} setCode={card.setCode} size="md" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="text-lg font-black leading-tight">{card.name}</h3>
            <p className="mt-1 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{card.setLabel}</p>
          </div>
          <span className={`inline-flex items-center gap-1 font-mono text-[10px] font-black uppercase tracking-wider ${tone.text}`}>{tone.icon}{card.tone}</span>
        </div>
        <p className="mt-3 border-l-2 border-primary pl-2 font-mono text-xs font-bold leading-relaxed">{card.movement}</p>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{card.thesis}</p>
        <div className="mt-4 flex flex-wrap gap-2">{card.tags.map((tag) => <span key={tag} className="border border-border bg-background px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{tag}</span>)}</div>
        <div className="mt-4 flex flex-wrap gap-3 font-mono text-[10px] font-bold uppercase tracking-wider">
          <a href={`https://scryfall.com/search?q=${encodeURIComponent(`!"${card.name}"`)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">Scryfall <ExternalLink className="h-3 w-3" /></a>
          <Link href="/movers" className="text-muted-foreground hover:text-primary">Live mover feed</Link>
        </div>
      </div>
    </div>
  </article>;
}

function DashboardNav({ current }: { current: string }) {
  return <div className="flex gap-2 overflow-x-auto border-b-2 border-border pb-3">
    {manusMoverDashboards.map((dashboard) => <Link key={dashboard.slug} href={`/movers/${dashboard.slug}`} className={`shrink-0 border-2 px-3 py-2 font-mono text-[10px] font-black uppercase tracking-wider ${current === dashboard.slug ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground hover:border-primary hover:text-foreground'}`}>{dashboard.shortLabel}</Link>)}
  </div>;
}

export default function MarketMoverDashboards() {
  const { dashboard: slug } = useParams<{ dashboard?: string }>();
  const dashboard = manusMoverDashboards.find((item) => item.slug === slug) ?? manusMoverDashboards[0];
  const tone = toneStyles[dashboard.tone];
  return <div className="min-h-screen bg-background text-foreground">
    <InternalPageNav active="/movers" />
    <header className="border-b-2 border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/movers" className="inline-flex items-center gap-2 font-mono text-xs font-black uppercase tracking-widest text-primary hover:underline"><ArrowLeft className="h-4 w-4" /> Daily movers</Link>
          <Link href="/market-movers-manus-report" className="inline-flex items-center gap-2 border-2 border-border bg-background px-3 py-2 font-mono text-xs font-black uppercase tracking-wider hover:border-primary"><Sparkles className="h-4 w-4" /> Read the source post</Link>
        </div>
        <div className="mt-8 flex items-start gap-3"><span className={`mt-1 inline-flex border-2 p-2 ${tone.border} ${tone.text}`}>{tone.icon}</span><div><p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-primary">Imported report desk · {manusMoverReport.updated}</p><h1 className="mt-2 max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">{dashboard.label}</h1><p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">{dashboard.description}</p></div></div>
      </div>
    </header>
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-8">
      <DashboardNav current={dashboard.slug} />
      <section className={`border-2 p-5 sm:p-6 ${tone.border}`}>
        <p className={`font-mono text-xs font-black uppercase tracking-widest ${tone.text}`}>How to read this dashboard</p>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-muted-foreground">{dashboard.read}</p>
        <p className="mt-4 flex items-start gap-2 border-t border-border pt-4 font-mono text-[11px] font-bold uppercase leading-relaxed text-muted-foreground"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" /> This is market intelligence, not financial advice. Verify current listings, liquidity, and your own risk tolerance before acting.</p>
      </section>
      <section aria-labelledby="dashboard-cards">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b-2 border-border pb-4"><div><p className="font-mono text-xs font-black uppercase tracking-widest text-primary">Signal cards</p><h2 id="dashboard-cards" className="mt-2 text-2xl font-black">{dashboard.cards.length} names and events in this desk</h2></div><span className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">Source export · {manusMoverReport.published}</span></div>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">{dashboard.cards.map((card) => <DashboardCard key={`${dashboard.slug}-${card.name}`} dashboard={dashboard} card={card} />)}</div>
      </section>
      <section className="border-2 border-border bg-card p-5 sm:p-6"><div className="flex items-center gap-2 font-mono text-xs font-black uppercase tracking-widest text-primary"><ArrowUpRight className="h-4 w-4" /> Continue the market read</div><div className="mt-4 flex flex-wrap gap-3"><Link href="/movers" className="border-2 border-primary bg-primary px-3 py-2 font-mono text-xs font-black uppercase text-primary-foreground hover:opacity-90">Open live movers</Link><Link href="/market-today" className="border-2 border-border bg-background px-3 py-2 font-mono text-xs font-black uppercase hover:border-primary">Today’s market brief</Link></div></section>
    </main>
  </div>;
}
