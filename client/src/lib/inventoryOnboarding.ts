import type { OwnedCard } from './manaboxParser';

export interface InventoryOnboardingSummary {
  entryCount: number;
  totalCopies: number;
  identifiedPrintingCount: number;
  incompletePrintingCount: number;
  setCount: number;
}

/** Summarize the collection in memory; this helper performs no storage or network access. */
export function summarizeInventoryForOnboarding(cards: OwnedCard[]): InventoryOnboardingSummary {
  const identifiedPrintingCount = cards.filter((card) => Boolean(card.setCode && card.collectorNumber)).length;
  return {
    entryCount: cards.length,
    totalCopies: cards.reduce((total, card) => total + card.quantity, 0),
    identifiedPrintingCount,
    incompletePrintingCount: cards.length - identifiedPrintingCount,
    setCount: new Set(cards.map((card) => card.setCode?.trim().toLowerCase()).filter(Boolean)).size,
  };
}

/** A browser-local suggestion list; no model or remote service is involved. */
export function buildLocalInventoryOnboardingNotes(summary: InventoryOnboardingSummary): string[] {
  if (summary.entryCount === 0) {
    return ['Import a ManaBox CSV or paste a card list to begin.'];
  }

  const notes = [
    `${summary.totalCopies.toLocaleString()} copies across ${summary.entryCount.toLocaleString()} printing entries are available in this browser.`,
  ];

  if (summary.incompletePrintingCount > 0) {
    const entryWord = summary.incompletePrintingCount === 1 ? 'entry' : 'entries';
    const verb = summary.incompletePrintingCount === 1 ? 'does' : 'do';
    notes.push(`${summary.incompletePrintingCount} ${entryWord} ${verb} not include both a set code and collector number. Keep those rows unassigned or re-import exact printing details when you need printing-level matches.`);
  } else {
    notes.push('Every entry includes a set code and collector number, so printing-level matching has a strong starting point.');
  }

  notes.push('For Commander, start with the source-linked precon guides, then use the deck workshop to review legality and color identity before relying on any recommendation.');
  notes.push('Collection and deck workspace records remain browser-local unless you choose to export a backup.');
  return notes;
}

export type ProposedGroqInventoryRow = Pick<OwnedCard, 'name' | 'quantity'> & Partial<Pick<OwnedCard, 'setCode' | 'collectorNumber'>>;

/**
 * Project only the minimum fields proposed for a future, explicitly opted-in request.
 * This function is used for an on-screen preview only; it does not transmit data.
 */
export function toProposedGroqInventoryRows(cards: OwnedCard[]): ProposedGroqInventoryRow[] {
  return cards.map(({ name, quantity, setCode, collectorNumber }) => ({
    name,
    quantity,
    ...(setCode ? { setCode } : {}),
    ...(collectorNumber ? { collectorNumber } : {}),
  }));
}
