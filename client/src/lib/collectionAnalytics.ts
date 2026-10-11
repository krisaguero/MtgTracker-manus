import { loadOwnedCollection, type OwnedCard } from './manaboxParser';
import { resolveCardPrice } from './marketPriceIndex';
import { commanderDecklists } from '@/data/commanderDecklists';
import dailySnapshot from '@/data/dailyMarketSnapshot.json';

export interface MissingCardItem {
  name: string;
  needed: number;
  owned: number;
  missing: number;
  isBasicLand: boolean;
}

export function isBasicLandName(name: string) {
  return /^(?:snow-covered )?(?:plains|island|swamp|mountain|forest|wastes)$/i.test(name.trim());
}

interface CardRef {
  name: string;
  count?: number;
  quantity?: number;
}

export function getMissingCardsForDeck(commanderCards: CardRef[], mainCards: CardRef[]): MissingCardItem[] {
  const collection = loadOwnedCollection();
  const ownedMap = new Map<string, number>();
  for (const c of collection) {
    ownedMap.set(c.name.toLowerCase(), c.quantity);
  }

  const allCards = [...commanderCards, ...mainCards];
  const missingList: MissingCardItem[] = [];
  for (const entry of allCards) {
    const required = entry.count || entry.quantity || 1;
    const ownedQty = ownedMap.get(entry.name.toLowerCase()) || 0;
    if (ownedQty < required) {
      missingList.push({
        name: entry.name,
        needed: required,
        owned: ownedQty,
        missing: required - ownedQty,
        isBasicLand: isBasicLandName(entry.name),
      });
    }
  }
  return missingList;
}

export function formatCardKingdomShoppingList(missing: MissingCardItem[]): string {
  return missing.map((item) => `${item.missing} ${item.name}`).join('\n');
}

export function formatTcgplayerShoppingList(missing: MissingCardItem[]): string {
  return missing.map((item) => `${item.missing} ${item.name}`).join('\n');
}

