// Design philosophy: export UI stays editorial and useful—plain text is clean, portable, and easy to paste into deck tools.
export interface ExportCardEntry {
  name: string;
  quantity: number;
}

function formatEntry(entry: ExportCardEntry) {
  return `${entry.quantity} ${entry.name}`;
}

/** Magic Arena accepts one quantity/name entry per line. */
export function formatArenaDecklist(commander: ExportCardEntry[], deck: ExportCardEntry[]) {
  return [...commander, ...deck].map(formatEntry).join('\n');
}

/** Moxfield recognizes explicit Commander and Deck sections. */
export function formatMoxfieldDecklist(commander: ExportCardEntry[], deck: ExportCardEntry[]) {
  return [
    'Commander',
    ...commander.map(formatEntry),
    '',
    'Deck',
    ...deck.map(formatEntry),
  ].join('\n');
}

/** MTGO deck text uses quantity/name rows with a Commander section marker. */
export function formatMtgoDecklist(commander: ExportCardEntry[], deck: ExportCardEntry[]) {
  return [
    'Commander',
    ...commander.map(formatEntry),
    '',
    'Main',
    ...deck.map(formatEntry),
  ].join('\n');
}

/** Archidekt accepts the same quantity/name rows and recognizes a Commander section. */
export function formatArchidektDecklist(commander: ExportCardEntry[], deck: ExportCardEntry[]) {
  return [
    ...deck.map(formatEntry),
    '',
    'Commander',
    ...commander.map(formatEntry),
  ].join('\n');
}
