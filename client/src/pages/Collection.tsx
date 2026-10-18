import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Archive, Layers3 } from 'lucide-react';
import { Link } from 'wouter';
import { CollectionOverview } from '@/components/CollectionOverview';
import { CommanderPassport } from '@/components/CommanderPassport';
import { ManaBoxImportModal } from '@/components/ManaBoxImportModal';
import { NextBestPurchases } from '@/components/NextBestPurchases';
import { CollectionWorkspaceSkeleton } from '@/components/PageSkeletons';
import { LocalDataControls } from '@/components/LocalDataControls';
import { CollectionPlanner } from '@/components/CollectionPlanner';
import { BinderUpgradeRadar } from '@/components/BinderUpgradeRadar';
import { InventoryOnboardingAssistant } from '@/components/InventoryOnboardingAssistant';
import { CollectionDirectory } from '@/components/CollectionDirectory';
import { PrivateCollectionAnalysis } from '@/components/PrivateCollectionAnalysis';
import { loadOwnedCollection } from '@/lib/manaboxParser';
import { useAuth } from '@/_core/hooks/useAuth';
import { startLogin } from '@/const';

export default function Collection() {
  const { user, loading: authLoading, logout } = useAuth();
  const [isManaBoxOpen, setIsManaBoxOpen] = useState(false);
  const [collectionVersion, setCollectionVersion] = useState(0);
  const [isHydrating, setIsHydrating] = useState(true);
  const localCollection = useMemo(() => loadOwnedCollection(), [collectionVersion]);

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
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">Turn scanned cards into a useful library: review exact printings, protect keepers, reserve deck copies, and choose what to trade or build next. Work stays in this browser unless you explicitly transfer a private backup or approve an optional analysis.</p>
        </section>

        <div className="mt-6 flex flex-wrap gap-2 border-y border-border py-3 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
          <span className="inline-flex items-center gap-2 border border-border bg-card px-3 py-2"><Layers3 className="h-4 w-4 text-primary" /> Browser workspace · exact-printing safe imports</span>
          <button type="button" onClick={() => setIsManaBoxOpen(true)} className="border border-primary bg-primary px-3 py-2 text-primary-foreground transition-colors hover:bg-primary/90">Import ManaBox</button>
          <Link href="/commander" className="border border-border bg-card px-3 py-2 transition-colors hover:border-primary hover:text-primary">Browse Commander archive</Link>
          <Link href="/collection/sets" className="border border-border bg-card px-3 py-2 transition-colors hover:border-primary hover:text-primary">All release checklists</Link>
        </div>

        <LocalDataControls onWorkspaceChanged={() => setCollectionVersion((value) => value + 1)} />

        {isHydrating ? (
          <CollectionWorkspaceSkeleton />
        ) : <>
        <NextBestPurchases collection={localCollection} onOpenImportModal={() => setIsManaBoxOpen(true)} />

        <CollectionDirectory key={collectionVersion} cards={localCollection} onOpenImportModal={() => setIsManaBoxOpen(true)} />

        {localCollection.length > 0 && <PrivateCollectionAnalysis setName="Scanned library" collection={localCollection} />}

        <CollectionOverview
          onOpenImportModal={() => setIsManaBoxOpen(true)}
          refreshKey={collectionVersion}
        />

        {localCollection.length > 0 && <InventoryOnboardingAssistant cards={localCollection} />}

        <BinderUpgradeRadar cards={localCollection} onOpenImportModal={() => setIsManaBoxOpen(true)} />

        <CollectionPlanner cards={localCollection} />

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
          <p>Local-first collection and deck data stay in this browser until an explicit transfer. Optional private Supabase storage and consent-gated Groq analysis are separate choices. Explore the <Link href="/collection/sets" className="font-semibold text-primary hover:underline">release directory</Link>.</p>
        </div>
      </footer>
    </div>
  );
}
