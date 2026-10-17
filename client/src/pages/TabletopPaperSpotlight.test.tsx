import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import TabletopPaperSpotlight, { TabletopPaperSpotlightTeaser } from './TabletopPaperSpotlight';
import spotlight from '@/data/tabletopPaperSpotlight.json';
import appSource from '../App.tsx?raw';

vi.mock('wouter', () => ({ Link: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <a href={href} {...props}>{children}</a> }));
vi.mock('@/components/MarketCardPreview', () => ({ MarketCardPreview: ({ name }: { name: string }) => <span>{name} preview</span> }));

const names = ['Tivit, Seller of Secrets', 'Magister Sphinx', 'Uthros Research Craft', 'Agatha of the Vile Cauldron', 'Astral Dragon', 'The Theorist, Jace Beleren', 'Vronos, Masked Inquisitor'];

describe('Tabletop Paper Company creator spotlight', () => {
  it('preserves all seven requested card identities and links their profiles and rules', () => {
    expect(spotlight.cards.map((card) => card.name)).toEqual(names);
    const html = renderToStaticMarkup(<TabletopPaperSpotlight />);
    for (const card of spotlight.cards) {
      expect(html).toContain(`/card/${encodeURIComponent(card.name)}`);
      expect(html).toContain(card.rulesUrl);
    }
    expect(html).toContain('not Agatha');
    expect(html).not.toMatch(/\+\d+(\.\d+)?%/);
  });

  it('credits the channel and includes direct video links with explicit attribution', () => {
    expect(spotlight.channel.url).toBe('https://www.youtube.com/channel/UCp4WsPnvEiUeTJbJNRlEPzg');
    expect(spotlight.videos.length).toBeGreaterThan(0);
    const html = renderToStaticMarkup(<TabletopPaperSpotlight />);
    for (const video of spotlight.videos) {
      expect(video.url).toMatch(/^https:\/\/www\.youtube\.com\/watch\?v=[\w-]{11}/);
      expect(html).toContain(video.url.replaceAll('&', '&amp;'));
      expect(video.channelName).toBe('Tabletop Paper Company');
    }
    expect(spotlight.cards.every((card) => card.attribution.length > 20)).toBe(true);
    expect(html).not.toContain('awaiting verification');
    expect(html).toContain('not financial advice');
    const externalLinks = Array.from(html.matchAll(/<a [^>]*target="_blank"[^>]*>/g));
    expect(externalLinks.length).toBeGreaterThan(7);
    expect(externalLinks.every(([tag]) => tag.includes('rel="noopener noreferrer"'))).toBe(true);
  });

  it('exposes a real blog route before the generic date route and links the teaser to it', () => {
    const html = renderToStaticMarkup(<TabletopPaperSpotlightTeaser />);
    expect(html).toContain(`href="${spotlight.href}"`);
    expect(appSource.indexOf(`path="${spotlight.href}"`)).toBeLessThan(appSource.indexOf('path="/market-report/:dateKey"'));
    expect(appSource).toContain('component={TabletopPaperSpotlight}');
  });
});
