import React from 'react';
import { CardImageZoom } from '@/components/CardImageZoom';

function namedCardImage(name: string, cardId?: string) {
  if (cardId) return `https://api.scryfall.com/cards/${encodeURIComponent(cardId)}?format=image&version=normal`;
  return `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}&format=image&version=normal`;
}

export function CommanderCardFrame({
  cardName,
  cardId,
  alt,
  fallbackSrc,
  compact = false,
  fullWidth = false,
  foil = false,
}: {
  cardName: string;
  cardId?: string;
  alt: string;
  fallbackSrc?: string | string[];
  compact?: boolean;
  fullWidth?: boolean;
  foil?: boolean;
}) {
  const src = namedCardImage(cardName, cardId);
  return <div className={`relative flex shrink-0 items-center justify-center ${fullWidth ? 'h-full w-full' : 'border-2 border-border bg-[#171a24] p-2 shadow-[4px_4px_0_0_rgba(15,23,42,0.18)]'} ${compact ? 'h-36 w-24' : fullWidth ? '' : 'aspect-[63/88] w-full max-w-[220px]'}`}>
    <CardImageZoom
      src={src}
      fallbackSrc={fallbackSrc}
      alt={alt}
      className="h-full w-full object-contain"
    />
    {foil && <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_20%,rgba(255,255,255,0.04)_35%,rgba(255,255,255,0.42)_48%,rgba(196,181,253,0.18)_56%,transparent_72%)] mix-blend-screen opacity-80 transition-opacity duration-300 group-hover:opacity-100" />}
  </div>;
}
