import React, { useState, useMemo } from 'react';
import { ShoppingCart, ExternalLink, Download, Check, Filter } from 'lucide-react';
import { getMissingCardsForDeck, formatCardKingdomShoppingList, formatTcgplayerShoppingList, downloadTextFile, type MissingCardItem } from '@/lib/collectionAnalytics';
import type { ScryfallCard } from '@/hooks/useSetDetail';

interface CardEntryRef {
  card: ScryfallCard;
  quantity: number;
}

interface MissingCardsSinglesSectionProps {
  deckName: string;
  commanderEntries: CardEntryRef[];
  deckEntries: CardEntryRef[];
  sealedApproxValue?: number;
}

const CATEGORIES = [
  { label: 'Creatures', test: (typeLine: string) => typeLine.toLowerCase().includes('creature') },
  { label: 'Artifacts', test: (typeLine: string) => typeLine.toLowerCase().includes('artifact') && !typeLine.toLowerCase().includes('creature') },
  { label: 'Enchantments', test: (typeLine: string) => typeLine.toLowerCase().includes('enchantment') },
  { label: 'Instants', test: (typeLine: string) => typeLine.toLowerCase().includes('instant') },
  { label: 'Sorceries', test: (typeLine: string) => typeLine.toLowerCase().includes('sorcery') },
  { label: 'Planeswalkers', test: (typeLine: string) => typeLine.toLowerCase().includes('planeswalker') },
  { label: 'Lands', test: (typeLine: string) => typeLine.toLowerCase().includes('land') },
];

