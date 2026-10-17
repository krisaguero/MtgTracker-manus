export interface DailyMarketReportArchive {
  dateKey: string;
  generatedAt: string;
  headline: string;
  tickerSummary: string;
  stockTextWall: string;
  shorthandBreakdown: string;
  topMovers: Array<{ name: string; setCode: string; price: number; pct: number; category: string }>;
}

const STORAGE_KEY = 'mtg_latest_market_text_wall_archive_v1';

export function getTodayDateKey(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Safe placeholder for legacy callers. It deliberately contains no invented
 * market rows or percentages and must not be presented as a fresh report.
 */
export function generateLatestMarketReport(dateKey: string = getTodayDateKey()): DailyMarketReportArchive {
  return {
    dateKey,
    generatedAt: new Date().toISOString(),
    headline: `Market report paused · source verification required`,
    tickerSummary: 'No verified live price feed is connected.',
    stockTextWall: `MARKET REPORT PAUSED\nRequested date: ${dateKey}\nNo current market observations were generated. Consult source-dated reports and verify listings directly.`,
    shorthandBreakdown: 'No source-verified market report was generated.',
    topMovers: [],
  };
}

/** Reads any previous browser-local archive entries without creating or rewriting them. */
export function loadSavedReports(): DailyMarketReportArchive[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((value): value is DailyMarketReportArchive => Boolean(
      value &&
      typeof value === 'object' &&
      typeof value.dateKey === 'string' &&
      typeof value.generatedAt === 'string' &&
      typeof value.headline === 'string' &&
      typeof value.stockTextWall === 'string' &&
      Array.isArray(value.topMovers)
    ));
  } catch {
    return [];
  }
}

/** Writes only when an explicit caller asks; the paused route never calls this. */
export function saveSavedReports(reports: DailyMarketReportArchive[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
  } catch {
    // Browser-local history remains untouched if storage is unavailable.
  }
}

export interface SelloutQueueMatch {
  cardName: string;
  setCode: string;
  ownedQuantity: number;
  marketPrice: number;
  percentChange: number;
  category: string;
  reason: string;
}

/** No validated live market feed is connected, so the old sample alert is disabled. */
export function computeSelloutQueueMatches(): SelloutQueueMatch[] {
  return [];
}
