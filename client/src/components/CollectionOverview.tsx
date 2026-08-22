import { useState, useEffect } from 'react';
import { loadOwnedCollection, type OwnedCard } from '@/lib/manaboxParser';
import { getValuationHistory, recordValuationSnapshot, type ValuationSnapshot } from '@/lib/collectionHistory';
import { getDeckCoverageRecommendations, getCollectionValuationAndBreakdown, type DeckCoverageRecommendation, type SetEquityBreakdown } from '@/lib/collectionAnalytics';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { Wallet, Sparkles, Upload, Layers, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';

interface CollectionOverviewProps {
  onOpenImportModal: () => void;
  refreshKey: number;
}

export function CollectionOverview({ onOpenImportModal, refreshKey }: CollectionOverviewProps) {
  const [collection, setCollection] = useState<OwnedCard[]>([]);
  const [history, setHistory] = useState<ValuationSnapshot[]>([]);
  const [recommendations, setRecommendations] = useState<DeckCoverageRecommendation[]>([]);
  const [valuationData, setValuationData] = useState<{ totalEquityUsd: number; setBreakdowns: SetEquityBreakdown[]; pricedCardCount: number; unpricedCardCount: number; snapshotDate: string }>({
    totalEquityUsd: 0,
    setBreakdowns: [],
    pricedCardCount: 0,
    unpricedCardCount: 0,
    snapshotDate: '',
  });
  const [showSetBreakdown, setShowSetBreakdown] = useState(false);

  useEffect(() => {
    const col = loadOwnedCollection();
    setCollection(col);
    setRecommendations(getDeckCoverageRecommendations());

    const valResult = getCollectionValuationAndBreakdown();
    setValuationData(valResult);

    if (col.length > 0) {
      const updatedHistory = recordValuationSnapshot(valResult.totalEquityUsd);
      setHistory(updatedHistory);
    } else {
      setHistory(getValuationHistory());
    }
  }, [refreshKey]);

  const totalUniqueCards = collection.reduce((sum, c) => sum + c.quantity, 0);
  const currentValuation = valuationData.totalEquityUsd;
  const hasCollection = collection.length > 0;

  return (
    <section className="my-4 border-2 border-border bg-card p-4 sm:my-10 sm:p-8">
      <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:pb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center border-2 border-primary bg-primary/10 text-primary sm:h-12 sm:w-12">
            <Wallet className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">ManaBox Collection Hub</p>
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Your Private Collection & Historical Valuation</h2>
          </div>
        </div>

        <Button variant="default" size="sm" onClick={onOpenImportModal} className="w-full gap-2 sm:w-auto">
          <Upload className="h-4 w-4" />
          {hasCollection ? 'Update ManaBox Import' : 'Import ManaBox Collection'}
        </Button>
      </div>

      {hasCollection ? (
        <div className="mt-8 space-y-8">
          {/* Top Stats Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="border border-border bg-background p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Stored Collection</p>
              <p className="mt-2 text-3xl font-extrabold">{totalUniqueCards} <span className="text-sm font-normal text-muted-foreground">cards</span></p>
              <p className="mt-1 text-xs text-muted-foreground">{collection.length} unique card entries stored locally.</p>
            </div>

            <div className="border border-border bg-background p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Real Market Equity</p>
              <p className="mt-2 text-3xl font-extrabold text-primary">${currentValuation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-sm font-normal text-muted-foreground">USD</span></p>
              <p className="mt-1 text-xs text-muted-foreground">
                {valuationData.pricedCardCount} priced ({valuationData.unpricedCardCount} fallback) • {valuationData.snapshotDate}
              </p>
            </div>

            <div className="border border-border bg-background p-5 sm:col-span-2 lg:col-span-1">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Deck Builder Readiness</p>
              <p className="mt-2 text-xl font-bold">
                {recommendations.filter((r) => r.coveragePercentage >= 50).length} Decks Over 50% Owned
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Scanned against indexed Commander precons.</p>
            </div>
          </div>

          {/* Set Equity Breakdown Toggle & Section */}
          <div className="border border-border bg-background p-5">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowSetBreakdown(!showSetBreakdown)}>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Set-Level Equity Breakdown</p>
                <h3 className="text-lg font-bold">Equity Across {valuationData.setBreakdowns.length} Sets</h3>
              </div>
              <Button variant="outline" size="sm" className="gap-2 font-mono text-xs uppercase">
                {showSetBreakdown ? 'Hide Breakdown' : 'View Set Totals'}
                {showSetBreakdown ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>

            {showSetBreakdown && (
              <div className="mt-4 border-t border-border pt-4 max-h-72 overflow-y-auto space-y-2">
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="py-2">Set Code / Name</th>
                      <th className="py-2 text-right">Cards</th>
                      <th className="py-2 text-right">Total Equity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {valuationData.setBreakdowns.map((setRow) => (
                      <tr key={setRow.setCode} className="border-b border-border/40 hover:bg-muted/40">
                        <td className="py-2.5 font-bold">{setRow.setCode} — <span className="font-normal text-muted-foreground">{setRow.setName}</span></td>
                        <td className="py-2.5 text-right">{setRow.cardCount}</td>
                        <td className="py-2.5 text-right font-bold text-primary">${setRow.totalValueUsd.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Historical Valuation Chart */}
          <div className="border border-border bg-background p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Portfolio Tracking</p>
                <h3 className="text-lg font-bold">Historical Collection Value Over Time</h3>
              </div>
              <span className="text-xs text-muted-foreground">Snapshots recorded on app visit</span>
            </div>

            {history.length >= 2 ? (
              <div className="h-48 w-full">
                <svg className="h-full w-full overflow-visible" viewBox="0 0 500 160">
                  {/* Grid lines */}
                  <line x1="0" y1="20" x2="500" y2="20" stroke="currentColor" className="text-border" strokeDasharray="4" />
                  <line x1="0" y1="80" x2="500" y2="80" stroke="currentColor" className="text-border" strokeDasharray="4" />
                  <line x1="0" y1="140" x2="500" y2="140" stroke="currentColor" className="text-border" strokeDasharray="4" />

                  {(() => {
                    const values = history.map((h) => h.estimatedValueUsd);
                    const minVal = Math.min(...values) * 0.9;
                    const maxVal = Math.max(...values) * 1.1 || 100;
                    const range = maxVal - minVal || 1;

                    const points = history.map((h, i) => {
                      const x = (i / (history.length - 1)) * 480 + 10;
                      const y = 140 - ((h.estimatedValueUsd - minVal) / range) * 120;
                      return { x, y, ...h };
                    });

                    const pathString = points.reduce((acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), '');

                    return (
                      <>
                        <path d={pathString} fill="none" stroke="currentColor" className="text-primary" strokeWidth="3" />
                        {points.map((p) => (
                          <g key={p.date}>
                            <circle cx={p.x} cy={p.y} r="4" className="fill-background stroke-primary" strokeWidth="2" />
                            <text x={p.x} y="156" textAnchor="middle" className="text-[9px] fill-muted-foreground">{p.date.slice(5)}</text>
                          </g>
                        ))}
                      </>
                    );
                  })()}
                </svg>
              </div>
            ) : (
              <div className="flex h-36 flex-col items-center justify-center border border-dashed border-border bg-card text-center p-4">
                <TrendingUp className="h-6 w-6 text-muted-foreground mb-2" />
                <p className="text-sm font-semibold">Collecting valuation history…</p>
                <p className="text-xs text-muted-foreground mt-1">Visit again tomorrow or update your collection to record a new dated snapshot.</p>
              </div>
            )}
            <p className="mt-4 text-[11px] text-muted-foreground">Note: Chart reflects private local snapshots powered by real daily market price snapshots.</p>
          </div>

          {/* Deck Recommendations Ranked by Coverage */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">Commander Decks Ranked by Your Collection Match</h3>
              <span className="text-xs font-semibold text-muted-foreground">Highest coverage first</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {recommendations.slice(0, 4).map((rec) => (
                <Link
                  key={rec.deckSlug}
                  href={`/deck/${rec.setCode.toLowerCase()}/${rec.deckSlug}`}
                  className="group block border border-border bg-background p-4 transition-colors hover:border-primary"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-semibold group-hover:text-primary">{rec.deckName}</h4>
                    <span className={`border px-2 py-0.5 text-xs font-extrabold ${rec.coveragePercentage >= 75 ? 'border-emerald-600/40 bg-emerald-500/10 text-emerald-700' : rec.coveragePercentage >= 40 ? 'border-blue-600/40 bg-blue-500/10 text-blue-700' : 'border-border bg-muted text-muted-foreground'}`}>
                      {rec.coveragePercentage}% Owned
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{rec.setName} · {rec.ownedCards}/{rec.totalCards} cards</p>
                  <div className="mt-3 flex items-center justify-between border-t border-border pt-2 text-xs font-semibold text-primary">
                    <span>View decklist & missing cards</span>
                    <span>→</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-5 border border-dashed border-border bg-background p-5 text-center sm:mt-8 sm:p-10">
          <Layers className="mx-auto h-8 w-8 text-muted-foreground opacity-50 sm:h-10 sm:w-10" />
          <h3 className="mt-3 text-base font-bold sm:mt-4 sm:text-lg">No ManaBox collection imported yet</h3>
          <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-muted-foreground sm:text-sm">
            Import your ManaBox CSV export or card list to unlock automated collection equity history charts, deck coverage rankings, and missing-card shopping lists.
          </p>
          <Button variant="default" size="sm" onClick={onOpenImportModal} className="mt-4 w-full gap-2 sm:mt-6 sm:w-auto">
            <Upload className="h-4 w-4" /> Import ManaBox Collection Now
          </Button>
        </div>
      )}
    </section>
  );
}
