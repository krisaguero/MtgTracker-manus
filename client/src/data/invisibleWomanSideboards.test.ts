import { describe, expect, it } from 'vitest';
import { invisibleWomanSideboardPackages } from './invisibleWomanSideboards';

describe('Invisible Woman personality packages', () => {
  it('publishes four named pre-game packages with eight cards each', () => {
    expect(invisibleWomanSideboardPackages).toHaveLength(4);
    expect(new Set(invisibleWomanSideboardPackages.map(item => item.id)).size).toBe(4);
    expect(invisibleWomanSideboardPackages.every(item => item.cards.length === 8)).toBe(true);
  });

  it('keeps package identities and swap guidance explicit', () => {
    for (const item of invisibleWomanSideboardPackages) {
      expect(item.identity.length).toBeGreaterThan(20);
      expect(item.swapNote.length).toBeGreaterThan(20);
      expect(item.cards.every(card => card.name && card.role && card.reason)).toBe(true);
    }
  });
});
