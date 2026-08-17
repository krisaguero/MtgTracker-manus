/* Design reminder: hard-edged market intelligence table; dense editorial data view with square controls, clear positive/negative signals, and responsive horizontal scrolling. */
import React, { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, ExternalLink, Filter, Search, Star, X } from 'lucide-react';
import type { MoverCard } from '@/lib/dailyMoversEngine';
import { isMarketCardWatched, type MarketWatchlistEntry } from '@/lib/marketWatchlist';

const OLD_SCHOOL_SET_CODES = new Set(['lea', 'leb', '2ed', 'arn', 'atq', 'leg', 'drk']);

type SortKey = 'name' | 'setCode' | 'currentUsd' | 'previousUsd' | 'changeUsd' | 'percentChange' | 'rarity';
type SortDirection = 'asc' | 'desc';

type MarketMoversTableProps = {
  data: MoverCard[];
  title: string;
  description: string;
  accent?: 'primary' | 'amber';
  showCategory?: boolean;
  emptyMessage?: string;
  isLoading?: boolean;
  loadingRowCount?: number;
  watchlist?: MarketWatchlistEntry[];
  onToggleWatchlist?: (mover: MoverCard) => void;
};

function formatUsd(value: number) {
  return `$${value.toFixed(2)}`;
}

function percentLabel(value: number) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

function PriceTrendSparkline({ mover }: { mover: MoverCard }) {
  const width = 84;
  const height = 28;
  const padding = 3;
  const history = mover.recentPrices.map((value) => Number(value)).filter((value) => Number.isFinite(value) && value >= 0);

  if (history.length < 3) {
    return (
      <div className="flex min-w-[100px] flex-col gap-1" data-testid="market-sparkline-fallback" role="img" aria-label={`Price trend unavailable: only ${history.length} recent observations are available`}>
        <div className="flex h-7 items-center gap-1 border-b border-dashed border-muted-foreground/40">
          <span className="block h-px w-5 bg-muted-foreground/40" />
          <span className="block h-px w-8 bg-muted-foreground/40" />
          <span className="block h-px w-3 bg-muted-foreground/40" />
        </div>
        <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-muted-foreground" aria-hidden="true">History pending</span>
      </div>
    );
  }

  const min = Math.min(...history);
  const max = Math.max(...history);
  const yFor = (value: number) => max === min
    ? height / 2
    : height - padding - ((value - min) / (max - min)) * (height - padding * 2);
  const xFor = (index: number) => padding + (index / (history.length - 1)) * (width - padding * 2);
  const points = history.map((value, index) => `${xFor(index)},${yFor(value)}`).join(' ');
  const isPositive = history[history.length - 1] >= history[0];
  const stroke = isPositive ? '#059669' : '#dc2626';
  const first = history[0] ?? mover.previousUsd;
  const last = history[history.length - 1] ?? mover.currentUsd;

  return (
    <div className="flex min-w-[100px] flex-col gap-1" data-testid="market-sparkline" role="img" aria-label={`Price trend with ${history.length} observations from ${formatUsd(first)} to ${formatUsd(last)}`}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" className="overflow-visible">
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="currentColor" strokeOpacity="0.15" strokeWidth="1" />
        <polyline points={points} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" />
        <circle cx={xFor(history.length - 1)} cy={yFor(last)} r="2.5" fill={stroke} />
      </svg>
      <span className={`font-mono text-[9px] font-bold uppercase tracking-wider ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}`} aria-hidden="true">
        {isPositive ? 'Rising' : 'Falling'} · {percentLabel(mover.percentChange)}
      </span>
    </div>
  );
}

function isOldSchoolMover(mover: MoverCard) {
  return OLD_SCHOOL_SET_CODES.has(mover.setCode.toLowerCase());
}

type MarketFilterOptions = {
  cardNameQuery: string;
  searchQuery: string;
  upwardTrendOnly: boolean;
  categoryFilter: string;
  sourceFilter: string;
  rarityFilter: string;
  minimumMove: string;
  sortKey: SortKey;
  sortDirection: SortDirection;
};

export function hasUpwardPriceTrend(mover: MoverCard) {
  const history = mover.recentPrices.map(Number).filter((value) => Number.isFinite(value) && value >= 0);
  return history.length >= 3 && (history[history.length - 1] ?? 0) > (history[0] ?? 0);
}

