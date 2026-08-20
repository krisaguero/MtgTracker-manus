import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('DeckCompletionCard completion guidance', () => {
  it('retains ownership percentage, missing-card cost, tooltip, and basic-land controls', () => {
    const source = readFileSync(resolve(process.cwd(), 'client/src/components/DeckCompletionCard.tsx'), 'utf8');

    expect(source).toContain('% Deck Owned');
    expect(source).toContain('Cards Missing');
    expect(source).toContain('Est. to Complete');
    expect(source).toContain('Missing card price detail');
    expect(source).toContain('Exclude basic lands');
  });
});
