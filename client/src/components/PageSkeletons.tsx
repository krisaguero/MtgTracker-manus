import { Skeleton } from '@/components/ui/skeleton';

function Shimmer({ className = '' }: { className?: string }) {
  return <Skeleton className={`rounded-none bg-muted ${className}`} />;
}

export function CardModuleSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" aria-label="Loading card modules" aria-busy="true">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="border-2 border-border bg-card p-2">
          <Shimmer className="aspect-[5/7] w-full" />
          <Shimmer className="mt-3 h-4 w-4/5" />
          <Shimmer className="mt-2 h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function CollectionWorkspaceSkeleton() {
  return (
    <section className="my-8 space-y-6" aria-label="Loading private collection workspace" aria-busy="true">
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((index) => (
          <div key={index} className="border-2 border-border bg-card p-5">
            <Shimmer className="h-3 w-32" />
            <Shimmer className="mt-4 h-9 w-28" />
            <Shimmer className="mt-3 h-3 w-4/5" />
          </div>
        ))}
      </div>
      <div className="border-2 border-border bg-card p-5">
        <Shimmer className="h-5 w-56" />
        <Shimmer className="mt-3 h-3 w-3/4" />
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[0, 1, 2, 3].map((index) => <Shimmer key={index} className="h-20" />)}
        </div>
      </div>
    </section>
  );
}

export function SetDetailPageSkeleton() {
  return (
    <section className="space-y-6" aria-label="Loading set detail" aria-busy="true">
      <div className="border-2 border-primary/20 bg-card p-5">
        <Shimmer className="h-3 w-40" />
        <Shimmer className="mt-3 h-9 w-3/4" />
        <Shimmer className="mt-3 h-3 w-1/2" />
      </div>
      <div className="border-y border-border py-4">
        <Shimmer className="h-10 w-full" />
        <div className="mt-3 flex gap-2"><Shimmer className="h-7 w-24" /><Shimmer className="h-7 w-28" /><Shimmer className="h-7 w-20" /></div>
      </div>
      <CardModuleSkeleton count={8} />
    </section>
  );
}

export function PreconGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3" aria-label="Loading Commander precons" aria-busy="true">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="border-2 border-border bg-card">
          <Shimmer className="aspect-[16/9] w-full" />
          <div className="space-y-3 p-5"><Shimmer className="h-3 w-40" /><Shimmer className="h-6 w-3/4" /><Shimmer className="h-3 w-full" /><Shimmer className="h-3 w-5/6" /></div>
        </div>
      ))}
    </div>
  );
}

export function MarketCardSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Loading market cards" aria-busy="true">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="border-2 border-border bg-card p-4">
          <div className="flex justify-between gap-3"><Shimmer className="h-4 w-16" /><Shimmer className="h-4 w-20" /></div>
          <Shimmer className="mt-4 h-5 w-4/5" />
          <Shimmer className="mt-4 h-12 w-full" />
          <div className="mt-4 flex justify-between border-t border-border pt-3"><Shimmer className="h-6 w-20" /><Shimmer className="h-4 w-16" /></div>
        </div>
      ))}
    </div>
  );
}
