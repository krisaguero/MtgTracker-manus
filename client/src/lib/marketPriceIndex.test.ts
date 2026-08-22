import { describe, expect, it } from 'vitest';
import { resolveCardPrice, resolveDeckMarketValue } from './marketPriceIndex';
import { commanderDecklistsData } from '@/data/commanderDecklistsData';

describe('shared market price index', () => {
  it('resolves a known daily snapshot signal with source and timestamp', () => {
    const price = resolveCardPrice('Force of Will');
    expect(price).not.toBeNull();
    expect(price?.usd).toBeGreaterThan(0);
    expect(price?.source).toBeTruthy();
    expect(price?.updatedAt).toBeTruthy();
  });

  it('does not invent a price for an unknown card', () => {
    expect(resolveCardPrice('Card That Does Not Exist Anywhere')).toBeNull();
  });

  it('reports coverage instead of presenting a synthetic deck total as fully priced', () => {
    const value = resolveDeckMarketValue(commanderDecklistsData[0]);
    expect(value.totalUsd).toBeGreaterThanOrEqual(0);
    expect(value.pricedCards + value.unpricedCards).toBeGreaterThan(0);
    expect(value.coveragePercent).toBeGreaterThanOrEqual(0);
    expect(value.coveragePercent).toBeLessThanOrEqual(100);
    expect(value.source).toBeTruthy();
  });
});
