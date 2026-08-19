/* Design reminder: hard-edged collector workspace; keep import and valuation tools focused, compact, and secondary to the recent-set homepage. */
import { useState } from 'react';
import { ArrowLeft, Archive, Layers3 } from 'lucide-react';
import { Link } from 'wouter';
import { CollectionOverview } from '@/components/CollectionOverview';
import { ManaBoxImportModal } from '@/components/ManaBoxImportModal';

export default function Collection() {
  const [isManaBoxOpen, setIsManaBoxOpen] = useState(false);
  const [collectionVersion, setCollectionVersion] = useState(0);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="container flex min-h-12 items-center justify-between gap-4 py-2">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to recent sets
          </Link>
          <nav className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em]" aria-label="Collection workspace navigation">
            <Link href="/collection" className="border border-primary bg-primary px-3 py-2 text-primary-foreground">Collection</Link>
            <Link href="/commander" className="border border-border bg-card px-3 py-2 text-muted-foreground transition-colors hover:border-primary hover:text-primary">Commander archive</Link>
          </nav>
        </div>
      </header>

      <main className="container py-6 sm:py-10">
        <section className="border-l-4 border-primary pl-4 sm:pl-5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-primary">
            <Archive className="h-4 w-4" /> Private workspace
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em] sm:text-5xl">Your collection, kept off the shelf.</h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">Import a ManaBox export to compare owned cards against Commander decks, track private valuation snapshots, and build missing-card shopping lists without putting collection data on the homepage.</p>
        </section>

        <div className="mt-6 flex flex-wrap gap-2 border-y border-border py-3 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
          <span className="inline-flex items-center gap-2 border border-border bg-card px-3 py-2"><Layers3 className="h-4 w-4 text-primary" /> Local-only collection data</span>
          <button type="button" onClick={() => setIsManaBoxOpen(true)} className="border border-primary bg-primary px-3 py-2 text-primary-foreground transition-colors hover:bg-primary/90">Import ManaBox</button>
          <Link href="/commander" className="border border-border bg-card px-3 py-2 transition-colors hover:border-primary hover:text-primary">Browse Commander archive</Link>
        </div>

        <CollectionOverview
          onOpenImportModal={() => setIsManaBoxOpen(true)}
          refreshKey={collectionVersion}
        />

        <ManaBoxImportModal
          isOpen={isManaBoxOpen}
          onClose={() => setIsManaBoxOpen(false)}
          onCollectionUpdated={() => setCollectionVersion((value) => value + 1)}
        />
      </main>

      <footer className="border-t border-border bg-muted/30 py-8">
        <div className="container text-center text-sm text-muted-foreground">
          <p>Collection data stays in this browser. Set discovery is available from the <Link href="/" className="font-semibold text-primary hover:underline">recent sets timeline</Link>.</p>
        </div>
      </footer>
    </div>
  );
}
