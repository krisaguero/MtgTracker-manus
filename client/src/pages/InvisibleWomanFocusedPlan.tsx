import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Bell, Check, ExternalLink, ShoppingCart, ShieldAlert, Shuffle, Timer, TrendingDown, TrendingUp } from 'lucide-react';
import { Link } from 'wouter';
import { toast } from 'sonner';
import { invisibleWomanUpgrades } from './PreconPortfolioWorkspace';
import { collectionIdentity, loadOwnedCollection, type OwnedCard } from '@/lib/manaboxParser';
import { loadPortfolioServiceState, markPurchasePriceAlertsRead, releaseReservation, reserveCard, savePortfolioServiceState, setPlanDecision, syncPurchasePriceWatches, type PlanDecision, type PortfolioServiceState } from '@/lib/portfolioService';
import { fetchPurchasePrices } from '@/lib/purchasePriceTracker';

type RowStatus = 'owned' | 'conflict' | 'missing' | 'buy' | 'defer' | 'transfer';
const TARGET_DECK = 'msc/the-fantastic-four';
const planCards = invisibleWomanUpgrades.filter(card => card.lane === 'Wall conversion' || card.lane === 'Core shell' || card.lane === 'Alternate win');

function cardLinks(name: string) {
  const query = encodeURIComponent(name);
  return [
    { label: 'Scryfall', href: `https://scryfall.com/search?q=${encodeURIComponent(`!"${name}"`)}&unique=prints` },
    { label: 'TCGplayer', href: `https://www.tcgplayer.com/search/magic/product?productLineName=magic&q=${query}` },
    { label: 'Card Kingdom', href: `https://www.cardkingdom.com/catalog/search?search=header&filter%5Bname%5D=${query}` },
    { label: 'eBay', href: `https://www.ebay.com/sch/i.html?_nkw=${query}` },
  ];
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="mt-5 border-2 border-border bg-card p-5 sm:p-7"><h2 className="text-xl font-black sm:text-2xl">{title}</h2>{children}</section>;
}

