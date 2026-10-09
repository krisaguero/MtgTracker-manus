import { ArrowDownRight, ArrowLeft, ArrowUpRight, ExternalLink, ShieldAlert, Sparkles, TrendingDown, TrendingUp } from 'lucide-react';
import { Link } from 'wouter';
import { MarketCardPreview } from '@/components/MarketCardPreview';
import { importedCardHref, importedSetHref } from '@/data/marketReportArchive';
import { todayMarketBrief, type TodayMarketSignal } from '@/data/todayMarketBrief';

function SignalCard({ signal }: { signal: TodayMarketSignal }) {
  const bullish = signal.kind === 'confirmed-bullish';
  const bearish = signal.kind === 'confirmed-bearish';
  return <div className="border-2 border-border bg-card p-4">
    <div className="flex items-start gap-3">
      <MarketCardPreview name={signal.name} setCode={signal.setCode} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Link href={importedCardHref(signal.name)} className="font-bold hover:text-primary">{signal.name}</Link>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{signal.setCode} · {signal.setName}</p>
          </div>
          {(bullish || bearish) && <span className={`shrink-0 font-mono text-xs font-black ${bullish ? 'text-emerald-600' : 'text-destructive'}`}>{bullish ? '+' : ''}{signal.changePercent}%</span>}
        </div>
        <p className="mt-2 font-mono text-xs font-bold">{signal.priceLabel}</p>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{signal.thesis}</p>
        {signal.liquidityNote && <p className="mt-2 border-l-2 border-amber-500 pl-2 text-[11px] leading-relaxed text-amber-700">{signal.liquidityNote}</p>}
        <div className="mt-3 flex flex-wrap gap-3 font-mono text-[10px] font-bold uppercase">
          <Link href={importedCardHref(signal.name)} className="text-primary hover:underline">Card profile</Link>
          {importedSetHref(signal.setCode) && <Link href={importedSetHref(signal.setCode)!} className="text-primary hover:underline">Set page</Link>}
          <a href={`https://scryfall.com/search?q=${encodeURIComponent(`!"${signal.name}"`)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary">Scryfall <ExternalLink className="h-3 w-3" /></a>
        </div>
      </div>
    </div>
  </div>;
}

function SignalGrid({ title, signals, tone }: { title: string; signals: TodayMarketSignal[]; tone: 'positive' | 'negative' | 'developing' }) {
  const styles = { positive: 'border-emerald-600/40 bg-emerald-500/5', negative: 'border-destructive/40 bg-destructive/5', developing: 'border-amber-600/40 bg-amber-500/5' };
  const icon = tone === 'positive' ? <TrendingUp className="h-4 w-4" /> : tone === 'negative' ? <TrendingDown className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />;
  return <section className={`border-2 p-5 ${styles[tone]}`}><div className="flex items-center gap-2 font-mono text-xs font-black uppercase tracking-widest">{icon}{title}<span className="text-muted-foreground">({signals.length})</span></div><div className="mt-4 grid gap-3 lg:grid-cols-2">{signals.map((signal) => <SignalCard key={`${signal.name}-${signal.setCode}`} signal={signal} />)}</div></section>;
}

export default function TodayMarketBrief({ embedded = false }: { embedded?: boolean; params?: Record<string, string | undefined> }) {
  return <div className={embedded ? 'text-foreground' : 'min-h-screen bg-background text-foreground'}>
    {!embedded && <header className="border-b-2 border-border bg-card"><div className="mx-auto max-w-7xl px-4 py-6 sm:px-8"><Link href="/movers" className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-primary hover:underline"><ArrowLeft className="h-4 w-4" /> Daily movers</Link><p className="mt-8 font-mono text-xs font-bold uppercase tracking-[0.2em] text-primary">Market brief · {todayMarketBrief.publishedLabel}</p><h1 className="mt-3 max-w-5xl text-4xl font-black tracking-tight sm:text-6xl">{todayMarketBrief.title}</h1><p className="mt-4 max-w-4xl text-base leading-relaxed text-muted-foreground">{todayMarketBrief.status}</p></div></header>}
    <main className={embedded ? 'space-y-5' : 'mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-8'}>
      {embedded && <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5"><div><p className="font-mono text-xs font-bold uppercase tracking-widest text-primary">Today’s signal brief · {todayMarketBrief.publishedLabel}</p><h2 className="mt-2 text-2xl font-black">Spoiler/precon-driven, not broad-market repricing</h2></div><Link href="/market-today" className="border-2 border-primary bg-primary px-3 py-2 font-mono text-xs font-black uppercase text-primary-foreground hover:opacity-90">Read full post →</Link></div>}
      <div className="grid gap-4 md:grid-cols-3"><div className="border-2 border-primary bg-primary/5 p-5 md:col-span-2"><p className="font-mono text-xs font-black uppercase tracking-widest text-primary">Market read</p><p className="mt-3 text-sm leading-7 text-muted-foreground">{todayMarketBrief.marketRead}</p></div><div className="border-2 border-amber-600/40 bg-amber-500/5 p-5"><p className="font-mono text-xs font-black uppercase tracking-widest text-amber-700">Policy + supply watch</p><p className="mt-3 text-sm leading-7 text-muted-foreground">{todayMarketBrief.policyWatch}</p><p className="mt-3 text-sm leading-7 text-muted-foreground">{todayMarketBrief.supplyWatch}</p></div></div>
      <SignalGrid title="Confirmed bullish movers" signals={todayMarketBrief.confirmedBullish} tone="positive" />
      <SignalGrid title="Confirmed bearish / reprint-risk signals" signals={todayMarketBrief.confirmedBearish} tone="negative" />
      <SignalGrid title="Developing and speculative watchlist" signals={todayMarketBrief.developing} tone="developing" />
      {!embedded && <article className="border-2 border-border bg-card p-6 sm:p-10"><div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-primary"><Sparkles className="h-4 w-4" /> Editorial close</div><div className="mt-5 space-y-5 text-base leading-8 text-muted-foreground"><p>The cleanest confirmed upside today is concentrated in Sonic Screwdriver, Brushland, Xorn, Howling Mine, and Wellwisher. Those names express the current market’s blend of casual demand, old-print scarcity, and variant-driven attention.</p><p>The defensive read is equally important: Wedding Ring, Natural Order, Dockside Extortionist, Doubling Season, and Sting show how quickly premium or reprint-sensitive Commander names can retrace when liquidity cools.</p><p>Ink-Treader Nephilim remains the clearest example of a fragile thesis. Current public snapshots below the spoiler-season highs support monitoring rather than treating the spike as a stable new floor. Doom Prevails upgrades are useful demand clues, but Leader, Super-Genius and the other upgrade names remain developing until same-day price evidence confirms the community signal.</p></div><div className="mt-8 border-t border-border pt-5"><p className="font-mono text-xs font-bold uppercase tracking-widest text-primary">Sources</p><div className="mt-3 flex flex-wrap gap-3">{todayMarketBrief.sources.map((source) => <a key={source.href} href={source.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 border border-border bg-background px-3 py-2 font-mono text-xs font-bold hover:border-primary">{source.label} <ExternalLink className="h-3 w-3" /></a>)}</div></div></article>}
    </main>
  </div>;
}
