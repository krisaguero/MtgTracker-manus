import dailyMarketSnapshot from '@/data/dailyMarketSnapshot.json';
import commanderPriceMeta from '@/data/commanderCardPriceMeta.json';
import { csvMarketMovers, csvMarketMoversAsOf } from '@/data/marketMoversCsv';

type DailySnapshot = {
  generatedAt?: string;
  signalCount?: number;
  sources?: string[];
  signals?: Array<{ currentUsd?: number | null; lastUpdated?: string }>;
};

type CommanderPriceMeta = {
  generatedAt?: string;
  priceDate?: string;
  source?: string;
  coverage?: {
    total?: number;
    resolved?: number;
    unresolved?: number;
    tcgplayer?: number;
    cardkingdom?: number;
    cardmarket?: number;
    usdCurrency?: string;
    cardmarketCurrency?: string;
  };
};

const OCTOBER_15_PRINTING_SAMPLE = {
  asOf: '2026-10-15',
  trackedCount: 9,
  pricedPrintingCount: 9,
  sources: ['MTGJSON set data', 'MTGJSON paper price data'],
};

export function getMarketDataFreshness() {
  const daily = dailyMarketSnapshot as DailySnapshot;
  const generatedAt = daily.generatedAt || '';
  const signals = Array.isArray(daily.signals) ? daily.signals : [];
  const observations = signals
    .map((signal) => signal.lastUpdated || '')
    .filter(Boolean)
    .sort();
  const prices = commanderPriceMeta as CommanderPriceMeta;
  const coverage = prices.coverage || {};

  return {
    importedCsv: {
      asOf: csvMarketMoversAsOf,
      rowCount: csvMarketMovers.length,
      source: 'User-provided CSV snapshot',
    },
    october15PrintingSample: OCTOBER_15_PRINTING_SAMPLE,
    dailySignals: {
      asOf: (observations[observations.length - 1] || generatedAt).slice(0, 10),
      generatedAt,
      trackedCount: Number(daily.signalCount) || signals.length,
      pricedPrintingCount: signals.filter((signal) => Number.isFinite(Number(signal.currentUsd)) && Number(signal.currentUsd) > 0).length,
      oldestObservationAt: observations[0] || '',
      newestObservationAt: observations[observations.length - 1] || '',
      sources: daily.sources || [],
    },
    commanderPriceIndex: {
      asOf: prices.priceDate || '',
      generatedAt: prices.generatedAt || '',
      source: prices.source || 'Card-price index',
      totalPrintingCount: Number(coverage.total) || 0,
      resolvedUsdQuoteCount: Number(coverage.resolved) || 0,
      unresolvedUsdQuoteCount: Number(coverage.unresolved) || 0,
      vendorQuoteCounts: {
        tcgplayer: Number(coverage.tcgplayer) || 0,
        cardkingdom: Number(coverage.cardkingdom) || 0,
        cardmarket: Number(coverage.cardmarket) || 0,
      },
      usdCurrency: coverage.usdCurrency || 'USD',
      cardmarketCurrency: coverage.cardmarketCurrency || 'EUR',
    },
  };
}
