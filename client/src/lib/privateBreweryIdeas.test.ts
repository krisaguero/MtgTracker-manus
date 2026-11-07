import { describe, expect, it } from 'vitest';
import { buildPrivateBreweryIdeas, getPrivateDeckStatusLabel } from './privateBreweryIdeas';
import type { DeckboxSourceRecord } from './privateDeckBrewery';

const baseDeck: DeckboxSourceRecord = {
  id: 'idea-1',
  name: 'Mazirek clues, tokens and sacrifice',
  parentFolder: 'Brews',
  folderPath: ['Commander ideas', 'Brews'],
  main: [
    { name: 'Clue token maker', quantity: 2 },
    { name: 'Sacrifice outlet', quantity: 1 },
    { name: 'Value creature', quantity: 2 },
  ],
  sideboard: [{ name: 'Possible payoff', quantity: 1 }],
  mainCopiesListed: 5,
  mainCopiesExported: 5,
  mainLandCopies: 0,
  contextualTarget: 60,
  status: 'under_target',
};

describe('private brewery suggestions', () => {
  it('keeps Commander, custom Brawlternative, and non-Commander Battle Box plans separate', () => {
    const before = JSON.stringify(baseDeck);
    const ideas = buildPrivateBreweryIdeas(baseDeck);
    expect(ideas).toHaveLength(3);
    expect(ideas.map((idea) => idea.title)).toEqual([
      'Full Commander: make the theme the engine',
      'Brawlternative: a custom 60-card commander build',
      'Battle Box: make a fair 60-card duel deck',
    ]);
    expect(ideas[0].lead).toContain('Clue-and-value');
    expect(ideas[0].lead).toContain('100-card Commander');
    expect(ideas[1].lead).toContain('60-card Brawlternative');
    expect(ideas[1].steps.join(' ')).toContain('not official Arena Brawl');
    expect(ideas[2].lead).toContain('Battle Box deck');
    expect(JSON.stringify(baseDeck)).toBe(before);
  });

  it('shows gaps as planning math, not proof that the author intended a finished list', () => {
    const under = buildPrivateBreweryIdeas(baseDeck);
    expect(under[1].lead).toContain('55-slot planning gap');
    const pool = { ...baseDeck, main: Array.from({ length: 65 }, (_, index) => ({ name: `Candidate ${index}`, quantity: 1 })), status: 'over_target_candidate_pool' };
    const over = buildPrivateBreweryIdeas(pool);
    expect(over[1].lead).toContain('65 main copies are present');
    expect(over[1].lead).toContain('keep the extras as unchosen candidates');
  });

  it('does not invent cards or treat partial exports as full lists', () => {
    const partial = { ...baseDeck, mainCopiesListed: 1672, mainCopiesExported: 201, exportStatus: 'partial_paginated_source' };
    const ideas = buildPrivateBreweryIdeas(partial);
    expect(ideas.every((idea) => idea.lead.includes('not a complete source snapshot'))).toBe(true);
    expect(getPrivateDeckStatusLabel(partial)).toBe('Partial paginated source');
    const hidden = { ...baseDeck, exportStatus: 'partial_hidden_scratchpad' };
    expect(getPrivateDeckStatusLabel(hidden)).toBe('Scratchpad rows hidden in source export');
  });
});
