import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { ResearchWatch, SourceMarketWatchSnapshot, type FeedCard } from './MarketResearchFeed';

vi.mock('wouter', () => ({ Link: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <a href={href} {...props}>{children}</a> }));

describe('source-dated market-watch snapshot links', () => {
  it('shows the October 15 archive without substituting the latest narrative', () => {
    const html = renderToStaticMarkup(<SourceMarketWatchSnapshot requestedDate="2026-10-15" />);
    expect(html).toContain('MTG Market Movers — 2026-10-15');
    expect(html).toContain('Review 6 source-labeled card signals');
    expect(html).toContain('latest report narrative is not substituted');
    expect(html).not.toContain('Review 5 source-labeled card signals');
  });

  it('keeps the October 16 source snapshot separate and shows only its dated signals', () => {
    const html = renderToStaticMarkup(<SourceMarketWatchSnapshot requestedDate="2026-10-16" />);
    expect(html).toContain('MTG Market Movers — 2026-10-16');
    expect(html).toContain('Review 5 source-labeled card signals');
    expect(html).toContain('Public citations');
  });

  it('keeps unverified and speculative cards inside a labeled collapsed research watch', () => {
    const cards: FeedCard[] = [
      { rank: 1, name: 'Confirmed Card', setCode: 'abc', setName: 'ABC', collectorNumber: '1', currentUsd: 2, previousUsd: 1.5, percentChange: 33, category: 'gainers', sourceCount: 2, confidence: 'Confirmed', action: 'BUY', thesis: 'Confirmed thesis', risk: 'Reprint risk', verifiedAt: '2026-11-16T00:00:00.000Z' },
      { rank: 2, name: 'Speculative Card', setCode: 'abc', setName: 'ABC', collectorNumber: '2', currentUsd: null, previousUsd: null, percentChange: 0, category: 'watch', sourceCount: 1, confidence: 'Speculative', action: 'MONITOR', thesis: 'Speculative thesis', risk: 'Thin listings', verifiedAt: '2026-11-16T00:00:00.000Z' },
      { rank: 3, name: 'Unverified Card', setCode: 'abc', setName: 'ABC', collectorNumber: null, currentUsd: null, previousUsd: null, percentChange: 0, category: 'watch', sourceCount: 0, confidence: 'Unverified', action: 'WAIT', thesis: 'Unverified thesis', risk: 'No baseline', verifiedAt: '2026-11-16T00:00:00.000Z' },
    ];
    const html = renderToStaticMarkup(<ResearchWatch cards={cards} />);
    expect(html).toContain('Research watch');
    expect(html).toContain('2 held for review');
    expect(html).toContain('Speculative Card');
    expect(html).toContain('Unverified Card');
    expect(html).not.toContain('Confirmed Card');
    expect(html).toContain('Evidence and risk');
  });
});
