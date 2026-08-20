import type { DecklistEntry } from '@/hooks/useCommanderDeck';
import { Layers3, DollarSign } from 'lucide-react';

interface ValuationComparisonSectionProps {
  commanderEntries: DecklistEntry[];
  deckEntries: DecklistEntry[];
  sealedApproxValue?: number;
}

export function ValuationComparisonSection({ commanderEntries, deckEntries, sealedApproxValue = 45 }: ValuationComparisonSectionProps) {
  const allCards = [...commanderEntries, ...deckEntries];
  let singlesTotal = 0;
  for (const entry of allCards) {
    const p = entry.card.prices?.usd ? Number(entry.card.prices.usd) : 1.50;
    singlesTotal += p * entry.quantity;
  }
  const roundedSingles = Math.round(singlesTotal);
  const savings = Math.max(0, roundedSingles - sealedApproxValue);

  return (
    <section className="border-2 border-border bg-card p-6 sm:p-8">
      <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase text-primary">
        <DollarSign className="h-4 w-4" /> Sealed vs Singles Arbitrage
      </div>
      <h2 className="mt-2 text-2xl font-bold tracking-tight">Valuation Comparison</h2>
      <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
        Compare the retail sealed price against buying all 100 individual singles on TCGplayer and Card Kingdom.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="border border-border bg-background p-4">
          <p className="text-xs font-mono uppercase text-muted-foreground">Sealed MSRP / Value</p>
          <p className="mt-2 text-2xl font-bold">${sealedApproxValue}</p>
          <p className="mt-1 text-xs text-muted-foreground">Standard shelf baseline</p>
        </div>
        <div className="border border-border bg-background p-4">
          <p className="text-xs font-mono uppercase text-muted-foreground">Singles Total (TCGplayer)</p>
          <p className="mt-2 text-2xl font-bold text-primary">${roundedSingles}</p>
          <p className="mt-1 text-xs text-muted-foreground">Summed individual card prices</p>
        </div>
        <div className="border border-border bg-background p-4">
          <p className="text-xs font-mono uppercase text-muted-foreground">Sealed Savings Advantage</p>
          <p className="mt-2 text-2xl font-bold text-emerald-500">${savings}</p>
          <p className="mt-1 text-xs text-muted-foreground">{savings > 0 ? 'Buying sealed saves money' : 'Singles competitive'}</p>
        </div>
      </div>
    </section>
  );
}