export function filterMarketMovers(data: MoverCard[], options: MarketFilterOptions) {
  const query = options.searchQuery.trim().toLowerCase();
  const cardNameQuery = options.cardNameQuery.trim().toLowerCase();
  const minimum = Number(options.minimumMove) || 0;

  return data
    .filter((item) => !cardNameQuery || item.name.toLowerCase().includes(cardNameQuery))
    .filter((item) => !options.upwardTrendOnly || hasUpwardPriceTrend(item))
    .filter((item) => options.categoryFilter === 'all' || item.category === options.categoryFilter)
    .filter((item) => options.sourceFilter === 'all' || item.signalSource === options.sourceFilter)
    .filter((item) => options.rarityFilter === 'all' || item.rarity === options.rarityFilter)
    .filter((item) => Math.abs(item.percentChange) >= minimum)
    .filter((item) => {
      if (!query) return true;
      return [item.name, item.setCode, item.setName, item.thesis, item.signalSource].some((value) => value.toLowerCase().includes(query));
    })
    .sort((left, right) => {
      const leftValue = left[options.sortKey];
      const rightValue = right[options.sortKey];
      const comparison = typeof leftValue === 'number' && typeof rightValue === 'number'
        ? leftValue - rightValue
        : String(leftValue).localeCompare(String(rightValue));
      return options.sortDirection === 'asc' ? comparison : -comparison;
    });
}

