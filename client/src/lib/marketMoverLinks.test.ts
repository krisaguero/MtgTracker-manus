import { describe, expect, it } from 'vitest';
import { commanderDecklistsData } from '@/data/commanderDecklistsData';
import { allLinkedMarketMovers, moversForCard, moversForSet, marketMoverArticleHref, suppliedSignalsForCard, suppliedSignalsForSet } from '@/lib/marketMoverLinks';
import { getPreconMarketContext } from '@/lib/preconMarketContext';
import { resolveDeckMarketValue } from '@/lib/marketPriceIndex';

describe('market mover linkage and Commander price lineage', () => {
  it('gives canonical movers card, set, and article destinations', () => {
    const [mover] = allLinkedMarketMovers();
    expect(mover).toBeDefined();
    expect(mover.articleHref).toBe(marketMoverArticleHref(mover.name));
    expect(mover.cardHref).toBe(`/card/${encodeURIComponent(mover.name)}`);
    expect(mover.setHref).toBe(`/${mover.setCode}`);
    expect(moversForCard(mover.name, mover.setCode)[0]?.name).toBe(mover.name);
    expect(moversForSet(mover.setCode).some((candidate) => candidate.name === mover.name)).toBe(true);
  });

  it('uses real mover rows for precon context instead of name hashes', () => {
    const [mover] = allLinkedMarketMovers();
    const context = getPreconMarketContext([{ name: mover.name, set_code: mover.setCode }]);
    expect(context.totalHighlightedCards).toBeGreaterThan(0);
    expect(context.highlights[0].articleHref).toBe(mover.articleHref);
    expect(context.highlights[0].currentUsd).toBeGreaterThan(0);
  });

  it('keeps supplied market-watch matrix rows linked to the matching set and card pages', () => {
    const [signal] = suppliedSignalsForSet('EOC');
    expect(signal).toBeDefined();
    expect(signal.cardName).toBe('World Shaper');
    expect(signal.setHref).toBe('/eoc');
    expect(signal.articleHref).toBe('/market-watch-article');
    expect(suppliedSignalsForCard('World Shaper')[0]?.setCode).toBe('eoc');
  });

  it('prices a complete official Commander product from the current index when records are available', () => {
    const deck = commanderDecklistsData.find((candidate) => candidate.cards.length > 0);
    expect(deck).toBeDefined();
    const value = resolveDeckMarketValue(deck!);
    expect(value.pricedCards).toBeGreaterThan(0);
    expect(value.totalUsd).toBeGreaterThan(0);
    expect(value.coveragePercent).toBeGreaterThan(0);
    expect(value.updatedAt).toMatch(/2026|Price index/);
  });
});
