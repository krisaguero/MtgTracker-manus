import { formatArenaExport, formatGenericExport, formatMtgoExport, type DeckExportEntry } from './deckExport';
export type ExportCardEntry = DeckExportEntry;
export function formatArenaDecklist(commander: ExportCardEntry[], deck: ExportCardEntry[]) {
  return formatArenaExport({ commandZone: commander, main: deck });
}
export function formatMoxfieldDecklist(commander: ExportCardEntry[], deck: ExportCardEntry[]) {
  return formatGenericExport({ commandZone: commander, main: deck });
}
export function formatMtgoDecklist(commander: ExportCardEntry[], deck: ExportCardEntry[]) {
  return formatMtgoExport({ commandZone: commander, main: deck });
}
export function formatArchidektDecklist(commander: ExportCardEntry[], deck: ExportCardEntry[]) {
  return [...deck.map(card => `${card.quantity} ${card.name}`), '', 'Commander', ...commander.map(card => `${card.quantity} ${card.name}`)].join('\n');
}
