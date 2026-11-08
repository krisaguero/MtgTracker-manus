import React from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { Router } from 'wouter';
import { describe, expect, it } from 'vitest';
import { BrawlDeckCard } from '@/components/BrawlDeckCard';
import { brawlDecks, cardReference, findBrawlDeck } from '@/lib/brawlDecks';
import BrawlBox from './BrawlBox';
import BrawlDeckDetail from './BrawlDeckDetail';
const taigamSource = `1 Taigam, Sidisi's Hand
1 Go for the Throat
1 Hero's Downfall
1 Murderous Cut
1 Reality Shift
1 Rapid Hybridization
1 Pongify
1 Victim of Night
1 Malicious Affliction
1 Cyclonic Rift
1 Counterspell
1 Arcane Denial
1 Memory Lapse
1 Disallow
1 Dismiss
1 Spell Crumple
1 Brainstorm
1 Ponder
1 Fact or Fiction
1 Read the Bones
1 Night's Whisper
1 Dig Through Time
1 Shadowmage Infiltrator
1 Consuming Aberration
1 Sphinx of Uthuun
1 Oona, Queen of the Fae
1 Archmage Emeritus
1 Diluvian Primordial
1 Sol Ring
1 Dimir Signet
1 Talisman of Dominance
1 Mind Stone
1 Thought Vessel
1 Fellwar Stone
1 Worn Powerstone
1 Toxic Deluge
1 Crux of Fate
1 Black Sun's Zenith
1 Decree of Pain
1 Command Tower
1 Dimir Aqueduct
1 Sunken Hollow
1 Temple of Deceit
1 Dismal Backwater
1 Bojuka Bog
1 Reliquary Tower
7 Island
7 Swamp`;
describe('approved Brawlternative publication', () => {
  it('preserves the exact 60-card Taigam list and does not certify sourcing or official format legality', () => {
    const deck = findBrawlDeck('taigam-sidisis-hand')!;
    const cards = deck.groups.flatMap((group) => group.cards);
    expect(cards.map((card) => `${card.quantity} ${card.name}`).join('\n')).toBe(taigamSource);
    expect(cards.reduce((total, card) => total + card.quantity, 0)).toBe(60);
    expect(cards).toHaveLength(48);
    expect(cards.every((card) => card.colorIdentity?.every((color) => ['U', 'B'].includes(color)))).toBe(true);
    expect(deck.commanderBrawlLegal).toBe(false);
    expect(deck.sourceIssues.join(' ')).toContain('Archmage Emeritus');
    expect(deck.sourceIssues.join(' ')).toContain('unverified source claims');
    expect(cards[0].note).toContain('Skip your draw step');
    expect(cards[0].note).toContain('exiling X cards');
  });
  it('marks the reviewed drafts and separate archive child as public WIP', () => {
    expect(brawlDecks.filter((deck) => deck.publicationStatus === 'work-in-progress').map((deck) => deck.id)).toEqual(['the-wise-mothman', 'rakdos-lord-of-riots', 'karlov-of-the-ghost-council', 'deck-gisa-and-geralf-graveyard-mashup-preview']);
    for (const deck of brawlDecks.filter((entry) => entry.publicationStatus)) {
      expect(deck.reviewStatus).toContain('PUBLIC WORK IN PROGRESS');
      expect(deck.reviewStatus).not.toMatch(/Not published|LOCAL REVIEW DRAFT/);
      expect(deck.sourceIssues.length).toBeGreaterThan(0);
    }
  });
  it('keeps Mothman incomplete, unresolved and off identity rather than silently repairing it', () => {
    const deck = findBrawlDeck('the-wise-mothman')!;
    const cards = deck.groups.flatMap((group) => group.cards);
    expect(cards.reduce((total, card) => total + card.quantity, 0)).toBe(59);
    expect(deck.sourceCountNote).toContain('22 lands');
    expect(deck.offColorCards).toEqual(['Abzan Falconer']);
    const unresolved = cards.filter((card) => card.verificationStatus === 'unresolved');
    expect(unresolved.map((card) => card.name)).toEqual(['Harold and Bob, First City', 'Strong, the Brutish Companion', 'Piper Wright, Public Reporter']);
    expect(unresolved.every((card) => card.colorIdentity === null && card.commanderLegal === null)).toBe(true);
    const html = renderToStaticMarkup(<Router ssrPath="/brawl-box/the-wise-mothman"><BrawlDeckCard deck={deck} detail initialView="visual" /></Router>);
    expect(html).toContain('Unresolved name · identity &amp; legality unknown');
    expect(html).toContain('Optional upgrade proposals · not applied');
    expect(html).toContain('What changed · review notes');
    expect(html).toContain('Off identity');
  });
  it('keeps the Gisa child source-main-only, exactly 60 cards, identity-checked, and visibly untested', () => {
    const deck = findBrawlDeck('deck-gisa-and-geralf-graveyard-mashup-preview')!;
    const sourceInfo = deck.archiveSource!;
    const cards = deck.groups.flatMap((group) => group.cards);
    const total = cards.reduce((sum, card) => sum + card.quantity, 0);
    const gallery = JSON.parse(readFileSync(resolve(process.cwd(), 'client/public/data/deck-gallery.json'), 'utf8')) as {
      entries: Array<{ id: string; title: string; main: Array<{ name: string; quantity: number }>; sideboard: Array<{ name: string; quantity: number }> }>;
    };
    const source = gallery.entries.find((entry) => entry.id === sourceInfo.galleryHref.split('/').pop())!;
    const sourceMain = new Map<string, number>();
    for (const card of source.main) sourceMain.set(card.name, (sourceMain.get(card.name) ?? 0) + card.quantity);
    expect(source.title).toBe(sourceInfo.title);
    expect(sourceInfo.mainCopies).toBe(110);
    expect(sourceInfo.sideboardCopies).toBe(33);
    expect(deck.sourceStatedTotal).toBe(110);
    expect(deck.publicationStatus).toBe('work-in-progress');
    expect(deck.reviewStatus).toContain('Untested');
    expect(deck.sourceIssues.join(' ')).toContain('not official Magic Brawl');
    expect(deck.commander).toBe('Gisa and Geralf');
    expect(sourceInfo.relationshipNote).toContain('does not establish a commander');
    expect(deck.offColorCards).toEqual([]);
    expect(cards).toHaveLength(36);
    expect(total).toBe(60);
    expect(cards.find((card) => card.name === 'Island')?.quantity).toBe(9);
    expect(cards.find((card) => card.name === 'Swamp')?.quantity).toBe(17);
    expect(cards.filter((card) => !['Island', 'Swamp'].includes(card.name))).toHaveLength(34);
    expect(cards.filter((card) => !['Island', 'Swamp'].includes(card.name)).every((card) => card.quantity === 1)).toBe(true);
    expect(cards.every((card) => (card.colorIdentity ?? []).every((color) => deck.commanderColorIdentity.includes(color)))).toBe(true);
    expect(cards.every((card) => card.commanderLegal)).toBe(true);
    expect(cards.every((card) => sourceMain.get(card.name)! >= card.quantity)).toBe(true);
    expect(cards.every((card) => !source.sideboard.some((sideboardCard) => sideboardCard.name === card.name) || sourceMain.has(card.name))).toBe(true);
    expect(cardReference('Gisa and Geralf')?.imageUrl).toBeTruthy();
    expect(cardReference('Cryptbreaker')?.imageUrl).toBeTruthy();
    expect(JSON.stringify(deck)).not.toMatch(/"(?:owned|ownedCount|proxyCount|proxyNeeded|purchaseGap|scanMatches|deckboxRecordId|privateSourceUrl)"|\[PROXY\]|100% owned|zero proxies/i);
    const html = renderToStaticMarkup(<Router ssrPath={`/brawl-box/${deck.id}`}><BrawlDeckDetail params={{ deckId: deck.id }} /></Router>);
    expect(html).toContain('Public source and child relationship');
    expect(html).toContain('href="/deck-gallery/deck-gisa-and-geralf-graveyard-mashup"');
    expect(html).toContain('href="/deck-brewery/reviews/gisa-and-geralf-graveyard-mashup"');
    expect(html).toContain('The saved Gallery record does not establish an original commander');
    expect(html).toContain('Scryfall card identities and format-status fields checked 2026-11-07');
    expect(html).toContain('Scryfall card-level Brawl status: not_legal');
  });
  it('shows the child in its separate public Deck Brewery offshoot tile shelf', () => {
    const html = renderToStaticMarkup(<Router ssrPath="/brawl-box"><BrawlBox /></Router>);
    expect(html).toContain('Deck Brewery offshoots');
    expect(html).toContain('href="#public-archive-children"');
    expect(html).toContain('Jump to Deck Brewery offshoots');
    expect(html).toContain('the untested Gisa and Geralf graveyard child');
    expect(html).toContain('60-card custom Commander preview · separate from source');
    expect(html).toContain('Public child · untested WIP');
    expect(html).toContain('href="/brawl-box/deck-gisa-and-geralf-graveyard-mashup-preview"');
  });
  it('retains approved Karlov corrections and all published lists without private inventory fields', () => {
    const cards = findBrawlDeck('karlov-of-the-ghost-council')!.groups.flatMap((group) => group.cards);
    expect(cards.some((card) => card.name === 'Crested Sunmare')).toBe(true);
    expect(cards.some((card) => card.name === 'Daxos the Returned')).toBe(true);
    for (const deck of brawlDecks) {
      const count = deck.groups.flatMap((group) => group.cards).reduce((total, card) => total + card.quantity, 0);
      expect(count).toBe(deck.id === 'the-wise-mothman' ? 59 : 60);
      expect(JSON.stringify(deck)).not.toMatch(/"(?:owned|ownedCount|proxyCount|proxyNeeded|purchaseGap|scanMatches)"|\[PROXY\]|100% owned|zero proxies/i);
    }
  });
});
