import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  formatSelectedProxyPrintList,
  loadProxyPrintSupportEnabled,
  proxyPrintQuantity,
  PROXY_PRINT_SUPPORT_STORAGE_KEY,
  saveProxyPrintSupportEnabled,
} from '@/lib/proxyPrint';
import type { BattleBoxPullItem } from '@/lib/retroBattleBox';

const item = (overrides: Partial<BattleBoxPullItem> = {}): BattleBoxPullItem => ({
  name: 'Lightning Bolt', quantity: 4, owned: 1, proxyOwned: 1, shortage: 3, proxyPrintGap: 2, proxyMarked: 2, matchedPrintings: [], usedBy: ['Lightning Burn'], ...overrides,
});

afterEach(() => vi.unstubAllGlobals());

describe('Battle Box proxy-print support', () => {
  it('defaults to disabled when the preference is absent or unavailable', () => {
    expect(loadProxyPrintSupportEnabled()).toBe(false);
    vi.stubGlobal('window', { localStorage: { getItem: () => null } });
    expect(loadProxyPrintSupportEnabled()).toBe(false);
    vi.stubGlobal('window', { localStorage: { getItem: () => { throw new Error('storage blocked'); } } });
    expect(loadProxyPrintSupportEnabled()).toBe(false);
  });

  it('stores an explicit enabled or disabled preference only in local browser storage', () => {
    const values = new Map<string, string>();
    const localStorage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => { values.set(key, value); },
    };
    vi.stubGlobal('window', { localStorage });
    expect(saveProxyPrintSupportEnabled(true)).toBe(true);
    expect(values.get(PROXY_PRINT_SUPPORT_STORAGE_KEY)).toBe('enabled');
    expect(loadProxyPrintSupportEnabled()).toBe(true);
    expect(saveProxyPrintSupportEnabled(false)).toBe(true);
    expect(loadProxyPrintSupportEnabled()).toBe(false);
  });

  it('uses source proxy annotations without inventory and the net print gap with inventory', () => {
    expect(proxyPrintQuantity(item(), false)).toBe(2);
    expect(proxyPrintQuantity(item(), true)).toBe(2);
    expect(proxyPrintQuantity(item({ proxyMarked: 3, proxyPrintGap: 0 }), true)).toBe(0);
    expect(proxyPrintQuantity(item({ proxyMarked: 3, proxyPrintGap: 0 }), false)).toBe(3);
  });

  it('formats only explicitly selected missing candidates without inventory metadata', () => {
    const selected = new Set(['Lightning Bolt']);
    const list = formatSelectedProxyPrintList([
      item({ name: 'Lightning Bolt', proxyPrintGap: 2, proxyMarked: 4 }),
      item({ name: 'Counterspell', proxyMarked: 3, proxyPrintGap: 3 }),
    ], selected, false);
    expect(list).toBe('4 Lightning Bolt');
    expect(list).not.toContain('Counterspell');
    expect(list).not.toContain('Lightning Burn');
    expect(formatSelectedProxyPrintList([item({ proxyPrintGap: 0 })], new Set(['Lightning Bolt']), true)).toBe('');
  });
});
