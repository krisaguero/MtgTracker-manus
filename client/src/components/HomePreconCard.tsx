import { ArrowRight, CalendarDays, CreditCard } from 'lucide-react';
import { Link } from 'wouter';
import { CommanderCardFrame } from '@/components/CommanderCardFrame';
import { slugify } from '@/hooks/useCommanderDeck';
import type { HomePreconIndexEntry } from '@/lib/homePreconIndex';

export function HomePreconCard({ deck }: { deck: HomePreconIndexEntry }) {
  const href = deck.hasDecklist
    ? `/deck/${deck.set_code.toLowerCase()}/${slugify(deck.name)}`
    : `/precon/${deck.set_code.toLowerCase()}/${slugify(deck.name)}`;

  return (
    <article className="flex min-w-0 flex-col border-2 border-border bg-card shadow-sm transition-colors hover:border-primary">
      <div className="flex min-h-64 items-center justify-center bg-[#171a24] px-5 py-6 sm:min-h-72 sm:px-6">
        <div className="w-36 sm:w-40 lg:w-44">
          <CommanderCardFrame
            cardName={deck.commanderName}
            fallbackSrc={deck.fallbackImages}
            alt={`${deck.name} Commander artwork`}
          />
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 font-bold leading-snug">{deck.name}</h3>
        </div>
        <p className="mt-2 line-clamp-1 text-xs text-muted-foreground">{deck.commanderName}</p>
        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          <span className="inline-flex items-center gap-1"><CalendarDays className="h-3 w-3" />{deck.set_code.toUpperCase()}</span>
          {deck.cardCount !== undefined && <span className="inline-flex items-center gap-1"><CreditCard className="h-3 w-3" />{deck.cardCount} cards</span>}
          {deck.set_name && <span className="basis-full truncate">{deck.set_name}</span>}
        </div>
        <Link href={href} className="mt-4 inline-flex items-center justify-between gap-2 border-2 border-primary bg-primary px-3 py-2 font-mono text-[10px] font-black uppercase tracking-wider text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
          {deck.hasDecklist ? 'View decklist' : 'View product catalog'}<ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </article>
  );
}
