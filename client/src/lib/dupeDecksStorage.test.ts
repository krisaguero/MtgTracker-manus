import { afterAll, afterEach, describe, expect, it } from 'vitest';
import { clearSavedInventories, loadSavedThemes, loadSideboard, replaceSavedInventories, saveDuelTheme, saveSideboard, type DuelInventories } from './dupeDecksStorage';

const previousStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
const values = new Map<string, string>();
const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); }, removeItem: (key: string) => { values.delete(key); } } as Storage;
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage });
Object.defineProperty(globalThis, 'window', { configurable: true, value: { localStorage: storage } });

afterEach(() => values.clear());

describe('local 60-card theme and sideboard storage', () => {
  it('persists saved theme presets and separate player sideboards', () => {
    saveSideboard('a', '2 Negate');
    const savedThemes = saveDuelTheme({ id: 'test-theme', name: 'Marchesa Control', themeId: 'control', slot: 'a', savedAt: 1760000000000 });
    expect(loadSideboard('a')).toBe('2 Negate');
    expect(savedThemes).toHaveLength(1);
    expect(loadSavedThemes()[0]?.name).toBe('Marchesa Control');
  });

  it('restores and clears theme presets with both deck inventories', () => {
    const inventory: DuelInventories = { a: '4 Sol Ring', b: '4 Island', sideboardA: '2 Negate', sideboardB: '1 Disenchant', savedThemes: [{ id: 'theme-restore', name: 'Marchesa', themeId: 'control', slot: 'a', savedAt: 1760000000000 }] };
    replaceSavedInventories(inventory);
    expect(loadSideboard('b')).toBe('1 Disenchant');
    expect(loadSavedThemes()[0]?.id).toBe('theme-restore');
    clearSavedInventories();
    expect(loadSideboard('a')).toBe('');
    expect(loadSavedThemes()).toEqual([]);
  });
});

afterAll(() => {
  if (previousStorage) Object.defineProperty(globalThis, 'localStorage', previousStorage);
  else Reflect.deleteProperty(globalThis, 'localStorage');
  if (previousWindow) Object.defineProperty(globalThis, 'window', previousWindow);
  else Reflect.deleteProperty(globalThis, 'window');
});
