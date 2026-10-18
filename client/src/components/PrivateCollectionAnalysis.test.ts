import { describe, expect, it } from 'vitest';
import { analysisPreview, createAnalysisRequestBody, DEFAULT_MODEL, DUPLICATE_CAP, GROQ_ENDPOINT } from './PrivateCollectionAnalysis';

describe('private collection analysis safety', () => {
  it('uses official endpoint/model and sends duplicate names and counts in exact body', () => {
    expect(GROQ_ENDPOINT).toBe('https://api.groq.com/openai/v1/chat/completions');
    expect(DEFAULT_MODEL).toBe('llama-3.3-70b-versatile');
    expect(DUPLICATE_CAP).toBe(20);
    const preview = analysisPreview('Scanned library', [], [{ name: 'Alpha', quantity: 3 }, { name: 'Proxy', quantity: 9, proxy: true }]);
    const body = createAnalysisRequestBody(preview);
    expect(body.model).toBe(DEFAULT_MODEL);
    expect(body.messages[1].content).toContain('Alpha');
    expect(body.messages[1].content).toContain('"copies":3');
    expect(body.messages[1].content).not.toContain('Proxy');
  });
  it('caps duplicate payload while preserving exact total', () => {
    const cards = Array.from({ length: DUPLICATE_CAP + 2 }, (_, i) => ({ name: `Card ${i}`, quantity: 2 }));
    const preview = analysisPreview('Set', [], cards);
    expect(preview.duplicatePrintCount).toBe(DUPLICATE_CAP + 2);
    expect(preview.duplicateSummary).toHaveLength(DUPLICATE_CAP);
    expect(preview.duplicateSummaryCapped).toBe(true);
  });
});
