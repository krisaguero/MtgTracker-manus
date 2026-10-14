export function loadUmamiAnalytics(endpoint: string | undefined, websiteId: string | undefined, documentRef: Document): boolean {
  const normalizedEndpoint = endpoint?.trim().replace(/\/+$/, '');
  const normalizedWebsiteId = websiteId?.trim();
  if (!normalizedEndpoint || !normalizedWebsiteId) return false;

  try {
    const parsedEndpoint = new URL(normalizedEndpoint);
    if (parsedEndpoint.protocol !== 'https:' && parsedEndpoint.protocol !== 'http:') return false;
  } catch {
    return false;
  }

  if (documentRef.querySelector('script[data-umami-analytics]')) return false;

  const script = documentRef.createElement('script');
  script.defer = true;
  script.src = `${normalizedEndpoint}/umami`;
  script.dataset.umamiAnalytics = 'true';
  script.dataset.websiteId = normalizedWebsiteId;
  documentRef.head.appendChild(script);
  return true;
}
