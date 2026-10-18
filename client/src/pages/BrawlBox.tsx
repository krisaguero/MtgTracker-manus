import React, { useEffect } from 'react';
import { ArrowLeft, ArrowRight, CircleAlert, ExternalLink, ShieldCheck } from 'lucide-react';
import { Link } from 'wouter';
import brawlBoxData from '@/data/brawlBox2026.json';

type BrawlBoxCard = { name: string; quantity: number; colorIdentity: string[]; commanderLegal: boolean; note?: string };
type BrawlBoxGroup = { label: string; cards: BrawlBoxCard[] };
type BrawlBoxDeck = {
  id: string;
  rank: number;
  title: string;
  subtitle: string;
  commander: string;
  commanderColorIdentityLabel: string;
  commanderColorIdentity: string[];
  commanderCommanderLegal: boolean;
  commanderBrawlLegal: boolean;
  targetSize: number;
  sourceStatedTotal: number;
  visibleTotal: number;
  sourceStatedCuts: number;
  sourceCountNote: string;
  sourceIssues: string[];
  offColorCards: string[];
  groups: BrawlBoxGroup[];
  sideboardGroups?: BrawlBoxGroup[];
  sideboardNote?: string;
  deckType?: string;
  setupNotes?: string[];
  storageNotes?: string[];
  houseRuleExtras?: string[];
  formatNote?: string;
};

const decks = brawlBoxData.decks as BrawlBoxDeck[];
const cardSearch = (name: string) => `https://scryfall.com/search?q=${encodeURIComponent(`!"${name}"`)}`;
const commanderRecords: Record<string, string> = {
  'Dr. Madison Li': 'https://scryfall.com/card/pip/3/dr-madison-li',
  'Araumi of the Dead Tide': 'https://scryfall.com/card/cmr/267/araumi-of-the-dead-tide',
  'Marchesa, the Black Rose': cardSearch('Marchesa, the Black Rose'),
};

function colorName(color: string) {
  return ({ W: 'White', U: 'Blue', B: 'Black', R: 'Red', G: 'Green' } as Record<string, string>)[color] || color;
}

