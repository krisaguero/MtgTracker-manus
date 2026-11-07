import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrivateDeckReviewTemplate } from './PrivateDeckReviewTemplate';
import type { DeckboxSourceRecord } from '@/lib/privateDeckBrewery';

const source: DeckboxSourceRecord = {
  id: 'generic-review-template-test',
  name: 'Generic review template test',
  main: [],
  sideboard: [],
  status: 'empty',
};

describe('PrivateDeckReviewTemplate', () => {
  it('renders all required precon-style sections and separates the three build paths', () => {
    const markup = renderToStaticMarkup(<PrivateDeckReviewTemplate deck={source} edhrecUrl={null} />);
    const readableMarkup = markup.replaceAll('&amp;', '&');
    for (const heading of [
      'Commander & color identity',
      'List status & count',
      'Subtype, tribe & theme',
      'Card bundles & strategic jobs',
      'Game plan & turn sequence',
      'Mana base & land reasoning',
      'Role balance: ramp, draw, answers & finishers',
      'Notable synergies & backup lines',
      'Optional EDHREC alternatives',
      'Playtest checklist',
      'Separate build directions',
      'Full Commander',
      'Custom Brawlternative',
      'Battle Box',
    ]) expect(readableMarkup).toContain(heading);
    expect(markup).toContain('ownership, current legality, budget/prices');
    expect(markup).toContain('does not edit the imported list');
  });

  it('labels saved EDHREC context as optional and does not render an absent link', () => {
    const markup = renderToStaticMarkup(<PrivateDeckReviewTemplate deck={source} edhrecUrl={null} />);
    expect(markup).toContain('No EDHREC reference is attached');
    expect(markup).not.toContain('Open saved EDHREC reference');
  });
});
