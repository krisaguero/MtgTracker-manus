import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (file: string) => readFileSync(resolve(process.cwd(), file), 'utf8');

describe('market route resilience contracts', () => {
  it('keeps loading and empty states explicit on the Market Report', () => {
    const source = read('client/src/pages/MarketReport.tsx');
    expect(source).toContain('<MarketCardSkeleton count={8} />');
    expect(source).toContain('<PreconGridSkeleton count={6} />');
    expect(source).toContain('No movers match the selected filters.');
    expect(source).toContain('INDEX PENDING');
  });

  it('keeps real price-index coverage visible on archive and purchase modules', () => {
    const archive = read('client/src/pages/CommanderPreconLibrary.tsx');
    const purchases = read('client/src/components/NextBestPurchases.tsx');
    expect(archive).toContain('% INDEXED');
    expect(purchases).toContain('INDEX PENDING');
    expect(purchases).toContain('resolveCardPrice');
  });
});