export default function InvisibleWomanFocusedPlan() {
  const [cards, setCards] = useState<OwnedCard[]>(() => loadOwnedCollection());
  const [state, setState] = useState<PortfolioServiceState>(() => loadPortfolioServiceState());
  const [message, setMessage] = useState('');
  const [livePrices, setLivePrices] = useState<Record<string, number | null>>({});
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceCheckedAt, setPriceCheckedAt] = useState('');
  const lastPriceSyncKey = useRef('');
  const ownedByName = useMemo(() => new Map(cards.map(card => [card.name.toLowerCase(), card])), [cards]);
  const saveState = (next: PortfolioServiceState) => { setState(next); savePortfolioServiceState(next); };
  const rows = useMemo(() => planCards.map(card => {
    const owned = ownedByName.get(card.name.toLowerCase());
    const reservations = state.reservations.filter(row => row.name.toLowerCase() === card.name.toLowerCase());
    const otherReservations = reservations.filter(row => row.deckSlug !== TARGET_DECK);
    const targetReserved = reservations.filter(row => row.deckSlug === TARGET_DECK).reduce((sum, row) => sum + row.quantity, 0);
    const status: RowStatus = state.planDecisions[card.name.toLowerCase()] || (otherReservations.length ? 'conflict' : owned ? 'owned' : 'missing');
    return { card, owned, reservations, otherReservations, targetReserved, status, identity: owned ? collectionIdentity(owned) : `plan:${card.name.toLowerCase()}` };
  }), [ownedByName, state]);
  const buyRows = rows.filter(row => ['missing', 'buy'].includes(row.status));
  const completeRows = rows.filter(row => ['owned', 'transfer'].includes(row.status));
  const unresolvedRows = rows.filter(row => ['missing', 'conflict'].includes(row.status));
  const spend = buyRows.reduce((sum, row) => sum + row.card.price, 0);
  const priceObservations = useMemo(() => rows.map(row => {
    return { identity: row.identity, name: row.card.name, deckSlug: TARGET_DECK, targetUsd: row.card.price, latestUsd: livePrices[row.identity] ?? null };
  }), [rows, livePrices]);
  const basketKey = rows.map(row => `${row.identity}:${row.card.name}`).join('|');
  useEffect(() => {
    if (!basketKey) return;
    const controller = new AbortController();
    setPriceLoading(true);
    void fetchPurchasePrices(rows.map(row => ({ identity: row.identity, name: row.card.name })), controller.signal)
      .then(results => {
        if (controller.signal.aborted) return;
        setLivePrices(Object.fromEntries(results.map(result => [result.identity, result.usd])));
        setPriceCheckedAt(results[0]?.checkedAt ?? '');
      })
      .finally(() => {
        if (!controller.signal.aborted) setPriceLoading(false);
      });
    return () => controller.abort();
  }, [basketKey]);
  const indexedSpend = buyRows.reduce((sum, row) => sum + (livePrices[row.identity] ?? 0), 0);
  const indexedSpendCount = buyRows.filter(row => livePrices[row.identity] != null).length;
  const priceSyncKey = priceObservations.map(observation => `${observation.identity}:${observation.latestUsd ?? 'unpriced'}`).join('|');
  useEffect(() => {
    if (priceLoading || !priceSyncKey || priceSyncKey === lastPriceSyncKey.current) return;
    lastPriceSyncKey.current = priceSyncKey;
    const next = syncPurchasePriceWatches(state, priceObservations);
    const freshAlerts = next.priceAlerts.filter(alert => !state.priceAlerts.some(previous => previous.id === alert.id));
    saveState(next);
    freshAlerts.forEach(alert => {
      if (alert.kind === 'drop') toast.success(`${alert.name} dropped ${Math.abs(alert.changePct ?? 0).toFixed(1)}%`);
      if (alert.kind === 'rise') toast.warning(`${alert.name} rose ${(alert.changePct ?? 0).toFixed(1)}%`);
      if (alert.kind === 'recovered') toast(`${alert.name} has a new indexed price`);
    });
  }, [priceLoading, priceObservations, priceSyncKey]);
  const choose = (name: string, decision: PlanDecision) => { saveState(setPlanDecision(state, name.toLowerCase(), decision)); setMessage(`${name}: ${decision} selected.`); };
  const resolveTransfer = (row: typeof rows[number]) => {
    if (!row.owned) { choose(row.card.name, 'defer'); return; }
    let next = state;
    row.otherReservations.forEach(reservation => { next = releaseReservation(next, reservation.identity, reservation.deckSlug, reservation.quantity); });
    const quantity = Math.max(1, row.otherReservations.reduce((sum, reservation) => sum + reservation.quantity, 0));
    next = reserveCard(next, row.owned, TARGET_DECK, quantity);
    next = setPlanDecision(next, row.card.name.toLowerCase(), 'transfer');
    saveState(next);
    setMessage(`${row.card.name}: reservation moved to Invisible Woman.`);
  };
  const refreshInventory = () => { setCards(loadOwnedCollection()); setState(loadPortfolioServiceState()); setMessage('Inventory and plan state refreshed.'); };
  const statusLabel = (status: RowStatus) => ({ owned: 'Owned', conflict: 'Conflict', missing: 'Needs decision', buy: 'Buy', defer: 'Deferred', transfer: 'Transferred' }[status]);
  const statusClass = (status: RowStatus) => status === 'owned' || status === 'transfer' ? 'border-emerald-600/50 bg-emerald-600/5 text-emerald-800' : status === 'conflict' ? 'border-amber-600/50 bg-amber-600/5 text-amber-800' : status === 'buy' ? 'border-primary/50 bg-primary/5 text-primary' : 'border-border bg-background text-muted-foreground';
  const livePriceLabel = (identity: string) => { const price = livePrices[identity]; return priceLoading ? 'checking Scryfall index…' : price == null ? 'Scryfall USD unavailable' : `$${price.toFixed(2)} Scryfall USD index`; };

  return <main className="container py-6 sm:py-10">
    <header className="border-2 border-primary bg-primary/5 p-5 sm:p-8"><Link href="/precon-portfolio" className="inline-flex items-center gap-2 text-sm font-bold text-primary underline"><ArrowLeft className="h-4 w-4" /> Back to portfolio</Link><div className="mt-5 flex flex-wrap items-start justify-between gap-5"><div><p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-primary">Milestone 11 · execution plan</p><h1 className="mt-2 max-w-4xl text-3xl font-black tracking-tight sm:text-5xl">Invisible Woman · Focused Wall</h1><p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground">Resolve ownership conflicts, choose transfer or purchase paths, and execute the saved Wall conversion without treating sealed ownership as opened-card coverage.</p></div><ShieldAlert className="h-12 w-12 text-primary" aria-hidden="true" /></div></header>

    <section className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5" aria-label="Focused plan metrics"><div className="border border-border bg-card p-4"><span className="font-mono text-[10px] font-black uppercase tracking-widest text-muted-foreground">Plan cards</span><b className="mt-2 block text-3xl">{rows.length}</b></div><div className="border border-border bg-card p-4"><span className="font-mono text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ready</span><b className="mt-2 block text-3xl text-emerald-700">{completeRows.length}</b></div><div className="border border-border bg-card p-4"><span className="font-mono text-[10px] font-black uppercase tracking-widest text-muted-foreground">Conflicts</span><b className="mt-2 block text-3xl text-amber-700">{rows.filter(row => row.status === 'conflict').length}</b></div><div className="border border-border bg-card p-4"><span className="font-mono text-[10px] font-black uppercase tracking-widest text-muted-foreground">To buy</span><b className="mt-2 block text-3xl text-primary">{buyRows.length}</b></div><div className="border border-border bg-card p-4"><span className="font-mono text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cash estimate</span><b className="mt-2 block text-3xl text-primary">${spend.toFixed(2)}</b></div></section>

    {message && <div className="mt-5 border border-primary bg-primary/5 p-4 text-sm font-bold text-primary" role="status">{message}</div>}

    <Panel title="Plan review"><p className="mt-2 text-sm text-muted-foreground">Every card has an explicit path. A conflict means a scanned copy is currently reserved for another deck. Transfer moves that physical reservation; Buy another copy leaves the existing allocation untouched; Defer keeps the card unresolved.</p><div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={refreshInventory} className="border border-border px-3 py-2 font-mono text-[10px] font-black uppercase">Refresh inventory</button><Link href="/collection" className="border border-primary px-3 py-2 font-mono text-[10px] font-black uppercase text-primary">Import ManaBox export</Link></div><div className="mt-5 space-y-3">{rows.map(row => <article key={row.card.name} className={`border p-4 ${statusClass(row.status)}`}><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><h3 className="font-black text-foreground">{row.card.name}</h3><span className="border px-2 py-1 font-mono text-[10px] font-black uppercase">{statusLabel(row.status)}</span></div><p className="mt-1 text-xs text-muted-foreground">{row.card.role} · {row.card.lane} · planning fallback ${row.card.price.toFixed(2)}</p><p className="mt-1 font-mono text-xs font-black text-primary">{livePriceLabel(row.identity)}</p></div><div className="font-mono text-xs text-muted-foreground">{row.owned ? `${row.owned.quantity} scanned` : 'Not scanned'}{row.targetReserved ? ` · ${row.targetReserved} reserved here` : ''}</div></div>{row.otherReservations.length > 0 && <div className="mt-3 border-l-2 border-amber-600 px-3 py-2 text-xs text-amber-900"><b>Conflict:</b> {row.otherReservations.map(reservation => `${reservation.quantity}× ${reservation.deckSlug}`).join(', ')} currently holds this printing.</div>}<div className="mt-4 flex flex-wrap gap-2">{row.status === 'conflict' && <><button type="button" onClick={() => resolveTransfer(row)} disabled={!row.owned} className="inline-flex items-center gap-2 border border-primary px-3 py-2 font-mono text-[10px] font-black uppercase text-primary disabled:cursor-not-allowed disabled:opacity-40"><Shuffle className="h-4 w-4" /> Transfer copy</button><button type="button" onClick={() => choose(row.card.name, 'buy')} className="inline-flex items-center gap-2 border border-border px-3 py-2 font-mono text-[10px] font-black uppercase"><ShoppingCart className="h-4 w-4" /> Buy another</button><button type="button" onClick={() => choose(row.card.name, 'defer')} className="inline-flex items-center gap-2 border border-border px-3 py-2 font-mono text-[10px] font-black uppercase"><Timer className="h-4 w-4" /> Defer</button></>}{row.status === 'missing' && <><button type="button" onClick={() => choose(row.card.name, 'buy')} className="border border-primary px-3 py-2 font-mono text-[10px] font-black uppercase text-primary">Mark to buy</button><button type="button" onClick={() => choose(row.card.name, 'defer')} className="border border-border px-3 py-2 font-mono text-[10px] font-black uppercase">Defer</button></>}{(['buy', 'missing'].includes(row.status)) && cardLinks(row.card.name).map(link => <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 border border-border px-2 py-2 text-xs font-bold hover:border-primary">{link.label}<ExternalLink className="h-3 w-3" /></a>)}{(['owned', 'transfer'].includes(row.status)) && <span className="inline-flex items-center gap-2 font-mono text-[10px] font-black uppercase text-emerald-800"><Check className="h-4 w-4" /> Ready for build</span>}</div></article>)}</div></Panel>

    <Panel title="Purchase basket"><div className="flex flex-wrap items-end justify-between gap-3"><p className="max-w-2xl text-sm text-muted-foreground">Only cards explicitly marked Buy another or Mark to buy appear here. Links search by card name and do not claim a specific printing or price.</p><div className="text-right"><strong className="block font-mono text-2xl text-primary">${indexedSpendCount ? indexedSpend.toFixed(2) : spend.toFixed(2)}</strong><small className="font-mono text-[10px] uppercase text-muted-foreground">{indexedSpendCount}/{buyRows.length} live indexed · ${spend.toFixed(2)} planning fallback</small></div></div><div className="mt-4 divide-y divide-border border-y border-border">{buyRows.length ? buyRows.map(row => { const observation = priceObservations.find(item => item.identity === row.identity); return <div key={row.card.name} className="flex flex-wrap items-center justify-between gap-3 py-3"><span><b>{row.card.name}</b><small className="ml-2 text-muted-foreground">{row.card.lane}</small><small className="ml-2 font-mono text-muted-foreground">{observation?.latestUsd == null ? 'index unavailable' : `$${observation.latestUsd.toFixed(2)} indexed`}</small></span><span className="flex flex-wrap gap-2">{cardLinks(row.card.name).slice(1).map(link => <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 border border-border px-2 py-1 text-xs font-bold">{link.label}<ExternalLink className="h-3 w-3" /></a>)}</span></div>; }) : <p className="py-4 text-sm text-muted-foreground">No purchase cards selected.</p>}</div></Panel>

    <Panel title="Automated price watch"><div className="flex flex-wrap items-start justify-between gap-4"><p className="max-w-2xl text-sm text-muted-foreground">The basket checks Scryfall’s named-card USD reference whenever this page opens or the basket changes. Default alerts fire at a 10% move between checks. This is a reference index, not a guaranteed live sale quote.</p><div className="flex items-center gap-2 border border-border px-3 py-2 font-mono text-xs font-black uppercase">{priceLoading ? 'Checking Scryfall' : priceCheckedAt ? `Checked ${priceCheckedAt.slice(0, 10)}` : 'Waiting for check'} <Bell className="h-4 w-4" /></div></div>{state.priceAlerts.length > 0 && <div className="mt-4 flex items-center justify-between border border-amber-600/40 bg-amber-500/5 p-3"><span className="text-sm font-bold">{state.priceAlerts.filter(alert => !alert.read).length} unread alert{state.priceAlerts.filter(alert => !alert.read).length === 1 ? '' : 's'}</span><button type="button" onClick={() => saveState(markPurchasePriceAlertsRead(state))} className="border border-border px-3 py-1 font-mono text-[10px] font-black uppercase">Mark alerts read</button></div>}<div className="mt-4 space-y-2">{state.priceAlerts.slice(0, 8).map(alert => <div key={alert.id} className={`flex flex-wrap items-center justify-between gap-3 border p-3 ${alert.read ? 'border-border bg-background' : 'border-primary/50 bg-primary/5'}`}><span className="flex items-center gap-2 text-sm font-bold">{alert.kind === 'drop' ? <TrendingDown className="h-4 w-4 text-emerald-700" /> : <TrendingUp className="h-4 w-4 text-amber-700" />}{alert.name}</span><span className="font-mono text-xs uppercase text-muted-foreground">{alert.kind === 'missing' ? 'No indexed price' : alert.kind === 'recovered' ? 'Price recovered' : `${alert.changePct && alert.changePct > 0 ? '+' : ''}${alert.changePct?.toFixed(1)}%`}</span></div>)}{state.priceAlerts.length === 0 && <p className="text-sm text-muted-foreground">No threshold alerts yet. Price watches are armed for the current basket.</p>}</div></Panel>

    <Panel title="Completion gate"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm text-muted-foreground">The plan is execution-ready when every card is owned, transferred, or deliberately deferred.</p><p className="mt-2 font-mono text-sm font-black uppercase">{rows.length - unresolvedRows.length}/{rows.length} resolved</p></div>{unresolvedRows.length === 0 ? <span className="inline-flex items-center gap-2 border border-emerald-600/50 bg-emerald-600/5 px-3 py-2 font-mono text-xs font-black uppercase text-emerald-800"><Check className="h-4 w-4" /> Plan resolved</span> : <span className="border border-amber-600/50 bg-amber-600/5 px-3 py-2 font-mono text-xs font-black uppercase text-amber-800">{unresolvedRows.length} decisions remaining</span>}</div></Panel>
  </main>;
}
