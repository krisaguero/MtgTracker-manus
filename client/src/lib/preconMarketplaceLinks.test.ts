import { describe, expect, it } from 'vitest';
import { preconIsPreorder, preconMarketplaceLinks } from './preconMarketplaceLinks';

describe('preconMarketplaceLinks', () => {
  it('recognizes a future release as preorder mode', () => {
    expect(preconIsPreorder('2099-01-01')).toBe(true);
    expect(preconIsPreorder('2020-01-01')).toBe(false);
  });

  it('provides marketplace searches without pretending to have an affiliate tag', () => {
    const links = preconMarketplaceLinks('Example Commander Deck', '2099-01-01');
    expect(links.map((link) => link.marketplace)).toEqual(['amazon', 'tcgplayer', 'cardkingdom', 'ebay']);
    expect(links.every((link) => link.href.startsWith('https://'))).toBe(true);
    expect(links.find((link) => link.marketplace === 'amazon')?.isAffiliate).toBe(false);
  });
});
