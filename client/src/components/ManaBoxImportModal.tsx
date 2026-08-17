// Design philosophy: hard-edged private collection modal supporting ManaBox CSV imports and local completion matching.

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { loadOwnedCollection, saveOwnedCollection, clearOwnedCollection, parseManaBoxImport, type OwnedCard } from '@/lib/manaboxParser';
import { Upload, CheckCircle2, Trash2, FileText, X } from 'lucide-react';

interface ManaBoxImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCollectionUpdated?: () => void;
}

export function ManaBoxImportModal({ isOpen, onClose, onCollectionUpdated }: ManaBoxImportModalProps) {
  const [collection, setCollection] = useState<OwnedCard[]>([]);
  const [inputText, setInputText] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCollection(loadOwnedCollection());
      setInputText('');
      setStatusMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleImportText = () => {
    if (!inputText.trim()) return;
    const parsed = parseManaBoxImport(inputText);
    if (parsed.length === 0) {
      setStatusMessage('No valid cards found in import text.');
      return;
    }
    // Merge or replace? Let's merge with existing collection
    const map = new Map<string, OwnedCard>();
    for (const c of collection) {
      map.set(c.name.toLowerCase(), { ...c });
    }
    for (const c of parsed) {
      const key = c.name.toLowerCase();
      const existing = map.get(key);
      if (existing) {
        existing.quantity += c.quantity;
      } else {
        map.set(key, { ...c });
      }
    }
    const merged = Array.from(map.values());
    saveOwnedCollection(merged);
    setCollection(merged);
    setInputText('');
    setStatusMessage(`Successfully imported/updated ${parsed.length} card entries (${merged.length} total unique cards in private storage).`);
    onCollectionUpdated?.();
  };

  const handleClear = () => {
    clearOwnedCollection();
    setCollection([]);
    setStatusMessage('Collection storage cleared.');
    onCollectionUpdated?.();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        setInputText(text);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl border-2 border-border bg-card p-6 text-card-foreground shadow-2xl">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">ManaBox Collection Integration</h2>
          </div>
          <button onClick={onClose} className="border border-border p-1 hover:bg-muted" aria-label="Close modal">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Import your ManaBox CSV collection export or card text list. Your collection is stored strictly in your browser’s private local storage and is never uploaded to any remote server.
          </p>

          <div className="flex flex-wrap items-center gap-3 border border-border bg-background p-4">
            <label className="cursor-pointer border border-border bg-card px-4 py-2 text-xs font-semibold hover:border-primary">
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Upload ManaBox CSV / TXT File
              </span>
              <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
            </label>
            <span className="text-xs text-muted-foreground">Or paste export data below</span>
          </div>

          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste CSV rows (Name, Quantity, Set...) or deck list (1x Sol Ring...)"
            rows={6}
            className="w-full border border-border bg-background p-3 text-xs font-mono outline-none focus:border-primary"
          />

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="text-xs text-muted-foreground">
              {collection.length > 0 ? (
                <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                  <CheckCircle2 className="h-4 w-4" />
                  {collection.length} unique cards currently stored locally
                </span>
              ) : (
                <span>No cards stored yet</span>
              )}
            </div>

            <div className="flex gap-2">
              {collection.length > 0 && (
                <Button variant="outline" size="sm" onClick={handleClear} className="gap-2 text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4" />
                  Clear Storage
                </Button>
              )}
              <Button size="sm" onClick={handleImportText} disabled={!inputText.trim()}>
                Import & Save Cards
              </Button>
            </div>
          </div>

          {statusMessage && (
            <div className="border border-primary/40 bg-primary/10 p-3 text-xs font-semibold text-primary">
              {statusMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
