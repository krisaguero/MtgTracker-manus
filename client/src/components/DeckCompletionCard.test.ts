import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('DeckCompletionCard completion guidance', () => {
  it('keeps sealed product ownership separate from scanned-card coverage', () => {
    const source = readFileSync(resolve(process.cwd(), 'client/src/components/DeckCompletionCard.tsx'), 'utf8');

    expect(source).toContain('100% Product Owned');
    expect(source).toContain('ManaBox card layer');
    expect(source).toContain('Not evidence of missing cards');
    expect(source).toContain('Cards Missing');
    expect(source).toContain('Est. to Complete');
    expect(source).toContain('Missing card price detail');
    expect(source).toContain('Exclude basic lands');
  });
});
