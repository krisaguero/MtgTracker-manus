import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('local-first collection privacy', () => {
  it('does not send collection import fingerprints or counts from the browser', () => {
    const modal = readFileSync(resolve(process.cwd(), 'client/src/components/ManaBoxImportModal.tsx'), 'utf8');
    const router = readFileSync(resolve(process.cwd(), 'server/routers.ts'), 'utf8');
    expect(modal).not.toContain('sourceHash');
    expect(modal).not.toContain('recordImport');
    expect(router).not.toContain('recordImport:');
    expect(modal).toContain('saved to this browser only');
  });

  it('does not persist the signed-in profile in browser localStorage', () => {
    const hook = readFileSync(resolve(process.cwd(), 'client/src/_core/hooks/useAuth.ts'), 'utf8');
    expect(hook).not.toContain('localStorage.setItem');
    expect(hook).toContain('localStorage.removeItem("manus-runtime-user-info")');
  });

  it('does not load optional analytics before consent is present', () => {
    const startup = readFileSync(resolve(process.cwd(), 'client/src/main.tsx'), 'utf8');
    expect(startup).toContain('if (isAnalyticsOptedIn())');
  });
});
