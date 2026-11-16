import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import imageData from "@/data/deckGalleryImageUris.json";
import breweryImageData from "@/data/deckBreweryImageUris.json";
import type { CardImageUriMap } from "@/lib/cardImageUris";
import { normalizeCardImageName } from "@/lib/cardImageUris";
import {
  getDeckGalleryCardImageUri,
  getPublicCardImageSrcSet,
  getPublicCardImageUri,
} from "@/lib/deckGalleryImageUris";
import type { DeckGalleryPayload } from "@/lib/deckGallery";

const payload = JSON.parse(
  readFileSync(
    resolve(process.cwd(), "client/public/data/deck-gallery.json"),
    "utf8"
  )
) as DeckGalleryPayload;
const imageUris = imageData.imageUris as CardImageUriMap;
const breweryImageUris = breweryImageData.imageUris as CardImageUriMap;

const reviewPayload = JSON.parse(
  readFileSync(resolve(process.cwd(), "client/public/data/deck-brewery-reviews.json"), "utf8")
) as { entries: Array<Record<string, any>> };
const showdownData = JSON.parse(
  readFileSync(resolve(process.cwd(), "client/src/data/deckBreweryShowdowns.json"), "utf8")
);

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

function approvedBreweryAndShowdownNames() {
  const names = new Set<string>();
  const addProposal = (proposal: any) => {
    if (!proposal) return;
    if (proposal.commander) names.add(proposal.commander);
    for (const action of [...(proposal.adds || []), ...(proposal.cuts || [])])
      names.add(action.name);
    for (const move of proposal.moves || []) names.add(move.name);
  };
  for (const entry of reviewPayload.entries) {
    for (const commander of entry.helm.commanders || []) names.add(commander.name);
    if (entry.helm.separateChildGuess) names.add(entry.helm.separateChildGuess.name);
    addProposal(entry.proposal);
    addProposal(entry.alternateV2);
  }
  const visit = (value: unknown) => {
    if (Array.isArray(value)) value.forEach(visit);
    else if (value && typeof value === "object") {
      const record = value as Record<string, unknown>;
      if (typeof record.name === "string" && ("role" in record || "where" in record))
        names.add(record.name);
      Object.values(record).forEach(visit);
    }
  };
  visit(showdownData);
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

  it("provides small, normal, and large direct-CDN variants for responsive Gallery art", () => {
    for (const name of approvedPublicNames()) {
      const sourceSet = getPublicCardImageSrcSet(name);
      expect(sourceSet, name).toBeDefined();
      expect(sourceSet, name).toMatch(/^https:\/\/cards\.scryfall\.io\/small\/.+ 146w, https:\/\/cards\.scryfall\.io\/normal\/.+ 488w, https:\/\/cards\.scryfall\.io\/large\/.+ 672w$/);
    }
  });

  it("covers all public Brewery and Showdowns card art with the same direct CDN map", () => {
    const publicNames = approvedBreweryAndShowdownNames();
    const galleryKeys = new Set(Object.keys(imageUris));
    const expectedSupplementKeys = Array.from(publicNames, normalizeCardImageName)
      .filter(key => !galleryKeys.has(key))
      .sort();
    expect(Object.keys(breweryImageUris).sort()).toEqual(expectedSupplementKeys);
    for (const name of publicNames) {
      const imageUri = getPublicCardImageUri(name, "art_crop");
      expect(imageUri, name).toBeTruthy();
      expect(imageUri, name).toMatch(/^https:\/\/cards\.scryfall\.io\//);
      expect(imageUri, name).not.toContain("api.scryfall.com");
    }
  });
});
