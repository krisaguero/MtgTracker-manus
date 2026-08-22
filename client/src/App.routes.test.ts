import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('application route map', () => {
  it('registers Dupe-Decks before the dynamic set-code route', () => {
    const source = readFileSync(resolve(process.cwd(), 'client/src/App.tsx'), 'utf8');
    const dupeDecksIndex = source.indexOf('path="/dupe-decks"');
    const dynamicSetIndex = source.indexOf('path={"/:setCode"}');
    expect(dupeDecksIndex).toBeGreaterThan(-1);
    expect(dynamicSetIndex).toBeGreaterThan(-1);
    expect(dupeDecksIndex).toBeLessThan(dynamicSetIndex);
  });
});
