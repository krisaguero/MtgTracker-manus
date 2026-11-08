import React from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { Router } from 'wouter';
import { describe, expect, it } from 'vitest';
import type { BreweryReviewPayload } from '@/lib/deckBreweryReviews';
import { DeckBreweryReviewDetailView, DeckBreweryReviewIndexView } from './DeckBreweryReviews';

const payload = JSON.parse(
  readFileSync(resolve(process.cwd(), 'client/public/data/deck-brewery-reviews.json'), 'utf8'),
) as BreweryReviewPayload;
const escapeHtml = (value: string) => renderToStaticMarkup(<>{value}</>);
const page = (entry: BreweryReviewPayload['entries'][number]) => renderToStaticMarkup(
  <Router ssrPath={`/deck-brewery/reviews/${entry.slug}`}>
    <DeckBreweryReviewDetailView entry={entry} />
  </Router>,
);

describe('public Deck Brewery pages', () => {
  it('renders a searchable card-art catalog without sign-in language or private source data', () => {
    const html = renderToStaticMarkup(
      <Router ssrPath="/deck-brewery/reviews">
        <DeckBreweryReviewIndexView payload={payload} />
      </Router>,
    );
    expect(html).toContain('Open proposal shelf · no sign-in');
    expect(html).toContain('source lists with a review page');
    expect(html).toContain('>166</strong>');
    expect(html).toContain('href="/deck-brewery/reviews/xenagos-budget-edh"');
    expect(html).toContain('Gisa and Geralf — Graveyard Mashup');
    expect(html).toContain('110 main + 33 sideboard');
    expect(html).toContain('href="/brawl-box/deck-gisa-and-geralf-graveyard-mashup-preview"');
    expect(html).toContain('Search a title, card, role, or status');
    expect(html).not.toMatch(/\/home\/ubuntu|private_source|archive_id|owned_cards_checked/i);
  });

  it('shows exact proposed cards, card art, count caveats, and a link to the unchanged public source', () => {
    const xenagos = payload.entries.find((candidate) => candidate.title === 'Xenagos Budget EDH')!;
    const html = page(xenagos);
    expect(html).toContain(escapeHtml(xenagos.title));
    expect(html).toContain('138/100');
    expect(html).toContain('38 copies above target');
    expect(html).toContain('Not count-balanced');
    expect(html).toContain('Beast Within');
    expect(html).toContain('Brontotherium');
    expect(html).toContain('api.scryfall.com/cards/named?exact=Beast%20Within&amp;format=image&amp;version=art_crop');
    expect(html).toContain(`href="${xenagos.sourceGalleryHref}"`);
    expect(html).toContain('not a final deck');
  });

  it('shows exact section moves and does not imply an unverified commander', () => {
    const sworn = payload.entries.find((candidate) => candidate.title === 'Black - Sworn To Darkness')!;
    const html = page(sworn);
    expect(html).toContain('Butcher of Malakir');
    expect(html).toContain('Swiftfoot Boots');
    expect(html).toContain('sideboard → library');
    expect(html).not.toContain('At the helm · verified');
    expect(html).toContain('Ob Nixilis of the Black Oath');
  });

  it('keeps title-level Robogles credit distinct from authorship or endorsement', () => {
    const entry = payload.entries.find((candidate) => candidate.title === "Daxos's Chants @robogles")!;
    const html = page(entry);
    expect(html).toContain('Robogles title-level credit only');
    expect(html).toContain('not a verified author byline, endorsement, or claim of playtesting');
    expect(html).not.toContain('At the helm · verified');
    expect(html).toContain('Conditional on confirming Commander format');
  });
});
