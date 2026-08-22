import { loadOwnedCollection } from './manaboxParser';
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
  totalValueUsd: number;
}

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
 * Calculates total collection valuation and equity grouped by set using real snapshot prices.
 */
export function getCollectionValuationAndBreakdown(): { totalEquityUsd: number; setBreakdowns: SetEquityBreakdown[]; pricedCardCount: number; unpricedCardCount: number; snapshotDate: string } {
  const collection = loadOwnedCollection();
  const priceMap = getCardPriceMap();

  let totalEquityUsd = 0;
  let pricedCardCount = 0;
  let unpricedCardCount = 0;

  const setMap = new Map<string, { setName: string; cardCount: number; totalValueUsd: number }>();

  for (const item of collection as any[]) {
    const nameLower = item.name.toLowerCase();
    const unitPrice = priceMap.get(nameLower) ?? (isBasicLandName(item.name) ? 0.15 : 1.50);
    const hasRealPrice = priceMap.has(nameLower);

    if (hasRealPrice) {
      pricedCardCount += item.quantity;
    } else {
      unpricedCardCount += item.quantity;
    }

    const lineTotal = unitPrice * item.quantity;
    totalEquityUsd += lineTotal;

    const setCodeKey = (item.setCode || item.set || 'unknown').toUpperCase();
    const setNameKey = item.setName || (setCodeKey === 'UNKNOWN' ? 'Unassigned Set' : setCodeKey);

    const existing = setMap.get(setCodeKey) || { setName: setNameKey, cardCount: 0, totalValueUsd: 0 };
    existing.cardCount += item.quantity;
    existing.totalValueUsd += lineTotal;
    setMap.set(setCodeKey, existing);
  }

  const setBreakdowns: SetEquityBreakdown[] = Array.from(setMap.entries()).map(([setCode, data]) => ({
    setCode,
    setName: data.setName,
    cardCount: data.cardCount,
    totalValueUsd: Number(data.totalValueUsd.toFixed(2)),
  })).sort((a, b) => b.totalValueUsd - a.totalValueUsd);

  const snapshotDate = (dailySnapshot as any)?.generatedAt || (dailySnapshot as any)?.date || 'Daily Market Snapshot';

  return {
    totalEquityUsd: Number(totalEquityUsd.toFixed(2)),
    setBreakdowns,
    pricedCardCount,
    unpricedCardCount,
    snapshotDate,
  };
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
