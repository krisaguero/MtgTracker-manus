import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Boxes, Check, CircleAlert, Compass, Layers3, RefreshCw, Sparkles, Target, Upload } from 'lucide-react';
import { Link } from 'wouter';
import type { RawCommanderDeck } from '@/data/commanderDecklistsData';
import { useCommanderArchive } from '@/lib/commanderArchive';
import { loadOwnedCollection, type OwnedCard } from '@/lib/manaboxParser';
import { loadOwnedPrecons, type OwnedPreconEntry } from '@/lib/preconInventory';
import { detectInventoryDeckCompletions } from '@/lib/inventoryDeckCompletion';
import { slugify } from '@/hooks/useCommanderDeck';
import { LOCAL_WORKSPACE_CHANGED_EVENT } from '@/lib/localWorkspace';
import preconColorIdentities from '@/data/preconColorIdentities.json';

const GAP_CATEGORIES = ['SIMIC-UG', 'DIMIR-UB', 'ORZHOV-WB'];
const GAP_LABELS: Record<string, string> = { 'SIMIC-UG': 'Simic', 'DIMIR-UB': 'Dimir', 'ORZHOV-WB': 'Orzhov' };

type Coverage = ReturnType<typeof detectInventoryDeckCompletions>;

function cardEntries(deck: RawCommanderDeck) {
  return [...deck.commander, ...deck.cards];
}

function identityFor(deck: RawCommanderDeck) {
  const key = `${slugify(deck.name)}-${deck.set_code.toLowerCase()}`;
  return (preconColorIdentities.records as Record<string, { category?: string; colorIdentity?: string[] }>)[key];
}

function ownedByName(cards: OwnedCard[]) {
  const map = new Map<string, number>();
  cards.forEach((card) => map.set(card.name.toLowerCase(), (map.get(card.name.toLowerCase()) || 0) + card.quantity));
  return map;
}

function Stat({ label, value, detail, tone = 'text-primary' }: { label: string; value: string; detail: string; tone?: string }) {
  return <div className="border border-border bg-card p-4"><p className="font-mono text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</p><p className={`mt-2 text-3xl font-black ${tone}`}>{value}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p></div>;
}

function ProgressBar({ value }: { value: number }) {
  return <div className="mt-3 h-2 w-full bg-muted" aria-label={`${value}% coverage`}><div className="h-full bg-primary transition-[width]" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} /></div>;
}

