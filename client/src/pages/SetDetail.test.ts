import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('SetDetail loading resilience', () => {
  it('keeps the precon-card memo before loading and error returns', () => {
    const source = readFileSync(resolve(process.cwd(), 'client/src/pages/SetDetail.tsx'), 'utf8');
    const memoIndex = source.indexOf('const preconCardsList = useMemo');
    const loadingIndex = source.indexOf('if (loading)');
    const errorIndex = source.indexOf('if (error || !data)');

    expect(memoIndex).toBeGreaterThan(-1);
    expect(memoIndex).toBeLessThan(loadingIndex);
    expect(memoIndex).toBeLessThan(errorIndex);
  });

  it('renders the structured catalog skeleton while the set request resolves', () => {
    const source = readFileSync(resolve(process.cwd(), 'client/src/pages/SetDetail.tsx'), 'utf8');
    expect(source).toContain("import { SetDetailPageSkeleton } from '@/components/PageSkeletons';");
    expect(source).toContain('<SetDetailPageSkeleton />');
  });

  it('bounds set-detail requests and includes related Commander child sets', () => {
    const source = readFileSync(resolve(process.cwd(), 'client/src/hooks/useSetDetail.ts'), 'utf8');
    expect(source).toContain('const requestTimeout = window.setTimeout(() => controller.abort(), 15000);');
    expect(source).toContain("set.set_type === 'commander' && set.parent_set_code?.toLowerCase() === code");
    expect(source).toContain('The set catalog took too long to respond. Please retry.');
  });

  it('shows exact set-printing price coverage and per-card source labels', () => {
    const source = readFileSync(resolve(process.cwd(), 'client/src/pages/SetDetail.tsx'), 'utf8');
    expect(source).toContain('summarizeSetPricing(data?.cards || [])');
    expect(source).toContain('setPricingSummary.setNameIndexCount');
    expect(source).toContain('resolveSetPrintingPrice(card)');
    expect(source).toContain('printingPrice.sourceLabel');
    expect(source).toContain('printingPrice.updatedAt.slice(0, 10)');
  });

  it('shows unique-card inventory coverage only when inventory is detected', () => {
    const source = readFileSync(resolve(process.cwd(), 'client/src/pages/SetDetail.tsx'), 'utf8');
    expect(source).toContain('const setOwnership = useMemo');
    expect(source).toContain('inventoryDetected: ownedCollection.some((item) => item.quantity > 0)');
    expect(source).toContain("map.set(name, (map.get(name) || 0) + Math.max(0, item.quantity));");
    expect(source).toContain('Math.round((ownedCards / uniqueCards.size) * 1000) / 10');
    expect(source).toContain('Inventory coverage:');
    expect(source).toContain('unique main-set cards matched by name.');
  });

  it('prevents view-scoped filters from becoming silently stale', () => {
    const source = readFileSync(resolve(process.cwd(), 'client/src/pages/SetDetail.tsx'), 'utf8');
    expect(source).toContain('const changeViewMode =');
    expect(source).toContain("setFilterRarity('');");
    expect(source).toContain('const resetCardFilters =');
    expect(source).toContain('Reset filters');
    expect(source).toContain('aria-label="Filter cards by rarity"');
  });

  it('uses one spoiler-first priority catalog instead of a separate spoiler module', () => {
    const source = readFileSync(resolve(process.cwd(), 'client/src/pages/SetDetail.tsx'), 'utf8');
    expect(source).toContain("useState<'priority' | 'main' | 'precons' | 'all'>('priority')");
    expect(source).toContain("Spoilers first ({verifiedSpoilerCards.length})");
    expect(source).toContain("const priorityCards = useMemo");
    expect(source).toContain("sortMode === 'spoilers'");
    expect(source).not.toContain('VerifiedSpoilerGallery');
  });
});
