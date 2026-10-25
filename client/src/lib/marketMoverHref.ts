export function moverSlug(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function marketMoverArticleHref(name: string) {
  return `/market-mover/${moverSlug(name)}`;
}
