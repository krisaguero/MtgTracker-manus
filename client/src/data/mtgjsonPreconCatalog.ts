import catalogJson from './mtgjsonPreconCatalog.json';

export interface DiscoveredCommanderDeck {
  name: string;
  code: string;
  setName: string;
  type: string;
  releaseDate: string | null;
  fileName: string;
  sourceUrl: string;
  metadataSourceUrl: string;
  scanTimestamp: string;
  status: 'complete' | 'pending';
  reason?: string;
  upstreamSourceUrl?: string;
  totalCardCopies?: number;
  cardEntryCount?: number;
}

export interface VerifiedSpoilerCard {
  id: string;
  name: string;
  setCode: string;
  setName: string;
  collectorNumber: string;
  rarity: string | null;
  previewedAt: string;
  previewSource: string;
  previewSourceUrl: string;
  scryfallUrl: string;
  imageUrl: string | null;
  priceUsd: number | null;
}

export interface CatalogSetRelease {
  code: string;
  name: string;
  type: string;
  releaseDate: string;
  sourceUrl: string;
  metadataSourceUrl: string;
  scanTimestamp: string;
  commanderDeckCount: number;
  completeDeckCount: number;
  pendingDeckCount: number;
  status: 'complete' | 'pending';
  spoilerCount: number;
  spoilerCards: VerifiedSpoilerCard[];
}

export interface MtgjsonPreconCatalog {
  schemaVersion: number;
  source: string;
  sourceBuildDate: string | null;
  sourceVersion: string | null;
  sourceUrls: { deckList: string; setList: string };
  sources?: {
    deckList?: string;
    setList?: string;
    scryfallCards?: string;
    scryfallSpoilerPolicy?: string;
  };
  scanTimestamp: string;
  statistics: {
    upstreamCommanderDecks: number;
    existingLocalDecks: number;
    newlyDiscoveredCommanderDecks: number;
    completeDecks: number;
    pendingDecks: number;
    recentAndUpcomingSets: number;
  };
  decks: DiscoveredCommanderDeck[];
  setReleases: CatalogSetRelease[];
}

export const mtgjsonPreconCatalog = catalogJson as MtgjsonPreconCatalog;
