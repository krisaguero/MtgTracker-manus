// Card art is primary evidence; status tags stay outside the image, while zoom is an explicit, non-obscuring mobile action.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Maximize2, X } from 'lucide-react';

type ImageFallback = string | string[] | undefined;

export const IMAGE_LOAD_TIMEOUT_MS = 10_000;

export function nextImageSourceState(sourceIndex: number, sourceCount: number) {
  const nextIndex = sourceIndex + 1;
  return nextIndex < sourceCount
    ? { sourceIndex: nextIndex, isLoading: true }
    : { sourceIndex: sourceCount, isLoading: false };
}

export function CardImageZoom({ src, fallbackSrc, alt, className = '', priority = false }: { src?: string; fallbackSrc?: ImageFallback; alt: string; className?: string; priority?: boolean }) {
  const [open, setOpen] = useState(false);
  const normalizedSrc = src?.trim() || undefined;
  const fallbackSources = (Array.isArray(fallbackSrc) ? fallbackSrc : [fallbackSrc])
    .map((source) => source?.trim())
    .filter((source): source is string => Boolean(source));
  const sources = Array.from(new Set([normalizedSrc, ...fallbackSources].filter((source): source is string => Boolean(source))));
  const sourcesKey = sources.join('\u0000');
  const [sourceIndex, setSourceIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(sources.length > 0);
  const [hasEnteredLoadRange, setHasEnteredLoadRange] = useState(priority);
  const imageRef = useRef<HTMLImageElement>(null);
  const resolvedSrc = sources[sourceIndex];

  const advanceToNextSource = useCallback(() => {
    const next = nextImageSourceState(sourceIndex, sources.length);
    setSourceIndex(next.sourceIndex);
    setIsLoading(next.isLoading);
  }, [sourceIndex, sources.length]);

  useEffect(() => {
    setSourceIndex(0);
    setIsLoading(sources.length > 0);
    setHasEnteredLoadRange(priority);
  }, [priority, sourcesKey]);

  useEffect(() => {
    if (priority || hasEnteredLoadRange || !resolvedSrc) return;
    const image = imageRef.current;
    if (!image) return;
    if (typeof IntersectionObserver === 'undefined') {
      setHasEnteredLoadRange(true);
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setHasEnteredLoadRange(true);
        observer.disconnect();
      }
    // Native lazy-loading can defer requests several screens below the fold.
    // Start the failure timer only when the art is actually visible, not while
    // a long deck's offscreen cards are still waiting to be requested.
    }, { rootMargin: '0px' });
    observer.observe(image);
    return () => observer.disconnect();
  }, [hasEnteredLoadRange, priority, resolvedSrc]);

  useEffect(() => {
    if (!resolvedSrc || !isLoading || !hasEnteredLoadRange) return;
    const timeoutId = window.setTimeout(advanceToNextSource, IMAGE_LOAD_TIMEOUT_MS);
    return () => window.clearTimeout(timeoutId);
  }, [advanceToNextSource, hasEnteredLoadRange, isLoading, resolvedSrc]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  if (!resolvedSrc) return <div role="img" aria-label={alt} className={`flex h-full min-h-24 w-full flex-col items-center justify-center border-2 border-dashed border-border bg-muted p-3 text-center text-xs font-semibold text-muted-foreground ${className}`}><span>{alt}</span><span className="mt-2 text-[10px] font-normal">Artwork unavailable · card text remains linked below</span></div>;

  return <>
    <button type="button" onClick={() => setOpen(true)} className={`group/image relative block h-full w-full cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset ${className}`} aria-label={`Zoom image of ${alt}`} aria-busy={isLoading}>
      {isLoading && <span className="absolute inset-0 z-[1] flex items-center justify-center bg-muted/70" aria-label="Loading image"><Loader2 className="h-5 w-5 animate-spin text-primary" /></span>}
      <img ref={imageRef} src={resolvedSrc} alt={alt} className="h-full w-full object-contain transition-transform duration-200 group-hover/image:scale-[1.015]" loading={priority ? 'eager' : 'lazy'} decoding="async" fetchPriority={priority ? 'high' : 'auto'} referrerPolicy="no-referrer" onLoad={() => setIsLoading(false)} onError={advanceToNextSource} />
      <span className="pointer-events-none absolute bottom-2 right-2 inline-flex items-center gap-1 border border-white/60 bg-black/70 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white opacity-0 transition-opacity group-hover/image:opacity-100 group-focus-visible/image:opacity-100"><Maximize2 className="h-3 w-3" /> Zoom</span>
    </button>
    {open && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 sm:p-8" role="dialog" aria-modal="true" aria-label={`${alt} enlarged image`} onClick={() => setOpen(false)}>
      <button type="button" onClick={() => setOpen(false)} className="absolute right-4 top-4 border border-white/50 bg-black/70 p-2 text-white transition-colors hover:bg-white hover:text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-white" aria-label="Close enlarged image"><X className="h-5 w-5" /></button>
      <img src={resolvedSrc} alt={alt} className="max-h-[88vh] max-w-[94vw] object-contain" decoding="async" referrerPolicy="no-referrer" onError={advanceToNextSource} onClick={(event) => event.stopPropagation()} />
    </div>}
  </>;
}
