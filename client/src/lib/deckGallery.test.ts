import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  getDeckGalleryDisplayMeta,
  isDeckGalleryWip,
  type DeckGalleryEntry,
  type DeckGalleryPayload,
} from "./deckGallery";

const payload = JSON.parse(
  readFileSync(
    resolve(process.cwd(), "client/public/data/deck-gallery.json"),
    "utf8"
  )
) as DeckGalleryPayload;

function allKeys(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(allKeys);
  if (!value || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, child]) => [
    key.toLowerCase(),
    ...allKeys(child),
  ]);
}

describe("approved public Deck Gallery payload", () => {
  it("contains the approved 148 archive entries and 18 Robogles title-credit entries", () => {
    expect(payload.schemaVersion).toBe(1);
    expect(payload.entries).toHaveLength(166);
    expect(
      payload.entries.filter(entry => entry.group === "robert_title_credit")
    ).toHaveLength(18);
    expect(
      payload.entries.filter(entry => entry.group !== "robert_title_credit")
    ).toHaveLength(148);
  });

  it("contains no Deckbox record IDs, permission queue, source archive metadata, or collection matches", () => {
    const keys = allKeys(payload);
    for (const forbidden of [
      "deckboxid",
      "sourceid",
      "permissionqueue",
      "withheld",
      "sourcefolder",
      "collectionmatches",
      "ownedcards",
    ]) {
      expect(keys).not.toContain(forbidden);
    }
    const serialized = JSON.stringify(payload).toLowerCase();
    expect(serialized).not.toContain("deckbox.com");
    expect(serialized).not.toContain("private-review-manifest");
    expect(serialized).not.toContain("permission-review.csv");
  });

  it("preserves the exported row quantities and separate main/sideboard totals", () => {
    for (const entry of payload.entries) {
      const mainCopies = entry.main.reduce(
        (sum, card) => sum + card.quantity,
        0
      );
      const sideboardCopies = entry.sideboard.reduce(
        (sum, card) => sum + card.quantity,
        0
      );
      expect(mainCopies, entry.title).toBe(entry.mainCopies);
      expect(sideboardCopies, entry.title).toBe(entry.sideboardCopies);
      expect(entry.main, entry.title).toHaveLength(entry.mainRows);
      expect(entry.sideboard, entry.title).toHaveLength(entry.sideboardRows);
      for (const card of [...entry.main, ...entry.sideboard]) {
        expect(card.name.length).toBeGreaterThan(0);
        expect(Number.isInteger(card.quantity)).toBe(true);
        expect(card.quantity).toBeGreaterThan(0);
      }
    }
  });

  it("displays Vintage-tagged lists over 100 main copies as oversized Commander without changing rows", () => {
    const affected = payload.entries.filter(
      entry =>
        entry.savedFormat?.toLowerCase() === "vintage" && entry.mainCopies > 100
    );
    expect(affected).toHaveLength(20);
    for (const entry of affected) {
      const meta = getDeckGalleryDisplayMeta(entry);
      expect(meta.vintageOversizeOverride, entry.title).toBe(true);
      expect(meta.formatLabel, entry.title).toBe("Commander · oversized");
      expect(meta.contextualTarget, entry.title).toBe(100);
      expect(meta.displayStatus, entry.title).toBe(
        "Over target · candidate pool"
      );
      expect(meta.formatNote, entry.title).toContain(
        "Deckbox saved this as Vintage"
      );
      expect(entry.savedFormat, entry.title).toBe("Vintage");
    }

    const notOversized = payload.entries.find(
      entry => entry.title === "*** “V” The Dire Ramps"
    );
    if (notOversized)
      expect(
        getDeckGalleryDisplayMeta(notOversized).vintageOversizeOverride
      ).toBe(false);
  });

  it("puts over-target and incomplete source lists on the WIP page after the correction", () => {
    expect(payload.entries.filter(isDeckGalleryWip)).toHaveLength(120);
  });

  it("uses the safe public group vocabulary for every source list", () => {
    const allowed = new Set<DeckGalleryEntry["group"]>([
      "owner_archive_list",
      "robert_title_credit",
      "owner_wip_offbeat",
      "owner_wip_empty",
    ]);
    expect(payload.entries.every(entry => allowed.has(entry.group))).toBe(true);
  });
});
