// Design philosophy: hard-edged collection match summary showing owned counts, completion percentage, missing cards, and shopping list launcher.

import { useState, useEffect } from 'react';
import { loadOwnedCollection, type OwnedCard } from '@/lib/manaboxParser';
import { isBasicLandName } from '@/lib/collectionAnalytics';
import { CheckCircle2, AlertCircle, BookmarkCheck, ShoppingCart } from 'lucide-react';

interface DeckCompletionCardProps {
  deckCards: Array<{ name: string; quantity: number; usd?: number | null }>;
  onOpenImportModal: () => void;
  onOpenShoppingList: () => void;
}

export function DeckCompletionCard({ deckCards, onOpenImportModal, onOpenShoppingList }: DeckCompletionCardProps) {
  const [collection, setCollection] = useState<OwnedCard[]>([]);
  const [excludeBasicLands, setExcludeBasicLands] = useState(false);

  useEffect(() => {
    setCollection(loadOwnedCollection());
  }, []);

  const ownedMap = new Map<string, number>();
  for (const c of collection) {
    ownedMap.set(c.name.toLowerCase(), c.quantity);
  }

  let totalDeckCards = 0;
  let totalOwnedCards = 0;
  let missingCount = 0;
  let missingCost = 0;
  let pricedMissingCards = 0;
  let costMissingCount = 0;
  const pricedMissingDetails: Array<{ name: string; quantity: number; unitPrice: number; total: number }> = [];
  const unpricedMissingNames: string[] = [];

  for (const item of deckCards) {
    totalDeckCards += item.quantity;
    const ownedQty = ownedMap.get(item.name.toLowerCase()) || 0;
    const counted = Math.min(ownedQty, item.quantity);
    totalOwnedCards += counted;
    if (ownedQty < item.quantity) {
      const missingQuantity = item.quantity - ownedQty;
      missingCount += missingQuantity;
      if (!(excludeBasicLands && isBasicLandName(item.name))) {
        costMissingCount += missingQuantity;
      }
      if (!(excludeBasicLands && isBasicLandName(item.name)) && typeof item.usd === 'number' && Number.isFinite(item.usd)) {
        const lineTotal = missingQuantity * item.usd;
        missingCost += lineTotal;
        pricedMissingCards += missingQuantity;
        pricedMissingDetails.push({ name: item.name, quantity: missingQuantity, unitPrice: item.usd, total: lineTotal });
      } else if (!(excludeBasicLands && isBasicLandName(item.name))) {
        unpricedMissingNames.push(item.name);
      }
    }
  }

  const percentage = totalDeckCards > 0 ? Math.round((totalOwnedCards / totalDeckCards) * 100) : 0;
  const hasCollection = collection.length > 0;

  return (
    <div className="border-2 border-border bg-card p-6 text-card-foreground">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center border-2 border-primary bg-primary/10 text-primary">
            <BookmarkCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">ManaBox Collection Match</p>
            <h3 className="text-lg font-bold">
              {hasCollection ? `${percentage}% Deck Owned (${totalOwnedCards}/${totalDeckCards} cards)` : 'Import ManaBox Collection to Match'}
            </h3>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {hasCollection && missingCount > 0 && (
            <button
              onClick={onOpenShoppingList}
              className="inline-flex items-center gap-2 border-2 border-primary bg-primary text-primary-foreground px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition-colors"
            >
              <ShoppingCart className="h-4 w-4" /> Shopping List ({missingCount})
            </button>
          )}
          <button
            onClick={onOpenImportModal}
            className="border-2 border-border bg-background px-4 py-2 text-xs font-bold uppercase tracking-wider hover:border-primary hover:text-primary transition-colors"
          >
            {hasCollection ? 'Manage ManaBox Import →' : 'Import ManaBox CSV →'}
          </button>
        </div>
      </div>

      {hasCollection && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 border-t border-border pt-4 text-xs">
          <div className="flex items-center gap-2 border border-border bg-background p-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <div>
              <p className="font-bold">{totalOwnedCards} Cards Owned</p>
              <p className="text-muted-foreground">Found in local storage</p>
            </div>
          </div>
          <div className="flex items-center gap-2 border border-border bg-background p-3">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <div>
              <p className="font-bold">{missingCount} Cards Missing</p>
              <p className="text-muted-foreground">Need to acquire</p>
            </div>
          </div>
          <div className="group relative border border-border bg-background p-3 focus-within:border-primary">
            <div
              tabIndex={0}
              aria-label={`Estimated cost to complete is $${missingCost.toFixed(2)}${excludeBasicLands ? ', excluding basic lands' : ''}. Focus for card-by-card prices.`}
              className="flex cursor-help items-center gap-2 outline-none"
            >
              <div>
                <p className="font-bold">${missingCost.toFixed(2)} Est. to Complete</p>
                <p className="text-muted-foreground">{pricedMissingCards}/{costMissingCount} cost-eligible cards priced</p>
                <label className="mt-2 flex cursor-pointer items-center gap-2 text-[10px] font-semibold text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={excludeBasicLands}
                    onChange={(event) => setExcludeBasicLands(event.target.checked)}
                    className="h-3.5 w-3.5 accent-primary"
                  />
                  Exclude basic lands
                </label>
              </div>
            </div>
            <div role="tooltip" className="pointer-events-none absolute bottom-[calc(100%+0.5rem)] left-0 z-30 hidden w-80 border-2 border-foreground bg-foreground p-4 text-background shadow-xl group-hover:block group-focus-within:block">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-background/70">Missing card price detail</p>
              <div className="mt-2 max-h-48 space-y-1 overflow-y-auto text-xs">
                {pricedMissingDetails.length > 0 ? pricedMissingDetails.slice().sort((a, b) => b.total - a.total).slice(0, 8).map((detail) => (
                  <div key={detail.name} className="flex items-start justify-between gap-3 border-b border-background/20 py-1 last:border-0">
                    <span className="min-w-0 truncate">{detail.name} <span className="text-background/60">×{detail.quantity}</span></span>
                    <span className="shrink-0 font-bold">${detail.total.toFixed(2)}</span>
                  </div>
                )) : (
                  <p className="text-background/70">No current USD prices are available for the missing cards.</p>
                )}
              </div>
              {pricedMissingDetails.length > 8 && <p className="mt-2 text-[10px] text-background/60">+{pricedMissingDetails.length - 8} more priced cards</p>}
              {excludeBasicLands && <p className="mt-2 border-t border-background/20 pt-2 text-[10px] text-background/60">Basic lands are excluded from this estimate; the missing-card count remains unchanged.</p>}
              {unpricedMissingNames.length > 0 && <p className="mt-2 border-t border-background/20 pt-2 text-[10px] text-background/60">{unpricedMissingNames.length} missing card{unpricedMissingNames.length === 1 ? '' : 's'} excluded from total because no current USD price is available.</p>}
            </div>
          </div>
          <div className="flex items-center gap-2 border border-border bg-background p-3">
            <div className="h-2 w-full bg-muted">
              <div className="h-full bg-primary" style={{ width: `${Math.min(100, percentage)}%` }} />
            </div>
            <span className="shrink-0 font-bold">{percentage}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
