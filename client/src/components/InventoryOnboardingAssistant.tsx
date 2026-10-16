import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Check, ShieldCheck, Sparkles } from 'lucide-react';
import { Link } from 'wouter';
import type { OwnedCard } from '@/lib/manaboxParser';
import {
  buildLocalInventoryOnboardingNotes,
  summarizeInventoryForOnboarding,
  toProposedGroqInventoryRows,
} from '@/lib/inventoryOnboarding';

type CoachIntent = 'organize' | 'commander' | 'budget';

const COACH_INTENTS: Record<CoachIntent, { label: string; task: string }> = {
  organize: {
    label: 'Help me understand and organize this import',
    task: 'Explain how to manage the selected inventory entries and identify useful next steps. Do not estimate card prices.',
  },
  commander: {
    label: 'Find a Commander direction from selected cards',
    task: 'Suggest a theme-faithful Commander direction using the selected cards as anchors. Do not claim legality without validation.',
  },
  budget: {
    label: 'Find budget-conscious, theme-faithful upgrades',
    task: 'Suggest budget-conscious, theme-faithful upgrade ideas around the selected cards. Do not invent current prices.',
  },
};

const MAX_PREVIEW_ENTRIES = 8;

export function InventoryOnboardingAssistant({ cards }: { cards: OwnedCard[] }) {
  const [reviewOpen, setReviewOpen] = useState(false);
  const [selectedIndexes, setSelectedIndexes] = useState<number[]>([]);
  const [intent, setIntent] = useState<CoachIntent>('organize');
  const [localOnlyAcknowledged, setLocalOnlyAcknowledged] = useState(false);
  const [localPreviewShown, setLocalPreviewShown] = useState(false);

  const summary = useMemo(() => summarizeInventoryForOnboarding(cards), [cards]);
  const notes = useMemo(() => buildLocalInventoryOnboardingNotes(summary), [summary]);
  const previewCards = useMemo(() => cards.slice(0, MAX_PREVIEW_ENTRIES), [cards]);
  const selectedCards = useMemo(
    () => selectedIndexes.flatMap((index) => previewCards[index] ? [previewCards[index]!] : []),
    [previewCards, selectedIndexes],
  );
  const proposedRequest = useMemo(() => JSON.stringify({
    task: COACH_INTENTS[intent].task,
    inventory: toProposedGroqInventoryRows(selectedCards),
  }, null, 2), [intent, selectedCards]);

  useEffect(() => {
    setSelectedIndexes([]);
    setLocalOnlyAcknowledged(false);
    setLocalPreviewShown(false);
  }, [cards]);

  function toggleEntry(index: number) {
    setSelectedIndexes((current) => current.includes(index)
      ? current.filter((value) => value !== index)
      : [...current, index].sort((a, b) => a - b));
    setLocalPreviewShown(false);
  }

  return (
    <section className="my-8 border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-card to-background p-4 sm:p-7" aria-labelledby="inventory-onboarding-title">
      <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-3xl">
          <p className="inline-flex items-center gap-2 font-mono text-[10px] font-black uppercase tracking-[0.19em] text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Inventory Coach · browser-local
          </p>
          <h2 id="inventory-onboarding-title" className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Your import is ready for a useful next step.</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">A quick local check can help you get from a CSV to a collection you can actually use. Uploading never starts AI automatically.</p>
        </div>
        <div className="flex shrink-0 items-center gap-2 border border-emerald-600/30 bg-emerald-600/5 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
          <ShieldCheck className="h-4 w-4" /> No AI request on import
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="border border-border bg-background p-3">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Copies</span>
          <strong className="mt-1 block text-2xl">{summary.totalCopies.toLocaleString()}</strong>
        </div>
        <div className="border border-border bg-background p-3">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Collection entries</span>
          <strong className="mt-1 block text-2xl">{summary.entryCount.toLocaleString()}</strong>
        </div>
        <div className="border border-border bg-background p-3">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Exact printings</span>
          <strong className="mt-1 block text-2xl">{summary.identifiedPrintingCount.toLocaleString()}</strong>
          <span className="text-xs text-muted-foreground">set + collector number</span>
        </div>
        <div className="border border-border bg-background p-3">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Sets represented</span>
          <strong className="mt-1 block text-2xl">{summary.setCount.toLocaleString()}</strong>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="border border-border bg-background p-4">
          <h3 className="font-bold">Local onboarding checklist</h3>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
            {notes.map((note) => <li key={note} className="flex gap-2"><Check className="mt-1 h-4 w-4 shrink-0 text-primary" /><span>{note}</span></li>)}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/commander" className="inline-flex min-h-10 items-center gap-2 border border-primary bg-primary px-3 py-2 text-xs font-bold text-primary-foreground hover:opacity-90">
              Browse Commander archive <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link href="/deck-workshop" className="inline-flex min-h-10 items-center gap-2 border border-border bg-card px-3 py-2 text-xs font-bold hover:border-primary">
              Open deck workshop
            </Link>
            <a href="#binder-upgrade-radar" className="inline-flex min-h-10 items-center gap-2 border border-border bg-card px-3 py-2 text-xs font-bold hover:border-primary">
              See researched upgrades
            </a>
          </div>
        </div>

        <div className="border border-primary/40 bg-primary/5 p-4">
          <h3 className="font-bold">Optional Groq onboarding · review prototype</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">This panel demonstrates a future, one-request consent flow. It is not connected to Groq: it makes no network request, uses no API key, and never sends your collection. The local preview below is a scripted demonstration, not AI advice.</p>
          <button type="button" onClick={() => setReviewOpen((open) => !open)} aria-expanded={reviewOpen} className="mt-4 inline-flex min-h-10 items-center gap-2 border border-primary bg-background px-3 py-2 text-xs font-bold text-foreground hover:bg-primary/10">
            {reviewOpen ? 'Close data review' : 'Review what a future request would include'}
          </button>
        </div>
      </div>

      {reviewOpen && <div className="mt-5 border-2 border-border bg-background p-4 sm:p-5" aria-labelledby="groq-consent-review-title">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <h3 id="groq-consent-review-title" className="font-bold">Choose the scope before any future AI request</h3>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">Nothing is selected by default. This mock can preview up to {MAX_PREVIEW_ENTRIES} local entries. A production deck workflow should let you search and select a task-specific subset rather than sending the full binder.</p>
          </div>
        </div>

        <fieldset className="mt-4">
          <legend className="text-xs font-bold uppercase tracking-wider text-muted-foreground">What would you ask Groq?</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {(Object.entries(COACH_INTENTS) as Array<[CoachIntent, typeof COACH_INTENTS[CoachIntent]]>).map(([value, option]) => (
              <label key={value} className={`flex min-h-12 cursor-pointer items-start gap-2 border p-3 text-xs leading-5 ${intent === value ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}>
                <input type="radio" name="inventory-coach-intent" value={value} checked={intent === value} onChange={() => { setIntent(value); setLocalPreviewShown(false); }} className="mt-1 accent-primary" />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-4">
          <legend className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Select only the card entries you want included</legend>
          <p className="mt-1 text-xs text-muted-foreground">Showing up to {MAX_PREVIEW_ENTRIES} entries from this browser. Select at least one to preview the proposed payload.</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {previewCards.map((card, index) => (
              <label key={`${index}-${card.name}-${card.setCode || ''}-${card.collectorNumber || ''}`} className={`flex min-h-12 cursor-pointer items-start gap-2 border p-3 ${selectedIndexes.includes(index) ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}>
                <input type="checkbox" checked={selectedIndexes.includes(index)} onChange={() => toggleEntry(index)} className="mt-1 accent-primary" />
                <span className="text-xs leading-5"><strong>{card.name}</strong><span className="block text-muted-foreground">{card.quantity} owned{card.setCode ? ` · ${card.setCode.toUpperCase()}` : ''}{card.collectorNumber ? ` · #${card.collectorNumber}` : ''}</span></span>
              </label>
            ))}
          </div>
          {previewCards.length === 0 && <p className="mt-2 text-sm text-muted-foreground">No entries are available to select.</p>}
        </fieldset>

        <div className="mt-4 border border-border bg-card p-3">
          <p className="text-xs font-bold uppercase tracking-wider">Proposed one-time payload · on-screen preview only</p>
          <p className="mt-1 text-xs text-muted-foreground">Included: the chosen task plus selected card name, quantity, set code, and collector number when present. Excluded: unselected cards, finish, condition, language, prices, account details, and the rest of the binder.</p>
          <pre className="mt-3 max-h-56 overflow-auto whitespace-pre-wrap break-words border border-border bg-background p-3 font-mono text-[11px] leading-5">{proposedRequest}</pre>
        </div>

        <label className="mt-4 flex cursor-pointer items-start gap-2 border border-amber-600/30 bg-amber-500/5 p-3 text-xs leading-5">
          <input type="checkbox" checked={localOnlyAcknowledged} onChange={(event) => { setLocalOnlyAcknowledged(event.target.checked); setLocalPreviewShown(false); }} className="mt-1 accent-primary" />
          <span>I understand this is only a local simulation. No information will be sent to Groq or any other service.</span>
        </label>
        <button type="button" disabled={selectedCards.length === 0 || !localOnlyAcknowledged} onClick={() => setLocalPreviewShown(true)} className="mt-3 inline-flex min-h-10 items-center gap-2 border border-primary bg-primary px-4 py-2 text-xs font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50">
          Run local consent preview
        </button>
        {localPreviewShown && <p role="status" className="mt-3 border border-emerald-600/30 bg-emerald-600/5 p-3 text-sm leading-6 text-emerald-800 dark:text-emerald-300">Local preview complete: {selectedCards.length} selected entries ({selectedCards.reduce((total, card) => total + card.quantity, 0)} copies) are shown in the payload above. No API call was made and no data left this browser.</p>}
      </div>}
    </section>
  );
}
