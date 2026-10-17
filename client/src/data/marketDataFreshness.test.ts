import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { getMarketDataFreshness } from './marketDataFreshness';

const october15Snapshot = JSON.parse(
  readFileSync(resolve(process.cwd(), 'data/market/daily/2026-10-15.json'), 'utf8'),
) as { generatedAt: string; signalCount: number; sources: string[]; signals: Array<{ currentUsd?: number | null }> };

describe('market data freshness and coverage', () => {
  it('keeps the historical 250-row CSV distinct from the October 15 nine-printing sample', () => {
    const freshness = getMarketDataFreshness();

    expect(freshness.importedCsv).toMatchObject({
      asOf: '2026-08-25',
      rowCount: 250,
      source: 'User-provided CSV snapshot',
    });
    expect(freshness.october15PrintingSample).toMatchObject({
      asOf: october15Snapshot.generatedAt.slice(0, 10),
      trackedCount: october15Snapshot.signalCount,
      pricedPrintingCount: october15Snapshot.signals.filter((signal) => Number(signal.currentUsd) > 0).length,
      sources: october15Snapshot.sources.slice(0, 2),
    });
    expect(freshness.october15PrintingSample.trackedCount).toBe(9);
    expect(freshness.october15PrintingSample.pricedPrintingCount).toBe(9);
    expect(freshness.october15PrintingSample.asOf).not.toBe(freshness.importedCsv.asOf);
  });

  it('reports the daily signal window separately from the imported mover table', () => {
    const freshness = getMarketDataFreshness();

    expect(freshness.dailySignals.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(freshness.dailySignals.asOf).toBe(freshness.dailySignals.newestObservationAt.slice(0, 10));
    expect(freshness.dailySignals.asOf).not.toBe(freshness.importedCsv.asOf);
    expect(freshness.dailySignals.trackedCount).toBeGreaterThan(0);
    expect(freshness.dailySignals.pricedPrintingCount).toBeGreaterThan(0);
    expect(freshness.dailySignals.pricedPrintingCount).toBeLessThanOrEqual(freshness.dailySignals.trackedCount);
    expect(freshness.dailySignals.newestObservationAt).toBeTruthy();
    expect(freshness.dailySignals.sources).toContain('TCGplayer weekly price-spike report');
  });

  it('exposes current MTGJSON price-index date and USD coverage without loading the large index file', () => {
    const freshness = getMarketDataFreshness();

    expect(freshness.commanderPriceIndex).toMatchObject({
      asOf: '2026-10-16',
      source: 'MTGJSON AllPricesToday',
      totalPrintingCount: 13323,
      resolvedUsdQuoteCount: 13061,
      unresolvedUsdQuoteCount: 262,
      usdCurrency: 'USD',
      cardmarketCurrency: 'EUR',
    });
  });
});
