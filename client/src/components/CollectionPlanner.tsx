import { useEffect, useMemo, useState } from 'react';
import { Check, Plus, Trash2 } from 'lucide-react';
import type { OwnedCard } from '@/lib/manaboxParser';
import {
  COLLECTION_PLANNER_STORAGE_KEY,
  createPlannerId,
  countSetPrintings,
  loadCollectionPlanner,
  saveCollectionPlanner,
  setTradePileQuantity,
  tradePileQuantity,
  wishlistOwnership,
  type CollectionPlannerData,
} from '@/lib/collectionPlanner';

export function CollectionPlanner({ cards }: { cards: OwnedCard[] }) {
  const [planner, setPlanner] = useState<CollectionPlannerData>(() => loadCollectionPlanner());
  const [goalSetCode, setGoalSetCode] = useState('');
  const [goalSetName, setGoalSetName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [wishName, setWishName] = useState('');
  const [wishSet, setWishSet] = useState('');
  const [wishNumber, setWishNumber] = useState('');
  const [wishFinish, setWishFinish] = useState('');
  const [wishBudget, setWishBudget] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    const refresh = () => setPlanner(loadCollectionPlanner());
    window.addEventListener('storage', refresh);
    window.addEventListener('mtg-tracker-local-workspace-changed', refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('mtg-tracker-local-workspace-changed', refresh);
    };
  }, []);

  const printingsBySet = useMemo(() => {
    const values = new Map<string, number>();
    for (const goal of planner.setGoals) values.set(goal.id, countSetPrintings(cards, goal.setCode));
    return values;
  }, [cards, planner.setGoals]);

  function update(next: CollectionPlannerData, message?: string) {
    saveCollectionPlanner(next);
    setPlanner(next);
    if (message) setStatus(message);
  }

  function addGoal(event: React.FormEvent) {
    event.preventDefault();
    const code = goalSetCode.trim().toLowerCase();
    const target = Number.parseInt(goalTarget, 10);
    if (!code || !Number.isSafeInteger(target) || target < 1) return;
    const next = { ...planner, setGoals: [{ id: createPlannerId(), setCode: code, setName: goalSetName.trim() || code.toUpperCase(), targetPrintings: target, createdAt: Date.now() }, ...planner.setGoals] };
    update(next, 'Set completion goal saved in this browser.');
    setGoalSetCode(''); setGoalSetName(''); setGoalTarget('');
  }

  function addWishlist(event: React.FormEvent) {
    event.preventDefault();
    const name = wishName.trim();
    if (!name) return;
    const budget = wishBudget.trim() ? Number(wishBudget) : undefined;
    if (budget !== undefined && (!Number.isFinite(budget) || budget < 0)) return;
    const item = { id: createPlannerId(), name, setCode: wishSet.trim() || undefined, collectorNumber: wishNumber.trim() || undefined, finish: wishFinish.trim() || undefined, maxPriceUsd: budget, createdAt: Date.now() };
    update({ ...planner, wishlist: [item, ...planner.wishlist] }, 'Wishlist printing saved locally.');
    setWishName(''); setWishSet(''); setWishNumber(''); setWishFinish(''); setWishBudget('');
  }

  const ownedCopies = cards.reduce((total, card) => total + card.quantity, 0);
  const tradeCopies = cards.reduce((total, card) => total + Math.min(Math.max(0, card.quantity - 1), tradePileQuantity(`${card.name}::${card.setCode || ''}::${card.collectorNumber || ''}::${card.finish || 'normal'}::${card.language || 'en'}`.toLowerCase(), planner)), 0);

  return (
    <section className="my-8 border-2 border-border bg-card p-4 sm:p-7" aria-labelledby="collection-planner-title">
      <div className="border-b border-border pb-4">
        <p className="font-mono text-xs font-black uppercase tracking-[0.18em] text-primary">Collection goals · browser-local</p>
        <h2 id="collection-planner-title" className="mt-1 text-2xl font-black">Build toward the cards you want to own.</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Track set-printing targets, exact wishlist variants, and extra copies reserved for trading. These notes stay in this browser and are included in local workspace backups.</p>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <section className="border border-border bg-background p-4" aria-labelledby="set-goals-title">
          <h3 id="set-goals-title" className="font-bold">Set completion goals</h3>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">A progress count is based on distinct imported printings with the selected set code. Set target size is your chosen goal, not a claim that every catalog card is owned.</p>
          <form onSubmit={addGoal} className="mt-3 grid gap-2 sm:grid-cols-[1fr_1.5fr_100px_auto]">
            <input value={goalSetCode} onChange={(event) => setGoalSetCode(event.target.value)} placeholder="Set code" aria-label="Goal set code" maxLength={32} required className="min-h-10 border border-border bg-card px-3 text-sm uppercase" />
            <input value={goalSetName} onChange={(event) => setGoalSetName(event.target.value)} placeholder="Set name (optional)" aria-label="Goal set name" maxLength={160} className="min-h-10 border border-border bg-card px-3 text-sm" />
            <input value={goalTarget} onChange={(event) => setGoalTarget(event.target.value)} placeholder="Target" aria-label="Target distinct printings" inputMode="numeric" type="number" min="1" required className="min-h-10 border border-border bg-card px-3 text-sm" />
            <button className="inline-flex min-h-10 items-center justify-center gap-1 border border-primary bg-primary px-3 text-xs font-bold uppercase text-primary-foreground"><Plus className="h-4 w-4" /> Add</button>
          </form>
          {planner.setGoals.length ? <ul className="mt-4 space-y-2">{planner.setGoals.map((goal) => {
            const count = printingsBySet.get(goal.id) ?? 0;
            const percent = Math.min(100, Math.round(count / goal.targetPrintings * 100));
            return <li key={goal.id} className="border border-border bg-card p-3"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-semibold">{goal.setName} <span className="font-mono text-xs uppercase text-muted-foreground">· {goal.setCode}</span></p><p className="mt-1 text-xs text-muted-foreground">{count} of {goal.targetPrintings} target printings · {percent}%</p></div><button type="button" aria-label={`Remove ${goal.setName} goal`} onClick={() => update({ ...planner, setGoals: planner.setGoals.filter((item) => item.id !== goal.id) })} className="min-h-10 min-w-10 text-muted-foreground hover:text-destructive"><Trash2 className="mx-auto h-4 w-4" /></button></div><div className="mt-2 h-2 bg-muted"><div className="h-2 bg-primary" style={{ width: `${percent}%` }} /></div></li>;
          })}</ul> : <p className="mt-4 border border-dashed border-border p-3 text-xs text-muted-foreground">No set goals yet.</p>}
        </section>

        <section className="border border-border bg-background p-4" aria-labelledby="wishlist-title">
          <h3 id="wishlist-title" className="font-bold">Variant-aware wishlist</h3>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">Add a set and collector number to track an exact printing. Name-only entries are marked ambiguous when multiple printings are in your collection.</p>
          <form onSubmit={addWishlist} className="mt-3 grid gap-2 sm:grid-cols-2">
            <input value={wishName} onChange={(event) => setWishName(event.target.value)} placeholder="Card name" aria-label="Wishlist card name" maxLength={300} required className="min-h-10 border border-border bg-card px-3 text-sm sm:col-span-2" />
            <input value={wishSet} onChange={(event) => setWishSet(event.target.value)} placeholder="Set code" aria-label="Wishlist set code" maxLength={32} className="min-h-10 border border-border bg-card px-3 text-sm" />
            <input value={wishNumber} onChange={(event) => setWishNumber(event.target.value)} placeholder="Collector number" aria-label="Wishlist collector number" maxLength={40} className="min-h-10 border border-border bg-card px-3 text-sm" />
            <input value={wishFinish} onChange={(event) => setWishFinish(event.target.value)} placeholder="Finish / variant (e.g. etched foil)" aria-label="Wishlist finish or variant" maxLength={100} className="min-h-10 border border-border bg-card px-3 text-sm" />
            <input value={wishBudget} onChange={(event) => setWishBudget(event.target.value)} placeholder="Target max USD (optional)" aria-label="Wishlist target maximum price in USD" inputMode="decimal" type="number" min="0" step="0.01" className="min-h-10 border border-border bg-card px-3 text-sm" />
            <button className="inline-flex min-h-10 items-center justify-center gap-1 border border-primary bg-primary px-3 text-xs font-bold uppercase text-primary-foreground sm:col-span-2"><Plus className="h-4 w-4" /> Add wishlist printing</button>
          </form>
          {planner.wishlist.length ? <ul className="mt-4 divide-y divide-border border-y border-border">{planner.wishlist.map((item) => {
            const ownership = wishlistOwnership(item, cards);
            return <li key={item.id} className="flex items-center justify-between gap-3 py-3"><div className="min-w-0"><p className="truncate font-semibold">{item.name}{item.finish ? <span className="ml-2 text-xs font-normal text-muted-foreground">{item.finish}</span> : null}</p><p className="mt-1 text-xs text-muted-foreground">{item.setCode || 'Any set'}{item.collectorNumber ? ` · #${item.collectorNumber}` : ''}{item.maxPriceUsd !== undefined ? ` · Target ≤ $${item.maxPriceUsd.toFixed(2)}` : ''}</p><p className={`mt-1 inline-flex items-center gap-1 text-[10px] font-bold uppercase ${ownership.owned ? 'text-emerald-700' : ownership.ambiguous ? 'text-amber-700' : 'text-muted-foreground'}`}>{ownership.owned ? <><Check className="h-3 w-3" /> Exact printing owned</> : ownership.ambiguous ? 'Ambiguous name match · add set/number' : ownership.nameMatches ? 'Name found · printing does not match' : 'Not matched in collection'}</p></div><button type="button" aria-label={`Remove ${item.name} from wishlist`} onClick={() => update({ ...planner, wishlist: planner.wishlist.filter((entry) => entry.id !== item.id) })} className="min-h-10 min-w-10 text-muted-foreground hover:text-destructive"><Trash2 className="mx-auto h-4 w-4" /></button></li>;
          })}</ul> : <p className="mt-4 border border-dashed border-border p-3 text-xs text-muted-foreground">Your wishlist is empty.</p>}
        </section>
      </div>

      <section className="mt-5 border border-border bg-background p-4" aria-labelledby="duplicate-trade-title">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><h3 id="duplicate-trade-title" className="font-bold">Duplicate &amp; trade piles</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">Extra copies are identified by exact imported printing. Mark only copies you intend to trade; one copy is reserved by default.</p></div><p className="font-mono text-xs text-muted-foreground">{ownedCopies} owned copies · {tradeCopies} marked for trade</p></div>
        {cards.some((card) => card.quantity > 1) ? <div className="mt-3 grid gap-2 md:grid-cols-2">{cards.filter((card) => card.quantity > 1).map((card) => {
          const key = `${card.name}::${card.setCode || ''}::${card.collectorNumber || ''}::${card.finish || 'normal'}::${card.language || 'en'}`.toLowerCase();
          const extraCopies = card.quantity - 1;
          const offered = Math.min(extraCopies, tradePileQuantity(key, planner));
          return <article key={key} className="flex items-center justify-between gap-3 border border-border bg-card p-3"><div className="min-w-0"><p className="truncate font-semibold">{card.name}</p><p className="text-xs text-muted-foreground">{card.setCode ? `${card.setCode.toUpperCase()} · ` : 'Set unknown · '}{card.collectorNumber || 'number unknown'} · {card.quantity} owned · {extraCopies} extra</p></div><label className="shrink-0 text-[10px] font-bold uppercase text-muted-foreground">Trade <select aria-label={`Trade copies of ${card.name}`} value={offered} onChange={(event) => update(setTradePileQuantity(planner, card, Number(event.target.value)))} className="ml-1 min-h-10 border border-border bg-background px-2 text-sm text-foreground">{Array.from({ length: extraCopies + 1 }, (_, quantity) => <option key={quantity} value={quantity}>{quantity}</option>)}</select></label></article>;
        })}</div> : <p className="mt-3 border border-dashed border-border p-3 text-xs text-muted-foreground">No duplicate copies are currently recorded.</p>}
      </section>
      {status && <p role="status" className="mt-4 border border-primary/30 bg-primary/5 p-3 text-xs text-muted-foreground">{status}</p>}
    </section>
  );
}
