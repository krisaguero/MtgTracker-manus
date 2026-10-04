import { describe, expect, it } from 'vitest';
import { importedDashboardMovers, importedMarketReports, importedReportHref } from './marketReportArchive';

describe('uploaded dated market report archive', () => {
  it('preserves all five dated reports in descending date order', () => {
    expect(importedMarketReports.map((report) => report.dateKey)).toEqual([
      '2026-10-02',
      '2026-09-26',
      '2026-09-22',
      '2026-09-19',
      '2026-09-18',
    ]);
  });

  it('imports the complete dashboard mover tape with pricing dates', () => {
    expect(importedDashboardMovers).toHaveLength(65);
    expect(importedDashboardMovers.every((mover) => /^2026-10-02$/.test(mover.pricingDate))).toBe(true);
    expect(importedMarketReports.every((report) => report.movers.length > 0)).toBe(true);
  });

  it('builds stable date report URLs', () => {
    expect(importedReportHref('2026-09-26')).toBe('/market-report/2026-09-26');
  });
});
