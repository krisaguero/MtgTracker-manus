// Product imagery is intentionally resolved from live Scryfall commander/card art unless a verified, deployed product asset is added here.
// The previous local /manus-storage references were not present in the production bundle and could resolve to the SPA HTML shell.

export interface PreconProductAsset {
  imageUrl: string;
  sourceUrl: string;
  sourceLabel: string;
}

const productAssets: Array<{ matches: string[]; asset: PreconProductAsset }> = [];

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

export function productAssetFor(name: string): PreconProductAsset | undefined {
  const normalized = normalize(name);
  const match = productAssets.find((entry) => entry.matches.some((term) => normalized.includes(term)));
  return match?.asset;
}
