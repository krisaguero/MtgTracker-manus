import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { commanderDecklistsData } from '@/data/commanderDecklistsData';
import { commanderProductCodesForParent, localDecksForParentSet, type ScryfallSet } from './useScryfallSets';

const sets: ScryfallSet[] = [
  { id: 'parent', code: 'eoe', name: 'Edge of Eternities', released_at: '2025-08-01', set_type: 'expansion', card_count: 281 },
  { id: 'child', code: 'eoc', name: 'Edge of Eternities Commander', released_at: '2025-08-01', parent_set_code: 'eoe', set_type: 'commander', card_count: 450 },
  { id: 'second-parent', code: 'dsk', name: 'Duskmourn: House of Horror', released_at: '2024-09-27', set_type: 'expansion', card_count: 271 },
  { id: 'second-child', code: 'dsc', name: 'Duskmourn Commander', released_at: '2024-09-27', parent_set_code: 'dsk', set_type: 'commander', card_count: 450 },
];

describe('Commander product parent-set indexing', () => {
  it('includes the parent set and its Commander child product code', () => {
    expect(commanderProductCodesForParent('EOE', sets)).toEqual(['eoe', 'eoc']);
  });

  it('attaches a local Commander decklist to the relevant parent expansion', () => {
    const decks = localDecksForParentSet('eoe', sets, commanderDecklistsData);

    expect(decks.some((deck) => deck.set_code === 'eoc' && deck.name === 'World Shaper')).toBe(true);
  });

  it('returns every child Commander product code for an unresolved parent-set fallback query', () => {
    expect(commanderProductCodesForParent('dsk', sets)).toEqual(['dsk', 'dsc']);
  });

  it('ends the initial loading state when Scryfall times out', () => {
    const source = readFileSync(resolve(process.cwd(), 'client/src/hooks/useScryfallSets.ts'), 'utf8');
    expect(source).toContain('The Scryfall set catalog took too long to respond. Please retry.');
    expect(source).toContain('setLoading(false);');
  });

  it('enriches unresolved sets through a bounded worker pool', () => {
    const source = readFileSync(resolve(process.cwd(), 'client/src/hooks/useScryfallSets.ts'), 'utf8');
    expect(source).toContain('const enrichNextSet = async () =>');
    expect(source).toContain('Math.min(4, unresolvedSets.length)');
    expect(source).toContain('publishPrecons(preconMap)');
  });

  it('marks live product counts provisional until all enrichment workers settle', () => {
    const source = readFileSync(resolve(process.cwd(), 'client/src/hooks/useScryfallSets.ts'), 'utf8');
    const startIndex = source.indexOf('setEnrichingPrecons(true);');
    const workerIndex = source.indexOf('await Promise.all(Array.from({ length: Math.min(4, unresolvedSets.length) }');
    const completeIndex = source.indexOf('setEnrichingPrecons(false);', workerIndex);

    expect(startIndex).toBeGreaterThan(-1);
    expect(workerIndex).toBeGreaterThan(startIndex);
    expect(completeIndex).toBeGreaterThan(workerIndex);
    expect(source).toContain('enrichingPrecons, error');
  });

  it('loads the multi-megabyte local decklist archive only through the explicit loader', () => {
    const source = readFileSync(resolve(process.cwd(), 'client/src/hooks/useScryfallSets.ts'), 'utf8');
    const loaderIndex = source.indexOf('const loadLocalDecklists = useCallback(async () => {');
    const importIndex = source.indexOf("await import('@/data/commanderDecklistsData')");
    const setFetchIndex = source.indexOf('async function loadSets()');
    const loaderEndIndex = source.indexOf('}, []);', loaderIndex);
    const setFetchEndIndex = source.indexOf('loadSets();', setFetchIndex);

    expect(importIndex).toBeGreaterThan(loaderIndex);
    expect(importIndex).toBeLessThan(loaderEndIndex);
    expect(source.slice(setFetchIndex, setFetchEndIndex)).not.toContain("await import('@/data/commanderDecklistsData')");
  });
});
