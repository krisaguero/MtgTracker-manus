import type { DeckGalleryHelm } from "./deckGallery";

export type BreweryReviewAction = {
  name: string;
  quantity: number;
  role?: string;
};

export type BreweryReviewMove = {
  name: string;
  quantity: number;
  from: string;
  to: string;
  kind: "section" | "command-zone";
};

export type BreweryReviewStatus =
  | "conditional"
  | "count-balanced"
  | "partial"
  | "proposal"
  | "section-alignment"
  | "reference"
  | "needs-context"
  | "no-change";

export type BreweryReviewProposal = {
  version: number;
  versionLabel: string;
  status: BreweryReviewStatus;
  statusLabel: string;
  formatLens: string;
  commander: string | null;
  adds: BreweryReviewAction[];
  cuts: BreweryReviewAction[];
  moves: BreweryReviewMove[];
  sourceMainCopies: number;
  sourceSideboardCopies: number;
  addCopies: number;
  cutCopies: number;
  projectedCount: string;
  countNote: string;
  caveat: string;
  evidence: Array<{ label: string; url: string }>;
  untested: true;
};

export type BreweryReviewEntry = {
  slug: string;
  title: string;
  helm: DeckGalleryHelm;
  savedFormatLabel: string | null;
  reviewLens: string;
  sourceMainCopies: number;
  sourceSideboardCopies: number;
  sourceGalleryHref: string;
  titleCredit: string | null;
  proposal: BreweryReviewProposal;
  alternateV2?: BreweryReviewProposal;
};

export type BreweryReviewPayload = {
  schemaVersion: number;
  entries: BreweryReviewEntry[];
};

export async function loadDeckBreweryReviews(
  fetcher: typeof fetch = fetch
): Promise<BreweryReviewPayload> {
  const response = await fetcher("/data/deck-brewery-reviews.json", {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(
      `Deck Brewery review data request failed (${response.status}).`
    );
  }
  const payload = (await response.json()) as BreweryReviewPayload;
  if (!payload || !Array.isArray(payload.entries)) {
    throw new Error("Deck Brewery review data is not in the expected format.");
  }
  return payload;
}

export function getReviewActions(
  proposal: BreweryReviewProposal
): BreweryReviewAction[] {
  return [...proposal.adds, ...proposal.cuts];
}

export function getReviewArtName(
  proposal: BreweryReviewProposal
): string | null {
  return (
    proposal.adds[0]?.name ??
    proposal.cuts[0]?.name ??
    proposal.moves[0]?.name ??
    proposal.commander ??
    null
  );
}
