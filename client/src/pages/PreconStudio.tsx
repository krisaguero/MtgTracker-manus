import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BarChart3, Boxes, Check, CircleDollarSign, Compass, Library, RefreshCw, Sparkles, Target, WandSparkles } from 'lucide-react';
import { Link } from 'wouter';
import { useCommanderArchive } from '@/lib/commanderArchive';
import { loadOwnedCollection, type OwnedCard } from '@/lib/manaboxParser';
import { loadOwnedPrecons, type OwnedPreconEntry } from '@/lib/preconInventory';
import { detectInventoryDeckCompletions } from '@/lib/inventoryDeckCompletion';
import { slugify } from '@/hooks/useCommanderDeck';
import { LOCAL_WORKSPACE_CHANGED_EVENT } from '@/lib/localWorkspace';
import preconColorIdentities from '@/data/preconColorIdentities.json';

type Lane = {
  href: string;
  icon: typeof Library;
  eyebrow: string;
  title: string;
  description: string;
  action: string;
  tone: string;
};

const lanes: Lane[] = [
  { href: '/precons', icon: Library, eyebrow: 'Browse', title: 'Precon library', description: 'Search the chronological archive, compare products, inspect commanders, and mark sealed decks as owned.', action: 'Browse products', tone: 'text-cyan-700' },
  { href: '/collection', icon: Boxes, eyebrow: 'Collect', title: 'Collection & ownership', description: 'Import ManaBox, reconcile exact printings, review sealed cost basis, and measure deck coverage.', action: 'Manage inventory', tone: 'text-amber-700' },
  { href: '/precon-portfolio', icon: Target, eyebrow: 'Upgrade', title: 'Portfolio & upgrade lab', description: 'Run buy-next scoring, budget selectors, transfer planning, deck diffs, reservations, and saved builds.', action: 'Open portfolio lab', tone: 'text-violet-700' },
  { href: '/precon-portfolio/plan/invisible-woman-focused', icon: CircleDollarSign, eyebrow: 'Execute', title: 'Active plan: Invisible Woman', description: 'Resolve transfer-versus-buy decisions, monitor prices, and work through the Fantastic Four upgrade basket.', action: 'Open active plan', tone: 'text-rose-700' },
];

function Stat({ label, value, detail, tone = 'text-primary' }: { label: string; value: string; detail: string; tone?: string }) {
  return <div className="border border-border bg-card p-4"><p className="font-mono text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</p><p className={`mt-2 text-3xl font-black ${tone}`}>{value}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p></div>;
}

function identityFor(deck: { name: string; set_code: string }) {
  const key = `${slugify(deck.name)}-${deck.set_code.toLowerCase()}`;
  return (preconColorIdentities.records as Record<string, { category?: string }>)[key]?.category || 'UNKNOWN';
}