function csvCell(value: string | number) {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function formatMissingCardsCsv(missing: MissingCardItem[]): string {
  const header = ['Card Name', 'Missing Quantity', 'Owned Quantity', 'Deck Quantity'];
  const rows = missing.map((item) => [item.name, item.missing, item.owned, item.needed].map(csvCell).join(','));
  return [header.join(','), ...rows].join('\n');
}

export function formatMissingCardsText(missing: MissingCardItem[]): string {
  return [
    'MTG Sets Tracker — Missing Card Shopping List',
    '',
    ...missing.map((item) => `${item.missing}x ${item.name} (owned ${item.owned}/${item.needed})`),
    '',
    `Generated ${new Date().toLocaleDateString()}`,
  ].join('\n');
}

export function downloadTextFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export interface DeckCoverageRecommendation {
  deckSlug: string;
  setName: string;
  setCode: string;
  deckName: string;
  totalCards: number;
  ownedCards: number;
  coveragePercentage: number;
  approxValue?: number;
  synopsis?: string;
}

export interface SetEquityBreakdown {
  setName: string;
  setCode: string;
  cardCount: number;
  /** Sum of real indexed prices only; unpriced cards contribute nothing. */
  totalValueUsd: number;
  pricedCardCount: number;
  unpricedCardCount: number;
}

export interface CollectionValuation {
  /** Sum of real indexed prices only; unpriced cards are excluded, never estimated. */
  totalEquityUsd: number;
  setBreakdowns: SetEquityBreakdown[];
  pricedCardCount: number;
  unpricedCardCount: number;
  /** Share of owned copies that have a real price, 0-100. */
  coveragePercent: number;
  snapshotDate: string;
}

export type CardPriceLookup = (name: string, setCode?: string) => number | null;

/**
 * Builds a price map from the daily market snapshot and decklists.
 */
export function getCardPriceMap(): Map<string, number> {
  const priceMap = new Map<string, number>();
  
  // 1. Load prices from daily market snapshot signals
  const signals = (dailySnapshot as any)?.signals || [];
  for (const signal of signals) {
    if (signal?.name && typeof signal.currentUsd === 'number' && signal.currentUsd > 0) {
      priceMap.set(signal.name.toLowerCase(), signal.currentUsd);
    }
  }

  // 2. Load prices from commander decklists as fallback index
  for (const deck of commanderDecklists) {
    for (const entry of [...deck.commander, ...deck.cards] as any[]) {
      if (entry?.name && entry?.prices?.usd) {
        const p = Number(entry.prices.usd);
        if (Number.isFinite(p) && p > 0 && !priceMap.has(entry.name.toLowerCase())) {
          priceMap.set(entry.name.toLowerCase(), p);
        }
      }
    }
  }

  return priceMap;
}

/**
 * Pure valuation: totals equity per set from real prices only.
 * Cards without a price are counted as unpriced and add $0 (no invented defaults).
 */
export function computeCollectionValuation(
  collection: OwnedCard[],
  lookupPrice: CardPriceLookup,
  setNames: Map<string, string> = new Map(),
  snapshotDate = '',
): CollectionValuation {
  let totalEquityUsd = 0;
  let pricedCardCount = 0;
  let unpricedCardCount = 0;

  const setMap = new Map<string, { setName: string; cardCount: number; totalValueUsd: number; pricedCardCount: number; unpricedCardCount: number }>();

  for (const item of collection) {
    const quantity = Number.isFinite(item.quantity) ? Math.max(0, item.quantity) : 0;
    if (!item.name || quantity === 0) continue;

    const unitPrice = lookupPrice(item.name, item.setCode);
    const priced = typeof unitPrice === 'number' && Number.isFinite(unitPrice) && unitPrice > 0;

    const setCodeKey = (item.setCode || 'unknown').toUpperCase();
    const fallbackName = setCodeKey === 'UNKNOWN' ? 'Unassigned Set' : setCodeKey;
    const row = setMap.get(setCodeKey) ?? {
      setName: setNames.get(setCodeKey) ?? fallbackName,
      cardCount: 0,
      totalValueUsd: 0,
      pricedCardCount: 0,
      unpricedCardCount: 0,
    };

    row.cardCount += quantity;
    if (priced) {
      const lineTotal = (unitPrice as number) * quantity;
      totalEquityUsd += lineTotal;
      row.totalValueUsd += lineTotal;
      row.pricedCardCount += quantity;
      pricedCardCount += quantity;
    } else {
      row.unpricedCardCount += quantity;
      unpricedCardCount += quantity;
    }
    setMap.set(setCodeKey, row);
  }

  const setBreakdowns: SetEquityBreakdown[] = Array.from(setMap.entries())
    .map(([setCode, data]) => ({
      setCode,
      setName: data.setName,
      cardCount: data.cardCount,
      totalValueUsd: Number(data.totalValueUsd.toFixed(2)),
      pricedCardCount: data.pricedCardCount,
      unpricedCardCount: data.unpricedCardCount,
    }))
    .sort((a, b) => b.totalValueUsd - a.totalValueUsd || b.cardCount - a.cardCount);

  const totalCopies = pricedCardCount + unpricedCardCount;
  return {
    totalEquityUsd: Number(totalEquityUsd.toFixed(2)),
    setBreakdowns,
    pricedCardCount,
    unpricedCardCount,
    coveragePercent: totalCopies ? Math.round((pricedCardCount / totalCopies) * 100) : 0,
    snapshotDate,
  };
}

/**
 * Calculates total collection valuation and equity grouped by set using real indexed prices
 * (set-exact match first, then name match, then prices embedded in indexed Commander decklists).
 */
export function getCollectionValuationAndBreakdown(): CollectionValuation {
  const decklistPrices = getCardPriceMap();
  const lookup: CardPriceLookup = (name, setCode) =>
    resolveCardPrice(name, setCode)?.usd ?? decklistPrices.get(name.toLowerCase()) ?? null;

  const setNames = new Map<string, string>();
  for (const deck of commanderDecklists) {
    if (deck.set_code && deck.set_name) setNames.set(deck.set_code.toUpperCase(), deck.set_name);
  }

  const snapshotDate = (dailySnapshot as any)?.generatedAt || (dailySnapshot as any)?.date || 'Daily Market Snapshot';
  return computeCollectionValuation(loadOwnedCollection(), lookup, setNames, snapshotDate);
}

export function getDeckCoverageRecommendations(): DeckCoverageRecommendation[] {
  const collection = loadOwnedCollection();
  const ownedMap = new Map<string, number>();
  for (const c of collection) {
    ownedMap.set(c.name.toLowerCase(), c.quantity);
  }

  const recommendations: DeckCoverageRecommendation[] = [];

  for (const deck of commanderDecklists) {
    const allEntries = [...deck.commander, ...deck.cards];
    let totalCards = 0;
    let ownedCount = 0;

    for (const entry of allEntries) {
      const qty = entry.count || 1;
      totalCards += qty;
      const ownedQty = ownedMap.get(entry.name.toLowerCase()) || 0;
      ownedCount += Math.min(ownedQty, qty);
    }

    const percentage = totalCards > 0 ? Math.round((ownedCount / totalCards) * 100) : 0;
    const slug = deck.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    recommendations.push({
      deckSlug: slug,
      setName: deck.set_name,
      setCode: deck.set_code,
      deckName: deck.name,
      totalCards,
      ownedCards: ownedCount,
      coveragePercentage: percentage,
      approxValue: deck.approxValue,
      synopsis: deck.synopsis,
    });
  }

  return recommendations.sort((a, b) => b.coveragePercentage - a.coveragePercentage);
}
