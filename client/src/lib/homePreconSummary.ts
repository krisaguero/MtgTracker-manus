import type { RawCommanderDeck } from '@/data/commanderDecklistsData';
import type { DeckMarketValue } from '@/lib/marketPriceIndex';

export interface HomePreconSummary {
  decklistCount: number;
  valuedDecklistCount: number;
  equityUsd: number;
  pricedCardCopies: number;
  totalCardCopies: number;
  coveragePercent: number;
}

export type HomePreconCatalogStatus = 'loading' | 'complete' | 'unavailable';

export function formatHomePreconCatalogSummary(
  filteredCount: number,
  totalCount: number,
  decklistCount: number,
  status: HomePreconCatalogStatus,
) {
  if (status === 'unavailable') {
    return `${filteredCount} of ${totalCount} products in local archive · ${decklistCount} local decklists · Scryfall catalog unavailable`;
  }

  const scryfallOnlyCount = Math.max(0, totalCount - decklistCount);
  if (status === 'loading') {
    return `${filteredCount} of ${totalCount} products found so far · ${decklistCount} local decklists · ${scryfallOnlyCount} Scryfall-only found so far · Scryfall discovery in progress`;
  }

  return `${filteredCount} of ${totalCount} catalog products found · ${decklistCount} local decklists · ${scryfallOnlyCount} Scryfall-only found · Scryfall discovery finished`;
}

export function buildHomePreconSummary(
  decklists: RawCommanderDeck[],
  resolveValue: (deck: RawCommanderDeck) => DeckMarketValue,
): HomePreconSummary {
  const values = decklists.map(resolveValue);
  const equityUsd = values.reduce((sum, value) => sum + value.totalUsd, 0);
  const pricedCardCopies = values.reduce((sum, value) => sum + value.pricedCards, 0);
  const totalCardCopies = values.reduce((sum, value) => sum + value.pricedCards + value.unpricedCards, 0);
  const coveragePercent = totalCardCopies > 0
    ? Math.round((pricedCardCopies / totalCardCopies) * 1000) / 10
    : 0;

  return {
    decklistCount: decklists.length,
    valuedDecklistCount: values.filter((value) => value.totalUsd > 0).length,
    equityUsd: Number(equityUsd.toFixed(2)),
    pricedCardCopies,
    totalCardCopies,
    coveragePercent,
  };
}

export function formatHomePreconSummary(
  summary: HomePreconSummary,
  priceDate: string,
  priceSource: string,
) {
  const equity = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(summary.equityUsd);
  const coverage = summary.coveragePercent.toFixed(1);
  const dateLabel = priceDate ? `as of ${priceDate}` : 'date unavailable';
  const sourceLabel = priceSource || 'Card-price index';

  return `${summary.decklistCount} local decklists · ${equity} estimated indexed card-list equity · ${summary.valuedDecklistCount}/${summary.decklistCount} decklists with value data · ${summary.pricedCardCopies.toLocaleString('en-US')}/${summary.totalCardCopies.toLocaleString('en-US')} card copies priced (${coverage}%) · ${sourceLabel} snapshot ${dateLabel}. This is card-list equity, not sealed product value; catalog-only products are excluded.`;
}
