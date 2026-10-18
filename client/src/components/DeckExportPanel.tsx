import React, { useEffect, useMemo, useState } from 'react';
import { Check, Clipboard, Download } from 'lucide-react';
import {
  DECK_EXPORT_LINKS,
  downloadDeckText,
  formatArenaExport,
  formatGenericExport,
  formatMtgoExport,
  type DeckExportEntry,
  type DeckExportSections,
} from '@/lib/deckExport';

type ExportFormat = 'arena' | 'mtgo' | 'generic';

export function DeckExportPanel({ sections, filename, sourceNote, revisedNote }: {
  sections: DeckExportSections;
  filename: string;
  sourceNote?: string;
  revisedNote?: string;
}) {
  const [format, setFormat] = useState<ExportFormat>('generic');
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const output = useMemo(() => format === 'arena' ? formatArenaExport(sections) : format === 'mtgo' ? formatMtgoExport(sections) : formatGenericExport(sections), [format, sections]);
  useEffect(() => { setCopied(false); setCopyError(false); }, [format, output, filename]);
  const label = format === 'arena' ? 'Magic Arena' : format === 'mtgo' ? 'MTGO text' : 'Generic text';
  const handoff = format === 'arena' ? DECK_EXPORT_LINKS.arena : format === 'mtgo' ? DECK_EXPORT_LINKS.mtgo : DECK_EXPORT_LINKS.convoke;
  const handleCopy = async () => {
    try {
      if (!navigator.clipboard) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(output);
      setCopied(true); setCopyError(false); window.setTimeout(() => setCopied(false), 2500);
    } catch { setCopyError(true); }
  };
  return <section className="border-2 border-border bg-card p-5 sm:p-6" aria-label="Deck export">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><h2 className="text-xl font-black">Copy or download this list</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">Choose a text format, copy it, then use the documented import/paste flow. This tool does not verify legality, card availability, or printings.</p></div>
      <div className="flex flex-wrap gap-2">
        <select aria-label="Export format" value={format} onChange={event => setFormat(event.target.value as ExportFormat)} className="min-h-11 border-2 border-border bg-background px-3 py-2 font-mono text-xs font-bold">
          <option value="generic">Generic text</option><option value="arena">Magic Arena</option><option value="mtgo">MTGO text</option>
        </select>
        <button type="button" onClick={handleCopy} className="inline-flex min-h-11 items-center gap-2 border-2 border-primary px-3 py-2 text-xs font-bold text-primary hover:bg-primary hover:text-primary-foreground">{copied ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />} {copied ? 'Copied' : 'Copy list'}</button>
        <button type="button" onClick={() => downloadDeckText(output, `${filename}-${format}`)} className="inline-flex min-h-11 items-center gap-2 border-2 border-border px-3 py-2 text-xs font-bold hover:border-primary"><Download className="h-4 w-4" /> Download .txt</button>
      </div>
    </div>
    <pre className="mt-4 max-h-56 overflow-auto whitespace-pre-wrap border border-border bg-background p-3 font-mono text-xs leading-5" aria-label={`${label} preview`}>{output || 'No valid positive-quantity cards to export.'}</pre>
    <p role="status" aria-live="polite" className="mt-2 text-xs">{copied ? 'Decklist copied.' : ''}</p>
    {copyError && <p role="alert" className="mt-3 border border-destructive/40 bg-destructive/5 p-3 text-xs font-bold text-destructive">Could not access the clipboard. Select the list above and copy it manually.</p>}
    <p className="mt-3 text-xs leading-5"><strong>{label} next step:</strong> {format === 'arena' ? 'Open Wizards’ help, copy this list, then open Decks → Import in Arena.' : format === 'mtgo' ? 'Open MTGO deckbuilding, paste the text, and review the result. A .dek file is not generated because catalog IDs were not supplied.' : 'Paste into the destination site’s decklist importer. Convoke documents Moxfield decklist import; Aura0’s direct import behavior is not assumed.'} <a href={handoff} target="_blank" rel="noopener noreferrer" className="text-primary underline">Open official/help page</a></p>
    {format === 'mtgo' && <p className="mt-2 text-xs leading-5 text-amber-800 dark:text-amber-300">Review the commander zone in the client. If this custom deck has an optional house sideboard as well as a commander, keep this complete text as a reference and assign those zones manually; automatic handling of that combination is not guaranteed. A custom 60-card Commander preview may have no supported MTGO queue.</p>}
    {format === 'generic' && <p className="mt-2 text-xs leading-5 text-muted-foreground">Convoke: create or update the deck in Moxfield with its own import controls, review the list, then use Convoke's documented Moxfield import. Aura0: open the site yourself and inspect its controls; direct import is not documented here. <a href={DECK_EXPORT_LINKS.convoke} target="_blank" rel="noopener noreferrer" className="text-primary underline">Convoke homepage</a> · <a href={DECK_EXPORT_LINKS.aura0} target="_blank" rel="noopener noreferrer" className="text-primary underline">Aura0 homepage</a>. No room is opened here.</p>}
    {sourceNote && <p className="mt-2 text-xs leading-5 text-muted-foreground"><strong>Source list:</strong> {sourceNote}</p>}
    {revisedNote && <p className="mt-2 text-xs leading-5 text-muted-foreground"><strong>Revised selection:</strong> {revisedNote}</p>}
  </section>;
}

export type { DeckExportEntry };