function DeckCard({ deck }: { deck: BrawlBoxDeck }) {
  const listedCount = deck.groups.reduce((total, group) => total + group.cards.reduce((groupTotal, card) => groupTotal + card.quantity, 0), 0);
  const sideboardCount = deck.sideboardGroups?.reduce((total, group) => total + group.cards.reduce((groupTotal, card) => groupTotal + card.quantity, 0), 0) ?? 0;
  const offColor = new Set(deck.offColorCards);

  return <article id={deck.id} className="scroll-mt-20 border-2 border-border bg-card">
    <header className="border-b border-border bg-primary/5 p-5 sm:p-7">
      <div className="flex flex-wrap items-center gap-2">
        <span className="border border-primary/40 bg-background px-2 py-1 font-mono text-[9px] font-black uppercase tracking-wider text-primary">Entry {String(deck.rank).padStart(2, '0')}</span>
        <span className="border border-border bg-background px-2 py-1 font-mono text-[9px] font-black uppercase tracking-wider text-muted-foreground">Self-built · not tuned</span>
        <span className="border border-border bg-background px-2 py-1 font-mono text-[9px] font-black uppercase tracking-wider text-muted-foreground">Commander preview</span>
        {deck.deckType === 'custom-non-precon' && <span className="border border-primary/40 bg-background px-2 py-1 font-mono text-[9px] font-black uppercase tracking-wider text-primary">Custom · non-precon Brawlternative</span>}
      </div>
      <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">{deck.title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{deck.subtitle}</p>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
        <span className="border border-border bg-background px-3 py-2"><strong>Commander:</strong> {deck.commander}</span>
        <span className="border border-border bg-background px-3 py-2"><strong>Identity:</strong> {deck.commanderColorIdentityLabel}</span>
        <span className="border border-border bg-background px-3 py-2"><strong>{deck.deckType === 'custom-non-precon' ? 'Deck incl. commander:' : 'Main deck:'}</strong> {listedCount} card copies</span>
        {sideboardCount > 0 && <span className="border border-border bg-background px-3 py-2"><strong>Sideboard:</strong> {sideboardCount} optional cards</span>}
        <span className="border border-border bg-background px-3 py-2"><strong>Original source:</strong> {deck.sourceStatedTotal}{deck.sourceStatedCuts ? ` · ${deck.sourceStatedCuts} cuts claimed` : ' cards'}</span>
        <span className="border border-border bg-background px-3 py-2"><strong>Target:</strong> {deck.targetSize}</span>
        <a href={commanderRecords[deck.commander]} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center gap-1 border border-border bg-background px-3 py-2 font-semibold text-primary hover:border-primary">Scryfall card record <ExternalLink className="h-3.5 w-3.5" /></a>
      </div>
      <div className={`mt-4 border-l-4 p-4 text-sm leading-6 ${deck.visibleTotal !== deck.sourceStatedTotal || deck.offColorCards.length ? 'border-amber-600 bg-amber-500/5' : 'border-emerald-600 bg-emerald-600/5'}`}>
        <p><strong>Source-list audit:</strong> {deck.sourceCountNote}</p>
        <p className="mt-2"><strong>Format status:</strong> Commander legality is marked {deck.commanderCommanderLegal ? 'legal' : 'not legal'} and official Brawl legality is marked {deck.commanderBrawlLegal ? 'legal' : 'not legal'} for this commander in the Scryfall card data.</p>
        {deck.formatNote && <p className="mt-2">{deck.formatNote}</p>}
        {deck.offColorCards.length > 0 && <p className="mt-2"><strong>Color-identity warning:</strong> {deck.offColorCards.join(', ')} has an identity outside {deck.commanderColorIdentityLabel}. The supplied card stays in this display; no automatic cut or replacement was made.</p>}
        {deck.sourceIssues.map((issue) => <p key={issue} className="mt-2">{issue}</p>)}
      </div>
    </header>
    <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-6 xl:grid-cols-3">
      {deck.groups.map((group) => {
        const groupCount = group.cards.reduce((total, card) => total + card.quantity, 0);
        return <section key={group.label} className="border border-border bg-background p-4" aria-label={`${group.label} card list`}>
          <h3 className="flex items-start justify-between gap-3 border-b border-border pb-2 font-mono text-[10px] font-black uppercase tracking-wider"><span>{group.label}</span><span>{groupCount}</span></h3>
          <ul className="mt-2 divide-y divide-border/70">{group.cards.map((card, index) => <li key={`${card.name}-${index}`} className="flex items-baseline justify-between gap-3 py-1.5 text-xs">
            <div><span><span className="mr-2 font-mono font-bold text-muted-foreground">{card.quantity}×</span><a href={cardSearch(card.name)} target="_blank" rel="noopener noreferrer" className="hover:text-primary hover:underline">{card.name}</a>{offColor.has(card.name) && <span className="ml-2 inline-block border border-amber-700/40 bg-amber-500/10 px-1 py-0.5 font-mono text-[8px] font-black uppercase text-amber-800 dark:text-amber-300" title={`Card identity: ${card.colorIdentity.map(colorName).join(', ')}`}>Off identity</span>}</span>
            {card.note && <p className="mt-1 text-xs leading-5 text-muted-foreground">{card.note}</p>}</div>
            </li>)}</ul>
        </section>;
      })}
    </div>
    {deck.setupNotes && deck.setupNotes.length > 0 && <section className="border-t border-border p-4 sm:p-6" aria-label={`${deck.commander} setup and storage`}>
      <h3 className="font-mono text-xs font-black uppercase tracking-widest">Setup & storage · house rules</h3>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground">{deck.setupNotes.map((note) => <li key={note}>{note}</li>)}</ul>
      {deck.houseRuleExtras && <p className="mt-3 text-sm leading-6 text-muted-foreground"><strong>Optional secret objectives:</strong> {deck.houseRuleExtras.join(' or ')}. House-rule extras only; not part of the 60-card list.</p>}
      {deck.storageNotes?.map((note) => <p key={note} className="mt-3 text-sm leading-6 text-muted-foreground">{note}</p>)}
    </section>}
    {sideboardCount > 0 && <section className="border-t-2 border-dashed border-border p-4 sm:p-6" aria-label="Sideboard">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-mono text-xs font-black uppercase tracking-widest">Sideboard · optional swaps</h3>
        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{sideboardCount} cards · outside the 60-card main deck</span>
      </div>
      {deck.sideboardNote && <p className="mt-2 max-w-4xl text-xs leading-5 text-muted-foreground">{deck.sideboardNote}</p>}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {deck.sideboardGroups?.map((group) => {
          const groupCount = group.cards.reduce((total, card) => total + card.quantity, 0);
          return <section key={group.label} className="border border-border bg-background p-4" aria-label={`${group.label} sideboard list`}>
            <h4 className="flex items-start justify-between gap-3 border-b border-border pb-2 font-mono text-[10px] font-black uppercase tracking-wider"><span>{group.label}</span><span>{groupCount}</span></h4>
            <ul className="mt-2 divide-y divide-border/70">{group.cards.map((card, index) => <li key={`${card.name}-${index}`} className="flex items-baseline justify-between gap-3 py-1.5 text-xs">
              <span><span className="mr-2 font-mono font-bold text-muted-foreground">{card.quantity}×</span><a href={cardSearch(card.name)} target="_blank" rel="noopener noreferrer" className="hover:text-primary hover:underline">{card.name}</a></span>
            </li>)}</ul>
          </section>;
        })}
      </div>
    </section>}
  </article>;
}

