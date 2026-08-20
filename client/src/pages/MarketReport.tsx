/* Design reminder: hard-edged editorial market intelligence workspace; features format-filtered price momentum, private local alerts, sealed-vs-singles analysis, and source-linked release articles. */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'wouter';
import { ArrowUpRight, Bell, BellRing, ExternalLink, Flame, Search, ShieldAlert, TrendingUp, X } from 'lucide-react';
import { commanderDecklistsData } from '@/data/commanderDecklistsData';
import { getMarketSpikes, analyzePreconSealedEconomics, getReleaseArticles, type MarketFormat, type PreconSealedAnalysis } from '@/lib/marketIntelligence';
import { loadPriceAlerts, refreshPriceAlerts, removePriceAlert, savePriceAlert, type PriceAlert } from '@/lib/priceAlerts';
import { buildWeeklyMarketDigest } from '@/lib/weeklyDigest';
import { clearDigestDeliveryLog, loadDigestDeliveryLog, recordDigestDelivery, type DigestDeliveryLogEntry } from '@/lib/digestDeliveryLog';
import { toast } from 'sonner';

export default function MarketReport() {
  const spikes = useMemo(() => getMarketSpikes(), []);
  const articles = useMemo(() => getReleaseArticles(), []);
  const preconAnalyses: PreconSealedAnalysis[] = useMemo(() => commanderDecklistsData.map((deck) => analyzePreconSealedEconomics(deck)), []);

  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [formatFilter, setFormatFilter] = useState<'all' | MarketFormat>('all');
  const [alertThreshold, setAlertThreshold] = useState(10);
  const [alerts, setAlerts] = useState<PriceAlert[]>(() => loadPriceAlerts());
  const [digestCopied, setDigestCopied] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [deliveryLog, setDeliveryLog] = useState<DigestDeliveryLogEntry[]>(() => loadDigestDeliveryLog());
  const [deliveryQuery, setDeliveryQuery] = useState('');
  const [deliveryStatus, setDeliveryStatus] = useState<'all' | 'sent' | 'failed'>('all');
  const [deliveryWindow, setDeliveryWindow] = useState<'all' | '7d' | '30d' | '90d'>('all');
  const activeArticle = articles.find((a) => a.id === selectedArticleId) || articles[0];

  useEffect(() => {
    setAlerts(refreshPriceAlerts(spikes));
  }, [spikes]);

  const visibleSpikes = useMemo(() => formatFilter === 'all' ? spikes : spikes.filter((spike) => spike.format === formatFilter), [formatFilter, spikes]);
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
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Updated daily via automated Scryfall snapshots</p>
          </div>

          <div className="mt-5 grid gap-3 border-y border-border py-4 sm:grid-cols-[auto_auto_auto_1fr] sm:items-center">
            <label className="flex h-10 items-center gap-2 border border-border bg-card px-3 text-xs font-bold uppercase tracking-wider">
              Format
              <select value={formatFilter} onChange={(event) => setFormatFilter(event.target.value as 'all' | MarketFormat)} className="bg-transparent font-mono text-xs font-semibold outline-none">
                <option value="all">All indexed formats</option>
                <option value="Commander">Commander only</option>
                <option value="Standard">Standard only</option>
              </select>
            </label>
            <label className="flex h-10 items-center gap-2 border border-border bg-card px-3 text-xs font-bold uppercase tracking-wider">
              Alert threshold
              <select value={alertThreshold} onChange={(event) => setAlertThreshold(Number(event.target.value))} className="bg-transparent font-mono text-xs font-semibold outline-none">
                <option value={5}>+5%</option>
                <option value={10}>+10%</option>
                <option value={20}>+20%</option>
                <option value={30}>+30%</option>
              </select>
            </label>
            <div className="flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground">
              <span>Commander {commanderSpikeCount}</span><span>Standard {standardSpikeCount}</span>
            </div>
            <p className="text-right text-xs text-muted-foreground">Alerts remain private in this browser. Standard results appear once Standard cards are included in the daily refresh feed.</p>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {visibleSpikes.slice(0, 8).map((spike) => {
              const tracked = alerts.find((alert) => alert.cardName.toLowerCase() === spike.cardName.toLowerCase());
              return (
                <div key={`${spike.format}-${spike.cardName}`} className={`border-2 bg-card p-4 transition-colors ${tracked?.triggered ? 'border-amber-500' : 'border-border hover:border-primary'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2"><span className="border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{spike.setCode}</span><span className="font-mono text-[10px] font-bold uppercase tracking-wider text-primary">{spike.format}</span></div>
                      <h3 className="mt-2 font-bold leading-snug">{spike.cardName}</h3>
                    </div>
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

          {visibleSpikes.length === 0 && <div className="mt-6 border-2 border-dashed border-border p-10 text-center"><p className="font-semibold">No {formatFilter} price spikes are indexed in the current daily snapshot.</p><p className="mt-2 text-sm text-muted-foreground">The filter is active and will populate when the corresponding format is included in a refresh.</p></div>}

          <div className="mt-8 border-2 border-border bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-mono text-xs font-bold uppercase tracking-wider text-primary">Private alert list</p><h3 className="mt-1 text-lg font-bold">Cards you are monitoring</h3></div><span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{alerts.length} saved</span></div>
            {alerts.length > 0 ? <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{alerts.map((alert) => <div key={alert.cardName} className={`flex items-center justify-between gap-3 border px-3 py-2 text-sm ${alert.triggered ? 'border-amber-500 bg-amber-500/10' : 'border-border'}`}><div><p className="font-semibold">{alert.cardName}</p><p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">+{alert.thresholdPercent}% from ${alert.baselinePrice.toFixed(2)}{alert.triggered ? ' · threshold reached' : ''}</p></div><button type="button" onClick={() => clearAlert(alert.cardName)} aria-label={`Remove ${alert.cardName} price alert`} className="text-muted-foreground hover:text-destructive"><X className="h-4 w-4" /></button></div>)}</div> : <p className="mt-3 text-sm text-muted-foreground">Use “Track price” on any indexed card to save a browser-only alert.</p>}
          </div>

          <div className="mt-4 border-2 border-primary/30 bg-primary/5 p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div><p className="font-mono text-xs font-bold uppercase tracking-wider text-primary">Weekly market digest &amp; Resend automation</p><h3 className="mt-1 text-lg font-bold">Preview and send momentum summary</h3><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Configured to send weekly to Krisaguero@gmail.com via Resend. Copy the plain text locally or test-dispatch the email broadcast right now.</p></div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={async () => { await navigator.clipboard.writeText(weeklyDigest.text); setDigestCopied(true); window.setTimeout(() => setDigestCopied(false), 2200); }} className="inline-flex items-center gap-2 border border-primary bg-primary px-3 py-2 font-mono text-xs font-bold uppercase tracking-wider text-primary-foreground hover:bg-primary/90">{digestCopied ? 'Digest copied' : 'Copy digest'}</button>
                <button type="button" disabled={isSendingEmail} onClick={async () => {
                  setIsSendingEmail(true);
                  try {
                    const resendApiKey = import.meta.env.VITE_RESEND_API_KEY;
                    if (!resendApiKey) throw new Error('Resend API key is not configured for this build.');
                    const res = await fetch('https://api.resend.com/emails', {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${resendApiKey}`,
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        from: 'MTG Market Desk <onboarding@resend.dev>',
                        to: ['Krisaguero@gmail.com'],
                        subject: weeklyDigest.subject,
                        html: weeklyDigest.html,
                        text: weeklyDigest.text,
                      }),
                    });
                    if (!res.ok) throw new Error('Resend dispatch failed');
                    recordDigestDelivery({ recipient: 'Krisaguero@gmail.com', subject: weeklyDigest.subject, status: 'sent', detail: 'Resend accepted the message.' });
                    setDeliveryLog(loadDigestDeliveryLog());
                    toast.success('Weekly market digest successfully dispatched to Krisaguero@gmail.com via Resend.');
                  } catch (err) {
                    recordDigestDelivery({ recipient: 'Krisaguero@gmail.com', subject: weeklyDigest.subject, status: 'failed', detail: 'Dispatch failed or the browser blocked the request.' });
                    setDeliveryLog(loadDigestDeliveryLog());
                    toast.error('Failed to dispatch email digest. Check network or Resend status.');
                  } finally {
                    setIsSendingEmail(false);
                  }
                }} className="inline-flex items-center gap-2 border border-border bg-card px-3 py-2 font-mono text-xs font-bold uppercase tracking-wider text-foreground hover:border-primary hover:text-primary">{isSendingEmail ? 'Sending...' : 'Send email digest now'}</button>
              </div>
            </div>
            <pre className="mt-4 max-h-44 overflow-auto border border-border bg-background p-3 font-mono text-xs leading-5 text-muted-foreground">{weeklyDigest.text}</pre>
          </div>

          <div className="mt-4 border-2 border-border bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><p className="font-mono text-xs font-bold uppercase tracking-wider text-primary">Delivery schedule log</p><h3 className="mt-1 text-lg font-bold">Past weekly digest dispatches</h3><p className="mt-2 text-sm text-muted-foreground">Private browser history of the last 20 send attempts. This records dispatch metadata only, not the API key or full email body.</p></div>
              <div className="flex gap-2"><button type="button" onClick={() => setDeliveryLog(loadDigestDeliveryLog())} className="border border-border px-3 py-2 font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground hover:border-primary hover:text-primary">Refresh log</button><button type="button" onClick={() => { clearDigestDeliveryLog(); setDeliveryLog([]); }} className="border border-border px-3 py-2 font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground hover:border-destructive hover:text-destructive">Clear log</button></div>
            </div>
            <div className="mt-4 grid gap-2 border-y border-border py-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
              <label className="flex min-h-10 items-center gap-2 border border-border bg-background px-3"><Search className="h-4 w-4 shrink-0 text-muted-foreground" /><span className="sr-only">Search delivery history</span><input value={deliveryQuery} onChange={(event) => setDeliveryQuery(event.target.value)} placeholder="Search recipient, subject, detail" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" /></label>
              <label className="flex min-h-10 items-center gap-2 border border-border bg-background px-3 text-xs font-bold uppercase tracking-wider">Status<select value={deliveryStatus} onChange={(event) => setDeliveryStatus(event.target.value as typeof deliveryStatus)} className="bg-transparent font-mono text-xs font-semibold outline-none"><option value="all">All</option><option value="sent">Sent</option><option value="failed">Failed</option></select></label>
              <label className="flex min-h-10 items-center gap-2 border border-border bg-background px-3 text-xs font-bold uppercase tracking-wider">Window<select value={deliveryWindow} onChange={(event) => setDeliveryWindow(event.target.value as typeof deliveryWindow)} className="bg-transparent font-mono text-xs font-semibold outline-none"><option value="all">All time</option><option value="7d">7 days</option><option value="30d">30 days</option><option value="90d">90 days</option></select></label>
            </div>
            <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Showing {filteredDeliveryLog.length} of {deliveryLog.length} dispatches</p>
            {filteredDeliveryLog.length > 0 ? <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[620px] border-collapse text-left text-xs"><thead><tr className="border-b border-border font-mono uppercase tracking-wider text-muted-foreground"><th className="px-3 py-2">Status</th><th className="px-3 py-2">Dispatched</th><th className="px-3 py-2">Recipient</th><th className="px-3 py-2">Subject</th><th className="px-3 py-2">Detail</th></tr></thead><tbody>{filteredDeliveryLog.map((entry) => <tr key={entry.id} className="border-b border-border/70"><td className="px-3 py-3"><span className={`border px-2 py-1 font-mono font-bold uppercase tracking-wider ${entry.status === 'sent' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600' : 'border-destructive/30 bg-destructive/10 text-destructive'}`}>{entry.status}</span></td><td className="px-3 py-3 whitespace-nowrap text-muted-foreground">{new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(entry.sentAt))}</td><td className="px-3 py-3 font-semibold">{entry.recipient}</td><td className="max-w-[260px] px-3 py-3 font-semibold">{entry.subject}</td><td className="px-3 py-3 text-muted-foreground">{entry.detail || '—'}</td></tr>)}</tbody></table></div> : <div className="mt-4 border border-dashed border-border p-6 text-center text-sm text-muted-foreground">{deliveryLog.length > 0 ? 'No dispatches match the current search and filters.' : 'No digest dispatches recorded in this browser yet.'}</div>}
          </div>
        </section>

        <section className="mt-14 sm:mt-20" aria-labelledby="decision-heading">
          <div className="border-b border-border pb-4"><p className="font-mono text-xs font-bold uppercase tracking-widest text-primary">Collection-Aware Economics</p><h2 id="decision-heading" className="text-2xl font-bold tracking-tight sm:text-3xl">Sealed Precon vs. Singles Buy Decision Matrix</h2><p className="mt-2 text-sm text-muted-foreground">Evaluates whether buying the full boxed precon makes financial sense based on your imported collection duplicates and new-card ratios.</p></div>
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">{preconAnalyses.map((analysis) => { const isBuySealed = analysis.recommendation === 'BUY_SEALED'; const isBuySingles = analysis.recommendation === 'BUY_SINGLES'; return <div key={analysis.deckId} className="border-2 border-border bg-card p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><span className="border border-primary/30 bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-primary">{analysis.setCode.toUpperCase()}</span><h3 className="mt-2 text-xl font-bold">{analysis.deckName}</h3><p className="text-xs text-muted-foreground">{analysis.setName}</p></div><div className={`border px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider ${isBuySealed ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : isBuySingles ? 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'border-border bg-muted text-muted-foreground'}`}>{isBuySealed ? 'Recommended: Buy Sealed' : isBuySingles ? 'Recommended: Buy Singles' : 'Neutral / Wait'}</div></div><div className="mt-6 grid grid-cols-2 gap-4 border-y border-border py-4 sm:grid-cols-4"><div><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Sealed MSRP</p><p className="mt-1 text-lg font-bold">${analysis.sealedMsrp}</p></div><div><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Top 5 Singles</p><p className="mt-1 text-lg font-bold">${analysis.topSinglesSum}</p></div><div><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">New Card Ratio</p><p className="mt-1 text-lg font-bold">{Math.round(analysis.newCardRatio * 100)}%</p></div><div><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Your Duplicates</p><p className="mt-1 text-lg font-bold text-primary">{analysis.ownedCardCount} cards</p></div></div><div className="mt-4 border border-border bg-muted/40 p-4"><p className="font-mono text-xs font-bold uppercase tracking-wider text-primary">Decision Rationale</p><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{analysis.rationale}</p>{analysis.ownedDuplicateValue > 0 && <p className="mt-3 font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">Your imported collection already covers ~${analysis.ownedDuplicateValue.toFixed(2)} in reprints for this deck.</p>}</div><div className="mt-5"><p className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">Top Value Singles in Deck</p><div className="mt-2 flex flex-wrap gap-2">{analysis.topSingles.map((single) => <div key={single.name} className="flex items-center gap-2 border border-border bg-background px-2.5 py-1 text-xs"><span className="font-semibold">{single.name}</span><span className="font-mono font-bold text-primary">${single.price.toFixed(2)}</span>{single.isNew && <span className="border border-primary/30 bg-primary/10 px-1 text-[9px] font-bold text-primary">NEW</span>}</div>)}</div></div><div className="mt-6 flex justify-end"><Link href={`/deck/${analysis.setCode}/${analysis.deckName.toLowerCase().replace(/\s+/g, '-')}`} className="inline-flex items-center gap-1 font-mono text-xs font-bold text-primary hover:underline">Inspect full decklist &amp; collection match <ArrowUpRight className="h-4 w-4" /></Link></div></div>; })}</div>
        </section>

        <section className="mt-14 sm:mt-20" aria-labelledby="articles-heading">
          <div className="border-b border-border pb-4"><p className="font-mono text-xs font-bold uppercase tracking-widest text-primary">Editorial Analysis</p><h2 id="articles-heading" className="text-2xl font-bold tracking-tight sm:text-3xl">Release Articles &amp; Market Insights</h2><p className="mt-2 text-sm text-muted-foreground">Source-linked reporting connecting product releases, print-run exclusivity, and economic recommendations.</p></div>
          <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-3"><div className="space-y-4">{articles.map((article) => { const isSelected = article.id === activeArticle.id; return <button key={article.id} type="button" onClick={() => setSelectedArticleId(article.id)} className={`w-full border-2 p-4 text-left transition-colors ${isSelected ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/50'}`}><div className="flex items-center justify-between text-xs text-muted-foreground"><span className="font-mono font-bold uppercase tracking-wider text-primary">{article.category}</span><span>{article.publishedAt}</span></div><h3 className="mt-2 font-bold leading-snug">{article.title}</h3><p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{article.summary}</p></button>; })}</div><div className="border-2 border-border bg-card p-6 lg:col-span-2"><div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-4"><div><span className="border border-primary/30 bg-primary/10 px-2 py-0.5 font-mono text-xs font-bold uppercase tracking-wider text-primary">{activeArticle.category}</span><p className="mt-2 text-xs text-muted-foreground">Published on {activeArticle.publishedAt}</p></div>{activeArticle.sourceUrl && <a href={activeArticle.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 border border-border bg-background px-3 py-1.5 font-mono text-xs font-semibold text-muted-foreground hover:border-primary hover:text-primary">Source: {activeArticle.sourceLabel || 'External'} <ExternalLink className="h-3 w-3" /></a>}</div><h2 className="mt-6 text-2xl font-extrabold sm:text-3xl">{activeArticle.title}</h2><div className="prose prose-sm sm:prose mt-6 max-w-none leading-relaxed text-muted-foreground [&>p]:mb-4" dangerouslySetInnerHTML={{ __html: activeArticle.bodyHtml }} /><div className="mt-8 flex items-center justify-between border-t border-border pt-4"><span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">MTG Economic Research Desk</span>{activeArticle.relatedSetCode && <Link href={`/${activeArticle.relatedSetCode}`} className="inline-flex items-center gap-1 font-mono text-xs font-bold text-primary hover:underline">View related set ({activeArticle.relatedSetCode.toUpperCase()}) <ArrowUpRight className="h-4 w-4" /></Link>}</div></div></div>
          <p className="mt-8 border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">Market data and thresholds are analytical aids, not guarantees. Prices can move quickly, liquidity varies by marketplace, and any purchase decision remains yours.</p>
        </section>
      </main>
    </div>
  );
}
