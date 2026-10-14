import { useEffect, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, ExternalLink, Info, RefreshCw } from 'lucide-react';

type FeedItem = {
  rank: number;
  id: string;
  name: string;
  setCode: string | null;
  setName: string | null;
  collectorNumber: string | null;
  currentUsd: number;
  previousUsd: number;
  changeUsd: number;
  percentChange: number;
  sourceCount: number;
  tcgplayerMarketUsd: number | null;
  cardKingdomUsd: number | null;
  scryfallSearchUrl: string | null;
  lastUpdated: string | null;
};

type FeedCategory = {
  id: string;
  label: string;
  criteria: string;
  items: FeedItem[];
};

type MoversFeed = {
  schemaVersion: number;
  status: 'warming_up' | 'ready';
  generatedAt: string | null;
  marketScope: string;
  sources: string[];
  methodology: string;
  sourceUrl: string;
  historyDaysAvailable: number;
  signalCount: number;
  categories: FeedCategory[];
  warnings: Array<{ setCode?: string; name?: string; message?: string }>;
  disclaimer: string;
};

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const timestamp = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'UTC',
});
const dateOnly = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeZone: 'UTC' });

function formatTimestamp(value: string | null) {
  if (!value) return 'Not available';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : `${timestamp.format(date)} UTC`;
}

function signedCurrency(value: number) {
  return `${value >= 0 ? '+' : '−'}${currency.format(Math.abs(value))}`;
}

