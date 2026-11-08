import React from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { Router } from 'wouter';
import { describe, expect, it } from 'vitest';
import {
  deckBreweryShowdowns,
  findBreweryReview,
  type DeckBreweryShowdownData,
} from '@/lib/deckBreweryShowdowns';
import type { BreweryReviewPayload } from '@/lib/deckBreweryReviews';
import DeckBreweryShowdowns, { DeckBreweryShowdownDetail } from './DeckBreweryShowdowns';

const root = process.cwd();
const reviews = JSON.parse(readFileSync(resolve(root, 'client/public/data/deck-brewery-reviews.json'), 'utf8')) as BreweryReviewPayload;
const gallery = JSON.parse(readFileSync(resolve(root, 'client/public/data/deck-gallery.json'), 'utf8')) as {
  entries: Array<{ id: string; title: string; main: Array<{ name: string; quantity: number }>; sideboard: Array<{ name: string; quantity: number }> }>;
};

function renderIndex() {
  return renderToStaticMarkup(<Router ssrPath="/deck-brewery/matchups"><DeckBreweryShowdowns initialReviews={reviews} /></Router>);
}

function renderDetail(slug: string) {
  return renderToStaticMarkup(<Router ssrPath={`/deck-brewery/matchups/${slug}`}><DeckBreweryShowdownDetail params={{ matchupSlug: slug }} initialReviews={reviews} /></Router>);
}

describe('Deck Brewery Showdowns', () => {
  it('has three public matchups and three clearly typed combo spotlights', () => {
    expect(deckBreweryShowdowns.matchups).toHaveLength(3);
    expect(deckBreweryShowdowns.comboSpotlights).toHaveLength(3);
    expect(deckBreweryShowdowns.comboSpotlights.map((combo) => combo.typeLabel)).toEqual([
      'Repeatable loop · infinite mana and death triggers',
      'Repeatable tutor engine · not infinite',
      'Finite copy burst · not infinite',
    ]);
    expect(JSON.stringify(deckBreweryShowdowns)).not.toContain('Brago');
  });

  it('references only public review and Gallery records for every matchup', () => {
    for (const matchup of deckBreweryShowdowns.matchups) {
      const left = findBreweryReview(reviews, matchup.leftReviewSlug);
      const right = findBreweryReview(reviews, matchup.rightReviewSlug);
      expect(left).toBeDefined();
      expect(right).toBeDefined();
      for (const entry of [left!, right!]) {
        expect(entry.sourceGalleryHref).toMatch(/^\/deck-gallery\//);
        const galleryId = decodeURIComponent(entry.sourceGalleryHref.split('/').at(-1)!);
        expect(gallery.entries.find((candidate) => candidate.id === galleryId)?.title).toBe(entry.title);
      }
    }
  });

  it('labels source card presence accurately and never passes source sideboard cards off as main', () => {
    const sourceFor = (slug: string) => {
      const review = findBreweryReview(reviews, slug)!;
      const id = decodeURIComponent(review.sourceGalleryHref.split('/').at(-1)!);
      return gallery.entries.find((entry) => entry.id === id)!;
    };
    for (const matchup of deckBreweryShowdowns.matchups) {
      for (const [slug, cards] of [[matchup.leftReviewSlug, matchup.leftCards], [matchup.rightReviewSlug, matchup.rightCards]] as const) {
        const source = sourceFor(slug);
        const main = new Set(source.main.map((card) => card.name));
        const sideboard = new Set(source.sideboard.map((card) => card.name));
        for (const card of cards) {
          if (card.where.includes('source main')) expect(main.has(card.name)).toBe(true);
          if (card.where.includes('source sideboard')) expect(sideboard.has(card.name)).toBe(true);
        }
      }
    }
    const gisa = sourceFor('gisa-and-geralf-graveyard-mashup');
    expect(gisa.main.some((card) => card.name === 'Gravecrawler')).toBe(false);
    expect(gisa.sideboard.some((card) => card.name === 'Gravecrawler')).toBe(true);
  });

  it('renders anonymous public links, exact source titles, status/count caveats, and card art', () => {
    const html = renderIndex();
    expect(html).toContain('Open to everyone · no sign-in');
    expect(html).toContain('/deck-brewery/matchups/undead-rivalries');
    expect(html).toContain('/deck-brewery/matchups/uprising-vs-coalition');
    expect(html).toContain('/deck-brewery/matchups/landfall-vs-sacrifice');
    expect(html).toContain('/brawl-box/deck-gisa-and-geralf-graveyard-mashup-preview');
    expect(html).toContain('*Gisa and Geralf - Graveyard Mashup*');
    expect(html).toContain('Tazri&#x27;s Allies @robogles');
    expect(html).toContain('Gravecrawler');
    expect(html).toContain('separate source sideboard; not in source main');
    expect(html).toContain('Repeatable tutor engine · not infinite');
    expect(html).toContain('Finite copy burst · not infinite');
    expect(html).toContain('https://cards.scryfall.io/art_crop/');
    expect(html).not.toContain('format=image');
  });

  it('keeps source commanders separate from suggested review command-zone choices and preserves Sedris count warning', () => {
    const html = renderDetail('undead-rivalries');
    expect(html).toContain('Source commander:</strong> Not confirmed on the saved Gallery record');
    expect(html).toContain('Gisa and Geralf is proposed for the command zone');
    expect(html).toContain('still two cards short');
    expect(html).toContain('Vintage');
    expect(html).toContain('Proposal · untested');
    expect(html).toContain('Helm inferred');
    expect(html).not.toContain('At the helm · verified');
    expect(html).toContain('Gatherer — Sedris, the Traitor King');
  });

  it('preserves Robogles title-level credit without authorship or endorsement claims', () => {
    const html = renderDetail('uprising-vs-coalition');
    expect(html).toContain('Tazri&#x27;s Allies @robogles');
    expect(html).toContain('Robogles title-level credit only');
    expect(html).toContain('Title credit');
    expect(html).toContain('not a separate authorship, playtest, or endorsement claim');
    expect(html).toContain('proposed for the command zone');
  });

  it('keeps private inventory fields, source IDs, and private paths out of the manifest', () => {
    const serialized = JSON.stringify(deckBreweryShowdowns satisfies DeckBreweryShowdownData);
    for (const forbidden of ['deckboxId', 'sourceRecordId', 'ownerId', 'privateSourceUrl', '/home/ubuntu', 'Deckbox record']) {
      expect(serialized).not.toContain(forbidden);
    }
  });
});
