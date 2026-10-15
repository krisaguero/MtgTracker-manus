import { describe, expect, it } from 'vitest';
import { resolveCardPrice, resolveDeckMarketValue } from './marketPriceIndex';
import { commanderDecklistsData } from '@/data/commanderDecklistsData';
import commanderCardPriceSnapshot from '@/data/commanderCardPriceSnapshot.json';

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

  it('does not revive an older fallback quote when the latest snapshot has no USD price for that printing', () => {
    const unpriced = commanderCardPriceSnapshot.records.find(
      record => record.name && record.set_code && typeof record.usd !== 'number'
    );
    expect(unpriced).toBeDefined();
    expect(resolveCardPrice(unpriced!.name, unpriced!.set_code)).toBeNull();
  });

  it('keeps Cardmarket quotes labeled in EUR and out of USD equity', () => {
    const record = commanderCardPriceSnapshot.records.find(
      item =>
        item.name &&
        item.set_code &&
        typeof item.usd === 'number' &&
        item.prices?.cardmarketCurrency === 'EUR' &&
        typeof item.prices?.cardmarket === 'number'
    );
    expect(record).toBeDefined();
    const price = resolveCardPrice(record!.name, record!.set_code);
    expect(price?.usd).toBe(
      record!.prices.tcgplayer ?? record!.prices.cardkingdom
    );
    expect(price?.cardmarketPrice).toBe(record!.prices.cardmarket);
    expect(price?.cardmarketCurrency).toBe('EUR');
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
