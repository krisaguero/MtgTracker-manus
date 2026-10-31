import { describe, expect, it } from 'vitest';
import { commanderReleaseMatchesColor, mergeLocalOnlyCommanderReleases } from './CommanderLibrary';

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

  it('adds local deck groups whose set codes are absent from Scryfall releases', () => {
    const merged = mergeLocalOnlyCommanderReleases(
      [{ id: 'msc', code: 'msc', name: 'Marvel', released_at: '2026-06-26', card_count: 300, products: [] }],
      [
        { name: 'Avengers Assemble', set_code: 'msc', set_name: 'Marvel', release_date: '2026-06-26', commander: [{ name: 'Captain America' }], approxValue: 0 },
        { name: 'Odds and Ends', set_code: 'sld', set_name: 'Secret Lair Drop', release_date: '2026-09-28', commander: [{ name: 'A Commander' }], approxValue: 0 },
      ],
    );

    expect(merged).toHaveLength(2);
    expect(merged.find((release) => release.code === 'sld')).toMatchObject({
      name: 'Secret Lair Drop',
      products: [{ name: 'Odds and Ends', cardCount: 100 }],
    });
  });
});
