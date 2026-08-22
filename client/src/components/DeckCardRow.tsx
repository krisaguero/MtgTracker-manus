import { useState } from 'react';
import type { DecklistEntry } from '@/hooks/useCommanderDeck';
import type { ScryfallCard } from '@/hooks/useSetDetail';
import { loadOwnedCollection } from '@/lib/manaboxParser';
import { CheckCircle2, ExternalLink, Flame } from 'lucide-react';
import { Link } from 'wouter';
import { resolveCardPrice } from '@/lib/marketPriceIndex';
import { moversForCard } from '@/lib/marketMoverLinks';

interface DeckCardRowProps {
  entry: DecklistEntry;
  refreshKey?: number;
  arenaMode?: boolean;
}

function imageFor(card: ScryfallCard) {
  return card.image_uris?.normal || card.card_faces?.[0]?.image_uris?.normal || '';
}

export function DeckCardRow({ entry, refreshKey: _refreshKey = 0, arenaMode: _arenaMode = false }: DeckCardRowProps) {
  const [isHovered, setIsHovered] = useState(false);
  const card: ScryfallCard = entry.card;
  const quantity = entry.quantity;

  const collection = loadOwnedCollection();
  const ownedQty = collection.find((c) => c.name.toLowerCase() === card.name.toLowerCase())?.quantity || 0;
  const isOwned = ownedQty >= quantity;
  const indexedPrice = resolveCardPrice(card.name, card.set);
  const scryfallPrice = card.prices?.usd ? Number(card.prices.usd) : NaN;
  const unitPrice = indexedPrice?.usd ?? (Number.isFinite(scryfallPrice) && scryfallPrice > 0 ? scryfallPrice : null);
  const mover = moversForCard(card.name, card.set).find((item) => item.percentChange > 0);
  const imageNormal = imageFor(card);

  return (
    <div
      className={`relative flex items-center justify-between border bg-background p-3 transition-colors hover:border-primary ${mover ? 'border-amber-500/70' : 'border-border'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="w-6 shrink-0 font-mono text-xs font-bold text-primary">{quantity}x</span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{card.name}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] uppercase text-muted-foreground">{card.set} #{card.collector_number}</span>
            {isOwned ? (
              <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase text-emerald-500"><CheckCircle2 className="h-3 w-3" /> Owned ({ownedQty})</span>
            ) : (
              <span className="font-mono text-[10px] uppercase text-muted-foreground">Missing</span>
            )}
            {mover && <Link href={mover.articleHref} className="inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase text-amber-500 hover:underline"><Flame className="h-3 w-3" /> +{mover.percentChange.toFixed(1)}%</Link>}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <span className={`font-mono text-xs font-bold ${unitPrice === null ? 'text-muted-foreground' : 'text-foreground'}`}>{unitPrice === null ? 'Unpriced' : `$${unitPrice.toFixed(2)}`}</span>
        <span className="max-w-[150px] truncate font-mono text-[9px] uppercase text-muted-foreground" title={indexedPrice?.source || 'No current indexed price'}>{indexedPrice?.source || 'No current indexed price'}</span>
      </div>

      {isHovered && imageNormal && (
        <div className="absolute bottom-full left-1/2 z-50 mb-2 w-48 -translate-x-1/2 border-2 border-primary bg-card p-1 shadow-2xl pointer-events-none">
          <img src={imageNormal} alt={card.name} className="aspect-[2.5/3.5] w-full object-contain" />
        </div>
      )}
    </div>
  );
}
