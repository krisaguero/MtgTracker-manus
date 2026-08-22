import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Collection page resilience', () => {
  it('exposes an explicit hydration skeleton before local collection modules mount', () => {
    const source = readFileSync(resolve(process.cwd(), 'client/src/pages/Collection.tsx'), 'utf8');
    expect(source).toContain("import { CollectionWorkspaceSkeleton } from '@/components/PageSkeletons';");
    expect(source).toContain('const [isHydrating, setIsHydrating] = useState(true);');
    expect(readFileSync(resolve(process.cwd(), 'client/src/components/PageSkeletons.tsx'), 'utf8')).toContain('Loading private collection workspace');
  });

  it('keeps collection imagery behind resilient child components', () => {
    const source = readFileSync(resolve(process.cwd(), 'client/src/pages/Collection.tsx'), 'utf8');
    expect(source).toContain('<CommanderPassport />');
    expect(readFileSync(resolve(process.cwd(), 'client/src/components/CommanderPassport.tsx'), 'utf8')).toContain('<CardImageZoom');
  });
});
