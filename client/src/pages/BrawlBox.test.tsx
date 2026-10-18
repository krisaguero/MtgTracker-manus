import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Router } from 'wouter';
import { describe, expect, it } from 'vitest';
import { brawlDecks } from '@/lib/brawlDecks';
import source from '@/data/brawlBox2026.json';
import BrawlBox from './BrawlBox';
import BrawlDeckDetail from './BrawlDeckDetail';

const suppliedCards = `1 Marchesa, the Black Rose
1 Dack's Duplicate
1 Enthralling Victor
1 Mark of Mutiny
1 Harness by Force
1 Grave Betrayal
1 Willbreaker
1 Flayer of the Hatebound
1 Deathbringer Thoctar
1 Hellhole Flailer
1 Hellspark Elemental
1 Chaos Imps
1 Carnival Hellsteed
1 Oracle of Bones
1 Volt Charge
1 Ob Nixilis, Unshackled
1 Ashnod's Altar
1 Carrion Feeder
1 Unspeakable Symbol
1 Sage of Fables
1 Exava, Rakdos Blood Witch
1 Chasm Skulker
1 River Kelpie
1 Feast on the Fallen
1 Feldon of the Third Path
1 Disciple of Bolas
1 Phyrexian Rager
1 Cadaver Imp
1 Liliana's Specter
1 Notion Thief
1 Reanimate
1 Swiftfoot Boots
1 Dragon Blood
1 Sol Ring
1 Talisman of Dominance
1 Talisman of Indulgence
1 Burnished Hart
1 Obelisk of Grixis
1 Command Tower
1 City of Brass
1 Sulfurous Springs
1 Underground River
1 Crumbling Necropolis
1 Rakdos Carnarium
1 Opal Palace
1 Bojuka Bog
1 Temple of Epiphany
1 Evolving Wilds
1 Terramorphic Expanse
1 Grixis Panorama
3 Swamp
3 Island
4 Mountain`;

describe('Marchesa custom non-precon Brawlternative', () => {
  it('preserves every supplied card copy and group total without adding swaps', () => {
    const marchesa = brawlDecks[2]!;
    const cards = marchesa.groups.flatMap((group) => group.cards);
    expect(cards.map((card) => `${card.quantity} ${card.name}`).sort()).toEqual(suppliedCards.split('\n').sort());
    expect(cards.reduce((sum, card) => sum + card.quantity, 0)).toBe(60);
    // Original source headings/totals remain untouched; the display groups by job.
    expect(source.decks[2].groups.map((group) => group.cards.reduce((sum, card) => sum + card.quantity, 0))).toEqual([1, 6, 9, 9, 8, 5, 22]);
    expect(marchesa).toMatchObject({ deckType: 'custom-non-precon', visibleTotal: 60, sourceStatedTotal: 60, targetSize: 60, sourceStatedCuts: 0, offColorCards: [] });
    expect(marchesa.sideboardGroups ?? []).toEqual([]);
  });

  it('links the third commander card to its unchanged custom deck, strategy notes and house-rule setup', () => {
    const html = renderToStaticMarkup(<Router ssrPath="/brawl-box"><BrawlBox /></Router>);
    expect(html).toContain('href="/brawl-box/marchesa-the-black-rose"');
    expect(html).toContain('id="marchesa-the-black-rose"');
    expect(html).toContain('alt="Marchesa, the Black Rose"');
    expect(html).not.toContain('<article');
    const marchesa = renderToStaticMarkup(<Router ssrPath="/brawl-box/marchesa-the-black-rose"><BrawlDeckDetail params={{ deckId: 'marchesa-the-black-rose' }} /></Router>);
    expect(marchesa).toContain('Entry 03');
    expect(marchesa).toContain('Custom · non-precon Brawlternative');
    expect(marchesa).toContain('Grixis (UBR)');
    expect(marchesa).toContain('60 card copies');
    expect(marchesa).toContain('59');
    expect(marchesa).toContain('The Suicide Charge');
    expect(marchesa).toContain('Overheat the Stack');
    expect(marchesa).toContain('Setup &amp; storage · house rules');
    expect(html).toContain('not official Magic Brawl');
    expect(marchesa).not.toMatch(/100% owned|zero proxies/i);
  });
});
