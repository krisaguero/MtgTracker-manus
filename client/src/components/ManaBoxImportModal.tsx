// Import preview is deliberately explicit: exact printing matches merge, ambiguous name-only rows stay separate unless the user chooses a printing.
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { loadOwnedCollection, saveOwnedCollection, clearOwnedCollection, mergeOwnedCollection, parseManaBoxImport, possiblePrintingMatches, collectionIdentity, type OwnedCard } from '@/lib/manaboxParser';
import { Upload, CheckCircle2, Trash2, FileText, X, AlertTriangle } from 'lucide-react';

interface ManaBoxImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCollectionUpdated?: () => void;
}

interface PreviewRow {
  card: OwnedCard;
  identity: string;
  candidates: OwnedCard[];
}

function printingLabel(card: OwnedCard) {
  return [card.setCode?.toUpperCase() || 'Set unknown', card.collectorNumber ? `#${card.collectorNumber}` : 'number unknown', card.finish || 'normal', `${card.quantity} owned`].join(' · ');
}

export function ManaBoxImportModal({ isOpen, onClose, onCollectionUpdated }: ManaBoxImportModalProps) {
  const [collection, setCollection] = useState<OwnedCard[]>([]);
  const [inputText, setInputText] = useState('');
  const [preview, setPreview] = useState<PreviewRow[] | null>(null);
  const [matchChoices, setMatchChoices] = useState<Record<string, string>>({});
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCollection(loadOwnedCollection());
      setInputText('');
      setPreview(null);
      setMatchChoices({});
      setStatusMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePreview = () => {
    const parsed = parseManaBoxImport(inputText);
    if (parsed.length === 0) {
      setPreview(null);
      setStatusMessage('No valid cards found in import text. Check the file headers or list format.');
      return;
    }
    const possibleMatches = possiblePrintingMatches(collection, parsed);
    const rows = parsed.map((card) => ({ card, identity: collectionIdentity(card), candidates: possibleMatches.get(collectionIdentity(card)) || [] }));
    setPreview(rows);
    setMatchChoices({});
    setStatusMessage(null);
  };

  const handleImport = () => {
    if (!preview) return;
    const resolved = preview.map((row) => {
      const chosen = matchChoices[row.identity];
      if (!chosen) return row.card;
      const existingPrinting = row.candidates.find((candidate) => collectionIdentity(candidate) === chosen);
      return existingPrinting ? { ...row.card, setCode: existingPrinting.setCode, collectorNumber: existingPrinting.collectorNumber, finish: existingPrinting.finish, language: existingPrinting.language } : row.card;
    });
    const { cards: merged, report } = mergeOwnedCollection(collection, resolved);
    saveOwnedCollection(merged);
    setCollection(merged);
    setInputText('');
    setPreview(null);
    setMatchChoices({});
    const unresolvedNote = report.unresolvedPrintingEntries > 0 ? ` ${report.unresolvedPrintingEntries} entries remain set/collector-unspecified and are not assigned to a printing.` : '';
    const matchedNote = Object.values(matchChoices).filter(Boolean).length > 0 ? ` ${Object.values(matchChoices).filter(Boolean).length} ambiguous row(s) were matched to the printing you selected.` : '';
    setStatusMessage(`Imported ${report.addedEntries} new printings and refreshed ${report.duplicateEntries.length} exact-identity entries.${matchedNote}${unresolvedNote}`);
    onCollectionUpdated?.();
  };

  const handleClear = () => {
    if (!window.confirm('Clear all imported collection records from this browser? This does not delete wishlist items or local backups.')) return;
    clearOwnedCollection();
    setCollection([]);
    setPreview(null);
    setStatusMessage('Collection storage cleared.');
    onCollectionUpdated?.();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) { setInputText(text); setPreview(null); setStatusMessage(null); }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const ambiguousCount = preview?.filter((row) => row.candidates.length > 0).length ?? 0;
  const exactPrintings = preview?.filter((row) => row.card.setCode && row.card.collectorNumber).length ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" role="presentation">
      <section className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto border-2 border-border bg-card p-5 text-card-foreground shadow-2xl sm:p-6" role="dialog" aria-modal="true" aria-labelledby="manabox-import-title">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2"><Upload className="h-5 w-5 text-primary" /><h2 id="manabox-import-title" className="text-xl font-bold">ManaBox Collection Import</h2></div>
          <button type="button" onClick={onClose} className="border border-border p-2 hover:bg-muted" aria-label="Close modal"><X className="h-5 w-5" /></button>
        </div>

        <div className="mt-5 space-y-4">
          <p className="text-sm leading-relaxed text-muted-foreground">Card names, quantities, and printing details are saved to this browser only. Exact printings are matched by identity; same-name rows without printing details are flagged rather than silently attached to a random edition.</p>
          <div className="flex flex-wrap items-center gap-3 border border-border bg-background p-4">
            <label className="cursor-pointer border border-border bg-card px-4 py-2 text-xs font-semibold hover:border-primary"><span className="flex items-center gap-2"><FileText className="h-4 w-4" /> Upload ManaBox CSV / TXT File</span><input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" /></label>
            <span className="text-xs text-muted-foreground">Or paste export data below</span>
          </div>
          <textarea value={inputText} onChange={(e) => { setInputText(e.target.value); setPreview(null); setStatusMessage(null); }} placeholder="Paste CSV rows (Name, Quantity, Set...) or deck list (1x Sol Ring...)" rows={6} className="w-full border border-border bg-background p-3 font-mono text-xs outline-none focus:border-primary" />

          <div className="flex flex-wrap items-center justify-between gap-3 border-y border-border py-3">
            <div className="text-xs text-muted-foreground">{collection.length > 0 ? <span className="flex items-center gap-1.5 font-semibold text-emerald-600"><CheckCircle2 className="h-4 w-4" /> {collection.length} distinct printing entries currently stored locally</span> : <span>No cards stored yet</span>}</div>
            <div className="flex flex-wrap gap-2">{collection.length > 0 && <Button variant="outline" size="sm" onClick={handleClear} className="gap-2 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /> Clear collection</Button>}<Button size="sm" onClick={handlePreview} disabled={!inputText.trim()}>Preview import</Button></div>
          </div>

          {preview && <section className="border border-primary/40 bg-primary/5 p-3" aria-labelledby="import-preview-title">
            <div className="flex flex-wrap items-start justify-between gap-2"><div><h3 id="import-preview-title" className="font-bold">Review before saving</h3><p className="mt-1 text-xs text-muted-foreground">{preview.length} distinct incoming rows · {exactPrintings} include set and collector number · {ambiguousCount} same-name match(es) need a printing decision.</p></div><span className="font-mono text-[10px] uppercase text-muted-foreground">No changes saved yet</span></div>
            {ambiguousCount > 0 && <p className="mt-3 flex gap-2 border border-amber-500/40 bg-amber-500/10 p-2 text-xs text-amber-800 dark:text-amber-300"><AlertTriangle className="h-4 w-4 shrink-0" /> Name-only imports can refer to different editions. Choose a specific existing printing to match, or keep the incoming row unassigned.</p>}
            <div className="mt-3 max-h-72 overflow-auto border border-border bg-background"><table className="w-full min-w-[520px] text-left text-xs"><thead className="sticky top-0 bg-card"><tr className="border-b border-border text-[10px] uppercase text-muted-foreground"><th className="p-2">Incoming card</th><th className="p-2">Identity / decision</th></tr></thead><tbody>{preview.map((row) => <tr key={row.identity} className="border-b border-border/50 align-top"><td className="p-2"><span className="font-semibold">{row.card.quantity} × {row.card.name}</span><span className="block text-[10px] text-muted-foreground">{printingLabel(row.card)}</span></td><td className="p-2">{row.candidates.length ? <label className="block"><span className="sr-only">Choose an existing printing for {row.card.name}</span><select aria-label={`Choose printing match for ${row.card.name}`} value={matchChoices[row.identity] || ''} onChange={(event) => setMatchChoices((current) => ({ ...current, [row.identity]: event.target.value }))} className="min-h-9 w-full border border-amber-500/50 bg-card px-2 text-xs"><option value="">Keep separate · printing unknown</option>{row.candidates.map((candidate) => <option key={collectionIdentity(candidate)} value={collectionIdentity(candidate)}>{printingLabel(candidate)}</option>)}</select></label> : <span className={`font-mono text-[10px] font-bold uppercase ${row.card.setCode && row.card.collectorNumber ? 'text-emerald-700' : 'text-muted-foreground'}`}>{row.card.setCode && row.card.collectorNumber ? 'Exact printing data' : 'No existing same-name printing'}</span>}</td></tr>)}</tbody></table></div>
            <div className="mt-3 flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setPreview(null)}>Cancel preview</Button><Button type="button" onClick={handleImport}>Apply import</Button></div>
          </section>}

          {statusMessage && <div role="status" className="border border-primary/40 bg-primary/10 p-3 text-xs font-semibold text-primary">{statusMessage}</div>}
        </div>
      </section>
    </div>
  );
}
