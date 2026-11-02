import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BarChart3, Check, ChevronDown, CircleDollarSign, Crosshair, Layers3, RefreshCw, ShieldCheck, Sparkles, Target, TrendingUp, Zap } from 'lucide-react';
import { Link } from 'wouter';
import type { RawCommanderDeck } from '@/data/commanderDecklistsData';
import { useCommanderArchive } from '@/lib/commanderArchive';
import { loadOwnedCollection, type OwnedCard } from '@/lib/manaboxParser';
import { loadOwnedPrecons, type OwnedPreconEntry } from '@/lib/preconInventory';
import { detectInventoryDeckCompletions } from '@/lib/inventoryDeckCompletion';
import { slugify } from '@/hooks/useCommanderDeck';
import { LOCAL_WORKSPACE_CHANGED_EVENT } from '@/lib/localWorkspace';
import preconColorIdentities from '@/data/preconColorIdentities.json';
import { BridgeTransferPlanner } from '@/components/BridgeTransferPlanner';
import { DeckDiffBuilder } from '@/components/DeckDiffBuilder';
import { planBridgeTransfers } from '@/lib/bridgeTransferPlanning';

const budgetTiers = [25, 50, 100, 250] as const;
type Budget = typeof budgetTiers[number];

type UpgradeOption = {
  name: string;
  price: number;
  role: string;
  lane: string;
  owned?: string;
  reason: string;
};

const invisibleWomanUpgrades: UpgradeOption[] = [
  { name: 'Arcane Signet', price: 1.5, role: 'Mana', lane: 'Core shell', reason: 'Reliable four-color fixing that belongs in every version of the deck.' },
  { name: 'Wall of Denial', price: 2, role: 'Wall', lane: 'Wall conversion', reason: 'An efficient defender that protects the board while Invisible Woman rewards the defensive posture.' },
  { name: 'High Alert', price: 4, role: 'Engine', lane: 'Wall conversion', reason: 'Turns toughness into power and gives the Wall package a real clock.' },
  { name: 'Tower Defense', price: 1, role: 'Protection', lane: 'Wall conversion', reason: 'A budget combat trick that makes the entire Wall board lethal for a turn.' },
  { name: 'Assault Formation', price: 8, role: 'Engine', lane: 'Wall conversion', reason: 'A redundant toughness-matters engine that also lets the deck attack through stalled boards.' },
  { name: 'Shark Typhoon', price: 18, role: 'Payoff', lane: 'Blink / value', reason: 'Turns the deck’s spell-heavy turns into evasive threats without abandoning the defensive shell.' },
  { name: 'Monastery Mentor', price: 12, role: 'Payoff', lane: 'Blink / value', reason: 'Converts the cheap protection and interaction package into a growing board.' },
  { name: 'Storm-Kiln Artist', price: 5, role: 'Ramp', lane: 'Blink / value', reason: 'Provides explosive mana when the upgraded list chains noncreature spells.' },
  { name: 'Heroic Intervention', price: 8, role: 'Protection', lane: 'High power', reason: 'Protects the engine from sweepers and preserves a wide Wall or token board.' },
  { name: 'Teferi’s Protection', price: 28, role: 'Protection', lane: 'High power', reason: 'The premium protection upgrade when the deck must survive a full-table reset.' },
  { name: 'Approach of the Second Sun', price: 5, role: 'Win condition', lane: 'Alternate win', reason: 'Adds a clean alternate win that rewards the deck’s natural draw-and-defend posture.' },
  { name: 'Cyclonic Rift', price: 35, role: 'Interaction', lane: 'High power', reason: 'A premium reset button for tables where the Wall conversion needs a tempo swing.' },
];

