import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CardImageZoom } from './CardImageZoom';

describe('CardImageZoom', () => {
  it('renders primary artwork eagerly with an accessible zoom control', () => {
    const markup = renderToStaticMarkup(
      <CardImageZoom src="https://cards.example.test/card.jpg" fallbackSrc="https://api.example.test/fallback" alt="Example Card" />,
    );

    expect(markup).toContain('aria-label="Zoom image of Example Card"');
    expect(markup).toContain('loading="eager"');
    expect(markup).toContain('src="https://cards.example.test/card.jpg"');
    expect(markup).toContain('referrerPolicy="no-referrer"');
  });

  it('uses a fallback image when the primary source is empty', () => {
    const markup = renderToStaticMarkup(
      <CardImageZoom src="" fallbackSrc="https://cards.example.test/fallback.jpg" alt="Example Card" />,
    );

    expect(markup).toContain('src="https://cards.example.test/fallback.jpg"');
  });
});
