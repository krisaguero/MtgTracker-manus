import { describe, expect, it } from 'vitest';
import { createSnapshot, dateKey, priceForCard, updateHistorySnapshots } from '../scripts/daily-market-movers.mjs';

describe('daily market movers collector', () => {
  it('selects paper retail prices from MTGJSON date-keyed source records', () => {
    const result = priceForCard({
      paper: {
        tcgplayer: { retail: { normal: { '2026-08-19': 8.25 } } },
        cardkingdom: { retail: { normal: { '2026-08-19': 9.5 } } },
      },
    });

    expect(result).toEqual({ marketUsd: 8.25, tcgplayerMarketUsd: 8.25, cardKingdomUsd: 9.5 });
  });

  it('establishes a flat baseline before it reports a daily price change', () => {
    const snapshot = createSnapshot({
      generatedAt: '2026-08-20T08:00:00.000Z',
      previousPrices: {},
      cards: [
        {
          key: 'example-uuid',
          reference: { setCode: 'm15', origin: 'Commander decklist' },
          card: { uuid: 'example-uuid', name: 'Example Card', number: '1', rarity: 'rare', setName: 'Magic 2015' },
          price: { marketUsd: 5, tcgplayerMarketUsd: 5, cardKingdomUsd: 5 },
        },
      ],
    });

    expect(snapshot.signalCount).toBe(1);
    expect(snapshot.signals[0]).toMatchObject({ currentUsd: 5, previousUsd: 5, percentChange: 0, trend: 'flat', category: 'commander-picks' });
    expect(dateKey(snapshot.generatedAt)).toBe('2026-08-20');
  });

  it('calculates a changed signal using only the prior local observation', () => {
    const snapshot = createSnapshot({
      generatedAt: '2026-08-21T08:00:00.000Z',
      previousPrices: { 'example-uuid': 4 },
      cards: [
        {
          key: 'example-uuid',
          reference: { setCode: 'm15', origin: 'Market signal matrix', category: 'high-spikes' },
          card: { uuid: 'example-uuid', name: 'Example Card', number: '1', rarity: 'rare', setName: 'Magic 2015' },
          price: { marketUsd: 5, tcgplayerMarketUsd: 5, cardKingdomUsd: null },
        },
      ],
    });

    expect(snapshot.signals[0]).toMatchObject({ previousUsd: 4, currentUsd: 5, percentChange: 25, trend: 'up', category: 'high-spikes', sourceCount: 1, isCatalyst: true });
  });

  it('replaces a same-day baseline while preserving the prior day for movement calculations', () => {
    const result = updateHistorySnapshots(
      [
        { date: '2026-08-19', generatedAt: '2026-08-19T08:00:00.000Z', prices: { card: 4 } },
        { date: '2026-08-20', generatedAt: '2026-08-20T08:00:00.000Z', prices: { card: 5 } },
      ],
      { generatedAt: '2026-08-20T12:00:00.000Z', prices: { card: 5.5 } },
    );

    expect(result.previousPrices).toEqual({ card: 4 });
    expect(result.snapshots).toEqual([
      { date: '2026-08-19', generatedAt: '2026-08-19T08:00:00.000Z', prices: { card: 4 } },
      { date: '2026-08-20', generatedAt: '2026-08-20T12:00:00.000Z', prices: { card: 5.5 } },
    ]);
  });
});
