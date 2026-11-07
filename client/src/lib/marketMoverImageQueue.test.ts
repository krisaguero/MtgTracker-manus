import { afterEach, describe, expect, it, vi } from "vitest";
import { createMarketMoverImageQueue } from "@/lib/marketMoverImageQueue";

describe("market mover image queue", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("spaces image request slots instead of starting them all at once", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(0));
    const waitForSlot = createMarketMoverImageQueue(250);
    let firstReady = false;
    let secondReady = false;

    const first = waitForSlot().then(() => {
      firstReady = true;
    });
    const second = waitForSlot().then(() => {
      secondReady = true;
    });

    await vi.advanceTimersByTimeAsync(0);
    expect(firstReady).toBe(true);
    expect(secondReady).toBe(false);

    await vi.advanceTimersByTimeAsync(249);
    expect(secondReady).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    await Promise.all([first, second]);
    expect(secondReady).toBe(true);
  });
});
