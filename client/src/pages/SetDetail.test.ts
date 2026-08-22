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
});
