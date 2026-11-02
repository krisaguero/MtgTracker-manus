export type PurchasePriceLookup = {
  identity: string;
  name: string;
};

export type PurchasePriceResult = PurchasePriceLookup & {
  usd: number | null;
  source: 'Scryfall named price' | 'unavailable';
  checkedAt: string;
};

function numericPrice(value: unknown): number | null {
  const price = Number(value);
  return Number.isFinite(price) && price > 0 ? price : null;
}

export async function fetchPurchasePrice(name: string, signal?: AbortSignal): Promise<number | null> {
  try {
    const response = await fetch(`https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}`, {
      headers: { Accept: 'application/json' },
      signal,
    });
    if (!response.ok) return null;
    const card = (await response.json()) as { prices?: { usd?: string | null } };
    return numericPrice(card.prices?.usd);
  } catch {
    return null;
  }
}

export async function fetchPurchasePrices(lookups: PurchasePriceLookup[], signal?: AbortSignal): Promise<PurchasePriceResult[]> {
  const checkedAt = new Date().toISOString();
  return Promise.all(lookups.map(async lookup => {
    const usd = await fetchPurchasePrice(lookup.name, signal);
    return { ...lookup, usd, source: usd === null ? 'unavailable' as const : 'Scryfall named price' as const, checkedAt };
  }));
}
