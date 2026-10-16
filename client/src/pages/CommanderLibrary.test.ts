import { describe, expect, it } from 'vitest';
import { commanderReleaseMatchesColor } from './CommanderLibrary';

describe('Commander release color identity filtering', () => {
  const products = [
    { colorIdentity: ['W', 'B', 'R'] },
    { colorIdentity: ['U', 'R'] },
    {},
  ];

  it('matches a selected color only when a product has that verified identity', () => {
    expect(commanderReleaseMatchesColor(products, 'W')).toBe(true);
    expect(commanderReleaseMatchesColor(products, 'G')).toBe(false);
  });

  it('shows all releases only when no color filter is selected', () => {
    expect(commanderReleaseMatchesColor([], 'all')).toBe(true);
    expect(commanderReleaseMatchesColor([{}], 'U')).toBe(false);
  });
});
