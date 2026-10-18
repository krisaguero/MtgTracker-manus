import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Link } from 'wouter';
import brawlBoxData from '@/data/brawlBox2026.json';
import { BrawlDeckCard } from '@/components/BrawlDeckCard';
import { DeckExportPanel } from '@/components/DeckExportPanel';
import { BuyOnlinePanel } from '@/components/BuyOnlinePanel';
import { brawlDeckPath, brawlDecks, brawlProposedDecks, findBrawlDeck } from '@/lib/brawlDecks';

export default function BrawlDeckDetail({ params }: { params: { deckId: string } }) {
  const routeDeck = findBrawlDeck(params.deckId) ?? brawlProposedDecks.find((entry) => entry.id === params.deckId);
  const sourceDeck = routeDeck?.sourceDeckId ? findBrawlDeck(routeDeck.sourceDeckId) : routeDeck;
  const proposal = sourceDeck ? brawlProposedDecks.find((entry) => entry.sourceDeckId === sourceDeck.id) : undefined;
  const [selection, setSelection] = useState<'proposed' | 'original'>(proposal ? 'proposed' : 'original');
  const [exportSelection, setExportSelection] = useState<'proposed' | 'original'>(proposal ? 'proposed' : 'original');
  const deck = (selection === 'proposed' ? proposal : sourceDeck) ?? routeDeck;
  const exportDeck = (exportSelection === 'proposed' ? proposal : sourceDeck) ?? routeDeck;

  useEffect(() => {
    setSelection(proposal ? 'proposed' : 'original');
    setExportSelection(proposal ? 'proposed' : 'original');
  }, [params.deckId]);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = deck ? `${deck.publicationStatus === 'work-in-progress' ? 'WIP · ' : ''}${deck.title} · Brawlternatives | MTG Sets Tracker` : 'Deck not found · Brawlternatives | MTG Sets Tracker';
    const previousMeta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const previousDescription = previousMeta?.content;
    const meta = previousMeta ?? document.createElement('meta');
    meta.name = 'description';
    meta.content = deck ? `${deck.subtitle} Browse the readable decklist or visual spoiler. Custom casual Commander preview, not official Brawl or regulation Commander.` : 'This deck is not in the published Brawlternatives shelf.';
    if (!previousMeta) document.head.appendChild(meta);
    return () => {
      document.title = previousTitle;
      if (previousMeta) previousMeta.content = previousDescription ?? '';
      else meta.remove();
    };
  }, [deck]);

  if (!deck || !exportDeck) return <main className="mx-auto min-h-[60vh] max-w-4xl px-4 py-12">
    <h1 className="text-3xl font-black">Brawlternative not found</h1>
    <p className="mt-4 text-muted-foreground">This deck is not in the published shelf. Choose an available entry from Brawlternatives.</p>
    <Link href="/brawl-box" className="mt-6 inline-flex min-h-11 items-center gap-2 font-bold text-primary underline"><ArrowLeft className="h-4 w-4" /> All Brawlternatives</Link>
  </main>;

  return <main className="min-h-screen bg-background text-foreground">
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-7 sm:px-8 sm:py-10">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs font-bold">
        <Link href="/" className="min-h-11 content-center text-primary hover:underline">Home</Link><span aria-hidden="true">/</span>
        <Link href="/brawl-box" className="inline-flex min-h-11 items-center gap-1 text-primary hover:underline"><ArrowLeft className="h-3.5 w-3.5" /> Brawlternatives</Link><span aria-hidden="true">/</span>
        <span aria-current="page">{deck.commander}</span>
      </nav>
      <p className="font-mono text-xs font-black uppercase tracking-widest text-primary">Theme-first · casual Commander preview</p>
      {proposal && sourceDeck && <section className="border-2 border-primary bg-primary/5 p-5 sm:p-6" aria-label="Editorial revision">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><p className="font-mono text-[10px] font-black uppercase tracking-widest text-primary">Editorial revision</p><h2 className="mt-1 text-2xl font-black">Published proposed 60-card list</h2><p className="mt-2 max-w-3xl text-sm leading-6">This proposal is selected by default. It is an editorial revision of the preserved source list, not a silent replacement: choose either list independently for the full card view and export below.</p></div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Choose deck list">
            <button type="button" aria-pressed={selection === 'proposed'} onClick={() => setSelection('proposed')} className={`min-h-11 border-2 px-4 py-2 text-xs font-black ${selection === 'proposed' ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background hover:border-primary'}`}>Proposed · editorial revision</button>
            <button type="button" aria-pressed={selection === 'original'} onClick={() => setSelection('original')} className={`min-h-11 border-2 px-4 py-2 text-xs font-black ${selection === 'original' ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background hover:border-primary'}`}>Original · source</button>
          </div>
        </div>
        {proposal.proposalRationale && <ul className="mt-4 grid gap-2 text-sm leading-6 md:grid-cols-3">{proposal.proposalRationale.map((reason) => <li key={reason} className="border border-border bg-background p-3"><strong>Proposal edit:</strong> {reason}</li>)}</ul>}
      </section>}
      <BuyOnlinePanel cards={deck.groups.flatMap(group => group.cards)} sourceLabel={proposal && selection === 'proposed' ? 'Proposed 60-card revision selected.' : 'Original submitted list selected.'} />
      <BrawlDeckCard key={deck.id} deck={deck} detail />
      {proposal && sourceDeck && <div className="border-2 border-primary/40 bg-card p-4" aria-label="Choose list to export">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-black">Export a specific list</h2><p className="text-xs leading-5 text-muted-foreground">Export selection is independent of the list currently shown above.</p></div><div className="flex flex-wrap gap-2" role="group" aria-label="Choose export list">
          <button type="button" aria-pressed={exportSelection === 'proposed'} onClick={() => setExportSelection('proposed')} className={`min-h-11 border-2 px-4 py-2 text-xs font-black ${exportSelection === 'proposed' ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background hover:border-primary'}`}>Export proposed</button>
          <button type="button" aria-pressed={exportSelection === 'original'} onClick={() => setExportSelection('original')} className={`min-h-11 border-2 px-4 py-2 text-xs font-black ${exportSelection === 'original' ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background hover:border-primary'}`}>Export original</button>
        </div></div>
      </div>}
      <DeckExportPanel
        filename={`${exportDeck.id}-brawlternative`}
        sections={{
          commandZone: [{ name: exportDeck.commander, quantity: 1 }],
          main: exportDeck.groups.flatMap(group => group.cards.filter(card => card.name !== exportDeck.commander).map(card => ({ name: card.name, quantity: card.quantity }))),
          sideboard: exportDeck.sideboardGroups?.flatMap(group => group.cards.map(card => ({ name: card.name, quantity: card.quantity }))),
        }}
        sourceNote={exportSelection === 'proposed' && sourceDeck ? `Original source preserved separately below (${sourceDeck.sourceStatedTotal} stated cards). This export is the selected proposed revision; proposal edits do not rewrite the source audit.` : 'This is the preserved original source list. It does not remove unresolved, off-color, or unsupported cards.'}
        revisedNote={proposal && exportSelection === 'proposed' ? 'Proposed list selected for export. The original remains available via Export original.' : proposal ? 'Original list selected for export. The published editorial revision remains available via Export proposed and is not applied to this export.' : undefined}
      />
      {proposal && sourceDeck && <details className="border-2 border-border bg-card p-5 sm:p-6" aria-label="Original source list history">
        <summary className="cursor-pointer text-xl font-black">Source-list history · preserved original with audit</summary>
        <div className="mt-4 space-y-3 text-sm leading-6">
          <p>The original source remains unchanged while the proposal is reviewed. Its audit, warnings, quantities, notes, and unresolved names are retained here for comparison.</p>
          <p><strong>Source audit:</strong> {sourceDeck.sourceCountNote}</p>
          {sourceDeck.sourceIssues.map((issue) => <p key={issue}><strong>Audit note:</strong> {issue}</p>)}
          {sourceDeck.offColorCards.length > 0 && <p><strong>Color-identity audit:</strong> {sourceDeck.offColorCards.join(', ')} remains in the preserved source list.</p>}
          <div className="border border-border bg-background p-4" aria-label="Preserved original card list">
            <h3 className="font-mono text-xs font-black uppercase tracking-widest">Original card list · {sourceDeck.visibleTotal} visible cards</h3>
            <div className="mt-3 grid gap-x-6 gap-y-2 text-xs leading-5 sm:grid-cols-2">{sourceDeck.groups.flatMap((group) => group.cards).map((card, index) => <span key={`${card.name}-${index}`}><strong>{card.quantity}×</strong> {card.name}{card.note ? ` — ${card.note}` : ''}</span>)}</div>
          </div>
        </div>
      </details>}
      <section className="border-2 border-border bg-card p-5 text-sm leading-6" aria-label="Sources and format caveats">
        <h2 className="text-xl font-black">About this list</h2>
        <p className="mt-3">{brawlBoxData.officialBrawlWarning}</p>
        <p className="mt-3"><strong>Deck source:</strong> User-supplied decklist, preserved with the source-list audit above. When shown, the proposed list is a separate published editorial revision; it does not rewrite or overwrite the original source.</p>
        <p className="mt-3"><strong>Strategy notes:</strong> Groups and card roles are editorial explanations. Proposal edits change only the separately labeled proposed selection; the original source list, quantities, notes, and audits remain available in Source-list history. WIP, unresolved-name, missing-card and color-identity warnings still apply.</p>
        <p className="mt-3"><strong>Card data:</strong> {brawlBoxData.cardDataSource} Card links and representative images are provided by <a href="https://scryfall.com/" target="_blank" rel="noopener noreferrer" className="text-primary underline">Scryfall</a>. Each image links to its displayed printing, labeled with set and collector number. These are representative editions, not a claim about the submitted edition or ownership. Card imagery © Wizards of the Coast.</p>
      </section>
      <nav aria-label="Explore Brawlternatives" className="border-t-2 border-border pt-5">
        <h2 className="text-xl font-black">Explore the shelf</h2>
        <div className="mt-4 flex flex-wrap gap-3">{brawlDecks.filter((entry) => entry.id !== deck.id).map((entry) => <Link key={entry.id} href={brawlDeckPath(entry.id)} className="inline-flex min-h-11 items-center gap-2 border-2 border-border bg-card px-4 py-2 text-xs font-bold hover:border-primary">{entry.commander}<ArrowRight className="h-4 w-4" /></Link>)}</div>
      </nav>
    </div>
  </main>;
}
