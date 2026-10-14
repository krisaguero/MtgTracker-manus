import { describe, expect, it } from 'vitest';
import { loadUmamiAnalytics } from './analytics';

function createDocumentStub() {
  const created: Array<{ defer: boolean; src: string; dataset: Record<string, string> }> = [];
  const appended: Array<{ defer: boolean; src: string; dataset: Record<string, string> }> = [];
  let existingScript: Element | null = null;

  const documentRef = {
    querySelector: () => existingScript,
    createElement: () => {
      const script = { defer: false, src: '', dataset: {} as Record<string, string> };
      created.push(script);
      return script;
    },
    head: {
      appendChild: (script: unknown) => {
        appended.push(script as (typeof appended)[number]);
        return script;
      },
    },
  } as unknown as Document;

  return {
    documentRef,
    created,
    appended,
    setExistingScript: (script: Element | null) => { existingScript = script; },
  };
}

describe('optional Umami analytics', () => {
  it('does not inject a script unless endpoint and website ID are configured', () => {
    const stub = createDocumentStub();

    expect(loadUmamiAnalytics(undefined, 'site-id', stub.documentRef)).toBe(false);
    expect(loadUmamiAnalytics('https://analytics.example', undefined, stub.documentRef)).toBe(false);
    expect(stub.created).toHaveLength(0);
    expect(stub.appended).toHaveLength(0);
  });

  it('injects one deferred script for a valid endpoint and website ID', () => {
    const stub = createDocumentStub();

    expect(loadUmamiAnalytics(' https://analytics.example/ ', ' site-id ', stub.documentRef)).toBe(true);
    expect(stub.created).toHaveLength(1);
    expect(stub.appended).toEqual(stub.created);
    expect(stub.created[0]).toMatchObject({
      defer: true,
      src: 'https://analytics.example/umami',
      dataset: { umamiAnalytics: 'true', websiteId: 'site-id' },
    });
  });

  it('does not inject duplicate scripts or unsafe protocols', () => {
    const stub = createDocumentStub();
    stub.setExistingScript({} as Element);
    expect(loadUmamiAnalytics('https://analytics.example', 'site-id', stub.documentRef)).toBe(false);
    stub.setExistingScript(null);
    expect(loadUmamiAnalytics('javascript:alert(1)', 'site-id', stub.documentRef)).toBe(false);
    expect(stub.created).toHaveLength(0);
  });
});
