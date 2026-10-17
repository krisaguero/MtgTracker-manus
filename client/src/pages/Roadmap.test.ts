import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('product roadmap page', () => {
  it('is registered as a route and linked from shared navigation', () => {
    expect(read('client/src/App.tsx')).toContain("<Route path={'/roadmap'} component={Roadmap} />");
    expect(read('client/src/components/InternalPageNav.tsx')).toContain("href: '/roadmap', label: 'Product roadmap'");
  });

  it('separates shipped features, the privacy boundary, staging, and planned work', () => {
    const page = read('client/src/pages/Roadmap.tsx');
    expect(page).toContain('Live in production');
    expect(page).toContain('Production privacy boundary');
    expect(page).toContain('Staging only · synthetic data');
    expect(page).toContain('Not implemented · proposals');
    expect(page).toContain('__PRODUCTION_GIT_COMMIT_SHA__');
    expect(page).not.toContain('75a8455');
    expect(page).toContain('All 38 isolation checks passed');
    expect(page).toContain('does not change user data, backup behavior');
    expect(page).toContain('order/proxy queues');
    expect(page).toContain('BYOK keys');
    expect(page).toContain('import fingerprint/count');
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
    expect(page).toContain('non-Commander 9-deck Battle Box');
    expect(page).toContain('Brawlternatives are separate');
    expect(page).toContain('Shared Battle Box review & publishing backend');
    expect(page).toContain('Expand Brawlternatives');
    expect(page).toContain('not official Magic Brawl');
    expect(page).toContain('remixes must preserve the original author’s credit');
    expect(page).toContain('Supabase settings and schema are unchanged');
    expect(page).toContain('does not publish');
  });
});
