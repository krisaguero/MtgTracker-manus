import React, { useEffect } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Link } from 'wouter';
import brawlBoxData from '@/data/brawlBox2026.json';
import { BrawlDeckCard } from '@/components/BrawlDeckCard';
import { brawlDeckPath, brawlDecks, findBrawlDeck } from '@/lib/brawlDecks';

export default function BrawlDeckDetail({ params }: { params: { deckId: string } }) {
  const deck = findBrawlDeck(params.deckId);

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

  if (!deck) return <main className="mx-auto min-h-[60vh] max-w-4xl px-4 py-12">
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
      <BrawlDeckCard key={deck.id} deck={deck} detail />
      <section className="border-2 border-border bg-card p-5 text-sm leading-6" aria-label="Sources and format caveats">
        <h2 className="text-xl font-black">About this list</h2>
        <p className="mt-3">{brawlBoxData.officialBrawlWarning}</p>
        <p className="mt-3"><strong>Deck source:</strong> User-supplied decklist, preserved with the source-list audit above. This is a self-built theme-first preview, not a tuned or tournament-ready recommendation.</p>
        <p className="mt-3"><strong>Card data:</strong> {brawlBoxData.cardDataSource} Card links and representative images are provided by <a href="https://scryfall.com/" target="_blank" rel="noopener noreferrer" className="text-primary underline">Scryfall</a>. Images do not specify an edition. Card imagery © Wizards of the Coast.</p>
      </section>
      <nav aria-label="Explore Brawlternatives" className="border-t-2 border-border pt-5">
        <h2 className="text-xl font-black">Explore the shelf</h2>
        <div className="mt-4 flex flex-wrap gap-3">{brawlDecks.filter((entry) => entry.id !== deck.id).map((entry) => <Link key={entry.id} href={brawlDeckPath(entry.id)} className="inline-flex min-h-11 items-center gap-2 border-2 border-border bg-card px-4 py-2 text-xs font-bold hover:border-primary">{entry.commander}<ArrowRight className="h-4 w-4" /></Link>)}</div>
      </nav>
    </div>
  </main>;
}
