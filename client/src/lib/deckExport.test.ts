import { describe, expect, it } from 'vitest';
import { formatArenaExport, formatGenericExport, formatMtgoExport, validExportEntries } from './deckExport';
const sections = {
  commandZone: [{ name: 'Queen Marchesa', quantity: 1 }],
  main: [{ name: 'Fire // Ice', quantity: 2 }, { name: "  Comma, Apostrophe's  ", quantity: 1 }, { name: 'Zero', quantity: 0 }, { name: 'Negative', quantity: -1 }, { name: '', quantity: 2 }, { name: 'Fraction', quantity: 1.5 }],
  sideboard: [{ name: 'Side Card', quantity: 2 }],
};
describe('deck export', () => {
  it('rejects invalid quantities and empty names without changing punctuation', () => {
    expect(validExportEntries(sections.main)).toEqual([{name:'Fire // Ice',quantity:2},{name:"Comma, Apostrophe's",quantity:1}]);
  });
  it('keeps Arena commander, deck and sideboard zones separate', () => {
    expect(formatArenaExport(sections)).toBe("Commander\n1 Queen Marchesa\n\nDeck\n2 Fire // Ice\n1 Comma, Apostrophe's\n\nSideboard\n2 Side Card");
  });
  it('keeps generic sections explicit', () => {
    expect(formatGenericExport(sections)).toContain('Commander\n1 Queen Marchesa');
    expect(formatGenericExport(sections)).toContain('\n\nSideboard\n2 Side Card');
  });
  it('places MTGO commander last without inventing Main or native XML', () => {
    const output = formatMtgoExport(sections);
    expect(output.startsWith('2 Fire // Ice')).toBe(true);
    expect(output.endsWith('\n\n1 Queen Marchesa')).toBe(true);
    expect(output).not.toContain('Main\n');
    expect(output).not.toContain('<Card');
    expect(output).not.toContain('.dek');
    expect(output).toContain('2 Side Card');
  });
  it('exports noncommander lists without an empty commander zone', () => {
    const d={main:[{name:'Mountain',quantity:60}]};
    expect(formatMtgoExport(d)).toBe('60 Mountain');
    expect(formatArenaExport(d)).toBe('Deck\n60 Mountain');
  });
});
