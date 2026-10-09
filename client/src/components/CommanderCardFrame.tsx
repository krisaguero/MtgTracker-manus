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
    <span className="pointer-events-none absolute bottom-2 left-2 border border-white/50 bg-black/75 px-1.5 py-0.5 font-mono text-[8px] font-black uppercase tracking-wider text-white">Full card frame</span>
  </div>;
}
