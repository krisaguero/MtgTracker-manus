import { describe, expect, it } from 'vitest';
import { EMPTY_COLLECTION_PLANNER, countSetPrintings, isCollectionPlannerData, setTradePileQuantity, wishlistOwnership, type CollectionWishlistEntry } from './collectionPlanner';

describe('local collection planner', () => {
  it('counts unique printings for a set goal, not total copies', () => {
    const cards = [
      { name: 'Sol Ring', quantity: 3, setCode: 'cmr', collectorNumber: '351' },
      { name: 'Arcane Signet', quantity: 1, setCode: 'CMR', collectorNumber: '296' },
      { name: 'Island', quantity: 1, setCode: 'znr', collectorNumber: '271' },
    ];
    expect(countSetPrintings(cards, 'cmr')).toBe(2);
  });

  it('requires exact printing fields when supplied by a variant wishlist item', () => {
    const item: CollectionWishlistEntry = { id: 'wish-1', name: 'Sol Ring', setCode: 'cmr', collectorNumber: '351', finish: 'foil', createdAt: 1 };
    const cards = [{ name: 'Sol Ring', quantity: 1, setCode: 'cmr', collectorNumber: '351', finish: 'normal' }];
    expect(wishlistOwnership(item, cards).owned).toBe(false);
    expect(wishlistOwnership({ ...item, finish: 'normal' }, cards).owned).toBe(true);
  });

  it('limits trade pile assignments to actual owned copies and reserves the first copy', () => {
    const card = { name: 'Sol Ring', quantity: 2, setCode: 'cmr', collectorNumber: '351' };
    const next = setTradePileQuantity(EMPTY_COLLECTION_PLANNER, card, 9);
    expect(next.tradePile[0]?.quantity).toBe(1);
    expect(isCollectionPlannerData(next)).toBe(true);
  });
});
