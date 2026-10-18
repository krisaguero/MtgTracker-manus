export type DeckExportEntry = { name: string; quantity: number };

export type DeckExportSections = {
  commandZone?: DeckExportEntry[];
  main: DeckExportEntry[];
  sideboard?: DeckExportEntry[];
};

export const DECK_EXPORT_LINKS = {
  arena: 'https://mtgarena-support.wizards.com/hc/en-us/articles/360049857771-Importing-a-Deck',
  mtgo: 'https://www.mtgo.com/getting-started/getting-started-deckbuilding',
  convoke: 'https://convoke.games/en/',
  aura0: 'https://aura0.app/',
} as const;

/** Preserve submitted names (including split-card punctuation) while rejecting unusable rows. */
export function validExportEntries(entries: DeckExportEntry[] | undefined): DeckExportEntry[] {
  return (entries ?? [])
    .map(entry => ({ name: String(entry.name ?? '').trim(), quantity: Number(entry.quantity) }))
    .filter(entry => entry.name.length > 0 && Number.isInteger(entry.quantity) && entry.quantity > 0);
}

function rows(entries: DeckExportEntry[] | undefined) {
  return validExportEntries(entries).map(entry => `${entry.quantity} ${entry.name}`);
}

/** Arena's documented clipboard import is a plain quantity/name list. No legality or availability is inferred. */
export function formatArenaExport(sections: DeckExportSections): string {
  const output: string[] = [];
  const command = rows(sections.commandZone);
  if (command.length) output.push('Commander', ...command, '');
  output.push('Deck', ...rows(sections.main));
  const sideboard = rows(sections.sideboard);
  if (sideboard.length) output.push('', 'Sideboard', ...sideboard);
  return output.join('\n');
}

/** MTGO text: main first and commander at the end after a blank line. Optional house sideboards need manual client review. */
export function formatMtgoExport(sections: DeckExportSections): string {
  const output: string[] = [...rows(sections.main)];
  const sideboard = rows(sections.sideboard);
  if (sideboard.length) output.push('', 'Sideboard', ...sideboard);
  const command = rows(sections.commandZone);
  if (command.length) output.push('', ...command);
  return output.join('\n');
}

/** Generic online decklist with explicit command-zone handling; suitable for copy/paste into a site that accepts text. */
export function formatGenericExport(sections: DeckExportSections): string {
  const output: string[] = [];
  const command = rows(sections.commandZone);
  if (command.length) output.push('Commander', ...command, '');
  output.push('Deck', ...rows(sections.main));
  const sideboard = rows(sections.sideboard);
  if (sideboard.length) output.push('', 'Sideboard', ...sideboard);
  return output.join('\n');
}

export function downloadDeckText(text: string, filename: string) {
  if (typeof document === 'undefined') return false;
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename.endsWith('.txt') ? filename : `${filename}.txt`;
  anchor.click();
  URL.revokeObjectURL(url);
  return true;
}
