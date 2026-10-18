import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Router } from 'wouter';
import { describe, expect, it } from 'vitest';
import source from '@/data/brawlBox2026.json';
import { BrawlDeckCard } from '@/components/BrawlDeckCard';
import { brawlDecks, cardImage, cardImageFallback, cardReference, type BrawlBoxCard, type BrawlBoxGroup } from './brawlDecks';

const submittedCards = (groups: BrawlBoxGroup[]) => groups.flatMap((group) => group.cards).map(({ role, ...card }: BrawlBoxCard) => card).sort((a, b) => a.name.localeCompare(b.name));
const escape = (value: string) => renderToStaticMarkup(<>{value}</>);

describe('visual strategy presentation without deck edits', () => {
  it.each(brawlDecks)('preserves every submitted card field and all deck warnings for $id', (deck) => {
    const original = source.decks.find((entry) => entry.id === deck.id)!;
    expect(submittedCards(deck.groups)).toEqual(submittedCards(original.groups));
    expect(submittedCards(deck.sideboardGroups ?? [])).toEqual(submittedCards('sideboardGroups' in original ? original.sideboardGroups ?? [] : []));
    const { groups, sideboardGroups, plan, ...metadata } = deck;
    const { groups: oldGroups, sideboardGroups: oldSideboard, ...oldMetadata } = original as typeof deck;
    expect(metadata).toEqual(oldMetadata);
    expect(plan!.length).toBeGreaterThan(50);
  });

  it.each(brawlDecks)('explains every package and every card in both modes for $id', (deck) => {
    const groups = [...deck.groups, ...(deck.sideboardGroups ?? [])];
    for (const group of groups) {
      expect(group.intro!.length).toBeGreaterThan(45);
      for (const card of group.cards) {
        expect(card.role!.length).toBeGreaterThan(12);
        expect(card.role).not.toMatch(/It is useful here because|…|\.\.\./);
        if (card.verificationStatus !== 'unresolved') expect(card.role).not.toMatch(/UNRESOLVED|cannot assess until verified/i);
      }
    }
    for (const mode of ['list', 'visual'] as const) {
      const html = renderToStaticMarkup(<Router ssrPath="/brawl-box"><BrawlDeckCard deck={deck} detail initialView={mode} /></Router>);
      expect(html).toContain('The game plan');
      for (const group of groups) {
        expect(html).toContain(escape(group.intro!));
        for (const card of group.cards) expect(html).toContain(escape(card.role!));
      }
      expect(html).not.toMatch(/"(?:owned|ownedCount|proxyCount|proxyNeeded|purchaseGap|scanMatches)"|\[PROXY\]/i);
    }
  });

  it('opens detail pages visually while keeping the shelf compact and illustrated', () => {
    const detail = renderToStaticMarkup(<Router ssrPath="/brawl-box"><BrawlDeckCard deck={brawlDecks[0]} detail /></Router>);
    const shelf = renderToStaticMarkup(<Router ssrPath="/brawl-box"><BrawlDeckCard deck={brawlDecks[0]} /></Router>);
    expect(detail).toMatch(/aria-pressed="true"[^>]*>Visual spoiler/);
    expect(shelf).toMatch(/aria-pressed="true"[^>]*>Readable decklist/);
    expect(shelf).toContain('<img');
  });

  it('uses exact canonical printings and does not guess art for unresolved submitted names', () => {
    for (const deck of brawlDecks) {
      for (const card of [...deck.groups, ...(deck.sideboardGroups ?? [])].flatMap((group) => group.cards)) {
        const reference = cardReference(card.name);
        if (card.verificationStatus === 'unresolved') {
          expect(reference).toBeUndefined();
          expect(cardImage(card.name)).toBeUndefined();
          expect(cardImageFallback(card.name)).toBeUndefined();
          continue;
        }
        expect(reference).toBeDefined();
        expect(reference.name.split(' // ')).toContain(card.name);
        expect(new URL(reference.scryfallUrl).hostname).toBe('scryfall.com');
        expect(reference.scryfallUrl).toContain(`/card/${reference.set}/${reference.collectorNumber}/`);
        expect(cardImage(card.name)).toContain(reference.id);
        expect(new URL(cardImage(card.name)!).hostname).toBe('cards.scryfall.io');
        expect(cardImageFallback(card.name)).toContain(`/cards/${reference.id}?`);
        expect([...reference.colorIdentity].sort()).toEqual([...(card.colorIdentity ?? [])].sort());
      }
    }
  });
});
