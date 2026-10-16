import { describe, expect, it } from 'vitest';
import { importedMarketReports } from '@/data/marketReportArchive';
import { getChronologicalMarketPosts } from './dailyPostEngine';

describe('chronological market brief archive', () => {
  it('uses real archived report dates in newest-first order', () => {
    const posts = getChronologicalMarketPosts();
    expect(posts.map((post) => post.dateKey)).toEqual(
      [...importedMarketReports].map((report) => report.dateKey).sort((a, b) => b.localeCompare(a)),
    );
    expect(posts.length).toBeGreaterThan(0);
    expect(posts[0].reportHref).toBe(`/market-report/${posts[0].dateKey}`);
  });

  it('preserves the archived report excerpt and links named sources without inventing live data', () => {
    const oct02 = getChronologicalMarketPosts().find((post) => post.dateKey === '2026-10-02');
    expect(oct02?.excerpt).toContain('MTGStocks');
    expect(oct02?.sourceLinks).toContainEqual({ label: 'MTGStocks Interests', href: 'https://www.mtgstocks.com/interests' });
    expect(oct02?.movers.every((mover) => mover.pricingDate === '2026-10-02')).toBe(true);
    expect(oct02?.movers.some((mover) => mover.priceLabel === 'Sample price')).toBe(false);
  });

  it('labels a large reported move cautiously and carries through an unpriced watch item', () => {
    const posts = getChronologicalMarketPosts();
    const sonic = posts[0].movers.find((mover) => mover.name === 'Sonic Screwdriver');
    expect(sonic?.volatilityLabel).toBe('Extreme reported move');
    expect(sonic?.volatilityNote).toContain('single dated snapshot');
    expect(sonic?.investorBudgetGuidance).toContain('watch-only');

    const molecule = posts.find((post) => post.dateKey === '2026-09-26')?.movers.find((mover) => mover.name === 'Molecule Man');
    expect(molecule?.price).toBeNull();
    expect(molecule?.budgetBand).toBe('No numeric price in archive');
    expect(molecule?.changePercent).toBeNull();
    expect(molecule?.investorBudgetGuidance).toContain('No allocation');
  });
});
