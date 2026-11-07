const DEFAULT_IMAGE_REQUEST_INTERVAL_MS = 250;

export function createMarketMoverImageQueue(
  intervalMs = DEFAULT_IMAGE_REQUEST_INTERVAL_MS
) {
  let nextRequestAt = 0;

  return function waitForImageRequestSlot(): Promise<void> {
    const now = Date.now();
    const scheduledAt = Math.max(now, nextRequestAt);
    nextRequestAt = scheduledAt + intervalMs;
    const delay = Math.max(0, scheduledAt - now);

    return new Promise(resolve => setTimeout(resolve, delay));
  };
}

export const waitForMarketMoverImageSlot = createMarketMoverImageQueue();
