// Design philosophy: card art is primary evidence; status tags stay outside the image, while zoom is an explicit, non-obscuring mobile action.
import { useEffect, useState } from 'react';
import { Maximize2, X } from 'lucide-react';

export function CardImageZoom({ src, alt, className = '' }: { src?: string; alt: string; className?: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  if (!src) return <div className={`flex items-center justify-center bg-muted p-3 text-center text-xs text-muted-foreground ${className}`}>{alt}</div>;

  return <>
    <button type="button" onClick={() => setOpen(true)} className={`group/image relative block h-full w-full cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset ${className}`} aria-label={`Zoom image of ${alt}`}>
      <img src={src} alt={alt} className="h-full w-full object-contain transition-transform duration-200 group-hover/image:scale-[1.015]" loading="lazy" />
      <span className="pointer-events-none absolute bottom-2 right-2 inline-flex items-center gap-1 border border-white/60 bg-black/70 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white opacity-0 transition-opacity group-hover/image:opacity-100 group-focus-visible/image:opacity-100"><Maximize2 className="h-3 w-3" /> Zoom</span>
    </button>
    {open && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 sm:p-8" role="dialog" aria-modal="true" aria-label={`${alt} enlarged image`} onClick={() => setOpen(false)}>
      <button type="button" onClick={() => setOpen(false)} className="absolute right-4 top-4 border border-white/50 bg-black/70 p-2 text-white transition-colors hover:bg-white hover:text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-white" aria-label="Close enlarged image"><X className="h-5 w-5" /></button>
      <img src={src} alt={alt} className="max-h-[88vh] max-w-[94vw] object-contain" onClick={(event) => event.stopPropagation()} />
    </div>}
  </>;
}
