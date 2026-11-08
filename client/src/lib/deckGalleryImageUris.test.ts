import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import imageData from "@/data/deckGalleryImageUris.json";
import type { CardImageUriMap } from "@/lib/cardImageUris";
import { normalizeCardImageName } from "@/lib/cardImageUris";
import { getDeckGalleryCardImageUri } from "@/lib/deckGalleryImageUris";
import type { DeckGalleryPayload } from "@/lib/deckGallery";

const payload = JSON.parse(
  readFileSync(
    resolve(process.cwd(), "client/public/data/deck-gallery.json"),
    "utf8"
  )
) as DeckGalleryPayload;
const imageUris = imageData.imageUris as CardImageUriMap;

function approvedPublicNames() {
  const names = new Set<string>();
  for (const entry of payload.entries) {
    for (const card of [...entry.main, ...entry.sideboard]) names.add(card.name);
    for (const card of entry.helm.commanders) names.add(card.name);
    if (entry.helm.separateChildGuess)
      names.add(entry.helm.separateChildGuess.name);
  }
  return names;
}

describe("approved public Deck Gallery image map", () => {
  it("contains only names from public source rows and public helm notes", () => {
    const expectedKeys = Array.from(approvedPublicNames(), normalizeCardImageName).sort();
    expect(Object.keys(imageUris).sort()).toEqual(expectedKeys);
  });

  it("resolves every approved public source and helm image directly from the Scryfall CDN", () => {
    for (const name of approvedPublicNames()) {
      const imageUri = getDeckGalleryCardImageUri(name, "normal");
      expect(imageUri, name).toBeTruthy();
      expect(imageUri, name).toMatch(/^https:\/\/cards\.scryfall\.io\//);
    }
  });

  it("uses image data only; it has no Scryfall API lookup URLs", () => {
    for (const images of Object.values(imageUris)) {
      for (const imageUri of Object.values(images)) {
        expect(imageUri).toMatch(/^https:\/\/cards\.scryfall\.io\//);
        expect(imageUri).not.toContain("api.scryfall.com");
      }
    }
  });
});