export default function BrawlBox() {
  useEffect(() => {
    document.title = 'Brawlternatives · Custom Brawl Alternatives | MTG Sets Tracker';
    const description = 'Precon-themed and custom non-precon, self-built 60-card Commander-preview decks as a casual alternative to official Brawl. This is a custom house concept, not official Magic Brawl.';
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    const created = !meta;
    if (!meta) { meta = document.createElement('meta'); meta.name = 'description'; document.head.appendChild(meta); }
    meta.content = description;
    return () => { if (created && meta?.parentNode) meta.parentNode.removeChild(meta); };
  }, []);

  return <div className="min-h-screen bg-background text-foreground">
    <header className="border-b-2 border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-12">
        <Link href="/" className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-primary hover:underline"><ArrowLeft className="h-4 w-4" /> Home</Link>
        <div className="mt-6 max-w-4xl">
          <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-primary">Kris Aguero’s personal deck shelf · custom alternatives to Brawl</p>
          <h1 className="mt-3 text-4xl font-black leading-[0.98] tracking-tight sm:text-6xl">Brawlternatives</h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">Precon-themed and custom non-precon, self-built, non-tuned 60-card Commander-preview decks: casual alternatives to official Brawl, not official Magic Brawl lists. Dr. Madison Li is the first entry; Araumi follows, then Marchesa, the Black Rose as a custom non-precon Brawlternative. This custom house concept is not a claim of tuned or tournament-ready lists.</p>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <div className="flex gap-3 border border-primary/40 bg-primary/5 p-4"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><div><h2 className="font-mono text-xs font-black uppercase tracking-widest">Personal data omitted</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">The source’s Owned counts and proxy annotations are not part of this shared list. Treat any collection or proxy planning as local and provisional while scans are incomplete.</p></div></div>
          <div className="flex gap-3 border border-amber-600/50 bg-amber-500/5 p-4"><CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-400" /><div><h2 className="font-mono text-xs font-black uppercase tracking-widest">Not official Brawl</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">The commanders’ Scryfall format statuses are shown with each entry. Brawlternatives are custom Commander-preview builds—not official Brawl lists or regulation 100-card Commander decks. Marchesa is a non-precon build.</p></div></div>
          <div className="border border-border bg-card p-4"><h2 className="font-mono text-xs font-black uppercase tracking-widest">Separate from Retro Battle Box</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">The Retro Battle Box remains its own shared set of nine non-Commander 60-card duel decks.</p><Link href="/battle-box" className="mt-2 inline-flex items-center gap-1 font-mono text-[10px] font-black uppercase tracking-wider text-primary underline">Open Retro Battle Box <ArrowRight className="h-3.5 w-3.5" /></Link></div>
        </div>
        <p className="mt-4 text-[10px] leading-5 text-muted-foreground">Card names, color identity, and legality checked against <a className="underline" href="https://scryfall.com/" target="_blank" rel="noopener noreferrer">Scryfall</a>: existing entries on October 16, 2026; Marchesa on October 17, 2026. Madison’s added basic lands and the cards moved to its optional sideboard are disclosed in its list audit. Marchesa’s notes clarify card interactions without changing the supplied card copies.</p>
      </div>
    </header>
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-7 sm:px-8 sm:py-10">
      <nav className="flex flex-wrap gap-2" aria-label="Brawlternatives entries">{decks.map((deck) => <a key={deck.id} href={`#${deck.id}`} className="inline-flex min-h-10 items-center gap-2 border-2 border-border bg-card px-3 py-2 font-mono text-[10px] font-black uppercase hover:border-primary">{String(deck.rank).padStart(2, '0')} · {deck.commander} <ArrowRight className="h-4 w-4" /></a>)}</nav>
      {decks.map((deck) => <DeckCard key={deck.id} deck={deck} />)}
      <section className="border-t-2 border-border pt-5">
        <h2 className="text-xl font-black">Keep the boxes distinct</h2>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">Brawlternatives holds personal, precon-themed and custom non-precon Commander-preview experiments as an alternative to official Brawl. The Retro Battle Box is still the separate, shared non-Commander duel set. Use the Battle Box’s local inventory queue for its nine public lists; this page does not publish scan-derived ownership or proxy flags.</p>
        <div className="mt-4 flex flex-wrap gap-3"><Link href="/battle-box" className="inline-flex min-h-11 items-center gap-2 border-2 border-border px-4 py-2 font-mono text-xs font-black uppercase hover:border-primary">Retro Battle Box <ArrowRight className="h-4 w-4" /></Link><Link href="/battle-box-proxy-print" className="inline-flex min-h-11 items-center gap-2 border-2 border-border px-4 py-2 font-mono text-xs font-black uppercase hover:border-primary">Proxy-print how-to <ArrowRight className="h-4 w-4" /></Link></div>
      </section>
    </main>
  </div>;
}
