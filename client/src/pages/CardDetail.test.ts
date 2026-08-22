import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('CardDetail primary artwork layout', () => {
  it('keeps the artwork column self-aligned instead of centering it in the full grid row', () => {
    const source = readFileSync(resolve(process.cwd(), 'client/src/pages/CardDetail.tsx'), 'utf8');

    expect(source).toContain('self-start border-2 p-6 flex flex-col items-center justify-center');
    expect(source).toContain('fetchPriority="high"');
    expect(source).toContain('decoding="async"');
    expect(source).toContain('card.image_uris?.png || card.image_uris?.large');
    expect(source).toContain('className="block h-full w-full object-contain"');
    expect(source).not.toContain('min-h-[500px] w-full object-contain');
  });
});
