import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (relativePath: string) =>
  readFileSync(resolve(process.cwd(), relativePath), 'utf8');

describe('card alert placement', () => {
  it('shows the spoiler label in the bordered details area below the image', () => {
    const gallery = source('client/src/components/VerifiedSpoilerGallery.tsx');
    const imageLinkEnd = gallery.indexOf('</a>');
    const spoilerLabel = gallery.indexOf(' /> Spoiler');
    expect(imageLinkEnd).toBeGreaterThan(-1);
    expect(spoilerLabel).toBeGreaterThan(imageLinkEnd);
    expect(gallery).toContain('border border-amber-500 bg-amber-500/10');
    expect(gallery).not.toContain('absolute left-2 top-2');
  });

  it('places snapshot-move metadata below the article card preview', () => {
    const articles = source('client/src/pages/EditorialMarketArticles.tsx');
    expect(articles).toContain(
      'border-t border-border bg-background px-3 py-2 text-center'
    );
    expect(articles).not.toContain(
      'absolute bottom-3 left-3 border border-border'
    );
  });

  it('keeps the copy status in normal flow instead of floating over cards', () => {
    const purchases = source('client/src/components/NextBestPurchases.tsx');
    expect(purchases).toContain('role="status" aria-live="polite"');
    expect(purchases).not.toContain('absolute top-4 right-4 z-50');
  });
});
