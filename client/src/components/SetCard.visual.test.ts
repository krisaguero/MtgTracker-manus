import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('primary set card imagery', () => {
  it('uses the provided set symbol without eager-loading additional artwork', () => {
    const source = readFileSync(resolve(process.cwd(), 'client/src/components/SetCard.tsx'), 'utf8');
    expect(source).toContain('src={set.icon_svg_uri}');
    expect(source).toContain('loading="lazy"');
    expect(source).toContain('decoding="async"');
  });

  it('keeps commander previews framed as portrait card images', () => {
    const source = readFileSync(resolve(process.cwd(), 'client/src/components/SetCard.tsx'), 'utf8');
    const frame = readFileSync(resolve(process.cwd(), 'client/src/components/CommanderCardFrame.tsx'), 'utf8');
    expect(source).toMatch(/import \{ CommanderCardFrame \} from ["']@\/components\/CommanderCardFrame["'];/);
    expect(source).toContain('<CommanderCardFrame');
    expect(frame).toContain('aspect-[63/88]');
    expect(source).toContain('w-36 shrink-0 sm:w-40 lg:w-44');
    expect(source).not.toContain('aspect-[4/3] w-20');
  });
});
