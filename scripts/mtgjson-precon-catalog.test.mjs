import { describe, expect, it } from 'vitest';
import {
  buildMtgjsonPreconCatalog,
  missingCommanderDeckMetadata,
  normalizeVerifiedSpoilerCard,
  parseCommanderDecksSource,
  validateAndNormalizeCommanderDeck,
} from './mtgjson-precon-catalog.mjs';

const scanTimestamp = '2026-10-15T16:00:00.000Z';
const deckMeta = {
  code: 'TDC',
  name: 'Test Commander Deck',
  type: 'Commander Deck',
  releaseDate: '2026-11-13',
  fileName: 'TestCommanderDeck_TDC',
};

function card(name, count, collectorNumber) {
  return {
    name,
    count,
    setCode: 'TDC',
    number: String(collectorNumber),
    uuid: `uuid-${collectorNumber}`,
    identifiers: { scryfallId: `scryfall-${collectorNumber}` },
  };
}

function completeDeck() {
  return {
    data: {
      code: 'TDC',
      name: deckMeta.name,
      type: 'Commander Deck',
      releaseDate: deckMeta.releaseDate,
      commander: [card('Test Commander', 1, 1)],
      mainBoard: [card('Test Main Card', 99, 2)],
      sideBoard: [],
      sealedProductUuids: ['product-uuid'],
    },
  };
}

function previewCard(overrides = {}) {
  return {
    id: 'scryfall-preview-id',
    name: 'Verified Preview',
    set: 'tdc',
    collector_number: '12',
    rarity: 'mythic',
    scryfall_uri: 'https://scryfall.com/card/tdc/12/verified-preview',
    image_uris: { art_crop: 'https://cards.scryfall.io/art/tdc/12.webp', normal: 'https://cards.scryfall.io/normal/tdc/12.jpg' },
    prices: { usd: '3.25' },
    preview: {
      previewed_at: '2026-10-14',
      source: 'Official Preview Partner',
      source_uri: 'https://example.com/official-preview',
    },
    ...overrides,
  };
}

describe('MTGJSON precon catalog validation', () => {
  it('parses the embedded local archive and finds only missing Commander Deck entries', () => {
    const existing = parseCommanderDecksSource('export const commanderDecklistsData: RawCommanderDeck[] = [{"name":"Known","set_code":"tdc"}];\n');
    const deckList = { data: [
      { ...deckMeta, name: 'Known' },
      deckMeta,
      { ...deckMeta, fileName: 'ProductBooster', type: 'Booster Box' },
    ] };
    expect(missingCommanderDeckMetadata(deckList, existing)).toEqual([deckMeta]);
  });

  it('imports an exact 100-card record with quantities and printing identifiers', () => {
    const result = validateAndNormalizeCommanderDeck(deckMeta, completeDeck(), { scanTimestamp, setName: 'Test Commander' });
    expect(result.status).toBe('complete');
    expect(result.totalCardCopies).toBe(100);
    expect(result.deckRecord.name).toBe(deckMeta.name);
    expect(result.deckRecord.set_name).toBe('Test Commander');
    expect(result.deckRecord.commander[0]).toMatchObject({ name: 'Test Commander', count: 1, uuid: 'uuid-1', scryfall_id: 'scryfall-1' });
    expect(result.deckRecord.cards[0].count).toBe(99);
    expect(result.deckRecord.source_url).toContain('/decks/TestCommanderDeck_TDC.json');
  });

  it('keeps absent, partial, wrong-product, and incomplete-quantity records pending', () => {
    expect(validateAndNormalizeCommanderDeck(deckMeta, null).status).toBe('pending');
    const ninetyNine = completeDeck();
    ninetyNine.data.mainBoard[0].count = 98;
    expect(validateAndNormalizeCommanderDeck(deckMeta, ninetyNine).reason).toContain('exactly 100');
    const wrongName = completeDeck();
    wrongName.data.name = 'Another Product';
    expect(validateAndNormalizeCommanderDeck(deckMeta, wrongName).reason).toContain('product name');
    const missingSideboard = completeDeck();
    delete missingSideboard.data.sideBoard;
    expect(validateAndNormalizeCommanderDeck(deckMeta, missingSideboard).reason).toContain('sideboard field');
  });

  it('labels a card only when future-set status and all three Scryfall preview credits are valid', () => {
    const release = { code: 'TDC', name: 'Star Trek Commander', releaseDate: '2026-11-13' };
    const valid = normalizeVerifiedSpoilerCard(previewCard(), release, scanTimestamp);
    expect(valid).toMatchObject({
      name: 'Verified Preview',
      previewedAt: '2026-10-14',
      previewSource: 'Official Preview Partner',
      previewSourceUrl: 'https://example.com/official-preview',
      imageUrl: 'https://cards.scryfall.io/normal/tdc/12.jpg',
      priceUsd: 3.25,
    });
    expect(normalizeVerifiedSpoilerCard(previewCard({ preview: { previewed_at: '2026-10-14', source: 'Partner' } }), release, scanTimestamp)).toBeNull();
    expect(normalizeVerifiedSpoilerCard(previewCard({ set: 'abc' }), release, scanTimestamp)).toBeNull();
    expect(normalizeVerifiedSpoilerCard(previewCard({ preview: { previewed_at: '2026-10-16', source: 'Partner', source_uri: 'https://example.com' } }), release, scanTimestamp)).toBeNull();
    expect(normalizeVerifiedSpoilerCard(previewCard(), { ...release, releaseDate: '2026-10-14' }, scanTimestamp)).toBeNull();
  });

  it('keeps current and future set releases separate, with attributed spoiler cards only on upcoming sets', () => {
    const setList = { data: [
      { code: 'TDC', name: 'Star Trek Commander', type: 'commander', releaseDate: '2026-11-13' },
      { code: 'OLD', name: 'Old Set', type: 'expansion', releaseDate: '2026-10-01' },
    ] };
    const deckList = { meta: { date: '2026-10-15' }, data: [deckMeta] };
    const result = buildMtgjsonPreconCatalog({
      deckList,
      setList,
      existingDecks: [],
      deckFilesByFileName: { [deckMeta.fileName]: completeDeck() },
      spoilerCardsBySetCode: { tdc: [previewCard(), previewCard({ id: 'uncredited', preview: null })] },
      scanTimestamp,
      lookbackDays: 180,
      futureDays: 365,
    });
    expect(result.statistics).toMatchObject({ newlyDiscoveredCommanderDecks: 1, completeDecks: 1, pendingDecks: 0, recentAndUpcomingSets: 2 });
    expect(result.decks[0].status).toBe('complete');
    expect(result.setReleases[0]).toMatchObject({ code: 'TDC', spoilerCount: 1, completeDeckCount: 1, status: 'complete' });
    expect(result.setReleases[0].spoilerCards).toHaveLength(1);
  });
});
