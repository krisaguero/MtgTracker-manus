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
    expect(page).toContain('75a8455');
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

  it('records the separate Battle Box and Brawlternatives status while keeping shared submissions as future work', () => {
    const page = read('client/src/pages/Roadmap.tsx');
    expect(page).toContain('Retro 9-deck non-Commander Battle Box');
    expect(page).toContain('Brawlternatives prototype: precon-themed');
    expect(page).toContain('Shared Battle Box review & publishing backend');
    expect(page).toContain('Expand Brawlternatives');
    expect(page).toContain('not official Magic Brawl');
    expect(page).toContain('remixes must preserve the original author’s credit');
    expect(page).toContain('Supabase settings and schema are unchanged');
    expect(page).toContain('does not publish');
  });
});
