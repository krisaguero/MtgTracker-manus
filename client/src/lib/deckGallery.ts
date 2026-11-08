export type DeckGalleryCard = {
  name: string;
  quantity: number;
  printing?: string;
};

export type DeckGalleryHelmCard = {
  name: string;
  sourceLocation: "main" | "sideboard" | "not_in_source";
  proposedZoneMove: boolean;
};

export type DeckGalleryHelmEvidence = { label: string; url: string };

export type DeckGalleryChildGuess = {
  name: string;
  label: string;
  sourceLocation: "main" | "sideboard" | "not_in_source";
  proposedZoneMove: boolean;
  note: string;
  evidence: DeckGalleryHelmEvidence[];
};

export type DeckGalleryHelm = {
  status: "assigned" | "not_a_commander_deck" | "unconfirmed";
  confidence:
    | "official_precon"
    | "strongly_supported_partner_pair"
    | "best_fit_inferred"
    | "not_applicable"
    | "unconfirmed";
  label: string;
  commanders: DeckGalleryHelmCard[];
  note: string;
  evidence: DeckGalleryHelmEvidence[];
  separateChildGuess?: DeckGalleryChildGuess;
};

export type DeckGalleryEntry = {
  id: string;
  title: string;
  group:
    | "owner_archive_list"
    | "robert_title_credit"
    | "owner_wip_offbeat"
    | "owner_wip_empty";
  creditLine: string;
  savedFormat: string | null;
  displayStatus: string;
  mainCopies: number;
  mainRows: number;
  sideboardCopies: number;
  sideboardRows: number;
  contextualTarget: number | null;
  sourceSectionsOmitted: boolean;
  helm: DeckGalleryHelm;
  main: DeckGalleryCard[];
  sideboard: DeckGalleryCard[];
};

export type DeckGalleryPayload = {
  schemaVersion: number;
  entries: DeckGalleryEntry[];
};

export type DeckGalleryDisplayMeta = {
  formatLabel: string;
  displayStatus: string;
  contextualTarget: number | null;
  vintageOversizeOverride: boolean;
  formatNote: string | null;
};

export async function loadDeckGallery(
  fetcher: typeof fetch = fetch
): Promise<DeckGalleryPayload> {
  const response = await fetcher("/data/deck-gallery.json", {
    headers: { Accept: "application/json" },
  });
  if (!response.ok)
    throw new Error(`Deck Gallery data request failed (${response.status}).`);
  const payload = (await response.json()) as DeckGalleryPayload;
  if (!payload || !Array.isArray(payload.entries))
    throw new Error("Deck Gallery data is not in the expected format.");
  return payload;
}

/**
 * Deckbox's saved format label is retained as source metadata. Kris clarified that
 * Vintage-tagged lists with more than 100 main-card copies are oversized Commander
 * builds, so the public display uses a 100-card Commander context without changing
 * any title, card row, quantity, order, or sideboard.
 */
export function getDeckGalleryDisplayMeta(
  entry: DeckGalleryEntry
): DeckGalleryDisplayMeta {
  const vintageOversizeOverride =
    entry.savedFormat?.trim().toLowerCase() === "vintage" &&
    entry.mainCopies > 100;
  return {
    formatLabel: vintageOversizeOverride
      ? "Commander · oversized"
      : entry.savedFormat || "Format not specified",
    displayStatus: vintageOversizeOverride
      ? "Over target · candidate pool"
      : entry.displayStatus,
    contextualTarget: vintageOversizeOverride ? 100 : entry.contextualTarget,
    vintageOversizeOverride,
    formatNote: vintageOversizeOverride
      ? `Deckbox saved this as Vintage. Kris notes that this ${entry.mainCopies}-main-card list is an oversized Commander build; its source card rows are unchanged.`
      : null,
  };
}

export function isDeckGalleryWip(entry: DeckGalleryEntry): boolean {
  const status = getDeckGalleryDisplayMeta(entry).displayStatus;
  return (
    status === "Below contextual target" ||
    status === "Over target · candidate pool" ||
    status === "WIP / offbeat source list" ||
    status === "Empty source list"
  );
}
