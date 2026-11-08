import galleryImageData from "@/data/deckGalleryImageUris.json";
import type { CardImageSize, CardImageUriMap } from "@/lib/cardImageUris";
import { getCardImageUri } from "@/lib/cardImageUris";

const imageUris = galleryImageData.imageUris as CardImageUriMap;

export function getDeckGalleryCardImageUri(
  name: string,
  size: CardImageSize = "normal"
): string | undefined {
  return getCardImageUri(name, imageUris, size);
}

export function hasDeckGalleryCardImage(name: string): boolean {
  return Boolean(getDeckGalleryCardImageUri(name));
}
