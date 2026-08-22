import type { DecklistEntry } from '@/hooks/useCommanderDeck';
import { Layers3, DollarSign, ExternalLink, Flame } from 'lucide-react';
import { Link } from 'wouter';
import { resolveCardPrice } from '@/lib/marketPriceIndex';
import { marketMoverArticleHref, moversForCard } from '@/lib/marketMoverLinks';

interface ValuationComparisonSectionProps {
  commanderEntries: DecklistEntry[];
  deckEntries: DecklistEntry[];
  sealedApproxValue?: number | null;
}

function money(value: number | null) {
  return value === null ? 'Unavailable' : `$${value.toFixed(2)}`;
}

export function ValuationComparisonSection({ commanderEntries, deckEntries, sealedApproxValue = null }: ValuationComparisonSectionProps) {
  const allCards = [...commanderEntries, ...deckEntries];
  const rows = allCards.map((entry) => {
    const indexed = resolveCardPrice(entry.card.name, entry.card.set);
    const scryfallUsd = entry.card.prices?.usd ? Number(entry.card.prices.usd) : NaN;
    const price = indexed || (Number.isFinite(scryfallUsd) && scryfallUsd > 0 ? { usd: scryfallUsd, source: 'Scryfall card response', updatedAt: 'live card response' } : null);
    const unitUsd = price?.usd ?? null;
    return {
      entry,
      unitUsd,
      totalUsd: unitUsd === null ? null : unitUsd * entry.quantity,
      source: price?.source || 'No current indexed price',
      mover: moversForCard(entry.card.name, entry.card.set).find((mover) => mover.percentChange > 0),
    };
  });
  const pricedRows = rows.filter((row) => row.unitUsd !== null);
  const singlesTotal = pricedRows.reduce((sum, row) => sum + (row.totalUsd || 0), 0);
  const totalCards = rows.reduce((sum, row) => sum + row.entry.quantity, 0);
  const pricedCards = pricedRows.reduce((sum, row) => sum + row.entry.quantity, 0);
  const unpricedCards = totalCards - pricedCards;
  const coverage = totalCards ? Math.round((pricedCards / totalCards) * 100) : 0;
  const topValueRows = [...pricedRows].sort((a, b) => (b.totalUsd || 0) - (a.totalUsd || 0)).slice(0, 10);
  const spread = sealedApproxValue === null || sealedApproxValue === undefined ? null : singlesTotal - sealedApproxValue;

  return (
    <section className="border-2 border-border bg-card p-6 sm:p-8" aria-labelledby="valuation-comparison-heading">
      <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase text-primary">
        <DollarSign className="h-4 w-4" /> Sealed vs Singles Baseline
      </div>
      <h2 id="valuation-comparison-heading" className="mt-2 text-2xl font-bold tracking-tight">Current card-equity matrix</h2>
      <p className="mt-1 max-w-3xl text-sm text-muted-foreground">Every row below is valued from the latest indexed per-card baseline when available. Missing prices stay unpriced rather than being replaced by a placeholder, so the comparison cannot silently overstate deck equity.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="border border-border bg-background p-4">
          <p className="text-xs font-mono uppercase text-muted-foreground">Indexed singles equity</p>
          <p className="mt-2 text-2xl font-bold text-primary">{money(singlesTotal)}</p>
          <p className="mt-1 text-xs text-muted-foreground">Priced rows × quantity</p>
        </div>
        <div className="border border-border bg-background p-4">
          <p className="text-xs font-mono uppercase text-muted-foreground">Sealed baseline</p>
          <p className="mt-2 text-2xl font-bold">{money(sealedApproxValue ?? null)}</p>
          <p className="mt-1 text-xs text-muted-foreground">Requires a dated sealed source</p>
        </div>
        <div className="border border-border bg-background p-4">
          <p className="text-xs font-mono uppercase text-muted-foreground">Coverage</p>
          <p className="mt-2 text-2xl font-bold">{coverage}%</p>
          <p className="mt-1 text-xs text-muted-foreground">{pricedCards} priced / {unpricedCards} unpriced cards</p>
        </div>
        <div className="border border-border bg-background p-4">
          <p className="text-xs font-mono uppercase text-muted-foreground">Value spread</p>
          <p className={`mt-2 text-2xl font-bold ${spread === null ? 'text-muted-foreground' : spread >= 0 ? 'text-emerald-500' : 'text-amber-500'}`}>{spread === null ? 'Unavailable' : `${spread >= 0 ? '+' : '-'}$${Math.abs(spread).toFixed(2)}`}</p>
          <p className="mt-1 text-xs text-muted-foreground">Singles equity minus sealed</p>
        </div>
      </div>

      <div className="mt-6 border border-border bg-background p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Layers3 className="h-4 w-4 text-primary" />
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider">Top value cards in this deck</h3>
          </div>
          <span className="font-mono text-[10px] uppercase text-muted-foreground">Prices dated by source</span>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-border text-[10px] uppercase text-muted-foreground">
                <th className="px-2 py-2">Card</th><th className="px-2 py-2">Qty</th><th className="px-2 py-2">Unit</th><th className="px-2 py-2">Line value</th><th className="px-2 py-2">Signal</th><th className="px-2 py-2 text-right">Research</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {topValueRows.map((row, index) => (
                <tr key={`${row.entry.card.id}-${row.entry.card.set}-${row.entry.card.collector_number}-${index}`}>
                  <td className="px-2 py-2 font-bold">{row.entry.card.name}</td>
                  <td className="px-2 py-2">{row.entry.quantity}x</td>
                  <td className="px-2 py-2">{money(row.unitUsd)}</td>
                  <td className="px-2 py-2 font-bold text-primary">{money(row.totalUsd)}</td>
                  <td className="px-2 py-2">{row.mover ? <Link href={marketMoverArticleHref(row.entry.card.name)} className="inline-flex items-center gap-1 text-amber-500 hover:underline"><Flame className="h-3 w-3" /> Hot watch</Link> : <span className="text-muted-foreground">No mover row</span>}</td>
                  <td className="px-2 py-2 text-right"><Link href={`/card/${encodeURIComponent(row.entry.card.name)}`} className="inline-flex items-center gap-1 text-primary hover:underline">Card <ExternalLink className="h-3 w-3" /></Link></td>
                </tr>
              ))}
            </tbody>
          </table>
          {topValueRows.length === 0 && <p className="py-4 text-xs text-muted-foreground">No current price rows are available for this deck yet.</p>}
        </div>
      </div>

      <p className="mt-4 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">Research note: this comparison is informational only. Verify live vendor listings, printing, condition, shipping, fees, and sealed availability before making a purchase decision.</p>
    </section>
  );
}
