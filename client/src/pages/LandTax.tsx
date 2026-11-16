import { ArrowLeft, ExternalLink, Layers3, Map as MapIcon, TrendingDown, TrendingUp } from 'lucide-react';
import { Link } from 'wouter';
import dailySnapshot from '@/data/landTaxSnapshot.json';
import landIndex from '@/data/landCardIndex.json';
import { CardIndexLink } from '@/components/CardIndexLink';
import MarketMoverCardArt from '@/components/MarketMoverCardArt';
import { InternalPageNav } from '@/components/InternalPageNav';

type Signal = (typeof dailySnapshot.signals)[number];
type LandPrint = (typeof landIndex.cards)[number];

const BASIC_LANDS = new Set(['Plains', 'Island', 'Swamp', 'Mountain', 'Forest', 'Wastes']);
const landKeys = new Set(landIndex.cards.map(card => `${card.setCode}|${card.collectorNumber}|${card.name}`));
const signalKey = (signal: Signal) => `${signal.setCode.toLowerCase()}|${signal.collectorNumber}|${signal.name}`;
const isBasicLand = (signal: Signal) => BASIC_LANDS.has(signal.name);
const isIndexedLand = (signal: Signal) => landKeys.has(signalKey(signal));
const currentDate = dailySnapshot.generatedAt.slice(0, 10);

function pct(value: number) {
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
}

function price(value: number | null) {
  return value === null ? '—' : `$${value.toFixed(2)}`;
}

function signalSort(left: Signal, right: Signal) {
  return Math.abs(right.percentChange) - Math.abs(left.percentChange) || (right.currentUsd ?? 0) - (left.currentUsd ?? 0);
}

function LandCard({ signal }: { signal: Signal }) {
  const rising = signal.percentChange > 0;
  return (
    <article className="border-2 border-border bg-card p-3">
      <div className="flex gap-3">
        <MarketMoverCardArt name={signal.name} setCode={signal.setCode} collectorNumber={signal.collectorNumber} size="small" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-black leading-5">{signal.name}</h3>
              <p className="font-mono text-[10px] uppercase text-muted-foreground">{signal.setCode} #{signal.collectorNumber} · {isBasicLand(signal) ? 'Basic land' : 'Nonbasic land'}</p>
            </div>
            {rising ? <TrendingUp className="h-4 w-4 shrink-0 text-emerald-600" aria-label="Rising" /> : signal.percentChange < 0 ? <TrendingDown className="h-4 w-4 shrink-0 text-rose-600" aria-label="Falling" /> : null}
          </div>
          <div className="mt-3 flex items-end justify-between gap-2">
            <div><p className="font-mono text-lg font-black">{price(signal.currentUsd)}</p><p className={`font-mono text-[10px] font-black ${rising ? 'text-emerald-600' : signal.percentChange < 0 ? 'text-rose-600' : 'text-muted-foreground'}`}>{pct(signal.percentChange)} · {price(signal.previousUsd)}</p></div>
            <CardIndexLink name={signal.name} compact />
          </div>
        </div>
      </div>
      <p className="mt-3 border-t border-border pt-2 text-xs leading-5 text-muted-foreground">{signal.reason}</p>
    </article>
  );
}

