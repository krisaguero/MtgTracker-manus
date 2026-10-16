import { useState } from 'react';
import { Cloud, CloudDownload, CloudUpload, LogOut, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  backupWorkspaceToSupabase,
  createSupabaseAccount,
  getSupabasePublicConfig,
  isSupabaseSyncOptedIn,
  loadSupabaseWorkspaceSession,
  restoreWorkspaceFromSupabase,
  setSupabaseSyncOptIn,
  signInToSupabase,
  signOutFromSupabase,
  type SupabaseWorkspaceSession,
} from '@/lib/supabaseWorkspaceSync';
import { createLocalWorkspaceBackup, restoreLocalWorkspaceBackup } from '@/lib/localWorkspace';

interface SupabaseWorkspaceBackupProps {
  onWorkspaceChanged?: () => void;
}

const config = getSupabasePublicConfig();

export function SupabaseWorkspaceBackup({ onWorkspaceChanged }: SupabaseWorkspaceBackupProps) {
  const [optedIn, setOptedIn] = useState(() => isSupabaseSyncOptedIn());
  const [session, setSession] = useState<SupabaseWorkspaceSession | null>(() => loadSupabaseWorkspaceSession());
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function handleOptInChange(enabled: boolean) {
    setStatus(null);
    if (enabled) {
      setSupabaseSyncOptIn(true);
      setOptedIn(true);
      setStatus('Optional cloud backup is enabled for this browser. Nothing uploads unless you choose Back up to cloud.');
      return;
    }
    await signOutFromSupabase(config);
    setSupabaseSyncOptIn(false);
    setOptedIn(false);
    setSession(null);
    setPassword('');
    setStatus('Cloud backup is off and this tab’s Supabase session was cleared. Any previously uploaded cloud copy remains in your Supabase account.');
  }

  async function handleAuth(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!config) return;
    setBusy(true);
    setStatus(null);
    try {
      if (creatingAccount) {
        const created = await createSupabaseAccount(email, password, config);
        if (created) {
          setSession(created);
          setPassword('');
          setStatus('Supabase account created and signed in. Your workspace is still local until you back it up.');
        } else {
          setPassword('');
          setStatus('Account request accepted. If email confirmation is enabled for your Supabase project, confirm the email, then sign in here.');
        }
      } else {
        const signedIn = await signInToSupabase(email, password, config);
        setSession(signedIn);
        setPassword('');
        setStatus('Signed in to Supabase. No workspace data has been uploaded.');
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Supabase authentication failed.');
    } finally {
      setBusy(false);
    }
  }

  async function handleBackup() {
    if (!config) return;
    const confirmed = window.confirm('Back up this browser’s local collection and workspace to the signed-in Supabase account? This replaces that account’s previous single cloud backup.');
    if (!confirmed) return;
    setBusy(true);
    setStatus(null);
    try {
      const savedAt = await backupWorkspaceToSupabase(createLocalWorkspaceBackup(), config);
      setStatus(`Cloud backup saved at ${new Date(savedAt).toLocaleString()}.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Cloud backup failed.');
    } finally {
      setBusy(false);
    }
  }

  async function handleRestore() {
    if (!config) return;
    const confirmed = window.confirm('Restore the saved Supabase backup by replacing this browser’s collection, set goals, collector wishlist and trade piles, Limited pools, Commander Passport, saved local decklists, duel inventories, saved 60-card themes, sideboards, and valuation history? This cannot be automatically undone; export a local backup first if needed.');
    if (!confirmed) return;
    setBusy(true);
    setStatus(null);
    try {
      const snapshot = await restoreWorkspaceFromSupabase(config);
      if (!snapshot) {
        setStatus('No cloud backup was found for this Supabase account. This browser was not changed.');
        return;
      }
      restoreLocalWorkspaceBackup(snapshot.backup);
      onWorkspaceChanged?.();
      setStatus(`Cloud backup from ${new Date(snapshot.updatedAt).toLocaleString()} restored to this browser.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Cloud restore failed. This browser was not changed.');
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOut() {
    await signOutFromSupabase(config);
    setSession(null);
    setPassword('');
    setStatus('Signed out of Supabase. The cloud backup itself was not deleted.');
  }

  return (
    <section className="mt-5 border-t border-border pt-4" aria-labelledby="supabase-backup-heading">
      <div className="flex items-start gap-3">
        <Cloud className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <h3 id="supabase-backup-heading" className="text-sm font-semibold">Optional Supabase backup</h3>
          <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted-foreground">
            Local-first and off by default. A transfer happens only when you press a backup or restore button. This uses a separate Supabase Auth account, not the app sign-in.
          </p>
        </div>
      </div>

      {!config ? (
        <div className="mt-3 border border-border bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
          Not configured in this app environment. A later setup requires <code>VITE_SUPABASE_URL</code>, a public <code>VITE_SUPABASE_ANON_KEY</code>, and the reviewed private-backup table migration. Do not use a service-role key in the browser.
        </div>
      ) : (
        <>
          <label className="mt-3 flex items-start gap-2 text-xs leading-relaxed">
            <input
              type="checkbox"
              checked={optedIn}
              onChange={(event) => void handleOptInChange(event.target.checked)}
              aria-label="Enable optional Supabase cloud backup"
              className="mt-0.5 h-4 w-4 accent-primary"
            />
            <span><strong>I choose to enable optional cloud backup.</strong> My collection and workspace stay in this browser until I explicitly transfer them. Turning this off clears this tab’s session, but does not erase a cloud copy already saved.</span>
          </label>

          {optedIn && (
            <div className="mt-4 space-y-3 border border-border bg-background p-3 sm:p-4">
              {session ? (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs"><ShieldCheck className="h-4 w-4 text-emerald-600" /><span>Signed in to Supabase{session.user.email ? ` as ${session.user.email}` : ''}. No automatic sync is running.</span></div>
                  <Button type="button" variant="outline" size="sm" onClick={() => void handleSignOut()} disabled={busy} className="min-h-10 gap-2"><LogOut className="h-4 w-4" /> Sign out</Button>
                </div>
              ) : (
                <form onSubmit={(event) => void handleAuth(event)} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
                  <label className="grid gap-1 text-xs font-medium">Supabase account email
                    <input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="min-h-10 border border-border bg-background px-3 text-sm" />
                  </label>
                  <label className="grid gap-1 text-xs font-medium">Password (not saved by this app)
                    <input type="password" autoComplete={creatingAccount ? 'new-password' : 'current-password'} required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} className="min-h-10 border border-border bg-background px-3 text-sm" />
                  </label>
                  <Button type="submit" disabled={busy} className="min-h-10">{busy ? 'Please wait…' : creatingAccount ? 'Create Supabase account' : 'Sign in to Supabase'}</Button>
                  <button type="button" onClick={() => setCreatingAccount((value) => !value)} className="justify-self-start text-xs font-medium text-primary underline sm:col-span-3">
                    {creatingAccount ? 'Already have a Supabase account? Sign in' : 'Need a separate Supabase account? Create one'}
                  </button>
                </form>
              )}

              {session && (
                <div className="flex flex-wrap gap-2 border-t border-border pt-3">
                  <Button type="button" variant="outline" onClick={() => void handleBackup()} disabled={busy} className="min-h-10 gap-2"><CloudUpload className="h-4 w-4" /> Back up to cloud</Button>
                  <Button type="button" variant="outline" onClick={() => void handleRestore()} disabled={busy} className="min-h-10 gap-2"><CloudDownload className="h-4 w-4" /> Restore from cloud</Button>
                </div>
              )}
            </div>
          )}
          <p className="mt-2 max-w-3xl text-[11px] leading-relaxed text-muted-foreground">Backups are protected by per-user row-level security. The sign-in session is stored in this tab only; the backup excludes passwords, tokens, and API keys. Disconnecting leaves any cloud copy intact.</p>
        </>
      )}
      {status && <p role="status" className="mt-3 border border-primary/30 bg-primary/5 p-3 text-xs leading-relaxed text-muted-foreground">{status}</p>}
    </section>
  );
}
