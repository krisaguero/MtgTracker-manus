import { useRef, useState } from 'react';
import { ChevronDown, Download, FileUp, ShieldCheck, Trash2 } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { isAnalyticsOptedIn, loadUmamiAnalytics, saveAnalyticsConsent } from '@/lib/analytics';
import { loadLocalSavedDecks, removeLocalDeck, type LocalSavedDeck } from '@/lib/localSavedDecks';
import { SupabaseWorkspaceBackup } from '@/components/SupabaseWorkspaceBackup';
import {
  clearLocalWorkspace,
  createLocalWorkspaceBackup,
  restoreLocalWorkspaceBackup,
  validateLocalWorkspaceBackup,
} from '@/lib/localWorkspace';

interface LocalDataControlsProps {
  onWorkspaceChanged?: () => void;
}

export function LocalDataControls({ onWorkspaceChanged }: LocalDataControlsProps) {
  const importInputRef = useRef<HTMLInputElement>(null);
  const [savedDecks, setSavedDecks] = useState<LocalSavedDeck[]>(() => loadLocalSavedDecks());
  const [analyticsEnabled, setAnalyticsEnabled] = useState(() => isAnalyticsOptedIn());
  const [analyticsReloadRequired, setAnalyticsReloadRequired] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [isExpandedOnMobile, setIsExpandedOnMobile] = useState(false);

  function handleExport() {
    try {
      const backup = createLocalWorkspaceBackup();
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `mtg-tracker-local-backup-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
      setStatus('Backup downloaded. Store it somewhere private; it contains your collection and deck notes.');
    } catch {
      setStatus('Could not create a backup from this browser. Check that local storage is available.');
    }
  }

  async function handleImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      setStatus('Backup file is too large to restore (20 MB limit).');
      return;
    }
    try {
      const parsed: unknown = JSON.parse(await file.text());
      if (!validateLocalWorkspaceBackup(parsed)) {
        setStatus('This file is not a valid, supported MTG Tracker local backup. No data was changed.');
        return;
      }
      const confirmed = window.confirm('Restore this backup by replacing the collection, set goals, collector wishlist and trade piles, Limited pools, Commander Passport, saved local decklists, duel inventories, saved 60-card themes, sideboards, and valuation history currently in this browser?');
      if (!confirmed) return;
      restoreLocalWorkspaceBackup(parsed);
      setSavedDecks(loadLocalSavedDecks());
      setStatus('Backup restored to this browser.');
      onWorkspaceChanged?.();
    } catch {
      setStatus('Could not complete the restore. The app attempted to roll back; review your local records and retry from a backup if needed.');
    }
  }

  function handleDeleteAll() {
    const confirmed = window.confirm('Delete this browser’s local collection, set goals, collector wishlist and trade piles, Limited pools, Commander Passport records, saved local decks, duel inventories, saved 60-card themes, sideboards, and valuation history? This does not delete the tab-scoped Groq API key, sign-in, account records, or UI preferences.');
    if (!confirmed) return;
    try {
      clearLocalWorkspace();
      setSavedDecks([]);
      setStatus('Local collection and deck workspace data deleted from this browser.');
      onWorkspaceChanged?.();
    } catch {
      setStatus('Could not delete all local workspace data. Some browser storage may be unavailable.');
    }
  }

  function handleRemoveSavedDeck(deckKey: string) {
    try {
      setSavedDecks(removeLocalDeck(deckKey));
    } catch {
      setStatus('Could not remove that local deck from browser storage.');
    }
  }

  function handleAnalyticsChange(enabled: boolean) {
    try {
      saveAnalyticsConsent(enabled);
      setAnalyticsEnabled(enabled);
      if (enabled) {
        loadUmamiAnalytics(
          import.meta.env.VITE_ANALYTICS_ENDPOINT,
          import.meta.env.VITE_ANALYTICS_WEBSITE_ID,
          document,
        );
        setStatus('Analytics opt-in saved; the service runs only if configured for this app.');
      } else {
        const script = document.querySelector('script[data-umami-analytics]');
        if (script) {
          script.remove();
          setAnalyticsReloadRequired(true);
          setStatus('Analytics opt-out saved. Reload this page to stop any script already loaded for this session.');
        } else {
          setStatus('Analytics opt-out saved; no analytics script was loaded.');
        }
      }
    } catch {
      setStatus('Could not save the analytics preference in this browser.');
    }
  }

  return (
    <section className="my-6 border-2 border-border bg-card p-4 sm:p-7" aria-labelledby="local-data-controls-heading">
      <div className="flex items-start gap-3 border-b border-border pb-4">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h2 id="local-data-controls-heading" className="text-lg font-bold">Local data, privacy &amp; backup</h2>
            <button
              type="button"
              aria-expanded={isExpandedOnMobile}
              aria-controls="local-data-controls-details"
              onClick={() => setIsExpandedOnMobile((expanded) => !expanded)}
              className="inline-flex min-h-11 shrink-0 items-center gap-1 border border-border px-2 font-mono text-[10px] font-bold uppercase sm:hidden"
            >
              {isExpandedOnMobile ? 'Hide details' : 'Details'}
              <ChevronDown className={`h-4 w-4 transition-transform ${isExpandedOnMobile ? 'rotate-180' : ''}`} />
            </button>
          </div>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Your collection and deck workspace stay in this browser by default; this panel does not enable cloud sync.
          </p>
        </div>
      </div>

      <div id="local-data-controls-details" className={isExpandedOnMobile ? 'block sm:block' : 'hidden sm:block'}>
        <div className="mt-3 border-b border-border pb-4">
          <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Your imported collection, set goals, wishlists, trade piles, Limited pools, Commander Passport notes, saved precon deck snapshots, duel inventories, and valuation history stay in this browser by default. They are not uploaded for cloud sync. Browser storage is not encrypted, so use a trusted device and keep exported backups private.
          </p>
          <p className="mt-2 max-w-3xl text-xs leading-relaxed text-muted-foreground">
            Backups exclude sign-in details and API keys. Custom AI deck generation can send the selected inventory and prompt to Groq when you choose that feature. Analytics is off unless you opt in below.
          </p>
          <p className="mt-2 max-w-3xl text-xs leading-relaxed text-muted-foreground">
            This is local-first storage, not a fully offline mode; public card, image, and market-data lookups continue to use the app’s configured services.
          </p>
        </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button type="button" variant="outline" onClick={handleExport} className="min-h-11 gap-2">
          <Download className="h-4 w-4" /> Export local backup
        </Button>
        <Button type="button" variant="outline" onClick={() => importInputRef.current?.click()} className="min-h-11 gap-2">
          <FileUp className="h-4 w-4" /> Restore backup
        </Button>
        <input
          ref={importInputRef}
          type="file"
          accept="application/json,.json"
          aria-label="Choose local workspace backup JSON"
          className="hidden"
          onChange={(event) => void handleImport(event)}
        />
        <Button type="button" variant="outline" onClick={handleDeleteAll} className="min-h-11 gap-2 text-destructive hover:bg-destructive/10">
          <Trash2 className="h-4 w-4" /> Delete local workspace
        </Button>
      </div>

      <SupabaseWorkspaceBackup onWorkspaceChanged={onWorkspaceChanged} />

      <div className="mt-5 border-t border-border pt-4">
        <h3 className="text-sm font-semibold">Saved deck snapshots on this browser</h3>
        {savedDecks.length ? (
          <ul className="mt-2 divide-y divide-border border-y border-border">
            {savedDecks.map((deck) => (
              <li key={deck.deckKey} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <Link href={deck.href} className="font-medium text-primary hover:underline">{deck.name}</Link>
                <button type="button" onClick={() => handleRemoveSavedDeck(deck.deckKey)} className="inline-flex min-h-11 items-center text-xs text-muted-foreground underline hover:text-destructive">Remove local copy</button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-xs text-muted-foreground">No saved deck snapshots yet. Use “Save deck locally” on a Commander precon page.</p>
        )}
      </div>

      <div className="mt-5 flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold">Optional analytics</h3>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">If enabled, the configured analytics service may receive page-view information. Your collection and deck contents are not sent by this choice. You can opt out at any time.</p>
        </div>
        <label className="inline-flex shrink-0 items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={analyticsEnabled}
            onChange={(event) => handleAnalyticsChange(event.target.checked)}
            aria-label="Enable optional analytics"
            className="h-4 w-4 accent-primary"
          />
          {analyticsEnabled ? 'Enabled' : 'Off'}
        </label>
      </div>
      {analyticsReloadRequired && !analyticsEnabled && (
        <Button type="button" variant="outline" size="sm" onClick={() => window.location.reload()} className="mt-3">
          Reload to apply analytics opt-out
        </Button>
      )}
      </div>
      {status && <p role="status" className="mt-4 border border-primary/30 bg-primary/5 p-3 text-xs text-muted-foreground">{status}</p>}
    </section>
  );
}
