import React, { useMemo, useState } from 'react';
import { Link } from 'wouter';
import { Sparkles, ShoppingBag, ArrowRight, Check } from 'lucide-react';
import { commanderDecklistsData } from '@/data/commanderDecklistsData';
import { loadOwnedCollection } from '@/lib/manaboxParser';
import { resolveCardPrice } from '@/lib/marketPriceIndex';

export function NextBestPurchases() {
  const collection = loadOwnedCollection();
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  const closestDeckData = useMemo(() => {
    const ownedMap = new Map<string, number>();
    for (const c of collection) {
      ownedMap.set(c.name.toLowerCase(), c.quantity);
    }

    let bestDeck: any = null;
    let bestCoverage = -1;
    let missingList: Array<{ name: string; price: number | null; type: string }> = [];

    for (const deck of commanderDecklistsData) {
      const allCards = [...deck.commander, ...deck.cards];
      let total = 0;
      let owned = 0;
      const missing: Array<{ name: string; price: number | null; type: string }> = [];

      for (const card of allCards) {
        const qty = (card as any).count || (card as any).quantity || 1;
        total += qty;
        const ownedQty = ownedMap.get(card.name.toLowerCase()) || 0;
        if (ownedQty >= qty) {
          owned += qty;
        } else {
          const indexedPrice = resolveCardPrice(card.name, card.set_code || deck.set_code);
          missing.push({
            name: card.name,
            price: indexedPrice?.usd ?? null,
            type: (card as any).type_line || 'Spell',
          });
        }
      }

      const pct = total > 0 ? Math.round((owned / total) * 100) : 0;
      if (pct < 100 && pct > bestCoverage) {
        bestCoverage = pct;
        bestDeck = deck;
        missingList = missing.sort((a, b) => (a.price ?? Number.POSITIVE_INFINITY) - (b.price ?? Number.POSITIVE_INFINITY));
      }
    }

    return {
      deck: bestDeck,
      coverage: bestCoverage,
      missing: missingList.slice(0, 5),
    };
  }, [collection]);

  if (!closestDeckData.deck) {
    return null;
  }

  const { deck, coverage, missing } = closestDeckData;
  const slug = deck.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const handleBuyAllRecommended = () => {
    const massEntryText = missing.map((item) => `1 ${item.name}`).join('\n');
    navigator.clipboard.writeText(massEntryText);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 3000);
    window.open('https://www.tcgplayer.com/massentry', '_blank');
  };

  return (
    <section className="my-10 border-2 border-primary/40 bg-card p-6 sm:p-8 space-y-6 shadow-md relative">
      {copiedSuccess && (
        <div className="absolute top-4 right-4 z-50 border-2 border-emerald-500 bg-emerald-500 text-black px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg animate-bounce">
          <Check className="h-4 w-4" /> Copied Recommended Singles! Opening TCGplayer Mass Entry...
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-border pb-4">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.2em] text-primary">
            <Sparkles className="h-4 w-4" /> AI Next Best Purchases · Closest Precon Completion
          </div>
          <h2 className="text-2xl font-extrabold mt-1 tracking-tight">
            Target Deck: {deck.name} ({coverage}% Owned)
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Based on your uploaded inventory of {collection.length} cards, this precon is closest to completion. Here are the lowest-cost missing singles with an indexed market price; unpriced cards remain marked pending.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <button
            type="button"
            onClick={handleBuyAllRecommended}
            className="border-2 border-emerald-500 bg-emerald-500 text-black px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider hover:opacity-90 inline-flex items-center gap-2"
          >
            <ShoppingBag className="h-4 w-4" /> Buy All Recommended (TCGplayer)
          </button>
          <Link
            href={`/deck/${deck.set_code.toLowerCase()}/${slug}`}
            className="border-2 border-border bg-background px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider hover:border-primary inline-flex items-center gap-2 text-foreground"
          >
            View Full Decklist <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {missing.map((item, idx) => (
          <div key={item.name} className="border-2 border-border bg-background p-4 flex flex-col justify-between space-y-3">
            <div>
              <span className="font-mono text-[10px] uppercase font-bold text-primary">Rank #{idx + 1} Cheapest</span>
              <h4 className="font-bold text-sm leading-snug mt-1">{item.name}</h4>
              <p className="font-mono text-[11px] text-muted-foreground mt-0.5">{item.type}</p>
            </div>

            <div className="pt-2 border-t border-border flex items-center justify-between font-mono text-xs">
              <span className="text-muted-foreground">Est. Single:</span>
              {item.price === null ? <span className="font-bold text-amber-500">INDEX PENDING</span> : <span className="font-bold text-emerald-500">${item.price.toFixed(2)}</span>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
