import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildLocalInventoryOnboardingNotes, summarizeInventoryForOnboarding, toProposedGroqInventoryRows } from './inventoryOnboarding';
import type { OwnedCard } from './manaboxParser';

const cards: OwnedCard[] = [
  { name: 'Sol Ring', quantity: 2, setCode: 'CMM', collectorNumber: '396', finish: 'foil', condition: 'NM', language: 'English' },
  { name: 'Swords to Plowshares', quantity: 1, finish: 'normal' },
];

describe('browser-local inventory onboarding', () => {
  it('summarizes entries, copies, exact printing identifiers, and distinct sets', () => {
    expect(summarizeInventoryForOnboarding(cards)).toEqual({
      entryCount: 2,
      totalCopies: 3,
      identifiedPrintingCount: 1,
      incompletePrintingCount: 1,
      setCount: 1,
    });
  });

  it('returns useful local next steps without needing AI', () => {
    const notes = buildLocalInventoryOnboardingNotes(summarizeInventoryForOnboarding(cards));
    expect(notes).toContain('3 copies across 2 printing entries are available in this browser.');
    expect(notes.some((note) => note.includes('1 entry does not include both a set code and collector number'))).toBe(true);
    expect(notes.some((note) => note.includes('source-linked precon guides'))).toBe(true);
  });

  it('projects only the proposed minimum fields for a one-time AI request', () => {
    expect(toProposedGroqInventoryRows(cards)).toEqual([
      { name: 'Sol Ring', quantity: 2, setCode: 'CMM', collectorNumber: '396' },
      { name: 'Swords to Plowshares', quantity: 1 },
    ]);
  });

  it('handles an empty collection without creating an AI payload', () => {
    const summary = summarizeInventoryForOnboarding([]);
    expect(summary).toEqual({ entryCount: 0, totalCopies: 0, identifiedPrintingCount: 0, incompletePrintingCount: 0, setCount: 0 });
    expect(buildLocalInventoryOnboardingNotes(summary)).toEqual(['Import a ManaBox CSV or paste a card list to begin.']);
    expect(toProposedGroqInventoryRows([])).toEqual([]);
  });

  it('keeps the consent rehearsal network-free and explicit', () => {
    const component = readFileSync(resolve(process.cwd(), 'client/src/components/InventoryOnboardingAssistant.tsx'), 'utf8');
    const helper = readFileSync(resolve(process.cwd(), 'client/src/lib/inventoryOnboarding.ts'), 'utf8');
    expect(component).toContain('No AI request on import');
    expect(component).toContain('No API call was made');
    expect(`${component}\n${helper}`).not.toMatch(/\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket/);
  });
});
