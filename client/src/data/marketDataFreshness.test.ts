import { describe, expect, it } from 'vitest';
import { getMarketDataFreshness } from './marketDataFreshness';

describe('market data freshness and coverage', () => {
  it('keeps the historical imported CSV distinct from the narrow daily price-signal sample', () => {
    const freshness = getMarketDataFreshness();

    expect(freshness.importedCsv).toEqual({
      asOf: '2026-08-25',
      rowCount: 250,
    });
    expect(freshness.dailySignals.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(freshness.dailySignals.asOf).toBe(freshness.dailySignals.generatedAt.slice(0, 10));
    expect(freshness.dailySignals.asOf).not.toBe(freshness.importedCsv.asOf);
    expect(freshness.dailySignals.trackedCount).toBeGreaterThan(0);
    expect(freshness.dailySignals.pricedPrintingCount).toBeGreaterThan(0);
    expect(freshness.dailySignals.pricedPrintingCount).toBeLessThanOrEqual(freshness.dailySignals.trackedCount);
    expect(freshness.dailySignals.sources).toContain('TCGplayer weekly price-spike report');
  });
});
