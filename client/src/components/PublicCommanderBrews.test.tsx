import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Router } from 'wouter';
import { PublicCommanderBrews, publicCommanderBrewDecks } from './PublicCommanderBrews';

function renderGallery() {
  return renderToStaticMarkup(
    <Router ssrPath="/deck-matrix">
      <PublicCommanderBrews />
    </Router>,
  );
}

describe('public Commander Brews discovery', () => {
  it('uses only the seven existing public Brawl Box detail pages', () => {
    const html = renderGallery();
    expect(publicCommanderBrewDecks).toHaveLength(7);
    expect((html.match(/href="\/brawl-box\//g) ?? [])).toHaveLength(7);
    expect(html).toContain('href="/brawl-box/dr-madison-li"');
    expect(html).toContain('href="/brawl-box/araumi-of-the-dead-tide"');
    expect(html).toContain('href="/brawl-box/marchesa-the-black-rose"');
    expect(html).toContain('href="/brawl-box/the-wise-mothman"');
    expect(html).toContain('href="/brawl-box/rakdos-lord-of-riots"');
    expect(html).toContain('href="/brawl-box/karlov-of-the-ghost-council"');
    expect(html).toContain('href="/brawl-box/taigam-sidisis-hand"');
  });

  it('shows deck titles, commander art, color identities, and public format status', () => {
    const html = renderGallery();
    expect(html).toContain('Commander Brews');
    expect(html).toContain('Featured commander art: Dr. Madison Li');
    expect(html).toContain('Dr. Madison Li · Fallout energy &amp; artifacts');
    expect(html).toContain('Jeskai (WUR)');
    expect(html).toContain('Custom 60-card Brawlternative');
    expect(html).toContain('WIP');
    expect(html).toContain('href="/brawl-box"');
  });

  it('does not surface private Commander branches or collection data', () => {
    const html = renderGallery();
    expect(html).not.toContain('Queen Marchesa');
    expect(html).not.toContain('Alesha, Who Smiles at Death');
    expect(html).not.toContain('Deckbox');
    expect(html).not.toContain('Owned');
    expect(html).not.toContain('Private Deck Brewery');
  });
});
