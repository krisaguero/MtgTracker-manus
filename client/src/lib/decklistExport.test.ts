import { describe, expect, it } from 'vitest';
import {
  decklistExportFilename,
  formatArchidektDecklist,
  formatArenaDecklist,
  formatMoxfieldDecklist,
  formatMtgoDecklist,
} from './decklistExport';

const commander = [{ name: 'Atraxa, Praetors\' Voice', quantity: 1 }];
const deck = [
  { name: 'Sol Ring', quantity: 1 },
  { name: 'Forest', quantity: 12 },
];

describe('decklistExport', () => {
  it('writes Arena as a flat quantity/name list with the commander first', () => {
    expect(formatArenaDecklist(commander, deck)).toBe("1 Atraxa, Praetors' Voice\n1 Sol Ring\n12 Forest");
  });

  it('writes Moxfield with Commander and Deck sections', () => {
    expect(formatMoxfieldDecklist(commander, deck)).toBe("Commander\n1 Atraxa, Praetors' Voice\n\nDeck\n1 Sol Ring\n12 Forest");
  });

  it('writes MTGO with Commander and Main sections', () => {
    expect(formatMtgoDecklist(commander, deck)).toBe("Commander\n1 Atraxa, Praetors' Voice\n\nMain\n1 Sol Ring\n12 Forest");
  });

  it('writes Archidekt with the deck first and a trailing Commander section', () => {
    expect(formatArchidektDecklist(commander, deck)).toBe("1 Sol Ring\n12 Forest\n\nCommander\n1 Atraxa, Praetors' Voice");
  });

  it('builds safe download filenames', () => {
    expect(decklistExportFilename('Eldrazi Unbound!', 'moxfield')).toBe('eldrazi-unbound-moxfield.txt');
    expect(decklistExportFilename('  ***  ', 'mtgo')).toBe('commander-deck-mtgo.txt');
    expect(decklistExportFilename('A'.repeat(100), 'arena')).toBe(`${'a'.repeat(60)}-arena.txt`);
  });
});
