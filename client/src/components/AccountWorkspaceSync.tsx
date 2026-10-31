import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CloudDownload, CloudUpload, Download, GitMerge, LockKeyhole, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import {
  createLocalWorkspaceBackup,
  LOCAL_WORKSPACE_CHANGED_EVENT,
  restoreLocalWorkspaceBackup,
  validateLocalWorkspaceBackup,
  type LocalWorkspaceBackup,
} from '@/lib/localWorkspace';
import { compareWorkspace, mergeWorkspaces, summarizeWorkspace, type WorkspaceConflictState } from '@/lib/workspaceConflict';

const OPT_IN_KEY = 'mtg_tracker_account_workspace_sync_v1';
function isEnabled() { return typeof window !== 'undefined' && window.localStorage.getItem(OPT_IN_KEY) === 'true'; }
function formatBytes(bytes: number) { return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`; }
function formatDate(value?: string | Date) { return value ? new Date(value).toLocaleString() : 'Not available'; }

function parseBackup(raw?: string | null): LocalWorkspaceBackup | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return validateLocalWorkspaceBackup(parsed) ? parsed : null;
  } catch { return null; }
}

function conflictLabel(state: WorkspaceConflictState) {
  return {
    'local-newer': 'Local copy is newer',
    'account-newer': 'Account copy is newer',
    same: 'Copies are aligned',
    'local-only': 'Only this browser has a copy',
    'account-only': 'Only the account has a copy',
  }[state];
}

export function AccountWorkspaceSync({ onWorkspaceChanged }: { onWorkspaceChanged?: () => void }) {
  const { user, loading: authLoading } = useAuth();
  const [enabled, setEnabled] = useState(isEnabled);
  const [localBackup, setLocalBackup] = useState<LocalWorkspaceBackup | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const workspaceQuery = trpc.account.workspace.useQuery(undefined, { enabled: Boolean(user && enabled), retry: false });
  const saveWorkspace = trpc.account.saveWorkspace.useMutation();

  const refreshLocal = () => setLocalBackup(createLocalWorkspaceBackup());
  useEffect(() => {
    refreshLocal();
    const handleChange = () => refreshLocal();
    window.addEventListener(LOCAL_WORKSPACE_CHANGED_EVENT, handleChange);
    return () => window.removeEventListener(LOCAL_WORKSPACE_CHANGED_EVENT, handleChange);
  }, []);
  useEffect(() => { if (user) setStatus(null); }, [user]);

  const accountBackup = useMemo(() => parseBackup(workspaceQuery.data?.backupJson), [workspaceQuery.data?.backupJson]);
  const accountUpdatedAt = workspaceQuery.data?.updatedAt;
  const conflict = compareWorkspace(localBackup, accountBackup, accountUpdatedAt);
  const localSummary = localBackup ? summarizeWorkspace(localBackup) : null;
  const accountSummary = accountBackup ? summarizeWorkspace(accountBackup) : null;
  const hasConflict = conflict === 'local-newer' || conflict === 'account-newer';

  if (authLoading || !user) return null;

  const setSync = (next: boolean) => {
    setEnabled(next);
    window.localStorage.setItem(OPT_IN_KEY, String(next));
    setStatus(next ? 'Sync is enabled. Nothing uploads until you choose an action below.' : 'Sync is disabled. Local data remains in this browser.');
  };

  const downloadBackup = (backup: LocalWorkspaceBackup | null, filename: string) => {
    if (!backup) { setStatus('There is no workspace copy available to download.'); return; }
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
    setStatus('Workspace safety copy downloaded.');
  };

  const restoreAccount = () => {
    if (!accountBackup) { setStatus('No valid account workspace copy was found. This browser was not changed.'); return; }
    if (!window.confirm('Replace this browser’s workspace with the account copy? Download the local copy first if you may need it.')) return;
    try {
      restoreLocalWorkspaceBackup(accountBackup);
      refreshLocal();
      onWorkspaceChanged?.();
      setStatus(`Account copy restored from ${formatDate(accountUpdatedAt)}.`);
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Account restore failed.'); }
  };

  const backupLocal = async () => {
    if (!enabled) return;
    setBusy(true);
    try {
      const current = createLocalWorkspaceBackup();
      await saveWorkspace.mutateAsync({ backupJson: JSON.stringify(current) });
      setLocalBackup(current);
      await workspaceQuery.refetch();
      setStatus('Local workspace is now the account copy.');
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Account backup failed. Nothing was changed.'); }
    finally { setBusy(false); }
  };

  const mergeAndSave = async () => {
    if (!localBackup || !accountBackup) { setStatus('Merge requires both a local and account copy.'); return; }
    if (!window.confirm('Merge both copies and save the combined workspace as the new account copy? Duplicate scanned rows will not be summed; local records win on conflicts.')) return;
    setBusy(true);
    try {
      const merged = mergeWorkspaces(localBackup, accountBackup);
      await saveWorkspace.mutateAsync({ backupJson: JSON.stringify(merged) });
      setLocalBackup(merged);
      await workspaceQuery.refetch();
      setStatus('Merged workspace saved. Your browser was not replaced; local records were preserved.');
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Merge failed. No workspace was changed.'); }
    finally { setBusy(false); }
  };

  return (
    <section className="mt-5 border-t border-border pt-4" aria-labelledby="account-workspace-sync-heading">
      <div className="flex items-start gap-3">
        <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <h3 id="account-workspace-sync-heading" className="text-sm font-semibold">Workspace sync center</h3>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Signed in as {user.email || user.name || 'your account'}. Compare, protect, merge, or replace copies deliberately. Nothing uploads without an action.</p>
        </div>
      </div>
      <label className="mt-3 flex items-start gap-2 text-xs leading-relaxed">
        <input type="checkbox" checked={enabled} onChange={(event) => setSync(event.target.checked)} className="mt-0.5 h-4 w-4 accent-primary" />
        <span><strong>Enable account workspace sync.</strong> This unlocks the private account snapshot and comparison tools.</span>
      </label>
      {enabled && (
        <div className="mt-3 space-y-3 border border-border bg-background p-3">
          <div className={`flex items-start gap-2 border p-3 text-xs ${hasConflict ? 'border-amber-500/50 bg-amber-500/5' : 'border-primary/30 bg-primary/5'}`}>
            {hasConflict ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" /> : <RefreshCw className="mt-0.5 h-4 w-4 shrink-0 text-primary" />}
            <div><strong>{workspaceQuery.isLoading ? 'Checking copies…' : conflictLabel(conflict)}</strong><p className="mt-1 text-muted-foreground">{hasConflict ? 'Choose merge, keep local, or keep account. No automatic overwrite is performed.' : 'The sync center keeps local-first behavior and makes every replacement explicit.'}</p></div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <WorkspaceCopy label="This browser" summary={localSummary} date={localBackup?.exportedAt} />
            <WorkspaceCopy label="Signed-in account" summary={accountSummary} date={accountUpdatedAt} />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => void backupLocal()} disabled={busy || saveWorkspace.isPending} className="min-h-10 gap-2"><CloudUpload className="h-4 w-4" /> Keep local → account</Button>
            <Button type="button" variant="outline" onClick={restoreAccount} disabled={busy || !accountBackup} className="min-h-10 gap-2"><CloudDownload className="h-4 w-4" /> Keep account → local</Button>
            <Button type="button" variant="outline" onClick={() => void mergeAndSave()} disabled={busy || !localBackup || !accountBackup} className="min-h-10 gap-2"><GitMerge className="h-4 w-4" /> Merge copies</Button>
          </div>
          <div className="flex flex-wrap gap-2 border-t border-border pt-3">
            <Button type="button" variant="ghost" onClick={() => downloadBackup(localBackup, 'mtg-workspace-local.json')} disabled={!localBackup} className="min-h-9 gap-2 text-xs"><Download className="h-3.5 w-3.5" /> Download local safety copy</Button>
            <Button type="button" variant="ghost" onClick={() => downloadBackup(accountBackup, 'mtg-workspace-account.json')} disabled={!accountBackup} className="min-h-9 gap-2 text-xs"><Download className="h-3.5 w-3.5" /> Download account copy</Button>
          </div>
        </div>
      )}
      {status && <p role="status" className="mt-3 border border-primary/30 bg-primary/5 p-3 text-xs text-muted-foreground">{status}</p>}
    </section>
  );
}

function WorkspaceCopy({ label, summary, date }: { label: string; summary: ReturnType<typeof summarizeWorkspace> | null; date?: string | Date }) {
  return (
    <div className="border border-border p-3 text-xs">
      <div className="flex items-center justify-between gap-2"><strong>{label}</strong><span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{summary ? 'Available' : 'Missing'}</span></div>
      {summary ? <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-muted-foreground"><dt>Cards / copies</dt><dd className="text-right text-foreground">{summary.collectionCards} / {summary.collectionCopies}</dd><dt>Commander decks</dt><dd className="text-right text-foreground">{summary.commanderDecks}</dd><dt>Saved decks</dt><dd className="text-right text-foreground">{summary.savedDecks}</dd><dt>Owned precons</dt><dd className="text-right text-foreground">{summary.ownedPrecons}</dd><dt>Size</dt><dd className="text-right text-foreground">{formatBytes(summary.bytes)}</dd></dl> : <p className="mt-2 text-muted-foreground">No valid snapshot available.</p>}
      <p className="mt-2 text-[10px] text-muted-foreground">Updated {formatDate(date || summary?.exportedAt)}</p>
    </div>
  );
}
