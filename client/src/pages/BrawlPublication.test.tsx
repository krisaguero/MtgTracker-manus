import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Router } from 'wouter';
import { describe, expect, it } from 'vitest';
import { BrawlDeckCard } from '@/components/BrawlDeckCard';
import { brawlDecks, findBrawlDeck } from '@/lib/brawlDecks';
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
  it('marks exactly the three newly approved drafts public WIP', () => {
    expect(brawlDecks.filter((deck) => deck.publicationStatus === 'work-in-progress').map((deck) => deck.id)).toEqual(['the-wise-mothman', 'rakdos-lord-of-riots', 'karlov-of-the-ghost-council']);
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
    const html = renderToStaticMarkup(<Router><BrawlDeckCard deck={deck} detail initialView="visual" /></Router>);
    expect(html).toContain('Unresolved name · identity &amp; legality unknown');
    expect(html).toContain('Optional upgrade proposals · not applied');
    expect(html).toContain('What changed · review notes');
    expect(html).toContain('Off identity');
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
