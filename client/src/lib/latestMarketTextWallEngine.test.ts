import { describe, expect, it } from 'vitest';
import { computeSelloutQueueMatches, generateLatestMarketReport } from './latestMarketTextWallEngine';

describe('legacy morning report safety', () => {
  it('returns a paused, source-neutral placeholder instead of inventing a dated scan', () => {
    const report = generateLatestMarketReport('2026-10-16');
    expect(report.dateKey).toBe('2026-10-16');
    expect(report.headline).toContain('paused');
    expect(report.stockTextWall).toContain('No current market observations were generated');
    expect(report.topMovers).toEqual([]);
    expect(report.stockTextWall).not.toMatch(/[+]\d+(\.\d+)?%/);
  });

  it('does not produce personal sellout alerts without a verified live feed', () => {
    expect(computeSelloutQueueMatches()).toEqual([]);
  });
});
