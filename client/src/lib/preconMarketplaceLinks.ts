export type PreconMarketplace = 'amazon' | 'tcgplayer' | 'cardkingdom' | 'ebay';

export interface PreconMarketplaceLink {
  marketplace: PreconMarketplace;
  label: string;
  href: string;
  isAffiliate: boolean;
  disclosure?: string;
}

function configuredAmazonTag() {
  return (import.meta.env.VITE_AMAZON_ASSOCIATE_TAG as string | undefined)?.trim() || '';
}

function encodeProduct(name: string) {
  return encodeURIComponent(`Magic The Gathering ${name} Commander deck`);
}

export function preconIsPreorder(releaseDate?: string | null) {
  if (!releaseDate) return false;
  const parsed = new Date(`${releaseDate}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.getTime() > Date.now();
}

export function preconMarketplaceLinks(name: string, releaseDate?: string | null): PreconMarketplaceLink[] {
  const query = encodeProduct(name);
  const amazonTag = configuredAmazonTag();
  const amazon = new URL(`https://www.amazon.com/s?k=${query}`);
  if (amazonTag) amazon.searchParams.set('tag', amazonTag);
  const preorder = preconIsPreorder(releaseDate);
  return [
    {
      marketplace: 'amazon',
      label: preorder ? 'Amazon preorder' : 'Amazon',
      href: amazon.toString(),
      isAffiliate: Boolean(amazonTag),
      disclosure: amazonTag ? 'Affiliate link' : 'Add VITE_AMAZON_ASSOCIATE_TAG to enable affiliate attribution',
    },
    { marketplace: 'tcgplayer', label: preorder ? 'TCGplayer preorder search' : 'TCGplayer market', href: `https://www.tcgplayer.com/search/magic/product?productLineName=magic&q=${query}`, isAffiliate: false },
    { marketplace: 'cardkingdom', label: 'Card Kingdom', href: `https://www.cardkingdom.com/catalog/search?search=header&filter%5Bname%5D=${query}`, isAffiliate: false },
    { marketplace: 'ebay', label: 'eBay sold/search', href: `https://www.ebay.com/sch/i.html?_nkw=${query}`, isAffiliate: false },
  ];
}
