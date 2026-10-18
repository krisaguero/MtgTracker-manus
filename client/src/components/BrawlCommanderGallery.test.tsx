import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Router } from 'wouter';
import { describe, expect, it } from 'vitest';
import { BrawlCommanderGallery } from './BrawlCommanderGallery';
import BrawlBox from '@/pages/BrawlBox';
import { brawlDecks, brawlDeckPath, cardImage } from '@/lib/brawlDecks';

const escaped = (text: string) => renderToStaticMarkup(<>{text}</>);
const gallery = () => renderToStaticMarkup(<Router ssrPath="/brawl-box"><BrawlCommanderGallery decks={brawlDecks} /></Router>);

describe('Brawlternatives commander gallery', () => {
  it('renders exactly one commander image and detail link per shelf entry', () => {
    const html = gallery();
    expect(html.match(/<img\b/g)).toHaveLength(brawlDecks.length);
    expect(html.match(/<li\b/g)).toHaveLength(brawlDecks.length);
    for (const deck of brawlDecks) {
      expect(html.split(`href="${brawlDeckPath(deck.id)}"`).length - 1).toBe(1);
      expect(html).toContain(`id="${deck.id}"`);
      expect(html).toContain(`alt="${escaped(deck.commander)}"`);
      expect(html).toContain(`src="${escaped(cardImage(deck.commander)!)}"`);
    }
    expect(html).not.toContain('Enlarge');
    expect(html).not.toContain('<button');
  });

  it('uses one column at all breakpoints and bounds the card width', () => {
    const html = gallery();
    const list = html.match(/<ul[^>]*>/)?.[0] ?? '';
    expect(list).toContain('grid-cols-1');
    expect(list).toContain('max-w-80');
    expect(list).not.toMatch(/(?:sm|md|lg|xl):grid-cols/);
    expect(html).toContain('width="488" height="680" loading="lazy"');
    expect(html).toContain('focus-visible:outline');
  });

  it('labels every WIP without hiding it or showing a full decklist', () => {
    const html = gallery();
    const drafts = brawlDecks.filter(deck => deck.publicationStatus === 'work-in-progress');
    expect(html.match(/>WIP<\/span>/g)).toHaveLength(drafts.length);
    for (const deck of drafts) expect(html).toContain(`aria-label="Explore ${escaped(deck.commander)} · work in progress"`);
    expect(html).not.toMatch(/Source-list audit:|Readable decklist|Visual spoiler|Original · source/);
  });

  it('keeps author and image attribution on the index, without expanded deck content', () => {
    const html = renderToStaticMarkup(<Router ssrPath="/brawl-box"><BrawlBox /></Router>);
    expect(html).toContain('Kris Aguero');
    expect(html).toContain('Card imagery © Wizards of the Coast');
    expect(html).toContain('Scryfall');
    expect(html).toContain('Separate from Retro Battle Box');
    expect(html).toContain('href="/battle-box"');
    expect(html.match(/<img\b/g)).toHaveLength(brawlDecks.length);
    expect(html).not.toContain('<article');
    expect(html).not.toContain('strategy packages');
    expect(html).not.toMatch(/Owned:|\[PROXY\]/);
  });
});
