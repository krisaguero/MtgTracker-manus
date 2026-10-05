import { ArrowDownRight, ArrowUpRight, BarChart3, Clipboard, ExternalLink } from 'lucide-react';
import { Link } from 'wouter';
import audit from '@/data/marketSignalAudit.json';
import { formatPricingDate, importedCardHref, importedReportHref } from '@/data/marketReportArchive';

function pct(value: number | null | undefined) {
  if (value === null || value === undefined) return '—';
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

export default function MarketSignalAudit() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b-2 border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-8">
          <Link href="/movers" className="font-mono text-xs uppercase tracking-widest text-primary hover:underline">← Daily movers</Link>
          <div className="mt-7 flex flex-wrap items-end justify-between gap-4"><div><p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-primary">Automated category audit</p><h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">Market signal audit</h1><p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">A reproducible scan of the categories available on the site and the latest repository price snapshots. Flat daily observations fall back to seven-day momentum rather than being treated as a signal.</p></div><BarChart3 className="h-10 w-10 text-primary" /></div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-8">
        <section className="grid gap-4 sm:grid-cols-4">
          {[
            ['Pricing date', audit.pricingDate ? formatPricingDate(audit.pricingDate) : 'Unknown'],
            ['Daily snapshots', String(audit.snapshotCount)],
            ['Configured categories', String(audit.configuredCategories.length)],
            ['Latest observed', `${audit.latestDailyCategories.length} categories`],
          ].map(([label, value]) => <div key={label} className="border-2 border-border bg-card p-5"><p className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-black text-primary">{value}</p></div>)}
        </section>
        <section className="border-2 border-primary/30 bg-primary/5 p-6"><div className="flex items-center justify-between gap-3"><div><p className="font-mono text-xs font-bold uppercase tracking-widest text-primary">Independent read</p><h2 className="mt-2 text-2xl font-bold">What the audit found</h2></div><Link href={importedReportHref(audit.pricingDate)} className="font-mono text-xs font-bold uppercase text-primary hover:underline">Open dated report →</Link></div><ul className="mt-5 space-y-3 text-sm leading-relaxed text-muted-foreground">{audit.findings.map((finding) => <li key={finding} className="border-l-2 border-primary pl-3">{finding}</li>)}</ul></section>
        <section className="grid gap-8 lg:grid-cols-2">
          <div className="border-2 border-border bg-card p-6"><h2 className="text-xl font-bold">Category coverage</h2><p className="mt-2 text-sm text-muted-foreground">Configured tabs compared with categories observed in the daily feed.</p><div className="mt-5 space-y-3">{audit.configuredCategories.map((category) => <div key={category.id} className="flex items-center justify-between gap-4 border-t border-border pt-3"><div><span className="font-bold">{category.label}</span><span className="ml-2 font-mono text-[10px] uppercase text-muted-foreground">{category.id}</span></div><span className={`font-mono text-[10px] font-bold uppercase ${category.observedInDailyFeed ? 'text-emerald-500' : 'text-muted-foreground'}`}>{category.observedInDailyFeed ? `${category.latestCount} latest` : 'No daily observation'}</span></div>)}</div></div>
          <div className="border-2 border-border bg-card p-6"><h2 className="text-xl font-bold">Seven-day category momentum</h2><p className="mt-2 text-sm text-muted-foreground">Computed from the first and last observation in the most recent seven dated snapshots.</p><div className="mt-5 space-y-3">{audit.categoryMomentum.map((row) => <div key={row.category} className="flex items-center justify-between gap-4 border-t border-border pt-3"><div><span className="font-bold">{row.category}</span><span className="ml-2 font-mono text-[10px] uppercase text-muted-foreground">{row.cards} cards</span></div><span className={`font-mono text-sm font-bold ${row.averagePctChange >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>{pct(row.averagePctChange)}</span></div>)}</div></div>
        </section>
        <section className="grid gap-8 lg:grid-cols-2">
          <SignalTable title="Top seven-day gainers" rows={audit.topGainers} positive />
          <SignalTable title="Top seven-day declines" rows={audit.topDecliners} />
        </section>
        <section className="border-2 border-amber-500/50 bg-amber-500/5 p-6"><p className="font-mono text-xs font-bold uppercase tracking-widest text-amber-600">Reprint Squashes deep dive</p><h2 className="mt-2 text-2xl font-bold">What is driving the category?</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">The category-level +16.67% momentum is concentrated rather than broad-based. This table shows every tracked card in the category across the full daily archive.</p><div className="mt-5 space-y-3">{audit.reprintSquashesTrend.map((row) => <div key={`${row.name}-${row.setCode}`} className="border-t border-border pt-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><Link href={importedCardHref(row.name)} className="font-bold hover:text-primary">{row.name}</Link><p className="font-mono text-[10px] uppercase text-muted-foreground">{row.setCode} · {row.observations} observations · {row.firstDate} → {row.lastDate}</p></div><div className="text-right"><p className="font-mono text-sm font-bold text-emerald-600">{pct(row.totalPctChange)}</p><p className="font-mono text-[10px] text-muted-foreground">${row.firstPrice.toFixed(2)} → ${row.lastPrice.toFixed(2)}</p></div></div><div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3"><span>Peak: ${row.peakPrice.toFixed(2)}</span><span>Low: ${row.troughPrice.toFixed(2)}</span><span>Worst day: {pct(row.maxDailyDrop)}</span></div></div>)}</div></section>
        <section className="border-2 border-border bg-card p-6"><div className="flex items-center gap-2"><Clipboard className="h-4 w-4 text-primary" /><h2 className="text-xl font-bold">Market mover prompt</h2></div><p className="mt-3 border-l-2 border-primary pl-4 font-mono text-xs leading-relaxed text-muted-foreground">{audit.moverPrompt}</p><p className="mt-4 text-xs text-muted-foreground">Methodology: {audit.methodology}</p></section>
      </main>
    </div>
  );
}

function SignalTable({ title, rows, positive = false }: { title: string; rows: typeof audit.topGainers; positive?: boolean }) {
  return <div className="border-2 border-border bg-card p-6"><div className="flex items-center gap-2"><h2 className="text-xl font-bold">{title}</h2>{positive ? <ArrowUpRight className="h-5 w-5 text-emerald-500" /> : <ArrowDownRight className="h-5 w-5 text-destructive" />}</div><div className="mt-5 space-y-3">{rows.map((row) => <div key={row.key ?? row.id} className="flex items-center justify-between gap-4 border-t border-border pt-3"><div><Link href={importedCardHref(row.name)} className="font-bold hover:text-primary">{row.name}</Link><p className="font-mono text-[10px] uppercase text-muted-foreground">{row.category} · {row.setCode} · {row.firstObservedDate ? `from ${row.firstObservedDate}` : 'latest'}</p></div><div className="text-right"><span className={`font-mono text-sm font-bold ${positive ? 'text-emerald-500' : 'text-destructive'}`}>{pct(row.sevenDayPctChange ?? row.pctDelta)}</span><a className="ml-3 inline-flex text-muted-foreground hover:text-primary" href={`https://scryfall.com/search?q=${encodeURIComponent(`!"${row.name}"`)}`} target="_blank" rel="noopener noreferrer" aria-label={`Open ${row.name} on Scryfall`}><ExternalLink className="h-3 w-3" /></a></div></div>)}</div></div>;
}
