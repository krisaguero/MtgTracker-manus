import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { SourceMarketWatchSnapshot } from './MarketResearchFeed';

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
});
