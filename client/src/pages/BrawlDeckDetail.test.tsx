import React from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { Route, Router, Switch } from 'wouter';
import { describe, expect, it } from 'vitest';
import { BrawlDeckCard } from '@/components/BrawlDeckCard';
import { brawlDeckPath, brawlDecks, brawlProposedDecks, cardImage, cardImageFallback, cardReference, cardPrintingLabel, findBrawlDeck } from '@/lib/brawlDecks';
import BrawlBox from './BrawlBox';
import BrawlDeckDetail from './BrawlDeckDetail';

const escaped = (text: string) => renderToStaticMarkup(<>{text}</>);
const routeMarkup = (path: string) => renderToStaticMarkup(<Router ssrPath={path}><Switch><Route path="/brawl-box/:deckId" component={BrawlDeckDetail} /></Switch></Router>);

describe('published Brawlternative detail pages', () => {
  it('registers a direct route and links every published entry from the shelf', () => {
    const app = readFileSync(resolve(process.cwd(), 'client/src/App.tsx'), 'utf8');
    expect(app).toContain('<Route path="/brawl-box/:deckId" component={BrawlDeckDetail} />');
    const shelf = renderToStaticMarkup(<Router ssrPath="/brawl-box"><BrawlBox /></Router>);
    expect(brawlDecks.map((deck) => deck.id)).toEqual(['dr-madison-li', 'araumi-of-the-dead-tide', 'marchesa-the-black-rose', 'the-wise-mothman', 'rakdos-lord-of-riots', 'karlov-of-the-ghost-council', 'taigam-sidisis-hand']);
    for (const deck of brawlDecks) {
      expect(shelf).toContain(`href="${brawlDeckPath(deck.id)}"`);
      expect(shelf).toContain(`id="${deck.id}"`); // Existing hash links still work.
    }
  });

  it.each(brawlDecks)('renders $id from its direct URL with sources and sibling links', (deck) => {
    const html = routeMarkup(brawlDeckPath(deck.id));
    const displayed = brawlProposedDecks.find((proposal) => proposal.sourceDeckId === deck.id) ?? deck;
    expect(html).toContain(escaped(displayed.title));
    expect(html.match(/<h1\b/g)).toHaveLength(1);
    expect(html.match(/<article\b/g)).toHaveLength(1);
    expect(html).toContain('Sources and format caveats');
    expect(html).toContain('User-supplied decklist');
    expect(html).toContain('not official Magic Brawl');
    expect(html).toContain('not regulation Commander decks');
    expect(html).toContain('href="/brawl-box"');
    for (const sibling of brawlDecks.filter((entry) => entry.id !== deck.id)) {
      expect(html).toContain(`href="${brawlDeckPath(sibling.id)}"`);
    }
  });

  it.each(brawlProposedDecks)('shows complete proposed list and preserved source history for $id', (proposal) => {
    const source = findBrawlDeck(proposal.sourceDeckId!);
    const html = routeMarkup(brawlDeckPath(proposal.sourceDeckId!));
    expect(source).toBeDefined();
    expect(html).toContain('Editorial revision');
    expect(html).toContain('Published proposed 60-card list');
    expect(html).toContain('Proposed · editorial revision');
    expect(html).toContain('Original · source');
    expect(html).toContain('Source-list history · preserved original with audit');
    expect(html).toContain(escaped(proposal.title));
    for (const card of proposal.groups.flatMap((group) => group.cards)) expect(html).toContain(escaped(card.name));
    expect(proposal.groups.flatMap((group) => group.cards).reduce((total, card) => total + card.quantity, 0)).toBe(60);
  });

  it.each(brawlDecks)('exports exactly one commander in $id', (source) => {
    const html = routeMarkup(brawlDeckPath(source.id));
    const preview = html.match(/<pre[^>]*aria-label="Generic text preview"[^>]*>([\s\S]*?)<\/pre>/)?.[1] ?? '';
    expect(preview).not.toBe('');
    const escapedCommander = escaped(source.commander);
    expect(preview.split(`1 ${escapedCommander}`).length - 1).toBe(1);
    const mainAndCommander = preview.split('\n\nSideboard')[0];
    const count = mainAndCommander.split('\n').reduce((sum, row) => sum + Number(row.match(/^(\d+) /)?.[1] ?? 0), 0);
    expect(count).toBe(60);
  });

  for (const view of ['list', 'visual'] as const) {
    it.each(brawlDecks)(`preserves all cards, quantities, notes and warnings in ${view}: $id`, (deck) => {
      const html = renderToStaticMarkup(<Router ssrPath={brawlDeckPath(deck.id)}><BrawlDeckCard deck={deck} detail initialView={view} /></Router>);
      const cards = [...deck.groups, ...(deck.sideboardGroups ?? [])].flatMap((group) => group.cards);
      expect(html).toContain(escaped(deck.subtitle));
      expect(html).toContain(escaped(deck.commanderColorIdentityLabel));
      expect(html).toContain(escaped(deck.sourceCountNote));
      for (const note of [...deck.sourceIssues, ...(deck.setupNotes ?? []), ...(deck.storageNotes ?? [])]) {
        expect(html).toContain(escaped(note));
      }
      for (const card of cards) {
        expect(html).toContain(escaped(card.name));
        expect(html).toContain(`>${card.quantity}×</span>`);
        if (card.note) expect(html).toContain(escaped(card.note));
      }
      for (const offColor of deck.offColorCards) {
        expect(html).toContain(escaped(offColor));
        expect(html).toContain('Off identity');
        expect(html).toContain('Color-identity warning');
      }
      if (deck.sideboardGroups?.length) {
        expect(html).toContain('7 cards · outside the 60-card main deck');
        expect(html).toContain(escaped(deck.sideboardNote!));
      }
      expect(html).toContain('aria-pressed="true"');
      expect(html).toContain(`aria-controls="${deck.id}-cards"`);
      // Each resolved row has artwork in both modes, plus the commander portrait.
      expect(html.match(/<img\b/g)).toHaveLength(cards.filter((card) => card.verificationStatus !== 'unresolved').length + 1);
      expect(html).toContain('loading="lazy"');
      expect(html).toContain('Images are representative Scryfall printings');
      for (const card of cards) {
        if (card.verificationStatus === 'unresolved') expect(cardImage(card.name)).toBeUndefined();
        else {
          expect(html).toContain(escaped(cardImage(card.name)!));
          expect(html).toContain(escaped(cardPrintingLabel(card.name)));
        }
        expect(html).toContain(escaped(card.role!));
      }
      expect(html).not.toMatch(/Owned:|\[PROXY\]|100% owned|zero proxies/i);
    });
  }

  it.each(['mothman', 'rakdos', 'missing-deck'])('does not resolve unknown slug %s', (id) => {
    expect(findBrawlDeck(id)).toBeUndefined();
    const html = routeMarkup(`/brawl-box/${id}`);
    expect(html).toContain('Brawlternative not found');
    expect(html).not.toContain('<article');
    expect(html).not.toMatch(/The Wise Mothman|Karlov of the Ghost Council|Rakdos, Lord of Riots/);
  });

  it('uses canonical CDN art and same-printing fallbacks, never fuzzy lookups', () => {
    const reference = cardReference("Dack's Duplicate")!;
    const url = new URL(cardImage("Dack's Duplicate")!);
    expect(url.hostname).toBe('cards.scryfall.io');
    expect(url.pathname).toContain(reference.id);
    expect(cardImageFallback("Dack's Duplicate")).toBe(`https://api.scryfall.com/cards/${reference.id}?format=image&version=normal`);
    expect(cardImage('missing invented card')).toBeUndefined();
  });
});
