import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { MarketPostMarkdown, parseMarketCardEmbed } from './MarketPostMarkdown';

vi.mock('./MarketCardPreview', () => ({
  MarketCardPreview: ({ name }: { name: string }) => React.createElement('div', { 'data-testid': 'market-card-preview' }, name),
}));
vi.mock('wouter', () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => React.createElement('a', { href }, children),
}));

describe('MarketPostMarkdown', () => {
  it('renders valid mtg-card JSON fences as cards interleaved with paragraphs and headings', () => {
    const body = [
      'Opening paragraph.',
      '',
      '## Market context',
      '',
      '```mtg-card',
      '{"name":"Delver of Secrets","setCode":"isd","sourceDate":"2026-10-16","kicker":"Verified snapshot"}',
      '```',
      '',
      'Closing paragraph.',
    ].join('\n');
    const markup = renderToStaticMarkup(<MarketPostMarkdown body={body} />);

    expect(markup).toContain('<p>Opening paragraph.</p>');
    expect(markup).toContain('<h2 id="market-context">Market context</h2>');
    expect(markup).toContain('aria-label="Delver of Secrets market card"');
    expect(markup).toContain('Source set: ISD');
    expect(markup).toContain('Source context: 2026-10-16. Historical, not a live quote.');
    expect(markup).toContain('Verified snapshot');
    expect(markup).toContain('<p>Closing paragraph.</p>');
    expect(markup.indexOf('Opening paragraph.')).toBeLessThan(markup.indexOf('Delver of Secrets'));
    expect(markup.indexOf('Delver of Secrets')).toBeLessThan(markup.indexOf('Closing paragraph.'));
  });

  it('keeps invalid or malformed card data as text without throwing', () => {
    expect(parseMarketCardEmbed('{"name":"","setCode":"bad"}')).toBeNull();
    expect(parseMarketCardEmbed('{"name":"A"')).toBeNull();

    const body = ['Before', '', '```mtg-card', '{"name":""}', '```', '', 'After'].join('\n');
    expect(() => renderToStaticMarkup(<MarketPostMarkdown body={body} />)).not.toThrow();
    const markup = renderToStaticMarkup(<MarketPostMarkdown body={body} />);
    expect(markup).toContain('&quot;name&quot;:&quot;&quot;');
    expect(markup).toContain('Before');
    expect(markup).toContain('After');
  });

  it('ignores unsafe URL fields while retaining valid name, set, and date fields', () => {
    const parsed = parseMarketCardEmbed(JSON.stringify({
      name: 'Apostrophe/漢 Card',
      setCode: 'MKM',
      sourceDate: '2025-01-02',
      imageUrl: 'javascript:alert(1)',
      sourceUrl: 'https://evil.example.test/collect',
      url: 'javascript:alert(document.cookie)',
    }));
    expect(parsed).toEqual({ name: 'Apostrophe/漢 Card', setCode: 'MKM', sourceDate: '2025-01-02' });
    expect(parsed).not.toHaveProperty('imageUrl');
    expect(parsed).not.toHaveProperty('sourceUrl');
    expect(parsed).not.toHaveProperty('url');

    const markup = renderToStaticMarkup(
      <MarketPostMarkdown body={'```mtg-card\n' + JSON.stringify({ name: 'Apostrophe/漢 Card', setCode: 'MKM', sourceDate: '2025-01-02', imageUrl: 'javascript:alert(1)' }) + '\n```'} />,
    );
    expect(markup).toContain('Source set: MKM');
    expect(markup).toContain('Source context: 2025-01-02. Historical, not a live quote.');
    expect(markup).not.toContain('javascript:');
    expect(markup).not.toContain('evil.example');
  });
});
