import rawArchive from './marketReportArchive.json';

export interface ImportedMarketMover {
  id: string;
  category: string;
  name: string;
  setCode: string;
  setName: string;
  printing: string;
  price: number | null;
  priceLabel: string;
  changePercent: number;
  moveLabel: string;
  streak: number | null;
  thesis: string;
  pricingDate: string;
}

export interface ImportedMarketReport {
  dateKey: string;
  slug: string;
  publishedLabel: string;
  title: string;
  status: string;
  dataWindow: string;
  body: string[];
  movers: ImportedMarketMover[];
}

export interface ImportedMarketArchive {
  source: string;
  generatedAt: string;
  latestDashboardMovers: ImportedMarketMover[];
  reports: ImportedMarketReport[];
}

export const marketReportArchive = rawArchive as ImportedMarketArchive;
export const importedMarketReports = [...marketReportArchive.reports].sort((a, b) => b.dateKey.localeCompare(a.dateKey));
export const importedDashboardMovers = marketReportArchive.latestDashboardMovers;

export function importedReportHref(dateKey: string) {
  return `/market-report/${dateKey}`;
}

export function importedCardHref(name: string) {
  return `/card/${encodeURIComponent(name)}`;
}

export function importedSetHref(setCode: string) {
  return setCode && setCode !== '—' ? `/${encodeURIComponent(setCode.toLowerCase())}` : undefined;
}

export function findImportedMover(name: string, setCode?: string) {
  const normalizedName = name.trim().toLowerCase();
  const normalizedSet = setCode?.trim().toLowerCase();
  return importedDashboardMovers.find((mover) => mover.name.toLowerCase() === normalizedName && (!normalizedSet || mover.setCode.toLowerCase() === normalizedSet));
}

export function formatPricingDate(dateKey: string) {
  return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(`${dateKey}T00:00:00Z`));
}