export default function PreconCollectionCommandCenter() {
  const { decks, loading } = useCommanderArchive();
  const [ownedPrecons, setOwnedPrecons] = useState<OwnedPreconEntry[]>(() => loadOwnedPrecons());
  const [cards, setCards] = useState<OwnedCard[]>(() => loadOwnedCollection());
  const [refreshing, setRefreshing] = useState(false);

  const refresh = () => {
    setRefreshing(true);
    window.requestAnimationFrame(() => {
      setOwnedPrecons(loadOwnedPrecons());
      setCards(loadOwnedCollection());
      setRefreshing(false);
    });
  };

  useEffect(() => {
    window.addEventListener(LOCAL_WORKSPACE_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(LOCAL_WORKSPACE_CHANGED_EVENT, refresh);
  }, []);

  const deckList = decks ?? [];
  const coverage: Coverage = useMemo(() => detectInventoryDeckCompletions(deckList, cards, slugify), [deckList, cards]);
  const ownedSlugs = useMemo(() => new Set(ownedPrecons.map((entry) => entry.deckSlug.toLowerCase())), [ownedPrecons]);
  const completeDecks = useMemo(() => deckList.filter((deck) => coverage.get(slugify(deck.name).toLowerCase())?.complete), [coverage, deckList]);
  const cardPool = useMemo(() => ownedByName(cards), [cards]);

  const stats = useMemo(() => {
    const totalCopies = cards.reduce((sum, card) => sum + card.quantity, 0);
    const costBasis = ownedPrecons.reduce((sum, entry) => sum + (entry.costBasisUsd || 0) * (entry.quantity || 1), 0);
    const nearComplete = deckList.filter((deck) => (coverage.get(slugify(deck.name).toLowerCase())?.coveragePercent || 0) >= 75).length;
    return { totalCopies, costBasis, nearComplete };
  }, [cards, coverage, deckList, ownedPrecons]);

  const colorGaps = useMemo(() => {
    const counts = new Map<string, number>();
    deckList.forEach((deck) => {
      const category = identityFor(deck)?.category;
      if (category) counts.set(category, (counts.get(category) || 0) + (ownedSlugs.has(slugify(deck.name).toLowerCase()) || coverage.get(slugify(deck.name).toLowerCase())?.complete ? 1 : 0));
    });
    return GAP_CATEGORIES.map((category) => ({ category, label: GAP_LABELS[category], count: counts.get(category) || 0 })).sort((a, b) => a.count - b.count);
  }, [coverage, deckList, ownedSlugs]);

  const recommendations = useMemo(() => deckList.filter((deck) => !ownedSlugs.has(slugify(deck.name).toLowerCase())).map((deck) => {
    const status = coverage.get(slugify(deck.name).toLowerCase());
    const category = identityFor(deck)?.category || 'UNKNOWN';
    const categoryBonus = GAP_CATEGORIES.includes(category) ? 30 : 0;
    const coverageBonus = status?.coveragePercent || 0;
    const commanderBonus = deck.commander.length === 1 ? 5 : 0;
    return { deck, status, category, score: categoryBonus + coverageBonus + commanderBonus };
  }).sort((a, b) => b.score - a.score || a.deck.name.localeCompare(b.deck.name)).slice(0, 4), [coverage, deckList, ownedSlugs]);

  const transfers = useMemo(() => deckList.filter((deck) => !ownedSlugs.has(slugify(deck.name).toLowerCase())).map((deck) => {
    const entries = cardEntries(deck);
    const matched = entries.filter((card) => (cardPool.get(card.name.toLowerCase()) || 0) > 0);
    const missing = entries.filter((card) => !(cardPool.get(card.name.toLowerCase()) || 0));
    return { deck, matched: new Set(matched.map((card) => card.name)).size, missing: new Set(missing.map((card) => card.name)).size, coverage: coverage.get(slugify(deck.name).toLowerCase())?.coveragePercent || 0 };
  }).filter((row) => row.matched > 0).sort((a, b) => b.coverage - a.coverage || b.matched - a.matched).slice(0, 3), [cardPool, coverage, deckList, ownedSlugs]);

  return <main className="container py-6 sm:py-10">
    <header className="border-2 border-primary bg-primary/5 p-5 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-primary">Precon collection command center</p><h1 className="mt-2 max-w-4xl text-3xl font-black tracking-tight sm:text-5xl">Own less blindly. Build more deliberately.</h1><p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">A decision layer over sealed precons and exact-printing card scans. Use it to see what is owned, what is nearly buildable, which color gaps matter, and where the next purchase or transfer creates the most value.</p></div><Boxes className="h-12 w-12 text-primary" aria-hidden="true" /></div>
      <div className="mt-6 flex flex-wrap gap-2"><Link href="/precons" className="inline-flex items-center gap-2 bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">Browse precons <ArrowRight className="h-4 w-4" /></Link><Link href="/collection" className="inline-flex items-center gap-2 border border-border bg-background px-4 py-2 text-sm font-bold"><Upload className="h-4 w-4" /> Manage ManaBox</Link><button type="button" onClick={refresh} className="inline-flex items-center gap-2 border border-border bg-background px-4 py-2 text-sm font-bold" disabled={refreshing}><RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh workspace</button></div>
    </header>

    <section className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5" aria-label="Collection health"><Stat label="Sealed inventory" value={`${ownedPrecons.length}`} detail={`${ownedPrecons.reduce((sum, entry) => sum + (entry.quantity || 1), 0)} product units tracked`} /><Stat label="Acquisition cost" value={`$${stats.costBasis.toFixed(0)}`} detail="Recorded cost basis only" /><Stat label="Scanned cards" value={`${stats.totalCopies}`} detail={`${cards.length} exact-printing entries`} /><Stat label="Full deck matches" value={`${completeDecks.length}`} detail="Automatically covered by scans" tone="text-emerald-700" /><Stat label="75%+ ready" value={`${stats.nearComplete}`} detail="Decks close to playable" tone="text-amber-700" /></section>

    <section className="mt-6 grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
      <div className="border-2 border-border bg-card p-5 sm:p-7"><div className="flex items-center gap-2"><Target className="h-5 w-5 text-primary" /><h2 className="text-2xl font-black">Buy next, based on your collection</h2></div><p className="mt-2 text-sm leading-6 text-muted-foreground">Recommendations favor your current color gaps, then reward decks where existing cards reduce the amount you need to buy.</p><div className="mt-5 grid gap-3 sm:grid-cols-2">{loading ? <p className="text-sm text-muted-foreground">Loading Commander archive…</p> : recommendations.map(({ deck, status, category }) => <Link key={deck.name} href={`/deck/${deck.set_code.toLowerCase()}/${slugify(deck.name)}`} className="group border border-border bg-background p-4 hover:border-primary"><div className="flex items-start justify-between gap-3"><div><p className="font-mono text-[10px] font-black uppercase tracking-widest text-primary">{GAP_LABELS[category] || category}</p><h3 className="mt-1 font-black group-hover:text-primary">{deck.name}</h3></div><ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary" /></div><p className="mt-2 text-xs leading-5 text-muted-foreground">{status?.coveragePercent || 0}% of the indexed list is already in the scanned pool.</p><ProgressBar value={status?.coveragePercent || 0} /></Link>)}</div></div>
      <div className="border-2 border-border bg-card p-5 sm:p-7"><div className="flex items-center gap-2"><Compass className="h-5 w-5 text-emerald-700" /><h2 className="text-2xl font-black">Color gaps to close</h2></div><p className="mt-2 text-sm leading-6 text-muted-foreground">These are the first identity gaps I would use to diversify your precon shelf.</p><div className="mt-5 space-y-3">{colorGaps.map((gap, index) => <div key={gap.category} className="border border-border bg-background p-4"><div className="flex items-center justify-between gap-3"><div><p className="font-black">{gap.label}</p><p className="text-xs text-muted-foreground">{gap.category}</p></div><span className={`font-mono text-xs font-black uppercase ${index === 0 ? 'text-rose-700' : 'text-muted-foreground'}`}>{index === 0 ? 'Priority gap' : `${gap.count} represented`}</span></div></div>)}</div><Link href="/precons#precon-color-barometer" className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline">Open full color barometer <ArrowRight className="h-4 w-4" /></Link></div>
    </section>

    <section className="mt-6 border-2 border-border bg-card p-5 sm:p-7"><div className="flex items-center gap-2"><Layers3 className="h-5 w-5 text-violet-700" /><h2 className="text-2xl font-black">Transfer lab preview</h2></div><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">These targets have the strongest overlap with cards already sitting in your scanned pool. This is a planning view; it does not reassign cards or pretend a sealed deck has been opened.</p><div className="mt-5 grid gap-3 md:grid-cols-3">{transfers.length ? transfers.map((row) => <Link key={row.deck.name} href={`/deck/${row.deck.set_code.toLowerCase()}/${slugify(row.deck.name)}`} className="border border-border bg-background p-4 hover:border-primary"><div className="flex items-start justify-between gap-2"><h3 className="font-black">{row.deck.name}</h3><ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" /></div><p className="mt-2 text-xs leading-5 text-muted-foreground">{row.matched} unique cards available · {row.missing} unique cards still missing</p><ProgressBar value={row.coverage} /><p className="mt-2 font-mono text-[10px] font-black uppercase tracking-widest text-primary">{row.coverage}% coverage</p></Link>) : <div className="border border-dashed border-border p-5 text-sm text-muted-foreground"><CircleAlert className="mb-2 h-5 w-5 text-amber-600" />Import your full ManaBox export to reveal conditional transfer packages.</div>}</div><div className="mt-5 border-t border-border pt-4"><Link href="/precon-command-center#transfer-lab" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">Open the planning notes <ArrowRight className="h-4 w-4" /></Link></div></section>

    <section className="mt-6 grid gap-3 md:grid-cols-3"><div className="border border-border bg-emerald-500/5 p-4"><Check className="h-5 w-5 text-emerald-700" /><h2 className="mt-3 font-black">Sealed stays separate</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Acquisition cost and product ownership remain distinct from scanned card quantities and exact printings.</p></div><div className="border border-border bg-amber-500/5 p-4"><Sparkles className="h-5 w-5 text-amber-700" /><h2 className="mt-3 font-black">Recommendations stay honest</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Unpriced or missing cards are not assigned pretend values. Coverage is shown as a planning signal, not proof of allocation.</p></div><div className="border border-border bg-primary/5 p-4"><RefreshCw className="h-5 w-5 text-primary" /><h2 className="mt-3 font-black">Import, then refresh</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">The command center reads your local workspace and refreshes after ManaBox imports or other inventory changes.</p></div></section>
  </main>;
}
