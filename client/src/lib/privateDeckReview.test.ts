import { describe, expect, it } from 'vitest';
import { buildPrivateDeckReview } from './privateDeckReview';
import type { DeckboxSourceRecord } from './privateDeckBrewery';

const emptySource: DeckboxSourceRecord = {
  id: 'generic-review-test',
  name: 'Generic review test',
  main: [],
  sideboard: [],
  status: 'empty',
};

describe('private deck review template data', () => {
  it('shows source gaps instead of inventing commander, identity, or cards', () => {
    const before = JSON.stringify(emptySource);
    const review = buildPrivateDeckReview(emptySource);
    expect(review.commander).toBeNull();
    expect(review.colorIdentity).toBeNull();
    expect(review.sourceStatus).toBe('No exported main cards');
    expect(review.mainCopies).toBe(0);
    expect(review.sideboardCopies).toBe(0);
    expect(review.landCopies).toBeNull();
    expect(review.themeLabel).toBe('one signature-card package');
    expect(JSON.stringify(emptySource)).toBe(before);
  });

  it('uses explicit commander and color metadata only when the source provides it', () => {
    const source: DeckboxSourceRecord = {
      ...emptySource,
      commander: 'Example Leader',
      colorIdentity: ['B', 'R'],
      mainLandCopies: 12,
    };
    const review = buildPrivateDeckReview(source);
    expect(review.commander).toBe('Example Leader');
    expect(review.colorIdentity).toBe('BR');
    expect(review.landCopies).toBe(12);
  });

  it('does not mutate the source when building a review', () => {
    const source = { ...emptySource, commanders: ['Example Leader'] };
    const before = JSON.stringify(source);
    buildPrivateDeckReview(source);
    expect(JSON.stringify(source)).toBe(before);
  });
});
