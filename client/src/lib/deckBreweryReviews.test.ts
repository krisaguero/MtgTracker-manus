import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import type { BreweryReviewPayload } from "./deckBreweryReviews";
import type { DeckGalleryPayload } from "./deckGallery";

const payload = JSON.parse(
  readFileSync(
    resolve(process.cwd(), "client/public/data/deck-brewery-reviews.json"),
    "utf8"
  )
) as BreweryReviewPayload;
const gallery = JSON.parse(
  readFileSync(
    resolve(process.cwd(), "client/public/data/deck-gallery.json"),
    "utf8"
  )
) as DeckGalleryPayload;

function flattenKeys(value: unknown, keys: string[] = []): string[] {
  if (Array.isArray(value)) {
    value.forEach(item => flattenKeys(item, keys));
  } else if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      keys.push(key);
      flattenKeys(child, keys);
    }
  }
  return keys;
}

function flattenStrings(value: unknown, strings: string[] = []): string[] {
  if (Array.isArray(value)) {
    value.forEach(item => flattenStrings(item, strings));
  } else if (value && typeof value === "object") {
    Object.values(value).forEach(child => flattenStrings(child, strings));
  } else if (typeof value === "string") {
    strings.push(value);
  }
  return strings;
}

const entry = (title: string) =>
  payload.entries.find(candidate => candidate.title === title)!;

describe("public Deck Brewery review catalog", () => {
  it("contains one anonymous page per approved public title and keeps v2 branches separate", () => {
    expect(payload.entries).toHaveLength(166);
    expect(new Set(payload.entries.map(candidate => candidate.slug)).size).toBe(
      166
    );
    expect(
      payload.entries.filter(candidate => candidate.alternateV2)
    ).toHaveLength(3);
    expect(
      payload.entries.every(candidate =>
        candidate.sourceGalleryHref.startsWith("/deck-gallery/")
      )
    ).toBe(true);
    expect(
      payload.entries.every(candidate => candidate.proposal.untested)
    ).toBe(true);
  });

  it("does not include private source, archive, inventory, or source-list data fields", () => {
    const blocked =
      /private|deckbox|archive|inventory|owned|ownership|provenance|sourcecard|source_rows|recordid|proposalid|parentid|folder|filepath/i;
    expect(flattenKeys(payload).filter(key => blocked.test(key))).toEqual([]);
    const values = flattenStrings(payload).join("\n");
    expect(values).not.toMatch(
      /\/home\/|deckbox\.com|private_source|source_provenance|archive_id|owned_cards_checked|ownership_status/i
    );
    expect(
      payload.entries.every(
        candidate => !("main" in candidate) && !("sideboard" in candidate)
      )
    ).toBe(true);
  });

  it("preserves proposal fields while keeping the separate helm interpretation explicit", () => {
    expect(entry("Xenagos Budget EDH").proposal.countNote).toContain(
      "38 copies above target"
    );
    expect(entry("Xenagos Budget EDH").proposal.commander).toBeNull();
    expect(entry("Xenagos Budget EDH").helm.commanders[0].name).toBe(
      "Xenagos, God of Revels"
    );
    expect(entry("Sedris ETBers").proposal.projectedCount).toBe("98/100");
    expect(entry("Sedris ETBers").proposal.countNote).toContain(
      "2 copies short"
    );
    expect(entry("Power Hungry ENHANCED").proposal.status).toBe("reference");
    expect(
      entry("Vampiric Bloodlust - #C17 Precon").proposal.projectedCount
    ).toBe("101/100");
    expect(entry("Daxos's Chants @robogles").proposal.commander).toBeNull();
  });

  it("keeps section and command-zone moves explicit and shows Robogles only as title-level credit", () => {
    const sworn = entry("Black - Sworn To Darkness").proposal;
    expect(sworn.moves).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "Butcher of Malakir",
          quantity: 1,
          from: "sideboard",
          to: "library",
        }),
        expect.objectContaining({
          name: "Swiftfoot Boots",
          quantity: 1,
          from: "sideboard",
          to: "library",
        }),
      ])
    );
    const tazri = entry("Tazri's Allies @robogles");
    expect(tazri.titleCredit).toBe("Robogles title-level credit only");
    expect(tazri.proposal.moves).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "General Tazri",
          from: "main",
          to: "command zone",
          kind: "command-zone",
        }),
      ])
    );
    expect(tazri.proposal.commander).toBeNull();
  });

  it("keeps review helm metadata synchronized with the corresponding Gallery page", () => {
    const galleryById = new Map(
      gallery.entries.map(candidate => [candidate.id, candidate])
    );
    expect(payload.entries).toHaveLength(166);
    for (const review of payload.entries) {
      const id = review.sourceGalleryHref.split("/").at(-1)!;
      expect(review.helm, review.title).toEqual(galleryById.get(id)?.helm);
    }
  });

  it("keeps all three count-focused v2 branches separate and count-caveated", () => {
    const revised = payload.entries.filter(candidate => candidate.alternateV2);
    expect(revised).toHaveLength(3);
    for (const candidate of revised) {
      expect(candidate.alternateV2?.version).toBe(2);
      expect(candidate.alternateV2?.status).toBe("count-balanced");
      expect(candidate.alternateV2?.countNote).toContain(
        "not a legality audit or playtest"
      );
    }
  });
});
