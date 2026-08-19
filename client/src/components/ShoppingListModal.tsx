// Design philosophy: hard-edged missing card shopping list modal with one-click export for Card Kingdom and TCGplayer.

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { getMissingCardsForDeck, formatCardKingdomShoppingList, formatTcgplayerShoppingList, formatMissingCardsCsv, formatMissingCardsText, downloadTextFile } from '@/lib/collectionAnalytics';
import { Clipboard, Check, X, ShoppingCart, ExternalLink, Download } from 'lucide-react';

interface CardRef {
  name: string;
  count?: number;
  quantity?: number;
}

interface ShoppingListModalProps {
  isOpen: boolean;
  onClose: () => void;
  deckName: string;
  commanderCards: CardRef[];
  mainCards: CardRef[];
}

export function ShoppingListModal({ isOpen, onClose, deckName, commanderCards, mainCards }: ShoppingListModalProps) {
  const [copiedFormat, setCopiedFormat] = useState<'ck' | 'tcg' | null>(null);
  const [excludeBasicLands, setExcludeBasicLands] = useState(false);

  if (!isOpen) return null;

  const missingCards = getMissingCardsForDeck(commanderCards, mainCards);
  const visibleMissingCards = excludeBasicLands ? missingCards.filter((item) => !item.isBasicLand) : missingCards;

  const ckText = formatCardKingdomShoppingList(visibleMissingCards);
  const tcgText = formatTcgplayerShoppingList(visibleMissingCards);
  const fileSlug = deckName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'commander-deck';
  const exportSuffix = excludeBasicLands ? '-no-basic-lands' : '';

  function handleDownload(format: 'csv' | 'txt') {
    if (format === 'csv') {
      downloadTextFile(`${fileSlug}-missing-cards${exportSuffix}.csv`, formatMissingCardsCsv(visibleMissingCards), 'text/csv');
    } else {
      downloadTextFile(`${fileSlug}-missing-cards${exportSuffix}.txt`, formatMissingCardsText(visibleMissingCards), 'text/plain');
    }
  }

  async function handleCopy(format: 'ck' | 'tcg', text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedFormat(format);
      window.setTimeout(() => setCopiedFormat(null), 2200);
    } catch {
      // fallback
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl border-2 border-border bg-card p-6 text-card-foreground shadow-2xl">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">Missing Card Shopping List — {deckName}</h2>
          </div>
          <button onClick={onClose} className="border border-border p-1 hover:bg-muted" aria-label="Close modal">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <p className="text-sm leading-relaxed text-muted-foreground">
            {visibleMissingCards.length > 0
              ? `You are missing ${visibleMissingCards.reduce((sum, i) => sum + i.missing, 0)} cards across ${visibleMissingCards.length} unique titles${excludeBasicLands ? ' after excluding basic lands' : ''} to complete this deck based on your stored ManaBox collection.`
              : excludeBasicLands && missingCards.length > 0
                ? 'Only basic lands remain missing; the filtered list is ready to export.'
                : 'Congratulations! You own all cards required for this deck.'}
          </p>

          <label className="flex cursor-pointer items-center gap-3 border border-border bg-background px-3 py-2 text-xs font-semibold">
            <input
              type="checkbox"
              checked={excludeBasicLands}
              onChange={(event) => setExcludeBasicLands(event.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            Exclude basic lands from list and exports
          </label>

          {visibleMissingCards.length > 0 && (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="default" size="sm" className="gap-2" onClick={() => handleCopy('ck', ckText)}>
                  {copiedFormat === 'ck' ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
                  {copiedFormat === 'ck' ? 'Copied for Card Kingdom' : 'Copy for Card Kingdom Bulk Order'}
                </Button>
                <Button variant="outline" size="sm" className="gap-2" onClick={() => handleCopy('tcg', tcgText)}>
                  {copiedFormat === 'tcg' ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
                  {copiedFormat === 'tcg' ? 'Copied for TCGplayer' : 'Copy for TCGplayer Mass Entry'}
                </Button>
                <Button variant="outline" size="sm" className="gap-2" onClick={() => handleDownload('csv')}>
                  <Download className="h-4 w-4" /> Download CSV
                </Button>
                <Button variant="outline" size="sm" className="gap-2" onClick={() => handleDownload('txt')}>
                  <Download className="h-4 w-4" /> Download Text
                </Button>
                <a
                  href="https://www.cardkingdom.com/builder"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline ml-auto"
                >
                  Open Card Kingdom Deck Builder <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              <div className="max-h-64 overflow-y-auto border border-border bg-background p-3 font-mono text-xs">
                {visibleMissingCards.map((item) => (
                  <div key={item.name} className="flex items-center justify-between py-1 border-b border-border/40 last:border-0">
                    <span className="font-semibold text-foreground">{item.name}</span>
                    <span className="text-muted-foreground">Need {item.missing} (have {item.owned}/{item.needed})</span>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="flex justify-end pt-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
