import { resolveCardPrice } from '@/lib/marketPriceIndex';
import type { ResolvedCardPrice } from '@/lib/marketPriceIndex';

export interface SetPrintingPriceInput {
  name: string;
  set: string;
  prices?: { usd?: string | null };
}

export interface SetPrintingPrice {
  usd: number | null;
  sourceLabel:
    'Set + name index' | 'Scryfall printing USD' | 'Price unavailable';
  updatedAt: string | null;
  source: string | null;
}

export interface SetPricingSummary {
  setNameIndexCount: number;
  scryfallFallbackCount: number;
  unavailableCount: number;
}

type PriceResolver = (
  name: string,
  setCode?: string
) => ResolvedCardPrice | null;

/** Prefer a same-set, same-name index price; never substitute another set's name-only quote. */
export function resolveSetPrintingPrice(
  card: SetPrintingPriceInput,
  priceResolver: PriceResolver = resolveCardPrice
): SetPrintingPrice {
  const indexed = priceResolver(card.name, card.set);
  if (
    indexed?.match === 'exact-set' &&
    Number.isFinite(indexed.usd) &&
    indexed.usd > 0
  ) {
    return {
      usd: indexed.usd,
      sourceLabel: 'Set + name index',
      updatedAt: indexed.updatedAt || null,
      source: indexed.source,
    };
  }

  const scryfallUsd = Number(card.prices?.usd);
  if (Number.isFinite(scryfallUsd) && scryfallUsd > 0) {
    return {
      usd: scryfallUsd,
      sourceLabel: 'Scryfall printing USD',
      updatedAt: null,
      source: 'Scryfall printing data',
    };
  }

  return {
    usd: null,
    sourceLabel: 'Price unavailable',
    updatedAt: null,
    source: null,
  };
}

export function summarizeSetPricing(
  cards: SetPrintingPriceInput[],
  priceResolver: PriceResolver = resolveCardPrice
): SetPricingSummary {
  const summary: SetPricingSummary = {
    setNameIndexCount: 0,
    scryfallFallbackCount: 0,
    unavailableCount: 0,
  };

  for (const card of cards) {
    const price = resolveSetPrintingPrice(card, priceResolver);
    if (price.sourceLabel === 'Set + name index')
      summary.setNameIndexCount += 1;
    else if (price.sourceLabel === 'Scryfall printing USD')
      summary.scryfallFallbackCount += 1;
    else summary.unavailableCount += 1;
  }

  return summary;
}
