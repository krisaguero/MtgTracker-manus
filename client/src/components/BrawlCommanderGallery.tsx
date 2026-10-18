import React, { useState } from 'react';
import { Link } from 'wouter';
import { brawlDeckPath, cardImage, cardImageFallback, type BrawlBoxDeck } from '@/lib/brawlDecks';

function CommanderCard({ deck }: { deck: BrawlBoxDeck }) {
  const [imageFailed, setImageFailed] = useState(false);
  const [fallbackFailed, setFallbackFailed] = useState(false);
  const wip = deck.publicationStatus === 'work-in-progress';

  return <li id={deck.id} className="w-full scroll-mt-20">
    <Link
      href={brawlDeckPath(deck.id)}
      aria-label={`Explore ${deck.commander}${wip ? ' · work in progress' : ''}`}
      className="relative block rounded-xl transition-transform hover:-translate-y-1 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-primary"
    >
      {fallbackFailed ? <div role="img" aria-label={deck.commander} className="flex aspect-[488/680] items-center justify-center rounded-xl border-2 border-border bg-card p-6 text-center text-xl font-black">{deck.commander}</div> : <img
        src={imageFailed ? cardImageFallback(deck.commander) : cardImage(deck.commander)}
        alt={deck.commander}
        width={488}
        height={680}
        loading="lazy"
        decoding="async"
        onError={() => imageFailed ? setFallbackFailed(true) : setImageFailed(true)}
        className="aspect-[488/680] w-full rounded-xl object-contain"
      />}
      {wip && <span className="absolute right-2 top-2 border-2 border-amber-600 bg-background px-2 py-1 font-mono text-[10px] font-black uppercase text-foreground">WIP</span>}
    </Link>
  </li>;
}

export function BrawlCommanderGallery({ decks }: { decks: BrawlBoxDeck[] }) {
  return <section aria-label="Commander gallery" className="space-y-6">
    <p className="text-center text-sm text-muted-foreground">Choose a commander to explore its Brawlternative deck. WIP entries remain works in progress.</p>
    <ul className="mx-auto grid w-full max-w-80 grid-cols-1 gap-8" aria-label="Brawlternatives entries">
      {decks.map((deck) => <CommanderCard key={deck.id} deck={deck} />)}
    </ul>
    <p className="text-center text-[10px] leading-5 text-muted-foreground">Representative card images from <a href="https://scryfall.com/" target="_blank" rel="noopener noreferrer" className="underline">Scryfall</a>, not proof of ownership. Card imagery © Wizards of the Coast. Printing details and deck credits remain on each deck page.</p>
  </section>;
}
