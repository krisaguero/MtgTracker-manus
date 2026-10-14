import { describe, expect, it } from 'vitest';
import { commanderDecklistsData } from '@/data/commanderDecklistsData';
import {
  commanderPriceSnapshotAsOf,
  commanderPriceSnapshotSource,
  resolveDeckMarketValue,
} from '@/lib/marketPriceIndex';
import { buildHomePreconSummary, formatHomePreconCatalogSummary, formatHomePreconSummary } from './homePreconSummary';

describe('homepage precon equity summary', () => {
  it('reports the archive scope and its actual card-price coverage instead of zero placeholder values', () => {
    const summary = buildHomePreconSummary(commanderDecklistsData, resolveDeckMarketValue);

    expect(summary).toEqual({
      decklistCount: 173,
      valuedDecklistCount: 173,
      equityUsd: 20095.42,
      pricedCardCopies: 17204,
      totalCardCopies: 17300,
      coveragePercent: 99.4,
    });
    expect(formatHomePreconSummary(summary, commanderPriceSnapshotAsOf, commanderPriceSnapshotSource)).toBe(
      '173 local decklists · $20,095.42 estimated indexed card-list equity · 173/173 decklists with value data · 17,204/17,300 card copies priced (99.4%) · MTGJSON AllPricesToday snapshot as of 2026-08-21. This is card-list equity, not sealed product value; catalog-only products are excluded.',
    );
  });
});

describe('homepage precon catalog-count summary', () => {
  it('marks live Scryfall counts as provisional until discovery finishes', () => {
    expect(formatHomePreconCatalogSummary(201, 201, 173, 'loading')).toBe(
      '201 of 201 products found so far · 173 local decklists · 28 Scryfall-only found so far · Scryfall discovery in progress',
    );
    expect(formatHomePreconCatalogSummary(201, 201, 173, 'complete')).toBe(
      '201 of 201 catalog products found · 173 local decklists · 28 Scryfall-only found · Scryfall discovery finished',
    );
  });

  it('marks the local archive as the remaining scope when Scryfall is unavailable', () => {
    expect(formatHomePreconCatalogSummary(173, 173, 173, 'unavailable')).toBe(
      '173 of 173 products in local archive · 173 local decklists · Scryfall catalog unavailable',
    );
  });
});
