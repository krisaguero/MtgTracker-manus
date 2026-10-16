import { useEffect, useState } from 'react';
import { ArrowLeft, Archive, Layers3 } from 'lucide-react';
import { Link } from 'wouter';
import { CollectionOverview } from '@/components/CollectionOverview';
import { CommanderPassport } from '@/components/CommanderPassport';
import { ManaBoxImportModal } from '@/components/ManaBoxImportModal';
import { NextBestPurchases } from '@/components/NextBestPurchases';
import { CollectionWorkspaceSkeleton } from '@/components/PageSkeletons';
import { LocalDataControls } from '@/components/LocalDataControls';
import { CollectionPlanner } from '@/components/CollectionPlanner';
import { loadOwnedCollection } from '@/lib/manaboxParser';
import { useAuth } from '@/_core/hooks/useAuth';
import { startLogin } from '@/const';

export default function Collection() {
  const { user, loading: authLoading, logout } = useAuth();
  const [isManaBoxOpen, setIsManaBoxOpen] = useState(false);
  const [collectionVersion, setCollectionVersion] = useState(0);
  const [isHydrating, setIsHydrating] = useState(true);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setIsHydrating(false));
    return () => window.cancelAnimationFrame(frame);
  }, []);


  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="container flex min-h-12 items-center justify-between gap-4 py-2">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to recent sets
          </Link>
          <nav className="flex flex-wrap items-center justify-end gap-2 text-xs font-bold uppercase tracking-[0.14em]" aria-label="Collection workspace navigation">
            <Link href="/collection" className="border border-primary bg-primary px-3 py-2 text-primary-foreground">Collection</Link>
            <Link href="/commander" className="border border-border bg-card px-3 py-2 text-muted-foreground transition-colors hover:border-primary hover:text-primary">Commander archive</Link>
            {user ? (
              <button type="button" onClick={() => void logout()} className="border border-border bg-card px-3 py-2 text-muted-foreground transition-colors hover:border-destructive hover:text-destructive" title={user.email || user.name || 'Signed-in account'}>
                {user.name || user.email || 'Account'} · Sign out
              </button>
            ) : (
              <button type="button" disabled={authLoading} onClick={() => startLogin()} className="border border-primary bg-primary px-3 py-2 text-primary-foreground transition-colors hover:opacity-90">
                {authLoading ? 'Checking account…' : 'Sign in'}
              </button>
            )}
          </nav>
        </div>
      </header>

      <main className="container py-6 sm:py-10">
        <section className="border-l-4 border-primary pl-4 sm:pl-5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-primary">
            <Archive className="h-4 w-4" /> Private workspace
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em] sm:text-5xl">Your collection, kept off the shelf.</h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">Import a ManaBox export to compare exact printings against Commander decks, track set goals and variant wishlists, reserve duplicates for trading, and build missing-card shopping lists. Collection records stay in this browser.</p>
        </section>

        <div className="mt-6 flex flex-wrap gap-2 border-y border-border py-3 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
          <span className="inline-flex items-center gap-2 border border-border bg-card px-3 py-2"><Layers3 className="h-4 w-4 text-primary" /> Browser workspace · exact-printing safe imports</span>
          <button type="button" onClick={() => setIsManaBoxOpen(true)} className="border border-primary bg-primary px-3 py-2 text-primary-foreground transition-colors hover:bg-primary/90">Import ManaBox</button>
          <Link href="/commander" className="border border-border bg-card px-3 py-2 transition-colors hover:border-primary hover:text-primary">Browse Commander archive</Link>
        </div>

        <LocalDataControls onWorkspaceChanged={() => setCollectionVersion((value) => value + 1)} />

        {isHydrating ? (
          <CollectionWorkspaceSkeleton />
        ) : <>
        <NextBestPurchases />

        <CollectionOverview
          onOpenImportModal={() => setIsManaBoxOpen(true)}
          refreshKey={collectionVersion}
        />

        <CollectionPlanner cards={loadOwnedCollection()} />

        <CommanderPassport />

        </>}

        <ManaBoxImportModal
          isOpen={isManaBoxOpen}
          onClose={() => setIsManaBoxOpen(false)}
          onCollectionUpdated={() => setCollectionVersion((value) => value + 1)}
        />
      </main>

      <footer className="border-t border-border bg-muted/30 py-8">
        <div className="container text-center text-sm text-muted-foreground">
          <p>Collection and deck workspace data stay in this browser unless you export a backup. Set discovery is available from the <Link href="/" className="font-semibold text-primary hover:underline">recent sets timeline</Link>.</p>
        </div>
      </footer>
    </div>
  );
}
