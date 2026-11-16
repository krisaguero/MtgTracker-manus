import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'wouter';
import {
  brawlDeckPath,
  brawlDecks,
  cardImage,
  cardReference,
  type BrawlBoxDeck,
} from '@/lib/brawlDecks';

const PUBLIC_BREW_IDS = new Set([
  'dr-madison-li',
  'araumi-of-the-dead-tide',
  'marchesa-the-black-rose',
  'the-wise-mothman',
  'rakdos-lord-of-riots',
  'karlov-of-the-ghost-council',
  'taigam-sidisis-hand',
]);

/** Only public Brawl Box detail routes are eligible for this discovery shelf. */
export const publicCommanderBrewDecks = brawlDecks.filter((deck) => PUBLIC_BREW_IDS.has(deck.id));

const COLOR_SWATCHES: Record<string, { name: string; background: string; foreground: string }> = {
  W: { name: 'White', background: '#efe4c4', foreground: '#27231a' },
  U: { name: 'Blue', background: '#4d83bd', foreground: '#ffffff' },
  B: { name: 'Black', background: '#4d4b5d', foreground: '#ffffff' },
  R: { name: 'Red', background: '#bb5142', foreground: '#ffffff' },
  G: { name: 'Green', background: '#4f805f', foreground: '#ffffff' },
};

function CommanderBrewCard({ deck }: { deck: BrawlBoxDeck }) {
  const artCrop = cardReference(deck.commander)?.artUrl;
  const fullCard = cardImage(deck.commander);
  const [artCropFailed, setArtCropFailed] = useState(false);
  const [fullCardFailed, setFullCardFailed] = useState(false);
  const image = !artCropFailed && artCrop ? artCrop : !fullCardFailed ? fullCard : undefined;
  const isWorkInProgress = deck.publicationStatus === 'work-in-progress';

  return (
    <article className="group overflow-hidden border-2 border-border bg-card transition-all duration-200 hover:-translate-y-1 hover:border-primary hover:shadow-lg">
      <Link
        href={brawlDeckPath(deck.id)}
        aria-label={`Open ${deck.title} — ${deck.commander} deck details${isWorkInProgress ? ', work in progress' : ''}`}
        className="block h-full focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-[-4px] focus-visible:outline-primary"
      >
        <div className="relative aspect-[16/10] overflow-hidden bg-slate-950">
          {image ? (
            <img
              src={image}
              alt={`Featured commander art: ${deck.commander}`}
              loading="lazy"
              decoding="async"
              onError={() => {
                if (artCrop && !artCropFailed && fullCard !== artCrop) setArtCropFailed(true);
                else setFullCardFailed(true);
              }}
              className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div role="img" aria-label={`Artwork unavailable for ${deck.commander}`} className="flex h-full items-center justify-center p-5 text-center text-lg font-black text-white">
              {deck.commander}
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-black/10" />
          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            <span className="border border-white/30 bg-black/65 px-2 py-1 font-mono text-[9px] font-black uppercase tracking-wider text-white">Public brew</span>
            {isWorkInProgress && <span className="border border-amber-300 bg-amber-200 px-2 py-1 font-mono text-[9px] font-black uppercase tracking-wider text-amber-950">WIP</span>}
          </div>
          <div className="absolute inset-x-0 bottom-0 p-4 text-white sm:p-5">
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-white/75">Commander · {deck.commander}</p>
            <h3 className="mt-1 text-xl font-black leading-tight tracking-tight sm:text-2xl">{deck.title}</h3>
          </div>
        </div>
        <div className="flex h-full flex-col gap-3 p-4 sm:p-5">
          <div>
            <p className="font-mono text-[10px] font-black uppercase tracking-widest text-muted-foreground">Color identity</p>
            <div className="mt-2 flex flex-wrap items-center gap-2" aria-label={`${deck.commanderColorIdentityLabel} color identity`}>
              <div className="flex gap-1" aria-hidden="true">
                {deck.commanderColorIdentity.map((color) => {
                  const swatch = COLOR_SWATCHES[color];
                  return swatch ? <span key={color} title={swatch.name} className="flex h-7 w-7 items-center justify-center rounded-full border border-black/15 font-mono text-xs font-black" style={{ backgroundColor: swatch.background, color: swatch.foreground }}>{color}</span> : null;
                })}
              </div>
              <span className="text-sm font-bold">{deck.commanderColorIdentityLabel}</span>
            </div>
          </div>
          <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
            <span className="font-mono text-[9px] font-black uppercase tracking-wider text-muted-foreground">Custom 60-card Brawlternative</span>
            <span className="inline-flex items-center gap-1 font-mono text-[10px] font-black uppercase tracking-wider text-primary group-hover:underline">Open deck <ArrowRight className="h-3.5 w-3.5" /></span>
          </div>
        </div>
      </Link>
    </article>
  );
}

export function PublicCommanderBrews() {
  return (
    <section aria-label="Public Commander Brews" className="mx-auto mt-8 max-w-7xl">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-border pb-4">
        <div>
          <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-primary">Commander Matrix · public discovery</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Commander Brews</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">A visual shelf of Commander-led builds that already have public Brawl Box detail pages. These are custom 60-card Brawlternatives, not official Brawl; each page keeps its format notes and any work-in-progress status visible.</p>
        </div>
        <Link href="/brawl-box" className="inline-flex min-h-10 items-center gap-2 border-2 border-border bg-background px-3 py-2 font-mono text-[10px] font-black uppercase tracking-wider hover:border-primary hover:text-primary">Browse Brawlternatives <ArrowRight className="h-4 w-4" /></Link>
      </div>
      {publicCommanderBrewDecks.length ? (
        <ul className="mt-5 grid list-none gap-4 p-0 sm:grid-cols-2 xl:grid-cols-3" aria-label="Public Commander brew decks">
          {publicCommanderBrewDecks.map((deck) => <li key={deck.id}><CommanderBrewCard deck={deck} /></li>)}
        </ul>
      ) : (
        <p className="mt-5 border border-dashed border-border p-5 text-sm text-muted-foreground">No public Commander brews are available yet.</p>
      )}
      <p className="mt-4 text-center text-[10px] leading-5 text-muted-foreground">Commander artwork from <a href="https://scryfall.com/" target="_blank" rel="noopener noreferrer" className="underline">Scryfall</a>. Card imagery © Wizards of the Coast. No collection or ownership details appear in this gallery.</p>
    </section>
  );
}
