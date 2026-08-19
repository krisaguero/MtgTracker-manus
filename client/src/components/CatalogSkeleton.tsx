/* Design reminder: hard-edge collector catalog; use indigo markers, square silhouettes, and card-led hierarchy instead of generic centered spinners. */
type CatalogSkeletonProps = {
  label: string;
  kind: 'timeline' | 'detail' | 'catalog';
};

function Shimmer({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-muted ${className}`} aria-hidden="true" />;
}

export function CatalogSkeleton({ label, kind }: CatalogSkeletonProps) {
  if (kind === 'timeline') {
    return <section className="relative space-y-8 border-l-2 border-primary/20 pl-5 sm:space-y-10 sm:pl-7" aria-label={label} aria-busy="true"><p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Building the release chronology</p>{[0, 1, 2].map((item) => <div key={item} className="relative grid gap-4 sm:grid-cols-[120px_minmax(0,1fr)] sm:gap-6"><span className="absolute -left-[27px] top-4 h-3 w-3 bg-primary sm:-left-[35px]" /><div><Shimmer className="h-3 w-20" /><Shimmer className="mt-3 h-4 w-24" /><Shimmer className="mt-2 h-3 w-16" /></div><div className="border border-border bg-card p-4"><div className="flex items-start gap-3"><Shimmer className="h-12 w-12 shrink-0" /><div className="min-w-0 flex-1"><Shimmer className="h-5 w-3/4" /><Shimmer className="mt-3 h-3 w-1/2" /></div></div><div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3"><Shimmer className="h-16" /><Shimmer className="h-16" /><Shimmer className="hidden h-16 sm:block" /></div></div></div>)}</section>;
  }

  if (kind === 'detail') {
    return <section className="space-y-6" aria-label={label} aria-busy="true"><div className="border-2 border-primary/20 bg-card p-4"><div className="flex items-center gap-3"><Shimmer className="h-10 w-10 shrink-0" /><div className="flex-1"><Shimmer className="h-3 w-32" /><Shimmer className="mt-3 h-7 w-3/4" /><Shimmer className="mt-2 h-3 w-1/2" /></div></div></div><div className="border-y border-border py-4"><Shimmer className="h-10 w-full" /><div className="mt-3 flex gap-2"><Shimmer className="h-7 w-20" /><Shimmer className="h-7 w-24" /><Shimmer className="h-7 w-16" /></div></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-4"><Shimmer className="aspect-[5/7]" /><Shimmer className="aspect-[5/7]" /><Shimmer className="aspect-[5/7]" /><Shimmer className="aspect-[5/7]" /></div></section>;
  }

  return <section className="space-y-6" aria-label={label} aria-busy="true"><div className="border-2 border-primary/20 bg-card p-4"><div className="flex items-center gap-3"><Shimmer className="h-10 w-10 shrink-0" /><div className="flex-1"><Shimmer className="h-3 w-36" /><Shimmer className="mt-3 h-6 w-3/4" /><Shimmer className="mt-2 h-3 w-1/2" /></div></div></div><div className="border-y border-border py-4"><Shimmer className="h-10 w-full" /><div className="mt-3 flex gap-2"><Shimmer className="h-7 w-16" /><Shimmer className="h-7 w-20" /><Shimmer className="h-7 w-24" /></div></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-4"><Shimmer className="aspect-[5/7]" /><Shimmer className="aspect-[5/7]" /><Shimmer className="aspect-[5/7]" /><Shimmer className="aspect-[5/7]" /></div></section>;
}