const powerModes = [
  { id: 'stock', label: 'Stock+', detail: 'Keep the Fantastic Four identity. Add only efficient cards and low-friction protection.', target: 'Power 5–6' },
  { id: 'focused', label: 'Focused Wall', detail: 'Make toughness, defender density, and alternate combat math the primary plan.', target: 'Power 6–7' },
  { id: 'value', label: 'Blink / value', detail: 'Trade some Wall purity for spell velocity, token payoffs, and repeatable ETB value.', target: 'Power 7' },
  { id: 'high', label: 'High-power', detail: 'Use premium protection, compact interaction, and a tighter alternate-win package.', target: 'Power 8' },
];

function cardNames(deck: RawCommanderDeck) {
  return [...deck.commander, ...deck.cards].map(card => card.name.toLowerCase());
}

function identityFor(deck: RawCommanderDeck) {
  const key = `${slugify(deck.name)}-${deck.set_code.toLowerCase()}`;
  return (preconColorIdentities.records as Record<string, { category?: string }>)[key]?.category || 'UNKNOWN';
}

function ownedMap(cards: OwnedCard[]) {
  return new Map(cards.map(card => [card.name.toLowerCase(), card.quantity]));
}

function money(value: number) {
  return `$${value.toFixed(0)}`;
}

function Stat({ label, value, detail, tone = 'text-primary' }: { label: string; value: string; detail: string; tone?: string }) {
  return <div className="border border-border bg-card p-4"><p className="font-mono text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</p><p className={`mt-2 text-3xl font-black ${tone}`}>{value}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p></div>;
}

function SectionHeader({ eyebrow, title, detail, icon: Icon }: { eyebrow: string; title: string; detail: string; icon: typeof Target }) {
  return <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5"><div><p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-primary">{eyebrow}</p><h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">{title}</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{detail}</p></div><Icon className="h-8 w-8 shrink-0 text-primary" aria-hidden="true" /></div>;
}

