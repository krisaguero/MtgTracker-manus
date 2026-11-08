export type DeckGalleryTunedChildCard = {
  name: string;
  quantity: number;
  role: string;
};

export type DeckGalleryTunedChildChange = {
  name: string;
  quantity: number;
  role?: string;
  reason?: string;
  sourceClass?: "public_sideboard" | "new_addition";
};

export type DeckGalleryTunedChild = {
  childSlug: string;
  title: string;
  sourceTitle: string;
  parentHref: string;
  parentGroup: "owner_archive_list" | "robert_title_credit";
  parentSectionsOmitted: boolean;
  visibleSourceCounts: { mainCopies: number; sideboardCopies: number };
  commanders: { name: string; quantity: number; zone: "command zone" }[];
  format: "Commander";
  tuningLevel: string;
  status: string;
  hypothetical: boolean;
  played: false;
  ownershipStatus: string;
  attributionNote: string;
  sourceNote: string;
  edhrecContext: string | Record<string, unknown>;
  plan: {
    commanderPlan: string;
    subthemes: string | { name?: string; role?: string; cards?: string[] }[];
    curveTempo: string;
    interaction: string;
    cardAdvantage: string;
    mana: string;
    closingPlan: string;
    coherence: string;
  };
  roleEstimates: Record<string, number>;
  main: DeckGalleryTunedChildCard[];
  exactChanges: {
    zoneMoves: {
      name: string;
      quantity: number;
      from: string;
      to: string;
      reason: string;
    }[];
    cuts: DeckGalleryTunedChildChange[];
    adds: DeckGalleryTunedChildChange[];
    swaps: {
      cut: { name: string; quantity: number };
      replacement: { name: string; quantity: number; role?: string };
      reason: string;
    }[];
  };
  relatedPublicBuilds: {
    title: string;
    commander: string;
    format: string;
    publicHref: string;
    relation: string;
  }[];
  relatedBuildsNote?: string;
  evidence: { label: string; url: string; usedFor: string }[];
  validation: {
    status: "pass";
    mainCount: number;
    commanderCount: number;
    totalCount: number;
    cardNamesResolved: number;
    scryfallNamesUnresolved: number;
    commanderColorIdentity: string[];
    colorIdentityCheck: string;
    commanderLegalityCheck: string;
    commanderEligibilityCheck: string;
    singletonCheck: string;
    scryfallLandCount: number;
    exactSourceDiffCheck: string;
    checkedAsOf: string;
    references: { label: string; url: string }[];
  };
};

export type DeckGalleryTunedChildrenPayload = {
  schemaVersion: number;
  batchValidationSummary: {
    status: string;
    childrenValidated: number;
    scryfallCardNamesRequested: number;
    scryfallNamesUnresolved: number;
    scryfallApiErrors: number;
    checkedAsOf: string;
    scope: string;
  };
  children: DeckGalleryTunedChild[];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function assertPositiveCount(value: unknown, label: string): asserts value is number {
  if (!Number.isInteger(value) || (value as number) < 1)
    throw new Error(`${label} must be a positive whole number.`);
}

export function validateDeckGalleryTunedChildrenPayload(
  value: unknown
): asserts value is DeckGalleryTunedChildrenPayload {
  if (!isRecord(value) || value.schemaVersion !== 1 || !Array.isArray(value.children))
    throw new Error("Tuned-child data is not in the expected format.");

  const slugs = new Set<string>();
  const children = value.children;
  for (let index = 0; index < children.length; index += 1) {
    const childValue = children[index];
    if (!isRecord(childValue)) throw new Error(`Tuned child ${index + 1} is malformed.`);
    const child = childValue;
    for (const key of ["childSlug", "title", "sourceTitle", "parentHref", "format", "status"]) {
      if (typeof child[key] !== "string" || !child[key])
        throw new Error(`Tuned child ${index + 1} is missing ${key}.`);
    }
    if (slugs.has(child.childSlug as string))
      throw new Error(`Duplicate tuned-child slug: ${child.childSlug}.`);
    slugs.add(child.childSlug as string);
    if (child.format !== "Commander" || child.played !== false || child.hypothetical !== true)
      throw new Error(`Tuned child ${child.childSlug} must remain a hypothetical, unplayed Commander proposal.`);
    if (child.relatedBuildsNote !== undefined && typeof child.relatedBuildsNote !== "string")
      throw new Error(`Tuned child ${child.childSlug} has a malformed tracker-build note.`);
    if (!Array.isArray(child.main) || !Array.isArray(child.commanders))
      throw new Error(`Tuned child ${child.childSlug} is missing its card zones.`);
    let mainCount = 0;
    for (const card of child.main) {
      if (!isRecord(card) || typeof card.name !== "string" || typeof card.role !== "string")
        throw new Error(`Tuned child ${child.childSlug} has a malformed main-card row.`);
      assertPositiveCount(card.quantity, `${child.childSlug} ${card.name} quantity`);
      mainCount += card.quantity;
    }
    let commanderCount = 0;
    for (const card of child.commanders) {
      if (!isRecord(card) || typeof card.name !== "string" || card.zone !== "command zone")
        throw new Error(`Tuned child ${child.childSlug} has a malformed commander row.`);
      assertPositiveCount(card.quantity, `${child.childSlug} ${card.name} commander quantity`);
      commanderCount += card.quantity;
    }
    if (mainCount + commanderCount !== 100)
      throw new Error(`Tuned child ${child.childSlug} does not total 100 cards including its command zone.`);
    if (!isRecord(child.validation) || child.validation.status !== "pass" || child.validation.totalCount !== 100)
      throw new Error(`Tuned child ${child.childSlug} is missing its passing validation record.`);
  }
}

export async function loadDeckGalleryTunedChildren(
  fetcher: typeof fetch = fetch
): Promise<DeckGalleryTunedChildrenPayload> {
  const response = await fetcher("/data/deckbox-tuned-children.json", {
    headers: { Accept: "application/json" },
  });
  if (!response.ok)
    throw new Error(`Tuned-child data request failed (${response.status}).`);
  const payload: unknown = await response.json();
  validateDeckGalleryTunedChildrenPayload(payload);
  return payload;
}
