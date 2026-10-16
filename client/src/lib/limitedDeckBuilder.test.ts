import { describe, expect, it } from 'vitest';
import { EMPTY_LIMITED_WORKSPACE, formatLimitedDeck, limitedDeckTotal, parseLimitedPool, setLimitedDeckQuantity, validateLimitedWorkspace } from './limitedDeckBuilder';

describe('Limited pool and deck builder', () => {
  it('parses and aggregates card quantities without inferring missing metadata', () => {
    expect(parseLimitedPool('2 Lightning Bolt\n1x Island\n1 Lightning Bolt').map(({ name, quantity }) => [name, quantity])).toEqual([['Lightning Bolt', 3], ['Island', 1]]);
  });

  it('caps selected copies to the pool and counts added basic lands', () => {
    const pool = parseLimitedPool('2 Island');
    const selected = setLimitedDeckQuantity({ ...EMPTY_LIMITED_WORKSPACE, pool }, 'Island', 8);
    const complete = { ...selected, basicLands: { ...selected.basicLands, W: 17 } };
    expect(complete.pool[0]?.deckQuantity).toBe(2);
    expect(limitedDeckTotal(complete)).toBe(19);
    expect(formatLimitedDeck(complete)).toContain('17 Plains');
    expect(validateLimitedWorkspace(complete)).toBe(true);
  });
});
