import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CardImageZoom } from './CardImageZoom';

describe('CardImageZoom', () => {
  it('renders secondary artwork lazily with an accessible zoom control', () => {
    const markup = renderToStaticMarkup(
      <CardImageZoom src="https://cards.example.test/card.jpg" fallbackSrc="https://api.example.test/fallback" alt="Example Card" />,
    );

    expect(markup).toContain('aria-label="Zoom image of Example Card"');
    expect(markup).toContain('loading="lazy"');
    expect(markup).toContain('src="https://cards.example.test/card.jpg"');
    expect(markup).toContain('referrerPolicy="no-referrer"');
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
});
