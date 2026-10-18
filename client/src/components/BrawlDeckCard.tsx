import React, { useState } from 'react';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { Link } from 'wouter';
import { CardImageZoom } from '@/components/CardImageZoom';
import { brawlDeckPath, cardImage, cardSearch, type BrawlBoxDeck, type BrawlBoxGroup } from '@/lib/brawlDecks';

export type BrawlDeckView = 'list' | 'visual';

const commanderRecords: Record<string, string> = {
  'Dr. Madison Li': 'https://scryfall.com/card/pip/3/dr-madison-li',
  'Araumi of the Dead Tide': 'https://scryfall.com/card/cmr/267/araumi-of-the-dead-tide',
  'Marchesa, the Black Rose': cardSearch('Marchesa, the Black Rose'),
};

function colorName(color: string) {
  return ({ W: 'White', U: 'Blue', B: 'Black', R: 'Red', G: 'Green' } as Record<string, string>)[color] || color;
}

export function BrawlDeckCard({ deck, detail = false, initialView = 'list' }: { deck: BrawlBoxDeck; detail?: boolean; initialView?: BrawlDeckView }) {
  const [view, setView] = useState<BrawlDeckView>(initialView);
  const Heading = detail ? 'h1' : 'h2';
  const listedCount = deck.groups.reduce((total, group) => total + group.cards.reduce((groupTotal, card) => groupTotal + card.quantity, 0), 0);
  const sideboardCount = deck.sideboardGroups?.reduce((total, group) => total + group.cards.reduce((groupTotal, card) => groupTotal + card.quantity, 0), 0) ?? 0;

  return <article id={deck.id} className="scroll-mt-20 border-2 border-border bg-card">
    <header className="border-b border-border bg-primary/5 p-5 sm:p-7">
      <div className="flex flex-wrap items-center gap-2">
        <span className="border border-primary/40 bg-background px-2 py-1 font-mono text-[9px] font-black uppercase tracking-wider text-primary">Entry {String(deck.rank).padStart(2, '0')}</span>
        <span className="border border-border bg-background px-2 py-1 font-mono text-[9px] font-black uppercase tracking-wider text-muted-foreground">Self-built · not tuned</span>
        <span className="border border-border bg-background px-2 py-1 font-mono text-[9px] font-black uppercase tracking-wider text-muted-foreground">Commander preview</span>
        {deck.deckType === 'custom-non-precon' && <span className="border border-primary/40 bg-background px-2 py-1 font-mono text-[9px] font-black uppercase tracking-wider text-primary">Custom · non-precon Brawlternative</span>}
      </div>
      {deck.publicationStatus === 'work-in-progress' && <p className="mx-5 mt-4 border-2 border-amber-600 bg-amber-500/10 p-4 text-sm font-bold text-amber-900 dark:text-amber-200" role="status">{deck.reviewStatus}</p>}
      <Heading className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">{deck.title}</Heading>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{deck.subtitle}</p>
      {!detail && <Link href={brawlDeckPath(deck.id)} className="mt-4 inline-flex min-h-11 items-center gap-2 border-2 border-primary px-4 py-2 font-mono text-xs font-black uppercase text-primary hover:bg-primary/10">Explore deck · list & visual spoiler <ArrowRight className="h-4 w-4" /></Link>}
      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
        <span className="border border-border bg-background px-3 py-2"><strong>Commander:</strong> {deck.commander}</span>
        <span className="border border-border bg-background px-3 py-2"><strong>Identity:</strong> {deck.commanderColorIdentityLabel}</span>
        <span className="border border-border bg-background px-3 py-2"><strong>{deck.deckType === 'custom-non-precon' ? 'Deck incl. commander:' : 'Main deck:'}</strong> {listedCount} card copies</span>
        {sideboardCount > 0 && <span className="border border-border bg-background px-3 py-2"><strong>Sideboard:</strong> {sideboardCount} optional cards</span>}
        <span className="border border-border bg-background px-3 py-2"><strong>Original source:</strong> {deck.sourceStatedTotal}{deck.sourceStatedCuts ? ` · ${deck.sourceStatedCuts} cuts claimed` : ' cards'}</span>
        <span className="border border-border bg-background px-3 py-2"><strong>Target:</strong> {deck.targetSize}</span>
        <a href={commanderRecords[deck.commander] ?? cardSearch(deck.commander)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center gap-1 border border-border bg-background px-3 py-2 font-semibold text-primary hover:border-primary">Scryfall card record <ExternalLink className="h-3.5 w-3.5" /></a>
      </div>
      <div className={`mt-4 border-l-4 p-4 text-sm leading-6 ${deck.publicationStatus === 'work-in-progress' || deck.visibleTotal !== deck.sourceStatedTotal || deck.offColorCards.length ? 'border-amber-600 bg-amber-500/5' : 'border-emerald-600 bg-emerald-600/5'}`}>
        <p><strong>Source-list audit:</strong> {deck.sourceCountNote}</p>
        <p className="mt-2"><strong>Format status:</strong> Commander legality is marked {deck.commanderCommanderLegal ? 'legal' : 'not legal'} and official Brawl legality is marked {deck.commanderBrawlLegal ? 'legal' : 'not legal'} for this commander in the Scryfall card data.</p>
        {deck.formatNote && <p className="mt-2">{deck.formatNote}</p>}
        {deck.offColorCards.length > 0 && <p className="mt-2"><strong>Color-identity warning:</strong> {deck.offColorCards.join(', ')} has an identity outside {deck.commanderColorIdentityLabel}. The supplied card stays in this display; no automatic cut or replacement was made.</p>}
        {deck.sourceIssues.map((issue) => <p key={issue} className="mt-2">{issue}</p>)}
      </div>
    </header>
    <div className="border-b border-border p-4 sm:px-6">
      <div role="group" aria-label={`${deck.commander} deck view`} className="flex flex-wrap gap-2">
        {(['list', 'visual'] as const).map((mode) => <button key={mode} type="button" aria-pressed={view === mode} aria-controls={`${deck.id}-cards`} onClick={() => setView(mode)} className={`min-h-11 border-2 px-4 py-2 font-mono text-xs font-black uppercase focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${view === mode ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary'}`}>{mode === 'list' ? 'Readable decklist' : 'Visual spoiler'}</button>)}
      </div>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">{view === 'visual' ? 'One image per listed card name; quantity labels show all copies. Select an image to enlarge it. Images are representative Scryfall printings, not specified editions or proof of ownership.' : 'Grouped card names, quantities, and strategy notes. Switch to the visual spoiler to browse full card images.'}</p>
    </div>
    <div id={`${deck.id}-cards`}>
      <BrawlDeckGroups groups={deck.groups} deck={deck} view={view} />
    </div>
    {deck.setupNotes && deck.setupNotes.length > 0 && <section className="border-t border-border p-4 sm:p-6" aria-label={`${deck.commander} setup and storage`}>
      <h3 className="font-mono text-xs font-black uppercase tracking-widest">Setup & storage · house rules</h3>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground">{deck.setupNotes.map((note) => <li key={note}>{note}</li>)}</ul>
      {deck.houseRuleExtras && <p className="mt-3 text-sm leading-6 text-muted-foreground"><strong>Optional secret objectives:</strong> {deck.houseRuleExtras.join(' or ')}. House-rule extras only; not part of the 60-card list.</p>}
      {deck.storageNotes?.map((note) => <p key={note} className="mt-3 text-sm leading-6 text-muted-foreground">{note}</p>)}
    </section>}
    {deck.comparisonNotes && <section className="border-t border-border p-4 sm:p-6" aria-label="What changed">
      <h3 className="text-lg font-black">What changed · review notes</h3>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground">{deck.comparisonNotes.map((note) => <li key={note}>{note}</li>)}</ul>
    </section>}
    {deck.upgradeOptions && <section className="border-t border-border p-4 sm:p-6" aria-label="Optional upgrade proposals">
      <h3 className="text-lg font-black">Optional upgrade proposals · not applied</h3>
      <p className="mt-2 text-sm text-muted-foreground">These are separate brainstorming options, not changes to the submitted list. No missing slot or card-name correction is automatically filled.</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">{deck.upgradeOptions.map((option) => <div key={option.title} className="border border-border p-4 text-sm leading-6">
        <h4 className="font-bold">{option.title}</h4>
        {option.cardsIn.length > 0 && <p className="mt-2"><strong>Proposed in:</strong> {option.cardsIn.join(', ')}</p>}
        {option.cardsOut.length > 0 && <p><strong>Proposed out:</strong> {option.cardsOut.join(', ')}</p>}
        <p className="mt-2">{option.rationale}</p><p className="mt-2 text-muted-foreground"><strong>Trade-off:</strong> {option.tradeoff}</p>
        {option.sourceUrls?.map((url, index) => <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="mr-3 inline-block min-h-11 content-center text-primary underline">Card reference {index + 1}</a>)}
      </div>)}</div>
    </section>}
    {deck.sourceLinks && <section className="border-t border-border p-4 sm:p-6" aria-label="Deck rules references"><h3 className="font-bold">Rules references</h3><div className="mt-2 flex flex-wrap gap-3">{deck.sourceLinks.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer" className="min-h-11 content-center text-sm text-primary underline">{source.label}</a>)}</div></section>}
    {sideboardCount > 0 && <section className="border-t-2 border-dashed border-border p-4 sm:p-6" aria-label="Sideboard">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-mono text-xs font-black uppercase tracking-widest">Sideboard · optional swaps</h3>
        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{sideboardCount} cards · outside the 60-card main deck</span>
      </div>
      {deck.sideboardNote && <p className="mt-2 max-w-4xl text-xs leading-5 text-muted-foreground">{deck.sideboardNote}</p>}
      <BrawlDeckGroups groups={deck.sideboardGroups ?? []} deck={deck} view={view} sideboard />
    </section>}
  </article>;
}

function BrawlDeckGroups({ groups, deck, view, sideboard = false }: { groups: BrawlBoxGroup[]; deck: BrawlBoxDeck; view: BrawlDeckView; sideboard?: boolean }) {
  const visual = view === 'visual';
  const offColor = new Set(deck.offColorCards);
  return <div className={`grid gap-4 p-4 sm:p-6 ${visual ? '' : 'sm:grid-cols-2 xl:grid-cols-3'}`}>
    {groups.map((group, groupIndex) => <section key={`${group.label}-${groupIndex}`} className="min-w-0 border border-border bg-background p-4" aria-label={`${group.label} ${sideboard ? 'sideboard' : 'card'} ${visual ? 'visual spoiler' : 'list'}`}>
      <h3 className="flex items-start justify-between gap-3 border-b border-border pb-2 font-mono text-[10px] font-black uppercase tracking-wider"><span>{group.label}</span><span>{group.cards.reduce((total, card) => total + card.quantity, 0)}</span></h3>
      <ul className={visual ? 'mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' : 'mt-2 divide-y divide-border/70'}>{group.cards.map((card, index) => <li key={`${card.name}-${index}`} className={visual ? 'min-w-0 border border-border bg-card p-2' : 'py-1.5 text-xs'}>
        {visual && <div className="aspect-[488/680]">{card.verificationStatus === 'unresolved' ? <div className="flex h-full items-center justify-center border-2 border-dashed border-amber-600 bg-amber-500/5 p-3 text-center text-xs leading-5" role="img" aria-label={`${card.name} — unresolved submitted name`}>Unresolved submitted name. No card image or identity assumed.</div> : <CardImageZoom src={cardImage(card.name)} alt={card.name} />}</div>}
        <div className={visual ? 'mt-2 text-xs leading-5' : ''}><span className="mr-2 font-mono font-bold text-muted-foreground">{card.quantity}×</span><a href={cardSearch(card.name)} target="_blank" rel="noopener noreferrer" className="break-words hover:text-primary hover:underline">{card.name}</a>
          {offColor.has(card.name) && <span className="ml-2 inline-block border border-amber-700/40 bg-amber-500/10 px-1 py-0.5 font-mono text-[8px] font-black uppercase text-amber-800 dark:text-amber-300" title={`Card identity: ${(card.colorIdentity ?? []).map(colorName).join(', ')}`}>Off identity</span>}
          {card.verificationStatus === 'unresolved' && <span className="ml-2 inline-block border border-amber-600 bg-amber-500/10 px-1 py-0.5 font-mono text-[9px] font-black uppercase">Unresolved name · identity & legality unknown</span>}
        </div>
        {card.note && <p className="mt-1 text-xs leading-5 text-muted-foreground">{card.note}</p>}
      </li>)}</ul>
    </section>)}
  </div>;
}