export default function PreconPortfolioWorkspace() {
  const { decks, loading } = useCommanderArchive();
  const [ownedPrecons, setOwnedPrecons] = useState<OwnedPreconEntry[]>(() => loadOwnedPrecons());
  const [cards, setCards] = useState<OwnedCard[]>(() => loadOwnedCollection());
  const [budget, setBudget] = useState<Budget>(50);
  const [mode, setMode] = useState('focused');
  const [expandedUpgrade, setExpandedUpgrade] = useState<string | null>(null);

  const refresh = () => { setOwnedPrecons(loadOwnedPrecons()); setCards(loadOwnedCollection()); };
  useEffect(() => { window.addEventListener(LOCAL_WORKSPACE_CHANGED_EVENT, refresh); return () => window.removeEventListener(LOCAL_WORKSPACE_CHANGED_EVENT, refresh); }, []);

  const deckList = decks || [];
  const fantasticFour = useMemo(() => deckList.find(deck => deck.name.toLowerCase() === 'the fantastic four' && deck.set_code.toLowerCase() === 'msc'), [deckList]);
  const abzanArmor = useMemo(() => deckList.find(deck => deck.name.toLowerCase() === 'abzan armor' && deck.set_code.toLowerCase() === 'tdc'), [deckList]);
  const wallTransferRows = useMemo(() => planBridgeTransfers(cards, abzanArmor), [abzanArmor, cards]);
  const ownedSlugs = useMemo(() => new Set(ownedPrecons.map(entry => entry.deckSlug.toLowerCase())), [ownedPrecons]);
  const owned = useMemo(() => ownedMap(cards), [cards]);
  const coverage = useMemo(() => detectInventoryDeckCompletions(deckList, cards, slugify), [cards, deckList]);
  const costBasis = ownedPrecons.reduce((sum, entry) => sum + (entry.costBasisUsd || 0) * (entry.quantity || 1), 0);
  const totalCopies = cards.reduce((sum, card) => sum + card.quantity, 0);
  const readyDecks = deckList.filter(deck => coverage.get(slugify(deck.name).toLowerCase())?.complete).length;
  const colorsCovered = new Set(deckList.filter(deck => ownedSlugs.has(slugify(deck.name).toLowerCase()) || coverage.get(slugify(deck.name).toLowerCase())?.complete).map(identityFor)).size;

  const buyNext = useMemo(() => deckList.filter(deck => !ownedSlugs.has(slugify(deck.name).toLowerCase())).map(deck => {
    const status = coverage.get(slugify(deck.name).toLowerCase());
    const category = identityFor(deck);
    const categoryGap = ['SIMIC-UG', 'DIMIR-UB', 'ORZHOV-WB'].includes(category) ? 34 : 0;
    const coverageScore = status?.coveragePercent || 0;
    const overlap = Array.from(new Set(cardNames(deck))).filter(name => owned.has(name)).length;
    const score = categoryGap + coverageScore + Math.min(24, overlap * 2);
    return { deck, category, coverage: coverageScore, overlap, score };
  }).sort((a, b) => b.score - a.score || b.overlap - a.overlap).slice(0, 5), [coverage, deckList, owned, ownedSlugs]);

  const selectedUpgrades = useMemo(() => invisibleWomanUpgrades.filter(card => card.price <= budget && (mode !== 'high' || card.lane === 'High power' || card.lane === 'Core shell' || card.lane === 'Wall conversion')).sort((a, b) => Number(Boolean(owned.get(a.name.toLowerCase()))) - Number(Boolean(owned.get(b.name.toLowerCase()))) || a.price - b.price), [budget, mode, owned]);
  const upgradeSpend = selectedUpgrades.reduce((sum, card) => sum + (owned.has(card.name.toLowerCase()) ? 0 : card.price), 0);
  const ownedUpgradeCount = selectedUpgrades.filter(card => owned.has(card.name.toLowerCase())).length;

  const overlapRows = useMemo(() => {
    const focus = deckList.filter(deck => ['the fantastic four', 'abzan armor', 'most wanted', 'giada, font of hope'].some(name => deck.name.toLowerCase().includes(name))).slice(0, 4);
    const rows: Array<{ left: string; right: string; overlap: number; shared: string[] }> = [];
    for (let i = 0; i < focus.length; i += 1) for (let j = i + 1; j < focus.length; j += 1) {
      const right = new Set(cardNames(focus[j]));
      const shared = Array.from(new Set(cardNames(focus[i]))).filter(name => right.has(name));
      rows.push({ left: focus[i].name, right: focus[j].name, overlap: shared.length, shared: shared.slice(0, 5) });
    }
    return rows.sort((a, b) => b.overlap - a.overlap);
  }, [deckList]);

  const gapMissions = useMemo(() => {
    const categories = ['SIMIC-UG', 'DIMIR-UB', 'ORZHOV-WB'];
    return categories.map(category => ({ category, label: category === 'SIMIC-UG' ? 'Simic engine' : category === 'DIMIR-UB' ? 'Dimir control / graveyard' : 'Orzhov attrition', count: deckList.filter(deck => identityFor(deck) === category && (ownedSlugs.has(slugify(deck.name).toLowerCase()) || coverage.get(slugify(deck.name).toLowerCase())?.complete)).length, candidates: deckList.filter(deck => identityFor(deck) === category && !ownedSlugs.has(slugify(deck.name).toLowerCase())).slice(0, 2).map(deck => deck.name) }));
  }, [coverage, deckList, ownedSlugs]);

  return <main className="container py-6 sm:py-10">
    <header className="border-2 border-primary bg-primary/5 p-5 sm:p-8"><div className="flex flex-wrap items-start justify-between gap-5"><div><p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-primary">Precon operating system · phases 1–4</p><h1 className="mt-2 max-w-4xl text-3xl font-black tracking-tight sm:text-5xl">Your collection, turned into a build queue.</h1><p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">A portfolio view for sealed products and scanned cards, with an Invisible Woman budget lab, cross-deck overlap, collection missions, and release-intelligence hooks. Nothing here treats sealed ownership as opened-card coverage.</p></div><BarChart3 className="h-12 w-12 text-primary" aria-hidden="true" /></div><div className="mt-6 flex flex-wrap gap-2"><Link href="/precon-collection" className="inline-flex min-h-11 items-center gap-2 border border-border bg-background px-4 py-2 text-sm font-bold"><RefreshCw className="h-4 w-4" /> Command center</Link><Link href="/precons" className="inline-flex min-h-11 items-center gap-2 bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">Browse precons <ArrowRight className="h-4 w-4" /></Link><button type="button" onClick={refresh} className="inline-flex min-h-11 items-center gap-2 border border-border bg-background px-4 py-2 text-sm font-bold">Refresh workspace</button></div></header>

    <section className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5" aria-label="Precon portfolio metrics"><Stat label="Sealed products" value={`${ownedPrecons.length}`} detail="Separate cost-basis ledger" /><Stat label="Cost basis" value={money(costBasis)} detail="Recorded acquisitions" /><Stat label="Scanned copies" value={`${totalCopies}`} detail={`${cards.length} exact-printing entries`} /><Stat label="Ready decks" value={`${readyDecks}`} detail="100% scan coverage" tone="text-emerald-700" /><Stat label="Identities represented" value={`${colorsCovered}`} detail="Based on owned or complete decks" tone="text-amber-700" /></section>

    <section className="mt-6 border-2 border-border bg-card p-5 sm:p-7"><SectionHeader eyebrow="Phase 1 · buy-next engine" title="What should I buy next?" detail="The score rewards color-gap coverage, cards already sitting in your scanned pool, and decks that create a useful new play pattern. It is a prioritization aid, not a blind product recommendation." icon={Target} /><div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">{buyNext.map(row => <Link key={`${row.deck.set_code}-${row.deck.name}`} href={`/deck/${row.deck.set_code.toLowerCase()}/${slugify(row.deck.name)}`} className="group border border-border bg-background p-4 hover:border-primary"><div className="flex items-start justify-between gap-3"><div><p className="font-mono text-[10px] font-black uppercase tracking-widest text-primary">{row.category}</p><h3 className="mt-1 font-black group-hover:text-primary">{row.deck.name}</h3></div><span className="font-mono text-xs font-black text-amber-700">{row.score}</span></div><div className="mt-4 grid grid-cols-2 gap-2 font-mono text-[10px] uppercase text-muted-foreground"><span>{row.coverage}% covered</span><span>{row.overlap} shared cards</span></div><div className="mt-3 h-1.5 bg-muted"><div className="h-full bg-primary" style={{ width: `${Math.min(100, row.score)}%` }} /></div><p className="mt-3 text-xs leading-5 text-muted-foreground">{row.category === 'SIMIC-UG' || row.category === 'DIMIR-UB' || row.category === 'ORZHOV-WB' ? 'Fills a tracked color gap.' : 'Adds a new shell with collection overlap.'}</p></Link>)}</div>{!loading && buyNext.length === 0 && <p className="mt-5 text-sm text-muted-foreground">Your indexed archive is fully represented by the current sealed or scanned workspace.</p>}</section>

    <section className="mt-6 border-2 border-primary/40 bg-card p-5 sm:p-7"><SectionHeader eyebrow="Phase 1 · dynamic upgrade lab" title="Invisible Woman budget selector" detail="Change the budget or play-style lane and the list changes immediately. Owned cards are pulled to the top and removed from the estimated cash spend." icon={CircleDollarSign} /><div className="mt-5 grid gap-5 lg:grid-cols-[.8fr_1.2fr]"><div><p className="font-mono text-[10px] font-black uppercase tracking-widest text-primary">Upgrade budget</p><div className="mt-3 grid grid-cols-4 gap-2">{budgetTiers.map(tier => <button key={tier} type="button" onClick={() => setBudget(tier)} className={`border px-3 py-3 font-mono text-xs font-black ${budget === tier ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background hover:border-primary'}`}>{money(tier)}</button>)}</div><p className="mt-4 font-mono text-[10px] font-black uppercase tracking-widest text-primary">Build mode</p><div className="mt-3 space-y-2">{powerModes.map(item => <button key={item.id} type="button" onClick={() => setMode(item.id)} className={`flex w-full items-start justify-between gap-3 border p-3 text-left ${mode === item.id ? 'border-primary bg-primary/5' : 'border-border bg-background hover:border-primary'}`}><span><strong className="block text-sm">{item.label}</strong><span className="mt-1 block text-xs leading-5 text-muted-foreground">{item.detail}</span></span><span className="shrink-0 font-mono text-[10px] font-black uppercase text-primary">{item.target}</span></button>)}</div></div><div><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="font-mono text-[10px] font-black uppercase tracking-widest text-primary">Visible upgrade package</p><h3 className="mt-1 text-xl font-black">{selectedUpgrades.length} cards · {money(upgradeSpend)} new spend</h3></div><span className="border border-emerald-600/30 bg-emerald-600/10 px-2 py-1 font-mono text-[10px] font-black uppercase text-emerald-800">{ownedUpgradeCount} owned</span></div><div className="mt-4 divide-y divide-border border-y border-border">{selectedUpgrades.map(card => { const isOwned = owned.has(card.name.toLowerCase()); const isOpen = expandedUpgrade === card.name; return <div key={card.name}><button type="button" onClick={() => setExpandedUpgrade(isOpen ? null : card.name)} className="flex w-full items-center justify-between gap-3 py-3 text-left hover:bg-primary/5"><span className="min-w-0"><strong className="block truncate text-sm">{card.name}</strong><span className="font-mono text-[10px] uppercase text-muted-foreground">{card.role} · {card.lane}</span></span><span className="flex shrink-0 items-center gap-2 font-mono text-xs font-black">{isOwned ? <span className="text-emerald-700">OWNED</span> : money(card.price)}<ChevronDown className={`h-4 w-4 transition ${isOpen ? 'rotate-180' : ''}`} /></span></button>{isOpen && <div className="border-t border-border bg-background px-3 py-3 text-xs leading-5 text-muted-foreground">{card.reason}{isOwned && ' This copy is already present in your scanned collection, so the selector removes it from the purchase estimate.'}</div>}</div>; })}</div><p className="mt-3 text-xs leading-5 text-muted-foreground">Budget tiers are planning caps; verify exact printings and current prices before buying. The selector is intentionally transparent about approximate spend.</p></div></div></section>

    <section className="mt-6 border-2 border-border bg-card p-5 sm:p-7"><SectionHeader eyebrow="Phase 2 · ecosystem bridges" title="Where do my decks overlap?" detail="This heatmap-style view surfaces shared card names across the decks most relevant to your current projects. Use it to decide whether to transfer, buy a duplicate, or keep a card reserved." icon={Layers3} /><div className="mt-5 grid gap-3 md:grid-cols-2">{overlapRows.length ? overlapRows.map(row => <div key={`${row.left}-${row.right}`} className="border border-border bg-background p-4"><div className="flex items-center justify-between gap-3"><div><p className="font-black">{row.left}</p><p className="text-xs text-muted-foreground">↔ {row.right}</p></div><span className="font-mono text-sm font-black text-primary">{row.overlap} shared</span></div><p className="mt-3 text-xs leading-5 text-muted-foreground">{row.shared.length ? row.shared.join(' · ') : 'No sampled shared cards in the indexed lists.'}</p><button type="button" className="mt-3 font-mono text-[10px] font-black uppercase text-primary underline">Reserve transfer package</button></div>) : <p className="text-sm text-muted-foreground">The focused deck names are not yet present in this archive slice. Import the full ManaBox export to unlock exact transfer packages.</p>}</div><div className="mt-5 border-t border-border pt-4"><Link href="/precon-command-center#transfer-lab" className="inline-flex items-center gap-2 text-sm font-bold text-primary underline">Open full transfer lab <ArrowRight className="h-4 w-4" /></Link></div></section>
    <BridgeTransferPlanner inventory={cards} sourceDeck={abzanArmor} />
    <DeckDiffBuilder deck={fantasticFour} deckOptions={deckList} transferRows={wallTransferRows} />

    <section className="mt-6 grid gap-5 lg:grid-cols-[1fr_1fr]"><div className="border-2 border-border bg-card p-5 sm:p-7"><SectionHeader eyebrow="Phase 3 · playgroup calibration" title="Choose the deck’s job" detail="Power mode changes the recommendation language, not the ownership facts. Keep this explicit so a premium card does not quietly turn a precon into a different deck." icon={Zap} /><div className="mt-5 space-y-2">{powerModes.map(item => <div key={item.id} className={`border p-3 ${mode === item.id ? 'border-primary bg-primary/5' : 'border-border bg-background'}`}><div className="flex justify-between gap-3"><strong>{item.label}</strong><span className="font-mono text-[10px] font-black uppercase text-primary">{item.target}</span></div><p className="mt-1 text-xs leading-5 text-muted-foreground">{item.detail}</p></div>)}</div></div><div className="border-2 border-border bg-card p-5 sm:p-7"><SectionHeader eyebrow="Phase 3 · collection missions" title="Close the gaps deliberately" detail="A mission is a measurable reason to buy, not a generic completionist checklist." icon={Crosshair} /><div className="mt-5 space-y-3">{gapMissions.map((mission, index) => <div key={mission.category} className="border border-border bg-background p-4"><div className="flex items-center justify-between gap-3"><div><h3 className="font-black">{mission.label}</h3><p className="font-mono text-[10px] uppercase text-muted-foreground">{mission.category}</p></div><span className={`font-mono text-xs font-black uppercase ${index === 0 ? 'text-rose-700' : 'text-muted-foreground'}`}>{mission.count ? `${mission.count} represented` : 'Open mission'}</span></div><p className="mt-2 text-xs leading-5 text-muted-foreground">Candidate shells: {mission.candidates.length ? mission.candidates.join(' · ') : 'Archive candidates pending'}</p></div>)}</div></div></section>

    <section className="mt-6 border-2 border-border bg-card p-5 sm:p-7"><SectionHeader eyebrow="Phase 4 · automated intelligence" title="Release and market watch hooks" detail="The daily GitHub pipeline now supplies the raw signals. This panel keeps precon release intelligence in the same decision flow as your collection goals." icon={TrendingUp} /><div className="mt-5 grid gap-3 md:grid-cols-3"><Link href="/spoiler-calendar" className="border border-border bg-background p-4 hover:border-primary"><ShieldCheck className="h-5 w-5 text-primary" /><h3 className="mt-3 font-black">Upcoming releases</h3><p className="mt-2 text-xs leading-5 text-muted-foreground">Official dates, product type, preorder context, and announced Commander decks.</p></Link><Link href="/market-watch" className="border border-border bg-background p-4 hover:border-primary"><TrendingUp className="h-5 w-5 text-emerald-700" /><h3 className="mt-3 font-black">Daily market terminal</h3><p className="mt-2 text-xs leading-5 text-muted-foreground">Current movers that can change buy, wait, or singles-first recommendations.</p></Link><Link href="/roadmap" className="border border-border bg-background p-4 hover:border-primary"><Sparkles className="h-5 w-5 text-amber-700" /><h3 className="mt-3 font-black">Automation roadmap</h3><p className="mt-2 text-xs leading-5 text-muted-foreground">Track the next integrations: alerts, acquisition timelines, and saved missions.</p></Link></div><div className="mt-5 border-t border-border pt-4 text-xs leading-5 text-muted-foreground"><Check className="mr-2 inline h-4 w-4 text-emerald-700" />Phase 4 is intentionally connected to the existing GitHub scanner rather than duplicating market data inside the precon page.</div></section>
  </main>;
}