export function MarketMoversTable({
  data,
  title,
  description,
  accent = 'primary',
  showCategory = true,
  emptyMessage = 'No records match the current filters.',
  isLoading = false,
  loadingRowCount = 7,
  watchlist = [],
  onToggleWatchlist,
}: MarketMoversTableProps) {
  const [cardNameQuery, setCardNameQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [upwardTrendOnly, setUpwardTrendOnly] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [rarityFilter, setRarityFilter] = useState('all');
  const [minimumMove, setMinimumMove] = useState('0');
  const [sortKey, setSortKey] = useState<SortKey>('percentChange');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const categories = useMemo(() => Array.from(new Set(data.map((item) => item.category))).sort(), [data]);
  const sources = useMemo(() => Array.from(new Set(data.map((item) => item.signalSource))).sort(), [data]);

  const filteredRows = useMemo(() => filterMarketMovers(data, {
    cardNameQuery,
    searchQuery,
    upwardTrendOnly,
    categoryFilter,
    sourceFilter,
    rarityFilter,
    minimumMove,
    sortKey,
    sortDirection,
  }), [cardNameQuery, categoryFilter, data, minimumMove, rarityFilter, searchQuery, sortDirection, sortKey, sourceFilter, upwardTrendOnly]);

  function updateSort(nextKey: SortKey) {
    if (sortKey === nextKey) {
      setSortDirection((current) => current === 'asc' ? 'desc' : 'asc');
      return;
    }
    setSortKey(nextKey);
    setSortDirection(nextKey === 'name' || nextKey === 'setCode' || nextKey === 'rarity' ? 'asc' : 'desc');
  }

  function resetFilters() {
    setCardNameQuery('');
    setSearchQuery('');
    setUpwardTrendOnly(false);
    setCategoryFilter('all');
    setSourceFilter('all');
    setRarityFilter('all');
    setMinimumMove('0');
  }

  const hasFilters = Boolean(cardNameQuery || searchQuery || upwardTrendOnly || categoryFilter !== 'all' || sourceFilter !== 'all' || rarityFilter !== 'all' || minimumMove !== '0');
  const upwardTrendCount = useMemo(() => data.filter(hasUpwardPriceTrend).length, [data]);
  const headingBorder = accent === 'amber' ? 'border-amber-500/40' : 'border-primary/40';
  const labelColor = accent === 'amber' ? 'text-amber-700 dark:text-amber-300' : 'text-primary';
  const buttonActive = accent === 'amber' ? 'border-amber-500 bg-amber-500 text-black' : 'border-primary bg-primary text-primary-foreground';

  return (
    <section className={`border-2 ${headingBorder} bg-card`} aria-labelledby={`${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-heading`} aria-busy={isLoading}>
      <div className="border-b border-border p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className={`font-mono text-[11px] font-bold uppercase tracking-[0.2em] ${labelColor}`}>Market data table</p>
            <h2 id={`${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-heading`} className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">{description}</p>
          </div>
          <div className="border border-border bg-background px-3 py-2 text-right font-mono">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Rows shown</p>
            <p className={`text-xl font-extrabold ${labelColor}`}>{isLoading ? '…' : filteredRows.length}<span className="text-xs font-normal text-muted-foreground"> / {isLoading ? '—' : data.length}</span></p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <label className="flex h-10 items-center gap-2 border border-border bg-background px-3 focus-within:border-primary lg:col-span-2">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search set, thesis, or signal"
              className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
              aria-label={`Search ${title}`}
            />
            {searchQuery && <button type="button" onClick={() => setSearchQuery('')} aria-label="Clear search"><X className="h-3.5 w-3.5 text-muted-foreground" /></button>}
          </label>

          {showCategory && (
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="h-10 border border-border bg-background px-3 font-mono text-[11px] font-bold uppercase tracking-wider outline-none focus:border-primary" aria-label="Filter by category">
              <option value="all">All categories</option>
              {categories.map((category) => <option key={category} value={category}>{category.replace(/-/g, ' ')}</option>)}
            </select>
          )}

          <select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)} className="h-10 border border-border bg-background px-3 font-mono text-[11px] font-bold uppercase tracking-wider outline-none focus:border-primary" aria-label="Filter by signal source">
            <option value="all">All sources</option>
            {sources.map((source) => <option key={source} value={source}>{source}</option>)}
          </select>

          <select value={rarityFilter} onChange={(event) => setRarityFilter(event.target.value)} className="h-10 border border-border bg-background px-3 font-mono text-[11px] font-bold uppercase tracking-wider outline-none focus:border-primary" aria-label="Filter by rarity">
            <option value="all">All rarities</option>
            <option value="common">Common</option>
            <option value="uncommon">Uncommon</option>
            <option value="rare">Rare</option>
            <option value="mythic">Mythic</option>
          </select>
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setUpwardTrendOnly((current) => !current)}
              aria-pressed={upwardTrendOnly}
              aria-label={`Show only cards with an upward price trend in ${title}`}
              className={`inline-flex items-center gap-2 border px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wider transition-colors ${upwardTrendOnly ? buttonActive : 'border-border bg-background text-muted-foreground hover:border-primary hover:text-primary'}`}
            >
              <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
              Upward trend only
              <span className="text-[10px] opacity-75">{upwardTrendCount}</span>
            </button>
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">3+ observations</span>
          </div>
          <label className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            <Filter className="h-3.5 w-3.5" />
            Minimum absolute move
            <select value={minimumMove} onChange={(event) => setMinimumMove(event.target.value)} className="border border-border bg-background px-2 py-1 text-foreground outline-none focus:border-primary" aria-label="Minimum absolute percentage move">
              <option value="0">Any</option>
              <option value="5">5%</option>
              <option value="10">10%</option>
              <option value="25">25%</option>
              <option value="50">50%</option>
              <option value="100">100%</option>
            </select>
          </label>
          {hasFilters && <button type="button" onClick={resetFilters} className={`border px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wider ${buttonActive}`}>Reset filters</button>}
        </div>
      </div>

      <div className="border-y border-border bg-background/70 p-4 sm:p-5" role="search" aria-label={`Quick card search for ${title}`}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <label htmlFor={`${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-card-name-search`} className={`font-mono text-[11px] font-bold uppercase tracking-wider ${labelColor}`}>
            Quick card lookup
          </label>
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Matches card names only</span>
        </div>
        <div className="mt-3 flex h-11 items-center gap-2 border-2 border-border bg-card px-3 focus-within:border-primary sm:max-w-xl">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <input
            id={`${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-card-name-search`}
            value={cardNameQuery}
            onChange={(event) => setCardNameQuery(event.target.value)}
            placeholder="Search by card name…"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            aria-label={`Search ${title} by card name`}
          />
          {cardNameQuery && <button type="button" onClick={() => setCardNameQuery('')} aria-label={`Clear card name search for ${title}`}><X className="h-4 w-4 text-muted-foreground hover:text-foreground" /></button>}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] border-collapse text-left" aria-label={title}>
          <thead className="bg-background">
            <tr className="border-b border-border">
              <th scope="col" className="w-16 px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Watch</th>
              {([
                ['name', 'Card'],
                ['setCode', 'Set'],
                ['currentUsd', 'Current'],
                ['previousUsd', 'Previous'],
                ['changeUsd', '$ Move'],
                ['percentChange', '% Move'],
                ['rarity', 'Rarity'],
              ] as Array<[SortKey, string]>).map(([key, label]) => (
                <th key={key} scope="col" className="px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <button type="button" onClick={() => updateSort(key)} className="inline-flex items-center gap-1.5 hover:text-primary" aria-label={`Sort by ${label}`}>
                    {label}
                    {sortKey === key ? (sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-50" />}
                  </button>
                </th>
              ))}
              {showCategory && <th scope="col" className="px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Category</th>}
              <th scope="col" className="px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Signal</th>
              <th scope="col" className="px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Source</th>
              <th scope="col" className="px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Trend</th>
            </tr>
          </thead>
          <tbody aria-live="polite">
            {isLoading ? Array.from({ length: loadingRowCount }, (_, index) => (
              <tr key={`market-table-skeleton-${index}`} data-testid="market-table-skeleton-row" className="border-b border-border/80">
                <td className="px-4 py-4"><span className="block h-8 w-8 animate-pulse bg-muted" aria-hidden="true" /></td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <span className="h-4 w-7 animate-pulse bg-muted" aria-hidden="true" />
                    <span className="h-4 w-40 animate-pulse bg-muted" aria-hidden="true" />
                  </div>
                  <span className="mt-2 block h-3 w-56 animate-pulse bg-muted" aria-hidden="true" />
                </td>
                {Array.from({ length: showCategory ? 9 : 8 }, (_, cellIndex) => (
                  <td key={`market-table-skeleton-cell-${index}-${cellIndex}`} className="px-4 py-4">
                    <span className={`block h-3 animate-pulse bg-muted ${cellIndex % 3 === 0 ? 'w-16' : cellIndex % 3 === 1 ? 'w-20' : 'w-12'}`} aria-hidden="true" />
                  </td>
                ))}
                <td className="px-4 py-4"><span className="block h-8 w-24 animate-pulse bg-muted" aria-hidden="true" /></td>
              </tr>
            )) : filteredRows.map((mover) => {
              const isPositive = mover.percentChange >= 0;
              const oldSchool = isOldSchoolMover(mover);
              return (
                <tr key={`${mover.id}-${mover.name}`} className="border-b border-border/80 transition-colors hover:bg-primary/5">
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => onToggleWatchlist?.(mover)}
                      disabled={!onToggleWatchlist}
                      aria-pressed={isMarketCardWatched(mover, watchlist)}
                      aria-label={`${isMarketCardWatched(mover, watchlist) ? 'Remove' : 'Add'} ${mover.name} ${isMarketCardWatched(mover, watchlist) ? 'from' : 'to'} watchlist`}
                      title={isMarketCardWatched(mover, watchlist) ? 'Remove from watchlist' : 'Add to watchlist'}
                      className={`inline-flex h-8 w-8 items-center justify-center border transition-colors ${isMarketCardWatched(mover, watchlist) ? 'border-amber-500 bg-amber-500/15 text-amber-600 dark:text-amber-300' : 'border-border bg-background text-muted-foreground hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-300'} disabled:cursor-default disabled:opacity-100`}
                    >
                      <Star className="h-4 w-4" fill={isMarketCardWatched(mover, watchlist) ? 'currentColor' : 'none'} aria-hidden="true" />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {oldSchool && <span className="border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">OS</span>}
                      <span className="font-bold text-sm">{mover.name}</span>
                    </div>
                    <p className="mt-1 max-w-[280px] truncate text-[11px] text-muted-foreground">{mover.thesis}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs font-bold uppercase">{mover.setCode}</td>
                  <td className="px-4 py-3 font-mono text-sm font-bold text-primary">{formatUsd(mover.currentUsd)}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{formatUsd(mover.previousUsd)}</td>
                  <td className={`px-4 py-3 font-mono text-xs font-bold ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}`}>{isPositive ? '+' : ''}{formatUsd(mover.changeUsd)}</td>
                  <td className={`px-4 py-3 font-mono text-sm font-extrabold ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}`}>{percentLabel(mover.percentChange)}</td>
                  <td className="px-4 py-3 font-mono text-[10px] font-bold uppercase text-muted-foreground">{mover.rarity}</td>
                  {showCategory && <td className="px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{mover.category.replace(/-/g, ' ')}</td>}
                  <td className="px-4 py-3 text-xs text-muted-foreground">{mover.signalSource}</td>
                  <td className="px-4 py-3">
                    <a href={`https://scryfall.com/search?q=${encodeURIComponent(mover.name)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-wider text-primary hover:underline">
                      Open <ExternalLink className="h-3 w-3" />
                    </a>
                  </td>
                  <td className="px-4 py-3"><PriceTrendSparkline mover={mover} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!isLoading && filteredRows.length === 0 && <div className="border-t border-border p-10 text-center text-sm text-muted-foreground">{emptyMessage}</div>}
      {isLoading && <div className="border-t border-border px-5 py-3 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground" role="status">Loading Parquet market data…</div>}
      <div className="border-t border-border px-5 py-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground sm:px-6">
        Sort any column · filter by source, rarity, category, or absolute move · scroll horizontally on mobile
      </div>
    </section>
  );
}
