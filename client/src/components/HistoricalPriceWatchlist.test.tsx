import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { HistoricalPriceWatchlist } from './HistoricalPriceWatchlist';
import { october5WatchSignals, october11WatchSignals } from '@/data/historicalMarketWatchSignals';

const requiredFields = [
  'reportDate',
  'printing',
  'measurementWindow',
  'reportedPrice',
  'reportedMove',
  'catalyst',
  'risk',
  'sourceConfidence',
  'verificationStatus',
  'sources',
] as const;

describe('historical multi-day price watchlists', () => {
  it('shows a date-specific Top 10 for October 5 and a shorter evidence-supported list for October 11', () => {
    expect(october5WatchSignals).toHaveLength(10);
    expect(october11WatchSignals).toHaveLength(8);
    expect(october5WatchSignals.every((signal) => signal.reportDate === 'October 5, 2026')).toBe(true);
    expect(october11WatchSignals.every((signal) => signal.reportDate === 'October 11, 2026')).toBe(true);
    for (const signal of [...october5WatchSignals, ...october11WatchSignals]) {
      for (const field of requiredFields) expect(signal[field]).toBeTruthy();
      expect(signal.sources.length).toBeGreaterThan(0);
      expect(signal.sources.every((source) => /^https:\/\//.test(source.url))).toBe(true);
    }
  });

  it('shows windows, source confidence, verification status, risks, catalysts, and source links', () => {
    const html = renderToStaticMarkup(
      <HistoricalPriceWatchlist
        title="Top 10 cards to watch"
        intro="Historical signals only."
        signals={october5WatchSignals}
      />,
    );
    expect(html).toContain('High-profile watcher · historical');
    expect(html).toContain('Report date: October 5, 2026');
    expect(html).toContain('Measurement window');
    expect(html).toContain('Source-reported confidence');
    expect(html).toContain('Verification status');
    expect(html).toContain('Catalyst');
    expect(html).toContain('Risk');
    expect(html).toContain('href="https://www.mtgstocks.com/news/24722-weekly-winners-2026---35"');
    expect(html).toContain('not independent verification');
  });

  it('does not pad the October 11 price list with catalyst-only or metagame-only signals', () => {
    const names = october11WatchSignals.map((signal) => signal.card);
    expect(names).toContain('Jet Medallion');
    expect(names).toContain('Impossible Man');
    expect(names).not.toContain('Kaito, Bane of Nightmares');
    expect(names).not.toContain('Basking Broodscale combo pieces');
  });
});