function FeedItemRow({ item }: { item: FeedItem }) {
  const positive = item.changeUsd > 0;
  const negative = item.changeUsd < 0;
  const changeClass = positive
    ? 'text-emerald-700 dark:text-emerald-300'
    : negative
      ? 'text-destructive'
      : 'text-muted-foreground';
  const Icon = positive ? ArrowUpRight : negative ? ArrowDownRight : Info;

  return (
    <li className="border-t border-border py-3 first:border-t-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-[10px] font-bold text-muted-foreground">#{item.rank}</span>
            <h4 className="font-semibold leading-snug">{item.name}</h4>
          </div>
          <p className="ml-7 mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {[item.setName || item.setCode, item.collectorNumber ? `#${item.collectorNumber}` : null].filter(Boolean).join(' · ') || 'Printing not specified'}
          </p>
        </div>
      </div>
      <div className="ml-7 mt-2 grid grid-cols-2 gap-2 border-y border-border/70 py-2 sm:flex sm:flex-wrap sm:items-center sm:gap-x-5">
        <span className="font-mono text-xs font-bold text-foreground">Current <span className="text-sm">{currency.format(item.currentUsd)}</span></span>
        <span className={`flex items-center gap-1 font-mono text-xs font-bold ${changeClass}`} aria-label={`Change ${signedCurrency(item.changeUsd)}, ${item.percentChange >= 0 ? '+' : ''}${item.percentChange.toFixed(2)} percent`}>
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />{signedCurrency(item.changeUsd)} ({item.percentChange >= 0 ? '+' : ''}{item.percentChange.toFixed(2)}%)
        </span>
        <span className="font-mono text-[10px] text-muted-foreground">Prior {currency.format(item.previousUsd)}</span>
        <span className="font-mono text-[10px] text-muted-foreground">{item.sourceCount} price source{item.sourceCount === 1 ? '' : 's'}</span>
        {item.scryfallSearchUrl && (
          <a href={item.scryfallSearchUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-mono text-[10px] text-primary hover:underline">
            Printing <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
        )}
      </div>
    </li>
  );
}

function MoversFeedContent({ feed }: { feed: MoversFeed }) {
  const categoryMatches = feed.categories.reduce((total, category) => total + category.items.length, 0);
  const visiblePrintingCount = new Set(feed.categories.flatMap((category) => category.items.map((item) => item.id))).size;
  const latestDataAt = feed.categories.flatMap((category) => category.items.map((item) => item.lastUpdated)).filter((value): value is string => Boolean(value)).sort().at(-1) || feed.generatedAt;

  return (
    <section className="mt-6 border border-border bg-card" aria-labelledby="mtgjson-movers-heading">
      <div className="border-b border-border bg-muted/30 p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-primary">Compact daily snapshot overview · USD</p>
            <h2 id="mtgjson-movers-heading" className="mt-2 text-2xl font-black tracking-tight">Five market-signal views</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{feed.marketScope}</p>
          </div>
          <div className="border border-border bg-background px-3 py-2 font-mono text-right">
            <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{feed.status === 'ready' ? 'Observation window' : 'Feed status'}</p>
            <p className="mt-1 text-xs font-bold">{feed.status === 'ready' ? `${feed.historyDaysAvailable} saved dates` : 'Warming up'}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          <span>Data as of {latestDataAt ? dateOnly.format(new Date(latestDataAt)) : 'not available'}</span>
          <span>Generated {formatTimestamp(feed.generatedAt)}</span>
          <span>{feed.signalCount} priced printings tracked</span>
          <a href={feed.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">Source: MTGJSON <ExternalLink className="h-3 w-3" aria-hidden="true" /></a>
        </div>
        <p className="mt-3 text-xs leading-5 text-muted-foreground">Coverage: {feed.signalCount} priced printings are tracked, and {visiblePrintingCount} unique printings currently meet the displayed mover thresholds ({categoryMatches} category matches). Threshold groups can overlap, so a printing may appear in more than one category. This limited daily snapshot is separate from the historical imported CSV, not another live feed.</p>
        {feed.status === 'warming_up' && (
          <p className="mt-4 border border-amber-600/30 bg-amber-500/10 p-3 text-xs leading-5 text-amber-800 dark:text-amber-200" role="status">
            The feed needs at least two distinct daily observations before it can label price changes as movers.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2 xl:grid-cols-3">
        {feed.categories.map((category) => (
          <section key={category.id} className="bg-card p-4 sm:p-5" aria-labelledby={`mtg-movers-${category.id}`}>
            <h3 id={`mtg-movers-${category.id}`} className="text-lg font-bold">{category.label}<span className="ml-2 font-mono text-[10px] font-normal uppercase tracking-wider text-muted-foreground">{category.items.length} match{category.items.length === 1 ? '' : 'es'}</span></h3>
            <p className="mt-1 min-h-10 text-xs leading-5 text-muted-foreground">{category.criteria}</p>
            {category.items.length > 0 ? (
              <>
                <ol className="mt-3">
                  {category.items.slice(0, 2).map((item) => <FeedItemRow key={item.id} item={item} />)}
                </ol>
                {category.items.length > 2 && <details className="mt-2 border-t border-border pt-2">
                  <summary className="cursor-pointer font-mono text-[10px] font-bold uppercase tracking-wider text-primary">Show {category.items.length - 2} more matches</summary>
                  <ol className="mt-2">{category.items.slice(2).map((item) => <FeedItemRow key={item.id} item={item} />)}</ol>
                </details>}
              </>
            ) : (
              <p className="mt-3 border border-dashed border-border p-3 text-xs leading-5 text-muted-foreground">No tracked printing met this category’s threshold in the saved observation window.</p>
            )}
          </section>
        ))}
      </div>

      <div className="space-y-3 border-t border-border bg-muted/30 p-4 sm:p-5">
        <p className="text-xs leading-5 text-muted-foreground"><span className="font-bold text-foreground">Method:</span> {feed.methodology} {feed.sources.join('; ')}. These are movements between saved observations, not verified completed sales.</p>
        {feed.warnings.length > 0 && (
          <div className="border border-amber-600/30 bg-amber-500/10 p-3 text-xs leading-5 text-amber-800 dark:text-amber-200" role="status">
            <p className="font-bold">Source coverage warnings</p>
            <ul className="mt-1 list-disc pl-5">
              {feed.warnings.map((warning, index) => <li key={`${warning.setCode || warning.name || 'warning'}-${index}`}>{[warning.setCode, warning.name, warning.message].filter(Boolean).join(': ')}</li>)}
            </ul>
          </div>
        )}
        <p className="text-[11px] leading-5 text-muted-foreground">{feed.disclaimer}</p>
      </div>
    </section>
  );
}

export function MtgMoversFeed() {
  const [feed, setFeed] = useState<MoversFeed | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/mtg-movers.json', { headers: { Accept: 'application/json' } })
      .then((response) => {
        if (!response.ok) throw new Error(`Feed request failed (${response.status})`);
        return response.json() as Promise<MoversFeed>;
      })
      .then((payload) => {
        if (!active) return;
        if (payload.schemaVersion !== 1 || !Array.isArray(payload.categories)) {
          throw new Error('The market feed has an unsupported format.');
        }
        setFeed(payload);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setError(cause instanceof Error ? cause.message : 'Market feed could not be loaded.');
      });
    return () => { active = false; };
  }, []);

  if (error) {
    return (
      <section className="mt-6 border border-border bg-card p-5" aria-labelledby="mtgjson-movers-heading" role="status">
        <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-amber-700"><Info className="h-4 w-4" aria-hidden="true" /> Snapshot feed unavailable</div>
        <h2 id="mtgjson-movers-heading" className="mt-2 text-xl font-bold">Tracked-print market movers</h2>
        <p className="mt-2 text-sm text-muted-foreground">{error} The daily feed is generated by the existing market refresh workflow; this page does not substitute unverified prices.</p>
      </section>
    );
  }

  if (!feed) {
    return (
      <section className="mt-6 border border-border bg-card p-5" aria-labelledby="mtgjson-movers-heading" aria-busy="true">
        <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-primary"><RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" /> Loading MTGJSON snapshot</div>
        <h2 id="mtgjson-movers-heading" className="mt-2 text-xl font-bold">Tracked-print market movers</h2>
      </section>
    );
  }

  return <MoversFeedContent feed={feed} />;
}
