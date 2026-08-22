import dailySnapshot from '@/data/dailyMarketSnapshot.json';
import scryfallSnapshot from '@/data/scryfallRefreshSnapshot.json';
import commanderCardPriceSnapshot from '@/data/commanderCardPriceSnapshot.json';
import type { RawCommanderDeck, RawDeckCard } from '@/data/commanderDecklistsData';

export type PriceMatch = 'exact-set' | 'name-fallback';

export interface ResolvedCardPrice {
  usd: number;
  match: PriceMatch;
  source: string;
  updatedAt: string;
  sourceId?: string;
  sourceCount?: number;
  tcgplayerUsd?: number;
  cardKingdomUsd?: number;
  cardmarketUsd?: number;
}

export interface DeckMarketValue {
  totalUsd: number;
  pricedCards: number;
  unpricedCards: number;
  coveragePercent: number;
  updatedAt: string;
  source: string;
}

type SnapshotProduct = { id?: string; set_code?: string; name?: string; usd?: string | number | null; scryfall_uri?: string; refreshedAt?: string };
type DailySignal = { id?: string; key?: string; name?: string; setCode?: string; currentUsd?: number; lastUpdated?: string; source?: string; sourceCount?: number };
type CommanderPriceRecord = {
  id?: string;
  name?: string;
  set_code?: string;
  usd?: number | null;
  source?: string;
  updated_at?: string | null;
  prices?: { tcgplayer?: number | null; cardkingdom?: number | null; cardmarket?: number | null };
};

const dailySignals = ((dailySnapshot as any)?.signals || []) as DailySignal[];
const refreshProducts = ((scryfallSnapshot as any)?.products || []) as SnapshotProduct[];
const commanderPrices = ((commanderCardPriceSnapshot as any)?.records || []) as CommanderPriceRecord[];
const dailyUpdatedAt = (dailySnapshot as any)?.generatedAt || '';
const refreshUpdatedAt = (scryfallSnapshot as any)?.refreshedAt || '';
const commanderUpdatedAt = (commanderCardPriceSnapshot as any)?.generatedAt || (commanderCardPriceSnapshot as any)?.priceDate || '';

function normalized(value: string) {
  return value.trim().toLowerCase();
}

function numericPrice(value: unknown) {
  const price = Number(value);
  return Number.isFinite(price) && price > 0 ? price : null;
}

const exactIndex = new Map<string, ResolvedCardPrice>();
const nameIndex = new Map<string, ResolvedCardPrice>();

for (const signal of dailySignals) {
  const price = numericPrice(signal.currentUsd);
  if (!signal.name || price === null) continue;
  const record: ResolvedCardPrice = {
    usd: price,
    match: 'exact-set',
    source: signal.source || 'MTGJSON daily snapshot',
    updatedAt: signal.lastUpdated || dailyUpdatedAt,
    sourceId: signal.id || signal.key,
    sourceCount: signal.sourceCount,
  };
  const name = normalized(signal.name);
  const setCode = normalized(signal.setCode || '');
  if (setCode) exactIndex.set(`${setCode}::${name}`, record);
  if (!nameIndex.has(name) || nameIndex.get(name)!.updatedAt < record.updatedAt) nameIndex.set(name, record);
}

for (const product of refreshProducts) {
  const price = numericPrice(product.usd);
  if (!product.name || price === null) continue;
  const record: ResolvedCardPrice = {
    usd: price,
    match: 'exact-set',
    source: 'Scryfall refresh snapshot',
    updatedAt: product.refreshedAt || refreshUpdatedAt,
    sourceId: product.id,
  };
  const name = normalized(product.name);
  const setCode = normalized(product.set_code || '');
  if (setCode && !exactIndex.has(`${setCode}::${name}`)) exactIndex.set(`${setCode}::${name}`, record);
  if (!nameIndex.has(name)) nameIndex.set(name, record);
}

for (const product of commanderPrices) {
  const price = numericPrice(product.usd);
  if (!product.name || price === null) continue;
  const record: ResolvedCardPrice = {
    usd: price,
    match: 'exact-set',
    source: product.source || 'MTGJSON AllPricesToday',
    updatedAt: product.updated_at || commanderUpdatedAt,
    sourceId: product.id,
    tcgplayerUsd: numericPrice(product.prices?.tcgplayer) ?? undefined,
    cardKingdomUsd: numericPrice(product.prices?.cardkingdom) ?? undefined,
    cardmarketUsd: numericPrice(product.prices?.cardmarket) ?? undefined,
  };
  const name = normalized(product.name);
  const setCode = normalized(product.set_code || '');
  if (setCode) exactIndex.set(`${setCode}::${name}`, record);
  nameIndex.set(name, record);
}

export function resolveCardPrice(name: string, setCode?: string): ResolvedCardPrice | null {
  const normalizedName = normalized(name);
  const exact = setCode ? exactIndex.get(`${normalized(setCode)}::${normalizedName}`) : undefined;
  if (exact) return exact;
  const fallback = nameIndex.get(normalizedName);
  return fallback ? { ...fallback, match: 'name-fallback' } : null;
}

export function resolveDeckMarketValue(deck: RawCommanderDeck): DeckMarketValue {
  const entries = [...deck.commander, ...deck.cards];
  let totalUsd = 0;
  let pricedCards = 0;
  let unpricedCards = 0;
  let updatedAt = '';
  const sources = new Set<string>();

  for (const card of entries) {
    const quantity = Math.max(1, Number(card.count || 1));
    const resolved = resolveCardPrice(card.name, card.set_code || deck.set_code);
    if (!resolved) {
      unpricedCards += quantity;
      continue;
    }
    totalUsd += resolved.usd * quantity;
    pricedCards += quantity;
    if (resolved.updatedAt > updatedAt) updatedAt = resolved.updatedAt;
    sources.add(resolved.source);
  }

  const totalCards = pricedCards + unpricedCards;
  return {
    totalUsd: Number(totalUsd.toFixed(2)),
    pricedCards,
    unpricedCards,
    coveragePercent: totalCards ? Math.round((pricedCards / totalCards) * 100) : 0,
    updatedAt: updatedAt || dailyUpdatedAt || refreshUpdatedAt || 'Price index unavailable',
    source: Array.from(sources).join(' + ') || 'Price index unavailable',
  };
}

export function resolveCardListPrices(cards: RawDeckCard[], setCode: string) {
  return cards.map((card) => ({ card, price: resolveCardPrice(card.name, card.set_code || setCode) }));
}
