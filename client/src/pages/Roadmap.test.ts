import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('product roadmap page', () => {
  it('is registered as a route and linked from shared navigation', () => {
    expect(read('client/src/App.tsx')).toContain("<Route path={'/roadmap'} component={Roadmap} />");
    expect(read('client/src/components/InternalPageNav.tsx')).toContain("href: '/roadmap', label: 'Product roadmap'");
  });

  it('separates shipped, local-only, staging, and planned work', () => {
    const page = read('client/src/pages/Roadmap.tsx');
    expect(page).toContain('Live in production');
    expect(page).toContain('Implemented locally · not shipped');
    expect(page).toContain('Staging only · synthetic data');
    expect(page).toContain('Not implemented · proposals');
    expect(page).toContain('d456997');
    expect(page).toContain('All 38 isolation checks passed');
    expect(page).toContain('No production data has been moved');
  });

  it('explains CSV scale and proposes an opt-in aggregate community watchlist', () => {
    const page = read('client/src/pages/Roadmap.tsx');
    expect(page).toContain('IndexedDB locally');
    expect(page).toContain('browser-dependent quotas');
    expect(page).toContain('anonymous card-level watch signals');
    expect(page).toContain('not currently shared with other users');
  });
});
