import React from 'react';
import { CardImageZoom } from '@/components/CardImageZoom';

function namedCardImage(name: string) {
  return `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}&format=image&version=normal`;
}

export function CommanderCardFrame({
  cardName,
  alt,
  fallbackSrc,
  compact = false,
}: {
  cardName: string;
  alt: string;
  fallbackSrc?: string;
  compact?: boolean;
}) {
  const src = namedCardImage(cardName);
  return <div className={`relative flex shrink-0 items-center justify-center border-2 border-border bg-[#171a24] p-2 shadow-[4px_4px_0_0_rgba(15,23,42,0.18)] ${compact ? 'h-36 w-24' : 'aspect-[63/88] w-full max-w-[220px]'}`}>
    <CardImageZoom
      src={src}
      fallbackSrc={fallbackSrc}
      alt={alt}
      className="h-full w-full object-contain"
    />
  </div>;
}
