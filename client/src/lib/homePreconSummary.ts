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

export type HomePreconCatalogStatus = 'loading' | 'available' | 'unavailable';

export function formatHomePreconCatalogSummary(
  filteredCount: number,
  totalCount: number,
  decklistCount: number,
  status: HomePreconCatalogStatus,
) {
  const archiveScope = `${filteredCount} of ${totalCount} local archive entries · ${decklistCount} local decklists · Scryfall-only product listings excluded`;
  if (status === 'loading') return `${archiveScope} · Recent-set feed loading`;
  if (status === 'unavailable') return `${archiveScope} · Recent-set Scryfall feed unavailable`;
  return archiveScope;
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

  return `${summary.decklistCount} local decklists · ${equity} estimated indexed card-list equity · ${summary.valuedDecklistCount}/${summary.decklistCount} decklists with value data · ${summary.pricedCardCopies.toLocaleString('en-US')}/${summary.totalCardCopies.toLocaleString('en-US')} card copies priced (${coverage}%) · ${sourceLabel} snapshot ${dateLabel}. This is card-list equity, not sealed product value; only local decklists are included.`;
}
