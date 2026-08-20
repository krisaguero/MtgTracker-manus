import { Skeleton } from '@/components/ui/skeleton';

export function DecklistSkeleton() {
  return (
    <div className="min-h-screen bg-background text-foreground animate-pulse">
      {/* Header Skeleton */}
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur-sm z-50">
        <div className="w-full px-4 py-3 sm:px-6 lg:px-8 2xl:px-12 flex items-center justify-between">
          <Skeleton className="h-8 w-32 bg-muted rounded-none" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-28 bg-muted rounded-none" />
            <Skeleton className="h-8 w-28 bg-muted rounded-none" />
          </div>
        </div>
      </header>

      {/* Main Content Skeleton */}
      <main className="w-full px-4 py-8 sm:px-6 lg:px-8 2xl:px-12 space-y-8">
        {/* Hero Banner Skeleton */}
        <div className="border-2 border-border bg-card p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-4 aspect-[3/4] w-full bg-muted border-2 border-border" />
          <div className="lg:col-span-8 space-y-4">
            <Skeleton className="h-6 w-40 bg-muted rounded-none" />
            <Skeleton className="h-10 w-3/4 bg-muted rounded-none" />
            <Skeleton className="h-20 w-full bg-muted rounded-none" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-border">
              <Skeleton className="h-14 w-full bg-muted rounded-none" />
              <Skeleton className="h-14 w-full bg-muted rounded-none" />
              <Skeleton className="h-14 w-full bg-muted rounded-none" />
              <Skeleton className="h-14 w-full bg-muted rounded-none" />
            </div>
          </div>
        </div>

        {/* Filter & Search Bar Skeleton */}
        <div className="border-2 border-border bg-card p-4 flex flex-col sm:flex-row gap-4 justify-between">
          <Skeleton className="h-10 w-full sm:w-96 bg-muted rounded-none" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32 bg-muted rounded-none" />
            <Skeleton className="h-10 w-32 bg-muted rounded-none" />
          </div>
        </div>

        {/* Card Grid Skeletons */}
        <div className="space-y-6">
          <Skeleton className="h-8 w-48 bg-muted rounded-none" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="border-2 border-border bg-card p-2 space-y-2">
                <div className="aspect-[5/7] w-full bg-muted border border-border" />
                <Skeleton className="h-4 w-4/5 bg-muted rounded-none" />
                <Skeleton className="h-3 w-1/2 bg-muted rounded-none" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
