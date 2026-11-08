import tileImageData from "@/data/deckboxBattleBoxTileImageUris.json";
import type { CardImageUriMap } from "@/lib/cardImageUris";
import { getCardImageUri } from "@/lib/cardImageUris";

const imageUris = tileImageData.imageUris as CardImageUriMap;

export function getDeckboxBattleBoxTileImageUri(name: string): string | undefined {
  return getCardImageUri(name, imageUris, "normal");
}
