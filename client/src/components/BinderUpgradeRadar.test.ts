import { describe, expect, it } from 'vitest';
import { buildBinderUpgradeRadarItems, getBinderUpgradeRadarDescription, getBinderUpgradeRadarHeadline } from './BinderUpgradeRadar';
import type { CommanderPreconUpgradeGuide } from '@/data/commanderPreconUpgradeGuides';

const guide: CommanderPreconUpgradeGuide = {
  id: 'test-abzan-armor',
  setCode: 'tdc',
  deckName: 'Abzan Armor',
  commanderNames: ['Felothar the Steadfast'],
  theme: 'Keep the Abzan high-toughness armor theme.',
  picks: [{ name: 'Portcullis Vine', slug: 'portcullis-vine', reason: 'A low-cost defender that supports the toughness plan.', budgetNote: 'Source labels it budget; current price not supplied.' }],
  alternatePaths: [],
  swaps: [],
  sourceUrls: ['https://edhrec.com/articles/abzan-armor-upgrade-guide'],
  sourceLabel: 'EDHREC',
  preconUrl: 'https://edhrec.com/precon/abzan-armor',
  coverage: 'full',
  coverageNote: '',
};

describe('Binder Upgrade Radar data', () => {
  it('uses accurate headlines for empty, unmatched, and matched collections', () => {
    expect(getBinderUpgradeRadarHeadline(0, 0)).toBe('Explore Commander upgrade ideas.');
    expect(getBinderUpgradeRadarHeadline(4, 0)).toBe('No researched picks found in this binder yet.');
    expect(getBinderUpgradeRadarHeadline(4, 2)).toBe('Your collection has 2 researched upgrades in it.');
  });

  it('uses empty and unmatched copy that does not imply cards are already in the binder', () => {
    expect(getBinderUpgradeRadarDescription(0, 0)).toContain('import a ManaBox list');
    expect(getBinderUpgradeRadarDescription(0, 0)).not.toContain('Start with cards you already own');
    expect(getBinderUpgradeRadarDescription(4, 0)).toContain('No guide picks matched');
  });

  it('matches owned cards locally while retaining guide, theme, and source context', () => {
    const items = buildBinderUpgradeRadarItems([guide], [{ name: 'Portcullis Vine', quantity: 2, setCode: 'MKM', collectorNumber: '201' }]);
    expect(items).toHaveLength(1);
    expect(items[0].ownership).toMatchObject({ status: 'owned', quantity: 2 });
    expect(items[0].guideHref).toBe('/deck/tdc/abzan-armor');
    expect(items[0].sourceUrl).toBe('https://edhrec.com/articles/abzan-armor-upgrade-guide');
    expect(items[0].guide.theme).toContain('high-toughness');
    expect(items[0].pick.budgetNote).toContain('current price not supplied');
  });

  it('keeps unmatched ownership unknown instead of calling a card unowned', () => {
    const [item] = buildBinderUpgradeRadarItems([guide], []);
    expect(item.ownership.status).toBe('unknown');
    expect(item.ownership.note).toContain('does not mean you do not own it');
  });

  it('supports split-name matching in the same way as the precon guides', () => {
    const splitGuide = { ...guide, picks: [{ ...guide.picks[0], name: 'Fire // Ice' }] };
    const [item] = buildBinderUpgradeRadarItems([splitGuide], [{ name: 'Ice', quantity: 1 }]);
    expect(item.ownership.status).toBe('owned');
  });
});
