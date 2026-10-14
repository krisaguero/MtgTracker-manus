import React from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CardImageZoom, IMAGE_LOAD_TIMEOUT_MS, nextImageSourceState } from './CardImageZoom';

const componentSource = readFileSync(resolve(process.cwd(), 'client/src/components/CardImageZoom.tsx'), 'utf8');

describe('CardImageZoom', () => {
  it('renders secondary artwork lazily with an accessible zoom control', () => {
    const markup = renderToStaticMarkup(
      <CardImageZoom src="https://cards.example.test/card.jpg" fallbackSrc="https://api.example.test/fallback" alt="Example Card" />,
    );

    expect(markup).toContain('aria-label="Zoom image of Example Card"');
    expect(markup).toContain('loading="lazy"');
    expect(markup).toContain('src="https://cards.example.test/card.jpg"');
    expect(markup).toContain('referrerPolicy="no-referrer"');
    expect(markup).toContain('decoding="async"');
  });

  it('supports eager loading for an explicitly prioritized hero image', () => {
    const markup = renderToStaticMarkup(
      <CardImageZoom src="https://cards.example.test/hero.jpg" alt="Hero Card" priority />,
    );

    expect(markup).toContain('loading="eager"');
  });

  it('uses a fallback image when the primary source is empty', () => {
    const markup = renderToStaticMarkup(
      <CardImageZoom src="" fallbackSrc="https://cards.example.test/fallback.jpg" alt="Example Card" />,
    );

    expect(markup).toContain('src="https://cards.example.test/fallback.jpg"');
  });

  it('keeps image timeouts bounded and advances to the next source after a stalled request', () => {
    expect(IMAGE_LOAD_TIMEOUT_MS).toBe(10_000);
    expect(nextImageSourceState(0, 2)).toEqual({ sourceIndex: 1, isLoading: true });
    expect(componentSource).toContain('window.setTimeout(advanceToNextSource, IMAGE_LOAD_TIMEOUT_MS)');
    expect(componentSource).toContain("{ rootMargin: '3000px' }");
  });

  it('stops loading and exposes an accessible placeholder when the final source stalls', () => {
    expect(nextImageSourceState(0, 1)).toEqual({ sourceIndex: 1, isLoading: false });
    const markup = renderToStaticMarkup(
      <CardImageZoom src="" alt="Example Card" />,
    );

    expect(markup).toContain('role="img" aria-label="Example Card"');
    expect(markup).toContain('Example Card');
  });
});
