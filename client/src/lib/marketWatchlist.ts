import type { MoverCard } from '@/lib/dailyMoversEngine';

export type MarketWatchlistEntry = {
  cardName: string;
  setCode: string;
  addedAt: string;
};

const STORAGE_KEY = 'mtg_tracker_market_watchlist_v1';

export function getMarketWatchKey(card: Pick<MoverCard, 'name' | 'setCode'>) {
  return `${card.name.trim().toLowerCase()}::${card.setCode.trim().toLowerCase()}`;
}

export function loadMarketWatchlist(): MarketWatchlistEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((value): value is MarketWatchlistEntry => Boolean(
      value
      && typeof value === 'object'
      && typeof (value as MarketWatchlistEntry).cardName === 'string'
      && typeof (value as MarketWatchlistEntry).setCode === 'string'
      && typeof (value as MarketWatchlistEntry).addedAt === 'string',
    ));
  } catch {
    return [];
  }
}

function saveMarketWatchlist(entries: MarketWatchlistEntry[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Keep the active-view state usable if browser storage is unavailable.
  }
}

export function isMarketCardWatched(card: Pick<MoverCard, 'name' | 'setCode'>, entries: MarketWatchlistEntry[]) {
  const key = getMarketWatchKey(card);
  return entries.some((entry) => getMarketWatchKey({ name: entry.cardName, setCode: entry.setCode }) === key);
}

export function toggleMarketWatchlist(card: Pick<MoverCard, 'name' | 'setCode'>, entries = loadMarketWatchlist()): MarketWatchlistEntry[] {
  const key = getMarketWatchKey(card);
  const next = isMarketCardWatched(card, entries)
    ? entries.filter((entry) => getMarketWatchKey({ name: entry.cardName, setCode: entry.setCode }) !== key)
    : [...entries, { cardName: card.name, setCode: card.setCode, addedAt: new Date().toISOString() }];
  saveMarketWatchlist(next);
  return next;
}
