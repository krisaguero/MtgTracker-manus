import React from 'react';

export function MarketCardSkeleton() {
  return (
    <div className="flex flex-col border-2 border-border bg-card p-5 shadow-sm">
      {/* Skeleton Header Badge & Title Area */}
      <div className="flex items-center justify-between mb-4">
        <div className="h-5 w-16 market-mover-skeleton" />
        <div className="h-5 w-20 market-mover-skeleton" />
      </div>

      {/* Hero Card Image Skeleton Placeholder */}
      <div className="relative mx-auto w-full max-w-[240px] aspect-[5/7] border-2 border-border bg-muted overflow-hidden">
        <div className="absolute inset-0 market-mover-skeleton" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="font-mono text-xs text-muted-foreground uppercase tracking-widest">Loading Art…</div>
        </div>
      </div>

      {/* Card Info Skeleton */}
      <div className="mt-4 space-y-2">
        <div className="h-4 w-3/4 market-mover-skeleton" />
        <div className="h-3 w-1/2 market-mover-skeleton" />
      </div>

      {/* Price and Button Skeleton */}
      <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
        <div className="space-y-1">
          <div className="h-3 w-10 market-mover-skeleton" />
          <div className="h-5 w-16 market-mover-skeleton" />
        </div>
        <div className="h-8 w-24 market-mover-skeleton" />
      </div>
    </div>
  );
}

export function MarketCardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, idx) => (
        <MarketCardSkeleton key={idx} />
      ))}
    </div>
  );
}
