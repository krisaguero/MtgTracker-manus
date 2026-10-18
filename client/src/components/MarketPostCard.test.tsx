import React from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { MarketBuyActions, MarketPostCard, marketCardLinks } from './MarketPostCard';

vi.mock('./MarketCardPreview', () => ({
  MarketCardPreview: ({ name }: { name: string }) => React.createElement('div', { 'data-testid': 'market-card-preview' }, name),
}));
vi.mock('wouter', () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => React.createElement('a', { href }, children),
}));

const previewSource = readFileSync(resolve(process.cwd(), 'client/src/components/MarketCardPreview.tsx'), 'utf8');
const cardCss = readFileSync(resolve(process.cwd(), 'client/src/components/market-post-card.css'), 'utf8');
const cardDetailSource = readFileSync(resolve(process.cwd(), 'client/src/pages/CardDetail.tsx'), 'utf8');

const unusualName = "Mishra's // Workshop/Æther 漢";

describe('MarketPostCard SSR contract', () => {
  it('URI-encodes apostrophe/slash/unicode card names in profile, history, printings, and retailer search links', () => {
    const encoded = encodeURIComponent(unusualName);
    const links = marketCardLinks(unusualName);

    expect(links.profile).toBe(`/card/${encoded}`);
    expect(links.history).toBe(`/card/${encoded}#market-history`);
    expect(links.printings).toBe(`/card/${encoded}#printings`);
    expect(links.tcgplayer).toBe(`https://www.tcgplayer.com/search/magic/product?productLineName=magic&q=${encoded}`);
    expect(links.cardkingdom).toBe(`https://www.cardkingdom.com/catalog/search?search=header&filter%5Bname%5D=${encoded}`);
    expect(links.profile).toContain('%2F');
    expect(links.profile).toContain('%C3%86');

    const markup = renderToStaticMarkup(<MarketPostCard name={unusualName} sourceDate="2026-10-16" setCode="abc" />);
    const ssrEncoded = encoded.replaceAll("'", '&#x27;');
    expect(markup).toContain(`href="/card/${ssrEncoded}"`);
    expect(markup).toContain(`href="/card/${ssrEncoded}#market-history"`);
    expect(markup).toContain(`href="/card/${ssrEncoded}#printings"`);
    expect(markup).toContain(`q=${ssrEncoded}`);
    expect(markup).toContain(`filter%5Bname%5D=${ssrEncoded}`);
  });

  it('renders two prominent Buy Online CTAs as search links, never a cart/order flow', () => {
    const markup = renderToStaticMarkup(<MarketBuyActions name="Rhystic Study" />);
    expect(markup.match(/class="market-post-buy-button"/g)).toHaveLength(2);
    expect(markup).toContain('Buy on TCGplayer');
    expect(markup).toContain('Buy on Card Kingdom');
    expect(markup).toContain('productLineName=magic&amp;q=Rhystic%20Study');
    expect(markup).toContain('filter%5Bname%5D=Rhystic%20Study');
    expect(markup).toContain('Opens a card-name search, not a cart or order');
    expect(markup).not.toContain('/cart');
    expect(markup).not.toContain('/checkout');
    expect(markup).not.toContain('place-order');
  });

  it('shows stale-date/no-live-quote caveats and preserves optional evidence children', () => {
    const markup = renderToStaticMarkup(
      <MarketPostCard name="Sol Ring" sourceDate="2026-10-16" setCode="cmm">
        <p data-testid="evidence">Evidence: archived source snapshot</p>
      </MarketPostCard>,
    );
    expect(markup).toContain('Source set: CMM');
    expect(markup).toContain('Source context: 2026-10-16. Historical, not a live quote.');
    expect(markup).toContain('Evidence: archived source snapshot');

    const noDate = renderToStaticMarkup(<MarketPostCard name="Sol Ring" />);
    expect(noDate).toContain('Research reference only. No live price or movement is claimed.');
  });

  it('keeps the full mobile card aspect ratio uncropped and integrates CardImageZoom', () => {
    expect(previewSource).toContain("const dimensions = size === 'full' ? 'aspect-[488/680] w-full'");
    expect(previewSource).toContain("size === 'full' ? <CardImageZoom src={imageUrl} alt={`${name} full card`} />");
    expect(cardCss).toContain('aspect-ratio: 488/680');
    expect(cardCss).toContain('object-fit: contain !important');
  });

  it('keeps CardDetail anchors available for history and alternate printings navigation', () => {
    expect(cardDetailSource).toContain('id="market-history"');
    expect(cardDetailSource).toContain('id="printings"');
  });
});
