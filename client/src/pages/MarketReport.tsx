import { useEffect, useMemo, useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, Bell, BellRing, ExternalLink, Flame, Search, ShieldAlert, TrendingUp, X, SlidersHorizontal, CheckCircle2 } from 'lucide-react';
import { commanderDecklistsData } from '@/data/commanderDecklistsData';
import { getMarketSpikes, analyzePreconSealedEconomics, getReleaseArticles, type MarketFormat, type PreconSealedAnalysis } from '@/lib/marketIntelligence';
import { loadPriceAlerts, refreshPriceAlerts, removePriceAlert, savePriceAlert, type PriceAlert } from '@/lib/priceAlerts';
import { buildWeeklyMarketDigest } from '@/lib/weeklyDigest';
import { clearDigestDeliveryLog, loadDigestDeliveryLog, recordDigestDelivery, type DigestDeliveryLogEntry } from '@/lib/digestDeliveryLog';
import { loadOwnedCollection } from '@/lib/manaboxParser';
import { toast } from 'sonner';
import { MarketCardSkeleton, PreconGridSkeleton } from '@/components/PageSkeletons';

export default function MarketReport() {
  const spikes = useMemo(() => getMarketSpikes(), []);
  const articles = useMemo(() => getReleaseArticles(), []);
  const preconAnalyses: PreconSealedAnalysis[] = useMemo(() => commanderDecklistsData.map((deck) => analyzePreconSealedEconomics(deck)), []);

  const ownedMap = useMemo(() => {
    const col = loadOwnedCollection();
    const map = new Map<string, number>();
    col.forEach((c) => {
      map.set(c.name.toLowerCase(), (map.get(c.name.toLowerCase()) || 0) + c.quantity);
    });
    return map;
  }, []);

  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [formatFilter, setFormatFilter] = useState<'all' | MarketFormat>('all');
  const [setCodeFilter, setSetCodeFilter] = useState<string>('all');
  const [minPriceFilter, setMinPriceFilter] = useState<number>(0);
  const [maxPriceFilter, setMaxPriceFilter] = useState<number>(10000);
  const [sortBy, setSortBy] = useState<'spike-desc' | 'price-desc' | 'delta-desc' | 'name-asc'>('spike-desc');
  const [alertThreshold, setAlertThreshold] = useState(10);
  const [alerts, setAlerts] = useState<PriceAlert[]>(() => loadPriceAlerts());
  const [digestCopied, setDigestCopied] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isMarketHydrating, setIsMarketHydrating] = useState(true);
  const [deliveryLog, setDeliveryLog] = useState<DigestDeliveryLogEntry[]>(() => loadDigestDeliveryLog());
  const [deliveryQuery, setDeliveryQuery] = useState('');
  const [deliveryStatus, setDeliveryStatus] = useState<'all' | 'sent' | 'failed'>('all');
  const [deliveryWindow, setDeliveryWindow] = useState<'all' | '7d' | '30d' | '90d'>('all');
  const activeArticle = articles.find((a) => a.id === selectedArticleId) || articles[0];

  useEffect(() => {
    setAlerts(refreshPriceAlerts(spikes));
  }, [spikes]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setIsMarketHydrating(false));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const availableSetCodes = useMemo(() => {
    const codes = new Set(spikes.map((s) => s.setCode.toLowerCase()));
    return Array.from(codes).sort();
  }, [spikes]);

  const visibleSpikes = useMemo(() => {
    let result = spikes.filter((spike) => {
      const matchesFormat = formatFilter === 'all' || spike.format === formatFilter;
      const matchesSet = setCodeFilter === 'all' || spike.setCode.toLowerCase() === setCodeFilter.toLowerCase();
      const matchesPrice = spike.currentUsd >= minPriceFilter && spike.currentUsd <= maxPriceFilter;
      return matchesFormat && matchesSet && matchesPrice;
    });

    result.sort((a, b) => {
      if (sortBy === 'spike-desc') return b.percentChange - a.percentChange;
      if (sortBy === 'price-desc') return b.currentUsd - a.currentUsd;
      if (sortBy === 'delta-desc') return b.changeUsd - a.changeUsd;
      return a.cardName.localeCompare(b.cardName);
    });

    return result;
  }, [spikes, formatFilter, setCodeFilter, minPriceFilter, maxPriceFilter, sortBy]);

  const weeklyDigest = useMemo(() => buildWeeklyMarketDigest(), []);
  const filteredDeliveryLog = useMemo(() => {
    const normalizedQuery = deliveryQuery.trim().toLowerCase();
    const cutoff = deliveryWindow === 'all' ? 0 : Date.now() - Number(deliveryWindow.replace('d', '')) * 24 * 60 * 60 * 1000;
    return deliveryLog.filter((entry) => {
      const matchesQuery = !normalizedQuery || [entry.recipient, entry.subject, entry.detail || '', entry.status].some((value) => value.toLowerCase().includes(normalizedQuery));
      const matchesStatus = deliveryStatus === 'all' || entry.status === deliveryStatus;
      const matchesWindow = deliveryWindow === 'all' || new Date(entry.sentAt).getTime() >= cutoff;
      return matchesQuery && matchesStatus && matchesWindow;
    });
  }, [deliveryLog, deliveryQuery, deliveryStatus, deliveryWindow]);

  const commanderSpikeCount = spikes.filter((spike) => spike.format === 'Commander').length;
  const standardSpikeCount = spikes.filter((spike) => spike.format === 'Standard').length;

  function toggleAlert(spike: typeof spikes[number]) {
    const existing = alerts.find((alert) => alert.cardName.toLowerCase() === spike.cardName.toLowerCase());
    if (existing) {
      removePriceAlert(spike.cardName);
    } else {
      savePriceAlert({
        cardName: spike.cardName,
        setCode: spike.setCode,
        thresholdPercent: alertThreshold,
        baselinePrice: spike.currentUsd,
        lastPrice: spike.currentUsd,
      });
    }
    setAlerts(loadPriceAlerts());
  }

  function clearAlert(cardName: string) {
    removePriceAlert(cardName);
    setAlerts(loadPriceAlerts());
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-primary hover:underline">← Back to recent sets</Link>
          <div className="flex items-center gap-3">
            <Link href="/latest-market-report" className="border-2 border-primary bg-primary/10 px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-primary hover:bg-primary hover:text-primary-foreground transition-colors">Latest Market Report &amp; Sellout Queue 📊</Link>
            <Link href="/collection" className="border border-border bg-card px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground hover:border-primary hover:text-primary">Collection Workspace</Link>
            <Link href="/commander" className="border border-border bg-primary px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-primary-foreground hover:bg-primary/90">Commander Archive</Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="border-b-2 border-primary pb-6 sm:pb-8">
          <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.2em] text-primary"><TrendingUp className="h-4 w-4" /> Daily Market Intelligence &amp; Sealed Analysis</div>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-5xl">The MTG Economic Report</h1>
          <p className="mt-3 max-w-3xl text-base text-muted-foreground sm:text-lg">Evaluating price momentum, top-single premiums, and collection-aware break-even calculations so you know when to buy sealed Commander boxes or target individual singles.</p>
        </div>

        <section className="mt-10 sm:mt-14" aria-labelledby="spike-heading">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-widest text-primary">Live Momentum Scan</p>
              <h2 id="spike-heading" className="text-2xl font-bold tracking-tight sm:text-3xl">Trending Price Spikes &amp; High-Value Singles</h2>
            </div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Showing {visibleSpikes.length} of {spikes.length} indexed cards · {visibleSpikes.filter((spike) => spike.percentChange > 0).length} positive movers</p>
          </div>

          {/* Advanced Filter and Sort Toolbar */}
          <div className="mt-5 grid gap-3 border-2 border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-5 items-center">
            <label className="flex flex-col gap-1">
              <span className="font-mono text-[10px] uppercase font-bold text-muted-foreground">Format</span>
              <select value={formatFilter} onChange={(event) => setFormatFilter(event.target.value as 'all' | MarketFormat)} className="border border-border bg-background px-2 py-1.5 font-mono text-xs font-semibold outline-none">
                <option value="all">All Formats</option>
                <option value="Commander">Commander</option>
                <option value="Standard">Standard</option>
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="font-mono text-[10px] uppercase font-bold text-muted-foreground">Set Code</span>
              <select value={setCodeFilter} onChange={(event) => setSetCodeFilter(event.target.value)} className="border border-border bg-background px-2 py-1.5 font-mono text-xs font-semibold outline-none uppercase">
                <option value="all">All Sets ({availableSetCodes.length})</option>
                {availableSetCodes.map((code) => (
                  <option key={code} value={code}>{code.toUpperCase()}</option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="font-mono text-[10px] uppercase font-bold text-muted-foreground">Price Threshold ($)</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPriceFilter || ''}
                  onChange={(e) => setMinPriceFilter(Number(e.target.value) || 0)}
                  className="w-full border border-border bg-background px-2 py-1.5 font-mono text-xs outline-none"
                />
                <span className="text-muted-foreground">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPriceFilter === 10000 ? '' : maxPriceFilter}
                  onChange={(e) => setMaxPriceFilter(e.target.value ? Number(e.target.value) : 10000)}
                  className="w-full border border-border bg-background px-2 py-1.5 font-mono text-xs outline-none"
                />
              </div>
            </label>

            <label className="flex flex-col gap-1">
              <span className="font-mono text-[10px] uppercase font-bold text-muted-foreground">Sort Order</span>
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value as any)} className="border border-border bg-background px-2 py-1.5 font-mono text-xs font-semibold outline-none">
                <option value="spike-desc">Highest % Spike</option>
                <option value="price-desc">Highest USD Price</option>
                <option value="delta-desc">Highest 7D Delta ($)</option>
                <option value="name-asc">Card Name (A-Z)</option>
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="font-mono text-[10px] uppercase font-bold text-muted-foreground">Alert Threshold</span>
              <select value={alertThreshold} onChange={(event) => setAlertThreshold(Number(event.target.value))} className="border border-border bg-background px-2 py-1.5 font-mono text-xs font-semibold outline-none">
                <option value={5}>+5% change</option>
                <option value={10}>+10% change</option>
                <option value={20}>+20% change</option>
                <option value={30}>+30% change</option>
              </select>
            </label>
          </div>

          <div className="mt-6">
            {isMarketHydrating ? <MarketCardSkeleton count={8} /> : visibleSpikes.length === 0 ? (
              <div className="col-span-full border-2 border-dashed border-border bg-card p-12 text-center">
                <p className="font-mono text-sm text-muted-foreground uppercase">No movers match the selected filters.</p>
                <Button variant="outline" onClick={() => { setFormatFilter('all'); setSetCodeFilter('all'); setMinPriceFilter(0); setMaxPriceFilter(10000); }} className="mt-4 font-mono text-xs uppercase">
                  Reset Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {visibleSpikes.map((spike) => {
                const tracked = alerts.find((alert) => alert.cardName.toLowerCase() === spike.cardName.toLowerCase());
                const ownedQty = ownedMap.get(spike.cardName.toLowerCase()) || 0;
                const isOwned = ownedQty > 0;
                return (
                  <div key={`${spike.format}-${spike.cardName}`} className={`border-2 bg-card p-4 transition-colors relative ${tracked?.triggered ? 'border-amber-500' : isOwned ? 'border-emerald-500/60' : 'border-border hover:border-primary'}`}>
                    {isOwned && (
                      <div className="absolute top-2 right-2 bg-emerald-500/20 border border-emerald-500 text-emerald-400 px-2 py-0.5 font-mono text-[10px] font-bold uppercase flex items-center gap-1 shadow-sm">
                        <CheckCircle2 className="h-3 w-3 stroke-[3]" /> Owned ({ownedQty}x)
                      </div>
                    )}
                    <div className="flex items-start justify-between gap-2 pr-20">
                      <div>
                        <div className="flex items-center gap-2"><span className="border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{spike.setCode.toUpperCase()}</span><span className="font-mono text-[10px] font-bold uppercase tracking-wider text-primary">{spike.format}</span></div>
                        <h3 className="mt-2 font-bold leading-snug">{spike.cardName}</h3>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="flex items-center gap-1 border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400"><Flame className="h-3 w-3" /> +{spike.percentChange}%</span>
                    </div>
                    <div className="mt-4 flex items-baseline justify-between border-t border-border pt-3">
                      <div><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Current USD</p><p className="text-lg font-extrabold text-primary">${spike.currentUsd.toFixed(2)}</p></div>
                      <div className="text-right"><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">7-Day Delta</p><p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">+${spike.changeUsd.toFixed(2)}</p></div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <button type="button" onClick={() => toggleAlert(spike)} aria-pressed={Boolean(tracked)} className={`inline-flex items-center gap-1 border px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors ${tracked ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:border-primary hover:text-primary'}`}>
                        {tracked ? <BellRing className="h-3 w-3" /> : <Bell className="h-3 w-3" />}{tracked ? 'Tracking' : 'Track price'}
                      </button>
                      {tracked?.triggered && <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase text-amber-600"><ShieldAlert className="h-3 w-3" /> Alert hit</span>}
                    </div>
                    {spike.scryfallUri && <div className="mt-3"><a href={spike.scryfallUri} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-primary hover:underline">Scryfall market data <ExternalLink className="h-3 w-3" /></a></div>}
                  </div>
                );
              })}
              </div>
            )}
          </div>
        </section>

        {/* Remaining sections like precon analysis, articles, and weekly digest */}
        <section className="mt-16 border-t-2 border-border pt-12">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-widest text-primary">Sealed Economics</p>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Commander Precon Break-Even Analysis</h2>
            </div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Top singles vs. sealed retail price</p>
          </div>

          <div className="mt-6">
            {isMarketHydrating ? <PreconGridSkeleton count={6} /> : <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {preconAnalyses.map((analysis) => (
              <div key={analysis.deckId} className="border-2 border-border bg-card p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="border border-border bg-muted px-2 py-0.5 font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">{analysis.setCode}</span>
                    <span className={`font-mono text-xs font-bold uppercase tracking-wider ${analysis.unpricedCardCount > 0 ? 'text-amber-500' : analysis.recommendation === 'BUY_SEALED' ? 'text-emerald-500' : 'text-amber-500'}`}>{analysis.unpricedCardCount > 0 ? 'Partial Price Index' : analysis.recommendation === 'BUY_SEALED' ? 'Sealed Value Win' : 'Singles Recommended'}</span>
                  </div>
                  <h3 className="mt-3 text-lg font-bold leading-snug">{analysis.deckName}</h3>
                  <p className="mt-2 font-mono text-[10px] text-muted-foreground">{analysis.pricedCardCount}/{analysis.pricedCardCount + analysis.unpricedCardCount} cards priced · updated {analysis.priceUpdatedAt}</p>
                  <div className="mt-4 flex items-baseline justify-between border-t border-border pt-3 font-mono text-xs">
                    <div><span className="text-muted-foreground block text-[10px]">SEALED MSRP</span><span className="text-sm font-bold">${analysis.sealedMsrp.toFixed(2)}</span></div>
                    <div className="text-right"><span className="text-muted-foreground block text-[10px]">TOP SINGLES SUM</span><span className="text-sm font-bold text-primary">${analysis.topSinglesSum.toFixed(2)}</span></div>
                  </div>
                </div>

                <div className="mt-6 border-t border-border pt-4">
                  <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Top Value Singles:</p>
                  <ul className="space-y-1.5 font-mono text-xs">
                    {analysis.topSingles.map((single) => (
                      <li key={single.name} className="flex items-center justify-between">
                        <span className="truncate max-w-[180px]">{single.name}</span>
                        {single.price > 0 ? <span className="text-primary font-bold">${single.price.toFixed(2)}</span> : <span className="text-amber-500 font-bold">INDEX PENDING</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
            </div>}
          </div>
        </section>
      </main>
    </div>
  );
}
