import { useEffect, useState } from 'react';
import { CloudDownload, CloudUpload, LockKeyhole } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { createLocalWorkspaceBackup, restoreLocalWorkspaceBackup, validateLocalWorkspaceBackup } from '@/lib/localWorkspace';

const OPT_IN_KEY = 'mtg_tracker_account_workspace_sync_v1';
function isEnabled() { return typeof window !== 'undefined' && window.localStorage.getItem(OPT_IN_KEY) === 'true'; }

export function AccountWorkspaceSync({ onWorkspaceChanged }: { onWorkspaceChanged?: () => void }) {
  const { user, loading: authLoading } = useAuth();
  const [enabled, setEnabled] = useState(isEnabled);
  const [status, setStatus] = useState<string | null>(null);
  const workspaceQuery = trpc.account.workspace.useQuery(undefined, { enabled: Boolean(user && enabled), retry: false });
  const saveWorkspace = trpc.account.saveWorkspace.useMutation();

  useEffect(() => { if (user) setStatus(null); }, [user]);
  if (authLoading || !user) return null;

  const setSync = (next: boolean) => {
    setEnabled(next);
    window.localStorage.setItem(OPT_IN_KEY, String(next));
    setStatus(next ? 'Account sync enabled. Nothing uploads until you choose Back up now.' : 'Account sync disabled. Local data remains in this browser.');
  };

  const handleBackup = async () => {
    if (!enabled) return;
    setStatus(null);
    try {
      await saveWorkspace.mutateAsync({ backupJson: JSON.stringify(createLocalWorkspaceBackup()) });
      setStatus('Workspace backed up to your signed-in account.');
      await workspaceQuery.refetch();
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Account backup failed. Nothing was changed.'); }
  };

  const handleRestore = () => {
    const raw = workspaceQuery.data?.backupJson;
    if (!raw) { setStatus('No account workspace backup was found. This browser was not changed.'); return; }
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!validateLocalWorkspaceBackup(parsed)) throw new Error('The saved account workspace is not a supported backup.');
      if (!window.confirm('Restore the account workspace and replace this browser’s collection, precon ownership/acquisitions, Commander Passport, saved decks, and valuation history? Export a local backup first.')) return;
      restoreLocalWorkspaceBackup(parsed);
      onWorkspaceChanged?.();
      const savedAt = workspaceQuery.data?.updatedAt;
      setStatus(savedAt ? `Account workspace restored from ${new Date(savedAt).toLocaleString()}.` : 'Account workspace restored.');
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Account restore failed. This browser was not changed.'); }
  };

  return (
    <section className="mt-5 border-t border-border pt-4" aria-labelledby="account-workspace-sync-heading">
      <div className="flex items-start gap-3">
        <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <h3 id="account-workspace-sync-heading" className="text-sm font-semibold">Signed-in account workspace</h3>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Signed in as {user.email || user.name || 'your account'}. This is separate from the optional Supabase account and stores one private, replaceable workspace snapshot.</p>
        </div>
      </div>
      <label className="mt-3 flex items-start gap-2 text-xs leading-relaxed">
        <input type="checkbox" checked={enabled} onChange={(event) => setSync(event.target.checked)} className="mt-0.5 h-4 w-4 accent-primary" />
        <span><strong>Enable account workspace sync.</strong> Keep local-first behavior, but allow explicit backup and restore using this app login.</span>
      </label>
      {enabled && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border border-border bg-background p-3">
          <Button type="button" variant="outline" onClick={() => void handleBackup()} disabled={saveWorkspace.isPending} className="min-h-10 gap-2"><CloudUpload className="h-4 w-4" /> Back up now</Button>
          <Button type="button" variant="outline" onClick={handleRestore} disabled={workspaceQuery.isLoading || !workspaceQuery.data} className="min-h-10 gap-2"><CloudDownload className="h-4 w-4" /> Restore account copy</Button>
          <span className="text-[11px] text-muted-foreground">{workspaceQuery.isLoading ? 'Checking for an account copy…' : workspaceQuery.data ? `Last saved ${new Date(workspaceQuery.data.updatedAt).toLocaleString()}` : 'No account copy yet'}</span>
        </div>
      )}
      {status && <p role="status" className="mt-3 border border-primary/30 bg-primary/5 p-3 text-xs text-muted-foreground">{status}</p>}
    </section>
  );
}
