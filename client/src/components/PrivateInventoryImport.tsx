import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { getSupabasePublicConfig, loadSupabaseWorkspaceSession, type SupabasePublicConfig } from '@/lib/supabaseWorkspaceSync';
import { previewPrivateInventory, uploadPrivateInventory, type ImportPreview, type ImportSource } from '@/lib/privateInventoryImport';

export function PrivateInventoryImport({ config = getSupabasePublicConfig() }: { config?: SupabasePublicConfig | null }) {
  const [files, setFiles] = useState<Partial<Record<ImportSource, File>>>({});
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState(false);
  async function makePreview() { if (!files.manabox || !files.deckbox) return; setBusy(true); setError(false); setPreview(null); try { setPreview(await previewPrivateInventory([{source:'manabox',file:files.manabox},{source:'deckbox',file:files.deckbox}])); } catch { setError(true); } finally { setBusy(false); } }
  async function upload() { if (!preview || !config) return; setBusy(true); setError(false); setProgress(null); try { await uploadPrivateInventory(preview, config, undefined, p => setProgress(`Uploaded ${p.cardsUploaded.toLocaleString()} of ${preview.cards.length.toLocaleString()} cards (batch ${p.batch} of ${p.batches}).`)); setProgress('Private inventory upload verified.'); } catch { setError(true); } finally { setBusy(false); } }
  return <section className="mt-4 border border-border bg-background p-3 sm:p-4" aria-labelledby="private-inventory-import-heading">
    <h3 id="private-inventory-import-heading" className="text-sm font-semibold">Private inventory import</h3>
    <p className="mt-1 text-xs text-muted-foreground">Select one ManaBox CSV and one Deckbox CSV. Files stay local until you review the preview and choose Upload.</p>
    <p className="mt-1 break-all text-xs text-muted-foreground">Destination: signed-in private account {loadSupabaseWorkspaceSession()?.user.email || loadSupabaseWorkspaceSession()?.user.id || 'not connected'}. The account is verified again before upload. Source files remain private; existing legacy inventory is not changed.</p>
    <div className="mt-3 grid gap-3 sm:grid-cols-2">
      {(['manabox','deckbox'] as ImportSource[]).map(source => <label key={source} className="text-xs"><span className="block font-medium">{source === 'manabox' ? 'ManaBox CSV' : 'Deckbox CSV'}</span><input className="mt-1 block w-full text-xs" type="file" accept=".csv,text/csv" disabled={busy} onChange={e => { const file=e.target.files?.[0]; setFiles(v=>({...v,[source]:file})); setPreview(null); setProgress(null); setError(false); }} /></label>)}
    </div>
    <div className="mt-3 flex gap-2"><Button type="button" onClick={() => void makePreview()} disabled={busy || !files.manabox || !files.deckbox}>Preview selected files</Button>{preview && <Button type="button" onClick={() => void upload()} disabled={busy}>Upload private inventory</Button>}</div>
    {preview && <div className="mt-3 border border-primary/30 bg-primary/5 p-3 text-xs"><p><strong>Preview only:</strong> {preview.rows.toLocaleString()} rows, {preview.copies.toLocaleString()} source copies, {preview.canonicalEntries.toLocaleString()} canonical entries, {preview.canonicalCopies.toLocaleString()} conservative copies.</p><p className="mt-1">Possible overlaps: {preview.overlapEntries.toLocaleString()} entries / {preview.overlapCopies.toLocaleString()} copies.</p><ul className="mt-2">{preview.sources.map(s=><li key={s.source}>{s.source}: {s.fileName} · SHA-256 {s.sourceHash} · {s.rows.toLocaleString()} rows / {s.copies.toLocaleString()} copies</li>)}</ul></div>}
    {progress && <p role="status" className="mt-3 text-xs text-muted-foreground">{progress}</p>}{error && <p role="alert" className="mt-3 text-xs text-destructive">Private inventory import could not be completed. Check the selected files and sign-in, then retry the same files.</p>}
  </section>;
}
