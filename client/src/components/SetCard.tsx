import { useState } from 'react';
import { ArrowUpRight, Bookmark, ExternalLink, Layers3, Sparkles, ChevronDown, ChevronUp, Calendar, CreditCard, ListOrdered, CheckCircle2 } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import type { PreconDeck, ScryfallSet } from '@/hooks/useScryfallSets';
import { slugify } from '@/hooks/useCommanderDeck';
import { loadOwnedCollection } from '@/lib/manaboxParser';

interface SetCardProps {
  set: ScryfallSet;
  precons: PreconDeck[];
  knownValue?: number;
  valuedDecks?: number;
  isFavorite?: boolean;
  onToggleFavorite?: (code: string) => void;
}

export function SetCard({ set, precons, knownValue = 0, valuedDecks = 0, isFavorite = false, onToggleFavorite }: SetCardProps) {
  const [, navigate] = useLocation();
  const [isExpanded, setIsExpanded] = useState(true);
  const formattedDate = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(`${set.released_at}T00:00:00`));
  const scryfallUrl = `https://scryfall.com/sets/${set.code.toLowerCase()}`;
  const valueCoverage = precons.length > 0 ? Math.round((valuedDecks / precons.length) * 100) : 0;

  return (
    <div className="flex flex-col border-2 border-border bg-card shadow-sm transition-all hover:border-primary">
      {/* Set Header Banner */}
      <div className="border-b border-border bg-background p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="border border-border bg-card px-2 py-0.5 font-mono text-xs uppercase text-muted-foreground">{set.code}</span>
              <span className="font-mono text-xs uppercase text-primary font-bold">{set.set_type}</span>
            </div>
            <h2 className="mt-2 text-xl font-bold tracking-tight">{set.name}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{formattedDate} · {set.card_count} cards</p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {onToggleFavorite && (
              <button
                type="button"
                onClick={() => onToggleFavorite(set.code)}
                title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                className={`inline-flex h-8 w-8 items-center justify-center border transition-colors ${isFavorite ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground hover:text-primary'}`}
              >
                <Bookmark className="h-4 w-4 fill-current" />
              </button>
            )}
            <a
              href={scryfallUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-8 w-8 items-center justify-center border border-border bg-card text-muted-foreground transition-colors hover:text-primary"
              title="View on Scryfall"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border">
          <div className="flex items-center gap-2">
            <Button asChild size="sm" className="font-mono text-xs uppercase font-bold">
              <Link href={`/${set.code.toLowerCase()}`}>View Set Catalog ({set.card_count})</Link>
            </Button>
          </div>
          {knownValue > 0 && (
            <div className="text-right">
              <span className="font-mono text-[10px] text-muted-foreground uppercase">Precon Value: </span>
              <span className="font-mono text-xs font-bold text-emerald-500">${knownValue}</span>
            </div>
          )}
        </div>
      </div>

      {/* Associated Commander Precons Panel */}
      <div className="border-t border-border bg-card flex flex-col">
        <button
          type="button"
          onClick={() => setIsExpanded((exp) => !exp)}
          aria-expanded={isExpanded}
          className="flex w-full items-center justify-between px-4 py-3 text-left font-mono text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
        >
          <span className="flex items-center gap-2 font-bold">
            <Layers3 className="h-4 w-4 text-primary" />
            Commander Precons ({precons.length})
          </span>
          <span className="inline-flex items-center gap-1">
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </span>
        </button>

        <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 overflow-hidden'}`}>
          <div className="min-h-0 overflow-hidden">
            <div className="p-4 pt-0 space-y-3">
              {precons.length > 0 ? (
                precons.map((precon) => <PreconCard key={precon.name} precon={precon} />)
              ) : (
                <div className="border border-dashed border-border bg-background p-4 text-center">
                  <p className="text-xs font-medium text-muted-foreground">No precons indexed directly for {set.name}.</p>
                  <Button asChild variant="outline" size="sm" className="mt-2 font-mono text-[10px] uppercase">
                    <Link href="/precons">Browse Precon Archive</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreconCard({ precon }: { precon: PreconDeck }) {
  const collection = loadOwnedCollection();
  const allRefCards = [...(precon.commanderCards || []), ...(precon.mainCards || [])];
  const deckCardNames = allRefCards.map((c) => c.name.toLowerCase());
  const ownedCount = deckCardNames.reduce((acc, name) => {
    const found = collection.find((item) => item.name.toLowerCase() === name);
    return acc + (found ? Math.min(found.quantity, 1) : 0);
  }, 0);
  const totalCards = precon.card_count || allRefCards.length || 100;
  const ownedPercent = totalCards > 0 ? Math.round((ownedCount / totalCards) * 100) : 0;

  const targetRoute = precon.hasDecklist
    ? `/deck/${precon.set_code.toLowerCase()}/${slugify(precon.name)}`
    : `/precon/${precon.set_code.toLowerCase()}/${slugify(precon.name)}`;

  const imageUrl = precon.productImageUrl || precon.image_uris?.normal;
  const commanderNamesText = precon.commanderCards?.map((c) => c.name).join(' & ') || 'Commander Deck';

  return (
    <div className="border border-border bg-background p-3 transition-colors hover:border-primary">
      <div className="flex items-start gap-3">
        {imageUrl ? (
          <img src={imageUrl} alt={precon.name} className="aspect-[4/3] w-20 border border-border object-cover shrink-0" />
        ) : (
          <div className="flex aspect-[4/3] w-20 items-center justify-center border border-border bg-muted p-1 text-center text-[10px] text-muted-foreground">Deck</div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-bold text-sm truncate">{precon.name}</h3>
            {precon.approxValue && (
              <span className="font-mono text-xs font-bold text-emerald-500 shrink-0">${precon.approxValue}</span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground truncate">{commanderNamesText}</p>

          <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] font-mono text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" /> {precon.set_code.toUpperCase()}
            </span>
            <span className="inline-flex items-center gap-1">
              <CreditCard className="h-3 w-3" /> {totalCards} Cards
            </span>
            <span className="inline-flex items-center gap-1 text-emerald-500 font-bold">
              <CheckCircle2 className="h-3 w-3" /> {ownedCount}/{totalCards} ({ownedPercent}%)
            </span>
          </div>

          <div className="mt-2 w-full bg-border h-1.5">
            <div className="bg-emerald-500 h-1.5 transition-all" style={{ width: `${Math.min(100, ownedPercent)}%` }} />
          </div>

          <div className="mt-3 flex items-center justify-between gap-2">
            <Button asChild size="sm" variant="default" className="w-full font-mono text-[10px] uppercase font-bold h-7">
              <Link href={targetRoute}>
                {precon.hasDecklist ? 'View Decklist (100 Cards)' : 'Browse Product Catalog'}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
