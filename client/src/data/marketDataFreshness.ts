import dailyMarketSnapshot from '@/data/dailyMarketSnapshot.json';
import { csvMarketMovers, csvMarketMoversAsOf } from '@/data/marketMoversCsv';

type DailySnapshot = {
  generatedAt?: string;
  signalCount?: number;
  sources?: string[];
  signals?: Array<{ currentUsd?: number | null }>;
};

export function getMarketDataFreshness() {
  const daily = dailyMarketSnapshot as DailySnapshot;
  const generatedAt = daily.generatedAt || '';
  const signals = Array.isArray(daily.signals) ? daily.signals : [];

  return {
    importedCsv: {
      asOf: csvMarketMoversAsOf,
      rowCount: csvMarketMovers.length,
    },
    dailySignals: {
      asOf: generatedAt.slice(0, 10),
      generatedAt,
      trackedCount: Number(daily.signalCount) || signals.length,
      pricedPrintingCount: signals.filter((signal) => Number.isFinite(Number(signal.currentUsd)) && Number(signal.currentUsd) > 0).length,
      sources: daily.sources || [],
    },
  };
}
