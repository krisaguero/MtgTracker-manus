export type CardImageSize = "normal" | "art_crop";
export type CardImageUriRecord = Partial<Record<CardImageSize, string>>;
export type CardImageUriMap = Record<string, CardImageUriRecord>;

export function normalizeCardImageName(name: string): string {
  return name
    .normalize("NFKC")
    .replace(/[’‘]/g, "'")
    .replace(/[–—]/g, "-")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase();
}

export function getCardImageUri(
  name: string,
  imageUris: CardImageUriMap,
  size: CardImageSize = "normal"
): string | undefined {
  const images = imageUris[normalizeCardImageName(name)];
  return images?.[size] ?? images?.normal ?? images?.art_crop;
}
