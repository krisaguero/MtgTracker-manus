// Design philosophy: hard-edged MTG editorial interface with indigo wayfinding and compact catalog cards.
import React, { useState } from 'react';
import { Link } from 'wouter';
import { PreconDeck } from '@/hooks/useSetDetail';
import { slugify } from '@/hooks/useCommanderDeck';

interface PreconSectionProps {
  precons: PreconDeck[];
  setCode: string;
}

export function PreconSection({ precons, setCode: _setCode }: PreconSectionProps) {
  if (precons.length === 0) return null;

  const colorNames: Record<string, string> = { W: 'White', U: 'Blue', B: 'Black', R: 'Red', G: 'Green' };
  const colorClasses: Record<string, string> = {
    W: 'bg-yellow-100 text-yellow-900 border-yellow-300',
    U: 'bg-blue-100 text-blue-900 border-blue-300',
    B: 'bg-gray-800 text-white border-gray-700',
    R: 'bg-red-100 text-red-900 border-red-300',
    G: 'bg-green-100 text-green-900 border-green-300',
  };

  return (
    <section className="mb-12 border-t border-border pt-8">
      <h2 className="mb-6 text-2xl font-bold">Commander Precons</h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {precons.map((precon) => (
          <PreconCard key={precon.id} precon={precon} colorClasses={colorClasses} colorNames={colorNames} />
        ))}
      </div>
    </section>
  );
}

function PreconCard({
  precon,
  colorClasses,
  colorNames,
}: {
  precon: PreconDeck;
  colorClasses: Record<string, string>;
  colorNames: Record<string, string>;
}) {
  const productImage = precon.productImageUrl || precon.image_uris?.normal;
  const fallbackImage = precon.productImageUrl ? precon.image_uris?.normal : undefined;
  const [imageUrl, setImageUrl] = useState(productImage);
  const [imageLoading, setImageLoading] = useState(Boolean(productImage));

  const cardMarkup = (
    <>
      <div className="relative flex h-48 w-full items-center justify-center overflow-hidden bg-muted/40 p-4" title={precon.productImageSourceLabel || 'Commander product or commander artwork'}>
        {imageLoading && <div className="absolute inset-4 animate-pulse bg-muted-foreground/10" aria-hidden="true" />}
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={`${precon.name} product or commander artwork`}
            className="relative h-full w-full object-contain"
            loading="lazy"
            onLoad={() => setImageLoading(false)}
            onError={() => {
              if (fallbackImage && imageUrl !== fallbackImage) {
                setImageUrl(fallbackImage);
                setImageLoading(true);
              } else {
                setImageUrl(undefined);
                setImageLoading(false);
              }
            }}
          />
        ) : (
          <span className="px-4 text-center text-sm text-muted-foreground">{precon.name}</span>
        )}
      </div>
      <div className="p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="line-clamp-2 font-semibold text-foreground">{precon.name}</h3>
          {precon.approxValue && (
            <span className="shrink-0 border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary" title="Summed from live individual card market prices">
              ~${precon.approxValue} USD est.
            </span>
          )}
        </div>
        {precon.colors.length > 0 && (
          <div className="mb-3 flex gap-2">
            {precon.colors.map((color) => (
              <div key={color} className={`flex h-8 w-8 items-center justify-center border-2 text-sm font-bold ${colorClasses[color] || 'border-gray-300 bg-gray-200 text-gray-900'}`} title={colorNames[color] || color}>
                {color}
              </div>
            ))}
          </div>
        )}
        {precon.synopsis && <p className="mb-3 line-clamp-3 text-xs leading-relaxed text-muted-foreground">{precon.synopsis}</p>}
        <p className="text-xs text-muted-foreground">{precon.card_count} cards in the Commander product</p>
      </div>
      <div className="border-t border-border bg-primary/5 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-primary">
        {precon.hasDecklist ? 'View full 100-card decklist →' : 'Browse complete product catalog →'}
      </div>
    </>
  );

  if (precon.hasDecklist) {
    return (
      <Link href={`/deck/${precon.set_code.toLowerCase()}/${slugify(precon.name)}`} className="group block overflow-hidden border-2 border-border transition-shadow hover:border-primary hover:shadow-lg">
        {cardMarkup}
      </Link>
    );
  }

  return (
    <Link href={`/precon/${precon.set_code.toLowerCase()}/${slugify(precon.name)}`} className="group block overflow-hidden border-2 border-border transition-shadow hover:border-primary hover:shadow-lg">
      {cardMarkup}
    </Link>
  );
}
