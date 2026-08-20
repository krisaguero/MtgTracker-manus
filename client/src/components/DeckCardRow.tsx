import { useState } from 'react';
import type { DecklistEntry } from '@/hooks/useCommanderDeck';
import type { ScryfallCard } from '@/hooks/useSetDetail';
import { loadOwnedCollection } from '@/lib/manaboxParser';
import { CheckCircle2, Plus } from 'lucide-react';

interface DeckCardRowProps {
  entry: DecklistEntry;
  refreshKey?: number;
  arenaMode?: boolean;
}

export function DeckCardRow({ entry, refreshKey: _refreshKey = 0, arenaMode = false }: DeckCardRowProps) {
  const [isHovered, setIsHovered] = useState(false);
  const card: ScryfallCard = entry.card;
  const quantity = entry.quantity;

  const collection = loadOwnedCollection();
  const ownedQty = collection.find((c) => c.name.toLowerCase() === card.name.toLowerCase())?.quantity || 0;
  const isOwned = ownedQty >= quantity;

  const priceUsd = card.prices?.usd ? Number(card.prices.usd) : 1.50;
  const imageNormal = card.image_uris?.normal || card.card_faces?.[0]?.image_uris?.normal || '';

  return (
    <div
      className="relative flex items-center justify-between border border-border bg-background p-3 transition-colors hover:border-primary"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className="font-mono text-xs font-bold text-primary shrink-0 w-6">{quantity}x</span>
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">{card.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] font-mono uppercase text-muted-foreground">{card.set} #{card.collector_number}</span>
            {isOwned ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase text-emerald-500 font-bold">
                <CheckCircle2 className="h-3 w-3" /> Owned ({ownedQty})
              </span>
            ) : (
              <span className="text-[10px] font-mono uppercase text-muted-foreground">Missing</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <span className="font-mono text-xs font-bold">${priceUsd.toFixed(2)}</span>
      </div>

      {/* Floating Card Preview Hover Popup */}
      {isHovered && imageNormal && (
        <div className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 z-50 pointer-events-none w-48 shadow-2xl border-2 border-primary bg-card p-1">
          <img src={imageNormal} alt={card.name} className="w-full aspect-[2.5/3.5] object-cover" />
        </div>
      )}
    </div>
  );
}
