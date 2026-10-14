import { describe, expect, it } from 'vitest';
import { getMarketDataFreshness } from './marketDataFreshness';

describe('market data freshness and coverage', () => {
  it('keeps the historical imported CSV distinct from the narrow daily price-signal sample', () => {
    expect(getMarketDataFreshness()).toEqual({
      importedCsv: {
        asOf: '2026-08-25',
        rowCount: 250,
      },
      dailySignals: {
        asOf: '2026-10-14',
        generatedAt: '2026-10-14T13:28:13.863Z',
        trackedCount: 9,
        pricedPrintingCount: 9,
        sources: ['MTGJSON set data', 'MTGJSON paper price data', 'Scryfall image endpoint'],
      },
    });
  });
});
