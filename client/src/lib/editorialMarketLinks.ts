export function editorialCardUrl(name: string) { return `https://scryfall.com/search?q=${encodeURIComponent(`!"${name}"`)}&unique=prints`; }
export function editorialSetUrl(setName: string) { return `https://scryfall.com/search?q=${encodeURIComponent(`set:"${setName}"`)}&unique=prints`; }