export function MissingCardsSinglesSection({ deckName, commanderEntries, deckEntries, sealedApproxValue = 45 }: MissingCardsSinglesSectionProps) {
  const [excludeBasicLands, setExcludeBasicLands] = useState(false);
  const [copiedStore, setCopiedStore] = useState<'ck' | 'tcg' | 'mass' | null>(null);

  const commanderRefs = commanderEntries.map((e) => ({ name: e.card.name, quantity: e.quantity }));
  const mainRefs = deckEntries.map((e) => ({ name: e.card.name, quantity: e.quantity }));

  const missingItems = useMemo(() => {
    return getMissingCardsForDeck(commanderRefs, mainRefs);
  }, [commanderRefs, mainRefs]);

  const visibleMissing = useMemo(() => {
    return excludeBasicLands ? missingItems.filter((i) => !i.isBasicLand) : missingItems;
  }, [missingItems, excludeBasicLands]);

  // Calculate total cost to buy missing cards as singles
  const singlesTotalCost = useMemo(() => {
    let sum = 0;
    const allEntries = [...commanderEntries, ...deckEntries];
    for (const item of visibleMissing) {
      const match = allEntries.find((e) => e.card.name.toLowerCase() === item.name.toLowerCase());
      const priceStr = match?.card.prices?.usd;
      const priceNum = priceStr ? Number(priceStr) : 1.50;
      sum += (Number.isFinite(priceNum) && priceNum >= 0 ? priceNum : 1.50) * item.missing;
    }
    return Number(sum.toFixed(2));
  }, [visibleMissing, commanderEntries, deckEntries]);

  // Group missing cards by card type
  const groupedMissing = useMemo(() => {
    const allEntries = [...commanderEntries, ...deckEntries];
    const groups: Array<{ label: string; items: Array<{ item: MissingCardItem; match?: ScryfallCard; unitPrice: number; lineTotal: number; isExpensive: boolean }> }> = [];

    const assignedNames = new Set<string>();

    for (const cat of CATEGORIES) {
      const groupItems: typeof groups[0]['items'] = [];
      for (const item of visibleMissing) {
        if (assignedNames.has(item.name.toLowerCase())) continue;
        const match = allEntries.find((e) => e.card.name.toLowerCase() === item.name.toLowerCase());
        const typeLine = match?.card.type_line || '';
        if (cat.test(typeLine)) {
          const unitPrice = match?.card.prices?.usd ? Number(match.card.prices.usd) : 1.50;
          const lineTotal = unitPrice * item.missing;
          const isExpensive = unitPrice > 5.00;
          groupItems.push({ item, match: match?.card, unitPrice, lineTotal, isExpensive });
          assignedNames.add(item.name.toLowerCase());
        }
      }
      if (groupItems.length > 0) {
        groups.push({ label: cat.label, items: groupItems });
      }
    }

    // Catch any remaining unassigned cards
    const remainingItems: typeof groups[0]['items'] = [];
    for (const item of visibleMissing) {
      if (assignedNames.has(item.name.toLowerCase())) continue;
      const match = allEntries.find((e) => e.card.name.toLowerCase() === item.name.toLowerCase());
      const unitPrice = match?.card.prices?.usd ? Number(match.card.prices.usd) : 1.50;
      const lineTotal = unitPrice * item.missing;
      const isExpensive = unitPrice > 5.00;
      remainingItems.push({ item, match: match?.card, unitPrice, lineTotal, isExpensive });
    }
    if (remainingItems.length > 0) {
      groups.push({ label: 'Other', items: remainingItems });
    }

    return groups;
  }, [visibleMissing, commanderEntries, deckEntries]);

  const handleCopy = async (store: 'ck' | 'tcg' | 'mass', text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedStore(store as any);
      setTimeout(() => setCopiedStore(null), 2000);
    } catch {}
  };

  const handleDownloadMassEntry = () => {
    const text = visibleMissing.map((item) => `${item.missing} ${item.name}`).join('\n');
    const slug = deckName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    downloadTextFile(`${slug}-tcgplayer-mass-entry.txt`, text, 'text/plain');
  };

  const ckText = formatCardKingdomShoppingList(visibleMissing);
  const tcgText = formatTcgplayerShoppingList(visibleMissing);
  const massEntryText = visibleMissing.map((item) => `${item.missing} ${item.name}`).join('\n');

  return (
    <section className="relative border-2 border-border bg-card p-6 sm:p-8 my-10 space-y-6">
      {/* Floating success toast notification */}
      {copiedStore && (
        <div aria-live="polite" className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="border-2 border-emerald-500 bg-emerald-950/90 text-emerald-200 px-4 py-3 shadow-2xl flex items-center gap-3 font-mono text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
            <Check className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>
              Copied {copiedStore === 'ck' ? 'Card Kingdom list' : copiedStore === 'tcg' ? 'TCGplayer list' : 'Mass Entry'} to clipboard successfully!
            </span>
          </div>
        </div>
      )}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <span className="border border-primary/30 bg-primary/15 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-primary">
            Collection Gap Analysis &amp; Grouped Singles
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold mt-2 tracking-tight">Missing Cards &amp; Singles Cost Calculator</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Compare this 100-card list against your imported ManaBox collection. Missing cards are grouped by type (Creatures, Artifacts, Lands, etc.) with $5+ high-value singles flagged.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {sealedApproxValue > 0 && singlesTotalCost > sealedApproxValue && (
            <div className="border-2 border-amber-500 bg-amber-950/20 px-4 py-3 flex flex-col justify-center text-left max-w-xs">
              <span className="font-mono text-[10px] font-black uppercase tracking-wider text-amber-500 flex items-center gap-1">
                ⚠️ Buy Sealed Precon Instead
              </span>
              <span className="text-xs text-foreground mt-1 leading-relaxed">
                Missing singles total (${singlesTotalCost.toFixed(2)}) exceeds sealed market value (~${sealedApproxValue.toFixed(2)}). Buying the sealed deck is more cost-effective!
              </span>
            </div>
          )}

          <div className="border-2 border-primary bg-primary/10 px-5 py-3 text-right shrink-0 flex flex-col justify-center">
            <span className="font-mono text-xs uppercase block text-muted-foreground">Estimated Singles Cost</span>
            <span className="text-2xl font-black text-primary">${singlesTotalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</span>
            <span className="block font-mono text-[10px] text-muted-foreground">{visibleMissing.length} unique missing cards</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-background p-4 border border-border">
        <label className="flex items-center gap-2 cursor-pointer font-mono text-xs font-semibold">
          <input
            type="checkbox"
            checked={excludeBasicLands}
            onChange={(e) => setExcludeBasicLands(e.target.checked)}
            className="h-4 w-4 border-border rounded-none accent-primary"
          />
          Exclude Basic Lands from singles calculation &amp; shopping list
        </label>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleCopy('ck', ckText)}
            className="border-2 border-border bg-card px-3 py-1.5 font-mono text-xs font-bold uppercase hover:border-primary inline-flex items-center gap-1.5"
          >
            {copiedStore === 'ck' ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <ShoppingCart className="h-3.5 w-3.5" />}
            {copiedStore === 'ck' ? 'Copied for Card Kingdom' : 'Copy for Card Kingdom'}
          </button>
          <button
            type="button"
            onClick={() => handleCopy('tcg', tcgText)}
            className="border-2 border-border bg-card px-3 py-1.5 font-mono text-xs font-bold uppercase hover:border-primary inline-flex items-center gap-1.5"
          >
            {copiedStore === 'tcg' ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <ShoppingCart className="h-3.5 w-3.5" />}
            {copiedStore === 'tcg' ? 'Copied for TCGplayer' : 'Copy for TCGplayer'}
          </button>
          <button
            type="button"
            onClick={() => handleCopy('mass', massEntryText)}
            className="border-2 border-primary bg-primary text-primary-foreground px-3 py-1.5 font-mono text-xs font-bold uppercase hover:opacity-90 inline-flex items-center gap-1.5"
          >
            {copiedStore === 'mass' ? <Check className="h-3.5 w-3.5 text-white" /> : <Download className="h-3.5 w-3.5" />}
            {copiedStore === 'mass' ? 'Copied Mass Entry' : 'Copy TCGplayer Mass Entry'}
          </button>
          <button
            type="button"
            onClick={handleDownloadMassEntry}
            className="border-2 border-border bg-card px-3 py-1.5 font-mono text-xs font-bold uppercase hover:border-primary inline-flex items-center gap-1.5"
          >
            <Download className="h-3.5 w-3.5" /> Download Mass Entry .txt
          </button>
          <a
            href="https://www.tcgplayer.com/massentry"
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              // Automatically copy the mass entry text to clipboard so user can instantly paste it into TCGplayer Mass Entry
              navigator.clipboard.writeText(massEntryText).catch(() => {});
            }}
            className="border-2 border-emerald-600 bg-emerald-600 text-white px-4 py-1.5 font-mono text-xs font-bold uppercase hover:bg-emerald-700 transition-colors inline-flex items-center gap-1.5 shadow-sm"
          >
            <ShoppingCart className="h-3.5 w-3.5" /> Open TCGplayer Cart (Auto-Copy List) <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Grouped Missing Cards List */}
      {visibleMissing.length === 0 ? (
        <div className="border-2 border-dashed border-emerald-500/50 bg-emerald-950/10 p-8 text-center">
          <Check className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
          <h3 className="font-bold text-lg text-emerald-600 dark:text-emerald-400">Complete Collection Match!</h3>
          <p className="text-sm text-muted-foreground mt-1">You already own all required cards for this precon deck based on your imported collection.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedMissing.map((group) => (
            <div key={group.label} className="border-2 border-border bg-background p-4 sm:p-5">
              <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
                <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                  <span>{group.label}</span>
                  <span className="border border-border bg-card px-2 py-0.5 text-foreground">({group.items.reduce((s, x) => s + x.item.missing, 0)})</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {group.items.map(({ item, match, unitPrice, lineTotal, isExpensive }) => (
                  <div key={item.name} className={`bg-card p-4 flex flex-col justify-between border-2 ${isExpensive ? 'border-amber-500/70 bg-amber-950/10' : 'border-border'}`}>
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          {isExpensive && (
                            <span className="inline-block border border-amber-500 bg-amber-500 text-black px-1.5 py-0.2 font-mono text-[9px] font-black uppercase tracking-wider mb-1">
                              ⚠️ High Value ($5+)
                            </span>
                          )}
                          <h4 className="font-bold text-sm leading-snug">{item.name}</h4>
                        </div>
                        <span className="border border-primary/30 bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-bold text-primary shrink-0">
                          Need {item.missing}
                        </span>
                      </div>
                      <p className="font-mono text-xs text-muted-foreground mt-1">{match?.type_line || 'Card'}</p>
                    </div>

                    <div className="mt-4 pt-2 border-t border-border flex items-center justify-between font-mono text-xs">
                      <span className={isExpensive ? 'font-bold text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}>
                        Unit: ${unitPrice.toFixed(2)}
                      </span>
                      <span className="font-bold text-primary">Subtotal: ${lineTotal.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