export default function PreconStudio() {
  const { decks, loading } = useCommanderArchive();
  const [ownedPrecons, setOwnedPrecons] = useState<OwnedPreconEntry[]>(() => loadOwnedPrecons());
  const [cards, setCards] = useState<OwnedCard[]>(() => loadOwnedCollection());
  const refresh = () => { setOwnedPrecons(loadOwnedPrecons()); setCards(loadOwnedCollection()); };

  useEffect(() => {
    window.addEventListener(LOCAL_WORKSPACE_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(LOCAL_WORKSPACE_CHANGED_EVENT, refresh);
  }, []);

  const deckList = decks ?? [];
  const coverage = useMemo(() => detectInventoryDeckCompletions(deckList, cards, slugify), [cards, deckList]);
  const ownedSlugs = useMemo(() => new Set(ownedPrecons.map((entry) => entry.deckSlug.toLowerCase())), [ownedPrecons]);
  const completeDecks = deckList.filter((deck) => coverage.get(slugify(deck.name).toLowerCase())?.complete).length;
  const nearComplete = deckList.filter((deck) => (coverage.get(slugify(deck.name).toLowerCase())?.coveragePercent || 0) >= 75).length;
  const costBasis = ownedPrecons.reduce((sum, entry) => sum + (entry.costBasisUsd || 0) * (entry.quantity || 1), 0);
  const totalCopies = cards.reduce((sum, card) => sum + card.quantity, 0);
  const representedIdentities = new Set(deckList.filter((deck) => ownedSlugs.has(slugify(deck.name).toLowerCase()) || coverage.get(slugify(deck.name).toLowerCase())?.complete).map(identityFor)).size;
  const suggestedDecks = useMemo(() => deckList.filter((deck) => !ownedSlugs.has(slugify(deck.name).toLowerCase())).map((deck) => {
    const status = coverage.get(slugify(deck.name).toLowerCase());
    const category = identityFor(deck);
    const gapBonus = ['SIMIC-UG', 'DIMIR-UB', 'ORZHOV-WB'].includes(category) ? 30 : 0;
    return { deck, category, score: gapBonus + (status?.coveragePercent || 0) };
  }).sort((a, b) => b.score - a.score || a.deck.name.localeCompare(b.deck.name)).slice(0, 3), [coverage, deckList, ownedSlugs]);

  return <main className="container py-6 sm:py-10">
    <header className="border-2 border-primary bg-primary/5 p-5 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-5"><div><p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-primary">Unified precon workspace</p><h1 className="mt-2 max-w-4xl text-3xl font-black tracking-tight sm:text-5xl">Precon Studio</h1><p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">One place to browse sealed products, reconcile your collection, choose the next upgrade, and execute a deck plan. The deeper tools remain available, but they no longer compete for attention on the main navigation.</p></div><BarChart3 className="h-12 w-12 text-primary" aria-hidden="true" /></div>
      <div className="mt-6 flex flex-wrap gap-2"><a href="#studio-lanes" className="inline-flex min-h-11 items-center gap-2 bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">Choose a workflow <ArrowRight className="h-4 w-4" /></a><button type="button" onClick={refresh} className="inline-flex min-h-11 items-center gap-2 border border-border bg-background px-4 py-2 text-sm font-bold"><RefreshCw className="h-4 w-4" /> Refresh workspace</button></div>
    </header>

    <section className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5" aria-label="Precon Studio metrics"><Stat label="Sealed products" value={`${ownedPrecons.length}`} detail="Separate cost-basis ledger" /><Stat label="Cost basis" value={`$${costBasis.toFixed(0)}`} detail="Recorded acquisitions" /><Stat label="Scanned copies" value={`${totalCopies}`} detail={`${cards.length} exact-printing entries`} /><Stat label="Ready decks" value={`${completeDecks}`} detail="100% scan coverage" tone="text-emerald-700" /><Stat label="Near-ready" value={`${nearComplete}`} detail="75% or more covered" tone="text-amber-700" /></section>

    <section id="studio-lanes" className="mt-6" aria-labelledby="studio-lanes-title"><div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4"><div><p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-primary">Choose a lane</p><h2 id="studio-lanes-title" className="mt-2 text-2xl font-black sm:text-3xl">What are you trying to do?</h2></div><p className="max-w-md text-sm leading-6 text-muted-foreground">Start with the decision, not the feature name. Studio routes you into the right depth of tool.</p></div><div className="mt-5 grid gap-3 md:grid-cols-2">{lanes.map(({ href, icon: Icon, eyebrow, title, description, action, tone }) => <Link key={href} href={href} className="group border-2 border-border bg-card p-5 transition-colors hover:border-primary"><div className="flex items-start justify-between gap-4"><div><p className="font-mono text-[10px] font-black uppercase tracking-widest text-muted-foreground">{eyebrow}</p><h3 className="mt-2 text-xl font-black group-hover:text-primary">{title}</h3></div><Icon className={`h-6 w-6 ${tone}`} aria-hidden="true" /></div><p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">{description}</p><span className="mt-5 inline-flex items-center gap-2 font-mono text-[10px] font-black uppercase tracking-widest text-primary">{action} <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" /></span></Link>)}</div></section>

    <section className="mt-8 grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
      <div className="border-2 border-border bg-card p-5 sm:p-7"><div className="flex items-center gap-2"><Target className="h-5 w-5 text-primary" /><h2 className="text-2xl font-black">Recommended next purchases</h2></div><p className="mt-2 text-sm leading-6 text-muted-foreground">A compact preview of the Portfolio Lab’s buy-next engine. It favors tracked identity gaps and decks where your scanned collection already reduces the work.</p><div className="mt-5 grid gap-3">{loading ? <p className="text-sm text-muted-foreground">Loading Commander archive…</p> : suggestedDecks.map(({ deck, category, score }) => <Link key={`${deck.set_code}-${deck.name}`} href={`/deck/${deck.set_code.toLowerCase()}/${slugify(deck.name)}`} className="group flex items-center justify-between gap-4 border border-border bg-background p-4 hover:border-primary"><div><p className="font-mono text-[10px] font-black uppercase tracking-widest text-primary">{category}</p><h3 className="mt-1 font-black group-hover:text-primary">{deck.name}</h3></div><span className="flex items-center gap-2 font-mono text-xs font-black text-amber-700">{score}<ArrowRight className="h-4 w-4" /></span></Link>)}</div><Link href="/precon-portfolio" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-primary underline">Open full buy-next engine <ArrowRight className="h-4 w-4" /></Link></div>
      <div className="border-2 border-border bg-card p-5 sm:p-7"><div className="flex items-center gap-2"><Compass className="h-5 w-5 text-emerald-700" /><h2 className="text-2xl font-black">Collection signals</h2></div><p className="mt-2 text-sm leading-6 text-muted-foreground">Your current workspace is tracking {representedIdentities} color or identity categories through sealed ownership or complete scanned decks.</p><div className="mt-5 space-y-3"><div className="border border-border bg-background p-4"><p className="font-mono text-[10px] font-black uppercase tracking-widest text-muted-foreground">Two-layer rule</p><p className="mt-2 text-sm leading-6">Sealed ownership proves you own the product. ManaBox scans prove individual-card coverage. Studio never conflates them.</p></div><div className="border border-border bg-background p-4"><p className="font-mono text-[10px] font-black uppercase tracking-widest text-muted-foreground">Next action</p><p className="mt-2 text-sm leading-6">Import the full ManaBox export to unlock exact transfer packages and printing review decisions.</p></div></div><Link href="/collection" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-primary underline">Open collection controls <ArrowRight className="h-4 w-4" /></Link></div>
    </section>

    <section className="mt-8 border-2 border-primary/40 bg-card p-5 sm:p-7"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex items-center gap-2"><WandSparkles className="h-5 w-5 text-primary" /><p className="font-mono text-[10px] font-black uppercase tracking-widest text-primary">Studio architecture</p></div><h2 className="mt-2 text-2xl font-black">One hub, deeper tools on demand</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">The former Command Center, Collection Command Center, and Portfolio Workspace are now treated as one workflow. These links remain available as focused workspaces for users who need the full instrument panel.</p></div><Sparkles className="h-8 w-8 text-primary" aria-hidden="true" /></div><div className="mt-5 grid gap-3 sm:grid-cols-3"><Link href="/precon-command-center" className="border border-border bg-background p-4 hover:border-primary"><strong className="block">Map the ecosystem</strong><span className="mt-2 block text-xs leading-5 text-muted-foreground">Legacy command map and transfer concepts.</span></Link><Link href="/precon-collection" className="border border-border bg-background p-4 hover:border-primary"><strong className="block">Audit ownership</strong><span className="mt-2 block text-xs leading-5 text-muted-foreground">Full sealed, scan, graph, and review-queue dashboard.</span></Link><Link href="/precon-portfolio" className="border border-border bg-background p-4 hover:border-primary"><strong className="block">Run the lab</strong><span className="mt-2 block text-xs leading-5 text-muted-foreground">Budget upgrades, transfer planner, deck diffs, reservations, and saved builds.</span></Link></div><div className="mt-5 border-t border-border pt-4 text-xs leading-5 text-muted-foreground"><Check className="mr-2 inline h-4 w-4 text-emerald-700" />The deep routes are preserved for direct links and advanced work. Precon Studio is now the recommended entry point.</div></section>
  </main>;
}