export default function LandTax() {
  const lands = dailySnapshot.signals.filter(signal => isIndexedLand(signal) || isBasicLand(signal));
  const basic = lands.filter(isBasicLand).sort(signalSort);
  const nonbasic = lands.filter(signal => !isBasicLand(signal)).sort(signalSort);
  const moving = lands.filter(signal => signal.percentChange !== 0).sort(signalSort);
  const setRows = Array.from(lands.reduce((map, signal) => {
    const row = map.get(signal.setCode) ?? { setCode: signal.setCode, setName: signal.setName, total: 0, moving: 0, biggest: null as Signal | null };
    row.total += 1;
    if (signal.percentChange !== 0) row.moving += 1;
    if (!row.biggest || Math.abs(signal.percentChange) > Math.abs(row.biggest.percentChange)) row.biggest = signal;
    map.set(signal.setCode, row);
    return map;
  }, new Map<string, { setCode: string; setName: string; total: number; moving: number; biggest: Signal | null }>()).values()).sort((a, b) => b.moving - a.moving || b.total - a.total).slice(0, 12);

  return <div className="min-h-screen bg-background text-foreground"><InternalPageNav /><header className="border-b-2 border-border bg-card"><div className="mx-auto max-w-7xl px-4 py-8 sm:px-8"><Link href="/movers" className="inline-flex items-center gap-2 font-mono text-xs font-black uppercase tracking-widest text-primary hover:underline"><ArrowLeft className="h-4 w-4" /> Back to current movers</Link><div className="mt-7 flex flex-wrap items-end justify-between gap-5"><div><p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-primary">Market lane · lands only</p><h1 className="mt-2 text-4xl font-black tracking-tight sm:text-6xl">Land Tax</h1><p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">A separate land desk for basic-land treatments, nonbasic land pressure, and sets whose land suite deserves a closer look. This keeps land noise out of the main precon and Commander mover stream.</p></div><MapIcon className="h-14 w-14 text-primary" aria-hidden="true" /></div><div className="mt-6 flex flex-wrap gap-2"><span className="border-2 border-primary bg-primary px-3 py-2 font-mono text-[10px] font-black uppercase text-primary-foreground">{lands.length} indexed land observations</span><span className="border border-border bg-background px-3 py-2 font-mono text-[10px] font-black uppercase">{basic.length} basic-land rows</span><span className="border border-border bg-background px-3 py-2 font-mono text-[10px] font-black uppercase">As of {currentDate}</span></div></div></header><main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-8"><section className="grid gap-4 md:grid-cols-3"><div className="border-2 border-border bg-card p-5"><p className="font-mono text-[10px] font-black uppercase tracking-widest text-primary">Basic land stream</p><p className="mt-2 text-3xl font-black">{basic.filter(s => s.percentChange !== 0).length}</p><p className="mt-1 text-sm leading-6 text-muted-foreground">Moving basic-land treatments are quarantined here instead of competing with Commander staples.</p></div><div className="border-2 border-border bg-card p-5"><p className="font-mono text-[10px] font-black uppercase tracking-widest text-primary">Nonbasic stream</p><p className="mt-2 text-3xl font-black">{nonbasic.filter(s => s.percentChange !== 0).length}</p><p className="mt-1 text-sm leading-6 text-muted-foreground">Fetchable lands, utility lands, duals, pathways, and named land cycles with actual indexed type-line support.</p></div><div className="border-2 border-border bg-card p-5"><p className="font-mono text-[10px] font-black uppercase tracking-widest text-primary">Moving land rows</p><p className="mt-2 text-3xl font-black">{moving.length}</p><p className="mt-1 text-sm leading-6 text-muted-foreground">A signal is shown only when the dated snapshot records a real price change.</p></div></section><section className="border-l-4 border-amber-500 bg-amber-500/5 p-4 text-sm leading-6 text-muted-foreground"><strong className="text-foreground">Scope note:</strong> the land lens is backed by the indexed Commander catalog’s authoritative type-line metadata, then joined to the dated market snapshot by exact set code, collector number, and name. It is not a claim that every Scryfall land printing is represented in this snapshot.</section><section className="border-2 border-border bg-card p-5 sm:p-7"><div className="flex flex-wrap items-end justify-between gap-3 border-b-2 border-border pb-4"><div><p className="font-mono text-[10px] font-black uppercase tracking-widest text-primary">Set pressure board</p><h2 className="mt-1 text-2xl font-black">Sets with lands worth watching</h2></div><Layers3 className="h-6 w-6 text-primary" /></div><div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{setRows.map(row => <div key={row.setCode} className="border border-border bg-background p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-black uppercase">{row.setCode}</p><p className="text-xs text-muted-foreground">{row.setName}</p></div><span className="font-mono text-[10px] uppercase text-muted-foreground">{row.total} land rows</span></div><p className="mt-3 text-xs text-muted-foreground">{row.moving ? `${row.moving} moving row${row.moving === 1 ? '' : 's'}` : 'No current movement'}{row.biggest ? ` · strongest: ${row.biggest.name} ${pct(row.biggest.percentChange)}` : ''}</p></div>)}</div></section><section className="border-2 border-border bg-card p-5 sm:p-7"><div className="flex flex-wrap items-end justify-between gap-3 border-b-2 border-border pb-4"><div><p className="font-mono text-[10px] font-black uppercase tracking-widest text-primary">Land Tax movers</p><h2 className="mt-1 text-2xl font-black">Basic land treatments first</h2></div><a href="https://scryfall.com/search?q=t%3Abasic+type%3Aland" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-mono text-[10px] font-black uppercase text-primary hover:underline">Verify on Scryfall <ExternalLink className="h-3 w-3" /></a></div>{basic.length ? <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{basic.slice(0, 18).map(signal => <LandCard key={signal.id} signal={signal} />)}</div> : <p className="mt-5 text-sm text-muted-foreground">No basic-land rows are present in the current snapshot.</p>}</section><section className="border-2 border-border bg-card p-5 sm:p-7"><div className="border-b-2 border-border pb-4"><p className="font-mono text-[10px] font-black uppercase tracking-widest text-primary">Nonbasic desk</p><h2 className="mt-1 text-2xl font-black">Named lands with actual movement</h2></div>{nonbasic.length ? <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{nonbasic.filter(s => s.percentChange !== 0).slice(0, 30).map(signal => <LandCard key={signal.id} signal={signal} />)}</div> : <p className="mt-5 text-sm text-muted-foreground">No nonbasic land rows are present in the current snapshot.</p>}</section><footer className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-border pt-5 font-mono text-[10px] uppercase text-muted-foreground"><span>Land Tax is a research lane, not a buy list.</span><Link href="/market-desk" className="inline-flex items-center gap-1 text-primary hover:underline">Open Market Desk <TrendingUp className="h-3 w-3" /></Link></footer></main></div>;
}
