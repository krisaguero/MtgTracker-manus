// Design philosophy: keep product imagery editorial and shelf-accurate; use boxed product art first and fall back only when no verified product asset exists.

export interface PreconProductAsset {
  imageUrl: string;
  sourceUrl: string;
  sourceLabel: string;
}

const productAssets: Array<{ matches: string[]; asset: PreconProductAsset }> = [
  {
    matches: ['world shaper'],
    asset: {
      imageUrl: '/manus-storage/world-shaper_57fdac11.png',
      sourceUrl: 'https://magic.wizards.com/en/news/announcements/edge-of-eternities-commander-decklists',
      sourceLabel: 'Wizards product/decklist reference',
    },
  },
  {
    matches: ['counter intelligence'],
    asset: {
      imageUrl: '/manus-storage/counter-intelligence_09d89973.jpg',
      sourceUrl: 'https://magic.wizards.com/en/news/announcements/edge-of-eternities-commander-decklists',
      sourceLabel: 'Wizards product/decklist reference',
    },
  },
];

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

export function productAssetFor(name: string): PreconProductAsset | undefined {
  const normalized = normalize(name);
  const match = productAssets.find((entry) => entry.matches.some((term) => normalized.includes(term)));
  return match?.asset;
}
