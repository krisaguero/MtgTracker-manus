import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (file: string) => readFileSync(resolve(process.cwd(), file), 'utf8');

describe('market route resilience contracts', () => {
  it('keeps loading and empty states explicit on the Market Report', () => {
    const source = read('client/src/pages/MarketReport.tsx');
    const intelligence = read('client/src/lib/marketIntelligence.ts');
    expect(source).toContain('<MarketCardSkeleton count={8} />');
    expect(source).toContain('<PreconGridSkeleton count={6} />');
    expect(source).toContain('No indexed prices match the selected filters.');
    expect(source).toContain('INDEX PENDING');
    expect(source).toContain('Historical Scryfall snapshot');
    expect(source).toContain('there is no verified multi-date baseline');
    expect(source).not.toContain('Live Momentum Scan');
    expect(source).not.toContain('7-Day Delta');
    expect(source).not.toContain('getReleaseArticles');
    expect(intelligence).not.toContain('40% valuation premium');
    expect(intelligence).not.toContain('automated daily monitoring pipeline');
  });

  it('keeps real price-index coverage visible on archive and purchase modules', () => {
    const archive = read('client/src/pages/CommanderPreconLibrary.tsx');
    const purchases = read('client/src/components/NextBestPurchases.tsx');
    expect(archive).toContain('% INDEXED');
    expect(purchases).toContain('INDEX PENDING');
    expect(purchases).toContain('resolveCardPrice');
  });
});
