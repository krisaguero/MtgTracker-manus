import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { getCommanderPreconUpgradeGuide, getUpgradeOwnership, samplePreconUpgradeGuides } from '@/data/commanderPreconUpgradeGuides';
import { PreconUpgradePaths } from './PreconUpgradePaths';

describe('precon upgrade path prototype', () => {
  it('keeps ten source-verified sample deck identities and usable EDHREC citations', () => {
    expect(samplePreconUpgradeGuides).toHaveLength(10);
    for (const guide of samplePreconUpgradeGuides) {
      expect(guide.picks.length).toBeGreaterThanOrEqual(3);
      expect(guide.sourceUrls.some((url) => url.startsWith('https://edhrec.com/'))).toBe(true);
      expect(guide.preconUrl).toMatch(/^https:\/\/edhrec\.com\/precon\//);
      expect(guide.alternatePaths.length).toBeGreaterThan(0);
      expect(guide.swaps.length).toBeLessThanOrEqual(25);
      expect(getCommanderPreconUpgradeGuide({ setCode: guide.setCode, deckName: guide.deckName, commanderNames: guide.commanderNames })).toBe(guide);
    }
  });

  it('matches repeated commander names by exact deck identity', () => {
    const c16 = getCommanderPreconUpgradeGuide({ setCode: 'c16', deckName: 'Breed Lethality', commanderNames: ["Atraxa, Praetors' Voice"] });
    const cm2 = getCommanderPreconUpgradeGuide({ setCode: 'cm2', deckName: 'Breed Lethality', commanderNames: ["Atraxa, Praetors' Voice"] });
    expect(c16).toBeDefined();
    expect(cm2).toBeDefined();
    expect(c16).not.toBe(cm2);
    expect(c16?.setCode).toBe('c16');
    expect(cm2?.setCode).toBe('cm2');
  });

  it('renders collapsible upgrades, citations, ownership-first ordering, and a candid Top 25 count', () => {
    const html = renderToStaticMarkup(
      <PreconUpgradePaths
        setCode="blc"
        deckName="Peace Offering"
        commanderNames={['Ms. Bumbleflower']}
        ownedCards={[{ name: 'Evolution Sage', quantity: 2, setCode: 'M20', collectorNumber: '191' }]}
      />,
    );
    expect(html).toContain('<details');
    expect(html).toContain('Easy upgrades');
    expect(html).toContain('Top 25 swaps');
    expect(html).toContain('0 / 25 supported');
    expect(html).toContain('Evolution Sage');
    expect(html).toContain('Owned · 2 copies');
    expect(html).toContain('Matched printing(s):');
    expect(html).toContain('Mr. Foxglove');
    expect(html).toContain('https://edhrec.com/articles/peace-offering-upgrade-guide-bloomburrow');
    expect(html.indexOf('Evolution Sage')).toBeLessThan(html.indexOf('Gluntch, the Bestower'));
    expect(html).toContain('Unknown · not found in local collection');
    expect(html).toContain('Ownership is matched only against the collection stored in this browser');
  });

  it('reports live ownership by card name and leaves unmatched cards unknown', () => {
    const match = getUpgradeOwnership('Farseek', [{ name: 'Farseek', quantity: 3, setCode: 'M21', collectorNumber: '200' }]);
    expect(match.status).toBe('owned');
    expect(match.quantity).toBe(3);
    expect(match.printings).toContain('M21 · 200');

    const unknown = getUpgradeOwnership('Not in this local collection', []);
    expect(unknown.status).toBe('unknown');
    expect(unknown.note).toContain('does not mean you do not own it');
  });

  it('keeps ownership matches isolated to the collection provided for each viewer', () => {
    const viewerOne = getUpgradeOwnership('Farseek', [{ name: 'Farseek', quantity: 1 }]);
    const viewerTwo = getUpgradeOwnership('Farseek', []);
    expect(viewerOne.status).toBe('owned');
    expect(viewerTwo.status).toBe('unknown');
  });

  it('shows an explicit no-coverage state rather than inventing data for an unmapped page', () => {
    const html = renderToStaticMarkup(<PreconUpgradePaths setCode="zzz" deckName="Unmapped Deck" commanderNames={['Unmapped Commander']} />);
    expect(html).toContain('Easy upgrades &amp; alternate paths');
    expect(html).toContain('No source coverage');
    expect(html).toContain('No source-verified easy upgrade picks were found for this deck.');
    expect(html).toContain('No source-backed card-in/card-out pairs were found; no swaps have been fabricated.');
    expect(html).toContain('0/25 supported');
  });

  it('keeps the new samples in their own native themes', () => {
    const dance = getCommanderPreconUpgradeGuide({ setCode: 'ecc', deckName: 'Dance of the Elements', commanderNames: ['Ashling, the Limitless'] });
    expect(dance?.picks.map((pick) => pick.name)).toContain('Grave Sifter');
    expect(dance?.alternatePaths[0]?.title).toContain('Mass of Mysteries');

    const abzan = getCommanderPreconUpgradeGuide({ setCode: 'tdc', deckName: 'Abzan Armor', commanderNames: ['Felothar the Steadfast'] });
    expect(abzan?.picks.map((pick) => pick.name)).toContain('Portcullis Vine');
    expect(abzan?.alternatePaths.map((path) => path.title).join(' ')).toContain('Doran');

    const wanted = getCommanderPreconUpgradeGuide({ setCode: 'otc', deckName: 'Most Wanted', commanderNames: ['Olivia, Opulent Outlaw'] });
    expect(wanted?.picks.map((pick) => pick.name)).not.toContain('Mirkwood Bats');
    expect(wanted?.alternatePaths[0]?.title).toContain('Vihaan');
  });
});
