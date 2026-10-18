import { useEffect, useMemo, useState } from 'react';
import type { OwnedCard } from '@/lib/manaboxParser';
import { ownedQuantityForPrint, type ScryfallPrint } from '@/lib/setCollectionDirectory';

const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'llama-3.3-70b-versatile';
const DUPLICATE_CAP = 20;
interface Props { setName: string; prints?: ScryfallPrint[]; collection: OwnedCard[]; }
export interface AnalysisRequestBody { model: string; temperature: number; messages: Array<{ role: 'system' | 'user'; content: string }> }
function identityRows(prints: ScryfallPrint[], collection: OwnedCard[]) { return prints.map(print => ({ name: print.name, copies: ownedQuantityForPrint(print, collection) })); }
export function analysisPreview(setName: string, prints: ScryfallPrint[] = [], collection: OwnedCard[] = []) {
  const rows = identityRows(prints, collection);
  const source = prints.length ? rows : Object.entries(collection.filter(card => !card.proxy).reduce<Record<string, number>>((a, card) => { a[card.name] = (a[card.name] || 0) + Math.max(0, card.quantity || 0); return a; }, {})).map(([name, copies]) => ({ name, copies }));
  const duplicateRows = source.filter(row => row.copies > 1).sort((a, b) => b.copies - a.copies || a.name.localeCompare(b.name));
  return { setName, catalogPrintCount: prints.length, ownedUniquePrintCount: source.filter(row => row.copies > 0).length, duplicatePrintCount: duplicateRows.length, duplicateSummary: duplicateRows.slice(0, DUPLICATE_CAP), duplicateSummaryCapped: duplicateRows.length > DUPLICATE_CAP };
}
export function createAnalysisRequestBody(preview: ReturnType<typeof analysisPreview>): AnalysisRequestBody {
  const payload = { collectionScope: preview.setName, catalogPrintCount: preview.catalogPrintCount, ownedUniquePrintCount: preview.ownedUniquePrintCount, duplicatePrintCount: preview.duplicatePrintCount, topDuplicatePrints: preview.duplicateSummary, additionalDuplicatePrintsOmitted: preview.duplicateSummaryCapped };
  return { model: DEFAULT_MODEL, temperature: 0.2, messages: [{ role: 'system', content: 'You are a cautious MTG collection adviser. Return concise practical suggestions and label uncertainty.' }, { role: 'user', content: `Give advisory, non-authoritative collection guidance using only this exact JSON summary; do not infer ownership beyond it and do not claim the user owns every card:\n${JSON.stringify(payload)}` }] };
}
export function PrivateCollectionAnalysis({ setName, prints = [], collection }: Props) {
  const [apiKey, setApiKey] = useState(''); const [consent, setConsent] = useState(false); const [busy, setBusy] = useState(false); const [answer, setAnswer] = useState<string | null>(null); const [error, setError] = useState<string | null>(null);
  const preview = useMemo(() => analysisPreview(setName, prints, collection), [setName, prints, collection]);
  const requestBody = useMemo(() => createAnalysisRequestBody(preview), [preview]);
  const inventoryFingerprint = JSON.stringify(preview);
  useEffect(() => { setConsent(false); setAnswer(null); }, [inventoryFingerprint]);
  useEffect(() => () => { /* API keys are cleared at dispatch, not by a state update during cleanup. */ }, []);
  async function analyze() {
    if (!apiKey || !consent) return;
    const key = apiKey; setApiKey(''); setConsent(false); setBusy(true); setError(null); setAnswer(null);
    try { const response = await fetch(GROQ_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` }, body: JSON.stringify(requestBody) }); if (!response.ok) throw new Error('request failed'); const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> }; const content = payload.choices?.[0]?.message?.content; if (!content) throw new Error('empty response'); setAnswer(content); } catch { setError('The private analysis could not be completed. Check the key or try again later.'); } finally { setBusy(false); }
  }
  return <section className="mt-8 border-2 border-border bg-card p-4 sm:p-6" aria-labelledby="private-analysis-heading"><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Optional private analysis</p><h2 id="private-analysis-heading" className="mt-1 text-xl font-bold">Ask Groq for collection suggestions</h2><p className="mt-2 text-sm text-muted-foreground">Nothing is sent automatically. Your BYOK key is held in React memory only and cleared immediately when dispatch begins. The advisory response is not saved.</p><label className="mt-4 block text-sm font-semibold">Groq API key (memory only)<input type="password" autoComplete="off" value={apiKey} onChange={e => setApiKey(e.target.value)} className="mt-1 block w-full border border-border bg-background px-3 py-2" placeholder="gsk_…" /></label><div className="mt-4 border border-border bg-background p-3 text-xs leading-relaxed"><strong>Exact request body (API key omitted)</strong><p className="mt-1">Endpoint: <code>{GROQ_ENDPOINT}</code><br />Model: <code>{DEFAULT_MODEL}</code></p><details className="mt-2"><summary className="cursor-pointer font-semibold">Show exact JSON request body</summary><pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap break-words">{JSON.stringify(requestBody, null, 2)}</pre></details><p className="mt-2">Duplicate names/counts sent: {preview.duplicateSummary.map(row => `${row.name} (${row.copies})`).join(', ') || 'none'}{preview.duplicateSummaryCapped ? `; ${preview.duplicatePrintCount - DUPLICATE_CAP} additional duplicate(s) omitted` : ''}</p></div><label className="mt-3 flex gap-2 text-sm"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} /> I consent to this specific one-time request to the official Groq endpoint with exactly the JSON previewed above.</label><button type="button" disabled={!apiKey || !consent || busy} onClick={() => void analyze()} className="mt-4 border border-primary bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50">{busy ? 'Requesting…' : 'Send one analysis request'}</button>{error && <p className="mt-3 text-sm text-destructive" role="alert">{error}</p>}{answer && <div className="mt-4 border-l-4 border-primary bg-background p-4 text-sm leading-relaxed"><p className="mb-2 text-xs font-bold uppercase tracking-wider text-primary">AI advisory · not saved</p><p className="whitespace-pre-wrap">{answer}</p></div>}</section>;
}
export { DEFAULT_MODEL, GROQ_ENDPOINT, DUPLICATE_CAP };
