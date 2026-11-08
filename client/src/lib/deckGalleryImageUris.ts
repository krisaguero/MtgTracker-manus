import galleryImageData from "@/data/deckGalleryImageUris.json";
import breweryImageData from "@/data/deckBreweryImageUris.json";
import type { CardImageSize, CardImageUriMap } from "@/lib/cardImageUris";
import { getCardImageUri } from "@/lib/cardImageUris";

const imageUris = {
  ...breweryImageData.imageUris,
  ...galleryImageData.imageUris,
} as CardImageUriMap;

export function getDeckGalleryCardImageUri(
  name: string,
  size: CardImageSize = "normal"
): string | undefined {
  return getCardImageUri(name, imageUris, size);
}

export function hasDeckGalleryCardImage(name: string): boolean {
  return Boolean(getDeckGalleryCardImageUri(name));
}

/** Public Gallery, Brewery, and Showdowns card-art lookup. */
export const getPublicCardImageUri = getDeckGalleryCardImageUri;

/**
 * Scryfall's normal image URL has matching small/large CDN variants. Keep the
 * list direct-CDN-only so the browser selects a phone-sized asset where useful.
 */
export function getPublicCardImageSrcSet(name: string): string | undefined {
  const normal = getPublicCardImageUri(name, "normal");
  if (!normal || !normal.includes("/normal/")) return undefined;
  const small = normal.replace("/normal/", "/small/");
  const large = normal.replace("/normal/", "/large/");
  return `${small} 146w, ${normal} 488w, ${large} 672w`;
}
