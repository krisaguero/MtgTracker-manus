import { describe, expect, it } from 'vitest';
import { buildWeeklyMarketDigest } from './weeklyDigest';

describe('historical market price export', () => {
  it('labels the Scryfall reference vintage and omits unsupported movement claims', () => {
    const digest = buildWeeklyMarketDigest();
    expect(digest.subject).toContain('2026-08-15');
    expect(digest.text).toContain('Historical Scryfall reference prices as of 2026-08-15');
    expect(digest.text).toContain('contains 1 observation');
    expect(digest.text).toContain('snapshot USD');
    expect(digest.text).not.toContain('Top indexed price movers');
    expect(digest.text).not.toMatch(/[+-]\d+(\.\d+)?%/);
    expect(digest.html).toContain('2026-08-15');
    expect(digest.html).not.toContain('Top indexed price movers');
  });
});
