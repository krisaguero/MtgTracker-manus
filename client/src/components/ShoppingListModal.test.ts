import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('ShoppingListModal', () => {
  it('retains retailer copies, CSV/text downloads, and basic-land export filtering', () => {
    const source = readFileSync(resolve(process.cwd(), 'client/src/components/ShoppingListModal.tsx'), 'utf8');

    expect(source).toContain('Copy for Card Kingdom Bulk Order');
    expect(source).toContain('Copy for TCGplayer Mass Entry');
    expect(source).toContain('Download CSV');
    expect(source).toContain('Download Text');
    expect(source).toContain('Exclude basic lands from list and exports');
  });
});
