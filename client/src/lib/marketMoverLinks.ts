import { canonicalMarketRows } from '@/lib/canonicalMarketEngine';
import { marketSignalsData } from '@/data/marketSignals';

export interface LinkedMarketMover {
  name: string;
  setCode: string;
  setName: string;
  category: string;
  price: number;
  percentChange: number;
  trend: 'up' | 'down';
  reason: string;
  source: string;
  articleHref: string;
  cardHref: string;
  setHref: string;
}

export function moverSlug(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function marketMoverArticleHref(name: string) {
  return `/market-mover/${moverSlug(name)}`;
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

export function linkedMarketMover(row: (typeof canonicalMarketRows)[number]): LinkedMarketMover {
  return {
    name: row.name,
    setCode: row.setCode,
    setName: row.setName,
    category: row.category,
    price: row.price,
    percentChange: row.pct,
    trend: row.trend,
    reason: row.reason,
    source: row.isCatalyst ? 'Canonical market snapshot · catalyst' : 'Canonical market snapshot',
    articleHref: marketMoverArticleHref(row.name),
    cardHref: `/card/${encodeURIComponent(row.name)}`,
    setHref: `/${row.setCode}`,
  };
}

export function moversForCard(name: string, setCode?: string): LinkedMarketMover[] {
  const normalizedName = normalize(name);
  const normalizedSet = setCode ? normalize(setCode) : '';
  return canonicalMarketRows
    .filter((row) => normalize(row.name) === normalizedName && (!normalizedSet || normalize(row.setCode) === normalizedSet))
    .map(linkedMarketMover)
    .sort((a, b) => Math.abs(b.percentChange) - Math.abs(a.percentChange));
}

export function moversForSet(setCode: string): LinkedMarketMover[] {
  const normalizedSet = normalize(setCode);
  return canonicalMarketRows
    .filter((row) => normalize(row.setCode) === normalizedSet)
    .map(linkedMarketMover)
    .sort((a, b) => Math.abs(b.percentChange) - Math.abs(a.percentChange));
}

export interface SuppliedMarketSignal {
  cardName: string;
  setCode: string;
  setName: string;
  trendType: string;
  summary: string;
  sourceLabel: string;
  sourceUrl: string;
  asOf: string;
  articleHref: string;
  cardHref?: string;
  setHref: string;
}

function suppliedSignal(signal: (typeof marketSignalsData)[number]): SuppliedMarketSignal {
  const isCard = !signal.cardName.includes('Staples') && !signal.cardName.includes('Reserved List');
  return {
    ...signal,
    articleHref: '/market-watch-article',
    cardHref: isCard ? `/card/${encodeURIComponent(signal.cardName)}` : undefined,
    setHref: `/${signal.setCode}`,
  };
}

export function suppliedSignalsForCard(name: string): SuppliedMarketSignal[] {
  return marketSignalsData.filter((signal) => normalize(signal.cardName) === normalize(name)).map(suppliedSignal);
}

export function suppliedSignalsForSet(setCode: string): SuppliedMarketSignal[] {
  return marketSignalsData.filter((signal) => normalize(signal.setCode) === normalize(setCode)).map(suppliedSignal);
}

export function allLinkedMarketMovers(): LinkedMarketMover[] {
  return canonicalMarketRows.map(linkedMarketMover);
}
