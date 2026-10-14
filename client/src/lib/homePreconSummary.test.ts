import { describe, expect, it } from 'vitest';
import { commanderDecklistsData } from '@/data/commanderDecklistsData';
import {
  commanderPriceSnapshotAsOf,
  commanderPriceSnapshotSource,
  resolveDeckMarketValue,
} from '@/lib/marketPriceIndex';
import { buildHomePreconSummary, formatHomePreconCatalogSummary, formatHomePreconSummary } from './homePreconSummary';

describe('homepage precon equity summary', () => {
  it('reports one local-archive scope and its actual card-price coverage instead of zero placeholder values', () => {
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
      '173 local decklists · $20,095.42 estimated indexed card-list equity · 173/173 decklists with value data · 17,204/17,300 card copies priced (99.4%) · MTGJSON AllPricesToday snapshot as of 2026-08-21. This is card-list equity, not sealed product value; only local decklists are included.',
    );
  });
});

describe('homepage precon catalog-count summary', () => {
  it('uses the stable local archive as the only source for counts and values', () => {
    expect(formatHomePreconCatalogSummary(173, 173, 173, 'available')).toBe(
      '173 of 173 local archive entries · 173 local decklists · Scryfall-only product listings excluded',
    );
  });

  it('keeps the local count stable while the independent recent-set feed is loading or unavailable', () => {
    expect(formatHomePreconCatalogSummary(173, 173, 173, 'loading')).toBe(
      '173 of 173 local archive entries · 173 local decklists · Scryfall-only product listings excluded · Recent-set feed loading',
    );
    expect(formatHomePreconCatalogSummary(173, 173, 173, 'unavailable')).toBe(
      '173 of 173 local archive entries · 173 local decklists · Scryfall-only product listings excluded · Recent-set Scryfall feed unavailable',
    );
  });
});
