import {
  importedMarketReports,
  importedReportHref,
  marketReportArchive,
  type ImportedMarketMover,
  type ImportedMarketReport,
} from '@/data/marketReportArchive';

export interface DailyBriefMover {
  name: string;
  setCode: string;
  setName: string;
  category: string;
  price: number | null;
  priceLabel: string;
  changePercent: number | null;
  changeLabel: string;
  streak: number | null;
  thesis: string;
  pricingDate: string;
  volatilityLabel: string;
  volatilityNote: string;
  budgetBand: string;
  collectorBudgetGuidance: string;
  investorBudgetGuidance: string;
  scryfallHref: string;
}

export interface DailyBriefPost {
  dateKey: string;
  publishedLabel: string;
  title: string;
  status: string;
  dataWindow: string;
  excerpt: string;
  reportHref: string;
  archiveSource: string;
  sourceLinks: Array<{ label: string; href: string }>;
  movers: DailyBriefMover[];
}

function reportExcerpt(report: ImportedMarketReport): string {
  const content = report.body
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => !/^(executive summary|what changed since yesterday|what to watch|sources?)$/i.test(line));

  return content.find((line) => line.length >= 55 && !/^(data window|market status):/i.test(line))
    || content.find((line) => !/^(data window|market status):/i.test(line))
    || content[0]
    || report.status;
}

function volatilityFor(mover: ImportedMarketMover) {
  if (mover.price === null || !Number.isFinite(mover.price)) {
    return {
      label: 'Unpriced watch',
      note: 'This archived report has no numeric price for the entry. Treat it as a watch item, not a price signal.',
    };
  }

  const move = Math.abs(mover.changePercent);
  const label = move >= 100
    ? 'Extreme reported move'
    : move >= 50
      ? 'High reported move'
      : move >= 25
        ? 'Elevated reported move'
        : move >= 10
          ? 'Moderate reported move'
          : 'Small reported move';
  const liquidityNote = /low.?liquidity|thin inventory|thinly traded/i.test(mover.thesis)
    ? ' The archived thesis also flags low liquidity or thin inventory.'
    : '';

  return {
    label,
    note: `Based on the report’s percentage change only; a single dated snapshot is not an intraday volatility or sales-volume measure.${liquidityNote}`,
  };
}

function budgetGuidance(mover: ImportedMarketMover, volatilityLabel: string) {
  if (mover.price === null || !Number.isFinite(mover.price)) {
    return {
      band: 'No numeric price in archive',
      collector: 'Set no purchase budget from this post. First verify a current quote for the exact printing and condition.',
      investor: 'No allocation can be grounded in this snapshot. Wait for a dated quote and recent completed sales.',
    };
  }

  const band = mover.price < 5
    ? 'Under $5 reference tier'
    : mover.price < 25
      ? '$5–$24 reference tier'
      : mover.price < 100
        ? '$25–$99 reference tier'
        : '$100+ reference tier';
  const collector = mover.price < 5
    ? 'Low ticket on the archived quote; account for shipping and condition, and buy only if it fills a planned play or collection need.'
    : mover.price < 25
      ? 'Compare exact printing, finish, and condition; set a cap before shopping and avoid paying a premium for a trend alone.'
      : mover.price < 100
        ? 'Treat this as a deliberate discretionary purchase: compare multiple current listings and choose a maximum spend in advance.'
        : 'High-ticket reference: verify the exact edition, condition, and seller protections; do not let a headline move set your budget.';
  const investor = /Extreme|High|Elevated/.test(volatilityLabel)
    ? 'High reported movement: watch-only until recent sold listings, market depth, and reprint exposure are checked. Do not size a position from this percentage alone.'
    : 'This is not an entry-price signal. Verify multiple recent sold listings, market depth, and reprint exposure before considering any risk capital.';

  return { band, collector, investor };
}

function mapMover(mover: ImportedMarketMover): DailyBriefMover {
  const volatility = volatilityFor(mover);
  const budget = budgetGuidance(mover, volatility.label);
  const price = Number.isFinite(mover.price) ? mover.price : null;
  const hasChange = Number.isFinite(mover.changePercent) && mover.changePercent !== 0;
  const setCode = mover.setCode || '';
  const scryfallQuery = `!"${mover.name}"${setCode ? ` set:${setCode}` : ''}`;

  return {
    name: mover.name,
    setCode,
    setName: mover.setName,
    category: mover.category,
    price,
    priceLabel: price === null ? (mover.priceLabel || 'No price recorded') : mover.priceLabel || `$${price.toFixed(2)}`,
    changePercent: hasChange ? mover.changePercent : null,
    changeLabel: hasChange ? `${mover.changePercent > 0 ? '+' : ''}${mover.changePercent}% reported change` : 'No numeric change reported',
    streak: mover.streak,
    thesis: mover.thesis,
    pricingDate: mover.pricingDate,
    volatilityLabel: volatility.label,
    volatilityNote: volatility.note,
    budgetBand: budget.band,
    collectorBudgetGuidance: budget.collector,
    investorBudgetGuidance: budget.investor,
    scryfallHref: `https://scryfall.com/search?q=${encodeURIComponent(scryfallQuery)}`,
  };
}

function sourcesFor(report: ImportedMarketReport) {
  const body = report.body.join(' ').toLowerCase();
  const links = [{ label: 'Open full archived report', href: importedReportHref(report.dateKey) }];
  if (body.includes('mtgstocks')) {
    links.push({ label: 'MTGStocks Interests', href: 'https://www.mtgstocks.com/interests' });
  }
  return links;
}

export function getChronologicalMarketPosts(): DailyBriefPost[] {
  return [...importedMarketReports]
    .sort((a, b) => b.dateKey.localeCompare(a.dateKey))
    .map((report) => ({
      dateKey: report.dateKey,
      publishedLabel: report.publishedLabel,
      title: report.title === 'Daily MTG Market Movers Report'
        ? `Market movers · ${report.publishedLabel}`
        : report.title,
      status: report.status,
      dataWindow: report.dataWindow,
      excerpt: reportExcerpt(report),
      reportHref: importedReportHref(report.dateKey),
      archiveSource: marketReportArchive.source,
      sourceLinks: sourcesFor(report),
      movers: report.movers.map(mapMover),
    }));
}
